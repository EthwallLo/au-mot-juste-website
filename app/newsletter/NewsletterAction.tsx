"use client";

import Link from "next/link";
import { useState } from "react";

export default function NewsletterAction({ token, action }: { token: string; action: "confirm" | "unsubscribe" }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  async function apply() {
    setBusy(true);
    try {
      const response = await fetch(`/api/newsletter/${action}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) });
      const data = await response.json();
      setMessage(data.message || "Cette action est momentanément indisponible.");
      setDone(response.ok);
    } catch {
      setMessage("La connexion a été interrompue. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }
  return <div className="mx-auto max-w-lg rounded-2xl border border-[#eadbdd] bg-white p-8 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong">Blog Au mot juste</p>
    <h1 className="mt-4 text-3xl font-bold">{action === "confirm" ? "Confirmez votre inscription" : "Faire une pause ?"}</h1>
    <p className="mt-5 leading-8 text-gray-600">{action === "confirm" ? "Confirmez votre inscription pour recevoir les prochains articles par mail." : "Confirmez votre désinscription pour ne plus recevoir les prochains articles par e-mail."}</p>
    {!done ? <button type="button" onClick={apply} disabled={busy || !token} className="mt-6 rounded-lg bg-brand-strong px-5 py-3 font-semibold text-white hover:bg-brand-hover disabled:opacity-50">{busy ? "Un instant…" : action === "confirm" ? "Confirmer mon inscription" : "Me désinscrire"}</button> : null}
    {message ? <p role={done ? "status" : "alert"} className={`mt-5 rounded-lg p-4 text-sm leading-7 ${done ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"}`}>{message}</p> : null}
    {!token ? <p role="alert" className="mt-5 text-sm text-red-700">Le lien est incomplet. Vous pouvez demander une nouvelle inscription.</p> : null}
    <Link href="/blog#newsletter" className="mt-6 block text-sm font-semibold text-brand-strong underline underline-offset-4">Retour au blog</Link>
  </div>;
}
