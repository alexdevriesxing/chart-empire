CREATE INDEX IF NOT EXISTS idx_cloud_saves_user_updated ON cloud_saves(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_leaderboard_scenario_score ON leaderboard_entries(scenario, score DESC);
CREATE INDEX IF NOT EXISTS idx_contact_leads_created ON contact_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_song_of_week_active ON song_of_week(is_active, active_from DESC);
