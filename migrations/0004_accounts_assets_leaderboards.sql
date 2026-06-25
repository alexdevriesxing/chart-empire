CREATE TABLE IF NOT EXISTS player_assets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_player_assets_user ON player_assets(user_id, created_at DESC);

ALTER TABLE leaderboard_entries ADD COLUMN save_id TEXT REFERENCES cloud_saves(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leaderboard_user_save_scenario
ON leaderboard_entries(user_id, save_id, scenario)
WHERE user_id IS NOT NULL AND save_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sessions_expiry ON sessions(expires_at);
