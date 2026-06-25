import type { Env } from "../../_shared";
import { cleanText, handleError, HttpError, json, rateLimit, readJson } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!env.DB) return json({ entries: [], configured: false });
  const url = new URL(request.url);
  const scenario = cleanText(url.searchParams.get("scenario") || "career", 40);
  const result = await env.DB.prepare("SELECT label_name AS labelName, score, week, scenario, created_at AS createdAt FROM leaderboard_entries WHERE scenario = ? ORDER BY score DESC LIMIT 50").bind(scenario).all();
  return json({ entries: result.results, configured: true }, 200, { "cache-control": "public, max-age=60" });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  try {
    await rateLimit(env, request, "leaderboard", 10, 3600);
    if (!env.DB) throw new HttpError(503, "Leaderboards are not configured.");
    const body = await readJson<{ labelName?: string; score?: number; week?: number; scenario?: string }>(request);
    const labelName = cleanText(body.labelName, 40);
    const score = Math.max(0, Math.min(2_000_000_000, Math.round(Number(body.score))));
    const week = Math.max(1, Math.min(5200, Math.round(Number(body.week))));
    if (!labelName || !Number.isFinite(score) || !Number.isFinite(week)) throw new HttpError(400, "Invalid leaderboard result.");
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO leaderboard_entries (id, label_name, score, week, scenario, created_at) VALUES (?, ?, ?, ?, ?, datetime('now'))")
      .bind(id, labelName, score, week, cleanText(body.scenario || "career", 40)).run();
    return json({ ok: true, id }, 201);
  } catch (error) {
    return handleError(error);
  }
};
