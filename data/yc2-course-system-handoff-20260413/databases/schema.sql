PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    parent_id INTEGER REFERENCES topics(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_parent ON topics(parent_id);
CREATE INDEX IF NOT EXISTS idx_topics_level ON topics(level);
CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    topic_id INTEGER NOT NULL REFERENCES topics(id),
    course_mode TEXT NOT NULL DEFAULT 'topic-mixed',
    difficulty_level INTEGER NOT NULL CHECK (difficulty_level BETWEEN 1 AND 10),
    age_min INTEGER,
    age_max INTEGER,
    status TEXT NOT NULL DEFAULT 'draft',
    content_sources_json TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_courses_topic ON courses(topic_id);
CREATE INDEX IF NOT EXISTS idx_courses_mode ON courses(course_mode);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON courses(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

CREATE TABLE IF NOT EXISTS course_modules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_course_modules_course_id ON course_modules(course_id);

CREATE TABLE IF NOT EXISTS course_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
    content_source TEXT NOT NULL,
    collection_key TEXT NOT NULL,
    video_key TEXT NOT NULL,
    title TEXT,
    video_url TEXT NULL,
    difficulty_level INTEGER,
    confidence REAL,
    sort_order INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, module_id, content_source, collection_key, video_key)
);

CREATE INDEX IF NOT EXISTS idx_course_items_course_id ON course_items(course_id);
CREATE INDEX IF NOT EXISTS idx_course_items_source ON course_items(content_source);

CREATE TABLE IF NOT EXISTS tags (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    pattern_type TEXT NOT NULL DEFAULT 'keyword',
    pattern_value TEXT NOT NULL,
    confidence_threshold REAL NOT NULL DEFAULT 0.7,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_category ON tags(category);

CREATE TABLE IF NOT EXISTS content_tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_source TEXT NOT NULL,
    collection_key TEXT NOT NULL,
    video_key TEXT NOT NULL,
    tag_slug TEXT NOT NULL,
    confidence REAL NOT NULL,
    difficulty_suggested INTEGER,
    matched_keywords TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(content_source, collection_key, video_key, tag_slug)
);

CREATE INDEX IF NOT EXISTS idx_content_tags_lookup ON content_tags(content_source, collection_key, video_key);
CREATE INDEX IF NOT EXISTS idx_content_tags_tag_slug ON content_tags(tag_slug);
CREATE INDEX IF NOT EXISTS idx_content_tags_confidence ON content_tags(confidence);

CREATE TABLE IF NOT EXISTS difficulty_mapping (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,
    sub_provider TEXT NOT NULL DEFAULT '',
    source_value TEXT NOT NULL,
    unified_level INTEGER NOT NULL CHECK (unified_level BETWEEN 1 AND 10),
    age_min INTEGER,
    age_max INTEGER,
    note TEXT,
    UNIQUE(source, sub_provider, source_value)
);

CREATE INDEX IF NOT EXISTS idx_difficulty_mapping_source ON difficulty_mapping(source, sub_provider);

CREATE TRIGGER IF NOT EXISTS trg_topics_set_updated_at
AFTER UPDATE ON topics
FOR EACH ROW
BEGIN
    UPDATE topics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trg_courses_set_updated_at
AFTER UPDATE ON courses
FOR EACH ROW
BEGIN
    UPDATE courses SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
