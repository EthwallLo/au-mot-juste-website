import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/app/lib/adminSession";
import { BLOG_IMAGE_EXTENSIONS, BLOG_IMAGE_MAX_SIZE, LOCAL_IMAGE_URL_PREFIX } from "@/app/lib/blogImageUpload";
import { getLocalImagesDirectory } from "@/app/lib/localImages";
import { getDatabaseMode } from "@/database/config.mjs";

export async function POST(request: NextRequest) {
  if (getDatabaseMode(process.env) !== "local") return new NextResponse(null, { status: 404 });
  if (!isAdminRequestAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || !BLOG_IMAGE_EXTENSIONS[file.type] || !file.size || file.size > BLOG_IMAGE_MAX_SIZE) {
      return NextResponse.json({ error: "Choisissez une image JPEG, PNG, WebP, GIF ou AVIF de 5 Mo maximum." }, { status: 400 });
    }
    const directory = getLocalImagesDirectory();
    const filename = `${randomUUID()}.${BLOG_IMAGE_EXTENSIONS[file.type]}`;
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), new Uint8Array(await file.arrayBuffer()), { flag: "wx" });
    return NextResponse.json({ url: `${LOCAL_IMAGE_URL_PREFIX}${filename}` });
  } catch {
    return NextResponse.json({ error: "Impossible d’enregistrer l’image dans le dossier local." }, { status: 500 });
  }
}
