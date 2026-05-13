import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { isAdminRequestAuthenticated } from "@/app/lib/adminSession";
import {
  BlogConfigError,
  BlogDataError,
  BlogInputError,
  deleteBlogPost,
  updateBlogPost,
} from "@/app/lib/blog";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

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

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isAdminRequestAuthenticated(request)) {
    return unauthorized();
  }

  try {
    const { id } = await context.params;
    const article = await updateBlogPost(id, await request.json());
    revalidatePath("/blog");
    revalidatePath(`/blog/${article.slug}`);
    return NextResponse.json({ article });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isAdminRequestAuthenticated(request)) {
    return unauthorized();
  }

  try {
    const { id } = await context.params;
    await deleteBlogPost(id);
    revalidatePath("/blog");
    return NextResponse.json({ message: "Article supprimé." });
  } catch (error) {
    return apiError(error);
  }
}
