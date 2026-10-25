import type { MetadataRoute } from "next";
import { BlogConfigError, getPublishedBlogPosts } from "./lib/blog";
import { SITE_URL } from "./lib/seo";

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    "/",
    "/correction",
    "/traduction",
    "/qui-suis-je",
    "/contact",
    "/blog",
    "/mentions-legales",
    "/confidentialite",
  ].map((path) => ({ url: new URL(path, SITE_URL).toString() }));

  try {
    const articles = await getPublishedBlogPosts();

    return [
      ...pages,
      ...articles.map((article) => ({
        url: new URL(`/blog/${encodeURIComponent(article.slug)}`, SITE_URL).toString(),
        lastModified: article.updated_at,
      })),
    ];
  } catch (error) {
    if (error instanceof BlogConfigError) {
      return pages;
    }

    throw error;
  }
}
