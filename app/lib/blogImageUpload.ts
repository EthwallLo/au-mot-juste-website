export const BLOG_IMAGE_MAX_SIZE = 5 * 1024 * 1024;
export const LOCAL_IMAGE_URL_PREFIX = "/api/local-images/";
export const LOCAL_IMAGE_NAME_PATTERN = /^[a-f0-9-]{36}\.(jpg|png|webp|gif|avif)$/i;

export const BLOG_IMAGE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};
