import type { Env } from "../_shared";
import { cleanText, handleError, HttpError, json, rateLimit, readJson, validateTurnstile } from "../_shared";

interface ContactBody {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
  sourcePage?: string;
  turnstileToken?: string;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    await rateLimit(env, request, "contact", 5, 3600);
    const body = await readJson<ContactBody>(request, 12_000);
    const name = cleanText(body.name, 80);
    const email = cleanText(body.email, 160).toLowerCase();
    const topic = cleanText(body.topic, 80);
    const message = cleanText(body.message, 2000);
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 10) throw new HttpError(400, "Name, valid email, and message are required.");
    const valid = await validateTurnstile(env, cleanText(body.turnstileToken, 2048), request);
    if (!valid) throw new HttpError(400, "Turnstile validation failed.");
    if (!env.DB) throw new HttpError(503, "Contact storage is not configured.");
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO contact_leads (id, name, email, topic, message, source_page, turnstile_validated, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, datetime('now'))")
      .bind(id, name, email, topic, message, cleanText(body.sourcePage, 120)).run();
    await env.SAVE_QUEUE?.send({ type: "contact-created", id });
    return json({ ok: true, id }, 201);
  } catch (error) {
    return handleError(error);
  }
};
