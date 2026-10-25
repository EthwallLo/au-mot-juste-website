import Image from "next/image";
import Link from "next/link";
import { cutive } from "./fonts";

const quickLinks = [
  {
    href: "/",
    label: "Accueil",
    description: "Revenir à la page principale du site.",
  },
  {
    href: "/correction",
    label: "Correction",
    description: "Découvrir les prestations et les tarifs.",
  },
  {
    href: "/contact",
    label: "Contact",
    description: "Demander un devis ou poser une question.",
  },
];

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-[#f8f2ef]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(183,110,121,0.18),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(110,110,110,0.12),_transparent_30%)]" />
      <div className="absolute left-[-6rem] top-24 h-52 w-52 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute bottom-0 right-[-5rem] h-64 w-64 rounded-full bg-[#e7d1d5]/80 blur-3xl" />

      <div className="relative mx-auto flex min-h-[calc(100svh-13rem)] max-w-6xl items-center px-5 pb-8 pt-24 sm:px-6 sm:pb-10 sm:pt-28 md:min-h-[calc(100svh-10rem)] md:px-12 md:pb-12">
        <div className="grid w-full items-center gap-6 md:gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div className="max-w-2xl">
            <p className="-translate-y-1 mb-2 inline-flex rounded-full border border-[#d9bcc2] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-brand-strong shadow-sm sm:-translate-y-2 sm:text-sm">
              Page introuvable
            </p>

            <p
              className={`${cutive.className} text-5xl text-brand-strong sm:text-7xl md:text-8xl`}
            >
              404
            </p>

            <h1 className="mt-4 text-3xl font-bold leading-tight text-gray-800 sm:mt-5 sm:text-4xl md:text-5xl">
              Cette page s&apos;est égarée entre deux relectures.
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-gray-600 sm:hidden">
              Le lien n&apos;est peut-être plus valable. Voici les accès les plus
              utiles pour reprendre votre lecture.
            </p>
            <p className="mt-5 hidden max-w-xl text-lg leading-relaxed text-gray-600 sm:block">
              Le lien que vous avez suivi n&apos;est peut-être plus valable, ou la
              page a simplement changé de place. Je vous aide à reprendre le fil
              avec les accès les plus utiles du site.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-row sm:gap-4">
              <Link
                href="/"
                className="rounded-full bg-brand-strong px-4 py-3.5 text-center text-sm font-semibold text-white shadow-lg shadow-[#B76E79]/20 transition hover:bg-brand-hover sm:px-7 sm:py-4 sm:text-base"
              >
                Retour à l&apos;accueil
              </Link>
              <Link
                href="/contact"
                className="rounded-full border border-[#d7bcc1] bg-white/80 px-4 py-3.5 text-center text-sm font-semibold text-gray-700 transition hover:border-[#B76E79] hover:text-brand-strong sm:px-7 sm:py-4 sm:text-base"
              >
                Me contacter
              </Link>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/70 bg-white/80 p-5 shadow-[0_25px_80px_rgba(95,72,76,0.12)] backdrop-blur-sm sm:p-6 md:p-8 lg:p-10">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5e5e8] sm:h-14 sm:w-14 md:h-16 md:w-16">
                <Image
                  src="/plume-rose.svg"
                  alt=""
                  aria-hidden="true"
                  width={34}
                  height={34}
                  className="h-6 w-6 sm:h-7 sm:w-7 md:h-[34px] md:w-[34px]"
                />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-strong sm:text-sm">
                  Au mot juste
                </p>
                <p className="mt-1 text-base font-semibold text-gray-800 sm:text-lg">
                  Reprendre la lecture
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2 sm:mt-6 sm:gap-3 lg:grid-cols-1">
              {quickLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="group block rounded-[1.25rem] border border-[#efe2e4] bg-[#fffdfc] p-3 transition hover:-translate-y-0.5 hover:border-[#d6b3ba] hover:shadow-md sm:min-h-[7.5rem] sm:p-4 lg:min-h-0"
                >
                  <div className="flex min-h-full items-center justify-center text-center lg:items-start lg:justify-between lg:text-left">
                    <div>
                      <p className="text-sm font-semibold text-gray-800 sm:text-lg">
                        {link.label}
                      </p>
                      <p className="mt-2 hidden text-sm leading-relaxed text-gray-600 lg:block">
                        {link.description}
                      </p>
                    </div>
                    <span aria-hidden="true" className="hidden text-xl text-brand-strong transition group-hover:translate-x-1 lg:block lg:text-2xl">
                      →
                    </span>
                  </div>
                </Link>
              ))}
            </div>

            <p className="mt-5 hidden rounded-2xl bg-[#f6f1ee] px-4 py-3 text-sm leading-relaxed text-gray-600 sm:mt-6 sm:block sm:px-5 sm:py-4">
              Besoin d&apos;une correction, d&apos;une relecture ou d&apos;un devis
              personnalisé ? La page contact reste le meilleur point de départ.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
