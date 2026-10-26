import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isNewsletterEnabled } from "@/app/lib/newsletterConfig";
import NewsletterAction from "../NewsletterAction";

export const metadata: Metadata = { title: "Blog Au mot juste", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function NewsletterActionPage({ params, searchParams }: { params: Promise<{ action: string }>; searchParams: Promise<{ token?: string }> }) {
  const { action } = await params;
  if (!isNewsletterEnabled() || !["confirmer", "desinscription"].includes(action)) notFound();
  const { token } = await searchParams;
  return <div className="min-h-screen bg-[#fbf8f7] px-6 pb-20 pt-40"><NewsletterAction token={typeof token === "string" ? token : ""} action={action === "confirmer" ? "confirm" : "unsubscribe"} /></div>;
}
