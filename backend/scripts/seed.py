"""Seed demo data for portfolio demos — idempotent, safe to run on every startup."""

import asyncio
from pathlib import Path

import trimesh
from sqlalchemy import select

from app.config import settings
from app.database import SessionLocal
from app.models.review import Design, Issue, LessonLearned, Review, ReviewStatus
from app.schemas import AutoReviewRequest
from app.services.embeddings import embed_text
from app.services.review_service import run_autoreview

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
        "mesh_extents": [120.0, 80.0, 1.5],
    },
    {
        "name": "Radiator Housing Assembly",
        "description": "Thin-wall housing for thermal management subsystem",
        "mesh_extents": None,
    },
    {
        "name": "Hydraulic Pipe Manifold",
        "description": "Pipe routing manifold with tight bend radii",
        "mesh_extents": None,
    },
]


def _write_sample_mesh(design_id: int, extents: list[float]) -> tuple[str, str]:
    upload_dir = Path(settings.upload_dir)
    upload_dir.mkdir(parents=True, exist_ok=True)
    dest = upload_dir / f"design_{design_id}.stl"
    mesh = trimesh.creation.box(extents=extents)
    mesh.export(dest)
    return str(dest), "stl"


async def seed() -> None:
    async with SessionLocal() as db:
        existing = await db.execute(select(LessonLearned))
        if existing.scalars().first():
            print("Database already seeded — skipping.")
            return

        for lesson_data in LESSONS:
            lesson = LessonLearned(
                **lesson_data,
                embedding=embed_text(
                    f"{lesson_data['title']} {lesson_data['content']} {' '.join(lesson_data['tags'])}"
                ),
            )
            db.add(lesson)

        seeded_designs: list[Design] = []
        for design_data in DESIGNS:
            data = dict(design_data)
            mesh_extents = data.pop("mesh_extents", None)
            design = Design(
                **data,
                embedding=embed_text(f"{data['name']} {data['description']}"),
            )
            db.add(design)
            await db.flush()

            if mesh_extents:
                file_path, file_type = _write_sample_mesh(design.id, mesh_extents)
                design.file_path = file_path
                design.file_type = file_type

            review = Review(
                design_id=design.id,
                title=f"Virtual Review — {design.name}",
                status=ReviewStatus.IN_PROGRESS,
                reviewer_name="Demo SME",
            )
            db.add(review)
            seeded_designs.append(design)

        await db.commit()

        bracket = seeded_designs[0]
        await run_autoreview(db, bracket, AutoReviewRequest(include_llm=False))

        issue_count = await db.execute(select(Issue).where(Issue.design_id == bracket.id))
        issues = len(list(issue_count.scalars().all()))
        print(f"Seeded {len(LESSONS)} lessons, {len(DESIGNS)} designs, and {issues} AutoReview findings on '{bracket.name}'.")


if __name__ == "__main__":
    asyncio.run(seed())
