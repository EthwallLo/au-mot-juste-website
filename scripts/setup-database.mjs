import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";
import { neon } from "@neondatabase/serverless";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
nextEnv.loadEnvConfig(projectRoot, true);

try {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("missing-config");
  }

  const schema = await readFile(new URL("../database/schema.sql", import.meta.url), "utf8");
  const statements = schema.split(/^-- statement-breakpoint\s*$/m).map((part) => part.trim()).filter(Boolean);
  const sql = neon(databaseUrl);

  await sql.transaction(statements.map((statement) => sql.query(statement)));
  console.log("La table des articles est prête dans Neon.");
} catch {
  console.error(
    "Création de la table impossible. Vérifiez DATABASE_URL dans .env.local et l’accès à votre base Neon.",
  );
  process.exitCode = 1;
}
