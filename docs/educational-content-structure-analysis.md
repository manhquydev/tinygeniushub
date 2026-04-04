# Educational Content Structure Analysis Report

**Generated:** 2026-03-31  
**Source:** hoctienganh.xyz Content Database  
**Data Snapshot:** 2026-03-10 (UTC)

---

## Executive Summary

This report analyzes the educational content structure from hoctienganh.xyz, a Vietnamese English learning platform aggregating content from multiple sources. The system contains **36,360 videos** organized across **2,659 collections** from **6 content sources**.

| Metric | Count |
|--------|-------|
| Total Sources | 6 |
| Total Collections | 2,659 |
| Total Videos | 36,360 |
| Grades Covered | K4-G12 (14 grades) |
| Language Options | EN, CN |

---

## 1. Content Source Inventory

### 1.1 Source Overview

| Source Key | Display Name | Resource Root | Collections | Videos | Health Status |
|------------|--------------|---------------|-------------|--------|---------------|
| `abeka` | Abeka | /abeka | 2,380 | 20,195 | unknown |
| `littlefox` | Littlefox EN | /littlefox | 136 | 8,718 | unknown |
| `littlefoxcn` | Littlefox CN | /littlefoxcn | 48 | 1,983 | unknown |
| `playtt` | PlayTT | /playtt | 57 | 4,938 | unknown |
| `playgg` | PlayGG | /playgg | 26 | 514 | unknown |
| `phim` | Phim | /phim | 12 | 12 | unavailable |

**Health Note:** `phim` source is marked unavailable due to upstream HTTP 502 errors from video hosts.

---

## 2. Database Schema Structure

### 2.1 Core Tables

```
┌─────────────────────────────────────────────────────────┐
│                  content_source                           │
├─────────────────────────────────────────────────────────┤
│ source_key (PK)     │ abeka, littlefox, etc.           │
│ display_name        │ Human-readable name                │
│ resource_root         │ /abeka, /littlefox, etc.           │
│ notes                 │ Import metadata                    │
│ health_status         │ unknown, available, unavailable    │
│ health_message        │ Error details                      │
│ health_checked_at     │ Timestamp                          │
└─────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────┐
│                content_collection                         │
├─────────────────────────────────────────────────────────┤
│ collection_key (PK)   │ Unique identifier                  │
│ source_key (FK)       │ Links to content_source            │
│ provider              │ Grade/series provider              │
│ provider_slug         │ URL-friendly provider name         │
│ course                │ Course name                        │
│ course_slug           │ URL-friendly course name             │
│ topic                 │ Subject/topic (nullable)           │
│ grade                 │ K4, K5, g1-g12, level 1-9          │
│ lesson                │ Lesson number                      │
│ series_id             │ Littlefox series code (FSxxxx)     │
│ series_title          │ Series display title               │
│ page_key              │ URL path segment                   │
│ page_url              │ Full page URL                      │
│ language              │ en, cn                             │
│ metadata_json         │ item_count, etc.                   │
└─────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  content_video                          │
├─────────────────────────────────────────────────────────┤
│ video_key (PK)        │ Unique identifier                  │
│ collection_key (FK)   │ Links to content_collection        │
│ item_order            │ Sequence within collection         │
│ title                 │ Video title                        │
│ description           │ Detailed description               │
│ video_url             │ Stream URL (m3u8/mp4)              │
│ stream_type           │ hls, mp4                           │
│ host                  │ CDN/host domain                    │
│ ext                   │ File extension                     │
│ api_url               │ Littlefox API endpoint             │
│ subtitle_url          │ Caption/subtitle URL               │
│ image_url             │ Thumbnail image                    │
│ raw_json              │ Original API payload               │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Content Source Details

### 3.1 Abeka (Primary Educational Content)

**Type:** Structured K-12 Curriculum  
**Total Collections:** 2,380  
**Total Videos:** 20,195  
**Grade Structure:** K4, K5, g1-g12 (14 grades)  
**Lesson Range:** 1-170 per grade  
**Language:** English

#### Grade Distribution

| Grade | Grade Level | Lesson Range | Collections | Avg Videos/Lesson |
|-------|-------------|--------------|-------------|-------------------|
| K4 | Pre-K | 1-100 | ~100 | 8-12 |
| K5 | Kindergarten | 1-170 | ~170 | 9-11 |
| G1 | Grade 1 | 1-170 | ~170 | 11-16 |
| G2 | Grade 2 | 1-170 | ~170 | 12-16 |
| G3 | Grade 3 | 1-170 | ~170 | 11-15 |
| G4 | Grade 4 | 1-170 | ~170 | 11-14 |
| G5 | Grade 5 | 1-170 | ~170 | 10-14 |
| G6 | Grade 6 | 1-170 | ~170 | 8-10 |
| G7 | Grade 7 | 1-170 | ~170 | 7-9 |
| G8 | Grade 8 | 1-170 | ~170 | 7-9 |
| G9 | Grade 9 | 1-170 | ~170 | 6-8 |
| G10 | Grade 10 | 1-170 | ~170 | 6-8 |
| G11 | Grade 11 | 1-170 | ~170 | 6-8 |
| G12 | Grade 12 | 1-170 | ~170 | 6-12 |

#### Subject Categories (Sample)

Each lesson contains multiple subjects:
- **K4-K5:** Activities, Phonics, Numbers, Bible, Writing
- **G1-G6:** Arithmetic, Bible, Phonics, Reading, Spelling, Writing, Language, History, Health, Penmanship
- **G7-G12:** Advanced Math (Algebra, Geometry, Precalculus), Science (Biology, Chemistry, Physics), History, English, Foreign Languages (Spanish), Bible, Life Skills

**Video Host:** fileta.hoctienganh.xyz  
**Stream Format:** HLS (.m3u8)  
**URL Pattern:** `https://fileta.hoctienganh.xyz/abk/{year}/{grade}/{lesson}.json`

---

### 3.2 Littlefox EN (Animated Stories)

**Type:** Animated Educational Stories  
**Total Collections:** 136  
**Total Videos:** 8,718  
**Level Structure:** 9 levels (1-9)  
**Language:** English

#### Level Distribution

| Level | Description | Series Count | Total Episodes | Example Series |
|-------|-------------|--------------|----------------|----------------|
| 1 | Beginner | 12 | ~700 | ABC Book, Word Families, Bat and Friends |
| 2 | Early Reader | 13 | ~1,100 | Phonics I, Bird and Kip, Space Patrol |
| 3 | Elementary | 17 | ~1,400 | Cinderella, Snow White, Jack and the Beanstalk |
| 4 | Intermediate | 18 | ~1,300 | Rocket Girl, Dr. Dolittle, Aesop's Fables |
| 5 | Upper Int. | 19 | ~1,200 | Journey to the West, Alice in Wonderland, Heidi |
| 6 | Advanced | 19 | ~900 | Shakespeare, Sherlock Holmes, Jane Eyre |
| 7 | Proficient | 15 | ~800 | Treasure Island, Little Women, Anne |
| 8 | Literature | 14 | ~600 | Oscar Wilde, Greek Myths, Dracula |
| 9 | Classics | 9 | ~400 | Les Misérables, Phantom of the Opera |

**Series ID Format:** FS + 4 digits (e.g., FS0172, FS0058)  
**Video Host:** cdn.littlefox.com  
**Stream Format:** HLS (.m3u8)  
**API Pattern:** `https://hoctienganh.xyz/api/playlf?id={FC_ID}&cn=0`

**Content Types by Level:**
- **Levels 1-3:** Phonics, basic vocabulary, simple stories
- **Levels 4-5:** Fairy tales, science, nature, folktales
- **Levels 6-7:** Classic literature adaptations, history
- **Levels 8-9:** Advanced literature, world classics

---

### 3.3 Littlefox CN (Chinese Language)

**Type:** Chinese Language Learning  
**Total Collections:** 48  
**Total Videos:** 1,983  
**Level Structure:** 5 levels (1-5)  
**Language:** Chinese (with Korean interface)

#### Level Distribution

| Level | Description | Series Count | Example Content |
|-------|-------------|--------------|-----------------|
| 1 | Pinyin/Introduction | 14 | Nihao Chinese, Tones, Initials |
| 2 | Basic Stories | 7 | Single Stories, Mrs. Kelly's Class |
| 3 | Intermediate | 8 | Fairy tales (Cinderella, Puss in Boots) |
| 4 | Upper Int. | 6 | Rocket Girl, Danny's Adventures |
| 5 | Advanced | 9 | Journey to the West, Alice in Wonderland |

**Series ID Format:** DP + 6 digits (e.g., DP000777, DP000805)  
**Note:** Content mirrors English series but with Chinese language instruction focus

---

### 3.4 PlayTT (Test Prep & Educational Videos)

**Type:** Test Preparation + Educational Content  
**Total Collections:** 57  
**Total Videos:** 4,938  
**Providers:** Multiple (TEDed, Acellus, Heinemann, Numberblocks, PeppaPig, Ben10)  
**Language:** English

#### Provider Breakdown

| Provider | Course Count | Video Count | Content Type |
|----------|--------------|-------------|--------------|
| TEDed | 6 | 215 | IELTS Preparation |
| Acellus | Multiple | ~3,000 | K-12 Curriculum |
| Numberblocks | Multiple | ~500 | Math Education |
| PeppaPig | Multiple | ~300 | Early Childhood |
| Other | Various | ~900 | Mixed Content |

**IELTS Courses (TEDed):**
- INSIGHT IELTS 1-3 (102 videos)
- Step into IELTS 1-3 (113 videos)

**Video Host:** fileta.hoctienganh.xyz, rclone2.2tech.vn  
**Stream Format:** HLS (.m3u8)

---

### 3.5 PlayGG (General Education)

**Type:** General Educational Content  
**Total Collections:** 26  
**Total Videos:** 514  
**Providers:** Muzzy, KLE, KhoaHoc, GOGO, Single Stories  
**Language:** English

**Content Categories:**
- Language learning (Muzzy)
- Science content (KhoaHoc)
- Single stories/short content

**Video Host:** rclone2.2tech.vn  
**Stream Format:** MP4

---

### 3.6 Phim (Movies - Currently Unavailable)

**Type:** Entertainment Movies  
**Total Collections:** 12  
**Total Videos:** 12  
**Providers:** Wallace & Gromit, Transformers, etc.  
**Status:** Unavailable (upstream 502 errors)

**Note:** Entertainment content currently disabled due to hosting issues.

---

## 4. Content Categorization

### 4.1 By Educational Purpose

| Category | Sources | Video Count | Description |
|----------|---------|-------------|-------------|
| **Core Curriculum** | abeka | 20,195 | Structured K-12 academic subjects |
| **Literature/Stories** | littlefox, littlefoxcn | 10,701 | Animated stories, classics |
| **Test Prep** | playtt | 4,938 | IELTS, standardized tests |
| **Supplementary** | playgg | 514 | General educational content |
| **Entertainment** | phim | 12 | Movies (unavailable) |

### 4.2 By Age/Grade Appropriateness

| Age Range | Sources | Grade/Level | Content Focus |
|-----------|---------|-------------|---------------|
| Preschool (3-5) | abeka, littlefox | K4-K5, Level 1 | Phonics, basics, stories |
| Elementary (6-11) | abeka, littlefox | G1-G6, Level 2-4 | Core subjects, literature |
| Middle (12-14) | abeka, littlefox | G7-G9, Level 5-6 | Advanced subjects, classics |
| High School (15-18) | abeka, playtt | G10-G12, Level 7-9 | College prep, test prep |
| Adult | playtt, littlefox | IELTS, Level 8-9 | Professional, language skills |

### 4.3 By Content Format

| Format | Sources | Stream Type | Use Case |
|--------|---------|-------------|----------|
| **Structured Lessons** | abeka | HLS | Daily curriculum |
| **Story Series** | littlefox, littlefoxcn | HLS | Extensive reading |
| **Course Videos** | playtt | HLS | Test preparation |
| **Short Content** | playgg | MP4 | Supplementary |

---

## 5. Data Relationship Diagrams

### 5.1 Source-to-Collection Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│                        content_source                                 │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────┤
│   abeka     │  littlefox  │ littlefoxcn │   playtt    │   playgg    │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       │             │             │             │             │
       │             │             │             │             │
       ▼             ▼             ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Provider │  │ Provider │  │ Provider │  │ Provider │  │ Provider │
│  = Grade │  │  = Level │  │  = Level │  │ = Course │  │ = Course │
│  (g1-12) │  │  (1-9)   │  │  (1-5)   │  │  (IELTS) │  │  (Muzzy) │
└─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘
      │             │             │             │             │
      ▼             ▼             ▼             ▼             ▼
┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│ Collection│  │ Collection│  │ Collection│  │ Collection│  │ Collection│
│  = Lesson │  │  = Series │  │  = Series │  │  = Page   │  │  = Page   │
│ (1-170)   │  │ (FSxxxx)  │  │ (DPxxxx)  │  │  (varies) │  │  (varies) │
└──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘
```

### 5.2 Collection-to-Video Structure

```
content_collection: col_0660c5b25524f2dc (abeka, g1, lesson-38)
│
├─ video 1: Activities 1
├─ video 2: Arithmetic 1: Arithmetic
├─ video 3: Arithmetic 1: Combination Practice
├─ video 4: Bible 1
├─ video 5: Phonics 1
├─ video 6-11: Reading (AM/PM Elephants, Giraffes, Monkeys)
├─ video 12-13: Seatwork (Cursive/Manuscript)
├─ video 14: Spelling 1
└─ video 15-16: Writing (Cursive/Manuscript)

content_collection: col_0644ac37b50ccb23 (littlefox, FS0058 - Oliver Twist)
│
├─ video 1: Oliver Twist 1: Workhouse
├─ video 2: Oliver Twist 2: Escape
├─ ...
└─ video 60: Oliver Twist 30: A Family for Oliver
```

### 5.3 Cross-Source Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    Content Relationship Map                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────┐         ┌──────────┐         ┌──────────┐          │
│  │  abeka   │         │ littlefox│         │ littlefoxcn│        │
│  │  (US)    │         │  (KR)    │         │  (CN)    │          │
│  │ K-12     │         │ Stories  │         │ 中文学习 │          │
│  └────┬─────┘         └────┬─────┘         └────┬─────┘          │
│       │                    │                    │                 │
│       │                    │                    │                 │
│       └────────────────────┼────────────────────┘                 │
│                            │                                     │
│                     ┌──────▼──────┐                             │
│                     │  Unified DB │                             │
│                     │  (Cross-ref)│                             │
│                     └──────┬──────┘                             │
│                            │                                     │
│       ┌────────────────────┼────────────────────┐                │
│       │                    │                    │                │
│  ┌────▼─────┐         ┌────▼─────┐         ┌────▼─────┐           │
│  │  playtt  │         │  playgg  │         │   phim   │           │
│  │ Test Prep│         │ General  │         │ Movies   │           │
│  │ (IELTS)  │         │ Content  │         │(inactive)│           │
│  └──────────┘         └──────────┘         └──────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Content Inventory Summary

### 6.1 Videos by Source

| Source | Videos | % of Total | Primary Use |
|--------|--------|------------|-------------|
| abeka | 20,195 | 55.5% | Core curriculum |
| littlefox | 8,718 | 24.0% | Literature/stories |
| playtt | 4,938 | 13.6% | Test preparation |
| littlefoxcn | 1,983 | 5.5% | Chinese learning |
| playgg | 514 | 1.4% | Supplementary |
| phim | 12 | 0.03% | Entertainment |
| **Total** | **36,360** | **100%** | |

### 6.2 Collections by Source

| Source | Collections | Avg Videos/Collection |
|--------|-------------|----------------------|
| abeka | 2,380 | 8.5 |
| littlefox | 136 | 64.1 |
| playtt | 57 | 86.6 |
| littlefoxcn | 48 | 41.3 |
| playgg | 26 | 19.8 |
| phim | 12 | 1.0 |
| **Total** | **2,659** | **13.7** |

---

## 7. Technical Implementation Notes

### 7.1 API Endpoint Structure

```
api/
├── abeka/
│   ├── index.json                    # All grades
│   └── providers/
│       └── {grade}/
│           ├── index.json            # Lessons for grade
│           └── lessons/
│               └── {lesson}.json     # Lesson videos
├── littlefox/
│   ├── index.json                    # All series
│   ├── {series_id}.json             # Series episodes
│   └── {series_id}/
│       └── {episode}.json            # Single episode
├── littlefoxcn/
│   ├── index.json                    # All series
│   ├── {series_id}.json             # Series episodes
│   └── {series_id}/
│       └── {episode}.json            # Single episode
├── playtt/
│   ├── index.json                    # All providers
│   └── providers/
│       └── {provider}/
│           ├── index.json            # Courses
│           └── courses/
│               └── {course}.json      # Course videos
├── playgg/
│   └── ... (similar to playtt)
└── phim/
    └── ... (similar structure)
```

### 7.2 Video Hosting Distribution

| Host | Sources | Video Count | Format |
|------|---------|-------------|--------|
| fileta.hoctienganh.xyz | abeka, playtt | ~24,000 | HLS |
| cdn.littlefox.com | littlefox, littlefoxcn | ~10,700 | HLS |
| rclone2.2tech.vn | playgg, playtt | ~1,000 | MP4 |
| vip.opstream*.com | phim | 12 | HLS (unavailable) |

---

## 8. Recommendations for Learning System Design

### 8.1 Content Organization

1. **Primary Path (Abeka):** Use as core curriculum structure
   - Organize by Grade → Lesson → Subject
   - 14 grade levels provide comprehensive K-12 coverage

2. **Supplementary Path (Littlefox):** Use for extensive reading
   - Organize by Level → Series → Episode
   - Level 1-9 provides progressive reading difficulty

3. **Assessment Path (PlayTT):** Use for test preparation
   - Organize by Provider → Course → Video
   - Focus on IELTS preparation content

### 8.2 User Progression Model

```
┌─────────────────────────────────────────────────────────────────┐
│                     Learning Progression Map                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  AGE 3-5 (Preschool)                                            │
│  ├─ Abeka K4-K5 (Core)                                          │
│  └─ Littlefox Level 1 (Stories)                                 │
│                                                                   │
│  AGE 6-11 (Elementary)                                          │
│  ├─ Abeka G1-G6 (Core)                                          │
│  ├─ Littlefox Level 2-4 (Reading)                             │
│  └─ PlayGG (Supplementary)                                      │
│                                                                   │
│  AGE 12-14 (Middle School)                                      │
│  ├─ Abeka G7-G9 (Core)                                          │
│  ├─ Littlefox Level 5-6 (Classics)                             │
│  └─ PlayTT Beginner (Test Prep)                                │
│                                                                   │
│  AGE 15-18 (High School)                                        │
│  ├─ Abeka G10-G12 (Core)                                        │
│  ├─ Littlefox Level 7-9 (Advanced Literature)                 │
│  └─ PlayTT IELTS (Test Prep)                                   │
│                                                                   │
│  ADULT (18+)                                                    │
│  ├─ PlayTT IELTS (Professional)                                │
│  └─ Littlefox Level 8-9 (Literature)                          │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Content Suggestions by Use Case

| Use Case | Recommended Sources | Priority |
|----------|---------------------|----------|
| **Daily Homeschool Curriculum** | abeka | Primary |
| **Reading Practice** | littlefox | Primary |
| **IELTS Preparation** | playtt (TEDed) | Primary |
| **Chinese Learning** | littlefoxcn | Primary |
| **Math Supplement** | playtt (Numberblocks) | Secondary |
| **Science Content** | abeka, playtt | Secondary |
| **Entertainment** | phim (when available) | Tertiary |

---

## 9. Unresolved Questions

1. **Phim Source Recovery:** What is the timeline for restoring phim content? Are there alternative hosting solutions?

2. **Content Updates:** What is the refresh frequency for each source? Is there an automated sync process?

3. **Metadata Enhancement:** Can subject/topic tags be added to abeka content for better filtering?

4. **Cross-Reference:** Is there any correlation between abeka grade levels and littlefox levels for curriculum alignment?

5. **Student Tracking:** Does the current schema support student progress tracking across sources?

6. **Subtitle Availability:** Which videos have subtitle files available? (Currently only littlefox has documented subtitle URLs)

7. **Offline Support:** Are there mechanisms for downloading content for offline viewing?

---

## 10. Appendices

### Appendix A: Abeka Grade-to-Year Mapping

| Grade | Year | Subject Count/Lesson |
|-------|------|---------------------|
| K4 | 2023 | 7-9 |
| K5 | 2023 | 9-11 |
| G1-G4 | 2023 | 13-16 |
| G5 | 2025 | 10-14 |
| G6-G12 | 2023 | 6-12 |

### Appendix B: Littlefox Series Count by Level

| Level | Series Count | Total Episodes |
|-------|--------------|----------------|
| 1 | 12 | 708 |
| 2 | 13 | 1,060 |
| 3 | 17 | 1,422 |
| 4 | 18 | 1,327 |
| 5 | 19 | 1,204 |
| 6 | 19 | 920 |
| 7 | 15 | 774 |
| 8 | 14 | 621 |
| 9 | 9 | 390 |

### Appendix C: SQL Query Examples

```sql
-- Videos per source
SELECT c.source_key, COUNT(*) AS total_videos
FROM content_video v
JOIN content_collection c ON c.collection_key = v.collection_key
GROUP BY c.source_key;

-- Collections by grade (Abeka)
SELECT grade, COUNT(*) AS collections, SUM((metadata_json->>'item_count')::int) AS videos
FROM content_collection
WHERE source_key = 'abeka'
GROUP BY grade
ORDER BY grade;

-- Series by level (Littlefox)
SELECT series_title, series_id, grade AS level,
       (metadata_json->>'item_count')::int AS episodes
FROM content_collection
WHERE source_key = 'littlefox'
ORDER BY grade, series_title;
```

---

*Report generated by ClaudeKit Technology Research Agent*  
*Data Source: C:\Users\manhquy\.gemini\antigravity\scratch\abeka_tools*  
*Timestamp: 2026-03-31*
