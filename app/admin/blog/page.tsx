import type { Metadata } from "next";
import AdminBlogManager from "./AdminBlogManager";
import AdminLoginForm from "./AdminLoginForm";
import { isAdminAuthenticated } from "@/app/lib/adminSession";
import { getAllBlogPosts } from "@/app/lib/blog";
import type { BlogPost } from "@/app/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Administration du blog | Au mot juste",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminBlogPage() {
  const isAuthenticated = await isAdminAuthenticated();

  if (!isAuthenticated) {
    return (
      <div
        className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-28"
        style={{ backgroundImage: "url('/image-carnet.webp')" }}
      >
        <div aria-hidden="true" className="absolute inset-0 bg-white/55" />
        <div className="relative z-10 w-full">
          <AdminLoginForm />
        </div>
      </div>
    );
  }

  let articles: BlogPost[] = [];
  let setupError: string | undefined;

  try {
    articles = await getAllBlogPosts();
  } catch (error) {
    setupError =
      error instanceof Error
        ? error.message
        : "Impossible de charger les articles.";
  }

  return <AdminBlogManager initialPosts={articles} setupError={setupError} />;
}
