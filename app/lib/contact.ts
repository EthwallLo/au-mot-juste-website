export const CONTACT_FIELD_LIMITS = {
  name: 120,
  email: 254,
  phone: 40,
  subject: 200,
  message: 10000,
} as const;

export const CONTACT_MAX_BODY_BYTES = 64 * 1024;
export const CONTACT_SUCCESS_MESSAGE = "Votre message a bien été envoyé.";
export const CONTACT_PHONE_ERROR_MESSAGE = "Veuillez saisir un numéro de téléphone valide.";

// French national numbers have 10 digits; +33 (or 0033) replaces the first 0.
// Other international numbers require an explicit dialling prefix.
export const CONTACT_PHONE_PATTERN = /\s*(?:0\s*[1-9](?:\s*[0-9]){8}|(?:\+|0\s*0)\s*(?:3\s*3\s*[1-9](?:\s*[0-9]){8}|(?!3\s*3)[1-9](?:\s*[0-9]){6,14}))\s*/.source;

export class ContactInputError extends Error {
  constructor(message: string, public readonly status = 400) {
    super(message);
  }
}

type ContactMessage = {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

const singleLineControls = /[\p{Cc}\p{Zl}\p{Zp}]/u;
const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const phonePattern = new RegExp(`^(?:${CONTACT_PHONE_PATTERN})$`);

export function isValidContactPhone(value: string) {
  return !singleLineControls.test(value) && (!value.trim() || phonePattern.test(value));
}

export function validateContactPayload(value: unknown): ContactMessage | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ContactInputError("Le formulaire est invalide.");
  }
  const body = value as Record<string, unknown>;
  if (body.website !== undefined && typeof body.website !== "string") {
    throw new ContactInputError("Le formulaire est invalide.");
  }
  // A filled honeypot receives the usual response without sending an email.
  if (typeof body.website === "string" && body.website.trim()) return null;

  function field(key: keyof ContactMessage, label: string, multiline = false) {
    const raw = body[key] === undefined ? "" : body[key];
    if (typeof raw !== "string") {
      throw new ContactInputError(`Le champ ${label} est invalide.`);
    }
    if (raw.length > CONTACT_FIELD_LIMITS[key]) {
      throw new ContactInputError(`Le champ ${label} est trop long (${CONTACT_FIELD_LIMITS[key]} caractères maximum).`);
    }
    const controls = multiline ? raw.replace(/[\r\n\t]/g, "") : raw;
    if (singleLineControls.test(controls)) {
      throw new ContactInputError(`Le champ ${label} contient des caractères non autorisés.`);
    }
    return raw.replace(/\r\n?/g, "\n").trim();
  }

  const name = field("name", "nom");
  const email = field("email", "e-mail");
  const phone = field("phone", "téléphone").replace(/\s+/g, "");
  const subject = field("subject", "sujet");
  const message = field("message", "message", true);

  if (!email) throw new ContactInputError("Le champ e-mail est obligatoire.");
  if (!message) throw new ContactInputError("Le champ message est obligatoire.");
  const localPart = email.split("@")[0];
  if (!emailPattern.test(email) || localPart.length > 64 || localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) {
    throw new ContactInputError("Veuillez saisir une adresse e-mail valide.");
  }
  if (!isValidContactPhone(phone)) {
    throw new ContactInputError(CONTACT_PHONE_ERROR_MESSAGE);
  }
  return { name, email, phone, subject, message };
}

export function assertContactOrigin(request: Request, local = false) {
  const url = new URL(request.url);
  // The dev server may normalize 127.0.0.1 to localhost in request.url.
  if (local && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    url.host = request.headers.get("host") || url.host;
  }
  if (request.headers.get("origin") !== url.origin || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ContactInputError("Veuillez envoyer votre message depuis le formulaire du site.", 403);
  }
}

export async function readContactRequest(request: Request) {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new ContactInputError("Le format du formulaire est invalide.", 415);
  }
  const length = request.headers.get("content-length");
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > CONTACT_MAX_BODY_BYTES)) {
    throw new ContactInputError("Le formulaire est trop volumineux.", 413);
  }
  const reader = request.body?.getReader();
  if (!reader) throw new ContactInputError("Le formulaire est vide.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > CONTACT_MAX_BODY_BYTES) {
        await reader.cancel();
        throw new ContactInputError("Le formulaire est trop volumineux.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
    return validateContactPayload(body);
  } catch (error) {
    if (error instanceof ContactInputError) throw error;
    throw new ContactInputError("Le formulaire est invalide. Veuillez réessayer.");
  }
}
