-- Littlefox relational schema
-- Generated for data collected from:
--   https://hoctienganh.xyz/littlefox
--   https://hoctienganh.xyz/littlefox/play2?lfid=...
--   https://hoctienganh.xyz/api/playlf?id=<fc_id>&cn=0

CREATE TABLE IF NOT EXISTS littlefox_series (
  lfid TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  level INTEGER,
  play2_url TEXT,
  featured_image TEXT,
  status TEXT,
  episode_count INTEGER,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS littlefox_episodes (
  episode_id INTEGER PRIMARY KEY AUTOINCREMENT,
  episode_fc_id TEXT NOT NULL,
  lfid TEXT NOT NULL,
  episode_index INTEGER NOT NULL,
  episode_no INTEGER NOT NULL,
  episode_title TEXT,
  cont_title TEXT,
  fs_id TEXT,
  charge TEXT,
  type TEXT,
  title_time_sec REAL,
  play_time_sec REAL,
  hls_url TEXT,
  playlf_api_url TEXT,
  play2_url TEXT,
  caption_en_xml_url TEXT,
  caption_cn_xml_url TEXT,
  source TEXT,
  status TEXT,
  raw_json TEXT,
  updated_at TEXT,
  FOREIGN KEY (lfid) REFERENCES littlefox_series (lfid),
  UNIQUE (lfid, episode_index)
);

CREATE INDEX IF NOT EXISTS idx_littlefox_episodes_lfid
  ON littlefox_episodes (lfid);

CREATE INDEX IF NOT EXISTS idx_littlefox_episodes_series_order
  ON littlefox_episodes (lfid, episode_index);

CREATE INDEX IF NOT EXISTS idx_littlefox_episodes_fc_id
  ON littlefox_episodes (episode_fc_id);
