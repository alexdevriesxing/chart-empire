import type { Env } from "../../_shared";
import { json } from "../../_shared";

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const cached = await env.KV_CONFIG?.get("public-config", "json");
  return json(cached || {
    maintenanceMode: false,
    adsEnabled: false,
    cloudSavesEnabled: Boolean(env.DB),
    logoUploadsEnabled: Boolean(env.R2_ASSETS),
    leaderboardsEnabled: Boolean(env.DB)
  }, 200, { "cache-control": "public, max-age=60" });
};
