import type { Env } from "../../_shared";
import { assertSameOrigin, requireUser } from "../../auth";
import { cleanText, handleError, HttpError, json, rateLimit, readJson } from "../../_shared";

function saveId(params: EventContext<Env, string, Record<string, unknown>>["params"]): string {
  const id = cleanText(params.id, 64);
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new HttpError(400, "Invalid save identifier.");
  return id;
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request, params }) => {
  try {
    if (!env.DB) throw new HttpError(503, "Cloud saves are not configured.");
    const user = await requireUser(env, request);
    const row = await env.DB.prepare(`
      SELECT id, label_name AS labelName, state_json AS stateJson, game_version AS gameVersion,
             updated_at AS updatedAt, created_at AS createdAt
      FROM cloud_saves WHERE id = ? AND user_id = ?
    `).bind(saveId(params), user.id).first<{ id: string; labelName: string; stateJson: string; gameVersion: number; updatedAt: string; createdAt: string }>();
    if (!row) throw new HttpError(404, "Cloud save not found.");
    return json({ ...row, state: JSON.parse(row.stateJson), stateJson: undefined });
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestPut: PagesFunction<Env> = async ({ env, request, params }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "cloud-save-update", 180, 3600);
    if (!env.DB) throw new HttpError(503, "Cloud saves are not configured.");
    const user = await requireUser(env, request);
    const body = await readJson<{ labelName?: string; state?: unknown }>(request, 524_288);
    if (!body.state || typeof body.state !== "object" || Array.isArray(body.state)) throw new HttpError(400, "Invalid save state.");
    const state = body.state as Record<string, unknown>;
    if (state.version !== 1 || !Array.isArray(state.artists) || !Array.isArray(state.songs)) throw new HttpError(400, "Invalid Chart Empire save state.");
    const labelName = cleanText(body.labelName || state.labelName, 40);
    const result = await env.DB.prepare(`
      UPDATE cloud_saves SET label_name = ?, state_json = ?, game_version = 1, updated_at = datetime('now')
      WHERE id = ? AND user_id = ?
    `).bind(labelName, JSON.stringify(state), saveId(params), user.id).run();
    if (!result.meta.changes) throw new HttpError(404, "Cloud save not found.");
    await env.SAVE_QUEUE?.send({ type: "save-backup", id: saveId(params), userId: user.id });
    return json({ ok: true, id: saveId(params), updatedAt: new Date().toISOString() });
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestDelete: PagesFunction<Env> = async ({ env, request, params }) => {
  try {
    assertSameOrigin(request, env);
    if (!env.DB) throw new HttpError(503, "Cloud saves are not configured.");
    const user = await requireUser(env, request);
    const result = await env.DB.prepare("DELETE FROM cloud_saves WHERE id = ? AND user_id = ?").bind(saveId(params), user.id).run();
    if (!result.meta.changes) throw new HttpError(404, "Cloud save not found.");
    return json({ ok: true });
  } catch (error) {
    return handleError(error);
  }
};
