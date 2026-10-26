import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import lockfile from "proper-lockfile";
import { getDatabaseMode, getLocalDatabaseDirectory } from "./config.mjs";

const instancesKey = Symbol.for("au-mot-juste.local-databases");
const instances = globalThis[instancesKey] ??= new Map();

async function openDatabase(directory) {
  await mkdir(directory, { recursive: true });
  let release;
  try {
    release = await lockfile.lock(directory, { stale: 10000, update: 2000 });
  } catch (error) {
    if (error.code === "ELOCKED") {
      const busy = new Error("La base locale est déjà ouverte. Arrêtez l’autre serveur ou la commande de base de données, puis réessayez.");
      busy.code = "LOCAL_DATABASE_LOCKED";
      throw busy;
    }
    throw error;
  }

  let db;
  try {
    db = await PGlite.create(directory);
    const schema = await readFile(path.join(process.cwd(), "database", "schema.sql"), "utf8");
    await db.transaction(async (tx) => {
      await tx.exec(schema);
    });
    return { db, release };
  } catch (error) {
    if (db) await db.close().catch(() => {});
    await release();
    throw error;
  }
}

export async function getLocalDatabase(env = process.env) {
  if (getDatabaseMode(env) !== "local") {
    throw new Error("La base locale est réservée au développement sur cet ordinateur.");
  }
  const directory = getLocalDatabaseDirectory(env);
  if (!instances.has(directory)) {
    const opening = openDatabase(directory).catch((error) => {
      instances.delete(directory);
      throw error;
    });
    instances.set(directory, opening);
  }
  return (await instances.get(directory)).db;
}

export async function queryLocalDatabase(statement, parameters = [], env = process.env) {
  const db = await getLocalDatabase(env);
  return (await db.query(statement, parameters)).rows;
}

export async function closeLocalDatabase(env = process.env) {
  const directory = getLocalDatabaseDirectory(env);
  const opening = instances.get(directory);
  if (!opening) return;
  const { db, release } = await opening;
  try {
    await db.close();
  } finally {
    instances.delete(directory);
    await release();
  }
}
