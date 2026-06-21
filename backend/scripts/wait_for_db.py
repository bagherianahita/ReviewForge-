"""Block until PostgreSQL accepts connections."""

import asyncio
import sys

from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

from app.config import settings

MAX_ATTEMPTS = 30
DELAY_SECONDS = 2


async def wait() -> None:
    engine = create_async_engine(settings.database_url)
    for attempt in range(1, MAX_ATTEMPTS + 1):
        try:
            async with engine.connect() as conn:
                await conn.execute(text("SELECT 1"))
            print("Database is ready.")
            await engine.dispose()
            return
        except Exception as exc:
            print(f"Waiting for database ({attempt}/{MAX_ATTEMPTS}): {exc}")
            await asyncio.sleep(DELAY_SECONDS)

    await engine.dispose()
    print("Database did not become ready in time.", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    asyncio.run(wait())
