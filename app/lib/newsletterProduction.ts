import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import type { BlogPost } from "./blog";
import { getProductionNewsletterOrigin, isProductionNewsletterEnabled } from "./newsletterConfig";
import { renderArticleEmail, renderConfirmationEmail } from "./newsletterEmail";
import { NewsletterInputError } from "./newsletterLocal";
import { sendProductionNewsletterMail } from "./newsletterSmtp";

type Subscriber = { id: string; email: string; status: string; nonce: string; consent_at: string; confirmed_at: string | null; confirmation_expires_at: string; confirmation_sent_at: string | null };
type Delivery = { id: string; kind: "confirmation" | "article"; subscriber_id: string; article_id: string | null; nonce: string; subject: string; html: string; text: string; action_url: string; status: string; to: string };

function database() {
  if (!isProductionNewsletterEnabled() || !process.env.DATABASE_URL || !process.env.NEWSLETTER_SECRET) {
    throw new Error("La newsletter de production n’est pas configurée.");
  }
  return neon(process.env.DATABASE_URL);
}

async function query<T>(statement: string, parameters: unknown[] = []): Promise<T[]> {
  const rows = await database().query(statement, parameters);
  return rows.map((row) => Object.fromEntries(Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]))) as T[];
}

let schemaReady: Promise<void> | undefined;
export function ensureProductionNewsletterSchema() {
  return schemaReady ??= (async () => {
    const schema = await readFile(path.join(process.cwd(), "database/newsletter.sql"), "utf8");
    const sql = database();
    await sql.transaction(schema.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean).map((statement) => sql.query(statement)));
    // Existing publications are never mailed retrospectively. Future articles are recovered.
    await query(`INSERT INTO public.newsletter_publications (article_id)
      SELECT id FROM public.articles WHERE status IN ('scheduled', 'published') AND published_at > now()
      ON CONFLICT (article_id) DO NOTHING`);
  })().catch((error) => { schemaReady = undefined; throw error; });
}

function sign(subscriber: Subscriber, purpose: "confirm" | "unsubscribe") {
  const payload = Buffer.from(JSON.stringify({ id: subscriber.id, nonce: subscriber.nonce, purpose,
    expires: purpose === "confirm" ? Date.parse(subscriber.confirmation_expires_at) : undefined })).toString("base64url");
  return `${payload}.${createHmac("sha256", process.env.NEWSLETTER_SECRET!).update(`newsletter:${payload}`).digest("base64url")}`;
}

function decode(value: string, purpose: "confirm" | "unsubscribe") {
  try {
    database();
    if (value.length > 2048) throw new Error();
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) throw new Error();
    const expected = createHmac("sha256", process.env.NEWSLETTER_SECRET!).update(`newsletter:${payload}`).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!/^[a-f0-9-]{36}$/i.test(data.id) || !/^[a-f0-9-]{36}$/i.test(data.nonce) || data.purpose !== purpose ||
      (purpose === "confirm" && (!Number.isFinite(data.expires) || data.expires <= Date.now()))) throw new Error();
    return data as { id: string; nonce: string };
  } catch { throw new NewsletterInputError("Ce lien est invalide ou a expiré. Vous pouvez demander une nouvelle inscription."); }
}

function actionUrl(subscriber: Subscriber, purpose: "confirm" | "unsubscribe") {
  const action = purpose === "confirm" ? "confirmer" : "desinscription";
  return `${getProductionNewsletterOrigin()}/newsletter/${action}?token=${encodeURIComponent(sign(subscriber, purpose))}`;
}

async function queueMail(subscriber: Subscriber, kind: "confirmation" | "article", mail: { subject: string; html: string; text: string }, url: string, articleId: string | null = null) {
  const key = kind === "confirmation" ? `confirmation:${subscriber.id}:${subscriber.nonce}` : `article:${articleId}:${subscriber.id}`;
  await query(`INSERT INTO public.newsletter_deliveries (dedupe_key,subscriber_id,article_id,kind,nonce,subject,html,text,action_url)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (dedupe_key) DO NOTHING`,
  [key, subscriber.id, articleId, kind, subscriber.nonce, mail.subject, mail.html, mail.text, url]);
}

export async function subscribeToProductionNewsletter(email: unknown, consent: unknown) {
  if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new NewsletterInputError("Veuillez saisir une adresse e-mail valide.");
  }
  if (consent !== true) throw new NewsletterInputError("Veuillez accepter de recevoir les articles par e-mail.");
  await ensureProductionNewsletterSchema();
  const normalizedEmail = email.trim().toLowerCase();
  await query(`INSERT INTO public.newsletter_subscribers (email) VALUES ($1)
    ON CONFLICT (email) DO UPDATE SET status='pending', nonce=$2, consent_at=now(), confirmed_at=null,
      confirmation_expires_at=now()+interval '24 hours', confirmation_sent_at=null
    WHERE newsletter_subscribers.status='unsubscribed' OR
      (newsletter_subscribers.status='pending' AND newsletter_subscribers.confirmation_expires_at <= now())`, [normalizedEmail, randomUUID()]);
  const [subscriber] = await query<Subscriber>("SELECT * FROM public.newsletter_subscribers WHERE email=$1", [normalizedEmail]);
  if (subscriber.status !== "pending") return;
  const url = actionUrl(subscriber, "confirm");
  await queueMail(subscriber, "confirmation", renderConfirmationEmail(url), url);
  await sendNextProductionNewsletterMail(null, subscriber.id);
}

export async function allowProductionNewsletterSignup(address: string) {
  await ensureProductionNewsletterSchema();
  const window = Math.floor(Date.now() / 3600000);
  const bucket = createHmac("sha256", process.env.NEWSLETTER_SECRET!).update(`${window}:${address}`).digest("hex");
  await query("DELETE FROM public.newsletter_rate_limits WHERE expires_at < now()");
  const [limit] = await query<{ count: number }>(`INSERT INTO public.newsletter_rate_limits (bucket,expires_at)
    VALUES ($1,now()+interval '1 hour') ON CONFLICT (bucket) DO UPDATE SET count=newsletter_rate_limits.count+1 RETURNING count`, [bucket]);
  return limit.count <= 5;
}

export async function confirmProductionNewsletter(value: string) {
  const data = decode(value, "confirm");
  await ensureProductionNewsletterSchema();
  const rows = await query(`UPDATE public.newsletter_subscribers SET status='active', confirmed_at=coalesce(confirmed_at,now())
    WHERE id=$1 AND nonce=$2 AND status IN ('pending','active') AND confirmation_expires_at>now() RETURNING id`, [data.id, data.nonce]);
  if (!rows.length) throw new NewsletterInputError("Ce lien est invalide ou a expiré. Vous pouvez demander une nouvelle inscription.");
}

export async function unsubscribeProductionNewsletter(value: string) {
  const data = decode(value, "unsubscribe");
  await ensureProductionNewsletterSchema();
  const rows = await query("UPDATE public.newsletter_subscribers SET status='unsubscribed' WHERE id=$1 AND nonce=$2 RETURNING id", [data.id, data.nonce]);
  if (!rows.length) throw new NewsletterInputError("Ce lien est invalide. Vous pouvez utiliser le lien du dernier article reçu.");
  await query("UPDATE public.newsletter_deliveries SET status='cancelled' WHERE subscriber_id=$1 AND status IN ('queued','failed')", [data.id]);
}

export async function registerNewsletterPublication(articleId: string) {
  await ensureProductionNewsletterSchema();
  await query(`INSERT INTO public.newsletter_publications (article_id) SELECT id FROM public.articles
    WHERE id=$1 AND status IN ('scheduled','published') ON CONFLICT (article_id) DO NOTHING`, [articleId]);
}

export async function getProductionPublicationRun(articleId: string) {
  const [job] = await query<{ run_id: string | null; completed_at: string | null }>("SELECT run_id,completed_at FROM public.newsletter_publications WHERE article_id=$1", [articleId]);
  return job;
}

export async function recordProductionPublicationRun(articleId: string, runId: string) {
  await query("UPDATE public.newsletter_publications SET run_id=$2,started_at=now() WHERE article_id=$1", [articleId, runId]);
}

export async function prepareProductionPublication(articleId: string): Promise<{ stop?: boolean; waitUntil?: string }> {
  await ensureProductionNewsletterSchema();
  const [article] = await query<BlogPost>(`SELECT a.* FROM public.articles a JOIN public.newsletter_publications p ON p.article_id=a.id
    WHERE a.id=$1 AND p.completed_at IS NULL`, [articleId]);
  if (!article || article.status === "draft") return { stop: true };
  const uncertain = await query("SELECT id FROM public.newsletter_deliveries WHERE article_id=$1 AND status='uncertain' LIMIT 1", [articleId]);
  if (uncertain.length) return { stop: true };
  if (article.published_at && Date.parse(article.published_at) > Date.now()) return { waitUntil: article.published_at };
  const subscribers = await query<Subscriber>(`SELECT * FROM public.newsletter_subscribers WHERE status='active' AND confirmed_at <= $1`, [article.published_at || article.created_at]);
  for (const subscriber of subscribers) {
    const url = actionUrl(subscriber, "unsubscribe");
    await queueMail(subscriber, "article", renderArticleEmail(article, getProductionNewsletterOrigin(), url), url, articleId);
  }
  return {};
}

export async function sendNextProductionNewsletterMail(articleId: string | null, subscriberId: string | null = null): Promise<boolean> {
  await query(`UPDATE public.newsletter_deliveries SET status='uncertain',error_code='SMTP_RESULT_UNCERTAIN'
    WHERE status='sending' AND locked_at < now()-interval '10 minutes'`);
  await query(`UPDATE public.newsletter_deliveries d SET status='cancelled' FROM public.newsletter_subscribers s
    WHERE s.id=d.subscriber_id AND d.status IN ('queued','failed') AND
      (s.nonce<>d.nonce OR (d.kind='article' AND s.status<>'active') OR
       (d.kind='confirmation' AND (s.status<>'pending' OR s.confirmation_expires_at<=now())))`);
  const [mail] = await query<Delivery>(`UPDATE public.newsletter_deliveries d SET status='sending', locked_at=now(), attempts=attempts+1
    WHERE d.id=(SELECT m.id FROM public.newsletter_deliveries m JOIN public.newsletter_subscribers s ON s.id=m.subscriber_id
      LEFT JOIN public.articles a ON a.id=m.article_id WHERE m.status IN ('queued','failed') AND m.available_at<=now()
      AND m.nonce=s.nonce AND (($1::uuid IS NULL AND m.kind='confirmation' AND s.status='pending' AND s.confirmation_expires_at>now())
        OR (m.article_id=$1 AND m.kind='article' AND s.status='active' AND a.status IN ('scheduled','published') AND (a.published_at IS NULL OR a.published_at<=now())))
      AND ($2::uuid IS NULL OR s.id=$2) ORDER BY m.created_at FOR UPDATE OF m SKIP LOCKED LIMIT 1)
    RETURNING d.*, (SELECT email FROM public.newsletter_subscribers WHERE id=d.subscriber_id) AS "to"`, [articleId, subscriberId]);
  if (!mail) return false;
  let messageId: string;
  try { messageId = await sendProductionNewsletterMail(mail); }
  catch (error) {
    const retryable = Boolean(error && typeof error === "object" && "retryable" in error && error.retryable);
    await query("UPDATE public.newsletter_deliveries SET status=$2, error_code=$3, available_at=now()+interval '2 minutes' WHERE id=$1", [mail.id, retryable ? "failed" : "uncertain", retryable ? "SMTP_UNAVAILABLE" : "SMTP_RESULT_UNCERTAIN"]);
    throw new Error("Le serveur de mail n’a pas confirmé l’envoi. Consultez les envois dans l’administration.");
  }
  // Once SMTP accepted the message, a database error must not cause another send.
  await query("UPDATE public.newsletter_deliveries SET status='sent', sent_at=now(), provider_message_id=$2, error_code=null WHERE id=$1", [mail.id, messageId]);
  if (mail.kind === "confirmation") await query("UPDATE public.newsletter_subscribers SET confirmation_sent_at=now() WHERE id=$1 AND nonce=$2", [mail.subscriber_id, mail.nonce]);
  return true;
}

export async function finishProductionPublication(articleId: string) {
  const [pending] = await query<{ count: number }>(`SELECT count(*)::int AS count FROM public.newsletter_deliveries
    WHERE article_id=$1 AND status IN ('queued','failed','sending','uncertain')`, [articleId]);
  if (pending.count) return false;
  await query("UPDATE public.newsletter_publications SET completed_at=now() WHERE article_id=$1", [articleId]);
  return true;
}

export async function getProductionNewsletterSnapshot() {
  await ensureProductionNewsletterSchema();
  const subscribers = await query<{ id: string; email: string; status: "pending" | "active" | "unsubscribed"; consent_at: string; confirmed_at: string | null }>("SELECT id,email,status,consent_at,confirmed_at FROM public.newsletter_subscribers ORDER BY created_at DESC");
  const messages = await query<Delivery & { created_at: string }>(`SELECT d.id,d.kind,s.email AS "to",d.subject,d.html,d.text,d.created_at,d.action_url,d.status
    FROM public.newsletter_deliveries d JOIN public.newsletter_subscribers s ON s.id=d.subscriber_id ORDER BY d.created_at DESC LIMIT 100`);
  return { subscribers, messages, checked_at: new Date().toISOString() };
}

export async function getPendingProductionPublications() {
  await ensureProductionNewsletterSchema();
  return query<{ article_id: string }>(`SELECT p.article_id FROM public.newsletter_publications p JOIN public.articles a ON a.id=p.article_id
    WHERE p.completed_at IS NULL AND a.status IN ('scheduled','published')
      AND NOT EXISTS (SELECT 1 FROM public.newsletter_deliveries d WHERE d.article_id=p.article_id AND d.status='uncertain')
    ORDER BY p.requested_at LIMIT 100`);
}
