import { NextRequest, NextResponse } from "next/server";
import { NewsletterInputError, subscribeToLocalNewsletter } from "@/app/lib/newsletterLocal";
import { getLocalNewsletterRequestOrigin, isLocalNewsletterRequest } from "@/app/lib/newsletterRequest";

export async function POST(request: NextRequest) {
  const origin = getLocalNewsletterRequestOrigin(request);
  if (!isLocalNewsletterRequest(request) || !origin) return new NextResponse(null, { status: 404 });
  try {
    const body = await request.json();
    if (!body?.website) await subscribeToLocalNewsletter(body?.email, body?.consent, origin);
    return NextResponse.json({ message: "Merci ! Confirmez votre inscription en cliquant sur le lien reçu dans le mail de confirmation." });
  } catch (error) {
    return NextResponse.json({ message: error instanceof NewsletterInputError ? error.message : "L’inscription est momentanément indisponible. Réessayez dans un instant." }, { status: error instanceof NewsletterInputError ? 400 : 503 });
  }
}
