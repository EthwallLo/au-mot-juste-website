"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlogPost, BlogStatus } from "@/app/lib/blog";

type AdminBlogManagerProps = {
  initialPosts: BlogPost[];
  setupError?: string;
};

type ArticleFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image_url: string;
  cover_image_source: string;
  status: BlogStatus;
  published_at: string;
};

const emptyForm: ArticleFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  cover_image_url: "",
  cover_image_source: "",
  status: "draft",
  published_at: "",
};

const PARIS_TIME_ZONE = "Europe/Paris";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeSlugInput(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");
}

function formatDate(value: string | null) {
  if (!value) {
    return "Brouillon";
  }

  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getParisParts(date: Date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

function toDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const parts = getParisParts(new Date(value));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function getParisOffsetMs(date: Date) {
  const parts = getParisParts(date);
  const parisAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return parisAsUtc - date.getTime();
}

function parisDateTimeInputToIso(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return "";
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcDate = new Date(localAsUtc - getParisOffsetMs(new Date(localAsUtc)));

  utcDate = new Date(localAsUtc - getParisOffsetMs(utcDate));
  return utcDate.toISOString();
}

function currentParisDateTimeInput() {
  return toDateTimeInput(new Date().toISOString());
}

function toFormState(article: BlogPost): ArticleFormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content,
    cover_image_url: article.cover_image_url ?? "",
    cover_image_source: article.cover_image_source ?? "",
    status: article.status,
    published_at: toDateTimeInput(article.published_at),
  };
}

function serializeForm(form: ArticleFormState) {
  return {
    ...form,
    slug: slugify(form.slug || form.title),
    published_at: form.published_at
      ? parisDateTimeInputToIso(form.published_at)
      : "",
  };
}

export default function AdminBlogManager({
  initialPosts,
  setupError,
}: AdminBlogManagerProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialPosts[0]?.id ?? null,
  );
  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedId) ?? null,
    [posts, selectedId],
  );
  const [form, setForm] = useState<ArticleFormState>(
    selectedPost ? toFormState(selectedPost) : emptyForm,
  );
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  function selectPost(article: BlogPost) {
    setSelectedId(article.id);
    setForm(toFormState(article));
    setMessage("");
  }

  function startNewArticle() {
    setSelectedId(null);
    setForm(emptyForm);
    setMessage("");
  }

  function updateForm<K extends keyof ArticleFormState>(
    key: K,
    value: ArticleFormState[K],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
      ...(key === "title" && !selectedId && !currentForm.slug
        ? { slug: slugify(String(value)) }
        : {}),
      ...(key === "status" &&
      value === "published" &&
      !currentForm.published_at
        ? { published_at: currentParisDateTimeInput() }
        : {}),
    }));
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setIsUploadingImage(true);
    setMessage("");

    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch("/api/admin/images", {
      method: "POST",
      body: formData,
    });
    const data = (await response.json().catch(() => ({}))) as {
      url?: string;
      message?: string;
    };

    setIsUploadingImage(false);
    event.target.value = "";

    if (!response.ok || !data.url) {
      setMessage(data.message ?? "Upload de l'image impossible.");
      return;
    }

    updateForm("cover_image_url", data.url);
    setMessage("Image ajoutée.");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");

    const response = await fetch(
      selectedId ? `/api/admin/articles/${selectedId}` : "/api/admin/articles",
      {
        method: selectedId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serializeForm(form)),
      },
    );
    const data = (await response.json().catch(() => ({}))) as {
      article?: BlogPost;
      message?: string;
    };

    setIsSaving(false);

    if (!response.ok || !data.article) {
      setMessage(data.message ?? "Enregistrement impossible.");
      return;
    }

    const savedArticle = data.article;

    setPosts((currentPosts) => {
      if (selectedId) {
        return currentPosts.map((post) =>
          post.id === savedArticle.id ? savedArticle : post,
        );
      }

      return [savedArticle, ...currentPosts];
    });
    setSelectedId(savedArticle.id);
    setForm(toFormState(savedArticle));
    setMessage("Article enregistré.");
  }

  async function handleDelete() {
    if (!selectedId || !confirm("Supprimer définitivement cet article ?")) {
      return;
    }

    setIsDeleting(true);
    setMessage("");

    const response = await fetch(`/api/admin/articles/${selectedId}`, {
      method: "DELETE",
    });
    const data = (await response.json().catch(() => ({}))) as {
      message?: string;
    };

    setIsDeleting(false);

    if (!response.ok) {
      setMessage(data.message ?? "Suppression impossible.");
      return;
    }

    const nextPosts = posts.filter((post) => post.id !== selectedId);
    setPosts(nextPosts);
    setSelectedId(nextPosts[0]?.id ?? null);
    setForm(nextPosts[0] ? toFormState(nextPosts[0]) : emptyForm);
    setMessage("Article supprimé.");
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-[#f8f5f5] px-4 py-28 text-gray-900 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#B76E79]">
              Blog
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Administration des articles
            </h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#B76E79] hover:text-[#B76E79]"
          >
            Se déconnecter
          </button>
        </div>

        {setupError ? (
          <p role="alert" className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
            {setupError}
          </p>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
          <aside className="rounded-md bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">Articles</h2>
              <button
                type="button"
                onClick={startNewArticle}
                className="rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white transition hover:bg-gray-700"
              >
                Nouvel article
              </button>
            </div>

            <div className="space-y-2">
              {posts.length === 0 ? (
                <p className="rounded-md bg-gray-50 p-4 text-sm text-gray-600">
                  Aucun article pour le moment.
                </p>
              ) : (
                posts.map((post) => (
                  <button
                    key={post.id}
                    type="button"
                    onClick={() => selectPost(post)}
                    className={`w-full rounded-md border p-4 text-left transition ${
                      post.id === selectedId
                        ? "border-[#B76E79] bg-[#fff8f9]"
                        : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <span className="block text-sm font-semibold text-gray-900">
                      {post.title}
                    </span>
                    <span className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                      <span
                        className={`rounded-full px-2 py-1 ${
                          post.status === "published"
                            ? "bg-green-50 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.status === "published" ? "Publié" : "Brouillon"}
                      </span>
                      {formatDate(post.published_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-md bg-white p-5 shadow-sm sm:p-8">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Titre
                </label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(event) => updateForm("title", event.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="slug"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Slug
                </label>
                <input
                  id="slug"
                  value={form.slug}
                  onChange={(event) =>
                    updateForm("slug", normalizeSlugInput(event.target.value))
                  }
                  required
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Statut
                </label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(event) =>
                    updateForm("status", event.target.value as BlogStatus)
                  }
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="published_at"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Date de publication (Paris)
                </label>
                <input
                  id="published_at"
                  type="datetime-local"
                  value={form.published_at}
                  onChange={(event) =>
                    updateForm("published_at", event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
              </div>

              <div>
                <label
                  htmlFor="cover_image_url"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Image
                </label>
                <input
                  id="cover_image_url"
                  value={form.cover_image_url}
                  onChange={(event) =>
                    updateForm("cover_image_url", event.target.value)
                  }
                  placeholder="URL directe ou upload"
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
                <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <label className="inline-flex w-fit rounded-md border border-[#B76E79] px-4 py-2 text-sm font-semibold text-[#B76E79] transition hover:bg-[#fff8f9]">
                    {isUploadingImage ? "Upload..." : "Uploader une image"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="sr-only"
                    />
                  </label>
                  {form.cover_image_url ? (
                    <div
                      aria-hidden="true"
                      className="h-16 w-24 rounded-md border border-gray-200 bg-gray-100 bg-cover bg-center"
                      style={{
                        backgroundImage: `url(${JSON.stringify(
                          form.cover_image_url,
                        )})`,
                      }}
                    />
                  ) : null}
                </div>
              </div>

              <div>
                <label
                  htmlFor="cover_image_source"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Source de l’image
                </label>
                <input
                  id="cover_image_source"
                  value={form.cover_image_source}
                  onChange={(event) =>
                    updateForm("cover_image_source", event.target.value)
                  }
                  placeholder="Photo : nom / source"
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="excerpt"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Résumé
                </label>
                <textarea
                  id="excerpt"
                  value={form.excerpt}
                  onChange={(event) => updateForm("excerpt", event.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label
                  htmlFor="content"
                  className="mb-2 block text-sm font-medium text-gray-700"
                >
                  Contenu
                </label>
                <p className="mb-3 text-xs leading-5 text-gray-500">
                  Mise en forme acceptée : **gras**, *italique*, # titre, - liste,
                  [lien](https://...).
                </p>
                <textarea
                  id="content"
                  value={form.content}
                  onChange={(event) => updateForm("content", event.target.value)}
                  required
                  rows={18}
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm leading-7 outline-none transition focus:border-[#B76E79] focus:bg-white"
                />
              </div>
            </div>

            {message ? (
              <p
                role="status"
                className={`mt-5 rounded-md p-3 text-sm ${
                  message.includes("impossible") || message.includes("manque")
                    ? "bg-red-50 text-red-700"
                    : "bg-green-50 text-green-700"
                }`}
              >
                {message}
              </p>
            ) : null}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={handleDelete}
                disabled={!selectedId || isDeleting}
                className="rounded-md border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="rounded-md bg-[#B76E79] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#a4626c] disabled:cursor-wait disabled:opacity-70"
              >
                {isSaving ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
