#!/bin/sh
set -e

echo "ReviewForge backend starting..."
python scripts/wait_for_db.py
python scripts/init_db.py
python scripts/seed.py
exec uvicorn app.main:app --host 0.0.0.0 --port 8000
