export interface Env {
  DB?: D1Database;
  KV_CONFIG?: KVNamespace;
  KV_RATE_LIMIT?: KVNamespace;
  R2_ASSETS?: R2Bucket;
  SAVE_QUEUE?: Queue;
  APP_ENV?: string;
  ALLOWED_ORIGIN?: string;
  TURNSTILE_SECRET_KEY?: string;
  SESSION_SECRET?: string;
  ADMIN_SECRET?: string;
}

export function json(data: unknown, status = 200, headers: HeadersInit = {}): Response {
  return Response.json(data, { status, headers: { "cache-control": "no-store", ...headers } });
}

export async function readJson<T>(request: Request, maxBytes = 16_384): Promise<T> {
  const length = Number(request.headers.get("content-length") || 0);
  if (length > maxBytes) throw new HttpError(413, "Request body is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) throw new HttpError(413, "Request body is too large.");
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new HttpError(400, "Invalid JSON.");
  }
}

export function cleanText(value: unknown, maxLength: number): string {
  return String(value || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

export async function rateLimit(env: Env, request: Request, bucket: string, limit: number, seconds: number): Promise<void> {
  if (!env.KV_RATE_LIMIT) return;
  const ip = request.headers.get("cf-connecting-ip") || "local";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${bucket}:${ip}`));
  const key = `${bucket}:${Array.from(new Uint8Array(digest)).slice(0, 12).map((byte) => byte.toString(16).padStart(2, "0")).join("")}`;
  const current = Number(await env.KV_RATE_LIMIT.get(key) || 0);
  if (current >= limit) throw new HttpError(429, "Too many requests.");
  await env.KV_RATE_LIMIT.put(key, String(current + 1), { expirationTtl: seconds });
}

export async function validateTurnstile(env: Env, token: string, request: Request): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return env.APP_ENV !== "production";
  const form = new FormData();
  form.set("secret", env.TURNSTILE_SECRET_KEY);
  form.set("response", token);
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) form.set("remoteip", ip);
  const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const result = await response.json<{ success: boolean }>();
  return result.success;
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function handleError(error: unknown): Response {
  if (error instanceof HttpError) return json({ error: error.message }, error.status);
  console.error(error);
  return json({ error: "Internal server error." }, 500);
}
