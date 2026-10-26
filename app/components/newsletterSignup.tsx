"use client";

import { FormEvent, useId, useState } from "react";

type NewsletterSignupProps = {
  variant?: "inline" | "sidebar";
  preview?: boolean;
};

export default function NewsletterSignup({ variant = "inline", preview = false }: NewsletterSignupProps) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failed, setFailed] = useState(false);
  const [done, setDone] = useState(false);
  const sidebar = variant === "sidebar";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview || busy) return;
    const website = new FormData(event.currentTarget).get("website");
    setBusy(true);
    setMessage("");
    setFailed(false);
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, website }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "L’inscription a échoué. Veuillez réessayer.");
      setMessage(data.message);
      setDone(true);
    } catch (error) {
      setFailed(true);
      setMessage(error instanceof Error ? error.message : "La connexion a été interrompue. Veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      aria-labelledby={id + "-heading"}
      aria-busy={busy}
      className={sidebar ? "" : "rounded-2xl border border-[#eadbdd] bg-[#fcf8f8] p-5 sm:p-8 lg:px-10"}
    >
      <div className={sidebar ? "" : "grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,430px)] lg:items-center lg:gap-10"}>
        <div className={sidebar ? "" : "flex items-start gap-4 lg:items-center lg:gap-5"}>
          {!sidebar ? (
            <div aria-hidden="true" className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#eadbdd] bg-white text-brand-strong min-[360px]:flex sm:h-14 sm:w-14">
              <svg viewBox="0 0 40 40" fill="none" className="h-8 w-8 -rotate-6" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 17.5 20 7l14 10.5V31a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V17.5Z" />
                <path d="M11 20.5V12h18v8.5M6 18l14 9 14-9M6.5 31.5 16 24.5m17.5 7L24 24.5M16 16h8m-8 4h5" />
              </svg>
            </div>
          ) : null}
          <div className="min-w-0">
            <h2 id={id + "-heading"} className={sidebar ? "text-base font-semibold text-gray-800" : "max-w-sm text-xl font-semibold leading-snug text-[#49383f] sm:text-[22px]"}>
              {sidebar ? "Recevoir les prochains articles dès leur publication" : "Recevoir les articles dès qu’ils sont publiés"}
            </h2>
          </div>
        </div>

        <fieldset disabled={busy || preview} className={sidebar ? "mt-4 min-w-0" : "min-w-0"}>
          {!done ? (
            <>
              <div className={sidebar ? "flex min-w-0 gap-2" : "flex min-w-0 flex-col gap-1.5 rounded-xl border border-[#dcc8cd] bg-white p-1.5 transition focus-within:border-[#94505d] focus-within:ring-2 focus-within:ring-[#94505d]/15 min-[360px]:flex-row"}>
                <label htmlFor={id + "-email"} className="sr-only">Votre adresse e-mail</label>
                <input
                  id={id + "-email"}
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => {
                    event.target.setCustomValidity("");
                    setEmail(event.target.value);
                  }}
                  onInvalid={(event) => event.currentTarget.setCustomValidity("Veuillez saisir une adresse e-mail valide.")}
                  placeholder="Votre e-mail"
                  className={sidebar ? "min-w-0 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-[#B76E79]" : "min-w-0 flex-1 rounded-lg bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-500 focus-visible:outline-none"}
                />
                <button
                  type="submit"
                  disabled={busy || preview}
                  className={sidebar ? "shrink-0 rounded-md border border-[#B76E79] bg-white px-3 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-[#fff8f9] disabled:cursor-wait disabled:opacity-50" : "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-strong px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-50"}
                >
                  {busy ? "En cours…" : "M’inscrire"}
                  {!sidebar ? <svg aria-hidden="true" width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 10h12m-5-5 5 5-5 5" /></svg> : null}
                </button>
              </div>
              <div className="hidden" aria-hidden="true">
                <label>Votre site<input name="website" tabIndex={-1} autoComplete="off" /></label>
              </div>
              <label className="mt-3 flex items-start gap-2 text-xs leading-5 text-gray-600">
                <input
                  type="checkbox"
                  required
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-[#94505d]"
                />
                <span>Je souhaite recevoir les articles par e-mail.</span>
              </label>
            </>
          ) : null}

          {message ? (
            <p role={failed ? "alert" : "status"} className={"mt-3 text-sm leading-6 " + (failed ? "text-red-800" : "text-green-800")}>
              {message}
            </p>
          ) : null}
        </fieldset>
      </div>
    </form>
  );
}
