import { NextRequest, NextResponse } from "next/server";
import { confirmLocalNewsletter, NewsletterInputError, unsubscribeLocalNewsletter } from "@/app/lib/newsletterLocal";
import { isLocalNewsletterRequest, isProductionNewsletterRequest } from "@/app/lib/newsletterRequest";

export async function POST(request: NextRequest, { params }: { params: Promise<{ action: string }> }) {
  const production = isProductionNewsletterRequest(request);
  if (!production && !isLocalNewsletterRequest(request)) return new NextResponse(null, { status: 404 });
  const { action } = await params;
  if (!["confirm", "unsubscribe"].includes(action)) return new NextResponse(null, { status: 404 });
  try {
    const body = await request.json();
    if (typeof body?.token !== "string") throw new NewsletterInputError("Le lien est invalide.");
    if (production) {
      const { confirmProductionNewsletter, unsubscribeProductionNewsletter } = await import("@/app/lib/newsletterProduction");
      if (action === "confirm") await confirmProductionNewsletter(body.token);
      else await unsubscribeProductionNewsletter(body.token);
    } else if (action === "confirm") await confirmLocalNewsletter(body.token);
    else await unsubscribeLocalNewsletter(body.token);
    return NextResponse.json({ message: action === "confirm" ? "Votre inscription est confirmée. Vous recevrez les prochains articles par e-mail." : "Vous êtes désinscrit·e. Vous ne recevrez plus les prochains articles." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof NewsletterInputError ? error.message : "Cette action est momentanément indisponible. Réessayez dans un instant." }, { status: error instanceof NewsletterInputError ? 400 : 503 });
  }
}
