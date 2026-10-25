"use client";

import { useState } from "react";

type FormStatus = {
  message: string;
  type: "error" | "success" | "";
};

export default function ContactForm() {
  const [status, setStatus] = useState<FormStatus>({ message: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = formData.get("name")?.toString().trim() ?? "";
    const email = formData.get("email")?.toString().trim() ?? "";
    const phone = (formData.get("phone")?.toString() ?? "").replace(/\s+/g, "");
    const subject = formData.get("subject")?.toString().trim() ?? "";
    const message = formData.get("message")?.toString().trim() ?? "";

    if (!email) {
      setStatus({ message: "Le champ e-mail est obligatoire.", type: "error" });
      return;
    }

    if (!message) {
      setStatus({ message: "Le champ message est obligatoire.", type: "error" });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setStatus({
        message: "Veuillez saisir une adresse e-mail valide.",
        type: "error",
      });
      return;
    }

    if (phone && !/^\+?\d{10,15}$/.test(phone)) {
      setStatus({
        message: "Veuillez saisir un numéro de téléphone valide (10 à 15 chiffres).",
        type: "error",
      });
      return;
    }

    setIsSubmitting(true);
    setStatus({ message: "", type: "" });

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus({
          message: data.message ?? "Votre message n’a pas pu être envoyé. Veuillez réessayer.",
          type: "error",
        });
        return;
      }

      setStatus({
        message: data.message ?? "Votre message a bien été envoyé.",
        type: "success",
      });
      form.reset();
    } catch {
      setStatus({
        message: "Erreur lors de l'envoi du formulaire.",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex flex-col">
      <section
        aria-labelledby="titre-contact"
        className="relative w-full h-[45vh] flex justify-center items-center"
        style={{
          backgroundImage: "url('/optimized/image-carnet.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <h1
            id="titre-contact"
            className="text-4xl md:text-5xl font-bold text-gray-800 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-800 after:mt-3 after:mx-auto"
          >
            Contact
          </h1>
        </div>

        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-b from-transparent to-white pointer-events-none"
        ></div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Jess Bailey / Unsplash
        </div>
      </section>

      <section aria-labelledby="formulaire-contact" className="w-full bg-white py-20">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white [box-shadow:0_2px_14px_-3px_rgba(14,14,14,0.3)] rounded-2xl p-6 sm:p-10">
            <div className="text-center sm:text-left">
              <h2
                id="formulaire-contact"
                className="text-3xl font-bold text-center mb-12 text-brand-strong"
              >
                Me contacter
              </h2>
              <p className="text-[15px] text-center text-gray-700 leading-relaxed">
                Une question, un projet, un besoin de correction ?
              </p>
              <p className="text-[15px] text-center text-gray-700 leading-relaxed">
                Je serai ravie d’échanger avec vous.
              </p>
              <p className="mt-4 text-[15px] text-center text-gray-600 leading-relaxed">
                Pour un devis, précisez le type de document, sa longueur en mots
                ou en signes (espaces comprises) et votre échéance souhaitée.
              </p>
            </div>

            <div aria-live="polite" className="mt-6 min-h-6">
              {status.message ? (
                <p
                  role={status.type === "error" ? "alert" : "status"}
                  className={`rounded-md px-4 py-3 text-sm ${
                    status.type === "error"
                      ? "bg-red-50 text-red-700"
                      : "bg-green-50 text-green-700"
                  }`}
                >
                  {status.message}
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="grid sm:grid-cols-2 gap-4 text-gray-900 mt-4">
              <div>
                <label htmlFor="name" className="sr-only">
                  Nom
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="Nom"
                  className="w-full bg-gray-100 py-2.5 px-4 text-sm rounded-md border border-gray-200 
                           focus:bg-transparent focus:border-gray-800 outline-none transition-all"
                />
              </div>

              <div>
                <label htmlFor="email" className="sr-only">
                  E-mail
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  aria-required="true"
                  placeholder="E-mail"
                  className="w-full bg-gray-100 py-2.5 px-4 text-sm rounded-md border border-gray-200 
                           focus:bg-transparent focus:border-gray-800 outline-none transition-all"
                />
              </div>

              <div className="col-span-full">
                <label htmlFor="phone" className="sr-only">
                  Numéro de téléphone
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  pattern={"\\s*\\+?(?:[0-9]\\s*){10,15}"}
                  onInvalid={(event) => {
                    event.currentTarget.setCustomValidity(
                      "Veuillez saisir un numéro de téléphone valide (10 à 15 chiffres).",
                    );
                  }}
                  onInput={(event) => event.currentTarget.setCustomValidity("")}
                  placeholder="Numéro de téléphone"
                  aria-describedby="phone-help"
                  className="w-full bg-gray-100 py-2.5 px-4 text-sm rounded-md border border-gray-200 
                           focus:bg-transparent focus:border-gray-800 outline-none transition-all"
                />
                <p id="phone-help" className="sr-only">
                  Saisissez un numéro de téléphone sur 10 à 15 chiffres, avec ou
                  sans espaces, par exemple 06 12 34 56 78 ou +33 6 12 34 56 78.
                </p>
              </div>

              <div className="col-span-full">
                <label htmlFor="subject" className="sr-only">
                  Sujet
                </label>
                <input
                  id="subject"
                  name="subject"
                  type="text"
                  autoComplete="off"
                  placeholder="Sujet"
                  className="w-full bg-gray-100 py-2.5 px-4 text-sm rounded-md border border-gray-200 
                           focus:bg-transparent focus:border-gray-800 outline-none transition-all"
                />
              </div>

              <div className="col-span-full">
                <label htmlFor="message" className="sr-only">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  placeholder="Message"
                  rows={6}
                  required
                  aria-required="true"
                  className="w-full bg-gray-100 px-4 text-sm rounded-md pt-3 border border-gray-200 
                           focus:bg-transparent focus:border-gray-800 outline-none transition-all"
                ></textarea>
              </div>

              <div className="col-span-full">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="text-gray-800 bg-gray-100 hover:bg-gray-150 hover:ring-2 hover:ring-gray-300 hover:ring-offset-2 text-sm rounded-md font-medium px-4 py-2.5 
                             cursor-pointer w-full mt-2! transition disabled:cursor-wait disabled:opacity-70"
                >
                  {isSubmitting ? "Envoi en cours..." : "Envoyer le message"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
