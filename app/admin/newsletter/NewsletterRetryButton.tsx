"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewsletterRetryButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function retry() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "retry" }) });
      if (!response.ok) throw new Error();
      setMessage("Les envois en attente ont été relancés.");
      router.refresh();
    } catch { setMessage("La relance a échoué. Réessayez dans un instant."); }
    finally { setBusy(false); }
  }
  return <div><button type="button" disabled={busy} onClick={retry} className="rounded-md bg-brand-strong px-5 py-3 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-50">{busy ? "Relance…" : "Relancer les envois en attente"}</button>{message ? <p role="status" className="mt-3 text-sm text-gray-700">{message}</p> : null}</div>;
}
