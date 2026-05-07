import os
import sqlite3
from pathlib import Path
from typing import Generator, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

try:
    from .tag_service import ALLOWED_SOURCES, CourseGenerationService
    from .topic_service import TopicService
except ImportError:
    from tag_service import ALLOWED_SOURCES, CourseGenerationService
    from topic_service import TopicService

ROOT = Path(__file__).resolve().parents[1]
YC2_DB_PATH = Path(os.environ.get("YC2_DATABASE_PATH", ROOT / "output" / "database" / "topic-courses-yc2.db"))

router = APIRouter(prefix="/api", tags=["yc2"])


class TopicTreeNode(BaseModel):
    id: int
    slug: str
    name: str
    description: Optional[str] = None
    category: str
    parent_id: Optional[int] = None
    level: int
    sort_order: int
    is_active: int
    course_count: int = 0
    item_count: int = 0
    children: list["TopicTreeNode"] = Field(default_factory=list)


TopicTreeNode.model_rebuild()


class GenerateCourseRequest(BaseModel):
    title: str
    topic_id: int
    course_mode: str = Field(default="topic-mixed")
    difficulty_level: int = Field(ge=1, le=10)
    tag_slugs: list[str]
    min_confidence: float = Field(default=0.7, ge=0.0, le=1.0)
    max_items: int = Field(default=30, ge=1, le=200)
    items_per_module: int = Field(default=5, ge=1, le=50)
    content_sources: Optional[list[str]] = None
    source_quota_mode: str = Field(default="hard")
    source_quota: Optional[dict[str, int]] = None
    abeka_max_ratio: float = Field(default=0.35, ge=0.15, le=0.8)


def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(YC2_DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()


@router.get("/topics/tree", response_model=list[TopicTreeNode])
def get_topics_tree(db: sqlite3.Connection = Depends(get_db)):
    return TopicService(db).get_topic_tree()


@router.get("/topics/{slug}")
def get_topic(slug: str, db: sqlite3.Connection = Depends(get_db)):
    topic = TopicService(db).get_topic_by_slug(slug)
    if not topic:
        raise HTTPException(status_code=404, detail=f"Topic '{slug}' not found")
    return topic


@router.get("/topics/{slug}/courses")
def get_topic_courses(
    slug: str,
    difficulty_min: Optional[int] = Query(default=None, ge=1, le=10),
    difficulty_max: Optional[int] = Query(default=None, ge=1, le=10),
    age: Optional[int] = Query(default=None, ge=3, le=18),
    source: Optional[str] = Query(default=None),
    mode: Optional[str] = Query(default="topic-mixed"),
    db: sqlite3.Connection = Depends(get_db),
):
    if mode and mode not in {"topic-mixed", "source-native"}:
        raise HTTPException(status_code=400, detail="mode must be 'topic-mixed' or 'source-native'")
    courses = TopicService(db).get_topic_courses(
        topic_slug=slug,
        difficulty_min=difficulty_min,
        difficulty_max=difficulty_max,
        age=age,
        source=source,
        mode=mode,
    )
    if courses is None:
        raise HTTPException(status_code=404, detail=f"Topic '{slug}' not found")
    return {"items": courses, "total": len(courses)}


@router.get("/topics")
def list_topics(
    parent_id: Optional[int] = Query(default=None),
    level: Optional[int] = Query(default=None, ge=0, le=1),
    category: Optional[str] = Query(default=None),
    db: sqlite3.Connection = Depends(get_db),
):
    items = TopicService(db).list_topics(parent_id=parent_id, level=level, category=category)
    return {"items": items, "total": len(items)}


@router.get("/courses")
def list_courses(
    difficulty_min: Optional[int] = Query(default=None, ge=1, le=10),
    difficulty_max: Optional[int] = Query(default=None, ge=1, le=10),
    age: Optional[int] = Query(default=None, ge=3, le=18),
    source: Optional[str] = Query(default=None),
    mode: Optional[str] = Query(default=None),
    db: sqlite3.Connection = Depends(get_db),
):
    if source and source not in ALLOWED_SOURCES:
        raise HTTPException(status_code=400, detail=f"source must be one of {ALLOWED_SOURCES}")
    if mode and mode not in {"topic-mixed", "source-native"}:
        raise HTTPException(status_code=400, detail="mode must be 'topic-mixed' or 'source-native'")
    items = CourseGenerationService(db).list_courses(
        difficulty_min=difficulty_min,
        difficulty_max=difficulty_max,
        age=age,
        source=source,
        mode=mode,
    )
    return {"items": items, "total": len(items)}


@router.get("/courses/{course_id}")
def get_course(course_id: int, db: sqlite3.Connection = Depends(get_db)):
    course = CourseGenerationService(db).get_course_detail(course_id)
    if not course:
        raise HTTPException(status_code=404, detail=f"Course id={course_id} not found")
    return course


@router.post("/courses/generate")
def generate_course(payload: GenerateCourseRequest, db: sqlite3.Connection = Depends(get_db)):
    if payload.course_mode not in {"topic-mixed", "source-native"}:
        raise HTTPException(status_code=400, detail="course_mode must be 'topic-mixed' or 'source-native'")
    if payload.source_quota_mode not in {"hard", "adaptive"}:
        raise HTTPException(status_code=400, detail="source_quota_mode must be 'hard' or 'adaptive'")
    if payload.content_sources:
        invalid = sorted(set(payload.content_sources) - set(ALLOWED_SOURCES))
        if invalid:
            raise HTTPException(status_code=400, detail=f"Invalid content_sources: {invalid}")
    if payload.source_quota:
        invalid_quota_keys = sorted(set(payload.source_quota.keys()) - set(ALLOWED_SOURCES))
        if invalid_quota_keys:
            raise HTTPException(status_code=400, detail=f"Invalid source_quota keys: {invalid_quota_keys}")
        if any(value < 0 for value in payload.source_quota.values()):
            raise HTTPException(status_code=400, detail="source_quota values must be >= 0")
    result = CourseGenerationService(db).generate_course(
        title=payload.title,
        topic_id=payload.topic_id,
        course_mode=payload.course_mode,
        difficulty_level=payload.difficulty_level,
        tag_slugs=payload.tag_slugs,
        min_confidence=payload.min_confidence,
        max_items=payload.max_items,
        items_per_module=payload.items_per_module,
        content_sources=payload.content_sources,
        source_quota_mode=payload.source_quota_mode,
        source_quota=payload.source_quota,
        abeka_max_ratio=payload.abeka_max_ratio,
    )
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])
    return result
