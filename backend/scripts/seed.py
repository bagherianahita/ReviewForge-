"""Seed demo data for portfolio demos — idempotent, safe to run on every startup."""

import asyncio
import shutil
from pathlib import Path

from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models.review import (
    Annotation,
    Design,
    Issue,
    LessonLearned,
    Review,
    ReviewComment,
    ReviewStatus,
)
from app.schemas import AutoReviewRequest
from app.services.embeddings import embed_text
from app.services.review_service import run_autoreview

DEMO_ASSETS = Path(__file__).resolve().parent.parent / "demo_assets"

LESSONS = [
    {
        "title": "Bracket weld access clearance",
        "category": "Manufacturing",
        "content": "Ensure minimum 150mm clearance for MIG welding torch access on structural brackets. "
        "Past program ECR-092 delayed 3 weeks due to inaccessible weld joints.",
        "source_design": "ECR-092 Mounting Bracket",
        "tags": ["welding", "bracket", "DFM"],
    },
    {
        "title": "Thin wall deflection on radiator housing",
        "category": "Structural",
        "content": "Radiator housings with wall thickness below 2mm require FEA validation under thermal cycling. "
        "Komatsu supplier review flagged resonance at 847 Hz.",
        "source_design": "Radiator Housing v3",
        "tags": ["thermal", "FEA", "housing"],
    },
    {
        "title": "Standard fastener stack-up",
        "category": "Standards",
        "content": "Use only approved fastener families from internal catalog STD-FAST-001. "
        "Non-standard fasteners require procurement lead time of 12+ weeks.",
        "source_design": "Internal Standard",
        "tags": ["fasteners", "standards", "procurement"],
    },
    {
        "title": "Pipe routing bend radius",
        "category": "Hydraulics",
        "content": "Hydraulic lines require minimum bend radius of 3x tube OD to prevent flow restriction "
        "and fatigue failure. Flag any routing below threshold during design review.",
        "source_design": "Engine Assembly Review",
        "tags": ["hydraulics", "routing", "piping"],
    },
]

DESIGNS = [
    {
        "name": "Engine Mount Bracket",
        "description": "Structural bracket for engine assembly with welding features",
        "asset_file": "engine_mount_bracket.stl",
        "reviewer": "Sarah Chen, Manufacturing SME",
        "comments": [
            (
                "Sarah Chen",
                "Weld access on the port side looks tight — verify 150mm torch clearance before release.",
            ),
            (
                "James Okonkwo",
                "Agree. Also confirm bracket material spec matches ECR-092 lessons learned.",
            ),
        ],
    },
    {
        "name": "Radiator Housing Assembly",
        "description": "Thin-wall housing for thermal management subsystem",
        "asset_file": "radiator_housing.stl",
        "reviewer": "Priya Nair, Thermal SME",
        "comments": [
            (
                "Priya Nair",
                "Wall thickness is below 2mm in several zones — schedule FEA before tooling release.",
            ),
        ],
    },
    {
        "name": "Hydraulic Pipe Manifold",
        "description": "Pipe routing manifold with tight bend radii",
        "asset_file": "hydraulic_manifold.stl",
        "reviewer": "Marcus Webb, Hydraulics SME",
        "comments": [
            (
                "Marcus Webb",
                "Branch junction radius may be below 3× OD — confirm against hydraulic routing standard.",
            ),
            (
                "Demo SME",
                "Similar manifold on Program Delta failed fatigue at 12k cycles — worth a second look.",
            ),
        ],
    },
]


def _install_mesh(design_id: int, asset_name: str) -> tuple[str, str]:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    source = DEMO_ASSETS / asset_name
    if not source.exists():
        raise FileNotFoundError(f"Demo asset missing: {source}")

    suffix = source.suffix.lower()
    dest = upload_dir / f"design_{design_id}{suffix}"
    shutil.copy2(source, dest)
    return str(dest), suffix.lstrip(".")


async def _seed_annotations(db, review: Review, issues: list[Issue]) -> int:
    count = 0
    for issue in issues:
        if not issue.position:
            continue
        db.add(
            Annotation(
                review_id=review.id,
                label=issue.title,
                position_x=issue.position["x"],
                position_y=issue.position["y"],
                position_z=issue.position["z"],
                note=issue.description,
                severity=issue.severity,
                source="autoreview",
            )
        )
        count += 1
    return count


async def seed() -> None:
    async with SessionLocal() as db:
        existing = await db.execute(select(LessonLearned))
        if existing.scalars().first():
            print("Database already seeded — skipping.")
            return

        for lesson_data in LESSONS:
            db.add(
                LessonLearned(
                    **lesson_data,
                    embedding=embed_text(
                        f"{lesson_data['title']} {lesson_data['content']} {' '.join(lesson_data['tags'])}"
                    ),
                )
            )

        total_issues = 0
        total_comments = 0
        total_annotations = 0

        for design_data in DESIGNS:
            data = dict(design_data)
            asset_file = data.pop("asset_file")
            reviewer = data.pop("reviewer")
            comments = data.pop("comments")

            design = Design(
                **data,
                embedding=embed_text(f"{data['name']} {data['description']}"),
            )
            db.add(design)
            await db.flush()

            file_path, file_type = _install_mesh(design.id, asset_file)
            design.file_path = file_path
            design.file_type = file_type

            review = Review(
                design_id=design.id,
                title=f"Virtual Review — {design.name}",
                status=ReviewStatus.IN_PROGRESS,
                reviewer_name=reviewer,
                summary=f"Demo review session for {design.name}. AutoReview findings attached.",
            )
            db.add(review)
            await db.flush()

            for author, body in comments:
                db.add(ReviewComment(review_id=review.id, author_name=author, body=body))
                total_comments += 1

            await db.commit()
            await db.refresh(design)
            await db.refresh(review)

            _, issues, _ = await run_autoreview(db, design, AutoReviewRequest(include_llm=False))
            total_issues += len(issues)
            total_annotations += await _seed_annotations(db, review, issues)

            design.metadata_json = {
                **(design.metadata_json or {}),
                "demo": True,
                "issue_count": len(issues),
                "autoreview_status": "complete",
            }
            await db.commit()

        print(
            f"Seeded {len(LESSONS)} lessons, {len(DESIGNS)} designs with STL meshes, "
            f"{total_issues} AutoReview findings, {total_comments} comments, "
            f"and {total_annotations} 3D annotations."
        )


if __name__ == "__main__":
    asyncio.run(seed())
