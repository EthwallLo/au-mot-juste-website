import "server-only";
import nodemailer from "nodemailer";
import { isProductionNewsletterEnabled } from "./newsletterConfig";

export async function sendProductionNewsletterMail(mail: { id: string; to: string; subject: string; html: string; text: string }) {
  if (!isProductionNewsletterEnabled() || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error("L’envoi de la newsletter n’est pas configuré.");
  }
  const transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    connectionTimeout: 10000, greetingTimeout: 10000, socketTimeout: 20000,
    logger: false, debug: false,
  });
  try {
    const result = await transport.sendMail({
      from: { name: "Au mot juste", address: process.env.EMAIL_USER },
      to: mail.to, subject: mail.subject, html: mail.html, text: mail.text,
      messageId: `<newsletter-${mail.id}@${process.env.EMAIL_USER.split("@")[1]}>`,
      disableFileAccess: true, disableUrlAccess: true,
    });
    if (!result.accepted.some((address) => String(address).toLowerCase() === mail.to.toLowerCase()) || result.rejected.length) {
      throw Object.assign(new Error("Le destinataire n’a pas été accepté."), { retryable: true });
    }
    return result.messageId as string;
  } catch (error) {
    const details = error as { code?: string; command?: string; responseCode?: number; retryable?: boolean };
    const retryable = details.retryable === true || ["EAUTH", "EDNS", "ECONNECTION"].includes(details.code || "") ||
      ["CONN", "AUTH"].includes(details.command || "") || (details.responseCode !== undefined && details.responseCode >= 400);
    throw Object.assign(new Error("Le serveur de mail n’a pas confirmé l’envoi."), { retryable });
  } finally { transport.close(); }
}
