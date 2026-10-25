import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogArticle from "@/app/components/blogArticle";
import { getArticleImageUrl } from "@/app/lib/articleImages";
import { getPublishedBlogPostBySlug } from "@/app/lib/blog";
import { createPageMetadata, SITE_NAME, SITE_URL } from "@/app/lib/seo";

type BlogArticlePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: BlogArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug).catch(() => null);

  if (!article) {
    return {
      title: "Article introuvable | Au mot juste",
      robots: { index: false, follow: false },
    };
  }

  const description =
    article.excerpt ??
    "Article du blog Au mot juste sur la correction et la relecture.";
  const path = `/blog/${encodeURIComponent(article.slug)}`;
  const image = await getArticleImageUrl(
    article.cover_image_url,
    "/optimized/image-carnet-2.avif",
  );

  return {
    ...createPageMetadata({
      title: `${article.title} | Au mot juste`,
      description,
      path,
    }),
    openGraph: {
      title: article.title,
      description,
      url: new URL(path, SITE_URL).toString(),
      siteName: SITE_NAME,
      locale: "fr_FR",
      type: "article",
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      authors: ["Lorena Guedouani"],
      images: [{ url: image, alt: article.title }],
    },
  };
}

export default async function BlogArticlePage({ params }: BlogArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedBlogPostBySlug(slug).catch(() => null);

  if (!article) {
    notFound();
  }

  const headerImage = await getArticleImageUrl(
    article.cover_image_url,
    "/optimized/image-carnet-2.avif",
  );

  return <BlogArticle article={article} headerImage={headerImage} />;
}
