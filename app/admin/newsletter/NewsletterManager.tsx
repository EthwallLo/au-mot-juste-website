"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { BlogPost } from "@/app/lib/blog";
import type { LocalNewsletterSnapshot } from "@/app/lib/newsletterLocal";
import { renderArticleEmail } from "@/app/lib/newsletterEmail";
import { NEWSLETTER_EXAMPLE } from "@/app/lib/newsletterExample";

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", dateStyle: "short", timeStyle: "short" }).format(new Date(value)) : "Pas encore vérifié";
}

export default function NewsletterManager({ initialPosts, initialSnapshot, origin }: { initialPosts: BlogPost[]; initialSnapshot: LocalNewsletterSnapshot; origin: string }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [articleId, setArticleId] = useState("");
  const [messageId, setMessageId] = useState<string | null>(null);
  const [tab, setTab] = useState<"article" | "inbox">("article");
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [failed, setFailed] = useState(false);
  const selectedArticle = initialPosts.find((post) => post.id === articleId);
  const selectedMessage = snapshot.messages.find((message) => message.id === messageId) || snapshot.messages[0];
  const preview = tab === "inbox" && selectedMessage
    ? selectedMessage
    : renderArticleEmail(selectedArticle || NEWSLETTER_EXAMPLE, origin, `${origin}/newsletter/desinscription?token=apercu`);
  const active = snapshot.subscribers.filter((subscriber) => subscriber.status === "active").length;
  const pending = snapshot.subscribers.filter((subscriber) => subscriber.status === "pending").length;

  useEffect(() => {
    const controller = new AbortController();
    const interval = setInterval(async () => {
      try {
        const response = await fetch("/api/admin/newsletter", { cache: "no-store", signal: controller.signal });
        if (response.ok) setSnapshot(await response.json());
      } catch { /* The next poll retries after a temporary disconnection. */ }
    }, 5000);
    return () => { clearInterval(interval); controller.abort(); };
  }, []);

  async function act(action: "sync" | "simulate") {
    setBusy(true);
    setFeedback("");
    setFailed(false);
    try {
      const response = await fetch("/api/admin/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, articleId }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "L’action a échoué.");
      setSnapshot(data.snapshot);
      setFeedback(data.count ? `${data.count} message${data.count > 1 ? "s" : ""} ajouté${data.count > 1 ? "s" : ""} à la boîte de test.` : "Vérification terminée. Aucun nouveau message à créer.");
      if (data.count) { setTab("inbox"); setMessageId(data.snapshot.messages[0]?.id || null); }
    } catch (error) {
      setFailed(true);
      setFeedback(error instanceof Error ? error.message : "L’action a échoué.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-h-screen bg-[#f8f5f5] px-4 pb-20 pt-32 text-gray-900 sm:px-6 lg:px-10">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">Le carnet de Lorena</p><h1 className="mt-2 text-3xl font-bold">Votre newsletter</h1></div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold text-brand-strong"><Link href="/blog#newsletter" className="underline underline-offset-4">Formulaire d’inscription</Link><Link href="/admin/blog" className="underline underline-offset-4">Gérer les articles</Link></div>
      </div>
      <p className="mt-6 rounded-xl border border-[#e4d4d7] bg-[#fff9fa] px-5 py-4 text-sm leading-7 text-gray-700"><strong className="text-brand-strong">Version locale.</strong> Les inscriptions et les e-mails restent sur cet ordinateur. Aucun e-mail réel n’est envoyé. Les nouvelles publications sont vérifiées automatiquement toutes les 15 secondes tant que le serveur local fonctionne.</p>
      <div className="my-6 grid grid-cols-3 gap-3 sm:gap-5">
        {[{ label: "Abonnés confirmés", value: active }, { label: "En attente", value: pending }, { label: "Messages de test", value: snapshot.messages.length }].map((item) => <div key={item.label} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5"><p className="text-2xl font-bold text-brand-strong">{item.value}</p><p className="mt-1 text-xs leading-5 text-gray-600 sm:text-sm">{item.label}</p></div>)}
      </div>
      {feedback ? <p role={failed ? "alert" : "status"} className={`mb-5 rounded-lg p-4 text-sm ${failed ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>{feedback}</p> : null}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="min-w-0 space-y-5">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold">L’article à recevoir</h2>
            <label htmlFor="newsletter-article" className="mb-2 mt-4 block text-sm text-gray-600">Choisir un article</label>
            <select id="newsletter-article" value={articleId} onChange={(event) => { setArticleId(event.target.value); setTab("article"); }} className="w-full min-w-0 rounded-lg border border-gray-300 bg-white p-3 text-sm">
              <option value="">Exemple de newsletter</option>
              {initialPosts.map((post) => <option value={post.id} key={post.id}>{post.title}</option>)}
            </select>
            <p className="mt-3 text-xs leading-6 text-gray-600">{selectedArticle ? selectedArticle.status === "published" ? "Cet article est publié. Vous pouvez simuler sa réception." : selectedArticle.status === "scheduled" ? `Publication prévue le ${date(selectedArticle.published_at)}. L’e-mail sera simulé à sa sortie.` : "Cet article est en brouillon. Aucun envoi avant sa publication." : "Un exemple pour essayer la réception, sans publier de vrai article."}</p>
            <button type="button" onClick={() => act("simulate")} disabled={busy || !active || (!!selectedArticle && selectedArticle.status !== "published")} className="mt-4 w-full rounded-lg bg-brand-strong px-4 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:cursor-not-allowed disabled:opacity-40">Simuler la réception</button>
            {!active ? <p className="mt-2 text-xs leading-6 text-gray-500">Inscrivez une adresse et confirmez-la depuis la boîte de test pour essayer un envoi.</p> : null}
            <button type="button" disabled={busy} onClick={() => act("sync")} className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">{busy ? "Vérification…" : "Vérifier les publications"}</button>
            <p className="mt-3 text-xs leading-6 text-gray-500">Dernière vérification : {date(snapshot.checked_at)}</p>
          </section>
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-lg font-semibold">Boîte de test</h2>
            <div className="mt-4 max-h-96 space-y-2 overflow-y-auto">
              {!snapshot.messages.length ? <p className="text-sm leading-7 text-gray-500">Votre message de confirmation apparaîtra ici après une première inscription.</p> : snapshot.messages.map((message) => <button type="button" key={message.id} onClick={() => { setMessageId(message.id); setTab("inbox"); }} className={`w-full rounded-lg border p-3 text-left ${tab === "inbox" && selectedMessage?.id === message.id ? "border-[#B76E79] bg-[#fff8f9]" : "border-gray-200 hover:bg-gray-50"}`}><span className="block text-[11px] font-semibold uppercase tracking-wide text-brand-strong">{message.kind === "confirmation" ? "Confirmation" : "Article"}</span><span className="mt-1 block text-sm font-semibold">{message.subject}</span><span className="mt-2 block break-all text-xs text-gray-500">À : {message.to}</span><span className="mt-1 block text-xs text-gray-500">{date(message.created_at)}</span></button>)}
            </div>
          </section>
        </aside>
        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4"><h2 className="font-semibold">{tab === "inbox" ? "Message simulé" : "Aperçu de la newsletter"}</h2><div className="flex gap-2 text-xs"><button type="button" aria-pressed={!mobile} onClick={() => setMobile(false)} className={`rounded-md border px-3 py-2 ${!mobile ? "border-[#B76E79] text-brand-strong" : "border-gray-200"}`}>Ordinateur</button><button type="button" aria-pressed={mobile} onClick={() => setMobile(true)} className={`rounded-md border px-3 py-2 ${mobile ? "border-[#B76E79] text-brand-strong" : "border-gray-200"}`}>Mobile</button></div></div>
            <p className="mt-3 text-sm text-gray-600"><strong>Objet :</strong> {preview.subject}</p>
            {tab === "inbox" && selectedMessage ? <Link href={selectedMessage.action_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold text-brand-strong underline underline-offset-4">{selectedMessage.kind === "confirmation" ? "Tester la confirmation d’inscription ↗" : "Tester la désinscription ↗"}</Link> : null}
          </div>
          <div className="bg-gray-100 p-2 sm:p-4"><iframe title="Aperçu de l’e-mail" sandbox="allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer" srcDoc={preview.html} className="mx-auto block h-[900px] max-w-full border-0 bg-white" style={{ width: mobile ? 375 : "100%" }} /></div>
        </section>
      </div>
      <section className="mt-6 rounded-xl border border-gray-200 bg-white p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Inscriptions locales</h2>
        {!snapshot.subscribers.length ? <p className="mt-4 text-sm text-gray-500">Aucune inscription pour le moment.</p> : <ul className="mt-4 divide-y divide-gray-100">{snapshot.subscribers.map((subscriber) => <li key={subscriber.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span className="break-all">{subscriber.email}</span><span className={`rounded-full px-3 py-1 text-xs ${subscriber.status === "active" ? "bg-green-50 text-green-700" : subscriber.status === "pending" ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-600"}`}>{subscriber.status === "active" ? "Confirmé" : subscriber.status === "pending" ? "À confirmer" : "Désinscrit"}</span></li>)}</ul>}
      </section>
    </div>
  </div>;
}
