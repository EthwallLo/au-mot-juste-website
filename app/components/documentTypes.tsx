import styles from "./documentTypes.module.css";

type DocumentTypesProps = {
  service: "correction" | "traduction";
};

const documents = [
  {
    title: "Contenus web",
    correction: "Articles, pages de site, newsletters, fiches produits et contenus SEO.",
    traduction: "Articles, pages de site, newsletters ou fiches produits rédigés en anglais à traduire en français.",
  },
  {
    title: "Manuscrits",
    correction: "Romans, nouvelles, essais, autofictions et autres projets littéraires.",
    traduction: "Romans, nouvelles, récits courts, essais ou extraits littéraires à adapter de l’anglais vers le français.",
  },
  {
    title: "Travaux universitaires",
    correction: "Mémoires, rapports, exposés, dossiers de projet et travaux de recherche.",
    traduction: "Résumés, présentations, dossiers ou documents d’accompagnement en anglais à rendre clairs en français.",
  },
  {
    title: "Documents personnels",
    correction: "CV, lettres de motivation, discours et documents administratifs ou professionnels.",
    traduction: "Lettres, CV, biographies, documents administratifs ou supports professionnels à traduire vers un français naturel et soigné.",
  },
];

export default function DocumentTypes({ service }: DocumentTypesProps) {
  const headingId = service === "correction" ? "types-documents" : "types-traduction";

  return (
    <section id="corps" aria-labelledby={headingId} className={styles.section}>
      <div className={styles.inner}>
        <h2 id={headingId} className={styles.heading}>
          {service === "correction" ? "Pour quels types de documents ?" : "Quels types de documents ?"}
        </h2>
        <dl className={styles.list}>
          {documents.map((document) => (
            <div key={document.title} className={styles.document}>
              <dt className={styles.name}>{document.title}</dt>
              <dd className={styles.description}>{document[service]}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
