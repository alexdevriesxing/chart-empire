import type { Env } from "../_shared";
import { json } from "../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const cached = await env.KV_CONFIG?.get("song-of-week", "json");
  if (cached) return json(cached, 200, { "cache-control": "public, max-age=300" });
  if (!env.DB) return json({ title: "Song of the Week", artist: "Xing Records", youtubeId: "", url: "https://www.xingrecords.com" });
  const row = await env.DB.prepare("SELECT title, artist, youtube_id AS youtubeId, description FROM song_of_week WHERE is_active = 1 ORDER BY active_from DESC LIMIT 1").first();
  return json(row || { title: "Song of the Week", artist: "Xing Records", youtubeId: "", url: "https://www.xingrecords.com" }, 200, { "cache-control": "public, max-age=300" });
};
