import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MarkdownContent from "@/app/components/markdownContent";
import { getArticleImageUrl } from "@/app/lib/articleImages";
import { getPublishedBlogPostBySlug } from "@/app/lib/blog";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
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

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug).catch(() => null);

  if (!article) {
    return {
      title: "Article introuvable | Au mot juste",
    };
  }

  return {
    title: `${article.title} | Au mot juste`,
    description:
      article.excerpt ??
      "Article du blog Au mot juste sur la correction et la relecture.",
    alternates: {
      canonical: `https://aumotjuste-correction.fr/blog/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt ?? undefined,
      type: "article",
      publishedTime: article.published_at ?? undefined,
      images: article.cover_image_url ? [article.cover_image_url] : undefined,
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug).catch(() => null);

  if (!article) {
    notFound();
  }

  const date = formatDate(article.published_at);
  const headerImage = await getArticleImageUrl(
    article.cover_image_url,
    "/image-carnet-2.webp",
  );

  return (
    <article className="min-h-screen bg-white text-gray-900">
      <header
        className="relative min-h-[420px] overflow-hidden bg-cover bg-center pt-32 md:min-h-[520px]"
        style={{ backgroundImage: getBackgroundImage(headerImage) }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-white/25" />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[58%]"
          style={{
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.36) 48%, rgba(255,255,255,0.88) 82%, #ffffff 100%)",
          }}
        />
        {article.cover_image_source ? (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 rotate-90 rounded bg-gray-200/70 px-1 py-0.5 text-[10px] italic text-gray-700 origin-left">
            {article.cover_image_source}
          </div>
        ) : null}
      </header>

      <section className="mx-auto max-w-4xl px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <div>
          <Link
            href="/blog"
            className="inline-flex rounded-sm text-sm font-semibold text-[#B76E79] hover:text-[#a4626c]"
          >
            ← Retour au blog
          </Link>

          {date ? (
            <time
              dateTime={article.published_at ?? undefined}
              className="mt-8 block text-sm font-semibold uppercase tracking-[0.16em] text-[#B76E79]"
            >
              Publié le {date}
            </time>
          ) : null}

          <h1 className="mt-4 text-4xl font-bold leading-tight text-gray-900 md:text-5xl">
            {article.title}
          </h1>

          {article.excerpt ? (
            <p className="mt-8 border-l-4 border-[#B76E79] pl-5 text-lg leading-8 text-gray-700">
              {article.excerpt}
            </p>
          ) : null}
        </div>
      </section>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pb-10 sm:px-6 lg:grid-cols-[280px_minmax(0,760px)] lg:px-8">
        <aside className="order-2 lg:order-1">
          <section
            aria-labelledby="autrice-article"
            className="rounded-md bg-[#f7f7f7] p-6 lg:sticky lg:top-28"
          >
            <div className="grid gap-5 sm:grid-cols-[96px_1fr] sm:items-start lg:block">
              <Image
                src="/lorena-moi.png"
                alt="Portrait de Lorena Guedouani"
                width={96}
                height={96}
                className="h-24 w-24 rounded-full object-cover lg:h-28 lg:w-28"
              />

              <div>
                <div className="mt-0 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between lg:mt-5 lg:block">
                  <div>
                    <h2
                      id="autrice-article"
                      className="text-base font-bold text-[#B76E79]"
                    >
                      Lorena
                    </h2>
                    <div className="mt-2 h-px w-16 bg-gray-300" />
                  </div>

                  <Link
                    href="/blog"
                    className="text-sm text-gray-500 transition hover:text-[#B76E79]"
                  >
                    Voir plus d’articles →
                  </Link>
                </div>

                <p className="mt-5 text-sm leading-7 text-gray-700">
                  Correctrice-relectrice et passionnée de linguistique, je vous
                  partage ici des conseils pour rendre vos textes plus clairs,
                  plus fluides et plus justes. Avec Au mot juste, je vous
                  accompagne dans la correction, la relecture et la précision
                  rédactionnelle de vos écrits.
                </p>

                <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:items-start">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-600">
                    Correctrice-relectrice freelance
                  </p>
                  <Link
                    href="https://www.linkedin.com/in/lorena-guedouani/"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Profil LinkedIn de Lorena Guedouani"
                    className="inline-flex w-fit"
                  >
                    <Image
                      src="/linkedin.svg"
                      alt=""
                      aria-hidden="true"
                      width={22}
                      height={22}
                    />
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </aside>

        <div className="order-1 lg:order-2">
          <MarkdownContent content={article.content} />
        </div>
      </div>
    </article>
  );
}
