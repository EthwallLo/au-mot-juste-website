import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";
import { getDatabaseMode } from "../database/config.mjs";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
nextEnv.loadEnvConfig(projectRoot, true);

try {
  if (getDatabaseMode() === "local") {
    const { getLocalDatabase, closeLocalDatabase } = await import("../database/local.mjs");
    try {
      await getLocalDatabase();
      console.log("La base locale des articles est prête dans .local/database.");
    } finally {
      await closeLocalDatabase();
    }
  } else {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("missing-config");
  }

  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  const statements = schema.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean);
  const sql = neon(databaseUrl);

  await sql.transaction(statements.map((statement) => sql.query(statement)));
  console.log("La table des articles est prête dans Neon.");
  }
} catch {
  console.error(
    getDatabaseMode() === "local"
      ? "Initialisation locale impossible. Arrêtez le serveur de développement s’il utilise déjà la base, puis vérifiez les droits d’accès à .local."
      : "Création de la table impossible. Vérifiez DATABASE_URL dans la configuration Vercel.",
  );
  process.exitCode = 1;
}
