import type { Env } from "./_shared";

export const onRequest: PagesFunction<Env> = async (context) => {
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  headers.set("x-frame-options", "SAMEORIGIN");
  headers.set("content-security-policy", "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://*.effectivecpmnetwork.com https://*.highperformanceformat.com https://highperformanceformat.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; media-src 'self' blob:; connect-src 'self' https://challenges.cloudflare.com https://*.effectivecpmnetwork.com https://*.highperformanceformat.com https://highperformanceformat.com; frame-src https:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; upgrade-insecure-requests");
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
};
