import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { getDatabaseMode } from "@/database/config.mjs";
import { BLOG_IMAGE_EXTENSIONS, LOCAL_IMAGE_NAME_PATTERN } from "@/app/lib/blogImageUpload";
import { getLocalImagesDirectory } from "@/app/lib/localImages";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ filename: string }> }) {
  if (getDatabaseMode(process.env) !== "local") return new NextResponse(null, { status: 404 });
  const { filename } = await params;
  if (!LOCAL_IMAGE_NAME_PATTERN.test(filename)) return new NextResponse(null, { status: 404 });
  try {
    const data = await readFile(path.join(getLocalImagesDirectory(), filename));
    const extension = filename.split(".").pop();
    const contentType = Object.entries(BLOG_IMAGE_EXTENSIONS).find(([, value]) => value === extension)?.[0];
    return new NextResponse(new Uint8Array(data), { headers: {
      "Content-Type": contentType || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    } });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
