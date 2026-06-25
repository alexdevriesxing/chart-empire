import type { Env } from "../_shared";
import { json } from "../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  let database = "unbound";
  if (env.DB) {
    try {
      await env.DB.prepare("SELECT 1").first();
      database = "ready";
    } catch {
      database = "error";
    }
  }
  return json({ ok: true, service: "chart-empire", environment: env.APP_ENV || "local", database, time: new Date().toISOString() });
};
