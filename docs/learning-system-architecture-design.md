# Learning System Architecture Design

**Project:** hoctienganh.xyz Educational Platform  
**Version:** 1.0  
**Date:** March 31, 2026  
**Status:** Technical Design Document

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Data Architecture](#3-data-architecture)
4. [Learning Hierarchy Design](#4-learning-hierarchy-design)
5. [API Design](#5-api-design)
6. [Algorithm Specifications](#6-algorithm-specifications)
7. [Integration Strategy](#7-integration-strategy)
8. [Scalability & Performance](#8-scalability--performance)
9. [Implementation Phases](#9-implementation-phases)

---

## 1. Executive Summary

### 1.1 Purpose

This document provides the complete technical architecture design for transforming hoctienganh.xyz from a video aggregation platform into an intelligent, adaptive learning system.

### 1.2 Core Design Principles

| Principle | Implementation |
|-----------|----------------|
| **YAGNI** | Build only necessary features for each phase |
| **KISS** | Simple 5-level hierarchy, clear relationships |
| **DRY** | Reusable content mapping, shared progress tracking |
| **Scalability** | Support 36,360+ videos, 10,000+ concurrent users |

### 1.3 Key Architectural Decisions

1. **Hierarchical Content Model:** 5-level nesting (Video → Lesson → Daily → Weekly → Journey)
2. **Polyglot Persistence:** PostgreSQL (relational) + MongoDB (content) + Redis (cache)
3. **Adaptive Learning:** Duolingo's Half-Life Regression (HLR) for spaced repetition
4. **Microservices:** Separate services for content, progress, recommendations

---

## 2. System Overview

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐│
│  │  Web App    │  │ Mobile App  │  │   TV App    │  │  Admin      ││
│  │  (Next.js)  │  │  (React     │  │  (Tizen/    │  │  Dashboard  ││
│  │             │  │   Native)   │  │   webOS)    │  │  (Internal) ││
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘│
└─────────┼────────────────┼────────────────┼────────────────┼───────┘
          │                │                │                │
          └────────────────┴────────────────┴────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY                                   │
│              (Kong / AWS API Gateway / Nginx)                        │
│         Rate Limiting │ Auth │ Routing │ Load Balancing              │
└─────────────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
          ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  CONTENT        │  │  LEARNING       │  │  ANALYTICS      │
│  SERVICE        │  │  SERVICE        │  │  SERVICE        │
│                 │  │                 │  │                 │
│ • Content mgmt  │  │ • Path gen      │  │ • Tracking      │
│ • Search        │  │ • Progress      │  │ • Reporting     │
│ • Metadata      │  │ • Assessment    │  │ • Insights      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         └────────────────────┼────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐  │
│  │ PostgreSQL   │  │   MongoDB    │  │    Redis     │  │    S3    │  │
│  │              │  │              │  │              │  │          │  │
│  │ • Users      │  │ • Content    │  │ • Sessions   │  │ • Videos │  │
│  │ • Progress   │  │ • Hierarchy  │  │ • Cache      │  │ • Assets │  │
│  │ • Analytics  │  │ • Mappings   │  │ • Real-time  │  │ • Thumbs │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Service Boundaries

| Service | Responsibility | Data Store |
|---------|----------------|------------|
| **Content Service** | CRUD for videos, lessons, paths | MongoDB |
| **Learning Service** | Path generation, progress tracking | PostgreSQL |
| **Recommendation Service** | Personalized suggestions, next content | Redis + ML model |
| **Analytics Service** | Event tracking, reporting, insights | PostgreSQL + ClickHouse |
| **Media Service** | Video streaming, transcoding, CDN | S3 + CloudFront |

---

## 3. Data Architecture

### 3.1 Database Schema Extensions

#### Core Learning Tables (PostgreSQL)

```sql
-- Learning Journey: Top-level curriculum container
CREATE TABLE learning_journeys (
    journey_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) CHECK (category IN ('k12', 'language', 'test_prep', 'supplementary')),
    target_age_min INT,
    target_age_max INT,
    duration_weeks INT NOT NULL,
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 9),
    prerequisites JSONB DEFAULT '[]',
    certificate_requirements JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Plan: Week-level organization
CREATE TABLE weekly_plans (
    weekly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    journey_id UUID REFERENCES learning_journeys(journey_id) ON DELETE CASCADE,
    week_number INT NOT NULL,
    title VARCHAR(255),
    theme VARCHAR(100),
    description TEXT,
    estimated_hours DECIMAL(4,1),
    learning_objectives JSONB,
    completion_criteria JSONB,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(journey_id, week_number)
);

-- Daily Plan: Day-level session
CREATE TABLE daily_plans (
    daily_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    weekly_id UUID REFERENCES weekly_plans(weekly_id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    title VARCHAR(255),
    description TEXT,
    estimated_minutes INT,
    lesson_sequence JSONB, -- Ordered array of lesson_ids
    required_completion_pct DECIMAL(5,2) DEFAULT 80.0,
    is_review_day BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(weekly_id, day_number)
);

-- Lesson Package: Multi-video learning unit
CREATE TABLE lesson_packages (
    lesson_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) CHECK (type IN ('video_series', 'interactive', 'assessment', 'mixed')),
    estimated_minutes INT,
    learning_objectives JSONB,
    video_sequence JSONB, -- Ordered array of {video_id, required_watch_pct}
    prerequisites JSONB DEFAULT '[]',
    difficulty_level INT CHECK (difficulty_level BETWEEN 1 AND 9),
    subject_tags TEXT[],
    source_mapping JSONB, -- Links to original content
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction: Daily Plan ↔ Lesson Package
CREATE TABLE daily_plan_lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_id UUID REFERENCES daily_plans(daily_id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lesson_packages(lesson_id) ON DELETE CASCADE,
    sequence_order INT NOT NULL,
    is_required BOOLEAN DEFAULT true,
    unlock_condition JSONB, -- Prerequisites to unlock
    UNIQUE(daily_id, lesson_id)
);

-- User Progress: Completion tracking
CREATE TABLE user_progress (
    progress_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_type VARCHAR(20) CHECK (content_type IN ('video', 'lesson', 'daily', 'weekly', 'journey')),
    content_id UUID NOT NULL,
    status VARCHAR(20) CHECK (status IN ('not_started', 'in_progress', 'completed', 'locked')),
    completion_pct DECIMAL(5,2) DEFAULT 0,
    watch_time_seconds INT DEFAULT 0,
    score DECIMAL(5,2),
    attempts INT DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    last_accessed_at TIMESTAMP,
    events_log JSONB, -- Detailed interaction events
    UNIQUE(user_id, content_type, content_id)
);

-- Spaced Repetition: HLR tracking
CREATE TABLE spaced_repetition_items (
    item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    content_id UUID NOT NULL,
    content_type VARCHAR(20),
    half_life DECIMAL(10,4), -- Current half-life in days
    last_practice_at TIMESTAMP,
    next_review_at TIMESTAMP,
    total_practices INT DEFAULT 0,
    correct_streak INT DEFAULT 0,
    difficulty_estimate DECIMAL(5,2),
    hlr_features JSONB, -- Historical features for HLR
    UNIQUE(user_id, content_id, content_type)
);

-- Learning Path Enrollments
CREATE TABLE user_enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    journey_id UUID REFERENCES learning_journeys(journey_id),
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    target_completion_date DATE,
    preferred_pace VARCHAR(20) CHECK (preferred_pace IN ('intensive', 'standard', 'relaxed')),
    current_week INT DEFAULT 1,
    current_day INT DEFAULT 1,
    overall_progress_pct DECIMAL(5,2) DEFAULT 0,
    status VARCHAR(20) CHECK (status IN ('active', 'paused', 'completed', 'dropped')),
    last_activity_at TIMESTAMP,
    streak_count INT DEFAULT 0,
    longest_streak INT DEFAULT 0
);

-- Content Mapping: Link to existing sources
CREATE TABLE content_source_mappings (
    mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lesson_packages(lesson_id),
    source_key VARCHAR(50) CHECK (source_key IN ('abeka', 'littlefox', 'littlefoxcn', 'playtt', 'playgg')),
    collection_key VARCHAR(50),
    grade VARCHAR(10),
    lesson_number INT,
    series_id VARCHAR(20),
    series_title VARCHAR(255),
    metadata JSONB,
    UNIQUE(lesson_id, source_key, collection_key)
);
```

### 3.2 Content Hierarchy (MongoDB)

```javascript
// Collection: learning_paths
{
  "_id": ObjectId("..."),
  "journey_id": "uuid-from-postgres",
  "version": 1,
  "structure": {
    "weeks": [
      {
        "week_number": 1,
        "weekly_id": "uuid",
        "days": [
          {
            "day_number": 1,
            "daily_id": "uuid",
            "lessons": [
              {
                "sequence": 1,
                "lesson_id": "uuid",
                "estimated_minutes": 15,
                "videos": [
                  {
                    "video_id": "uuid",
                    "source_mapping": {
                      "source": "abeka",
                      "collection_key": "col_xxx",
                      "video_url": "https://..."
                    },
                    "duration_seconds": 480,
                    "required_watch_pct": 80
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  "prerequisite_graph": {
    "nodes": ["lesson_uuid_1", "lesson_uuid_2"],
    "edges": [
      {"from": "lesson_uuid_1", "to": "lesson_uuid_2", "type": "required"}
    ]
  },
  "adaptive_rules": {
    "difficulty_progression": "linear",
    "review_frequency": "hlr",
    "unlock_conditions": {
      "min_completion_pct": 80,
      "min_score": 70
    }
  }
}
```

### 3.3 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ENTITY RELATIONSHIPS                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────┐              │
│  │ learning_journeys│◄─────────│  weekly_plans    │              │
│  │ (1)              │   1:M    │  (M)             │              │
│  └────────┬─────────┘          └────────┬─────────┘              │
│           │                               │                        │
│           │         ┌──────────────────┐   │                        │
│           │         │ user_enrollments │   │                        │
│           │         │ (tracks user     │   │                        │
│           │         │  progress in     │   │                        │
│           └────────►│  journey)        │◄──┘                        │
│              M:1     └──────────────────┘                            │
│                                                                     │
│  ┌──────────────────┐          ┌──────────────────┐              │
│  │   weekly_plans   │◄─────────│   daily_plans    │              │
│  │ (1)              │   1:M    │  (M)             │              │
│  └──────────────────┘          └────────┬─────────┘              │
│                                         │                          │
│                              ┌──────────┴──────────┐              │
│                              │ daily_plan_lessons  │              │
│                              │ (junction table)    │              │
│                              └──────────┬──────────┘              │
│                                         │                          │
│  ┌──────────────────┐          ┌────────▼─────────┐              │
│  │lesson_packages   │◄─────────│  user_progress   │              │
│  │ (content)       │   1:M    │  (tracking)      │              │
│  └────────┬─────────┘          └──────────────────┘              │
│           │                                                         │
│           │          ┌─────────────────────────────┐              │
│           └─────────►│ content_source_mappings     │              │
│                 1:M  │ (links to abeka/littlefox)  │              │
│                      └─────────────────────────────┘              │
│                                                                     │
│  ┌─────────────────────────┐                                      │
│  │ spaced_repetition_items │                                      │
│  │ (HLR algorithm state)   │                                      │
│  └─────────────────────────┘                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Learning Hierarchy Design

### 4.1 Five-Level Hierarchy

```
┌─────────────────────────────────────────────────────────────────────┐
│  LEVEL 5: LEARNING JOURNEY                                           │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Duration: 4-52 weeks                                             │
│  • Examples: "Kindergarten Readiness", "IELTS Band 7.0"              │
│  • Completion: Certificate + Competency mastery                     │
│  • Metadata: Prerequisites, target age, difficulty curve              │
├─────────────────────────────────────────────────────────────────────┤
│  LEVEL 4: WEEKLY PLAN                                                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Duration: 5-15 hours per week                                    │
│  • Contains: 5-7 daily plans                                        │
│  • Theme: Weekly learning theme (e.g., "Phonics Week 1")            │
│  • Milestone: Weekly completion badge                               │
├─────────────────────────────────────────────────────────────────────┤
│  LEVEL 3: DAILY PLAN                                                 │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Duration: 10-45 minutes per session                              │
│  • Contains: 3-7 lesson packages                                    │
│  • Schedule: Daily recommended path                                 │
│  • Tracking: XP points, streaks                                     │
├─────────────────────────────────────────────────────────────────────┤
│  LEVEL 2: LESSON PACKAGE                                             │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Duration: 15-60 minutes                                            │
│  • Contains: 3-7 videos + assessments                               │
│  • Types: video_series, interactive, assessment, mixed               │
│  • Completion: 80% watch + 70% quiz score                           │
├─────────────────────────────────────────────────────────────────────┤
│  LEVEL 1: VIDEO (Atomic Unit)                                        │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  • Duration: 3-15 minutes                                             │
│  • Content: Single concept/skill                                      │
│  • Tracking: Watch %, pause events, replays                         │
│  • Streaming: HLS/MP4 with CDN                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 Hierarchy Specifications

| Level | Unit | Duration | Content Count | Completion Criteria |
|-------|------|----------|---------------|---------------------|
| Journey | Curriculum | 4-52 weeks | Multiple weekly | All weeks + final assessment |
| Weekly | Week | 5-15 hours | 5-7 daily | All days completed |
| Daily | Session | 10-45 min | 3-7 lessons | 80% lessons completed |
| Lesson | Module | 15-60 min | 3-7 videos | 80% watch + quiz ≥ 70% |
| Video | Atomic | 3-15 min | 1 | 80% watched |

### 4.3 Progress Tracking Model

```javascript
// Progress State Machine
const ProgressStatus = {
  NOT_STARTED: 'not_started',    // Never accessed
  LOCKED: 'locked',              // Prerequisites not met
  IN_PROGRESS: 'in_progress',    // Started but incomplete
  COMPLETED: 'completed',         // All criteria met
  REVIEW_PENDING: 'review_pending' // Spaced repetition due
};

// Completion Criteria by Level
const CompletionCriteria = {
  video: {
    minWatchPercent: 80,
    minWatchSeconds: 30,
    trackEvents: ['play', 'pause', 'seek', 'complete']
  },
  lesson: {
    videoCompletion: 80,  // % of videos
    minQuizScore: 70,     // If assessment included
    timeSpentMin: 10      // Minutes
  },
  daily: {
    lessonCompletion: 80,  // % of lessons
    maxTimeWindow: '26h'  // Must complete within 26 hours
  },
  weekly: {
    dayCompletion: 100,    // All days
    reviewCompleted: true  // Weekend review
  },
  journey: {
    weekCompletion: 100,   // All weeks
    finalAssessment: 70    // Final score
  }
};
```

---

## 5. API Design

### 5.1 REST API Endpoints

#### Learning Path APIs

```
GET    /api/v1/journeys                    # List all journeys
GET    /api/v1/journeys/:id                # Get journey details
POST   /api/v1/journeys/:id/enroll         # Enroll user in journey
GET    /api/v1/journeys/:id/progress       # Get journey progress

GET    /api/v1/journeys/:id/weekly/:week   # Get weekly plan
GET    /api/v1/journeys/:id/daily/:day     # Get daily plan

GET    /api/v1/lessons/:id                 # Get lesson details
POST   /api/v1/lessons/:id/start           # Start lesson
POST   /api/v1/lessons/:id/complete        # Mark lesson complete
```

#### Progress APIs

```
GET    /api/v1/progress                    # User's overall progress
GET    /api/v1/progress/:journeyId         # Progress in specific journey
POST   /api/v1/progress/video/:id          # Update video progress
POST   /api/v1/progress/lesson/:id         # Update lesson progress

GET    /api/v1/progress/streak             # Get current streak
GET    /api/v1/progress/achievements       # Get achievements
GET    /api/v1/progress/reviews            # Get spaced repetition queue
```

#### Recommendation APIs

```
GET    /api/v1/recommendations/next        # Get next recommended content
GET    /api/v1/recommendations/review      # Get items due for review
GET    /api/v1/recommendations/alternate   # Get alternative paths
POST   /api/v1/recommendations/feedback    # Send recommendation feedback
```

#### Content APIs

```
GET    /api/v1/content/search              # Search content
GET    /api/v1/content/filter              # Filter by grade/subject
GET    /api/v1/content/videos/:id          # Get video metadata
GET    /api/v1/content/videos/:id/stream   # Get streaming URL
GET    /api/v1/content/subjects            # Get subject taxonomy
```

### 5.2 API Request/Response Examples

#### Get Daily Plan

```http
GET /api/v1/journeys/kindergarten-readiness/daily/15
Authorization: Bearer <token>
```

```json
{
  "daily_id": "550e8400-e29b-41d4-a716-446655440000",
  "day_number": 15,
  "week_number": 3,
  "title": "Phonics: Short Vowels A & E",
  "description": "Learn short vowel sounds through animated stories",
  "estimated_minutes": 30,
  "is_review_day": false,
  "lessons": [
    {
      "sequence": 1,
      "lesson_id": "lesson-uuid-1",
      "title": "The Apple Story",
      "type": "video_series",
      "estimated_minutes": 12,
      "status": "not_started",
      "videos": [
        {
          "video_id": "vid-uuid-1",
          "title": "Introduction to Short A",
          "duration_seconds": 420,
          "thumbnail": "https://cdn...",
          "stream_url": "https://fileta...",
          "source": {
            "source_key": "abeka",
            "collection_key": "col_xxx",
            "original_url": "https://..."
          },
          "required_watch_pct": 80
        }
      ],
      "is_locked": false,
      "unlock_reason": null
    }
  ],
  "progress": {
    "completion_pct": 0,
    "time_spent_minutes": 0,
    "status": "not_started"
  },
  "is_accessible": true,
  "unlock_conditions_met": true
}
```

#### Update Video Progress

```http
POST /api/v1/progress/video/vid-uuid-1
Content-Type: application/json

{
  "watch_time_seconds": 380,
  "completion_pct": 90,
  "events": [
    {"type": "play", "timestamp": "2026-03-31T10:00:00Z"},
    {"type": "pause", "timestamp": "2026-03-31T10:05:00Z", "position": 120},
    {"type": "complete", "timestamp": "2026-03-31T10:06:20Z"}
  ],
  "session_id": "session-uuid"
}
```

```json
{
  "status": "success",
  "progress_id": "prog-uuid",
  "updated": {
    "video": {
      "status": "completed",
      "completion_pct": 90,
      "xp_earned": 15
    },
    "lesson": {
      "status": "in_progress",
      "completion_pct": 33,
      "next_video_id": "vid-uuid-2"
    },
    "daily": {
      "status": "in_progress",
      "completion_pct": 10
    },
    "unlock": {
      "new_lessons": [],
      "message": "Continue to next video!"
    }
  },
  "achievements": [],
  "streak": {
    "current": 5,
    "extended": true
  }
}
```

---

## 6. Algorithm Specifications

### 6.1 Spaced Repetition (HLR Algorithm)

```python
class HLRCalculator:
    """
    Half-Life Regression Implementation
    Based on Duolingo's research (Settles & Meeder, 2016)
    """
    
    def __init__(self, weights=None):
        # Default weights from Duolingo's model
        self.weights = weights or {
            'bias': -0.1,
            'right': 0.1,
            'wrong': -0.2,
            'history_seen': 0.01,
            'history_correct': 0.02,
            'history_wrong': -0.03,
            'lexeme_difficulty': -0.05
        }
    
    def calculate_half_life(self, features):
        """
        Calculate half-life in days using logistic regression
        
        Features:
        - right: number of correct answers
        - wrong: number of incorrect answers
        - history_seen: total exposures
        - history_correct: total correct
        - lexeme_difficulty: content difficulty (1-9 normalized)
        """
        logit = (
            self.weights['bias'] +
            self.weights['right'] * features['right'] +
            self.weights['wrong'] * features['wrong'] +
            self.weights['history_seen'] * features['history_seen'] +
            self.weights['history_correct'] * features['history_correct'] +
            self.weights['lexeme_difficulty'] * features['lexeme_difficulty']
        )
        
        # Convert logit to half-life (days)
        half_life = 2 ** logit
        return max(0.1, half_life)  # Minimum 2.4 hours
    
    def predict_recall(self, half_life, days_since_last):
        """
        Predict probability of recall using forgetting curve
        p_recall = 2^(-delta / h)
        """
        return 2 ** (-days_since_last / half_life)
    
    def schedule_review(self, user_item_pair):
        """
        Determine optimal review time
        Schedule when p_recall ≈ 0.5 (optimal retention)
        """
        h = self.calculate_half_life(user_item_pair['features'])
        
        # Optimal interval: when recall probability is ~50%
        # 0.5 = 2^(-delta / h)
        # delta = h * log2(0.5) = -h * 1
        # But we use h * 0.5 for practical purposes
        optimal_interval_days = h * 0.5
        
        return {
            'half_life': h,
            'next_review_days': optimal_interval_days,
            'next_review_date': datetime.now() + timedelta(days=optimal_interval_days),
            'confidence': self.predict_recall(h, optimal_interval_days)
        }
    
    def update_after_practice(self, previous_h, outcome, features):
        """
        Update half-life after a practice session
        outcome: 'correct' or 'incorrect'
        """
        # Simple Bayesian update
        if outcome == 'correct':
            new_h = previous_h * 1.1  # Increase by 10%
        else:
            new_h = previous_h * 0.9  # Decrease by 10%
        
        # Recalculate based on updated features
        recalculated_h = self.calculate_half_life(features)
        
        # Weighted average
        updated_h = (new_h + recalculated_h) / 2
        return updated_h
```

### 6.2 Difficulty Progression Algorithm

```python
class DifficultyProgression:
    """
    Adaptive difficulty adjustment based on user performance
    """
    
    def __init__(self):
        self.target_success_rate = 0.8  # 80% success target
        self.adjustment_step = 0.5     # Half-level adjustments
    
    def calculate_next_difficulty(self, user_id, current_difficulty, recent_performance):
        """
        Determine next content difficulty based on recent performance
        
        recent_performance: list of last N attempts (True/False)
        """
        if not recent_performance:
            return current_difficulty
        
        success_rate = sum(recent_performance) / len(recent_performance)
        
        # Calculate adjustment
        if success_rate > self.target_success_rate + 0.1:
            # Too easy, increase difficulty
            adjustment = self.adjustment_step
        elif success_rate < self.target_success_rate - 0.1:
            # Too hard, decrease difficulty
            adjustment = -self.adjustment_step
        else:
            # Just right, maintain
            adjustment = 0
        
        new_difficulty = current_difficulty + adjustment
        return max(1, min(9, new_difficulty))  # Clamp to 1-9
    
    def select_next_content(self, user_id, available_content, user_level):
        """
        Select next content from available pool
        """
        # Filter by difficulty range (±1 from user level)
        suitable = [
            c for c in available_content
            if abs(c['difficulty'] - user_level) <= 1
        ]
        
        if not suitable:
            # Fallback to closest difficulty
            suitable = sorted(
                available_content,
                key=lambda c: abs(c['difficulty'] - user_level)
            )[:3]
        
        # Prioritize: review items > new content at level > easier > harder
        review_items = [c for c in suitable if c['is_due_for_review']]
        if review_items:
            return review_items[0]
        
        # Return first suitable new content
        return suitable[0] if suitable else available_content[0]
```

### 6.3 Prerequisite Validation

```python
class PrerequisiteValidator:
    """
    Validate if user meets prerequisites to unlock content
    """
    
    def __init__(self, db):
        self.db = db
    
    def check_prerequisites(self, user_id, content_id, prerequisites):
        """
        Check if user meets all prerequisites
        
        prerequisites format:
        [
          {"type": "lesson", "id": "...", "min_completion": 80},
          {"type": "assessment", "id": "...", "min_score": 70},
          {"type": "time", "min_days_since": 7}
        ]
        """
        results = []
        all_met = True
        
        for prereq in prerequisites:
            met = self._check_single_prerequisite(user_id, prereq)
            results.append({
                "prerequisite": prereq,
                "met": met
            })
            if not met:
                all_met = False
        
        return {
            "all_met": all_met,
            "details": results,
            "missing": [r for r in results if not r['met']]
        }
    
    def _check_single_prerequisite(self, user_id, prereq):
        """Check a single prerequisite condition"""
        ptype = prereq['type']
        
        if ptype in ['video', 'lesson', 'daily', 'weekly', 'journey']:
            progress = self.db.get_progress(user_id, ptype, prereq['id'])
            if not progress:
                return False
            return progress['completion_pct'] >= prereq.get('min_completion', 80)
        
        elif ptype == 'assessment':
            score = self.db.get_assessment_score(user_id, prereq['id'])
            return score >= prereq.get('min_score', 70)
        
        elif ptype == 'time':
            days_since = self.db.get_days_since_started(user_id, prereq.get('content_id'))
            return days_since >= prereq.get('min_days_since', 0)
        
        return False
```

---

## 7. Integration Strategy

### 7.1 Existing System Integration

```
┌─────────────────────────────────────────────────────────────────────┐
│                    INTEGRATION ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌────────────────────────┐         ┌────────────────────────┐      │
│  │   EXISTING SYSTEM      │         │   NEW LEARNING LAYER   │      │
│  │                        │         │                        │      │
│  │  content_source        │────────►│  content mappings      │      │
│  │  content_collection    │         │  (links old → new)     │      │
│  │  content_video         │         │                        │      │
│  │                        │         │  learning_journeys     │      │
│  │  /abeka/g1/001         │────────►│  lesson_packages       │      │
│  │  /littlefox/FS0172     │         │  with video refs       │      │
│  └────────────────────────┘         └────────────────────────┘      │
│            │                                    │                    │
│            │                                    │                    │
│            ▼                                    ▼                    │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                    SYNC LAYER                               │    │
│  │  • Content update webhooks                                 │    │
│  │  • Daily mapping refresh                                     │    │
│  │  • Health check monitoring                                   │    │
│  │  • Fallback to source URLs                                   │    │
│  └────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 7.2 Content Mapping Strategy

| Source | Mapping Approach | Key Fields |
|--------|------------------|------------|
| **Abeka** | Grade-Lesson mapping | `grade`, `lesson_number` → Lesson Package |
| **Littlefox** | Level-Series mapping | `series_id`, `level` → Lesson Package |
| **PlayTT** | Course-Topic mapping | `provider`, `course` → Weekly Plan |
| **LittlefoxCN** | Level-Series mapping | `series_id` → Lesson Package |

### 7.3 Data Migration Plan

```sql
-- Phase 1: Create mapping entries for existing content
INSERT INTO content_source_mappings (
    lesson_id, source_key, collection_key, 
    grade, lesson_number, series_id, metadata
)
SELECT 
    gen_random_uuid() as lesson_id,
    cc.source_key,
    cc.collection_key,
    cc.grade,
    cc.lesson,
    cc.series_id,
    jsonb_build_object(
        'page_url', cc.page_url,
        'item_count', (cc.metadata_json->>'item_count')::int
    ) as metadata
FROM content_collection cc
WHERE cc.source_key = 'abeka';

-- Phase 2: Create lesson packages with video sequences
INSERT INTO lesson_packages (
    title, description, type, estimated_minutes,
    video_sequence, source_mapping, difficulty_level
)
SELECT 
    'Lesson ' || csm.lesson_number as title,
    'Abeka Grade ' || csm.grade || ' Lesson ' || csm.lesson_number as description,
    'video_series' as type,
    (csm.metadata->>'item_count')::int * 8 as estimated_minutes, -- ~8 min per video
    jsonb_agg(
        jsonb_build_object(
            'video_id', gen_random_uuid(),
            'collection_key', csm.collection_key,
            'source_key', csm.source_key,
            'sequence', row_number() over (partition by csm.collection_key)
        )
    ) as video_sequence,
    csm.mapping_id as source_mapping,
    CASE 
        WHEN csm.grade IN ('k4', 'k5') THEN 1
        WHEN csm.grade IN ('g1', 'g2') THEN 2
        WHEN csm.grade IN ('g3', 'g4') THEN 3
        WHEN csm.grade IN ('g5', 'g6') THEN 4
        WHEN csm.grade IN ('g7', 'g8') THEN 5
        WHEN csm.grade IN ('g9', 'g10') THEN 6
        ELSE 7
    END as difficulty_level
FROM content_source_mappings csm
WHERE csm.source_key = 'abeka'
GROUP BY csm.mapping_id, csm.grade, csm.lesson_number, csm.metadata;
```

---

## 8. Scalability & Performance

### 8.1 Database Scaling Strategy

| Component | Current | Target | Strategy |
|-----------|---------|--------|----------|
| Videos | 36,360 | 100,000+ | Sharding by source_key |
| Users | ~1,000 | 50,000+ | Read replicas |
| Concurrent | ~100 | 5,000+ | Connection pooling |
| Storage | ~20TB | 100TB | CDN + S3 lifecycle |

### 8.2 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────┐
│                       CACHING LAYERS                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  L1: Browser Cache                                                   │
│  • Video segments (HLS .ts files)                                   │
│  • Static assets (thumbnails, metadata)                           │
│  TTL: 1 hour                                                        │
│                                                                      │
│  L2: CDN (CloudFront)                                                │
│  • Popular video streams                                            │
│  • API responses for public content                                  │
│  TTL: 24 hours                                                      │
│                                                                      │
│  L3: Redis Cluster                                                   │
│  • User sessions                                                     │
│  • Current progress (hot data)                                     │
│  • Spaced repetition queues                                          │
│  TTL: Session-based / 7 days                                        │
│                                                                      │
│  L4: Application Cache                                               │
│  • Learning path structures                                         │
│  • Prerequisite graphs                                              │
│  • Content metadata                                                  │
│  TTL: 1 hour with cache invalidation                                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 8.3 Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response | < 200ms | p95 latency |
| Video Start Time | < 3s | Time to first frame |
| Page Load | < 2s | Initial content render |
| Search Results | < 500ms | Query to results |
| Progress Sync | < 100ms | Real-time updates |

---

## 9. Implementation Phases

### 9.1 Phase 1: Core Hierarchy (Weeks 1-6)

**Deliverables:**
- Database schema (6 new tables)
- Basic CRUD APIs
- Content mapping layer
- Simple UI for viewing paths

**Success Criteria:**
- [ ] All 36,360 videos mapped to hierarchy
- [ ] Basic progress tracking functional
- [ ] Users can view and navigate learning paths

### 9.2 Phase 2: Content Mapping (Weeks 7-12)

**Deliverables:**
- 4 learning path templates
- Automated sequencing
- Prerequisite validation
- Content recommendations v1

**Success Criteria:**
- [ ] 4 complete learning paths deployed
- [ ] Prerequisite system working
- [ ] Users can enroll in structured paths

### 9.3 Phase 3: Adaptive Engine (Weeks 13-18)

**Deliverables:**
- HLR spaced repetition
- Progress dashboard
- Difficulty adjustment
- Review scheduling

**Success Criteria:**
- [ ] Spaced repetition active for 1,000+ users
- [ ] Progress dashboard with insights
- [ ] Adaptive paths showing improvement

### 9.4 Phase 4: Advanced Features (Weeks 19-24)

**Deliverables:**
- Cross-source integration
- Gamification system
- Parent dashboard
- Analytics and reporting

**Success Criteria:**
- [ ] 5,000+ active learners
- [ ] 80% completion rate on daily plans
- [ ] Parent dashboard with progress visibility

---

## 10. Technology Stack Recommendations

### 10.1 Backend

| Layer | Technology | Reason |
|-------|------------|--------|
| API Framework | FastAPI (Python) | Async, auto-docs, type hints |
| Database | PostgreSQL 16 | ACID, JSONB, mature |
| Document Store | MongoDB 7 | Flexible content hierarchy |
| Cache | Redis 7 | Sessions, real-time data |
| Queue | Celery + RabbitMQ | Background tasks |
| ML/AI | scikit-learn | HLR algorithm, recommendations |

### 10.2 Frontend

| Layer | Technology | Reason |
|-------|------------|--------|
| Web Framework | Next.js 14 | SSR, React, performance |
| UI Library | shadcn/ui | Accessible, customizable |
| State Management | Zustand | Simple, effective |
| Video Player | Video.js | HLS support, customizable |
| Charts | Recharts | React-native, flexible |

### 10.3 Infrastructure

| Layer | Technology | Reason |
|-------|------------|--------|
| Cloud | AWS / GCP | Scalable, managed services |
| CDN | CloudFront / CloudFlare | Global video delivery |
| Storage | S3 + Glacier | Cost-effective video storage |
| Containers | Docker + ECS | Scalable deployment |
| Monitoring | Datadog / New Relic | APM, alerting |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **HLR** | Half-Life Regression - spaced repetition algorithm |
| **Learning Journey** | Complete curriculum (4-52 weeks) |
| **Lesson Package** | Multi-video learning unit |
| **Daily Plan** | Daily recommended session |
| **Spaced Repetition** | Review scheduling based on forgetting curve |
| **Prerequisite Chain** | Required completion order |
| **Adaptive Learning** | Personalized difficulty adjustment |

## Appendix B: Content ID Reference

| Source | ID Format | Example |
|--------|-----------|---------|
| Abeka | `g{grade}/lesson-{number}` | `g1/lesson-42` |
| Littlefox | `FS{4digits}` | `FS0172` |
| LittlefoxCN | `DP{6digits}` | `DP000777` |
| PlayTT | `{provider}/{course}` | `acellus/math-grade1` |

## Appendix C: SQL Migration Scripts

See `/sql/migrations/` directory for complete migration scripts:
- `001_create_learning_tables.sql`
- `002_create_content_mappings.sql`
- `003_create_progress_tables.sql`
- `004_create_hlr_tables.sql`

---

*Document generated: March 31, 2026*  
*Last updated: March 31, 2026*  
*Status: Ready for implementation*
