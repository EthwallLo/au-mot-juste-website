import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isAdminRequestAuthenticated } from "@/app/lib/adminSession";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

function getSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL ??
    ""
  ).replace(/\/$/, "");
}

function getSupabaseServiceKey() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

function getBucketName() {
  return process.env.SUPABASE_BLOG_IMAGES_BUCKET ?? "blog-images";
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function getImageExtension(file: File) {
  const mimeExtensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  return mimeExtensions[file.type] ?? "jpg";
}

function getStorageHeaders(key: string) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
  };
}

async function getStorageError(response: Response) {
  try {
    const body = (await response.json()) as { message?: string; error?: string };
    return body.message ?? body.error ?? `Erreur Supabase (${response.status}).`;
  } catch {
    return (await response.text()) || `Erreur Supabase (${response.status}).`;
  }
}

async function ensurePublicBucket(url: string, key: string, bucketName: string) {
  const bucketResponse = await fetch(`${url}/storage/v1/bucket/${bucketName}`, {
    headers: getStorageHeaders(key),
    cache: "no-store",
  });

  if (bucketResponse.ok) {
    const bucket = (await bucketResponse.json()) as { public?: boolean };

    if (bucket.public) {
      return;
    }

    const updateResponse = await fetch(
      `${url}/storage/v1/bucket/${bucketName}`,
      {
        method: "PUT",
        headers: {
          ...getStorageHeaders(key),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public: true,
          file_size_limit: MAX_FILE_SIZE,
          allowed_mime_types: ALLOWED_IMAGE_TYPES,
        }),
      },
    );

    if (!updateResponse.ok) {
      throw new Error(await getStorageError(updateResponse));
    }

    return;
  }

  const bucketError = await getStorageError(bucketResponse.clone());

  if (
    bucketResponse.status !== 404 &&
    !bucketError.toLowerCase().includes("bucket not found")
  ) {
    throw new Error(bucketError);
  }

  const createResponse = await fetch(`${url}/storage/v1/bucket`, {
    method: "POST",
    headers: {
      ...getStorageHeaders(key),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: bucketName,
      name: bucketName,
      public: true,
      file_size_limit: MAX_FILE_SIZE,
      allowed_mime_types: ALLOWED_IMAGE_TYPES,
    }),
  });

  if (!createResponse.ok && createResponse.status !== 409) {
    throw new Error(await getStorageError(createResponse));
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequestAuthenticated(request)) {
    return jsonError("Non autorisé.", 401);
  }

  const url = getSupabaseUrl();
  const key = getSupabaseServiceKey();
  const bucketName = getBucketName();

  if (!url || !key) {
    return jsonError("La configuration Supabase Storage est incomplète.", 500);
  }

  const formData = await request.formData();
  const file = formData.get("image");

  if (!(file instanceof File)) {
    return jsonError("Aucune image reçue.", 400);
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return jsonError("Format d'image non pris en charge.", 400);
  }

  if (file.size > MAX_FILE_SIZE) {
    return jsonError("L'image ne doit pas dépasser 5 Mo.", 400);
  }

  try {
    await ensurePublicBucket(url, key, bucketName);

    const extension = getImageExtension(file);
    const objectPath = [
      "articles",
      new Date().toISOString().slice(0, 10),
      `${randomUUID()}.${extension}`,
    ]
      .map(encodeURIComponent)
      .join("/");
    const uploadResponse = await fetch(
      `${url}/storage/v1/object/${bucketName}/${objectPath}`,
      {
        method: "POST",
        headers: {
          ...getStorageHeaders(key),
          "Content-Type": file.type,
          "Cache-Control": "31536000",
          "x-upsert": "true",
        },
        body: await file.arrayBuffer(),
      },
    );

    if (!uploadResponse.ok) {
      throw new Error(await getStorageError(uploadResponse));
    }

    return NextResponse.json({
      url: `${url}/storage/v1/object/public/${bucketName}/${objectPath}`,
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "Upload de l'image impossible.",
      502,
    );
  }
}
