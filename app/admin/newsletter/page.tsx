import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AdminLoginForm from "../blog/AdminLoginForm";
import { isAdminAuthenticated } from "@/app/lib/adminSession";
import { getAllBlogPosts } from "@/app/lib/blog";
import { isNewsletterEnabled, isProductionNewsletterEnabled } from "@/app/lib/newsletterConfig";
import { getProductionNewsletterSnapshot } from "@/app/lib/newsletterProduction";
import ProductionNewsletterManager from "./ProductionNewsletterManager";
import { getLocalNewsletterSnapshot } from "@/app/lib/newsletterLocal";
import NewsletterManager from "./NewsletterManager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Abonnements au blog | Au mot juste", robots: { index: false, follow: false } };

export default async function AdminNewsletterPage() {
  if (!isNewsletterEnabled()) notFound();
  if (!(await isAdminAuthenticated())) return <div className="min-h-screen bg-[#fbf8f7] px-6 py-40"><AdminLoginForm description={isProductionNewsletterEnabled() ? "Gestion des abonnements et des envois du blog" : "Aperçu de la newsletter et boîte de réception locale"} /></div>;
  if (isProductionNewsletterEnabled()) return <ProductionNewsletterManager snapshot={await getProductionNewsletterSnapshot()} />;
  const requestHeaders = await headers();
  const origin = `http://${requestHeaders.get("host") || "localhost:3000"}`;
  const [posts, snapshot] = await Promise.all([getAllBlogPosts().catch(() => []), getLocalNewsletterSnapshot()]);
  return <NewsletterManager initialPosts={posts} initialSnapshot={snapshot} origin={origin} />;
}
