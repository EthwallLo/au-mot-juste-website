"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/card";

const experiences = [
  {
    title: "Ingénieure développeuse",
    company: "Schneider Electric, ESRF, Eviden",
    location: "Grenoble, France",
    period: "Septembre 2018 - Aujourd’hui",
    type: "CDI",
    description:
      "Développement d’applications, d’interfaces logicielles et de sites web. Participation à l’analyse fonctionnelle, au prototypage d’interfaces utilisateurs, à l’implémentation de fonctionnalités back-end et front-end (PHP/Symfony, C#, WPF, Python), ainsi qu’à l’automatisation de scripts, la mise en place de tests et de CI/CD dans des environnements exigeants.",
  },
  {
    title: "Responsable, rédactrice et correctrice",
    company: "Workyt",
    location: "France (À distance)",
    period: "2023 - Aujourd’hui",
    type: "Bénévolat",
    description:
      "Participation à la création de contenus pédagogiques et rédactionnels pour une plateforme éducative. Le rôle comprend la rédaction d’articles, la préparation de cours ainsi que la relecture et la correction avant publication de cours et d'articles rédigés par les bénévoles de l'association.",
  },
  {
    title: "Rédactrice",
    company: "Sciences for Girls",
    location: "France (À distance)",
    period: "2024",
    type: "Bénévolat",
    description:
      "Rédaction de portraits vulgarisés mettant en lumière des femmes ayant marqué l’histoire scientifique et technologique. Recherche documentaire, synthèse d’informations et rédaction d’articles en français et en anglais accessibles à un public large.",
  },
  {
    title: "Traductrice et relectrice",
    company: "Solinum",
    location: "France (À distance)",
    period: "2021 - Aujourd’hui",
    type: "Bénévolat",
    description:
      "Aide à la traduction de contenus pour le site internet soliguide.fr, plateforme qui référence les lieux et services utiles aux personnes en difficultés. Traduction et vérification des traductions déjà soumises automatiquement, validation et correction si nécessaire. Langues traduites : Anglais, Espagnol, Français.",
  },
];

const formations = [
  {
    title: "Licence Sciences du langage mineure Anglais (Bac+3)",
    institution: "Université Sorbonne Nouvelle",
    period: "2026 (en cours)",
    icon: "/ecole-rose.svg",
  },
  {
    title: "Certification en langue française niveau expert",
    institution: "École Française de Lecteur-Correcteur",
    period: "2025",
    icon: "/plume-rose.svg",
  },
  {
    title: "Master Management des Systèmes d'Information (Bac+5)",
    institution: "Grenoble École de Management",
    period: "2023",
    icon: "/ecole-rose.svg",
  },
  {
    title: "Bachelor Responsable en ingénierie des logiciels (Bac+3)",
    institution: "CESI",
    period: "2021",
    icon: "/ecole-rose.svg",
  },
];

const diplomes = [
  {
    title: "JLPT N4 – Japanese Language Proficiency Test",
    period: "2026",
    icon: "/langue.svg",
  },
  {
    title: "Certification Le Robert",
    period: "2025",
    icon: "/certificat.svg",
  },
  {
    title: "TOEIC – Test of English for International Communication (960/990)",
    period: "2023",
    icon: "/langue.svg",
  },
  {
    title: "Introduction à l'accessibilité et au design inclusif",
    period: "2023",
    icon: "/certificat.svg",
  },
  {
    title: "TOPIK I – Test of Proficiency in Korean",
    period: "2021",
    icon: "/langue.svg",
  },
  {
    title: "JLPT N5 – Japanese Language Proficiency Test",
    period: "2016",
    icon: "/langue.svg",
  },
];

export default function QuiSuisJePage() {
  return (
    <div className="w-full flex flex-col">
      <section
        id="phototitre"
        aria-labelledby="qui-suis-je-titre"
        className="relative w-full h-[45vh] flex justify-center items-center"
        style={{
          backgroundImage: "url('/image-pc.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="relative z-10 text-center px-6 flex flex-col items-center">
          <h1 id="qui-suis-je-titre" className="text-4xl md:text-5xl font-bold text-gray-800 after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-800 after:mt-3 after:mx-auto">
            Qui suis-je ?
          </h1>
        </div>
        <div aria-hidden="true" className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-b from-transparent to-white pointer-events-none"></div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Minh Pham / Unsplash
        </div>
      </section>

      <section id="a-propos" aria-labelledby="a-propos-lorena" className="relative bg-white min-h-[50vh] pt-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 px-6">
          <div className="md:w-1/2">
            <h2 id="a-propos-lorena" className="text-3xl font-bold mb-10 text-[#B76E79] relative after:content-[''] after:block after:w-[130px] after:h-1 after:bg-[#B76E79] after:mt-3">
              Moi, c&apos;est Lorena
            </h2>
            <p className="text-gray-700 mb-6">
              Diplômée d’un master en informatique et management, je conjugue rigueur scientifique et passion pour les langues et la littérature. Depuis plusieurs années, je développe des applications et interfaces logicielles, mais ce qui me motive le plus, c’est comprendre, analyser et transmettre l’information, que ce soit à travers le code ou les mots.
            </p>
            <p className="text-gray-700 mb-6">
              Amoureuse des langues et curieuse du monde, je lis, analyse et corrige des textes en français comme en anglais, et je perfectionne mon japonais et mon coréen pour explorer toujours de nouveaux horizons linguistiques.
            </p>
            <p className="text-gray-700 mb-6">
              En 2026, je me lance comme correctrice‑relectrice freelance, accompagnant écrivains et professionnels de l’écriture dans la production de textes clairs, précis et élégants. Rigoureuse et attentive au style, je veille à ce que chaque texte conserve sa voix tout en atteignant l’excellence.
            </p>
          </div>
          <div className="md:w-1/2 flex justify-center">
            <img src="/lorena-moi.png" alt="Portrait de Lorena Guedouani" className="w-[500px]" />
          </div>
        </div>
      </section>

      <section id="formations" aria-labelledby="formations-titre" className="bg-white py-12">
        <div className="max-w-5xl mx-auto px-6 space-y-6">
          <h2 id="formations-titre" className="text-2xl font-bold text-[#B76E79] mb-8 text-center">
            Formations
          </h2>
          {formations.map((item, i) => (
            <Card
              key={i}
              className="group border-[#B76E79]/30 bg-white shadow-md hover:shadow-lg transition"
            >
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#B76E79]/10 flex items-center justify-center">
                      <img src={item.icon} className="w-6" alt="" aria-hidden="true" />
                    </div>
                    <div>
                      <CardTitle className="text-gray-800 text-lg">
                        {item.title}
                      </CardTitle>
                      <CardDescription className="text-[#B76E79] font-medium">
                        {item.institution}
                      </CardDescription>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 font-medium">
                    {item.period}
                  </span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </section>

      <section id="experiences" aria-labelledby="experiences-titre" className="bg-white py-12">
        <div className="max-w-6xl mx-auto px-6 space-y-6">
          <h2 id="experiences-titre" className="text-2xl font-bold text-[#B76E79] mb-8 text-center">
            Expériences
          </h2>
          {experiences.map((exp, i) => (
            <Card
              key={i}
              className="group border-[#B76E79]/30 bg-white shadow-md hover:shadow-lg transition"
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg text-gray-800 mb-2">
                      {exp.title}
                    </CardTitle>
                    <CardDescription className="text-[#B76E79] font-medium mb-2">
                      {exp.company}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center text-sm text-gray-500 gap-1">
                      <img src="/calendrier.svg" className="w-4 h-4" alt="" aria-hidden="true" />
                      <span className="sr-only">Période : </span>
                      {exp.period}
                    </div>
                    <div className="flex items-center text-sm text-gray-500 gap-1">
                      <img src="/pin.svg" className="w-4 h-4" alt="" aria-hidden="true" />
                      <span className="sr-only">Lieu : </span>
                      {exp.location}
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#B76E79]/10 text-[#B76E79] border border-[#B76E79]/20">
                      {exp.type}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 mb-4 leading-relaxed">
                  {exp.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="diplomes" aria-labelledby="diplomes-titre" className="bg-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 id="diplomes-titre" className="text-2xl font-bold text-[#B76E79] mb-8 text-center">
            Diplômes & Certifications
          </h2>

          <Card className="group card-hover">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {diplomes.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-[#B76E79]/50 transition-all duration-300 hover:bg-[#B76E79]/5"
                  >
                    <div className="w-2 h-2 bg-[#B76E79] rounded-full mr-3 shrink-0" />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {item.icon && (
                          <img
                            src={item.icon}
                            className="w-4 h-4"
                            alt=""
                            aria-hidden="true"
                          />
                        )}
                        <span className="text-sm text-gray-800 font-semibold">
                          {item.title}
                          {item.period && (
                            <span className="text-xs text-gray-400 ml-2">
                              ({item.period})
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
