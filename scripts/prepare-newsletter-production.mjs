import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const file = fileURLToPath(new URL("../.env.newsletter.production", import.meta.url));
try {
  await writeFile(file, [
    "NEWSLETTER_ENABLED=true",
    "NEWSLETTER_SITE_URL=https://aumotjuste-correction.fr",
    `NEWSLETTER_SECRET=${randomBytes(32).toString("hex")}`,
    `CRON_SECRET=${randomBytes(32).toString("hex")}`,
    "",
  ].join("\n"), { flag: "wx", mode: 0o600 });
  console.log("Réglages de production créés dans .env.newsletter.production (fichier privé, ignoré par Git).");
} catch (error) {
  if (error.code === "EEXIST") console.log("Le fichier privé existe déjà : les clés existantes sont conservées.");
  else { console.error("Impossible de créer le fichier privé de configuration."); process.exitCode = 1; }
}
