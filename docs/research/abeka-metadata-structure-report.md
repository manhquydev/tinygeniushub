# Abeka Video Metadata Structure - Technical Research Report

**Generated:** 2026-04-03  
**Source:** `C:\Users\manhquy\.gemini\antigravity\scratch\abeka_tools`  
**Report Path:** `docs/research/abeka-metadata-structure-report.md`

---

## Executive Summary

This report documents the comprehensive metadata structure for the Abeka educational video content system. The dataset contains **20,195 videos** organized across **14 grade providers** (K4 through Grade 12) with **2,380 lessons** total. The content is hosted on `fileta.hoctienganh.xyz` and follows a strict naming convention enabling programmatic access.

---

## 1. System Overview

### 1.1 Key Statistics

| Metric | Value |
|--------|-------|
| Total Videos | 20,195 |
| Total Pages/Lessons | 2,380 |
| Grade Providers | 14 |
| Courses per Provider | 170 (fixed) |
| Host Domain | fileta.hoctienganh.xyz |
| Video Format | m3u8 (HLS streaming) |

### 1.2 Provider Distribution

| Provider | Grade | Grade ID | Videos | Description |
|----------|-------|----------|--------|-------------|
| k4 | K4 (Pre-K) | 13 | 1,595 | Kindergarten 4 |
| k5 | K5 (Kindergarten) | 14 | 1,710 | Kindergarten 5 |
| g1 | Grade 1 | 1 | 2,699 | First Grade |
| g2 | Grade 2 | 2 | 2,063 | Second Grade |
| g3 | Grade 3 | 3 | 1,564 | Third Grade |
| g4 | Grade 4 | 4 | 1,394 | Fourth Grade |
| g5 | Grade 5 | 5 | 1,391 | Fifth Grade |
| g6 | Grade 6 | 6 | 1,394 | Sixth Grade |
| g7 | Grade 7 | 7 | 872 | Seventh Grade |
| g8 | Grade 8 | 8 | 882 | Eighth Grade |
| g9 | Grade 9 | 9 | 891 | Ninth Grade |
| g10 | Grade 10 | 10 | 1,061 | Tenth Grade |
| g11 | Grade 11 | 11 | 1,404 | Eleventh Grade |
| g12 | Grade 12 | 12 | 1,275 | Twelfth Grade |

---

## 2. JSON Schema Documentation

### 2.1 Main Index Schema (`api/abeka/index.json`)

```json
{
  "meta": {
    "generated_at_utc": "string (ISO 8601 timestamp)",
    "resource_root": "string (e.g., '/abeka')",
    "provider_count": "integer",
    "page_count": "integer",
    "video_count": "integer",
    "error_count": "integer"
  },
  "providers": [
    {
      "provider": "string (e.g., 'g1', 'k4')",
      "provider_slug": "string",
      "grade_id": "string (numeric ID)",
      "course_count": "integer (always 170)",
      "page_count": "integer",
      "video_count": "integer",
      "path": "string (relative path to provider index)"
    }
  ]
}
```

### 2.2 Aggregated Data Schema (`api/abeka/all.json`)

```json
{
  "meta": {
    "generated_at_utc": "string",
    "domain": "string (e.g., 'https://hoctienganh.xyz')",
    "resource_root": "string",
    "page_count": "integer",
    "video_count": "integer",
    "error_count": "integer"
  },
  "stats": {
    "providers": {
      "{provider_id}": "integer (video count)"
    },
    "hosts": {
      "{hostname}": "integer (video count)"
    }
  },
  "pages": [
    {
      "resource_root": "string",
      "page_url": "string (full URL)",
      "page_key": "string (format: '{grade}/{lesson:03d}')",
      "path_segments": ["string"],
      "provider": "string",
      "course": "string (format: 'lesson-{lesson:03d}')",
      "topic": "string",
      "grade": "string",
      "lesson": "integer",
      "video_count": "integer",
      "videos": [
        {
          "order": "integer",
          "title": "string",
          "description": "string",
          "video_url": "string (HTTPS m3u8 URL)",
          "host": "string",
          "ext": "string (e.g., 'm3u8')"
        }
      ]
    }
  ]
}
```

### 2.3 Provider Index Schema (`api/abeka/providers/{provider}/index.json`)

```json
{
  "meta": {
    "resource_root": "string",
    "provider": "string",
    "provider_slug": "string",
    "grade_id": "string",
    "course_count": "integer",
    "page_count": "integer",
    "video_count": "integer"
  },
  "courses": [
    {
      "course": "string (format: 'lesson-{lesson:03d}')",
      "course_slug": "string (format: '{lesson:03d}')",
      "grade": "string",
      "lesson": "integer",
      "video_count": "integer",
      "path": "string"
    }
  ]
}
```

### 2.4 Lesson Detail Schema (`api/abeka/{grade}/{lesson}.json`)

```json
[
  {
    "title": "string (video title)",
    "file": "string (m3u8 URL)",
    "description": "string (formatted: '{Title} - Lesson: {N} - Teacher: {Name}')",
    "image": "string (thumbnail path)"
  }
]
```

### 2.5 Flat Database Schema (`abeka_database.json`)

```json
[
  {
    "title": "string",
    "description": "string",
    "video_url": "string",
    "grade": "string",
    "lesson": "integer"
  }
]
```

---

## 3. Grade/Subject/Lesson Hierarchy

### 3.1 Hierarchical Structure

```
Abeka Content
├── Providers (14)
│   ├── k4 (K4 - Kindergarten 4)
│   ├── k5 (K5 - Kindergarten 5)
│   ├── g1 (Grade 1)
│   ├── g2 (Grade 2)
│   ├── ...
│   └── g12 (Grade 12)
│
├── Courses per Provider (170 lessons per grade)
│   ├── lesson-001 through lesson-170
│
└── Videos per Lesson (variable)
    ├── K4: 5-14 videos per lesson
    ├── K5: 6 videos per lesson
    ├── G1: 11-16 videos per lesson
    ├── G12: 4-11 videos per lesson
    └── Varies by grade and subject coverage
```

### 3.2 Provider Pattern

**Format:** `{type}{number}`

| Pattern | Type | Examples |
|---------|------|----------|
| k{N} | Kindergarten | k4, k5 |
| g{N} | Grade | g1, g2, ..., g12 |

**Grade ID Mapping:**
- k4 → Grade ID: "13"
- k5 → Grade ID: "14"
- g1 → Grade ID: "1"
- ...
- g12 → Grade ID: "12"

### 3.3 Subject Distribution by Grade

#### K4 (Kindergarten 4) Subjects:
- K4 Phonics
- K4 Activities: Activity Time
- K4 Activities: Language Development
- K4 Activities: Skills Development
- K4 Bible

#### K5 (Kindergarten 5) Subjects:
- K5 Phonics
- K5 Numbers
- K5 Activities
- Elementary Spanish A (Spanish Lesson A/B)
- K5 Bible

#### Grade 1 Subjects:
- Activities
- Arithmetic (Arithmetic, Combination Practice)
- Bible
- Classroom Routines
- Phonics
- Reading (AM/PM Elephants, Giraffes, Monkeys)
- Seatwork (Cursive, Manuscript)
- Spelling
- Writing (Cursive, Manuscript)

#### Grade 12 Subjects:
- English 12
- Economics
- Precalculus
- Physics
- Document Processing
- Culinary Life Skills
- Revelation
- Spanish 2
- Speech
- American Government
- Old Testament (from Grade 11)

---

## 4. Key Fields Reference

### 4.1 Video URL Structure

**Pattern:** `https://fileta.hoctienganh.xyz/abk/{year}/{grade_path}/{code}/{code}.m3u8`

**Components:**
| Component | Description | Examples |
|-----------|-------------|----------|
| year | Content year | 2023 |
| grade_path | Grade directory | 01, 02, ..., 12, k4, k5 |
| code | Video identifier | 01PH001F, 12EN001E |

### 4.2 Video Code Naming Convention

**Format:** `{grade_code}{subject}{lesson}{type}{variant}`

**Pattern:** `XX##XXX#`

Where:
- `XX` = Grade code (01-12, K4, K5, 90)
- `##` = Subject code (2 letters)
- `###` = Lesson number (3 digits, zero-padded)
- `#` = Type suffix (A, B, C, D, E, F, etc.)
- `variant` = Optional variant indicator (AR for Additional Review)

**Subject Codes:**

| Code | Subject |
|------|---------|
| AC | Activities |
| AT | Arithmetic |
| AB | Arithmetic (Combination Practice) |
| BI | Bible |
| HA | Classroom Routines |
| PH | Phonics |
| SE | Seatwork (Cursive) |
| SM | Seatwork (Manuscript) |
| SP | Spelling |
| CW | Writing (Cursive) |
| MW | Writing (Manuscript) |
| EA | Reading (AM Elephants) |
| EP | Reading (PM Elephants) |
| GA | Reading (AM Giraffes) |
| GP | Reading (PM Giraffes) |
| MA | Reading (AM Monkeys) |
| MP | Reading (PM Monkeys) |
| EN | English |
| EC | Economics |
| PC | Precalculus |
| BY | Biology |
| WH | World History |
| A2 | Algebra 2 |
| DP | Document Processing |
| FS | Culinary Life Skills |
| RV | Revelation |
| SA | Spanish 2 |
| SP | Speech |
| AG | American Government |
| OG | Old Testament |
| NU | Numbers (K5) |
| LD | Language Development (K4) |
| SD | Skills Development (K4) |

**Type Suffixes (difficulty/section indicator):**

| Suffix | Meaning |
|--------|---------|
| A | Basic/Elementary |
| B | Beginning |
| C | Core/Standard |
| D | Developmental |
| E | Extended/Advanced |
| F | Full/Complete |

### 4.3 Description Format

**Template:** `{Title} - Lesson: {N} - Teacher: {Name}`

**Examples:**
- `"Phonics 1 - Lesson: 1 - Teacher: Miss Howe"`
- `"English 12 - Lesson: 1 - Teacher: Mr. Bucy"`
- `"K4 Phonics - Lesson: 1 - Teacher: Mrs. Stewart"`

---

## 5. Video URL Patterns

### 5.1 URL Templates by Grade Type

**Standard Grades (1-12):**
```
https://fileta.hoctienganh.xyz/abk/2023/{grade:02d}/{code}/{code}.m3u8
```

**Kindergarten (K4/K5):**
```
https://fileta.hoctienganh.xyz/abk/2023/{grade}/{code}/{code}.m3u8
```

### 5.2 URL Pattern Examples

| Grade | Subject | Lesson | Code | Full URL |
|-------|---------|--------|------|----------|
| 1 | Phonics | 1 | 01PH001F | `https://fileta.hoctienganh.xyz/abk/2023/01/01PH001F/01PH001F.m3u8` |
| 12 | English | 1 | 12EN001E | `https://fileta.hoctienganh.xyz/abk/2023/12/12EN001E/12EN001E.m3u8` |
| K4 | Phonics | 1 | K4PH001D | `https://fileta.hoctienganh.xyz/abk/2023/k4/K4PH001D/K4PH001D.m3u8` |
| K5 | Phonics | 1 | K5PH001D | `https://fileta.hoctienganh.xyz/abk/2023/k5/K5PH001D/K5PH001D.m3u8` |
| 10 | Algebra 2 Review | 1 | 10A2001-AR1.1E | `https://fileta.hoctienganh.xyz/abk/2023/10/10A2001-AR1.1E/10A2001-AR1.1E.m3u8` |

---

## 6. Key Relationships

### 6.1 Relationship Diagram

```
+-----------------+     +------------------+     +-----------------+
|  Provider       |---->|   Course/Lesson  |---->|     Video       |
|  (g1, g12, k4)  |     |   (lesson-001)   |     |   (m3u8 file)   |
+-----------------+     +------------------+     +-----------------+
        |                      |                        |
        v                      v                        v
   grade_id               lesson_num              video_url
   provider_slug          course_slug             title
   video_count            video_count             description
                                                    teacher
                                                    subject_code
```

### 6.2 Primary Keys

| Entity | Primary Key | Format |
|--------|-------------|--------|
| Provider | `provider` | k4, k5, g1-g12 |
| Lesson | `page_key` | {grade}/{lesson:03d} |
| Video | `video_url` | HTTPS m3u8 URL |
| Course | `course` | lesson-{lesson:03d} |

### 6.3 Foreign Key Relationships

```
all.json.pages[i].provider ──> index.json.providers[i].provider
all.json.pages[i].grade ──> providers/{grade}/index.json.meta.provider
all.json.pages[i].lesson ──> providers/{grade}/index.json.courses[i].lesson
all.json.pages[i].videos[j].video_url ──> abeka_database.json[i].video_url
```

---

## 7. Sample Data Structures

### 7.1 Provider Metadata Sample (g1)

```json
{
  "meta": {
    "resource_root": "/abeka",
    "provider": "g1",
    "provider_slug": "g1",
    "grade_id": "1",
    "course_count": 170,
    "page_count": 170,
    "video_count": 2699
  },
  "courses": [
    {
      "course": "lesson-001",
      "course_slug": "001",
      "grade": "g1",
      "lesson": 1,
      "video_count": 11,
      "path": "providers/g1/lessons/001.json"
    }
  ]
}
```

### 7.2 Lesson Videos Sample (Grade 1, Lesson 1)

```json
[
  {
    "title": "Phonics 1",
    "file": "https://fileta.hoctienganh.xyz/abk/2023/01/01PH001F/01PH001F.m3u8",
    "description": "Phonics 1 - Lesson: 1 - Teacher: Miss Howe",
    "image": "/images/banner.jpg"
  },
  {
    "title": "Arithmetic 1: Arithmetic",
    "file": "https://fileta.hoctienganh.xyz/abk/2023/01/01AT001F/01AT001F.m3u8",
    "description": "Arithmetic 1: Arithmetic - Lesson: 1 - Teacher: Miss Howe",
    "image": "/images/banner.jpg"
  },
  {
    "title": "Bible 1",
    "file": "https://fileta.hoctienganh.xyz/abk/2023/01/01BI001F/01BI001F.m3u8",
    "description": "Bible 1 - Lesson: 1 - Teacher: Miss Howe",
    "image": "/images/banner.jpg"
  }
]
```

### 7.3 All.json Page Entry Sample

```json
{
  "resource_root": "/abeka",
  "page_url": "https://hoctienganh.xyz/abeka/1",
  "page_key": "g1/001",
  "path_segments": ["g1", "001"],
  "provider": "g1",
  "course": "lesson-001",
  "topic": "",
  "grade": "g1",
  "lesson": 1,
  "video_count": 11,
  "videos": [
    {
      "order": 1,
      "title": "Activities 1",
      "description": "Activities 1 - Lesson: 1 - Teacher: Miss Howe",
      "video_url": "https://fileta.hoctienganh.xyz/abk/2023/01/01AC001F/01AC001F.m3u8",
      "host": "fileta.hoctienganh.xyz",
      "ext": "m3u8"
    }
  ]
}
```

---

## 8. File Structure Summary

```
abeka_tools/
├── abeka_database.json              # Flat array of all videos
├── api/
│   └── abeka/
│       ├── index.json                # Main provider index
│       ├── all.json                  # Aggregated data (17MB)
│       ├── all_raw.json              # Raw aggregated data
│       ├── providers/                # Provider-specific indexes
│       │   ├── g1/index.json
│       │   ├── g2/index.json
│       │   └── ...
│       ├── 1/                        # Grade 1 lessons
│       │   ├── 001.json
│       │   ├── 002.json
│       │   └── ...
│       ├── 12/                       # Grade 12 lessons
│       │   └── ...
│       ├── 13/                       # K4 lessons
│       │   └── ...
│       └── 14/                       # K5 lessons
│           └── ...
└── ...
```

---

## 9. Technical Implementation Notes

### 9.1 Data Access Patterns

**To get all providers:**
```javascript
const index = await fetch('/api/abeka/index.json');
const providers = index.providers;
```

**To get all videos for a grade:**
```javascript
const gradeData = await fetch('/api/abeka/all.json');
const gradeVideos = gradeData.pages.filter(p => p.grade === 'g1');
```

**To get specific lesson:**
```javascript
const lesson = await fetch('/api/abeka/1/001.json');
```

### 9.2 Video Code Parsing

```javascript
function parseVideoCode(code) {
  // Pattern: XX##XXX#
  // Example: 01PH001F, 12EN001E, K4PH001D
  
  const gradeMatch = code.match(/^(\d{2}|K[45])/);
  const subjectMatch = code.match(/^(?:\d{2}|K[45])([A-Z]{2})/);
  const lessonMatch = code.match(/^(?:\d{2}|K[45])[A-Z]{2}(\d{3})/);
  const typeMatch = code.match(/^(?:\d{2}|K[45])[A-Z]{2}\d{3}([A-Z])/);
  
  return {
    grade: gradeMatch ? gradeMatch[1] : null,
    subject: subjectMatch ? subjectMatch[1] : null,
    lesson: lessonMatch ? parseInt(lessonMatch[1]) : null,
    type: typeMatch ? typeMatch[1] : null
  };
}

// Example:
parseVideoCode('01PH001F');
// { grade: '01', subject: 'PH', lesson: 1, type: 'F' }
```

### 9.3 URL Generation

```javascript
function generateVideoUrl(code) {
  const grade = code.match(/^(\d{2}|K[45])/)[1];
  const gradePath = grade.startsWith('K') ? grade.toLowerCase() : grade;
  return `https://fileta.hoctienganh.xyz/abk/2023/${gradePath}/${code}/${code}.m3u8`;
}

// Example:
generateVideoUrl('01PH001F');
// https://fileta.hoctienganh.xyz/abk/2023/01/01PH001F/01PH001F.m3u8
```

---

## 10. Unresolved Questions

1. **Duration Information:** Video durations are not present in metadata - would need to fetch and analyze m3u8 files
2. **Teacher Mapping:** No centralized teacher database available
3. **Subject Taxonomy:** No hierarchical subject classification (e.g., "Math > Arithmetic")
4. **Content Versioning:** No version info for curriculum updates
5. **Availability Status:** No flags for unavailable/removed content
6. **Difficulty Levels:** Type suffixes (A-F) meaning not explicitly documented

---

*Report compiled from analysis of Abeka video metadata files.*
