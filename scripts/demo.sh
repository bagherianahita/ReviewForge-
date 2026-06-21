#!/usr/bin/env bash
# One-command local demo for reviewers (macOS / Linux / WSL)
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo ""
echo "  ReviewForge — starting demo stack"
echo "  Requires: Docker Desktop (or Docker Engine + Compose v2)"
echo ""

if [ -f .env ]; then
  docker compose --env-file .env up --build
else
  docker compose up --build
fi
