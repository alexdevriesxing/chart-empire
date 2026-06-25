import type { Env } from "../../_shared";
import { assertSameOrigin, requireUser } from "../../auth";
import { handleError, HttpError, json, rateLimit } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "logo-upload", 10, 3600);
    if (!env.R2_ASSETS || !env.DB) throw new HttpError(503, "Asset storage is not configured.");
    const user = await requireUser(env, request);
    const contentType = request.headers.get("content-type") || "";
    const extensions: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
    const extension = extensions[contentType];
    if (!extension) throw new HttpError(415, "Use PNG, JPEG, or WebP.");
    const bytes = await request.arrayBuffer();
    if (bytes.byteLength > 2_000_000) throw new HttpError(413, "Logo must be smaller than 2 MB.");
    if (!hasValidImageSignature(new Uint8Array(bytes), contentType)) throw new HttpError(400, "Logo file signature is invalid.");
    const id = crypto.randomUUID();
    const objectKey = `logos/${user.id}/${id}.${extension}`;
    await env.R2_ASSETS.put(objectKey, bytes, {
      httpMetadata: { contentType, cacheControl: "public, max-age=31536000, immutable" },
      customMetadata: { userId: user.id, assetId: id }
    });
    await env.DB.prepare(`
      INSERT INTO player_assets (id, user_id, object_key, content_type, byte_size, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, user.id, objectKey, contentType, bytes.byteLength).run();
    return json({ id, url: `/api/assets/${id}`, contentType, byteSize: bytes.byteLength }, 201);
  } catch (error) {
    return handleError(error);
  }
};

function hasValidImageSignature(bytes: Uint8Array, contentType: string): boolean {
  if (contentType === "image/png") return bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value);
  if (contentType === "image/jpeg") return bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (contentType === "image/webp") {
    return bytes.length >= 12
      && String.fromCharCode(...bytes.slice(0, 4)) === "RIFF"
      && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  }
  return false;
}
