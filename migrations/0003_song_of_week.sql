INSERT OR IGNORE INTO song_of_week (id, title, artist, youtube_id, description, active_from, is_active, created_at)
VALUES ('default', 'Song of the Week', 'Xing Records', '', 'Configure this feature through the admin layer or environment values.', datetime('now'), 1, datetime('now'));
