import type { Env } from "../../_shared";
import { cleanText, handleError, json, readJson } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    const body = await readJson<{ event?: string; categories?: unknown }>(request, 4096);
    if (env.DB) {
      await env.DB.prepare("INSERT INTO consent_events (id, event_name, categories_json, created_at) VALUES (?, ?, ?, datetime('now'))")
        .bind(crypto.randomUUID(), cleanText(body.event, 50), JSON.stringify(body.categories || {})).run();
    }
    return json({ ok: true }, 202);
  } catch (error) {
    return handleError(error);
  }
};
