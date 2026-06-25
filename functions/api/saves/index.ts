import type { Env } from "../../_shared";
import { assertSameOrigin, requireUser } from "../../auth";
import { cleanText, handleError, HttpError, json, rateLimit, readJson } from "../../_shared";

interface SaveBody {
  id?: string;
  labelName?: string;
  state?: unknown;
}

function validateState(state: unknown): asserts state is Record<string, unknown> {
  if (!state || typeof state !== "object" || Array.isArray(state)) throw new HttpError(400, "Save state must be an object.");
  const candidate = state as Record<string, unknown>;
  if (candidate.version !== 1 || typeof candidate.labelName !== "string" || !Array.isArray(candidate.artists) || !Array.isArray(candidate.songs)) {
    throw new HttpError(400, "Invalid Chart Empire save state.");
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) throw new HttpError(503, "Cloud saves are not configured.");
    const user = await requireUser(env, request);
    const result = await env.DB.prepare(`
      SELECT id, label_name AS labelName, game_version AS gameVersion, updated_at AS updatedAt, created_at AS createdAt,
             json_extract(state_json, '$.week') AS week,
             json_extract(state_json, '$.cash') AS cash,
             json_extract(state_json, '$.fanbase') AS fanbase,
             json_extract(state_json, '$.logo') AS logo
      FROM cloud_saves WHERE user_id = ? ORDER BY updated_at DESC LIMIT 20
    `).bind(user.id).all();
    return json({ saves: result.results, configured: true });
  } catch (error) {
    return handleError(error);
  }
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "cloud-save-create", 30, 3600);
    if (!env.DB) throw new HttpError(503, "Cloud saves are not configured.");
    const user = await requireUser(env, request);
    const body = await readJson<SaveBody>(request, 524_288);
    validateState(body.state);
    const labelName = cleanText(body.labelName || body.state.labelName, 40);
    if (!labelName) throw new HttpError(400, "Label name is required.");
    const existingCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM cloud_saves WHERE user_id = ?").bind(user.id).first<{ count: number }>();
    if ((existingCount?.count || 0) >= 10) throw new HttpError(409, "Cloud save limit reached. Delete an old career first.");
    const id = crypto.randomUUID();
    await env.DB.prepare(`
      INSERT INTO cloud_saves (id, user_id, label_name, state_json, game_version, updated_at, created_at)
      VALUES (?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `).bind(id, user.id, labelName, JSON.stringify(body.state)).run();
    await env.SAVE_QUEUE?.send({ type: "save-backup", id, userId: user.id });
    return json({ id, labelName, state: body.state, updatedAt: new Date().toISOString() }, 201);
  } catch (error) {
    return handleError(error);
  }
};
