import Typewriter from "./components/typewriter";
import ScrollButton from "./components/scrollButton";
import ParcoursButton from "./components/parcoursButton";
import CorrectionButton from "./components/correctionButton";
import { getArticleImageUrl } from "./lib/articleImages";
import { getPublishedBlogPosts } from "./lib/blog";
import type { BlogPostPreview } from "./lib/blog";
import Link from "next/link";
import Image from "next/image";

function formatArticleDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(value));
}

function getBackgroundImage(url: string) {
  return `url(${JSON.stringify(url)})`;
}

export default async function HomePage() {
  let latestArticles: BlogPostPreview[] = [];

  try {
    latestArticles = (await getPublishedBlogPosts()).slice(0, 3);
  } catch {
    latestArticles = [];
  }

  const latestArticleImages = new Map(
    await Promise.all(
      latestArticles.map(async (article) => [
        article.id,
        await getArticleImageUrl(article.cover_image_url, "/image-carnet.webp"),
      ] as const),
    ),
  );
  const latestArticlesGridClass =
    latestArticles.length === 1
      ? "grid gap-6 md:mx-auto md:max-w-xl"
      : latestArticles.length === 2
        ? "grid gap-6 md:mx-auto md:max-w-4xl md:grid-cols-2"
        : "grid gap-6 md:grid-cols-3";

  return (
    <div>
      <section className="sr-only">
        <h1 className="sr-only">
          Au mot juste | Correction, relecture et réécriture professionnelle
        </h1>
        <p className="sr-only">
          Correctrice freelance spécialisée en relecture professionnelle et correction de textes. J’améliore l’orthographe, la grammaire, la syntaxe et le style de vos écrits : manuscrits, CV, documents professionnels et contenus web.
        </p>
      </section>

      <section
        aria-labelledby="accueil-hero"
        className="w-full relative min-h-screen md:min-h-screen flex justify-center items-center bg-cover bg-center"
        style={{ backgroundImage: "url('/image-carnet.webp')" }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6 md:px-12">
          <Typewriter />
          <p id="accueil-hero" className="md:text-xl text-base leading-relaxed max-w-2xl mx-auto mb-2 text-gray-600 font-medium">
            Lorena Guedouani - Correction et relecture professionnelle
          </p>
          <p className="text-md md:text-lg max-w-2xl mx-auto text-gray-600">
            Je vous accompagne dans la correction de vos écrits.
          </p>
          <ScrollButton />
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Jess Bailey / Unsplash
        </div>
      </section>

      <section
        id="decouvrir"
        aria-labelledby="pourquoi-correctrice"
        className="relative justify-center items-center bg-white"
        style={{ minHeight: "40vh", paddingTop: "5rem", paddingBottom: "5rem" }}
      >
        <h2
          id="pourquoi-correctrice"
          className="text-2xl sm:text-3xl font-bold mb-10 text-[#B76E79] relative text-center
          after:content-[''] after:block after:w-[130px] after:h-1 after:bg-[#B76E79] after:mt-3 after:mx-auto"
        >
          Pourquoi faire appel à une correctrice-relectrice ?
        </h2>

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:px-12 px-6 text-center md:text-left">
          <div>
            <p className="text-center text-gray-700 mb-6 leading-relaxed">
              Même lorsqu’on maîtrise parfaitement la langue, il est extrêmement
              difficile de repérer ses propres erreurs : notre cerveau anticipe
              ce que l’on veut dire et ne voit plus les fautes, les maladresses
              ou les incohérences qui peuvent s’y glisser.
            </p>

            <p className="text-center text-gray-700 leading-relaxed">
              Que vous soyez étudiant, professionnel ou auteur, la qualité de
              vos écrits influence fortement la façon dont on perçoit votre
              sérieux et vos compétences. Un document avec quelques erreurs
              suffit parfois à décrédibiliser un travail pourtant solide.
            </p>
          </div>

          <div>
            <p className="text-center text-gray-700 mb-6 leading-relaxed">
              La correction ne se limite pas à enlever les fautes. C’est un
              véritable travail de précision : harmonisation de la typographie,
              amélioration de la fluidité des phrases, reformulations douces
              pour rendre le texte plus clair, suppression des répétitions et
              vérification de la cohérence d’ensemble.
            </p>

            <p className="text-center text-gray-700 leading-relaxed">
              Faire appel à une correctrice-relectrice, c’est donc investir dans
              une communication plus claire, plus percutante et plus
              professionnelle. C’est l’assurance d’un texte qui reflète
              réellement votre intention, vos compétences et votre exigence.
            </p>
          </div>
        </div>
      </section>

      <section
        id="a-propos"
        aria-labelledby="a-propos-titre"
        className="relative bg-gray-100"
        style={{
          backgroundImage: "url('/image-bureau.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          minHeight: "80vh",
          paddingTop: "11rem",
        }}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-8 md:px-12 px-6">
          <div className="md:w-1/2">
            <h2 id="a-propos-titre" className="text-3xl font-bold mb-6 text-gray-600 relative after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-600 after:mt-3">
              À propos de moi
            </h2>
            <p className="text-gray-700 mb-6">
              Je m&apos;appelle Lorena et je suis passionnée de linguistique.{" "}
            </p>
            <p className="text-gray-700 mb-6">
              Je souhaite aujourd&apos;hui accompagner les particuliers et
              professionnels dans la correction et la relecture de leurs
              documents pour leur permettre de communiquer de manière claire,
              précise et élégante.{" "}
            </p>
            <p className="text-gray-700 mb-6">
              Mon objectif est de faire ressortir le meilleur de vos textes tout
              en respectant votre style et votre voix.
            </p>
            <ParcoursButton />
          </div>

          <div className="md:w-1/2 flex justify-center">
            <img
              src="/cadre-lorena.webp"
              alt="Portrait de Lorena Guedouani"
              className="w-full max-w-sm md:w-[500px] rounded-lg mx-auto"
            />
          </div>
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Andrej Lišakov / Unsplash
        </div>
      </section>

      <section
        id="public"
        aria-labelledby="services-public"
        className="relative justify-center items-center bg-white"
        style={{ paddingTop: "5rem", paddingBottom: "5rem" }}
      >
        <h2
          id="services-public"
          className="text-3xl font-bold mb-10 text-[#B76E79] relative text-center
          after:content-[''] after:block after:w-[130px] after:h-1 after:bg-[#B76E79] after:mt-3 after:mx-auto"
        >
          À qui s’adressent mes services ?
        </h2>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 md:px-12 text-center">
          <div className="flex flex-col items-center">
            <img
              src="/auteur.svg"
              alt=""
              aria-hidden="true"
              className="w-20 mx-auto mb-6 opacity-90"
            />
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Auteurs
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Correction professionnelle complète : orthographe, ponctuation,
              syntaxe, cohérence et style pour votre roman, recueil, récit ou
              manuscrit en cours d’écriture.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <img
              src="/personne.svg"
              alt=""
              aria-hidden="true"
              className="w-20 mx-auto mb-6 opacity-90"
            />
            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Particuliers
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Relecture, correction, mise en page et reformulation de vos
              courriers, CV, lettres, dossiers VAE, documents administratifs ou
              personnels.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <img
              src="/pro.svg"
              alt=""
              aria-hidden="true"
              className="w-20 mx-auto mb-6 opacity-90"
            />

            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Professionnels
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Correction, harmonisation, rewriting et perfectionnement de vos
              supports écrits : brochures, sites web, newsletters, rapports,
              communication interne ou commerciale.
            </p>
          </div>

          <div className="flex flex-col items-center">
            <img
              src="/maison.svg"
              alt=""
              aria-hidden="true"
              className="w-20 mx-auto mb-6 opacity-90"
            />

            <h3 className="text-xl font-semibold mb-3 text-gray-800">
              Maisons d’édition
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Préparation de copie, correction typographique, orthographique et
              grammaticale, ainsi que réécriture pour vos ouvrages à paraître ou
              vos collections.
            </p>
          </div>
        </div>
      </section>

      <section
        id="prestations"
        aria-labelledby="prestations-titre"
        className="relative justify-center items-center"
        style={{
          backgroundImage: "url('/image-carnet-2.webp')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          minHeight: "70vh",
          paddingTop: "8rem",
          paddingBottom: "5rem",
        }}
      >
        <h2 id="prestations-titre" className="text-3xl font-bold mb-12 text-gray-600 relative after:content-[''] after:block after:w-[130px] after:h-1 after:bg-gray-600 after:mt-3 text-center after:mx-auto">
          Mes prestations
        </h2>
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
          <div className="bg-white shadow-md rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <img
              src="/plume.svg"
              alt=""
              aria-hidden="true"
              className="w-20 mx-auto mb-6 opacity-90"
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Correction et relecture
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Une correction complète incluant orthographe, grammaire, syntaxe,
              ponctuation, mais aussi reformulation lorsque cela est nécessaire
              afin d’assurer un texte fluide, clair et professionnel.
            </p>
            <div className="mt-auto">
              <CorrectionButton />
            </div>
          </div>
          <div className="bg-white shadow-md rounded-2xl p-8 text-center hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <Image
              src="/langue.svg"
              alt=""
              aria-hidden="true"
              className="w-20 mx-auto mb-6 opacity-90 grayscale brightness-75"
              width={80}
              height={80}
            />
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Traduction
            </h3>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Traduction de textes de l&apos;anglais vers le français, puis
              relecture attentive du texte traduit afin d&apos;en vérifier la
              justesse, la fluidité, la cohérence et le ton. L&apos;objectif est
              d&apos;obtenir un texte naturel, clair et fidèle à votre intention.
            </p>
            <div className="mt-auto">
              <Link
                href="/traduction"
                className="inline-flex px-6 py-3 bg-[#B76E79] text-white rounded-md hover:bg-[#a4626c] transition-colors duration-300"
              >
                En savoir plus
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-200/50 text-gray-700 text-[10px] italic px-1 py-0.5 rounded rotate-90 origin-left">
          Photo : Jess Bailey / Unsplash
        </div>
      </section>

      <section
        id="derniers-articles"
        aria-labelledby="derniers-articles-titre"
        className="bg-white px-6 py-20 md:px-12"
      >
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B76E79]">
                Carnet de correction
              </p>
              <h2
                id="derniers-articles-titre"
                className="mt-3 text-3xl font-bold text-gray-800 after:mt-3 after:block after:h-1 after:w-[130px] after:bg-[#B76E79] after:content-['']"
              >
                Derniers articles
              </h2>
            </div>

            <Link
              href="/blog"
              className="inline-flex w-fit rounded-md border border-[#B76E79] px-5 py-3 text-sm font-semibold text-[#B76E79] transition hover:bg-[#B76E79] hover:text-white"
            >
              Voir le blog
            </Link>
          </div>

          {latestArticles.length === 0 ? (
            <div className="mx-auto max-w-2xl border-l-4 border-[#B76E79] bg-[#fbf7f7] px-6 py-5 text-gray-700">
              Les premiers articles arrivent bientôt. Je prépare des conseils
              autour de la correction, de la relecture et de l&apos;écriture pour
              vous aider à rendre vos textes plus clairs, plus fluides et plus
              justes.
            </div>
          ) : (
            <div className={latestArticlesGridClass}>
              {latestArticles.map((article) => {
                const date = formatArticleDate(article.published_at);
                const articleImage =
                  latestArticleImages.get(article.id) ?? "/image-carnet.webp";

                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="group flex h-full flex-col overflow-hidden rounded-md border border-[#eadbdd] bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#B76E79]/60 hover:shadow-md"
                  >
                    <article className="flex h-full flex-col">
                      <div
                        className="relative h-48 bg-cover bg-center"
                        style={{
                          backgroundImage: getBackgroundImage(articleImage),
                        }}
                      >
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 bg-[#B76E79]/10"
                        />
                        {article.cover_image_source ? (
                          <div className="absolute left-2 top-1/2 -translate-y-1/2 rotate-90 rounded bg-gray-200/70 px-1 py-0.5 text-[10px] italic text-gray-700 origin-left">
                            {article.cover_image_source}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        {date ? (
                          <time
                            dateTime={article.published_at ?? undefined}
                            className="text-sm font-semibold text-[#B76E79]"
                          >
                            {date}
                          </time>
                        ) : null}
                        <h3 className="mt-3 text-xl font-semibold leading-snug text-gray-900 transition group-hover:text-[#B76E79]">
                          {article.title}
                        </h3>
                        {article.excerpt ? (
                          <p className="mt-4 line-clamp-4 text-sm leading-7 text-gray-600">
                            {article.excerpt}
                          </p>
                        ) : null}
                        <span className="mt-6 inline-flex text-sm font-semibold text-[#B76E79]">
                          Lire l&apos;article
                        </span>
                      </div>
                    </article>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
