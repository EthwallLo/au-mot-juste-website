import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AdminLoginForm from "../blog/AdminLoginForm";
import { isAdminAuthenticated } from "@/app/lib/adminSession";
import { getAllBlogPosts } from "@/app/lib/blog";
import { isLocalNewsletterEnabled } from "@/app/lib/newsletterConfig";
import { getLocalNewsletterSnapshot } from "@/app/lib/newsletterLocal";
import NewsletterManager from "./NewsletterManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter, version locale | Au mot juste", robots: { index: false, follow: false } };

export default async function AdminNewsletterPage() {
  if (!isLocalNewsletterEnabled()) notFound();
  if (!(await isAdminAuthenticated())) return <div className="min-h-screen bg-[#fbf8f7] px-6 py-40"><AdminLoginForm description="Aperçu de la newsletter et boîte de réception locale" /></div>;
  const requestHeaders = await headers();
  const origin = `http://${requestHeaders.get("host") || "localhost:3000"}`;
  const [posts, snapshot] = await Promise.all([getAllBlogPosts().catch(() => []), getLocalNewsletterSnapshot()]);
  return <NewsletterManager initialPosts={posts} initialSnapshot={snapshot} origin={origin} />;
}
