import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/app/lib/adminSession";
import { getAllBlogPosts } from "@/app/lib/blog";
import { getLocalNewsletterSnapshot, NewsletterInputError, simulateLocalArticleDelivery } from "@/app/lib/newsletterLocal";
import { isLocalNewsletterRequest } from "@/app/lib/newsletterRequest";
import { syncLocalNewsletter } from "@/app/lib/newsletterWorker";
import { NEWSLETTER_EXAMPLE } from "@/app/lib/newsletterExample";

function authorize(request: NextRequest) {
  if (!isLocalNewsletterRequest(request)) return new NextResponse(null, { status: 404 });
  if (!isAdminRequestAuthenticated(request)) return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  try {
    return NextResponse.json(await getLocalNewsletterSnapshot(), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ message: "Impossible d’ouvrir la boîte de test." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  const denied = authorize(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    let count = 0;
    if (body?.action === "sync") count = await syncLocalNewsletter();
    else if (body?.action === "simulate" && typeof body.articleId === "string") {
      const now = new Date().toISOString();
      const article = body.articleId
        ? (await getAllBlogPosts()).find((post) => post.id === body.articleId)
        : { ...NEWSLETTER_EXAMPLE, slug: "exemple-newsletter", status: "published" as const, published_at: now, created_at: now, updated_at: now };
      if (!article) throw new NewsletterInputError("Cet article est introuvable.");
      count = await simulateLocalArticleDelivery(article);
    } else throw new NewsletterInputError("Choisissez une action valide.");
    return NextResponse.json({ count, snapshot: await getLocalNewsletterSnapshot() });
  } catch (error) {
    return NextResponse.json({ message: error instanceof NewsletterInputError ? error.message : "La simulation a échoué. Vérifiez l’accès à la base des articles et réessayez." }, { status: error instanceof NewsletterInputError ? 400 : 503 });
  }
}
