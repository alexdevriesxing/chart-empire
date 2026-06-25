import type { Env } from "../../_shared";
import { requireUser } from "../../auth";
import { handleError, HttpError } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  try {
    if (!env.DB) throw new HttpError(503, "Account storage is not configured.");
    const user = await requireUser(env, request);
    const [saves, achievements, leaderboards, assets] = await env.DB.batch([
      env.DB.prepare("SELECT id, label_name, state_json, game_version, updated_at, created_at FROM cloud_saves WHERE user_id = ? ORDER BY updated_at DESC").bind(user.id),
      env.DB.prepare("SELECT achievement_key, unlocked_at FROM achievements WHERE user_id = ? ORDER BY unlocked_at").bind(user.id),
      env.DB.prepare("SELECT label_name, score, week, scenario, created_at FROM leaderboard_entries WHERE user_id = ? ORDER BY created_at DESC").bind(user.id),
      env.DB.prepare("SELECT id, content_type, byte_size, created_at FROM player_assets WHERE user_id = ? ORDER BY created_at DESC").bind(user.id)
    ]);
    return new Response(JSON.stringify({
      exportedAt: new Date().toISOString(),
      user,
      saves: (saves.results as Array<Record<string, unknown>>).map((save) => ({ ...save, state: JSON.parse(String(save.state_json)), state_json: undefined })),
      achievements: achievements.results,
      leaderboards: leaderboards.results,
      assets: assets.results
    }, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="chart-empire-account-${user.id}.json"`,
        "cache-control": "no-store"
      }
    });
  } catch (error) {
    return handleError(error);
  }
};
