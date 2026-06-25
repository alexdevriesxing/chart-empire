import type { Env } from "../../_shared";
import { assertSameOrigin, requireUser } from "../../auth";
import { cleanText, handleError, HttpError, json, rateLimit, readJson } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return json({ entries: [], configured: false });
  const url = new URL(request.url);
  const scenario = cleanText(url.searchParams.get("scenario") || "", 40);
  const baseQuery = `
    SELECT leaderboard_entries.label_name AS labelName, leaderboard_entries.score, leaderboard_entries.week,
           leaderboard_entries.scenario, leaderboard_entries.created_at AS createdAt,
           users.display_name AS playerName
    FROM leaderboard_entries LEFT JOIN users ON users.id = leaderboard_entries.user_id
    ${scenario ? "WHERE leaderboard_entries.scenario = ?" : ""}
    ORDER BY leaderboard_entries.score DESC, leaderboard_entries.created_at ASC LIMIT 50`;
  const statement = env.DB.prepare(baseQuery);
  const result = scenario ? await statement.bind(scenario).all() : await statement.all();
  return json({ entries: result.results, configured: true }, 200, { "cache-control": "public, max-age=15, stale-while-revalidate=30" });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    assertSameOrigin(request, env);
    await rateLimit(env, request, "leaderboard", 10, 3600);
    if (!env.DB) throw new HttpError(503, "Leaderboards are not configured.");
    const user = await requireUser(env, request);
    const body = await readJson<{ saveId?: string; scenario?: string }>(request);
    const saveId = cleanText(body.saveId, 64);
    const save = await env.DB.prepare("SELECT label_name, state_json FROM cloud_saves WHERE id = ? AND user_id = ?").bind(saveId, user.id)
      .first<{ label_name: string; state_json: string }>();
    if (!save) throw new HttpError(404, "Cloud save not found.");
    const state = JSON.parse(save.state_json) as Record<string, unknown>;
    const score = calculateCareerScore(state);
    const week = Math.max(1, Math.min(5200, Math.round(Number(state.week) || 1)));
    const scenario = cleanText(body.scenario || state.challengeId || "career", 40);
    const existing = await env.DB.prepare("SELECT id, score FROM leaderboard_entries WHERE user_id = ? AND save_id = ? AND scenario = ?")
      .bind(user.id, saveId, scenario).first<{ id: string; score: number }>();
    if (existing && existing.score >= score) return json({ ok: true, id: existing.id, score: existing.score, improved: false });
    const id = existing?.id || crypto.randomUUID();
    if (existing) {
      await env.DB.prepare(`
        UPDATE leaderboard_entries SET label_name = ?, score = ?, week = ?, created_at = datetime('now')
        WHERE id = ? AND user_id = ?
      `).bind(save.label_name, score, week, existing.id, user.id).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO leaderboard_entries (id, user_id, save_id, label_name, score, week, scenario, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(id, user.id, saveId, save.label_name, score, week, scenario).run();
    }
    return json({ ok: true, id, score, improved: true }, existing ? 200 : 201);
  } catch (error) {
    return handleError(error);
  }
};

function calculateCareerScore(state: Record<string, unknown>): number {
  const songs = Array.isArray(state.songs) ? state.songs as Array<Record<string, unknown>> : [];
  const achievements = Array.isArray(state.achievements) ? state.achievements.length : 0;
  const numberOnes = songs.filter((song) => Number(song.chartPosition) === 1).length;
  const topTens = songs.filter((song) => Number(song.chartPosition) > 0 && Number(song.chartPosition) <= 10).length;
  const streams = songs.reduce((sum, song) => sum + Math.max(0, Number(song.streams) || 0), 0);
  const cash = Math.max(0, Number(state.cash) || 0);
  const fans = Math.max(0, Number(state.fanbase) || 0);
  const reputation = Math.max(0, Number(state.reputation) || 0);
  return Math.min(2_000_000_000, Math.round(cash / 10 + fans * 3 + streams / 50 + reputation * 5_000 + topTens * 50_000 + numberOnes * 200_000 + achievements * 20_000));
}
