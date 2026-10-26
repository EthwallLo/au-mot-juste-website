"use client";

import { ChangeEvent, FormEvent, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { upload } from "@vercel/blob/client";
import BlogArticle from "@/app/components/blogArticle";
import { BLOG_IMAGE_EXTENSIONS, BLOG_IMAGE_MAX_SIZE } from "@/app/lib/blogImageUpload";
import {
  PARIS_TIME_ZONE,
  currentParisDateTimeInput,
  parisDateTimeInputToIso,
  toDateTimeInput,
} from "@/app/lib/blogDates";
import type { BlogPost, BlogStatus } from "@/app/lib/blog";

type AdminBlogManagerProps = {
  initialPosts: BlogPost[];
  setupError?: string;
  newsletterEnabled?: boolean;
  localDatabase?: boolean;
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
  newsletterEnabled = false,
  localDatabase = false,
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const previewDialogRef = useRef<HTMLDialogElement>(null);

  function openPreview() {
    setIsPreviewOpen(true);
    previewDialogRef.current?.showModal();

    if (previewDialogRef.current) {
      previewDialogRef.current.scrollTop = 0;
    }
  }

  function closePreview() {
    previewDialogRef.current?.close();
    setIsPreviewOpen(false);
  }

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
    setForm((currentForm) => {
      const nextForm = { ...currentForm, [key]: value };
      const publicationTime = Date.parse(parisDateTimeInputToIso(currentForm.published_at));

      if (key === "title" && !selectedId && !currentForm.slug) {
        nextForm.slug = slugify(String(value));
      }

      if (key === "status") {
        if (value === "draft") {
          nextForm.published_at = "";
        } else if (value === "scheduled" && !(publicationTime > Date.now())) {
          nextForm.published_at = "";
        } else if (value === "published" && (!Number.isFinite(publicationTime) || publicationTime > Date.now())) {
          nextForm.published_at = currentParisDateTimeInput();
        }
      }

      if (key === "published_at" && currentForm.status === "published" &&
          Date.parse(parisDateTimeInputToIso(String(value))) > Date.now()) {
        nextForm.status = "scheduled";
      }

      return nextForm;
    });
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    const extension = BLOG_IMAGE_EXTENSIONS[file.type];

    if (!extension || file.size === 0 || file.size > BLOG_IMAGE_MAX_SIZE) {
      setMessage("Choisissez une image JPEG, PNG, WebP, GIF ou AVIF de 5 Mo maximum.");
      input.value = "";
      return;
    }

    setIsUploadingImage(true);
    setMessage("");

    try {
      let imageUrl: string;
      if (localDatabase) {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/admin/images/local", { method: "POST", body: data });
        const result = await response.json();
        if (!response.ok || typeof result.url !== "string") throw new Error("local-image-upload-failed");
        imageUrl = result.url;
      } else {
        const blob = await upload(`articles/${crypto.randomUUID()}.${extension}`, file, {
          access: "public",
          handleUploadUrl: "/api/admin/images",
          contentType: file.type,
        });
        imageUrl = blob.url;
      }
      updateForm("cover_image_url", imageUrl);
      setMessage("Image ajoutée.");
    } catch {
      setMessage(localDatabase
        ? "Impossible d’ajouter l’image. Vérifiez les droits d’accès au dossier .local."
        : "Impossible d’ajouter l’image. Vérifiez votre connexion et la configuration Vercel Blob.");
    } finally {
      setIsUploadingImage(false);
      input.value = "";
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payload = serializeForm(form);

    if (form.status !== "draft" && form.published_at && !payload.published_at) {
      setMessage("Enregistrement impossible : cette date ou cette heure n’existe pas à Paris. Choisissez une autre heure.");
      return;
    }

    setIsSaving(true);
    setMessage("");

    try {
      const response = await fetch(
        selectedId ? `/api/admin/articles/${selectedId}` : "/api/admin/articles",
        {
          method: selectedId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const data = (await response.json().catch(() => ({}))) as {
        article?: BlogPost;
        message?: string;
      };

      if (!response.ok || !data.article) {
        setMessage(`Enregistrement impossible. ${data.message ?? "Veuillez réessayer."}`);
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
      setMessage(savedArticle.status === "scheduled"
        ? `Publication planifiée pour le ${formatDate(savedArticle.published_at)} (heure de Paris).`
        : "Article enregistré.");
    } catch {
      setMessage("Enregistrement impossible. Vérifiez votre connexion et réessayez.");
    } finally {
      setIsSaving(false);
    }
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
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-strong">
              Blog
            </p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900">
              Administration des articles
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
          {newsletterEnabled ? <Link href="/admin/newsletter" className="rounded-md border border-[#B76E79] bg-white px-4 py-2 text-sm font-semibold text-brand-strong hover:bg-[#fff8f9]">Newsletter · test local</Link> : null}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-[#B76E79] hover:text-brand-strong"
          >
            Se déconnecter
          </button>
          </div>
        </div>

        {setupError ? (
          <p role="alert" className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-900">
            {setupError}
          </p>
        ) : null}

        {localDatabase ? <p className="mb-6 rounded-md border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">Base locale : les articles et les images créés ici restent sur cet ordinateur.</p> : null}

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
                            : post.status === "scheduled"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {post.status === "published" ? "Publié" : post.status === "scheduled" ? "Planifié" : "Brouillon"}
                      </span>
                      {post.status === "scheduled" ? "Prévu le " : ""}{formatDate(post.published_at)}
                    </span>
                  </button>
                ))
              )}
            </div>
          </aside>

          <form onSubmit={handleSubmit} className="rounded-md bg-white p-5 shadow-sm sm:p-8">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {selectedId ? "Modifier l’article" : "Nouvel article"}
              </h2>
              <button
                type="button"
                onClick={openPreview}
                disabled={isSaving || isDeleting || isUploadingImage}
                aria-haspopup="dialog"
                aria-controls="article-preview"
                className="rounded-md border border-[#B76E79] px-4 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-[#fff8f9] disabled:cursor-wait disabled:opacity-50"
              >
                Prévisualiser
              </button>
            </div>

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
                  <option value="scheduled">Planifié</option>
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
                  required={form.status === "scheduled"}
                  disabled={form.status === "draft"}
                  min={form.status === "scheduled" ? currentParisDateTimeInput() : undefined}
                  aria-describedby={form.status === "scheduled" ? "publication-help" : undefined}
                  onChange={(event) =>
                    updateForm("published_at", event.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm outline-none transition focus:border-[#B76E79] focus:bg-white disabled:opacity-50"
                />
                {form.status === "scheduled" ? (
                  <p id="publication-help" className="mt-2 text-sm leading-6 text-gray-600">
                    L’article sera publié automatiquement à cette date, même si cette page est fermée.
                    Pour annuler, repassez en brouillon et enregistrez.
                  </p>
                ) : null}
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
                  <label className="inline-flex w-fit rounded-md border border-[#B76E79] px-4 py-2 text-sm font-semibold text-brand-strong transition hover:bg-[#fff8f9]">
                    {isUploadingImage ? "Upload..." : "Uploader une image"}
                    <input
                      type="file"
                      accept={Object.keys(BLOG_IMAGE_EXTENSIONS).join(",")}
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
                <p className="mt-2 text-xs text-gray-500">
                  JPEG, PNG, WebP, GIF ou AVIF · 5 Mo maximum.
                </p>
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

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={openPreview}
                  disabled={isSaving || isDeleting || isUploadingImage}
                  aria-haspopup="dialog"
                  aria-controls="article-preview"
                  className="rounded-md border border-[#B76E79] px-4 py-2.5 text-sm font-semibold text-brand-strong transition hover:bg-[#fff8f9] disabled:cursor-wait disabled:opacity-50"
                >
                  Prévisualiser
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-brand-strong px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-70"
                >
                  {isSaving ? "Enregistrement..." : form.status === "scheduled" ? "Planifier la publication" : "Enregistrer"}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <dialog
        ref={previewDialogRef}
        id="article-preview"
        aria-labelledby="article-preview-title"
        aria-describedby="article-preview-description"
        onClose={() => {
          if (!previewDialogRef.current?.open) {
            setIsPreviewOpen(false);
          }
        }}
        className="fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-y-auto overscroll-contain border-0 bg-white p-0 text-gray-900 backdrop:bg-black/40"
      >
        <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 px-4 py-4 sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <div>
              <h2 id="article-preview-title" className="text-lg font-semibold">
                Prévisualisation de l’article
              </h2>
              <p id="article-preview-description" className="mt-1 text-sm text-gray-600">
                Aperçu privé des modifications en cours. Rien n’est enregistré ni publié.
              </p>
            </div>
            <button
              type="button"
              onClick={closePreview}
              className="rounded-md bg-brand-strong px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Revenir à la rédaction
            </button>
          </div>
        </div>

        {isPreviewOpen ? (
          <BlogArticle
            article={{
              title: form.title.trim() || "Titre de l’article",
              excerpt: form.excerpt.trim() || null,
              content: form.content.trim() || "Le texte de votre article apparaîtra ici.",
              cover_image_source: form.cover_image_source.trim() || null,
              published_at: form.published_at
                ? parisDateTimeInputToIso(form.published_at) || null
                : null,
            }}
            headerImage={form.cover_image_url.trim() || "/optimized/image-carnet-2.avif"}
            onBack={closePreview}
            newsletterEnabled={newsletterEnabled}
          />
        ) : null}
      </dialog>
    </div>
  );
}
