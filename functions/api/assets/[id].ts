import type { Env } from "../../_shared";
import { json } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  if (!env.R2_ASSETS) return json({ error: "Asset storage is not configured." }, 503);
  const key = `logos/${String(params.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const object = await env.R2_ASSETS.get(key);
  if (!object) return json({ error: "Asset not found." }, 404);
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=86400");
  return new Response(object.body, { headers });
};
