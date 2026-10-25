import { createPageMetadata } from "../lib/seo";

export const metadata = createPageMetadata({
  title: "Mentions légales | Au mot juste",
  description:
    "Informations sur l’édition, l’hébergement et les crédits du site Au mot juste, dédié à la correction, à la relecture et à la traduction anglais-français.",
  path: "/mentions-legales",
});

export default function MentionsLegalesPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <section
        aria-labelledby="mentions-legales-titre"
        className="relative w-full h-[45vh] flex justify-center items-center"
        style={{
          backgroundImage: "url('/optimized/image-carnet.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <h1 id="mentions-legales-titre" className="text-4xl md:text-5xl font-bold text-gray-800 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-800 after:mt-3 after:mx-auto">
            Mentions légales
          </h1>
        </div>

        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-b from-transparent to-white pointer-events-none"></div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Jess Bailey / Unsplash
        </div>
      </section>

      <section className="w-full bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="bg-white [box-shadow:0_2px_14px_-3px_rgba(14,14,14,0.3)] rounded-2xl p-6 sm:p-10">
            <div className="text-gray-700 leading-relaxed space-y-6">
              <p>
                Conformément aux dispositions de l’article 6 de la loi
                n°2004-575 du 21 juin 2004 pour la confiance dans l’économie
                numérique (LCEN), il est précisé aux utilisateurs du site
                l’identité des différents intervenants dans le cadre de sa
                réalisation et de son suivi.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                1. Éditrice du site
              </h2>
              <p>Le présent site est édité par :
                <br />
                <strong>Madame Lorena Guedouani</strong>, entrepreneure individuelle
                <br />
                Téléphone : 07 69 35 81 03
                <br />
                Email : lorena.correction@gmail.com
              </p>
              <p>
                SIREN : <strong>999 377 864</strong> / SIRET : <strong>999 377 864 00023</strong>
                <br />
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                2. Hébergement
              </h2>
              <p>Le site est hébergé par :
              <br />
                <strong>Vercel Inc.</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                3. Propriété intellectuelle
              </h2>
              <p>
                L’ensemble des contenus présents sur ce site (textes, images,
                graphismes, logo, structure, code, etc.) est la propriété
                exclusive de <strong>Madame Lorena Guedouani</strong>, sauf
                mention contraire. Toute reproduction, représentation, modification, publication ou
                adaptation, totale ou partielle, de ces éléments est interdite
                sans autorisation écrite préalable.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                4. Responsabilité
              </h2>
              <p>
                L’éditrice du site s’efforce de fournir des informations aussi
                précises que possible. Toutefois, elle ne saurait être tenue
                responsable des omissions, inexactitudes ou carences dans la
                mise à jour des contenus.
              </p>
              <p>
                Elle ne pourra être tenue responsable des dommages directs ou
                indirects résultant de l’accès ou de l’utilisation du site.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                5. Liens hypertextes
              </h2>
              <p>
                Le site peut contenir des liens vers des sites tiers. L’éditrice
                n’exerce aucun contrôle sur leur contenu et décline toute
                responsabilité à ce titre.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                6. Données personnelles
              </h2>
              <p>
                La gestion des données personnelles est détaillée dans la page
                de{" "}
                <a
                  href="https://aumotjuste-correction.fr/confidentialite"
                  className="text-brand-strong font-bold"
                  rel="noopener noreferrer"
                >
                  Politique de confidentialité
                </a>
                , accessible depuis le site.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                7. Droit applicable
              </h2>
              <p>
                Le présent site est soumis au <strong>droit français</strong>.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">8. Crédits</h2>
              <p>
                Les images et photographies présentes sur ce site proviennent de{" "}
                <a
                  href="https://unsplash.com/fr"
                  className="text-brand-strong font-bold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Unsplash
                </a>{" "}
                et sont utilisées conformément aux licences associées.
              </p>
              <p>
                Les icônes utilisées sur ce site proviennent de la plateforme{" "}
                <a
                  href="https://www.svgrepo.com"
                  className="text-brand-strong font-bold"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  SVG Repo.
                </a>{" "}
              </p>

              <p className="text-sm text-gray-500">
                Dernière mise à jour : 10 janvier 2026
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
