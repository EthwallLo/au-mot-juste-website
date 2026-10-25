import { createPageMetadata } from "../lib/seo";

export const metadata = createPageMetadata({
  title: "Politique de confidentialité | Au mot juste",
  description:
    "Consultez la politique de confidentialité d’Au mot juste : utilisation du formulaire de contact, traitement des données et moyens d’exercer vos droits.",
  path: "/confidentialite",
});

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full min-h-screen flex flex-col">
      <section
        aria-labelledby="confidentialite-titre"
        className="relative w-full h-[45vh] flex justify-center items-center"
        style={{
          backgroundImage: "url('/optimized/image-carnet.avif')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-black/10"></div>

        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <h1 id="confidentialite-titre" className="text-4xl md:text-5xl font-bold text-gray-800 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-800 after:mt-3 after:mx-auto">
            Politique de confidentialité
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
                La protection de vos données personnelles est une priorité. La
                présente politique de confidentialité a pour objectif de vous
                informer de manière claire et transparente sur la manière dont
                vos données sont collectées, utilisées et protégées lorsque vous
                naviguez sur ce site.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                1. Responsable du traitement des données
              </h2>
              <p>
                La responsable du traitement des données personnelles collectées
                sur ce site est <strong>Lorena Guedouani</strong>.{" "}
              </p>
              <p>
                Pour toute question relative à la protection de vos données,
                vous pouvez me contacter via la page{" "}
                <a
                  href="https://aumotjuste-correction.fr/contact"
                  className="text-brand-strong font-bold"
                  rel="noopener noreferrer"
                >
                  Contact
                </a>{" "}
                du site.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                2. Données collectées
              </h2>
              <p>
                Des données personnelles peuvent être collectées lorsque vous
                utilisez ce site, notamment lorsque vous me contactez via le
                formulaire de contact.
              </p>
              <p>Les données susceptibles d’être collectées sont :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Nom et/ou prénom</strong>
                </li>
                <li>
                  <strong>Adresse e-mail</strong>
                </li>
                <li>
                  <strong>Numéro de téléphone</strong> (si renseigné)
                </li>
                <li>
                  <strong>Contenu du message</strong>
                </li>
              </ul>

              <p>
                Aucune donnée personnelle n’est collectée sans que vous en soyez
                informé et sans qu’elle soit strictement nécessaire au
                traitement de votre demande.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                3. Finalités de la collecte
              </h2>
              <p>Les données collectées sont utilisées uniquement pour :</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Répondre à vos demandes de contact ou de renseignements</li>
                <li>
                  Échanger dans le cadre d’une demande de devis ou d’une
                  prestation
                </li>
                <li>Assurer le bon fonctionnement et l’amélioration du site</li>
              </ul>
              <p>
                Vos données ne sont <strong>en aucun cas</strong> utilisées à
                des fins commerciales non sollicitées.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                4. Partage des données
              </h2>
              <p>
                Les données personnelles collectées sur ce site sont{" "}
                <strong>strictement confidentielles</strong>.
              </p>
              <p>
                Elles ne sont{" "}
                <strong>ni vendues, ni échangées, ni cédées</strong> à des
                tiers.
              </p>
              <p>
                Elles peuvent uniquement être traitées par des outils techniques
                nécessaires au fonctionnement du site (hébergement, formulaire),
                dans le respect de la réglementation en vigueur.
              </p>
              <p>
                Certaines données techniques anonymisées peuvent être traitées
                par Vercel Inc. dans le cadre de l’hébergement et de la mesure
                d’audience du site.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                5. Durée de conservation
              </h2>
              <p>
                Les données issues du formulaire de contact sont conservées
                pendant la durée nécessaire au traitement de la demande, puis
                supprimées ou archivées à des fins légales si nécessaire.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                6. Sécurité des données
              </h2>
              <p>
                Des mesures techniques et organisationnelles appropriées sont
                mises en place afin de protéger vos données personnelles contre
                toute perte, accès non autorisé, modification ou divulgation.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                7. Mesure d’audience et cookies
              </h2>

              <p>
                Ce site utilise des outils de mesure d’audience afin de mieux
                comprendre son utilisation et d’en améliorer le contenu, tout en
                respectant la vie privée des visiteurs.
              </p>

              <p>Les outils utilisés sont :</p>

              <ul className="list-disc list-inside space-y-1">
                <li>Vercel Web Analytics</li>
                <li>Vercel Speed Insights</li>
              </ul>

              <p>
                Ces outils collectent uniquement des données techniques et
                anonymisées, telles que :
              </p>

              <ul className="list-disc list-inside space-y-1">
                <li>Pages consultées</li>
                <li>Durée de navigation</li>
                <li>Type d’appareil et de navigateur</li>
                <li>
                  Performances techniques du site (temps de chargement,
                  stabilité)
                </li>
              </ul>

              <p>
                Aucune donnée personnelle directement identifiable (nom, adresse
                e-mail, adresse IP complète) n’est collectée. Ces outils
                n’utilisent pas de cookies et ne permettent aucun suivi
                individuel des utilisateurs à des fins publicitaires ou
                marketing.
              </p>

              <p>
                Conformément aux recommandations de la CNIL, ces traitements de
                mesure d’audience sont exemptés de consentement préalable
                lorsqu’ils sont strictement nécessaires au fonctionnement et à
                l’amélioration du site.
              </p>

              <p>
                Les données collectées sont traitées par la société{" "}
                <strong>Vercel Inc.</strong>, fournisseur de l’hébergement et
                des outils d’analyse du site.
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                8. Vos droits
              </h2>
              <p>
                Conformément au{" "}
                <strong>
                  Règlement général sur la protection des données (RGPD)
                </strong>
                , vous disposez des droits suivants :
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Droit d’accès à vos données personnelles</li>
                <li>Droit de rectification</li>
                <li>Droit à l’effacement</li>
                <li>Droit à la limitation du traitement</li>
                <li>Droit d’opposition au traitement de vos données</li>
              </ul>
              <p>
                Vous pouvez exercer ces droits en me contactant via la page{" "}
                <a
                  href="https://aumotjuste-correction.fr/contact"
                  className="text-brand-strong font-bold"
                  rel="noopener noreferrer"
                >
                  Contact
                </a>{" "}
                du site.
              </p>
              <p>
                Si vous estimez, après m’avoir contactée, que vos droits ne sont
                pas respectés, vous disposez du droit d’introduire une
                réclamation auprès de la{" "}
                <a
                  href="https://www.cnil.fr/fr"
                  className="text-brand-strong font-bold"
                  rel="noopener noreferrer"
                >
                  CNIL
                </a>
                .
              </p>

              <h2 className="text-2xl font-bold text-brand-strong">
                9. Modification de la politique de confidentialité
              </h2>
              <p>
                La présente politique de confidentialité peut être modifiée à
                tout moment afin de rester conforme aux évolutions légales ou
                techniques. La version en vigueur est celle publiée sur cette
                page.
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
