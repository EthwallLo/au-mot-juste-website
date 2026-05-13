import type { Metadata } from "next";
import Link from "next/link";
import { getArticleImageUrl } from "@/app/lib/articleImages";
import { getPublishedBlogPosts } from "@/app/lib/blog";
import type { BlogPostPreview } from "@/app/lib/blog";

export const metadata: Metadata = {
  title: "Blog | Au mot juste",
  description:
    "Conseils de correction, relecture, écriture et clarté rédactionnelle par Au mot juste.",
  alternates: {
    canonical: "https://aumotjuste-correction.fr/blog",
  },
};

function formatDate(value: string | null) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getBackgroundImage(url: string) {
  return `url(${JSON.stringify(url)})`;
}

export default async function BlogPage() {
  let articles: BlogPostPreview[] = [];

  try {
    articles = await getPublishedBlogPosts();
  } catch {
    articles = [];
  }

  const featuredArticle = articles[0] ?? null;
  const otherArticles = articles.slice(1);
  const featuredImage = featuredArticle
    ? await getArticleImageUrl(
        featuredArticle.cover_image_url,
        "/image-carnet.webp",
      )
    : "/image-carnet.webp";
  const otherArticleImages = new Map(
    await Promise.all(
      otherArticles.map(async (article) => [
        article.id,
        await getArticleImageUrl(article.cover_image_url, ""),
      ] as const),
    ),
  );

  return (
    <div className="w-full min-h-screen bg-white text-gray-900">
      <section
        aria-labelledby="blog-titre"
        className="relative flex min-h-[420px] items-end overflow-hidden bg-cover bg-center pb-14 pt-32"
        style={{ backgroundImage: "url('/image-carnet-2.webp')" }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-white/55" />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 right-0 h-28 bg-linear-to-b from-transparent to-white"
        />

        <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-8 px-6 md:grid-cols-[0.85fr_1.15fr] md:items-end md:px-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#B76E79]">
              Carnet de correction
            </p>
            <h1
              id="blog-titre"
              className="mt-4 text-4xl font-bold leading-tight text-gray-800 after:mt-5 after:block after:h-1 after:w-[130px] after:bg-[#B76E79] after:content-[''] md:text-5xl"
            >
              Le blog
            </h1>
          </div>

          <div aria-hidden="true" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 pt-10 sm:px-6 lg:px-8">
        {articles.length === 0 ? (
          <div className="mx-auto max-w-2xl border-l-4 border-[#B76E79] bg-[#fbf7f7] px-6 py-5 text-gray-700">
            Les premiers articles arrivent bientôt.
          </div>
        ) : (
          <div className="space-y-12">
            {featuredArticle ? (
              <article className="grid overflow-hidden rounded-md border border-[#eadbdd] bg-[#fbf7f7] shadow-sm md:grid-cols-[0.42fr_0.58fr]">
                <div
                  className="relative min-h-[260px] bg-cover bg-center md:min-h-full"
                  style={{
                    backgroundImage: getBackgroundImage(featuredImage),
                  }}
                >
                  <div aria-hidden="true" className="absolute inset-0 bg-[#B76E79]/20" />
                  <div className="absolute bottom-5 left-5 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-[#B76E79] shadow-sm">
                    À la une
                  </div>
                  {featuredArticle.cover_image_source ? (
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 rotate-90 rounded bg-gray-200/70 px-1 py-0.5 text-[10px] italic text-gray-700 origin-left">
                      {featuredArticle.cover_image_source}
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col justify-center p-7 sm:p-9 lg:p-12">
                  {formatDate(featuredArticle.published_at) ? (
                    <time
                      dateTime={featuredArticle.published_at ?? undefined}
                      className="text-sm font-semibold uppercase tracking-[0.16em] text-[#B76E79]"
                    >
                      {formatDate(featuredArticle.published_at)}
                    </time>
                  ) : null}
                  <h2 className="mt-4 text-3xl font-bold leading-tight text-gray-900 md:text-4xl">
                    <Link
                      href={`/blog/${featuredArticle.slug}`}
                      className="rounded-sm hover:text-[#B76E79]"
                    >
                      {featuredArticle.title}
                    </Link>
                  </h2>
                  {featuredArticle.excerpt ? (
                    <p className="mt-5 max-w-2xl text-base leading-8 text-gray-700">
                      {featuredArticle.excerpt}
                    </p>
                  ) : null}
                  <Link
                    href={`/blog/${featuredArticle.slug}`}
                    className="mt-8 inline-flex w-fit rounded-md bg-[#B76E79] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#a4626c]"
                  >
                    Lire l’article
                  </Link>
                </div>
              </article>
            ) : null}

            {otherArticles.length > 0 ? (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 after:mt-3 after:block after:h-1 after:w-[100px] after:bg-[#B76E79] after:content-['']">
                  Derniers articles
                </h2>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  {otherArticles.map((article) => {
                    const date = formatDate(article.published_at);
                    const articleImage = otherArticleImages.get(article.id);

                    return (
                      <Link
                        key={article.id}
                        href={`/blog/${article.slug}`}
                        className="group block overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#B76E79]/60 hover:shadow-md"
                      >
                        <article>
                          {articleImage ? (
                            <div
                              className="relative h-36 bg-cover bg-center"
                              style={{
                                backgroundImage:
                                  getBackgroundImage(articleImage),
                              }}
                            >
                              {article.cover_image_source ? (
                                <div className="absolute left-2 top-1/2 -translate-y-1/2 rotate-90 rounded bg-gray-200/70 px-1 py-0.5 text-[10px] italic text-gray-700 origin-left">
                                  {article.cover_image_source}
                                </div>
                              ) : null}
                            </div>
                          ) : null}

                          <div className="p-6">
                            {date ? (
                              <time
                                dateTime={article.published_at ?? undefined}
                                className="text-sm font-medium text-[#B76E79]"
                              >
                                {date}
                              </time>
                            ) : null}
                            <h3 className="mt-3 text-xl font-semibold leading-snug text-gray-900 transition group-hover:text-[#B76E79]">
                              {article.title}
                            </h3>
                            {article.excerpt ? (
                              <p className="mt-4 text-sm leading-7 text-gray-600">
                                {article.excerpt}
                              </p>
                            ) : null}
                          </div>
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
