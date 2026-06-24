"""Command center aggregate metrics for the ReviewForge MES dashboard."""

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.review import (
    Annotation,
    Design,
    Issue,
    IssueSeverity,
    LessonLearned,
    Review,
    ReviewComment,
)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary")
async def dashboard_summary(db: AsyncSession = Depends(get_db)) -> dict:
    designs = list((await db.execute(select(Design))).scalars().all())
    issues = list((await db.execute(select(Issue))).scalars().all())
    reviews = list((await db.execute(select(Review))).scalars().all())
    lessons = list((await db.execute(select(LessonLearned))).scalars().all())
    comments_count = (
        await db.execute(select(func.count()).select_from(ReviewComment))
    ).scalar_one()
    annotations_count = (
        await db.execute(select(func.count()).select_from(Annotation))
    ).scalar_one()

    severity_counts = {s.value: 0 for s in IssueSeverity}
    rule_counts: dict[str, int] = {}
    for issue in issues:
        severity_counts[issue.severity.value] += 1
        rule_counts[issue.rule_id] = rule_counts.get(issue.rule_id, 0) + 1

    review_status = {"draft": 0, "in_progress": 0, "completed": 0}
    for r in reviews:
        review_status[r.status.value] += 1

    designs_with_mesh = sum(1 for d in designs if d.file_path)
    autoreview_complete = sum(
        1
        for d in designs
        if (d.metadata_json or {}).get("autoreview_status") == "complete"
    )

    lesson_categories: dict[str, int] = {}
    for lesson in lessons:
        lesson_categories[lesson.category] = lesson_categories.get(lesson.category, 0) + 1

    design_cards = []
    for d in designs:
        meta = d.metadata_json or {}
        design_issues = [i for i in issues if i.design_id == d.id]
        design_cards.append(
            {
                "id": d.id,
                "name": d.name,
                "description": d.description,
                "file_type": d.file_type,
                "issue_count": len(design_issues),
                "autoreview_status": meta.get("autoreview_status", "pending"),
                "critical_count": sum(1 for i in design_issues if i.severity == IssueSeverity.CRITICAL),
                "warning_count": sum(1 for i in design_issues if i.severity == IssueSeverity.WARNING),
            }
        )

    return {
        "kpis": {
            "total_designs": len(designs),
            "designs_with_mesh": designs_with_mesh,
            "total_issues": len(issues),
            "autoreview_complete": autoreview_complete,
            "active_reviews": review_status["in_progress"] + review_status["draft"],
            "total_lessons": len(lessons),
            "sme_comments": comments_count,
            "annotations": annotations_count,
        },
        "severity_distribution": [
            {"name": "Critical", "value": severity_counts["critical"], "key": "critical"},
            {"name": "Warning", "value": severity_counts["warning"], "key": "warning"},
            {"name": "Info", "value": severity_counts["info"], "key": "info"},
        ],
        "rule_distribution": [
            {"rule_id": k, "count": v} for k, v in sorted(rule_counts.items())
        ],
        "review_status": [
            {"status": k.replace("_", " ").title(), "count": v} for k, v in review_status.items()
        ],
        "lesson_categories": [
            {"category": k, "count": v} for k, v in sorted(lesson_categories.items())
        ],
        "designs": design_cards,
        "pipeline_health": (
            "nominal"
            if severity_counts["critical"] == 0
            else "alert"
            if severity_counts["critical"] > 2
            else "degraded"
        ),
    }
