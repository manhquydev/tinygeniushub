PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS content_source (
  source_key TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  resource_root TEXT,
  notes TEXT,
  health_status TEXT NOT NULL DEFAULT 'unknown',
  health_message TEXT,
  health_checked_at TEXT
);

CREATE TABLE IF NOT EXISTS content_collection (
  collection_key TEXT PRIMARY KEY,
  source_key TEXT NOT NULL,
  provider TEXT,
  provider_slug TEXT,
  course TEXT,
  course_slug TEXT,
  topic TEXT,
  grade TEXT,
  lesson INTEGER,
  series_id TEXT,
  series_title TEXT,
  page_key TEXT,
  page_url TEXT,
  language TEXT,
  metadata_json TEXT,
  FOREIGN KEY (source_key) REFERENCES content_source (source_key)
);

CREATE TABLE IF NOT EXISTS content_video (
  video_key TEXT PRIMARY KEY,
  collection_key TEXT NOT NULL,
  item_order INTEGER,
  title TEXT,
  description TEXT,
  video_url TEXT NOT NULL,
  stream_type TEXT,
  host TEXT,
  ext TEXT,
  api_url TEXT,
  subtitle_url TEXT,
  image_url TEXT,
  raw_json TEXT,
  FOREIGN KEY (collection_key) REFERENCES content_collection (collection_key)
);

CREATE INDEX IF NOT EXISTS idx_collection_source ON content_collection (source_key);
CREATE INDEX IF NOT EXISTS idx_collection_provider_course ON content_collection (source_key, provider_slug, course_slug);
CREATE INDEX IF NOT EXISTS idx_collection_grade_lesson ON content_collection (source_key, grade, lesson);
CREATE INDEX IF NOT EXISTS idx_collection_series ON content_collection (source_key, series_id);

CREATE INDEX IF NOT EXISTS idx_video_collection ON content_video (collection_key);
CREATE INDEX IF NOT EXISTS idx_video_url ON content_video (video_url);
CREATE INDEX IF NOT EXISTS idx_video_host ON content_video (host);
CREATE INDEX IF NOT EXISTS idx_video_stream_type ON content_video (stream_type);
