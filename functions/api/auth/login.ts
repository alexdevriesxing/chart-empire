import type { Env } from "../../_shared";
import { assertSameOrigin, createSession, verifyPassword } from "../../auth";
import { cleanText, handleError, HttpError, json, normalizeEmail, rateLimit, readJson, validateTurnstile } from "../../_shared";

interface LoginBody {
  email?: string;
  password?: string;
  turnstileToken?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "login", 10, 3600);
    if (!env.DB) throw new HttpError(503, "Account storage is not configured.");
    const body = await readJson<LoginBody>(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password || "");
    if (!await validateTurnstile(env, cleanText(body.turnstileToken, 2048), request)) throw new HttpError(400, "Turnstile validation failed.");
    const user = await env.DB.prepare("SELECT id, email, display_name, password_hash FROM users WHERE email = ?").bind(email)
      .first<{ id: string; email: string; display_name: string; password_hash: string }>();
    if (!user || !await verifyPassword(password, user.password_hash, env)) throw new HttpError(401, "Email or password is incorrect.");
    await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND expires_at <= datetime('now')").bind(user.id).run();
    const session = await createSession(env, user.id);
    return json({ user: { id: user.id, email: user.email, displayName: user.display_name }, expiresAt: session.expiresAt }, 200, { "set-cookie": session.cookie });
  } catch (error) {
    return handleError(error);
  }
};
