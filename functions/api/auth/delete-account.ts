import type { Env } from "../../_shared";
import { assertSameOrigin, clearSessionCookie, requireUser, verifyPassword } from "../../auth";
import { cleanText, handleError, HttpError, json, rateLimit, readJson, validateTurnstile } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "delete-account", 3, 3600);
    if (!env.DB) throw new HttpError(503, "Account storage is not configured.");
    const user = await requireUser(env, request);
    const body = await readJson<{ password?: string; turnstileToken?: string }>(request);
    if (!await validateTurnstile(env, cleanText(body.turnstileToken, 2048), request)) throw new HttpError(400, "Turnstile validation failed.");
    const row = await env.DB.prepare("SELECT password_hash FROM users WHERE id = ?").bind(user.id).first<{ password_hash: string }>();
    if (!row || !await verifyPassword(String(body.password || ""), row.password_hash, env)) throw new HttpError(401, "Password is incorrect.");
    const assets = await env.DB.prepare("SELECT object_key FROM player_assets WHERE user_id = ?").bind(user.id).all<{ object_key: string }>();
    if (env.R2_ASSETS && assets.results.length) await env.R2_ASSETS.delete(assets.results.map((asset) => asset.object_key));
    await env.DB.prepare("DELETE FROM users WHERE id = ?").bind(user.id).run();
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
  } catch (error) {
    return handleError(error);
  }
};
