import type { Env } from "../../_shared";
import { assertSameOrigin, clearSessionCookie, destroySession } from "../../auth";
import { handleError, json } from "../../_shared";

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await destroySession(env, request);
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie() });
  } catch (error) {
    return handleError(error);
  }
};
