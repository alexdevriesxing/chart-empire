import type { Env } from "../../_shared";
import { handleError, HttpError, json, readJson } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  if (!env.DB) return json({ saves: [], configured: false });
  return json({ saves: [], configured: true, authRequired: true });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) throw new HttpError(503, "Cloud saves are not configured.");
    const body = await readJson<{ labelName?: string; state?: unknown }>(request, 524_288);
    if (!body.labelName || !body.state) throw new HttpError(400, "Label name and state are required.");
    throw new HttpError(401, "Registered sessions are required for cloud saves.");
  } catch (error) {
    return handleError(error);
  }
};
