import Link from "next/link";
import type { getProductionNewsletterSnapshot } from "@/app/lib/newsletterProduction";
import NewsletterRetryButton from "./NewsletterRetryButton";

type Snapshot = Awaited<ReturnType<typeof getProductionNewsletterSnapshot>>;

export default function ProductionNewsletterManager({ snapshot }: { snapshot: Snapshot }) {
  const labels: Record<string, string> = { sent: "Envoyé", queued: "En attente", failed: "À réessayer", sending: "En cours", cancelled: "Annulé", uncertain: "À vérifier" };
  return <div className="min-h-screen bg-[#fbf8f7] px-6 pb-20 pt-36 text-gray-900"><div className="mx-auto max-w-5xl space-y-8">
    <div><p className="text-sm font-semibold text-brand-strong">Blog Au mot juste</p><h1 className="mt-3 text-3xl font-bold">Abonnements et envois</h1><Link href="/admin/blog" className="mt-4 inline-block text-sm text-brand-strong underline">Gérer les articles</Link></div>
    <div className="grid gap-4 sm:grid-cols-2">{[{ label: "Abonnements confirmés", count: snapshot.subscribers.filter(s => s.status === "active").length }, { label: "Confirmations en attente", count: snapshot.subscribers.filter(s => s.status === "pending").length }].map(item => <div key={item.label} className="rounded-xl border border-[#eadbdd] bg-white p-6"><p className="text-3xl font-bold text-brand-strong">{item.count}</p><p className="mt-2 text-sm">{item.label}</p></div>)}</div>
    <NewsletterRetryButton />
    <section className="rounded-xl border border-[#eadbdd] bg-white p-6"><h2 className="text-xl font-semibold">Derniers envois</h2>{!snapshot.messages.length ? <p className="mt-4 text-sm text-gray-600">Aucun envoi pour le moment.</p> : <ul className="mt-4 divide-y divide-gray-100">{snapshot.messages.map(mail => <li key={mail.id} className="flex flex-wrap justify-between gap-3 py-4"><div className="min-w-0"><p className="font-medium">{mail.subject}</p><p className="mt-1 break-all text-sm text-gray-600">{mail.to}</p></div><span className={mail.status === "failed" ? "text-sm font-semibold text-red-800" : "text-sm text-gray-600"}>{labels[mail.status] || mail.status}</span></li>)}</ul>}</section>
    <section className="rounded-xl border border-[#eadbdd] bg-white p-6"><h2 className="text-xl font-semibold">Abonnements</h2><ul className="mt-4 divide-y divide-gray-100">{snapshot.subscribers.map(subscriber => <li key={subscriber.id} className="flex flex-wrap justify-between gap-3 py-3 text-sm"><span className="break-all">{subscriber.email}</span><span>{subscriber.status === "active" ? "Confirmé" : subscriber.status === "pending" ? "En attente" : "Désinscrit"}</span></li>)}</ul></section>
  </div></div>;
}
