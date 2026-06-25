import type { Env } from "../../_shared";
import { handleError, HttpError, rateLimit } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    await rateLimit(env, request, "logo-upload", 10, 3600);
    if (!env.R2_ASSETS) throw new HttpError(503, "Asset storage is not configured.");
    const contentType = request.headers.get("content-type") || "";
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(contentType)) throw new HttpError(415, "Use PNG, JPEG, WebP, or SVG.");
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 2_000_000) throw new HttpError(413, "Logo must be smaller than 2 MB.");
    throw new HttpError(401, "Registered sessions are required for logo uploads.");
  } catch (error) {
    return handleError(error);
  }
};
