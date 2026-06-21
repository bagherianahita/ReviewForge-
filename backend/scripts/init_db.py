"""Create database schema before seeding or serving traffic."""

import asyncio

from sqlalchemy import text

from app.database import Base, engine
from app.models import Annotation, Design, Issue, LessonLearned, Review, ReviewComment  # noqa: F401


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
        await conn.run_sync(Base.metadata.create_all)
    print("Database schema ready.")


if __name__ == "__main__":
    asyncio.run(init_db())
