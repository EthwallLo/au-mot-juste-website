import Image from "next/image";
import Link from "next/link";
import MarkdownContent from "@/app/components/markdownContent";
import NewsletterSignup from "@/app/components/newsletterSignup";
import type { BlogPost } from "@/app/lib/blog";

type BlogArticleProps = {
  article: Pick<
    BlogPost,
    "title" | "excerpt" | "content" | "cover_image_source" | "published_at"
  >;
  headerImage: string;
  onBack?: () => void;
  newsletterEnabled?: boolean;
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

export default function BlogArticle({ article, headerImage, onBack, newsletterEnabled = false }: BlogArticleProps) {
  const date = formatDate(article.published_at);

  return (
    <article className="min-h-screen bg-white text-gray-900 [overflow-wrap:anywhere]">
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
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              className="inline-flex rounded-sm text-sm font-semibold text-brand-strong hover:text-brand-hover"
            >
              ← Revenir à la rédaction
            </button>
          ) : (
            <Link
              href="/blog"
              className="inline-flex rounded-sm text-sm font-semibold text-brand-strong hover:text-brand-hover"
            >
              ← Retour au blog
            </Link>
          )}

          {date ? (
            <time
              dateTime={article.published_at ?? undefined}
              className="mt-8 block text-sm font-semibold uppercase tracking-[0.16em] text-brand-strong"
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

      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-4 pb-10 sm:px-6 lg:grid-cols-[280px_minmax(0,760px)] lg:px-8">
        <aside className="order-2 lg:order-1">
          <div className="space-y-6 lg:sticky lg:top-28 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto">
            <section
              aria-labelledby="autrice-article"
              className="rounded-md bg-[#f7f7f7] p-6"
            >
              <div className="grid gap-5 sm:grid-cols-[96px_1fr] sm:items-start lg:block">
                <Image
                  src="/optimized/lorena-moi.webp"
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
                        className="text-base font-bold text-brand-strong"
                      >
                        Lorena
                      </h2>
                      <div className="mt-2 h-px w-16 bg-gray-300" />
                    </div>

                    <Link
                      href="/blog"
                      target={onBack ? "_blank" : undefined}
                      rel={onBack ? "noopener noreferrer" : undefined}
                      className="text-sm text-gray-500 transition hover:text-brand-strong"
                    >
                      Voir plus d’articles →
                    </Link>
                  </div>

                  <p className="mt-5 text-sm leading-7 text-gray-700">
                    Correctrice-relectrice et passionnée de linguistique, je partage
                    mes conseils pour des textes clairs et soignés.
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
            {newsletterEnabled ? (
              <div id="newsletter-article" className="rounded-md border border-gray-200 bg-white p-5">
                <NewsletterSignup variant="sidebar" preview={Boolean(onBack)} />
              </div>
            ) : null}
          </div>
        </aside>

        <div className="order-1 min-w-0 lg:order-2">
          <MarkdownContent content={article.content} />
        </div>
      </div>
    </article>
  );
}
