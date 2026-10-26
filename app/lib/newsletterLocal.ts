import "server-only";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, open, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import type { BlogPost } from "@/app/lib/blog";
import { isLocalNewsletterEnabled, isLocalNewsletterOrigin } from "@/app/lib/newsletterConfig";
import { renderArticleEmail, renderConfirmationEmail } from "@/app/lib/newsletterEmail";

type Subscriber = {
  id: string;
  email: string;
  status: "pending" | "active" | "unsubscribed";
  consent_at: string;
  confirmed_at: string | null;
  nonce: string;
};

export type LocalNewsletterMessage = {
  id: string;
  kind: "confirmation" | "article";
  to: string;
  subject: string;
  html: string;
  text: string;
  created_at: string;
  action_url: string;
};

type NewsletterState = {
  version: 1;
  secret: string;
  origin: string;
  initialized: boolean;
  observed: Record<string, string>;
  subscribers: Subscriber[];
  messages: LocalNewsletterMessage[];
  deliveries: string[];
  checked_at: string | null;
};

export class NewsletterInputError extends Error {}

function assertLocalMode() {
  if (!isLocalNewsletterEnabled()) throw new Error("La newsletter locale est désactivée.");
}

function dataDirectory() {
  return process.env.NEWSLETTER_LOCAL_DATA_DIR || path.join(process.cwd(), ".local", "newsletter");
}

async function withState<T>(operation: (state: NewsletterState) => T | Promise<T>, save = true): Promise<T> {
  assertLocalMode();
  const directory = dataDirectory();
  await mkdir(directory, { recursive: true });
  const lockPath = path.join(directory, "state.lock");
  const started = Date.now();
  let lock;
  while (!lock) {
    try {
      lock = await open(lockPath, "wx");
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      const lockInfo = await stat(lockPath).catch(() => null);
      if (lockInfo && Date.now() - lockInfo.mtimeMs > 120000) await unlink(lockPath).catch(() => {});
      if (Date.now() - started > 10000) throw new Error("La boîte locale est occupée. Réessayez dans un instant.");
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
  }

  const file = path.join(directory, "state.json");
  let temporaryFile: string | undefined;
  try {
    let state: NewsletterState;
    try {
      state = JSON.parse(await readFile(file, "utf8"));
      if (state.version !== 1 || !state.secret || !Array.isArray(state.subscribers) || !Array.isArray(state.messages)) {
        throw new Error("Le fichier de la newsletter locale est invalide.");
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      state = { version: 1, secret: randomBytes(32).toString("hex"), origin: "http://localhost:3000", initialized: false, observed: {}, subscribers: [], messages: [], deliveries: [], checked_at: null };
    }
    const result = await operation(state);
    if (save) {
      temporaryFile = path.join(directory, `state-${randomUUID()}.tmp`);
      await writeFile(temporaryFile, JSON.stringify(state, null, 2), { mode: 0o600 });
      await rename(temporaryFile, file);
    }
    return result;
  } finally {
    if (temporaryFile) await unlink(temporaryFile).catch(() => {});
    await lock.close();
    await unlink(lockPath).catch(() => {});
  }
}

function token(state: NewsletterState, subscriber: Subscriber, purpose: "confirm" | "unsubscribe") {
  const payload = Buffer.from(JSON.stringify({ id: subscriber.id, purpose, nonce: purpose === "confirm" ? subscriber.nonce : undefined, expires: purpose === "confirm" ? Date.now() + 86400000 : undefined })).toString("base64url");
  return `${payload}.${createHmac("sha256", state.secret).update(payload).digest("base64url")}`;
}

function tokenSubscriber(state: NewsletterState, value: string, purpose: "confirm" | "unsubscribe") {
  try {
    if (value.length > 2048) throw new Error();
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) throw new Error();
    const expected = createHmac("sha256", state.secret).update(payload).digest();
    const actual = Buffer.from(signature, "base64url");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) throw new Error();
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    const subscriber = state.subscribers.find((item) => item.id === data.id);
    if (!subscriber || data.purpose !== purpose) throw new Error();
    if (purpose === "confirm" && (data.nonce !== subscriber.nonce || !Number.isFinite(data.expires) || data.expires <= Date.now())) throw new Error();
    return subscriber;
  } catch {
    throw new NewsletterInputError("Ce lien est invalide ou a expiré. Vous pouvez demander une nouvelle inscription.");
  }
}

export async function subscribeToLocalNewsletter(email: unknown, consent: unknown, origin: string) {
  if (typeof email !== "string" || email.trim().length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    throw new NewsletterInputError("Veuillez saisir une adresse e-mail valide.");
  }
  if (consent !== true) throw new NewsletterInputError("Veuillez accepter de recevoir les articles par e-mail.");
  if (!isLocalNewsletterOrigin(origin)) throw new NewsletterInputError("Cette version de la newsletter fonctionne uniquement en local.");
  const normalizedEmail = email.trim().toLowerCase();
  await withState((state) => {
    state.origin = origin;
    let subscriber = state.subscribers.find((item) => item.email === normalizedEmail);
    if (subscriber?.status === "active") return;
    if (subscriber?.status === "pending" && Date.now() - Date.parse(subscriber.consent_at) < 86400000) return;
    const now = new Date().toISOString();
    if (!subscriber) {
      subscriber = { id: randomUUID(), email: normalizedEmail, status: "pending", consent_at: now, confirmed_at: null, nonce: randomUUID() };
      state.subscribers.push(subscriber);
    } else {
      subscriber.status = "pending";
      subscriber.consent_at = now;
      subscriber.confirmed_at = null;
      subscriber.nonce = randomUUID();
    }
    const actionUrl = new URL(`/newsletter/confirmer?token=${encodeURIComponent(token(state, subscriber, "confirm"))}`, origin).toString();
    state.messages.unshift({ id: randomUUID(), kind: "confirmation", to: normalizedEmail, ...renderConfirmationEmail(actionUrl), action_url: actionUrl, created_at: now });
  });
}

export async function confirmLocalNewsletter(value: string) {
  await withState((state) => {
    const subscriber = tokenSubscriber(state, value, "confirm");
    if (subscriber.status === "unsubscribed") throw new NewsletterInputError("Cette inscription a été annulée. Inscrivez-vous à nouveau pour recevoir les articles.");
    if (subscriber.status !== "active") {
      subscriber.status = "active";
      subscriber.confirmed_at = new Date().toISOString();
    }
  });
}

export async function unsubscribeLocalNewsletter(value: string) {
  await withState((state) => {
    const subscriber = tokenSubscriber(state, value, "unsubscribe");
    subscriber.status = "unsubscribed";
    subscriber.nonce = randomUUID();
  });
}

function queueArticle(state: NewsletterState, article: BlogPost, manual = false) {
  if (article.status !== "published" || (article.published_at && Date.parse(article.published_at) > Date.now())) return 0;
  let count = 0;
  for (const subscriber of state.subscribers) {
    const key = `${article.id}:${subscriber.id}`;
    if (subscriber.status !== "active" || state.deliveries.includes(key)) continue;
    if (!manual && article.published_at && Date.parse(subscriber.confirmed_at!) > Date.parse(article.published_at)) continue;
    const actionUrl = new URL(`/newsletter/desinscription?token=${encodeURIComponent(token(state, subscriber, "unsubscribe"))}`, state.origin).toString();
    state.messages.unshift({ id: randomUUID(), kind: "article", to: subscriber.email, ...renderArticleEmail(article, state.origin, actionUrl), action_url: actionUrl, created_at: new Date().toISOString() });
    state.deliveries.push(key);
    count++;
  }
  return count;
}

export async function processLocalNewsletterPublications(articles: BlogPost[]) {
  return withState((state) => {
    let count = 0;
    for (const article of articles) {
      if (state.initialized && article.status === "published" && state.observed[article.id] !== "published") {
        count += queueArticle(state, article);
      }
      state.observed[article.id] = article.status;
    }
    state.initialized = true;
    state.checked_at = new Date().toISOString();
    return count;
  });
}

export async function simulateLocalArticleDelivery(article: BlogPost) {
  if (article.status !== "published" || (article.published_at && Date.parse(article.published_at) > Date.now())) {
    throw new NewsletterInputError("L’article doit être publié avant de simuler son envoi.");
  }
  return withState((state) => queueArticle(state, article, true));
}

export async function getLocalNewsletterSnapshot() {
  return withState((state) => ({
    subscribers: state.subscribers.map(({ id, email, status, consent_at, confirmed_at }) => ({ id, email, status, consent_at, confirmed_at })),
    messages: state.messages,
    checked_at: state.checked_at,
  }), false);
}

export type LocalNewsletterSnapshot = Awaited<ReturnType<typeof getLocalNewsletterSnapshot>>;
