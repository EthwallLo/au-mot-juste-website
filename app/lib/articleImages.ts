const IMAGE_EXTENSION_PATTERN = /\.(avif|gif|jpe?g|png|webp)(\?.*)?$/i;

function decodeHtmlAttribute(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function getMetaContent(html: string, attributeName: "property" | "name", key: string) {
  const pattern = new RegExp(
    `<meta[^>]+${attributeName}=["']${key}["'][^>]+content=["']([^"']+)["'][^>]*>`,
    "i",
  );
  const reversePattern = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attributeName}=["']${key}["'][^>]*>`,
    "i",
  );
  const match = html.match(pattern) ?? html.match(reversePattern);
  return match?.[1] ? decodeHtmlAttribute(match[1]) : null;
}

function isLikelyDirectImageUrl(url: URL) {
  return (
    IMAGE_EXTENSION_PATTERN.test(url.pathname) ||
    url.hostname === "images.unsplash.com" ||
    url.pathname.includes("/storage/v1/object/public/")
  );
}

async function getOpenGraphImageUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
      },
      next: {
        revalidate: 60 * 60 * 24,
      },
    });

    if (!response.ok) {
      return null;
    }

    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.startsWith("image/")) {
      return url;
    }

    const html = await response.text();
    return (
      getMetaContent(html, "property", "og:image") ??
      getMetaContent(html, "name", "twitter:image") ??
      null
    );
  } catch {
    return null;
  }
}

export async function getArticleImageUrl(
  value: string | null,
  fallbackUrl: string,
) {
  if (!value) {
    return fallbackUrl;
  }

  if (value.startsWith("/")) {
    return value;
  }

  try {
    const url = new URL(value);

    if (!["http:", "https:"].includes(url.protocol)) {
      return fallbackUrl;
    }

    if (isLikelyDirectImageUrl(url)) {
      return value;
    }

    return (await getOpenGraphImageUrl(value)) ?? fallbackUrl;
  } catch {
    return fallbackUrl;
  }
}

