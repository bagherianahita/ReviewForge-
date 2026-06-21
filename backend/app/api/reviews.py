from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.review import Annotation, Review, ReviewComment
from app.schemas import (
    AnnotationCreate,
    AnnotationResponse,
    CommentCreate,
    CommentResponse,
    ReviewCreate,
    ReviewResponse,
    ReviewUpdate,
)

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.get("", response_model=list[ReviewResponse])
async def list_reviews(db: AsyncSession = Depends(get_db)) -> list[Review]:
    result = await db.execute(select(Review).order_by(Review.updated_at.desc()))
    return list(result.scalars().all())


@router.post("", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_review(payload: ReviewCreate, db: AsyncSession = Depends(get_db)) -> Review:
    review = Review(
        design_id=payload.design_id,
        title=payload.title,
        reviewer_name=payload.reviewer_name,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


@router.get("/{review_id}", response_model=ReviewResponse)
async def get_review(review_id: int, db: AsyncSession = Depends(get_db)) -> Review:
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    return review


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: int,
    payload: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
) -> Review:
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if payload.status is not None:
        review.status = payload.status
    if payload.summary is not None:
        review.summary = payload.summary

    await db.commit()
    await db.refresh(review)
    return review


@router.get("/{review_id}/comments", response_model=list[CommentResponse])
async def list_comments(review_id: int, db: AsyncSession = Depends(get_db)) -> list[ReviewComment]:
    result = await db.execute(
        select(ReviewComment).where(ReviewComment.review_id == review_id).order_by(ReviewComment.created_at)
    )
    return list(result.scalars().all())


@router.post("/{review_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def add_comment(
    review_id: int,
    payload: CommentCreate,
    db: AsyncSession = Depends(get_db),
) -> ReviewComment:
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    comment = ReviewComment(review_id=review_id, author_name=payload.author_name, body=payload.body)
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.get("/{review_id}/annotations", response_model=list[AnnotationResponse])
async def list_annotations(review_id: int, db: AsyncSession = Depends(get_db)) -> list[Annotation]:
    result = await db.execute(select(Annotation).where(Annotation.review_id == review_id))
    return list(result.scalars().all())


@router.post("/{review_id}/annotations", response_model=AnnotationResponse, status_code=status.HTTP_201_CREATED)
async def add_annotation(
    review_id: int,
    payload: AnnotationCreate,
    db: AsyncSession = Depends(get_db),
) -> Annotation:
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    annotation = Annotation(
        review_id=review_id,
        label=payload.label,
        position_x=payload.position_x,
        position_y=payload.position_y,
        position_z=payload.position_z,
        note=payload.note,
        severity=payload.severity,
        source=payload.source,
    )
    db.add(annotation)
    await db.commit()
    await db.refresh(annotation)
    return annotation
