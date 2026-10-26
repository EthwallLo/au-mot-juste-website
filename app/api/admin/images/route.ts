import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/app/lib/adminSession";
import { BLOG_IMAGE_MAX_SIZE, BLOG_IMAGE_EXTENSIONS } from "@/app/lib/blogImageUpload";
import { getDatabaseMode } from "@/database/config.mjs";

export async function POST(request: NextRequest) {
  if (!isAdminRequestAuthenticated(request)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  if (getDatabaseMode(process.env) === "local") {
    return NextResponse.json({ error: "Les images de développement doivent être enregistrées dans le stockage local." }, { status: 409 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Ajoutez BLOB_READ_WRITE_TOKEN aux variables d’environnement pour activer les images." },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => null)) as HandleUploadBody | null;

  if (
    !body ||
    body.type !== "blob.generate-client-token" ||
    typeof body.payload?.pathname !== "string" ||
    !/^articles\/[a-zA-Z0-9-]+\.(jpg|png|webp|gif|avif)$/.test(body.payload.pathname)
  ) {
    return NextResponse.json({ error: "Demande d’ajout d’image invalide." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      request,
      body,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: Object.keys(BLOG_IMAGE_EXTENSIONS),
        maximumSizeInBytes: BLOG_IMAGE_MAX_SIZE,
        addRandomSuffix: true,
        allowOverwrite: false,
        validUntil: Date.now() + 15 * 60 * 1000,
        cacheControlMaxAge: 365 * 24 * 60 * 60,
      }),
    });

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Impossible de préparer l’ajout de l’image. Vérifiez la configuration Vercel Blob." },
      { status: 502 },
    );
  }
}
