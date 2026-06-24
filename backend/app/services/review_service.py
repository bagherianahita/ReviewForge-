from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.review import Design, Issue, IssueSeverity, LessonLearned
from app.schemas import AutoReviewRequest
from app.services.ai_review import generate_llm_insights
from app.services.embeddings import cosine_similarity, embed_text, to_embedding_list
from app.services.geometry import GeometryFinding, analyze_without_file, load_and_analyze


def _to_issue_severity(severity: str) -> IssueSeverity:
    return IssueSeverity(severity)


async def run_autoreview(
    db: AsyncSession,
    design: Design,
    request: AutoReviewRequest,
) -> tuple[dict, list[Issue], str | None]:
    if design.file_path and Path(design.file_path).exists():
        summary, findings = load_and_analyze(Path(design.file_path))
    else:
        summary, findings = analyze_without_file(design.name, design.description)

    await db.execute(
        Issue.__table__.delete().where(Issue.design_id == design.id, Issue.auto_detected.is_(True))
    )

    issues: list[Issue] = []
    for finding in findings:
        issue = Issue(
            design_id=design.id,
            rule_id=finding.rule_id,
            title=finding.title,
            description=finding.description,
            severity=_to_issue_severity(finding.severity),
            position=finding.position,
            auto_detected=True,
        )
        db.add(issue)
        issues.append(issue)

    design.embedding = embed_text(f"{design.name} {design.description or ''} {summary}")
    design.metadata_json = {**(design.metadata_json or {}), "geometry_summary": summary}

    llm_insights = None
    if request.include_llm:
        llm_insights = await generate_llm_insights(
            design.name, design.description, summary, findings
        )

    await db.commit()
    for issue in issues:
        await db.refresh(issue)

    return summary, issues, llm_insights


async def find_similar_designs(db: AsyncSession, design: Design, limit: int = 5) -> list[tuple[Design, float]]:
    if design.embedding is None:
        design.embedding = embed_text(f"{design.name} {design.description or ''}")
        await db.commit()

    design_vector = to_embedding_list(design.embedding)
    result = await db.execute(select(Design).where(Design.id != design.id))
    candidates = result.scalars().all()
    scored = []
    for candidate in candidates:
        if candidate.embedding is None:
            candidate.embedding = embed_text(f"{candidate.name} {candidate.description or ''}")
        scored.append((candidate, cosine_similarity(design_vector, to_embedding_list(candidate.embedding))))

    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[:limit]


async def search_lessons(db: AsyncSession, query: str, limit: int = 5) -> list[tuple[LessonLearned, float]]:
    query_embedding = embed_text(query)
    result = await db.execute(select(LessonLearned))
    lessons = result.scalars().all()
    scored = []
    for lesson in lessons:
        if lesson.embedding is None:
            lesson.embedding = embed_text(f"{lesson.title} {lesson.content} {' '.join(lesson.tags or [])}")
        scored.append((lesson, cosine_similarity(query_embedding, to_embedding_list(lesson.embedding))))

    scored.sort(key=lambda item: item[1], reverse=True)
    return scored[:limit]
