import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { BLOG_CACHE_TAG } from "./blog";

export function revalidateBlog() {
  revalidateTag(BLOG_CACHE_TAG, { expire: 0 });
  revalidatePath("/");
  revalidatePath("/blog");
  revalidatePath("/blog/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
