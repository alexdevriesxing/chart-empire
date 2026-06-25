import type { Env } from "../../_shared";
import { json } from "../../_shared";

const blocked: PagesFunction<Env> = async ({ request, env }) => {
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!env.ADMIN_SECRET || provided !== env.ADMIN_SECRET) return json({ error: "Unauthorized." }, 401);
  return json({ enabled: false, message: "Admin data controls are intentionally not implemented in the MVP." }, 501);
};
export const onRequestGet = blocked;
export const onRequestPut = blocked;
