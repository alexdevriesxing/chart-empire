import type { Env } from "./_shared";
import { HttpError } from "./_shared";
import { hashPasswordWithPepper, validatePasswordStrength, verifyPasswordWithPepper } from "../src/shared/passwordCrypto";

const SESSION_COOKIE = "chart_empire_session";
const SESSION_DAYS = 30;

export interface AuthUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

interface SessionRow {
  user_id: string;
  email: string;
  display_name: string;
  created_at: string;
}

function randomToken(byteLength = 32): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function hashPassword(password: string, env: Env): Promise<string> {
  if (!env.PASSWORD_PEPPER) throw new HttpError(503, "Account security is not configured.");
  return hashPasswordWithPepper(password, env.PASSWORD_PEPPER);
}

export async function verifyPassword(password: string, encoded: string, env: Env): Promise<boolean> {
  if (!env.PASSWORD_PEPPER) throw new HttpError(503, "Account security is not configured.");
  return verifyPasswordWithPepper(password, encoded, env.PASSWORD_PEPPER);
}

export function validatePassword(password: string): void {
  try {
    validatePasswordStrength(password);
  } catch (error) {
    throw new HttpError(400, error instanceof Error ? error.message : "Password does not meet requirements.");
  }
}

export async function createSession(env: Env, userId: string): Promise<{ cookie: string; expiresAt: string }> {
  if (!env.DB || !env.SESSION_SECRET) throw new HttpError(503, "Account sessions are not configured.");
  const token = randomToken();
  const tokenHash = await sha256(`${token}:${env.SESSION_SECRET}`);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000).toISOString();
  await env.DB.prepare("INSERT INTO sessions (id_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, datetime('now'))")
    .bind(tokenHash, userId, expiresAt).run();
  return {
    expiresAt,
    cookie: `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86_400}; Priority=High`
  };
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export function getCookie(request: Request, name: string): string | null {
  const cookies = request.headers.get("cookie") || "";
  for (const segment of cookies.split(";")) {
    const [key, ...parts] = segment.trim().split("=");
    if (key === name) return parts.join("=");
  }
  return null;
}

export async function destroySession(env: Env, request: Request): Promise<void> {
  if (!env.DB || !env.SESSION_SECRET) return;
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  const tokenHash = await sha256(`${token}:${env.SESSION_SECRET}`);
  await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(tokenHash).run();
}

export async function getAuthenticatedUser(env: Env, request: Request): Promise<AuthUser | null> {
  if (!env.DB || !env.SESSION_SECRET) return null;
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256(`${token}:${env.SESSION_SECRET}`);
  const row = await env.DB.prepare(`
    SELECT sessions.user_id, users.email, users.display_name, users.created_at
    FROM sessions JOIN users ON users.id = sessions.user_id
    WHERE sessions.id_hash = ? AND sessions.expires_at > datetime('now')
  `).bind(tokenHash).first<SessionRow>();
  if (!row) return null;
  return { id: row.user_id, email: row.email, displayName: row.display_name, createdAt: row.created_at };
}

export async function requireUser(env: Env, request: Request): Promise<AuthUser> {
  const user = await getAuthenticatedUser(env, request);
  if (!user) throw new HttpError(401, "Sign in to continue.");
  return user;
}

export function assertSameOrigin(request: Request, env: Env): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set([requestOrigin, env.ALLOWED_ORIGIN].filter(Boolean));
  if (!allowed.has(origin)) throw new HttpError(403, "Origin is not allowed.");
}
