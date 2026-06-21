from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.review import LessonLearned
from app.schemas import LessonLearnedCreate, LessonLearnedResponse, SearchQuery
from app.services.embeddings import embed_text
from app.services.review_service import search_lessons

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonLearnedResponse])
async def list_lessons(db: AsyncSession = Depends(get_db)) -> list[LessonLearned]:
    result = await db.execute(select(LessonLearned).order_by(LessonLearned.created_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=LessonLearnedResponse)
async def create_lesson(payload: LessonLearnedCreate, db: AsyncSession = Depends(get_db)) -> LessonLearned:
    lesson = LessonLearned(
        title=payload.title,
        category=payload.category,
        content=payload.content,
        source_design=payload.source_design,
        tags=payload.tags,
        embedding=embed_text(f"{payload.title} {payload.content} {' '.join(payload.tags)}"),
    )
    db.add(lesson)
    await db.commit()
    await db.refresh(lesson)
    return lesson


@router.post("/search", response_model=list[LessonLearnedResponse])
async def search_lessons_endpoint(
    payload: SearchQuery,
    db: AsyncSession = Depends(get_db),
) -> list[LessonLearnedResponse]:
    matches = await search_lessons(db, payload.query, payload.limit)
    return [
        LessonLearnedResponse(
            id=lesson.id,
            title=lesson.title,
            category=lesson.category,
            content=lesson.content,
            source_design=lesson.source_design,
            tags=lesson.tags,
            created_at=lesson.created_at,
            similarity=round(score, 4),
        )
        for lesson, score in matches
    ]
