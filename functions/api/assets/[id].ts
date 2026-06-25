import type { Env } from "../../_shared";
import { cleanText, json } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.R2_ASSETS || !env.DB) return json({ error: "Asset storage is not configured." }, 503);
  const id = cleanText(params.id, 64);
  const asset = await env.DB.prepare("SELECT object_key FROM player_assets WHERE id = ?").bind(id).first<{ object_key: string }>();
  if (!asset) return json({ error: "Asset not found." }, 404);
  const object = await env.R2_ASSETS.get(asset.object_key);
  if (!object) return json({ error: "Asset not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(object.body, { headers });
};
