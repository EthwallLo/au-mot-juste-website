import nodemailer from "nodemailer";
import { assertContactOrigin, ContactInputError, CONTACT_SUCCESS_MESSAGE, readContactRequest } from "@/app/lib/contact";
import { allowContactRequest, CONTACT_RATE_WINDOW_SECONDS } from "@/app/lib/contactRateLimit";

function json(message: string, status = 200, extraHeaders: Record<string, string> = {}) {
  return Response.json({ message }, { status, headers: { "Cache-Control": "no-store", ...extraHeaders } });
}

export async function POST(request: Request) {
  try {
    assertContactOrigin(request, process.env.VERCEL !== "1");
    const body = await readContactRequest(request);
    if (!body) return json(CONTACT_SUCCESS_MESSAGE);

    const user = process.env.EMAIL_USER?.trim();
    const pass = process.env.EMAIL_PASS;
    if (!user || !pass?.trim()) throw new Error("CONTACT_SMTP_UNAVAILABLE");
    if (!await allowContactRequest(request, pass)) {
      return json("Trop de messages ont été envoyés. Veuillez réessayer dans une heure.", 429, { "Retry-After": String(CONTACT_RATE_WINDOW_SECONDS) });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      disableFileAccess: true,
      disableUrlAccess: true,
    });
    await transporter.sendMail({
      from: { name: "Au mot juste", address: user },
      to: user,
      replyTo: { name: body.name, address: body.email },
      subject: body.subject || "Nouveau message depuis le formulaire",
      text: `Nom : ${body.name}\nE-mail : ${body.email}\nTéléphone : ${body.phone}\n\nMessage :\n${body.message}`,
    });
    return json(CONTACT_SUCCESS_MESSAGE);
  } catch (error) {
    if (error instanceof ContactInputError) return json(error.message, error.status);
    // SMTP/database errors can contain credentials or submitted personal data.
    console.error("CONTACT_SEND_UNAVAILABLE");
    return json("L’envoi est momentanément indisponible. Veuillez réessayer plus tard.", 503);
  }
}

export const runtime = "nodejs";
export const maxDuration = 60;
