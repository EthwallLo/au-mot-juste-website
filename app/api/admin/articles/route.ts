import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequestAuthenticated } from "@/app/lib/adminSession";
import {
  BlogConfigError,
  BlogDataError,
  BlogInputError,
  createBlogPost,
  getAllBlogPosts,
} from "@/app/lib/blog";

function apiError(error: unknown) {
  if (error instanceof BlogInputError) {
    return NextResponse.json({ message: error.message }, { status: 400 });
  }

  if (error instanceof BlogConfigError) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }

  if (error instanceof BlogDataError) {
    return NextResponse.json({ message: error.message }, { status: 502 });
  }

  return NextResponse.json(
    { message: "Erreur inattendue côté serveur." },
    { status: 500 },
  );
}

function unauthorized() {
  return NextResponse.json({ message: "Non autorisé." }, { status: 401 });
}

export async function GET(request: NextRequest) {
  if (!isAdminRequestAuthenticated(request)) {
    return unauthorized();
  }

  try {
    const articles = await getAllBlogPosts();
    return NextResponse.json({ articles });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  if (!isAdminRequestAuthenticated(request)) {
    return unauthorized();
  }

  try {
    const article = await createBlogPost(await request.json());
    revalidatePath("/blog");
    revalidatePath(`/blog/${article.slug}`);
    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
