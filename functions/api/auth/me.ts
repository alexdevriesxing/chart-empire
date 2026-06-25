import type { Env } from "../../_shared";
import { getAuthenticatedUser } from "../../auth";
import { json } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const user = await getAuthenticatedUser(env, request);
  return json({ user, enabled: Boolean(env.DB && env.SESSION_SECRET && env.PASSWORD_PEPPER && env.TURNSTILE_SECRET_KEY) });
};
