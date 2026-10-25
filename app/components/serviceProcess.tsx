type ServiceProcessProps = {
  service: "correction" | "traduction";
};

export default function ServiceProcess({ service }: ServiceProcessProps) {
  const isCorrection = service === "correction";
  const steps = [
    {
      title: "Présentez votre projet",
      description:
        "Indiquez le type de document, sa longueur et votre échéance souhaitée dans le formulaire de contact. Vous pouvez m’envoyer votre texte ou un extrait par e-mail pour me permettre d’évaluer le travail nécessaire.",
    },
    {
      title: "Recevez votre devis gratuit",
      description:
        "Je vous propose un devis qui précise la prestation, le montant total et le délai de restitution. Nous convenons ensemble des modalités avant le début du travail.",
    },
    {
      title: isCorrection
        ? "Retrouvez votre texte corrigé"
        : "Retrouvez votre texte en français",
      description: isCorrection
        ? "Je corrige votre document dans le respect de votre style. Les commentaires vous permettent de comprendre les propositions qui demandent un choix ou une précision de votre part."
        : "Je vous remets une traduction relue, attentive au sens et au ton de votre texte. Pour une relecture après traduction, les corrections et les points à clarifier sont signalés dans le document.",
    },
  ];

  return (
    <section aria-labelledby="deroulement-titre" className="bg-white px-6 py-20">
      <div className="mx-auto max-w-6xl">
        <h2
          id="deroulement-titre"
          className="mb-12 text-center text-3xl font-bold text-brand-strong after:mx-auto after:mt-3 after:block after:h-1 after:w-[130px] after:bg-[#B76E79] after:content-['']"
        >
          Comment se déroule votre projet ?
        </h2>
        <ol className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-2xl border border-[#B76E79]/20 p-6">
              <span
                aria-hidden="true"
                className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#B76E79]/10 font-bold text-brand-strong"
              >
                {index + 1}
              </span>
              <h3 className="mb-3 text-lg font-semibold text-gray-800">{step.title}</h3>
              <p className="leading-relaxed text-gray-600">{step.description}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 grid gap-6 rounded-2xl bg-[#fbf7f7] p-6 sm:p-8 md:grid-cols-2">
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Formats et restitution</h3>
            <p className="leading-relaxed text-gray-600">
              {isCorrection
                ? "Pour un document Word (.docx), vous recevez une version avec le suivi des modifications et une version propre intégrant les corrections."
                : "La traduction est remise dans un document Word (.docx). Pour une relecture sur Word, vous recevez une version avec le suivi des modifications et une version propre."}{" "}
              Pour un PDF ou un autre format, nous précisons les modalités de
              travail et de livraison dans le devis.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-lg font-semibold text-gray-800">Délais et demandes particulières</h3>
            <p className="leading-relaxed text-gray-600">
              Le délai dépend de la longueur du texte, du travail nécessaire et
              de mes disponibilités. Indiquez votre échéance dès le premier
              échange : la date de restitution et les conditions d’une éventuelle
              demande urgente sont convenues avant votre accord.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
