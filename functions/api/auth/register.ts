import type { Env } from "../../_shared";
import { assertSameOrigin, createSession, hashPassword, validatePassword } from "../../auth";
import { cleanText, handleError, HttpError, json, normalizeEmail, rateLimit, readJson, validateTurnstile } from "../../_shared";

interface RegisterBody {
  email?: string;
  displayName?: string;
  password?: string;
  turnstileToken?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "register", 5, 3600);
    if (!env.DB) throw new HttpError(503, "Account storage is not configured.");
    const body = await readJson<RegisterBody>(request);
    const email = normalizeEmail(body.email);
    const displayName = cleanText(body.displayName, 40);
    const password = String(body.password || "");
    if (displayName.length < 2) throw new HttpError(400, "Display name must contain at least two characters.");
    validatePassword(password);
    if (!await validateTurnstile(env, cleanText(body.turnstileToken, 2048), request)) throw new HttpError(400, "Turnstile validation failed.");
    const existing = await env.DB.prepare("SELECT id FROM users WHERE email = ?").bind(email).first();
    if (existing) throw new HttpError(409, "An account already exists for this email.");
    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password, env);
    await env.DB.prepare("INSERT INTO users (id, email, display_name, password_hash, created_at, updated_at) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))")
      .bind(userId, email, displayName, passwordHash).run();
    const session = await createSession(env, userId);
    return json({ user: { id: userId, email, displayName }, expiresAt: session.expiresAt }, 201, { "set-cookie": session.cookie });
  } catch (error) {
    return handleError(error);
  }
};
