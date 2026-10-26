import { NextRequest, NextResponse } from "next/server";
import { NewsletterInputError, subscribeToLocalNewsletter } from "@/app/lib/newsletterLocal";
import { getLocalNewsletterRequestOrigin, isLocalNewsletterRequest, isProductionNewsletterRequest } from "@/app/lib/newsletterRequest";

export async function POST(request: NextRequest) {
  const origin = getLocalNewsletterRequestOrigin(request);
  const production = isProductionNewsletterRequest(request);
  if (!production && (!isLocalNewsletterRequest(request) || !origin)) return new NextResponse(null, { status: 404 });
  try {
    const body = await request.json();
    if (!body?.website) {
      if (production) {
        const { subscribeToProductionNewsletter, allowProductionNewsletterSignup } = await import("@/app/lib/newsletterProduction");
        const ip = (request.headers.get("x-vercel-forwarded-for") || request.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
        if (!await allowProductionNewsletterSignup(ip)) return NextResponse.json({ message: "Trop de demandes. Veuillez réessayer dans une heure." }, { status: 429 });
        await subscribeToProductionNewsletter(body?.email, body?.consent);
      } else await subscribeToLocalNewsletter(body?.email, body?.consent, origin!);
    }
    return NextResponse.json({ message: "Merci ! Confirmez votre inscription en cliquant sur le lien reçu dans le mail de confirmation." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof NewsletterInputError ? error.message : "L’inscription est momentanément indisponible. Réessayez dans un instant." }, { status: error instanceof NewsletterInputError ? 400 : 503 });
  }
}

export const maxDuration = 60;
