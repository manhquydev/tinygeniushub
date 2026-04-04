# Resource-to-Learning-Path Mapping

**Document Version:** 1.0  
**Created:** 2026-03-31  
**Last Updated:** 2026-03-31  
**Status:** Draft for Implementation

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Content Taxonomy](#2-content-taxonomy)
3. [Learning Path Templates](#3-learning-path-templates)
4. [Cross-Source Integration](#4-cross-source-integration)
5. [Content Sequencing Rules](#5-content-sequencing-rules)
6. [Sample Learning Journeys](#6-sample-learning-journeys)
7. [Implementation Data Model](#7-implementation-data-model)
8. [Appendices](#8-appendices)

---

## 1. Executive Summary

This document establishes a comprehensive mapping system connecting 36,360 educational videos across 5 content sources to structured learning paths. The mapping enables:

- **Unified progression tracking** across multiple content providers
- **Personalized learning journeys** based on age, ability, and goals
- **Cross-source content recommendations** for reinforcement
- **Automated sequencing** with prerequisite validation

### Content Source Summary

| Source | Collections | Videos | Primary Purpose | Target Age |
|--------|-------------|--------|-----------------|------------|
| **Abeka** | 2,380 | 20,195 | Core K-12 Curriculum | 3-18 |
| **Littlefox EN** | 136 | 8,718 | English Literature/Stories | 3-15 |
| **Littlefox CN** | 48 | 1,983 | Chinese Language Learning | 6-18 |
| **PlayTT** | 57 | 4,938 | Test Prep (IELTS) | 12-Adult |
| **PlayGG** | 26 | 514 | General Supplementary | 3-12 |

---

## 2. Content Taxonomy

### 2.1 Unified Subject Categories

All content is classified into 9 primary subject domains:

```
┌─────────────────────────────────────────────────────────────┐
│                  UNIFIED SUBJECT TAXONOMY                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   MATH      │  │   ELA       │  │   SCIENCE   │         │
│  │ Arithmetic  │  │ Reading     │  │ Biology     │         │
│  │ Algebra     │  │ Writing     │  │ Chemistry   │         │
│  │ Geometry    │  │ Phonics     │  │ Physics     │         │
│  │ Precalc     │  │ Spelling    │  │ Health      │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   SOCIAL    │  │   LANGUAGE  │  │   TEST      │         │
│  │   STUDIES   │  │   ARTS      │  │   PREP      │         │
│  │ History     │  │ English     │  │ IELTS       │         │
│  │ Geography   │  │ Chinese     │  │ TOEFL       │         │
│  │ Civics      │  │ Spanish     │  │ SAT/ACT     │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   ARTS      │  │   LIFE      │  │   STORIES   │         │
│  │   & MUSIC   │  │   SKILLS    │  │   & LIT     │         │
│  │ Art         │  │ Bible       │  │ Fairy Tales │         │
│  │ Music       │  │ Penmanship  │  │ Classics    │         │
│  │ Crafts      │  │ Habits      │  │ Folktales   │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Source-to-Subject Mapping

#### Abeka Subject Mapping

| Grade Range | Subjects per Lesson | Category Mapping |
|-------------|---------------------|------------------|
| K4-K5 (400 lessons) | Activities, Phonics, Numbers, Bible, Writing, Seatwork | ELA, Math, Life Skills |
| G1-G5 (850 lessons) | Arithmetic, Bible, Phonics, Reading, Spelling, Writing, Language, History, Health, Penmanship, Seatwork | Math, ELA, Social Studies, Life Skills |
| G6-G8 | + Science, Literature | + Science |
| G9-G12 | + Algebra, Geometry, Precalc, Biology, Chemistry, Physics, Spanish, Life Skills | Full STEM + Languages |

**Abeka Collection Pattern:**
```
Provider: Grade (K4, K5, g1-g12)
Course: "abeka" 
Topic: Subject name (e.g., "arithmetic", "phonics", "reading")
Lesson: 1-170 per grade
```

#### Littlefox EN Subject Mapping

| Level | Series Count | Category | Subject Tags |
|-------|--------------|----------|--------------|
| 1 | 12 | Stories & Lit | Phonics, Vocabulary, Basics |
| 2 | 13 | Stories & Lit | Early Reading, Science Intro |
| 3 | 17 | Stories & Lit | Literature, Nature, Science |
| 4 | 18 | Stories & Lit | Classics, Science, History |
| 5 | 19 | Stories & Lit | World Literature, Geography |
| 6 | 19 | Stories & Lit | Shakespeare, History |
| 7 | 15 | Stories & Lit | British Classics, Geography |
| 8 | 14 | Stories & Lit | World Literature, Mythology |
| 9 | 9 | Stories & Lit | Advanced Classics |

**Series ID Format:** FS + 4 digits (e.g., FS0172, FS0058)

#### Littlefox CN Subject Mapping

| Level | Series Count | HSK Alignment | Subject |
|-------|--------------|---------------|---------|
| 1 | 14 | HSK 1-2 | Pinyin, Tones, Basics |
| 2 | 7 | HSK 2-3 | Simple Stories |
| 3 | 8 | HSK 3-4 | Fairy Tales |
| 4 | 6 | HSK 4-5 | Narrative Stories |
| 5 | 9 | HSK 5-6 | Classic Literature |

**Series ID Format:** DP + 6 digits (e.g., DP000777)

#### PlayTT Subject Mapping

| Provider | Courses | Subject | Difficulty |
|----------|---------|---------|------------|
| TEDed | 6 | Test Prep | IELTS Focused |
| Acellus | Multiple | Core Curriculum | K-12 |
| Numberblocks | Multiple | Math | Elementary |
| PeppaPig | Multiple | Stories | Preschool |
| Ben10 | Multiple | Stories/Eng | Elementary |

**IELTS Course Codes:**
- `INSIGHT_IELTS_1` (34 videos)
- `INSIGHT_IELTS_2` (34 videos)
- `INSIGHT_IELTS_3` (34 videos)
- `STEP_IELTS_1` (38 videos)
- `STEP_IELTS_2` (37 videos)
- `STEP_IELTS_3` (38 videos)

### 2.3 Difficulty Level Definitions

#### Universal Difficulty Scale

| Level Code | Name | Age Range | Grade Equiv | CEFR | HSK |
|------------|------|-----------|-------------|------|-----|
| BEG | Beginner | 3-5 | K4-K5 | Pre-A1 | - |
| ELEM1 | Elementary 1 | 5-7 | G1-G2 | A1 | HSK 1 |
| ELEM2 | Elementary 2 | 7-9 | G3-G4 | A2 | HSK 2 |
| INT1 | Intermediate 1 | 9-11 | G5-G6 | B1 | HSK 3 |
| INT2 | Intermediate 2 | 11-13 | G7-G8 | B1+ | HSK 4 |
| ADV1 | Advanced 1 | 13-15 | G9-G10 | B2 | HSK 5 |
| ADV2 | Advanced 2 | 15-17 | G11-G12 | B2+ | HSK 6 |
| PROF | Proficient | 17+ | College | C1+ | - |

#### Source-to-Difficulty Matrix

```
┌──────────────────────────────────────────────────────────────────┐
│              DIFFICULTY PROGRESSION MATRIX                      │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Difficulty    │ Abeka    │ Littlefox EN │ Littlefox CN │ PlayTT │
│  ──────────────┼──────────┼──────────────┼──────────────┼────────│
│  BEG (3-5)     │ K4-K5    │ Level 1      │ Level 1      │ -      │
│  ELEM1 (5-7)   │ G1-G2    │ Level 2      │ Level 2      │ -      │
│  ELEM2 (7-9)   │ G3-G4    │ Level 3      │ Level 3      │ -      │
│  INT1 (9-11)   │ G5-G6    │ Level 4      │ Level 4      │ -      │
│  INT2 (11-13)  │ G7-G8    │ Level 5      │ Level 5      │ Intro  │
│  ADV1 (13-15)  │ G9-G10   │ Level 6      │ -            │ IELTS  │
│  ADV2 (15-17)  │ G11-G12  │ Level 7      │ -            │ IELTS  │
│  PROF (17+)    │ -        │ Level 8-9    │ -            │ Adv    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2.4 Age/Grade Appropriateness Matrix

| Age | Grade | Primary Source | Supplementary | Minutes/Day |
|-----|-------|----------------|---------------|-------------|
| 3 | K4 | Abeka K4 | Littlefox L1 | 15-20 |
| 4 | K5 | Abeka K5 | Littlefox L1 | 20-25 |
| 5 | G1 | Abeka G1 | Littlefox L2 | 25-30 |
| 6 | G2 | Abeka G2 | Littlefox L2 | 30-35 |
| 7 | G3 | Abeka G3 | Littlefox L3 | 35-40 |
| 8 | G4 | Abeka G4 | Littlefox L3 | 40-45 |
| 9 | G5 | Abeka G5 | Littlefox L4 | 45-50 |
| 10 | G6 | Abeka G6 | Littlefox L4 | 50-55 |
| 11 | G7 | Abeka G7 | Littlefox L5 | 55-60 |
| 12 | G8 | Abeka G8 | Littlefox L5 | 60-65 |
| 13 | G9 | Abeka G9 | Littlefox L6 | 65-70 |
| 14 | G10 | Abeka G10 | Littlefox L6 | 70-75 |
| 15 | G11 | Abeka G11 | Littlefox L7 | 75-80 |
| 16 | G12 | Abeka G12 | Littlefox L7 | 80-85 |
| 17+ | Adult | PlayTT IELTS | Littlefox L8-9 | 90-120 |

---

## 3. Learning Path Templates

### 3.1 Template A: K-12 Curriculum Path (Abeka-Based)

**Structure:** Grade → Subject → Lesson → Video

```yaml
path_type: k12_curriculum
source: abeka
hierarchy:
  level_1: grade        # K4, K5, g1-g12
  level_2: lesson        # 1-170 per grade
  level_3: subject       # arithmetic, phonics, reading, etc.
  level_4: video         # individual video within subject
```

#### Weekly Plan Template

```
┌─────────────────────────────────────────────────────────────────────┐
│              WEEKLY K-12 CURRICULUM PLAN TEMPLATE                    │
│                    Grade: {grade} | Week: {week_number}                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MONDAY                                                             │
│  ├─ Lesson {lesson_num}: Activities        (Abeka)   [15-20 min]   │
│  ├─ Lesson {lesson_num}: Phonics/Reading   (Abeka)   [20-25 min]   │
│  ├─ Lesson {lesson_num}: Arithmetic        (Abeka)   [20-25 min]   │
│  └─ Seatwork/Writing Practice              (Abeka)   [15-20 min]   │
│                                                                      │
│  TUESDAY                                                            │
│  ├─ Lesson {lesson_num+1}: Activities      (Abeka)   [15-20 min]   │
│  ├─ Lesson {lesson_num+1}: Bible/History   (Abeka)   [15-20 min]   │
│  ├─ Lesson {lesson_num+1}: Phonics        (Abeka)   [20-25 min]   │
│  └─ Spelling Practice                      (Abeka)   [15-20 min]   │
│                                                                      │
│  WEDNESDAY                                                          │
│  ├─ Lesson {lesson_num+2}: Activities      (Abeka)   [15-20 min]   │
│  ├─ Lesson {lesson_num+2}: Arithmetic      (Abeka)   [20-25 min]   │
│  ├─ Lesson {lesson_num+2}: Reading         (Abeka)   [20-25 min]   │
│  └─ Science/Health (G3+)                     (Abeka)   [15-20 min]   │
│                                                                      │
│  THURSDAY                                                           │
│  ├─ Lesson {lesson_num+3}: Activities      (Abeka)   [15-20 min]   │
│  ├─ Lesson {lesson_num+3}: Phonics         (Abeka)   [20-25 min]   │
│  ├─ Lesson {lesson_num+3}: Writing         (Abeka)   [20-25 min]   │
│  └─ Penmanship Practice                    (Abeka)   [15-20 min]   │
│                                                                      │
│  FRIDAY                                                             │
│  ├─ Lesson {lesson_num+4}: Activities      (Abeka)   [15-20 min]   │
│  ├─ Lesson {lesson_num+4}: Arithmetic      (Abeka)   [20-25 min]   │
│  ├─ Lesson {lesson_num+4}: Bible/History   (Abeka)   [15-20 min]   │
│  └─ WEEKLY REVIEW & ASSESSMENT                               [30 min]│
│                                                                      │
│  WEEKEND (Optional Supplementary)                                   │
│  ├─ Littlefox Story Level {grade_aligned}  [20-30 min]   │
│  └─ Numberblocks Math (PlayTT)             [15-20 min]   │
│                                                                      │
│  WEEKLY TOTAL: ~20-25 lessons | 6-8 hours | 5 core subjects         │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Assessment Points & Milestones

| Milestone | Grade | Lesson | Assessment Type |
|-----------|-------|--------|-----------------|
| Phonics Mastery | K4 | Lesson 50 | Recognition Test |
| Reading Readiness | K5 | Lesson 85 | Sight Words (100) |
| G1 Completion | G1 | Lesson 170 | Subject Assessments |
| Arithmetic Fluency | G3 | Lesson 85 | Times Tables (1-10) |
| Science Transition | G6 | Lesson 1 | Lab Skills Intro |
| Algebra Readiness | G7 | Lesson 1 | Pre-Algebra Test |
| College Prep Start | G9 | Lesson 1 | PSAT-style Diagnostic |
| Graduation Ready | G12 | Lesson 170 | Comprehensive Exit Exam |

### 3.2 Template B: English Story Learning Path (Littlefox EN)

**Structure:** Level → Series → Episode → Video

```yaml
path_type: story_learning
source: littlefox
hierarchy:
  level_1: level         # 1-9
  level_2: series        # FSxxxx codes
  level_3: episode      # 1-N per series
  level_4: video         # individual episode
```

#### Daily Plan Template

```
┌─────────────────────────────────────────────────────────────────────┐
│           DAILY ENGLISH STORY LEARNING PLAN                          │
│              Level: {level} | Series: {series_title}               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  📺 WATCH PHASE                                    [10-15 minutes]  │
│  ├─ Episode {n}: {episode_title}                                     │
│  ├─ Play video with subtitles ON (first viewing)                     │
│  └─ Note: New vocabulary items (3-5 words)                           │
│                                                                      │
│  🎯 COMPREHENSION PHASE                            [5-10 minutes]   │
│  ├─ Episode quiz (if available)                                        │
│  ├─ Retell story in 3 sentences                                      │
│  └─ Answer: Who? What? Where? When? Why?                            │
│                                                                      │
│  📚 VOCABULARY PHASE                               [5-10 minutes]   │
│  ├─ Review vocabulary flashcards                                     │
│  ├─ Practice pronunciation of new words                              │
│  └─ Use each new word in a sentence                                  │
│                                                                      │
│  🔁 REINFORCEMENT PHASE (Optional)                 [5-10 minutes]   │
│  ├─ Re-watch episode without subtitles                               │
│  ├─ Shadow reading (speak along with characters)                     │
│  └─ Draw/write about the story                                        │
│                                                                      │
│  📊 DAILY COMPLETION CHECKLIST                                       │
│  [ ] Watched episode                                                 │
│  [ ] Completed comprehension check                                   │
│  [ ] Learned 3-5 new vocabulary words                                │
│  [ ] Can retell story main points                                    │
│                                                                      │
│  ⏱️ TOTAL TIME: 25-45 minutes per day                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Vocabulary Building Progression

| Level | Vocabulary Focus | Target Words/Series | Total Words |
|-------|------------------|---------------------|-------------|
| 1 | Basic nouns, verbs, adjectives | 50-100 | ~600 |
| 2 | Sight words, simple phrases | 100-150 | ~1,500 |
| 3 | Story vocabulary, descriptions | 150-200 | ~3,000 |
| 4 | Advanced descriptors, idioms | 200-250 | ~4,500 |
| 5 | Literary terms, cultural references | 250-300 | ~5,500 |
| 6 | Shakespearean vocabulary | 300-400 | ~6,500 |
| 7 | Academic vocabulary | 400-500 | ~7,500 |
| 8 | Literary analysis terms | 500-600 | ~8,000 |
| 9 | University-level literature | 600+ | ~9,000+ |

#### Series Completion Milestones

```
Level 1: 12 series × avg 59 episodes = ~708 episodes
├─ ABC Book (26 eps) - Alphabet mastery
├─ Word Families (20 eps) - Phonics patterns
└─ Bat and Friends (72 eps) - First long-form story

Level 2: 13 series × avg 82 episodes = ~1,060 episodes
├─ Phonics I (50 eps) - Complete phonics
├─ Bird and Kip (72 eps) - Friendship stories
└─ Space Patrol (24 eps) - Science themes

Level 3: 17 series × avg 84 episodes = ~1,422 episodes
├─ Cinderella (24 eps) - Classic fairy tale
├─ Snow White (24 eps) - Character development
└─ Jack and the Beanstalk (24 eps) - Adventure

... (continues through Level 9)
```

### 3.3 Template C: IELTS/Test Prep Path (PlayTT)

**Structure:** Skill (Reading/Listening/Writing/Speaking) → Course → Topic → Video

```yaml
path_type: test_preparation
source: playtt
hierarchy:
  level_1: skill          # reading, listening, writing, speaking
  level_2: course         # INSIGHT_IELTS_1, STEP_IELTS_1, etc.
  level_3: topic          # specific skill area
  level_4: video          # individual lesson
```

#### Intensive Weekly Plan

```
┌─────────────────────────────────────────────────────────────────────┐
│              INTENSIVE IELTS WEEKLY PLAN                            │
│                    Target Band: {6.0|6.5|7.0|7.5+}                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MONDAY: LISTENING FOCUS                           [90-120 minutes]   │
│  ├─ 09:00-09:45: INSIGHT IELTS 1 - Section 1 Strategies              │
│  ├─ 09:45-10:00: Break                                              │
│  ├─ 10:00-10:45: INSIGHT IELTS 1 - Section 2 Maps/Plans             │
│  ├─ 10:45-11:00: Break                                              │
│  ├─ 11:00-11:45: Practice: 1 complete listening test                │
│  └─ 11:45-12:00: Review mistakes & vocabulary                         │
│                                                                      │
│  TUESDAY: READING FOCUS                            [90-120 minutes]   │
│  ├─ 09:00-09:45: STEP IELTS 1 - Skimming techniques                   │
│  ├─ 09:45-10:00: Break                                              │
│  ├─ 10:00-10:45: STEP IELTS 1 - True/False/Not Given                  │
│  ├─ 10:45-11:00: Break                                              │
│  ├─ 11:00-11:45: Practice: 2 academic passages                        │
│  └─ 11:45-12:00: Vocabulary journal review                            │
│                                                                      │
│  WEDNESDAY: WRITING FOCUS                          [90-120 minutes]   │
│  ├─ 09:00-09:45: INSIGHT IELTS 2 - Task 1 Graphs                      │
│  ├─ 09:45-10:00: Break                                              │
│  ├─ 10:00-10:45: INSIGHT IELTS 2 - Task 2 Essay Structure             │
│  ├─ 10:45-11:00: Break                                              │
│  ├─ 11:00-11:30: Practice: Write 1 Task 1 (20 min timed)            │
│  └─ 11:30-12:00: Self-review with checklist                          │
│                                                                      │
│  THURSDAY: SPEAKING FOCUS                          [90-120 minutes]   │
│  ├─ 09:00-09:45: STEP IELTS 2 - Part 1 Introductions                 │
│  ├─ 09:45-10:00: Break                                              │
│  ├─ 10:00-10:45: STEP IELTS 2 - Part 2 Cue Cards                      │
│  ├─ 10:45-11:00: Break                                              │
│  ├─ 11:00-11:45: Practice: Record 3 Part 2 responses                  │
│  └─ 11:45-12:00: Playback & self-assessment                          │
│                                                                      │
│  FRIDAY: INTEGRATED PRACTICE                       [120-150 minutes]  │
│  ├─ 09:00-10:30: Full Listening Test (30 min) + Review (60 min)      │
│  ├─ 10:30-10:45: Break                                              │
│  ├─ 10:45-12:15: Full Reading Test (60 min) + Review (30 min)        │
│  └─ 12:15-12:30: Weekly progress tracking                            │
│                                                                      │
│  SATURDAY: WRITING & SPEAKING PRACTICE             [120 minutes]    │
│  ├─ 09:00-10:00: Full Task 1 + Task 2 writing (timed)                │
│  ├─ 10:00-10:15: Break                                              │
│  └─ 10:15-12:00: Mock Speaking test (all 3 parts)                    │
│                                                                      │
│  SUNDAY: REVIEW & VOCABULARY                       [60-90 minutes]    │
│  ├─ Review week's weakest areas                                      │
│  ├─ Vocabulary consolidation (50 new words)                           │
│  └─ Plan next week's focus areas                                      │
│                                                                      │
│  WEEKLY TOTAL: ~12-15 hours | 4 skills covered | 1 mock test          │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

#### Practice Test Scheduling

| Week | Focus | Practice Test | Target Score |
|------|-------|---------------|--------------|
| 1-2 | Foundation | Diagnostic | Baseline |
| 3-4 | Listening+Reading | Mini-test (L+R) | +0.5 band |
| 5-6 | Writing+Speaking | Mini-test (W+S) | +0.5 band |
| 7-8 | All Skills | Full Mock Test 1 | +1.0 band |
| 9-10 | Weak Area Focus | Sectional Tests | Consolidate |
| 11-12 | Exam Simulation | Full Mock Test 2 | Target Band |

**Recommended Course Sequence:**
1. INSIGHT IELTS 1 → 2 → 3 (Foundation to Advanced)
2. STEP IELTS 1 → 2 → 3 (Techniques & Strategies)
3. Supplementary: Acellus for grammar gaps

### 3.4 Template D: Chinese Learning Path (Littlefox CN)

**Structure:** HSK Level → Series → Episode → Video

```yaml
path_type: chinese_learning
source: littlefoxcn
hierarchy:
  level_1: hsk_level      # 1-6 (aligned to Littlefox L1-L5)
  level_2: series         # DPxxxx codes
  level_3: episode        # 1-N per series
  level_4: video           # individual episode
```

#### Character Recognition Progression

| Level | HSK | Character Target | Grammar Points | Series Examples |
|-------|-----|------------------|----------------|-----------------|
| 1 | 1-2 | 150-300 | 100 | Nihao Chinese, Tones |
| 2 | 2-3 | 300-600 | 200 | Mrs. Kelly's Class |
| 3 | 3-4 | 600-1200 | 400 | Cinderella (CN) |
| 4 | 4-5 | 1200-2500 | 600 | Rocket Girl (CN) |
| 5 | 5-6 | 2500+ | 1000+ | Journey to the West (CN) |

#### Conversation Practice Modules

```
┌─────────────────────────────────────────────────────────────────────┐
│           CHINESE CONVERSATION PRACTICE STRUCTURE                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  LEVEL 1: FOUNDATION                                               │
│  ├─ Module 1: Greetings (你好, 再见)                                  │
│  ├─ Module 2: Numbers & Counting (1-100)                            │
│  ├─ Module 3: Family Members (爸爸, 妈妈, 哥哥)                        │
│  └─ Module 4: Daily Objects (桌子, 椅子, 书)                           │
│                                                                      │
│  LEVEL 2: BASIC COMMUNICATION                                        │
│  ├─ Module 1: Self-introduction (我叫..., 我是...)                    │
│  ├─ Module 2: Hobbies (我喜欢..., 我会...)                            │
│  ├─ Module 3: Time & Schedule (几点, 星期几)                           │
│  └─ Module 4: Shopping (多少钱, 太贵了)                                │
│                                                                      │
│  LEVEL 3: INTERMEDIATE CONVERSATION                                  │
│  ├─ Module 1: Story Retelling (从前...)                               │
│  ├─ Module 2: Describing People (他/她很高)                            │
│  ├─ Module 3: Directions (怎么走, 在哪里)                              │
│  └─ Module 4: Food & Dining (好吃, 吃饱了)                             │
│                                                                      │
│  LEVEL 4: ADVANCED TOPICS                                          │
│  ├─ Module 1: School Life (上课, 作业)                                  │
│  ├─ Module 2: Travel Plans (去旅游, 坐飞机)                             │
│  ├─ Module 3: Future Dreams (我想当...)                                │
│  └─ Module 4: Cultural Stories (西游记, 成语)                           │
│                                                                      │
│  LEVEL 5: FLUENCY & CULTURE                                          │
│  ├─ Module 1: Classical Literature Discussion                         │
│  ├─ Module 2: Modern Chinese Media                                    │
│  ├─ Module 3: Business Chinese Basics                                 │
│  └─ Module 4: HSK 5-6 Exam Preparation                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Cross-Source Integration

### 4.1 Complementary Content Matrix

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                  CROSS-SOURCE COMPLEMENTARY CONTENT                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PRIMARY SOURCE    │  COMPLEMENTARY SOURCE  │  INTEGRATION PURPOSE           │
│  ──────────────────┼────────────────────────┼────────────────────────────────│
│  Abeka Math        │  Numberblocks (PlayTT) │  Visual math concepts          │
│  Abeka Reading     │  Littlefox EN        │  Extensive reading practice    │
│  Abeka Science     │  Littlefox L3-L4     │  Science-themed stories        │
│  Abeka History     │  Littlefox L5-L7     │  Historical fiction/context    │
│  Abeka Phonics     │  Littlefox L1-L2     │  Phonics reinforcement         │
│  Littlefox EN      │  Abeka ELA           │  Grammar structure             │
│  Littlefox CN      │  Abeka Writing       │  Character writing practice    │
│  PlayTT IELTS      │  Littlefox L6-L9     │  Vocabulary expansion          │
│  PlayTT Acellus    │  Abeka (same grade)  │  Alternative explanations      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4.2 Combined Learning Tracks

#### Track 1: English Mastery (Abeka + Littlefox)

```yaml
track_name: english_mastery
sources: [abeka, littlefox]
age_range: 5-12
description: Core grammar from Abeka + extensive reading from Littlefox

structure:
  primary:
    source: abeka
    subjects: [phonics, reading, spelling, language]
    frequency: daily
    minutes: 45
  
  supplementary:
    source: littlefox
    level_mapping:
      "abeka:G1": "littlefox:L2"
      "abeka:G2": "littlefox:L2-L3"
      "abeka:G3": "littlefox:L3"
      "abeka:G4": "littlefox:L3-L4"
      "abeka:G5": "littlefox:L4"
      "abeka:G6": "littlefox:L4-L5"
    frequency: daily
    minutes: 20-30

integration_points:
  - vocabulary_overlap: "Cross-reference Abeka spelling words with Littlefox episodes"
  - comprehension_bridge: "Use Littlefox stories to practice Abeka reading strategies"
  - writing_prompts: "Use Littlefox episodes as writing prompts for Abeka writing lessons"
```

#### Track 2: STEM Foundation (Abeka + PlayTT)

```yaml
track_name: stem_foundation
sources: [abeka, playtt]
age_range: 6-14
description: Core science/math from Abeka + visual learning from Numberblocks/Acellus

structure:
  primary:
    source: abeka
    subjects: [arithmetic, science]
    frequency: daily
    minutes: 60
  
  supplementary:
    source: playtt
    providers: [Numberblocks, Acellus]
    grade_mapping:
      "abeka:G1-G3": "playtt:Numberblocks"
      "abeka:G4-G8": "playtt:Acellus-Math"
      "abeka:G6-G12": "playtt:Acellus-Science"
    frequency: 3x/week
    minutes: 20-30

integration_points:
  - concept_reinforcement: "Numberblocks for visual math (G1-G3)"
  - alternative_explanation: "Acellus for different teaching approaches"
  - hands_on_bridge: "Use science content for lab preparation"
```

#### Track 3: Bilingual Path (Abeka + Littlefox CN)

```yaml
track_name: bilingual_english_chinese
sources: [abeka, littlefoxcn]
age_range: 6-14
description: English core curriculum + Chinese as second language

structure:
  english_track:
    source: abeka
    subjects: [all_core]
    frequency: daily
    minutes: 60-90
    
  chinese_track:
    source: littlefoxcn
    level_progression: [1, 2, 3, 4, 5]
    frequency: daily
    minutes: 30-45
    
  cross_references:
    - "Abeka History G7-G8 → Littlefox CN L5 (Journey to the West)"
    - "Abeka Writing → Chinese character writing practice"
    - "Compare English/Chinese versions of same stories"

integration_points:
  - comparative_literature: "Same stories in both languages"
  - writing_systems: "Compare English phonics to Chinese pinyin"
  - cultural_context: "History lessons across both sources"
```

#### Track 4: IELTS Preparation (PlayTT + Littlefox)

```yaml
track_name: ielts_comprehensive
sources: [playtt, littlefox]
age_range: 14+
description: Test prep strategies + extensive reading for vocabulary

structure:
  test_prep:
    source: playtt
    courses: [INSIGHT_IELTS_1-3, STEP_IELTS_1-3]
    focus: [listening, reading, writing, speaking]
    frequency: daily
    minutes: 90-120
    
  vocabulary_building:
    source: littlefox
    levels: [6, 7, 8, 9]
    focus: "Advanced literature for vocabulary acquisition"
    frequency: daily
    minutes: 30-45
    
  integration_schedule:
    monday_thursday: "PlayTT focus"
    tuesday_friday: "Mixed practice"
    wednesday: "Vocabulary from Littlefox"
    saturday: "Full practice test"
    sunday: "Review + extensive reading"
```

### 4.3 Prerequisite Chains Across Sources

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PREREQUISITE CHAINS ACROSS SOURCES                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PATH: English Literacy                                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Step 1: Littlefox L1 (Phonics basics)                                       │
│      ↓                                                                       │
│  Step 2: Abeka K5 Phonics (Systematic phonics)                               │
│      ↓                                                                       │
│  Step 3: Littlefox L2 (Early reader stories)                                  │
│      ↓                                                                       │
│  Step 4: Abeka G1 Reading (Decodable texts)                                  │
│      ↓                                                                       │
│  Step 5: Littlefox L3 (Literature introduction)                             │
│      ↓                                                                       │
│  Step 6: Abeka G3+ Reading (Comprehension strategies)                        │
│      ↓                                                                       │
│  Step 7: Littlefox L6+ (Classic literature)                                  │
│      ↓                                                                       │
│  Step 8: PlayTT IELTS (Academic English)                                     │
│                                                                              │
│  PATH: Math Progression                                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Step 1: Abeka K4-K5 Numbers (Number sense)                                  │
│      ↓                                                                       │
│  Step 2: PlayTT Numberblocks (Visual representation)                         │
│      ↓                                                                       │
│  Step 3: Abeka G1-G3 Arithmetic (Operations)                                 │
│      ↓                                                                       │
│  Step 4: Abeka G4-G5 (Fractions, decimals)                                   │
│      ↓                                                                       │
│  Step 5: Abeka G6 (Pre-algebra)                                             │
│      ↓                                                                       │
│  Step 6: Abeka G7-G8 (Algebra I & II)                                        │
│      ↓                                                                       │
│  Step 7: Abeka G9-G10 (Geometry)                                            │
│      ↓                                                                       │
│  Step 8: Abeka G11-G12 (Precalculus/Calculus)                               │
│                                                                              │
│  PATH: Chinese Language                                                       │
│  ─────────────────────────────────────────────────────────────────────────  │
│  Step 1: Littlefox CN L1 (Pinyin, tones, basics)                             │
│      ↓                                                                       │
│  Step 2: Littlefox CN L2 (Simple sentences)                                  │
│      ↓                                                                       │
│  Step 3: Littlefox CN L3 (Story comprehension)                               │
│      ↓                                                                       │
│  Step 4: Littlefox CN L4 (Narrative skills)                                  │
│      ↓                                                                       │
│  Step 5: Littlefox CN L5 (Classical literature)                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Content Sequencing Rules

### 5.1 Prerequisite Logic Engine

```typescript
// Pseudocode for prerequisite validation
interface PrerequisiteRule {
  contentId: string;
  requiredCompletion: {
    source?: string;
    grade?: string;
    level?: number;
    lessons?: number;
    series?: string[];
    assessments?: string[];
  };
  alternativePaths?: string[];
  placementTest?: string;
}

// Example rules
const prerequisiteRules: PrerequisiteRule[] = [
  {
    contentId: "abeka:g3:lesson-1",
    requiredCompletion: {
      source: "abeka",
      grade: "g2",
      lessons: 170
    },
    alternativePaths: ["placement:g3:math", "placement:g3:ela"]
  },
  {
    contentId: "littlefox:L3:series",
    requiredCompletion: {
      source: "littlefox",
      level: 2,
      series: ["FS0058", "FS0104"] // Complete 2 L2 series
    }
  },
  {
    contentId: "playtt:INSIGHT_IELTS_2",
    requiredCompletion: {
      assessments: ["ielts_diagnostic:band_5.0+"]
    },
    alternativePaths: ["playtt:INSIGHT_IELTS_1"]
  }
];
```

### 5.2 Difficulty Progression Algorithm

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                DIFFICULTY PROGRESSION ALGORITHM                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  INPUTS:                                                                     │
│  - current_level: User's current level in source                             │
│  - completion_rate: % of content completed at level                          │
│  - assessment_scores: Recent quiz/test scores                                │
│  - engagement_metrics: Watch time, replays, pauses                          │
│  - parent_override: Optional manual adjustment                               │
│                                                                              │
│  ALGORITHM:                                                                  │
│                                                                              │
│  1. COMPLETION CHECK                                                         │
│     IF completion_rate >= 80% AND assessment_scores >= 70%:                  │
│        → Candidate for level advancement                                     │
│     ELSE IF completion_rate < 50%:                                             │
│        → Recommend review/repetition                                         │
│     ELSE:                                                                    │
│        → Continue current level                                              │
│                                                                              │
│  2. ENGAGEMENT ANALYSIS                                                      │
│     IF avg_watch_time < 50%:                                                 │
│        → Content may be too difficult OR unengaging                          │
│        → Flag for content review                                             │
│     IF replay_count > 3 per video:                                           │
│        → Concept may need reinforcement                                      │
│        → Suggest supplementary content                                       │
│                                                                              │
│  3. ADVANCEMENT DECISION                                                     │
│     Score = (completion_rate * 0.4) + (avg_assessment * 0.4) +              │
│             (engagement_score * 0.2)                                          │
│                                                                              │
│     IF Score >= 80:                                                          │
│        → RECOMMEND_ADVANCE                                                   │
│     ELSE IF Score >= 60:                                                     │
│        → RECOMMEND_CONTINUE_WITH_SUPPLEMENT                                  │
│     ELSE:                                                                    │
│        → RECOMMEND_REVIEW                                                    │
│                                                                              │
│  4. PARENT NOTIFICATION                                                      │
│     IF RECOMMEND_ADVANCE:                                                    │
│        → Notify: "Child ready for next level"                                │
│        → Show sample content from next level                                 │
│     IF RECOMMEND_REVIEW:                                                     │
│        → Notify: "Additional practice suggested"                             │
│        → Provide specific topic recommendations                              │
│                                                                              │
│  OUTPUT: Recommendation enum + supporting data                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.3 Spaced Repetition Scheduling

#### Repetition Intervals by Content Type

| Content Type | Initial Review | 2nd Review | 3rd Review | Final Review |
|--------------|----------------|------------|------------|--------------|
| Core Concept | 1 day | 3 days | 7 days | 14 days |
| Vocabulary | 1 day | 2 days | 4 days | 7 days |
| Grammar Rule | 2 days | 5 days | 10 days | 21 days |
| Story/Literature | 3 days | 7 days | 14 days | 30 days |
| Math Skill | 1 day | 3 days | 7 days | 14 days |
| Test Strategy | 1 day | 2 days | 5 days | 10 days |

#### Spaced Repetition Implementation

```yaml
spaced_repetition_engine:
  
  k12_curriculum:
    abeka_lessons:
      review_trigger: "lesson_completion + 2 days"
      review_format: "3-question quiz"
      mastery_threshold: "3 consecutive correct answers"
      
    cross_subject_reinforcement:
      trigger: "math_concept_learned"
      action: "schedule_related_science_review"
      example: "After fractions (G4) → schedule measurement review"
  
  story_learning:
    littlefox_episodes:
      review_trigger: "episode_completion + 3 days"
      review_format: "vocabulary flashcards"
      
    series_completion:
      trigger: "series_finished"
      action: "schedule_retelling_exercise"
      interval: "7 days"
  
  test_preparation:
    ielts_strategies:
      review_trigger: "strategy_video_watched"
      action: "schedule_practice_question"
      
    mock_tests:
      interval: "every_7_days_after_first_complete"
      review_format: "full_simulation"
```

---

## 6. Sample Learning Journeys

### Journey 1: Kindergarten Readiness (Age 4-5)

**Duration:** 36 weeks  
**Daily Time:** 30-45 minutes  
**Sources:** Abeka K4-K5 + Littlefox L1

```
┌─────────────────────────────────────────────────────────────────────────────┐
│           JOURNEY 1: KINDERGARTEN READINESS (Ages 4-5)                      │
│                      Duration: 36 Weeks                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  PHASE 1: FOUNDATION (Weeks 1-12)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Abeka K4 + Littlefox L1                                     │    │
│  │                                                                     │    │
│  │ Week 1-4 (K4 Lessons 1-20):                                        │    │
│  │   Daily: Activities (15m) + Phonics intro (10m) + L1 Story (10m)   │    │
│  │   Littlefox: ABC Book series (episodes 1-20)                       │    │
│  │   Milestone: Recognize 10 letters                                    │    │
│  │                                                                     │    │
│  │ Week 5-8 (K4 Lessons 21-40):                                        │    │
│  │   Daily: Activities (15m) + Phonics (15m) + Numbers (10m)          │    │
│  │   Littlefox: Word Families series (episodes 1-20)                  │    │
│  │   Milestone: Count 1-20, 3-letter words                              │    │
│  │                                                                     │    │
│  │ Week 9-12 (K4 Lessons 41-60):                                       │    │
│  │   Daily: Activities (10m) + Phonics (15m) + Writing (10m)         │    │
│  │   Littlefox: Bat and Friends (episodes 1-24)                        │    │
│  │   Milestone: Write name, 50 sight words                            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  PHASE 2: TRANSITION (Weeks 13-24)                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Abeka K4→K5 + Littlefox L1→L2                               │    │
│  │                                                                     │    │
│  │ Week 13-16 (K4 Lessons 61-80 + K5 Lessons 1-10):                     │    │
│  │   Daily: Phonics (20m) + Numbers (15m) + L1 Story (10m)           │    │
│  │   Littlefox: Complete Bat and Friends + start Bird and Kip          │    │
│  │   Milestone: Read simple sentences                                   │    │
│  │                                                                     │    │
│  │ Week 17-20 (K5 Lessons 11-40):                                       │    │
│  │   Daily: Phonics (20m) + Reading (15m) + Arithmetic (15m)           │    │
│  │   Littlefox: Bird and Kip series (episodes 1-36)                    │    │
│  │   Milestone: 100 sight words, addition 1-10                        │    │
│  │                                                                     │    │
│  │ Week 21-24 (K5 Lessons 41-70):                                       │    │
│  │   Daily: Phonics (15m) + Reading (20m) + Writing (15m)              │    │
│  │   Littlefox: Space Patrol series (episodes 1-24)                    │    │
│  │   Milestone: Write simple sentences, subtraction intro              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  PHASE 3: READINESS (Weeks 25-36)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Abeka K5 + Littlefox L2                                     │    │
│  │                                                                     │    │
│  │ Week 25-28 (K5 Lessons 71-100):                                      │    │
│  │   Daily: Phonics (15m) + Reading (20m) + Arithmetic (20m)           │    │
│  │   Littlefox: Phonics I series (episodes 1-50)                       │    │
│  │   Milestone: 150 sight words, addition/subtraction 1-20             │    │
│  │                                                                     │    │
│  │ Week 29-32 (K5 Lessons 101-130):                                    │    │
│  │   Daily: Reading (25m) + Arithmetic (20m) + Bible (10m)           │    │
│  │   Littlefox: Phonics II series (episodes 1-50)                      │    │
│  │   Milestone: Read grade-level text aloud                            │    │
│  │                                                                     │    │
│  │ Week 33-36 (K5 Lessons 131-170):                                    │    │
│  │   Daily: Reading (25m) + Arithmetic (20m) + Spelling (15m)        │    │
│  │   Littlefox: Complete L2 series, review favorites                   │    │
│  │   Milestone: K5 COMPLETE - Ready for Grade 1!                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTALS:                                                                     │
│  - Abeka: 230 lessons completed                                              │
│  - Littlefox: ~200 episodes                                                  │
│  - Time: 540-810 hours (30-45 min × 36 weeks)                               │
│  - Skills: Reading readiness, basic arithmetic, 200+ vocabulary            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Journey 2: English Literature Enthusiast (Age 8-12)

**Duration:** 52 weeks  
**Daily Time:** 45-60 minutes  
**Sources:** Littlefox L3-L6 + Abeka ELA (G3-G6)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│        JOURNEY 2: ENGLISH LITERATURE ENTHUSIAST (Ages 8-12)                 │
│                       Duration: 52 Weeks                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  SEMESTER 1: FAIRY TALES & FABLES (Weeks 1-26)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Littlefox L3-L4 + Abeka G3 ELA                              │    │
│  │                                                                     │    │
│  │ MONTH 1: Classic Fairy Tales                                       │    │
│  │   Week 1-2: Cinderella (24 episodes) + Abeka Reading G3: Lessons 1-10│   │
│  │   Week 3-4: Snow White (24 episodes) + Abeka Reading G3: Lessons 11-20│  │
│  │   Week 5-6: Hansel and Gretel (24 eps) + Abeka Language: Grammar      │    │
│  │   Daily: 30m Littlefox story + 20m Abeka ELA + 10m comprehension    │    │
│  │   Milestone: Can summarize fairy tale plot and moral                  │    │
│  │                                                                     │    │
│  │ MONTH 2: Adventure Stories                                           │    │
│  │   Week 7-8: Jack and the Beanstalk (24 eps)                         │    │
│  │   Week 9-10: Peter Pan (24 episodes)                                 │    │
│  │   Week 11-12: The Wizard of Oz (36 episodes)                        │    │
│  │   Parallel: Abeka G3 Reading comprehension strategies                 │    │
│  │   Milestone: Identify protagonist, antagonist, setting               │    │
│  │                                                                     │    │
│  │ MONTH 3: Science & Nature Stories                                    │    │
│  │   Week 13-14: The Little Mermaid (24 eps) + Abeka Science G3         │    │
│  │   Week 15-16: The Jungle Book (24 eps) + Nature study activities      │    │
│  │   Week 17-18: Aesop's Fables (32 eps) + Moral discussions           │    │
│  │   Milestone: Connect literature to science concepts                  │    │
│  │                                                                     │    │
│  │ MONTH 4: World Literature Introduction                               │    │
│  │   Week 19-20: Journey to the West L4 (48 eps) - Chinese classic     │    │
│  │   Week 21-22: Heidi (26 episodes) - Swiss classic                    │    │
│  │   Week 23-24: Alice in Wonderland L4 (24 eps)                    │    │
│  │   Week 25-26: REVIEW & COMPREHENSIVE ASSESSMENT                     │    │
│  │   Milestone: SEMESTER 1 COMPLETE - 12 series, 12,000+ words          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  SEMESTER 2: CLASSICS & LITERATURE (Weeks 27-52)                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Littlefox L5-L6 + Abeka G4-G6 ELA                            │    │
│  │                                                                     │    │
│  │ MONTH 5: Advanced Fairy Tales & Literature                           │    │
│  │   Week 27-28: The Beauty and the Beast (30 eps) + Character study   │    │
│  │   Week 29-30: Sleeping Beauty (24 eps) + Symbolism introduction      │    │
│  │   Week 31-32: The Snow Queen (24 eps) + Scandinavian culture        │    │
│  │   Parallel: Abeka G4-G5 Reading - Literary analysis                   │    │
│  │   Milestone: Identify literary devices (metaphor, personification)    │    │
│  │                                                                     │    │
│  │ MONTH 6: Shakespeare Introduction (L6)                             │    │
│  │   Week 33-34: Romeo and Juliet (24 eps) - Adapted                   │    │
│  │   Week 35-36: A Midsummer Night's Dream (24 eps)                    │    │
│  │   Week 37-38: Hamlet (24 eps) - Simplified                          │    │
│  │   Activity: Compare with original text excerpts                       │    │
│  │   Milestone: Understand Shakespearean themes and language            │    │
│  │                                                                     │    │
│  │ MONTH 7: Classic Novels (L6)                                         │    │
│  │   Week 39-40: Jane Eyre (30 episodes)                                │    │
│  │   Week 41-42: Oliver Twist (60 eps) - Long-form study               │    │
│  │   Week 43-44: Sherlock Holmes (24 eps) - Detective genre            │    │
│  │   Activity: Creative writing - Write alternative ending               │    │
│  │   Milestone: Analyze character development over long narrative       │    │
│  │                                                                     │    │
│  │ MONTH 8: World Classics & Completion                                 │    │
│  │   Week 45-46: Treasure Island (30 eps) + Abeka G6 History            │    │
│  │   Week 47-48: Anne of Green Gables (41 eps) + Canadian culture      │    │
│  │   Week 49-50: Little Women (50 eps) + Family dynamics study          │    │
│  │   Week 51-52: FINAL PROJECT & REVIEW                                 │    │
│  │   Project: Create video book review of favorite series               │    │
│  │   Milestone: JOURNEY COMPLETE - Literature enthusiast!                │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTALS:                                                                     │
│  - Littlefox: 24+ series, ~1,500 episodes                                    │
│  - Abeka ELA: 4 years of reading curriculum                                  │
│  - Vocabulary: 5,000+ words acquired                                         │
│  - Time: 234-312 hours (45-60 min × 52 weeks)                               │
│  - Output: Book reviews, creative writing, literary analysis skills            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Journey 3: STEM Foundation Builder (Age 9-13)

**Duration:** 48 weeks  
**Daily Time:** 60-75 minutes  
**Sources:** Abeka G4-G7 + PlayTT (Numberblocks + Acellus)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│          JOURNEY 3: STEM FOUNDATION BUILDER (Ages 9-13)                    │
│                      Duration: 48 Weeks                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  YEAR 1: MATH MASTERY & SCIENCE INTRO (Weeks 1-24)                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Abeka G4-G5 + PlayTT Numberblocks                           │    │
│  │                                                                     │    │
│  │ UNIT 1: Multiplication & Division Mastery (Weeks 1-6)              │    │
│  │   Abeka G4 Arithmetic: Lessons 1-30                                 │    │
│  │   PlayTT Numberblocks: Series 3-4 (visual arrays/grouping)          │    │
│  │   Daily: 40m Abeka + 15m Numberblocks + 15m practice                │    │
│  │   Milestone: Master tables 1-12, long division                        │    │
│  │                                                                     │    │
│  │ UNIT 2: Fractions Fundamentals (Weeks 7-12)                         │    │
│  │   Abeka G4: Lessons 31-70 (fractions intro)                         │    │
│  │   Numberblocks: Fractions series (visual representation)            │    │
│  │   Activity: Cooking with fractions (real-world application)         │    │
│  │   Milestone: Add/subtract fractions, find equivalent fractions       │    │
│  │                                                                     │    │
│  │ UNIT 3: Decimals & Measurement (Weeks 13-18)                        │    │
│  │   Abeka G4-G5: Lessons 71-110                                        │    │
│  │   Science connection: Measurement in experiments                    │    │
│  │   Activity: Home science lab - measure and record                     │    │
│  │   Milestone: Decimal operations, unit conversion                      │    │
│  │                                                                     │    │
│  │ UNIT 4: Geometry Basics & Science Intro (Weeks 19-24)               │    │
│  │   Abeka G5: Geometry lessons (shapes, area, perimeter)              │    │
│  │   Abeka Science G5: Introduction to scientific method                 │    │
│  │   PlayTT Acellus: Science G5 (complementary explanations)           │    │
│  │   Milestone: YEAR 1 COMPLETE - Ready for pre-algebra!                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  YEAR 2: ADVANCED MATH & SCIENCE (Weeks 25-48)                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Source: Abeka G6-G7 + PlayTT Acellus                                │    │
│  │                                                                     │    │
│  │ UNIT 5: Pre-Algebra (Weeks 25-30)                                    │    │
│  │   Abeka G6: Arithmetic transition to algebra                        │    │
│  │   Variables, expressions, simple equations                            │    │
│  │   PlayTT Acellus: Pre-Algebra course (alternative explanations)     │    │
│  │   Daily: 45m Abeka + 20m Acellus + 15m problem solving              │    │
│  │   Milestone: Solve 2-step equations, understand variables            │    │
│  │                                                                     │    │
│  │ UNIT 6: Algebra I (Weeks 31-36)                                     │    │
│  │   Abeka G7: Algebra I course                                        │    │
│  │   Linear equations, inequalities, graphing                            │    │
│  │   Acellus: Algebra I (video tutorials for tough concepts)             │    │
│  │   Activity: Create algebra word problems from daily life             │    │
│  │   Milestone: Graph linear equations, solve systems                   │    │
│  │                                                                     │    │
│  │ UNIT 7: Biology Science (Weeks 37-42)                                │    │
│  │   Abeka G7: Biology course                                          │    │
│  │   Cells, genetics, human body systems                                │    │
│  │   Acellus: Biology (lab simulations)                                │    │
│  │   Littlefox L4: Science-themed stories (connections)                  │    │
│  │   Project: Create cell model, present to family                       │    │
│  │   Milestone: Understand cell structure, basic genetics               │    │
│  │                                                                     │    │
│  │ UNIT 8: Earth Science & Review (Weeks 43-48)                        │    │
│  │   Abeka Science: Earth science, astronomy                            │    │
│  │   Cross-curricular: Littlefox stories about space                     │    │
│  │   Final project: STEM portfolio presentation                          │    │
│  │   Assessment: Comprehensive math and science review                 │    │
│  │   Milestone: JOURNEY COMPLETE - STEM Foundation solid!               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTALS:                                                                     │
│  - Abeka: G4-G7 math & science (4 years curriculum)                         │
│  - PlayTT: Numberblocks + Acellus (supplementary)                           │
│  - Math skills: Through Algebra I                                            │
│  - Science: Biology + Earth Science foundations                              │
│  - Time: 288-360 hours (60-75 min × 48 weeks)                                │
│  - Projects: 8 hands-on projects, 1 portfolio                                │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Journey 4: IELTS Band 7.0 Achiever (Age 16-18)

**Duration:** 16 weeks (Intensive)  
**Daily Time:** 2-3 hours  
**Sources:** PlayTT IELTS + Littlefox L7-L8

```
┌─────────────────────────────────────────────────────────────────────────────┐
│         JOURNEY 4: IELTS BAND 7.0 ACHIEVER (Ages 16-18)                   │
│                   Duration: 16 Weeks (Intensive)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STARTING POINT: Diagnostic Test Required                                    │
│  Target: Band 7.0+ in all 4 skills                                          │
│                                                                              │
│  PHASE 1: FOUNDATION & SKILL BUILDING (Weeks 1-4)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │ Week 1: Diagnostic & Listening Foundation                           │    │
│  │   Monday: Full diagnostic test (establish baseline)                  │    │
│  │   Tue-Fri: INSIGHT IELTS 1 - Listening Section 1-2                  │    │
│  │   Weekend: Littlefox L7 (vocabulary expansion - 5 episodes)       │    │
│  │   Daily: 90m PlayTT + 30m Littlefox                                 │    │
│  │   Milestone: Baseline established, Section 1 strategies mastered    │    │
│  │                                                                     │    │
│  │ Week 2: Reading Strategies                                            │    │
│  │   Mon-Fri: STEP IELTS 1 - Reading fundamentals                      │    │
│  │   Focus: Skimming, scanning, T/F/NG questions                       │    │
│  │   Weekend: 2 full reading passages + review                         │    │
│  │   Littlefox: Continue L7 series (academic vocabulary)                 │    │
│  │   Milestone: Complete passage in 20 minutes                         │    │
│  │                                                                     │    │
│  │ Week 3: Writing Task 1                                                │    │
│  │   Mon-Wed: INSIGHT IELTS 1 - Task 1 graphs/charts                   │    │
│  │   Thu-Fri: Practice: 3 Task 1 essays (timed 20 min each)            │    │
│  │   Weekend: Review feedback, vocabulary for describing trends          │    │
│  │   Littlefox: L7 - Non-fiction/science themes                          │    │
│  │   Milestone: Write 150 words in 20 minutes                          │    │
│  │                                                                     │    │
│  │ Week 4: Speaking Part 1-2                                             │    │
│  │   Mon-Wed: STEP IELTS 1 - Speaking introduction & Part 1              │    │
│  │   Thu-Fri: Part 2 cue cards + note-taking strategies                │    │
│  │   Weekend: Record 5 Part 2 responses, self-assess                     │    │
│  │   Littlefox: L7 - Character dialogue analysis                         │    │
│  │   Milestone: Speak for 2 minutes without long pauses                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  PHASE 2: SKILL DEVELOPMENT (Weeks 5-8)                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │ Week 5: Advanced Listening                                            │    │
│  │   INSIGHT IELTS 2 - Sections 3-4 (academic)                         │    │
│  │   Multiple choice, matching, diagram labeling                       │    │
│  │   Practice: 2 full listening tests                                    │    │
│  │   Littlefox: L8 - Advanced literature vocabulary                    │    │
│  │   Milestone: 30/40 correct on listening test                        │    │
│  │                                                                     │    │
│  │ Week 6: Advanced Reading                                              │    │
│  │   STEP IELTS 2 - Academic passages strategies                         │    │
│  │   Focus: Matching headings, summary completion, flow charts          │    │
│  │   Practice: 3 full reading tests                                      │    │
│  │   Littlefox: L8 - Complex sentence structures                         │    │
│  │   Milestone: 30/40 correct on reading test                          │    │
│  │                                                                     │    │
│  │ Week 7: Writing Task 2                                                │    │
│  │   INSIGHT IELTS 2 - Task 2 essay structures                           │    │
│  │   Opinion, discussion, problem-solution essays                        │    │
│  │   Practice: 4 Task 2 essays (timed 40 min each)                     │    │
│  │   Weekend: Grammar review using Littlefox context                     │    │
│  │   Milestone: Write 250 words in 40 minutes                          │    │
│  │                                                                     │    │
│  │ Week 8: Speaking Part 3                                               │    │
│  │   STEP IELTS 2 - Part 3 discussion strategies                         │    │
│  │   Abstract thinking, giving opinions, supporting arguments          │    │
│  │   Practice: 5 complete Speaking tests (recorded)                    │    │
│  │   Littlefox: L8 - Debate-style expressions                            │    │
│  │   Milestone: FLUENT discussion for 4-5 minutes                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  PHASE 3: ADVANCED TECHNIQUES (Weeks 9-12)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │ Week 9-10: INSIGHT IELTS 3 & STEP IELTS 3                           │    │
│  │   Advanced strategies for all 4 skills                              │    │
│  │   Common pitfalls and how to avoid them                             │    │
│  │   Time management techniques                                        │    │
│  │   Littlefox: L9 - Literary analysis vocabulary (formal/academic)    │    │
│  │   Milestone: Consistent 6.5-7.0 on practice sections                │    │
│  │                                                                     │    │
│  │ Week 11: Intensive Writing Week                                     │    │
│  │   Mon-Fri: 2 Task 1 + 2 Task 2 essays daily (all timed)             │    │
│  │   Peer review or tutor feedback                                       │    │
│  │   Vocabulary journal: Academic word list focus                       │    │
│  │   Milestone: Band 7.0 writing consistency                            │    │
│  │                                                                     │    │
│  │ Week 12: Mock Test Week                                               │    │
│  │   3 full mock tests (listening, reading, writing)                  │    │
│  │   5 speaking mock tests                                               │    │
│  │   Detailed analysis of all results                                    │    │
│  │   Weak area identification                                            │    │
│  │   Milestone: Confident in all 4 skills                               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  PHASE 4: EXAM PREPARATION & POLISH (Weeks 13-16)                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                                                                     │    │
│  │ Week 13-14: Weak Area Focus                                         │    │
│  │   Personalized study plan based on Week 12 analysis                 │    │
│  │   Targeted practice on lowest-scoring sections                      │    │
│  │   Vocabulary: 100 new academic words/week                           │    │
│  │   Littlefox L8-9: 2-3 episodes daily for extensive exposure         │    │
│  │                                                                     │    │
│  │ Week 15: Exam Simulation                                              │    │
│  │   5 full mock tests under exam conditions                           │    │
│  │   Exact timing, no distractions, exam environment                   │    │
│  │   Score tracking and trend analysis                                 │    │
│  │   Mental preparation and stress management                          │    │
│  │                                                                     │    │
│  │ Week 16: Final Review & Exam Week                                     │    │
│  │   Mon-Wed: Light review, key strategies, confidence building        │    │
│  │   Thu: Rest day - light listening/reading only                      │    │
│  │   Fri/Sat/Sun: EXAM DAYS (or scheduled test date)                  │    │
│  │   Milestone: BAND 7.0+ ACHIEVED!                                    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTALS:                                                                     │
│  - PlayTT IELTS: All 6 courses completed (215 videos)                        │
│  - Practice tests: 20+ full mock tests                                       │
│  - Littlefox: L7-L9 (120+ episodes for vocabulary)                           │
│  - Time: 480-720 hours (2-3 hours × 16 weeks)                              │
│  - Vocabulary: 2,000+ academic words learned                                │
│  - Output: Band 7.0+ IELTS score                                              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Journey 5: Bilingual Scholar (Age 10-14)

**Duration:** 40 weeks  
**Daily Time:** 90 minutes (60 English + 30 Chinese)  
**Sources:** Abeka G5-G7 + Littlefox CN L2-L4

```
┌─────────────────────────────────────────────────────────────────────────────┐
│            JOURNEY 5: BILINGUAL SCHOLAR (Ages 10-14)                        │
│                       Duration: 40 Weeks                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STRUCTURE: Parallel English-Chinese Learning                               │
│  Ratio: 2:1 (English : Chinese) time allocation                             │
│                                                                              │
│  SEMESTER 1: FOUNDATION (Weeks 1-20)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ENGLISH TRACK: Abeka G5 Core                                        │    │
│  │ Chinese Track: Littlefox CN L2                                        │    │
│  │                                                                     │    │
│  │ WEEKS 1-5: Grammar & Basic Sentences                                │    │
│  │   English: Abeka G5 Language (parts of speech, sentence structure)  │    │
│  │   Chinese: Littlefox CN L2 - Mrs. Kelly's Class (basic conversations) │    │
│  │   Daily: 60m English + 30m Chinese                                  │    │
│  │   Milestone: 300 Chinese characters, English grammar mastery       │    │
│  │                                                                     │    │
│  │ WEEKS 6-10: Narrative Skills                                        │    │
│  │   English: Abeka G5 Reading (narrative texts, comprehension)        │    │
│  │   Chinese: Littlefox CN L2 - Simple stories                         │    │
│  │   Cross-activity: Compare story structures English/Chinese            │    │
│  │   Milestone: Read simple Chinese stories independently               │    │
│  │                                                                     │    │
│  │ WEEKS 11-15: Academic Content                                         │    │
│  │   English: Abeka G5 Science + History                                 │    │
│  │   Chinese: Littlefox CN L3 - Story series start                       │    │
│  │   Cross-activity: Learn science terms in both languages               │    │
│  │   Milestone: 600 Chinese characters, academic vocabulary             │    │
│  │                                                                     │    │
│  │ WEEKS 16-20: Writing Development                                      │    │
│  │   English: Abeka G5 Writing (paragraphs, essays)                    │    │
│  │   Chinese: Littlefox CN L3 - Character writing practice             │    │
│  │   Project: Bilingual "About Me" presentation                          │    │
│  │   Milestone: Write 100 characters, 3-paragraph English essay          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  SEMESTER 2: ADVANCED (Weeks 21-40)                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ ENGLISH TRACK: Abeka G6-G7 Core                                     │    │
│  │ Chinese Track: Littlefox CN L3-L4                                     │    │
│  │                                                                     │    │
│  │ WEEKS 21-25: Literature & Culture                                     │    │
│  │   English: Abeka G6 Literature (classic excerpts)                     │    │
│  │   Chinese: Littlefox CN L3 - Cinderella (Chinese version)             │    │
│  │   Cross-activity: Compare Cinderella across cultures                  │    │
│  │   Milestone: 900 Chinese characters, cultural awareness              │    │
│  │                                                                     │    │
│  │ WEEKS 26-30: Advanced Grammar & Expression                            │    │
│  │   English: Abeka G6-G7 Language (complex sentences)                  │    │
│  │   Chinese: Littlefox CN L4 - Rocket Girl (narrative skills)          │    │
│  │   Cross-activity: Translate favorite quotes                           │    │
│  │   Milestone: Complex sentence structures in both languages           │    │
│  │                                                                     │    │
│  │ WEEKS 31-35: STEM in Both Languages                                   │    │
│  │   English: Abeka Science G6 (biology concepts)                      │    │
│  │   Chinese: Littlefox CN L4 - Science-themed episodes                  │    │
│  │   Project: Bilingual science poster                                   │    │
│  │   Milestone: 1,200 Chinese characters, STEM vocabulary                │    │
│  │                                                                     │    │
│  │ WEEKS 36-40: Mastery & Integration                                    │    │
│  │   English: Abeka G7 advanced topics                                   │    │
│  │   Chinese: Littlefox CN L4 complete + review                          │    │
│  │   Final Project: Bilingual presentation on chosen topic               │    │
│  │   Milestone: JOURNEY COMPLETE - Functional bilingual!               │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  TOTALS:                                                                     │
│  - English: G5-G7 curriculum (3 years)                                        │
│  - Chinese: L2-L4 complete (800+ episodes, 1,500+ characters)                │
│  - Time: 360 hours (90 min × 40 weeks)                                       │
│  - Output: Bilingual competency, 3 major projects, HSK 3-4 equivalent        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Implementation Data Model

### 7.1 Database Schema for Learning Paths

```sql
-- Learning Path Structure Tables

-- Master learning path definitions
CREATE TABLE learning_path (
    path_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_code VARCHAR(50) UNIQUE NOT NULL,  -- 'k12_curriculum', 'story_learning', etc.
    path_name VARCHAR(100) NOT NULL,
    path_type VARCHAR(50) NOT NULL,  -- 'k12', 'story', 'test_prep', 'language'
    description TEXT,
    target_age_min INT,
    target_age_max INT,
    estimated_duration_weeks INT,
    daily_minutes_recommended INT,
    prerequisites JSONB,  -- array of path_ids or conditions
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Content source mapping
CREATE TABLE path_source_mapping (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    path_id UUID REFERENCES learning_path(path_id),
    source_key VARCHAR(50) REFERENCES content_source(source_key),
    is_primary BOOLEAN DEFAULT false,
    weight_percent INT,  -- percentage of path from this source
    hierarchy_level VARCHAR(50),  -- 'primary', 'supplementary', 'enrichment'
    metadata JSONB,  -- source-specific mapping rules
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Difficulty level mapping across sources
CREATE TABLE difficulty_mapping (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universal_level VARCHAR(20) NOT NULL,  -- 'BEG', 'ELEM1', etc.
    source_key VARCHAR(50),
    source_level VARCHAR(50),  -- grade, level, etc. from source
    cefr_level VARCHAR(10),  -- A1, A2, B1, etc.
    hsk_level INT,  -- 1-6 for Chinese
    age_range_min INT,
    age_range_max INT,
    description TEXT,
    UNIQUE(universal_level, source_key)
);

-- Prerequisite rules
CREATE TABLE prerequisite_rule (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,  -- 'lesson', 'series', 'course'
    content_id VARCHAR(100) NOT NULL,  -- specific content identifier
    required_source VARCHAR(50),
    required_level VARCHAR(50),
    required_completion_count INT,  -- lessons, episodes, etc.
    required_assessment_score INT,  -- minimum score if applicable
    alternative_content_ids JSONB,  -- other paths to satisfy prereq
    is_strict BOOLEAN DEFAULT true,  -- can be bypassed with placement test?
    placement_test_id VARCHAR(100),  -- alternative assessment
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Spaced repetition schedules
CREATE TABLE spaced_repetition_schedule (
    schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type VARCHAR(50) NOT NULL,  -- 'core_concept', 'vocabulary', etc.
    review_1_days INT NOT NULL,
    review_2_days INT,
    review_3_days INT,
    review_final_days INT,
    review_format VARCHAR(100),  -- 'quiz', 'flashcard', 'practice', etc.
    mastery_threshold INT,  -- percentage or count for mastery
    is_active BOOLEAN DEFAULT true
);

-- User learning path enrollment
CREATE TABLE user_learning_path (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id UUID REFERENCES child_profile(id),
    path_id UUID REFERENCES learning_path(path_id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    target_completion_date TIMESTAMP,
    current_progress_percent INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'enrolled',  -- enrolled, active, paused, completed
    current_level VARCHAR(50),  -- current position in path
    current_lesson VARCHAR(100),
    metadata JSONB,  -- custom settings, preferences
    completed_at TIMESTAMP
);

-- Cross-source content recommendations
CREATE TABLE cross_source_recommendation (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_content_id VARCHAR(100) NOT NULL,  -- content that triggers recommendation
    source_source_key VARCHAR(50),
    recommended_content_id VARCHAR(100) NOT NULL,
    recommended_source_key VARCHAR(50),
    recommendation_type VARCHAR(50),  -- 'complementary', 'prerequisite', 'extension'
    relevance_score DECIMAL(3,2),  -- 0.00-1.00
    reason_text TEXT,  -- human-readable explanation
    age_range_min INT,
    age_range_max INT,
    is_active BOOLEAN DEFAULT true
);
```

### 7.2 API Endpoints for Learning Paths

```yaml
# Learning Path API Specification

endpoints:
  # Path Discovery
  - path: GET /api/learning-paths
    description: List available learning paths with filtering
    parameters:
      - age: int (optional)
      - source: string[] (optional)
      - type: string (optional)
      - difficulty: string (optional)
    response: LearningPath[]

  - path: GET /api/learning-paths/{path_id}
    description: Get detailed path structure and metadata
    response: LearningPathDetail

  - path: GET /api/learning-paths/{path_id}/roadmap
    description: Get full roadmap with milestones and assessments
    response: PathRoadmap

  # User Path Management
  - path: POST /api/children/{child_id}/learning-paths
    description: Enroll child in a learning path
    body:
      path_id: UUID
      start_date: date (optional)
      custom_settings: object (optional)
    response: Enrollment

  - path: GET /api/children/{child_id}/learning-paths/active
    description: Get child's active learning paths with progress
    response: ActivePath[]

  - path: GET /api/children/{child_id}/learning-paths/{enrollment_id}/progress
    description: Get detailed progress for a path
    response: PathProgress

  # Content Sequencing
  - path: GET /api/learning-paths/next-content
    description: Get recommended next content for child
    parameters:
      - child_id: UUID
      - path_id: UUID (optional)
      - source: string (optional)
    response: NextContentRecommendation

  - path: POST /api/learning-paths/complete-content
    description: Mark content as completed and get next recommendation
    body:
      child_id: UUID
      content_id: string
      source_key: string
      completion_data: object
    response: NextContentRecommendation

  # Prerequisite Checking
  - path: GET /api/content/{content_id}/prerequisites
    description: Check prerequisites for specific content
    parameters:
      - child_id: UUID
    response: PrerequisiteStatus

  - path: POST /api/content/validate-prerequisites
    description: Batch validate prerequisites for multiple items
    body:
      child_id: UUID
      content_ids: string[]
    response: PrerequisiteValidation[]

  # Cross-Source Recommendations
  - path: GET /api/recommendations/cross-source
    description: Get cross-source content recommendations
    parameters:
      - child_id: UUID
      - current_content_id: string
      - current_source: string
      - limit: int (default 5)
    response: CrossSourceRecommendation[]

  # Spaced Repetition
  - path: GET /api/spaced-repetition/reviews
    description: Get scheduled reviews for child
    parameters:
      - child_id: UUID
      - date: date (default today)
    response: ScheduledReview[]

  - path: POST /api/spaced-repetition/complete-review
    description: Complete a review and update schedule
    body:
      review_id: UUID
      performance_score: int
    response: UpdatedSchedule
```

### 7.3 Configuration File

```yaml
# learning-paths-config.yaml

# Universal difficulty levels
difficulty_levels:
  BEG:
    name: "Beginner"
    age_range: [3, 5]
    grade_equiv: "K4-K5"
    cefr: "Pre-A1"
    
  ELEM1:
    name: "Elementary 1"
    age_range: [5, 7]
    grade_equiv: "G1-G2"
    cefr: "A1"
    hsk: 1
    
  ELEM2:
    name: "Elementary 2"
    age_range: [7, 9]
    grade_equiv: "G3-G4"
    cefr: "A2"
    hsk: 2
    
  INT1:
    name: "Intermediate 1"
    age_range: [9, 11]
    grade_equiv: "G5-G6"
    cefr: "B1"
    hsk: 3
    
  INT2:
    name: "Intermediate 2"
    age_range: [11, 13]
    grade_equiv: "G7-G8"
    cefr: "B1+"
    hsk: 4
    
  ADV1:
    name: "Advanced 1"
    age_range: [13, 15]
    grade_equiv: "G9-G10"
    cefr: "B2"
    hsk: 5
    
  ADV2:
    name: "Advanced 2"
    age_range: [15, 17]
    grade_equiv: "G11-G12"
    cefr: "B2+"
    hsk: 6
    
  PROF:
    name: "Proficient"
    age_range: [17, 99]
    grade_equiv: "College+"
    cefr: "C1+"

# Source mappings
source_mappings:
  abeka:
    universal_difficulty_map:
      "K4": "BEG"
      "K5": "BEG"
      "g1": "ELEM1"
      "g2": "ELEM1"
      "g3": "ELEM2"
      "g4": "ELEM2"
      "g5": "INT1"
      "g6": "INT1"
      "g7": "INT2"
      "g8": "INT2"
      "g9": "ADV1"
      "g10": "ADV1"
      "g11": "ADV2"
      "g12": "ADV2"
    
  littlefox:
    universal_difficulty_map:
      "1": "BEG"
      "2": "ELEM1"
      "3": "ELEM2"
      "4": "INT1"
      "5": "INT2"
      "6": "ADV1"
      "7": "ADV2"
      "8": "PROF"
      "9": "PROF"
      
  littlefoxcn:
    universal_difficulty_map:
      "1": "BEG"
      "2": "ELEM1"
      "3": "ELEM2"
      "4": "INT1"
      "5": "INT2"
    hsk_alignment:
      "1": [1, 2]
      "2": [2, 3]
      "3": [3, 4]
      "4": [4, 5]
      "5": [5, 6]

# Learning path templates
path_templates:
  k12_curriculum:
    structure: "grade → lesson → subject → video"
    weekly_plan:
      lessons_per_week: 20-25
      subjects_per_week: 5
      assessment_frequency: "weekly"
      supplementary_time: 30  # minutes
      
  story_learning:
    structure: "level → series → episode → video"
    daily_plan:
      episodes_per_day: 1-2
      comprehension_time: 10  # minutes
      vocabulary_time: 10  # minutes
      total_time: 30-45  # minutes
      
  test_preparation:
    structure: "skill → course → topic → video"
    weekly_plan:
      study_days: 6
      hours_per_day: 2-3
      mock_tests_per_week: 1
      vocabulary_time: 30  # minutes daily
      
  chinese_learning:
    structure: "hsk_level → series → episode → video"
    daily_plan:
      episodes_per_day: 1-2
      character_practice: 15  # minutes
      conversation_practice: 15  # minutes
      total_time: 45-60  # minutes

# Cross-source integration rules
integration_rules:
  - primary: abeka
    supplementary: littlefox
    trigger: "grade_completion"
    action: "recommend_cross_level"
    
  - primary: abeka
    supplementary: playtt
    trigger: "math_difficulty"
    action: "suggest_numberblocks"
    condition: "grade <= 3"
    
  - primary: littlefox
    supplementary: abeka
    trigger: "vocabulary_gap"
    action: "suggest_grammar_lesson"
    
  - primary: playtt
    supplementary: littlefox
    trigger: "ielts_prep"
    action: "recommend_literature_levels"
    levels: [6, 7, 8, 9]
```

---

## 8. Appendices

### Appendix A: Complete Content ID Reference

#### Abeka Content IDs
```
Pattern: abeka:{grade}:{lesson_number}:{subject}

Grades:
- K4, K5 (Preschool)
- g1, g2, g3, g4, g5, g6 (Elementary)
- g7, g8, g9 (Middle School)
- g10, g11, g12 (High School)

Subjects by Grade:
K4-K5: activities, phonics, numbers, bible, writing, seatwork
G1-G3: arithmetic, bible, phonics, reading, spelling, writing, language, seatwork
G4-G6: + history, health, penmanship, science
G7-G12: + algebra, geometry, precalculus, biology, chemistry, physics, spanish

Example IDs:
- abeka:g3:lesson-45:arithmetic
- abeka:g5:lesson-120:reading
- abeka:g7:lesson-85:algebra
```

#### Littlefox EN Content IDs
```
Pattern: littlefox:{level}:{series_id}:{episode_number}

Series ID Format: FS + 4 digits
Example: FS0172, FS0058

Level 1 Series (12):
- FS0001: ABC Book (26 eps)
- FS0002: Word Families (20 eps)
- FS0003: Bat and Friends (72 eps)
- ... (9 more)

Level 2 Series (13):
- FS0050: Phonics I (50 eps)
- FS0058: Bird and Kip (72 eps)
- FS0060: Space Patrol (24 eps)
- ... (10 more)

Level 3 Series (17):
- FS0100: Cinderella (24 eps)
- FS0101: Snow White (24 eps)
- FS0102: Jack and the Beanstalk (24 eps)
- ... (14 more)

... (continues through Level 9)

Example IDs:
- littlefox:3:FS0100:episode-5
- littlefox:6:FS0172:episode-12
```

#### Littlefox CN Content IDs
```
Pattern: littlefoxcn:{level}:{series_id}:{episode_number}

Series ID Format: DP + 6 digits
Example: DP000777, DP000805

Level 1 Series (14):
- DP000777: Nihao Chinese (basics)
- DP000778: Tones practice
- ... (12 more)

Level 2 Series (7):
- DP000805: Single Stories
- DP000806: Mrs. Kelly's Class
- ... (5 more)

... (continues through Level 5)

Example IDs:
- littlefoxcn:2:DP000805:episode-3
- littlefoxcn:4:DP000850:episode-10
```

#### PlayTT Content IDs
```
Pattern: playtt:{provider}:{course_code}:{video_number}

Providers: TEDed, Acellus, Numberblocks, PeppaPig, Ben10, Heinemann

IELTS Courses:
- playtt:TEDed:INSIGHT_IELTS_1:video-001 (34 videos)
- playtt:TEDed:INSIGHT_IELTS_2:video-001 (34 videos)
- playtt:TEDed:INSIGHT_IELTS_3:video-001 (34 videos)
- playtt:TEDed:STEP_IELTS_1:video-001 (38 videos)
- playtt:TEDed:STEP_IELTS_2:video-001 (37 videos)
- playtt:TEDed:STEP_IELTS_3:video-001 (38 videos)

Math Courses:
- playtt:Numberblocks:series-1:video-001
- playtt:Acellus:math-g3:video-001

Example IDs:
- playtt:TEDed:INSIGHT_IELTS_1:video-15
- playtt:Numberblocks:series-3:video-08
```

### Appendix B: Weekly Time Budget Recommendations

| Age | Grade | Core Curriculum | Supplementary | Total/Day | Total/Week |
|-----|-------|-----------------|---------------|-----------|------------|
| 3-4 | K4-K5 | 20 min | 10 min | 30 min | 2.5 hours |
| 5-6 | G1-G2 | 30 min | 15 min | 45 min | 3.75 hours |
| 7-8 | G3-G4 | 40 min | 15 min | 55 min | 4.5 hours |
| 9-10 | G5-G6 | 50 min | 20 min | 70 min | 6 hours |
| 11-12 | G7-G8 | 60 min | 20 min | 80 min | 7 hours |
| 13-14 | G9-G10 | 70 min | 20 min | 90 min | 8 hours |
| 15-16 | G11-G12 | 80 min | 20 min | 100 min | 8.5 hours |
| 17+ | Adult | 90 min | 30 min | 120 min | 10.5 hours |

### Appendix C: Assessment Rubrics

#### K-12 Progression Markers

| Grade | Reading | Math | Writing | Science |
|-------|---------|------|---------|---------|
| K4 | Letter recognition | Count 1-20 | Name writing | Nature observation |
| K5 | 100 sight words | Add/subtract 1-10 | Sentence writing | Basic classification |
| G1 | Grade-level texts | Operations 1-100 | Paragraph | Simple experiments |
| G2 | Comprehension strategies | Multiplication intro | 3-paragraph essay | Life cycles |
| G3 | Inference skills | Multiplication mastery | Research paragraph | Earth science |
| G4 | Critical reading | Division/fractions | Narrative essay | Physical science |
| G5 | Literary analysis | Decimals/measurement | Expository writing | Scientific method |
| G6 | Classic literature | Pre-algebra | Persuasive writing | Biology basics |
| G7 | Research skills | Algebra I | Research paper | Chemistry intro |
| G8 | Textual evidence | Geometry | Literary analysis | Physics concepts |
| G9 | Academic reading | Algebra II | Argumentative essay | Biology lab |
| G10 | SAT-level texts | Precalculus | Synthesis essay | Chemistry lab |
| G11 | AP-level analysis | Calculus intro | College essay | Physics lab |
| G12 | College readiness | Statistics | Senior thesis | Research project |

#### Littlefox Progression Markers

| Level | Comprehension | Vocabulary | Output |
|-------|---------------|------------|--------|
| 1 | Picture-word matching | 50 words | Repeat phrases |
| 2 | Simple Q&A | 150 words | Describe characters |
| 3 | Story sequencing | 300 words | Retell story |
| 4 | Inference | 500 words | Compare stories |
| 5 | Theme identification | 700 words | Analyze characters |
| 6 | Literary devices | 1000 words | Write book review |
| 7 | Critical analysis | 1500 words | Research presentation |
| 8 | Comparative literature | 2000 words | Academic essay |
| 9 | Scholarly discussion | 3000+ words | Publish review |

---

## Unresolved Questions

1. **Content Updates:** What is the refresh frequency for each source? Should we implement automated sync for new Abeka lessons or Littlefox series?

2. **Placement Test Implementation:** Should we develop standardized placement tests for each source to allow learners to skip ahead based on ability rather than age?

3. **Offline Support:** Are there mechanisms for downloading content for offline viewing, particularly for families with limited internet access?

4. **Subtitle/Translation:** Which videos have subtitle files available? Currently only Littlefox has documented subtitle URLs.

5. **Parent Dashboard:** What metrics should be displayed on parent dashboards to track cross-source progress effectively?

6. **AI Recommendations:** Should we implement ML-based recommendation algorithms beyond the rule-based system, and what data would be required?

7. **Gamification:** How should we gamify cross-source learning paths (badges, streaks, achievements)?

8. **Community Features:** Should we enable peer-to-peer features (study groups, leaderboards) across learning paths?

9. **Assessment Standardization:** Should we develop unified assessments that work across sources, or keep source-specific assessments?

10. **Special Needs Adaptation:** How should learning paths adapt for learners with different learning needs or paces?

---

*Document Version: 1.0*  
*Created: 2026-03-31*  
*Classification: Implementation Guide*  
*Related Documents: educational-content-structure-analysis.md, 05-content-taxonomy-cms-data-model.md*
