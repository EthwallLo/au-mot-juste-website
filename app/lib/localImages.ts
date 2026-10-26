import "server-only";
import path from "node:path";

export function getLocalImagesDirectory() {
  return path.resolve(process.env.LOCAL_IMAGES_PATH || ".local/images");
}
