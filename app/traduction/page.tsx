import ServiceProcess from "../components/serviceProcess";
import DocumentTypes from "../components/documentTypes";
import { createPageMetadata } from "../lib/seo";

export const metadata = createPageMetadata({
  title: "Traduction anglais-français | Au mot juste",
  description:
    "Traduction de l’anglais vers le français et relecture de traductions : manuscrits, contenus web et documents professionnels. Tarifs et devis gratuit.",
  path: "/traduction",
});

export default function TraductionPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <section
        id="phototitre"
        aria-labelledby="traduction-titre"
        className="relative w-full h-[45vh] flex justify-center items-center"
        style={{
          backgroundImage: "url('/optimized/image-carnet-2.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <h1
            id="traduction-titre"
            className="text-4xl md:text-5xl font-bold text-gray-800 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-800 after:mt-3 after:mx-auto"
          >
            La traduction
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

      <DocumentTypes service="traduction" />

      <section
        id="tarifs"
        aria-labelledby="tarifs-titre"
        className="relative justify-center items-center bg-white"
        style={{ backgroundImage: "url('/optimized/librairie.avif')" }}
      >
        <section className="py-20 bg-cover bg-center">
          <h2
            id="tarifs-titre"
            className="text-center text-3xl font-bold text-gray-600 mb-16 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-600 after:mt-3 after:mx-auto"
          >
            Les tarifs
          </h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center">
              <h3 className="text-2xl font-bold mb-4 text-brand-strong">
                Traduction anglais-français
              </h3>
              <p className="leading-relaxed text-gray-600">
                Traduction de vos textes de l&apos;anglais vers le français,
                avec une attention particulière portée au sens, au ton, à la
                fluidité et à la cohérence du texte final.
              </p>

              <p className="mt-4 font-semibold text-gray-700">
                <span className="text-brand-strong font-bold">0,10 €</span> / mot source
              </p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center">
              <h3 className="text-2xl font-bold mb-4 text-brand-strong">
                Relecture après traduction
              </h3>
              <p className="leading-relaxed text-gray-600">
                Relecture d&apos;une traduction anglais-français existante afin
                de corriger les maladresses, vérifier la fidélité au texte
                source et rendre le français plus naturel.
              </p>

              <p className="mt-4 font-semibold text-gray-700">
                <span className="text-brand-strong font-bold">0,04 €</span> / mot source
              </p>
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl bg-white/95 p-6 sm:p-8">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Comment est calculé le tarif ?</h3>
              <p className="leading-relaxed text-gray-600">
                Le mot source correspond à un mot du document d’origine en
                anglais. Pour un texte de 1 000 mots en anglais, comptez
                environ <strong>100 € pour une traduction</strong> ou{" "}
                <strong>40 € pour la relecture d’une traduction existante</strong>.
              </p>
              <p className="mt-4 leading-relaxed text-gray-600">
                Ces tarifs sont indicatifs. Le montant final et le délai sont
                confirmés dans un devis gratuit après examen de votre document
                ou d’un extrait. Pour une relecture, transmettez aussi le texte
                anglais afin de permettre la comparaison avec la traduction.
                Les éventuelles conditions de facturation pour un texte court
                ou une demande particulière sont précisées dans le devis.
              </p>
            </div>
          </div>
          <div className="text-center mt-20">
            <a
              href="/contact"
              className="px-8 py-4 bg-brand-strong text-white text-lg font-semibold rounded-md shadow-md hover:bg-brand-hover transition"
            >
              Demander un devis gratuit
            </a>
          </div>
        </section>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Susan Q Yin / Unsplash
        </div>
      </section>
      <ServiceProcess service="traduction" />
    </div>
  );
}
