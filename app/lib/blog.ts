export type BlogStatus = "draft" | "published";

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_source: string | null;
  status: BlogStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
};

export type BlogPostPreview = Pick<
  BlogPost,
  | "id"
  | "title"
  | "slug"
  | "excerpt"
  | "cover_image_url"
  | "cover_image_source"
  | "published_at"
  | "created_at"
>;

export class BlogConfigError extends Error {}
export class BlogInputError extends Error {}
export class BlogDataError extends Error {}

const PUBLIC_FIELDS =
  "id,title,slug,excerpt,cover_image_url,cover_image_source,published_at,created_at";
const ARTICLE_FIELDS =
  "id,title,slug,excerpt,content,cover_image_url,cover_image_source,status,published_at,created_at,updated_at";

type RequestMode = "public" | "admin";

type SupabaseRequestOptions = RequestInit & {
  supabaseMode?: RequestMode;
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
};

type BlogPostMutation = {
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  cover_image_url: string | null;
  cover_image_source: string | null;
  status: BlogStatus;
  published_at: string | null;
};

function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  ).replace(/\/$/, "");
}

function getSupabaseKey(mode: RequestMode) {
  if (mode === "admin") {
    return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  }

  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    ""
  );
}

function getArticlesTableName() {
  return process.env.SUPABASE_BLOG_TABLE ?? "articles";
}

function getSupabaseConfig(mode: RequestMode) {
  const url = getSupabaseUrl();
  const key = getSupabaseKey(mode);

  if (!url) {
    throw new BlogConfigError("La variable NEXT_PUBLIC_SUPABASE_URL manque.");
  }

  if (!key) {
    throw new BlogConfigError(
      mode === "admin"
        ? "La variable SUPABASE_SERVICE_ROLE_KEY manque pour administrer le blog."
        : "La variable NEXT_PUBLIC_SUPABASE_ANON_KEY manque.",
    );
  }

  return { key, url };
}

function getSupabaseEndpoint(query: string, mode: RequestMode) {
  const { url } = getSupabaseConfig(mode);
  return `${url}/rest/v1/${getArticlesTableName()}${query}`;
}

async function supabaseRequest<T>(
  query: string,
  { supabaseMode = "public", headers, ...init }: SupabaseRequestOptions = {},
) {
  const { key } = getSupabaseConfig(supabaseMode);
  const requestHeaders = new Headers(headers);
  requestHeaders.set("apikey", key);
  requestHeaders.set("Authorization", `Bearer ${key}`);
  requestHeaders.set("Content-Type", "application/json");

  const response = await fetch(getSupabaseEndpoint(query, supabaseMode), {
    ...init,
    headers: requestHeaders,
  });

  if (!response.ok) {
    let details = "";

    try {
      const errorBody = (await response.json()) as { message?: string };
      details = errorBody.message ?? "";
    } catch {
      details = await response.text();
    }

    throw new BlogDataError(
      details || `Erreur Supabase (${response.status}).`,
    );
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

function buildQuery(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  return `?${searchParams.toString()}`;
}

function getString(
  value: unknown,
  fieldName: string,
  { required = false }: { required?: boolean } = {},
) {
  if (typeof value !== "string") {
    if (required) {
      throw new BlogInputError(`Le champ "${fieldName}" est obligatoire.`);
    }

    return "";
  }

  const trimmedValue = value.trim();

  if (required && !trimmedValue) {
    throw new BlogInputError(`Le champ "${fieldName}" est obligatoire.`);
  }

  return trimmedValue;
}

function optionalString(value: string) {
  return value.length > 0 ? value : null;
}

function getCoverImageUrl(value: string) {
  if (!value) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new BlogInputError("L'URL de l'image est invalide.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new BlogInputError("L'URL de l'image doit commencer par http ou https.");
  }

  return value;
}

export function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function sanitizeBlogPostPayload(input: unknown): BlogPostMutation {
  if (!input || typeof input !== "object") {
    throw new BlogInputError("Le contenu de l'article est invalide.");
  }

  const payload = input as Record<string, unknown>;
  const title = getString(payload.title, "title", { required: true });
  const slug = slugify(getString(payload.slug, "slug") || title);
  const content = getString(payload.content, "content", { required: true });
  const status: BlogStatus =
    payload.status === "published" ? "published" : "draft";
  const publishedAt = getString(payload.published_at, "published_at");

  if (!slug) {
    throw new BlogInputError("Le slug de l'article est obligatoire.");
  }

  return {
    title,
    slug,
    excerpt: optionalString(getString(payload.excerpt, "excerpt")),
    content,
    cover_image_url: getCoverImageUrl(
      getString(payload.cover_image_url, "cover_image_url"),
    ),
    cover_image_source: optionalString(
      getString(payload.cover_image_source, "cover_image_source"),
    ),
    status,
    published_at:
      status === "published"
        ? publishedAt || new Date().toISOString()
        : null,
  };
}

export async function getPublishedBlogPosts() {
  return supabaseRequest<BlogPostPreview[]>(
    buildQuery({
      select: PUBLIC_FIELDS,
      status: "eq.published",
      order: "published_at.desc.nullslast,created_at.desc",
    }),
    { next: { revalidate: 60 } },
  );
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const posts = await supabaseRequest<BlogPost[]>(
    buildQuery({
      select: ARTICLE_FIELDS,
      slug: `eq.${slug}`,
      status: "eq.published",
      limit: "1",
    }),
    { next: { revalidate: 60 } },
  );

  return posts[0] ?? null;
}

export async function getAllBlogPosts() {
  return supabaseRequest<BlogPost[]>(
    buildQuery({
      select: ARTICLE_FIELDS,
      order: "updated_at.desc,created_at.desc",
    }),
    { cache: "no-store", supabaseMode: "admin" },
  );
}

export async function createBlogPost(input: unknown) {
  const payload = sanitizeBlogPostPayload(input);
  const posts = await supabaseRequest<BlogPost[]>(
    buildQuery({ select: ARTICLE_FIELDS }),
    {
      method: "POST",
      body: JSON.stringify(payload),
      cache: "no-store",
      headers: {
        Prefer: "return=representation",
      },
      supabaseMode: "admin",
    },
  );

  return posts[0];
}

export async function updateBlogPost(id: string, input: unknown) {
  const payload = sanitizeBlogPostPayload(input);
  const posts = await supabaseRequest<BlogPost[]>(
    buildQuery({
      select: ARTICLE_FIELDS,
      id: `eq.${id}`,
    }),
    {
      method: "PATCH",
      body: JSON.stringify(payload),
      cache: "no-store",
      headers: {
        Prefer: "return=representation",
      },
      supabaseMode: "admin",
    },
  );

  return posts[0];
}

export async function deleteBlogPost(id: string) {
  await supabaseRequest<BlogPost[]>(
    buildQuery({
      select: "id",
      id: `eq.${id}`,
    }),
    {
      method: "DELETE",
      cache: "no-store",
      headers: {
        Prefer: "return=representation",
      },
      supabaseMode: "admin",
    },
  );
}
