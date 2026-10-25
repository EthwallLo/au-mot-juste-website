import ServiceProcess from "../components/serviceProcess";
import { createPageMetadata } from "../lib/seo";

export const metadata = createPageMetadata({
  title: "Correction et relecture professionnelles | Au mot juste",
  description:
    "Correction de manuscrits, mémoires, CV et contenus web : orthographe, grammaire, typographie et style. Découvrez les prestations et demandez un devis gratuit.",
  path: "/correction",
});

export default function CorrectionPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <section id="phototitre"
        aria-labelledby="correction-titre"
        className="relative w-full h-[45vh] flex justify-center items-center"
        style={{ backgroundImage: "url('/optimized/image-carnet-2.avif')", backgroundSize: "cover", backgroundPosition: "center" }} >
        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <h1 id="correction-titre" className="text-4xl md:text-5xl font-bold text-gray-800 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-800 after:mt-3 after:mx-auto">La correction</h1>
        </div>
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-b from-transparent to-white pointer-events-none"></div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Jess Bailey / Unsplash
        </div>
      </section>

      <section id="corps" aria-labelledby="types-documents" className="relative justify-center items-center bg-white">
        <section
          className="py-20 bg-cover bg-center">
          <h2 id="types-documents" className="text-center text-3xl font-bold text-brand-strong mb-16 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-[#B76E79] after:mt-3 after:mx-auto">
            Pour quels types de documents ?
          </h2>
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-12 px-6">
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition">
              <img src="web.svg" className="w-20 mx-auto mb-6" alt="" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-3 text-brand-strong">Contenus web</h3>
              <p className="text-gray-700 leading-relaxed">
                Articles, pages de site, newsletters, descriptions produits ou contenus SEO.
              </p>
            </div>
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition">
              <img src="script.svg" className="w-20 mx-auto mb-6" alt="" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-3 text-brand-strong">Manuscrits</h3>
              <p className="text-gray-700 leading-relaxed">
                Romans, nouvelles, essais, autofictions ou tout autre projet littéraire.
              </p>
            </div>
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition">
              <img src="travaux.svg" className="w-20 mx-auto mb-6" alt="" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-3 text-brand-strong">Travaux universitaires</h3>
              <p className="text-gray-700 leading-relaxed">
                Mémoire, rapport, exposé, dossier projet ou travaux de recherche.
              </p>
            </div>
            <div className="bg-white bg-opacity-90 rounded-2xl shadow-md p-8 text-center hover:shadow-lg transition">
              <img src="docu.svg" className="w-20 mx-auto mb-6" alt="" aria-hidden="true" />
              <h3 className="text-xl font-semibold mb-3 text-brand-strong">Documents personnels</h3>
              <p className="text-gray-700 leading-relaxed">
                CV, lettre de motivation, discours, documents administratifs ou professionnels.
              </p>
            </div>
          </div>
        </section>
      </section>

      <section id="tarifs" aria-labelledby="tarifs-titre" className="relative justify-center items-center bg-white" style={{ backgroundImage: "url('/optimized/librairie.avif')" }}>
        <section
          className="py-20 bg-cover bg-center">
          <h2 id="tarifs-titre" className="text-center text-3xl font-bold text-gray-600 mb-16 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-600 after:mt-3 after:mx-auto">
            Les tarifs
          </h2>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 px-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center">
              <h3 className="text-2xl font-bold mb-4 text-brand-strong">Correction simple</h3>
              <p className="leading-relaxed text-gray-600">
                Une dernière relecture pour un texte déjà corrigé : orthographe,
                grammaire, ponctuation et typographie, dans le respect des
                formulations existantes.
              </p>

              <p className="mt-4 font-semibold text-gray-700">
                <span className="text-brand-strong font-bold">2 €</span> / 1 000 signes
              </p>
              <p className="mt-1 text-sm text-gray-500">Espaces comprises</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition text-center">
              <h3 className="text-2xl font-bold mb-4 text-brand-strong">Correction approfondie</h3>
              <p className="leading-relaxed text-gray-600">
                Une correction complète de la langue, avec un travail sur la
                syntaxe, les répétitions, la fluidité et la cohérence du texte.
                Les reformulations proposées respectent votre style et votre voix.
              </p>

              <p className="mt-4 font-semibold text-gray-700">
                <span className="text-brand-strong font-bold">3 €</span> / 1 000 signes
              </p>
              <p className="mt-1 text-sm text-gray-500">Espaces comprises</p>
            </div>
          </div>
          <div className="mx-auto max-w-5xl px-6">
            <div className="rounded-2xl bg-white/95 p-6 sm:p-8">
              <h3 className="mb-3 text-lg font-semibold text-gray-800">Un exemple pour vous repérer</h3>
              <p className="leading-relaxed text-gray-600">
                Pour un texte de 50 000 signes, espaces comprises, comptez
                environ <strong>100 € en correction simple</strong> ou{" "}
                <strong>150 € en correction approfondie</strong>.
              </p>
              <p className="mt-4 leading-relaxed text-gray-600">
                Ces tarifs sont indicatifs. Le montant final est confirmé dans
                un devis gratuit après examen de votre document ou d’un extrait.
                Pour les textes courts ou les demandes particulières, les
                éventuelles conditions de facturation sont précisées dans le devis.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-gray-600">
                Je signale les incohérences repérées au fil de la lecture. Une
                recherche documentaire ou une vérification systématique des faits
                et des sources fait l’objet d’un accord spécifique.
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
      <ServiceProcess service="correction" />
    </div>
  );
}
