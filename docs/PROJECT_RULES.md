# ReviewForge — Project Rules

## Architecture

- Keep **hybrid AI**: deterministic Trimesh rules always run; LLM is optional narrative only.
- Rule IDs must remain pluggable (`GEO-*`, `STD-*`).
- Use async SQLAlchemy 2 + Pydantic v2 for API contracts.
- Frontend types must mirror backend schemas.

## Roadmap priorities

1. **Configurable rule engine** — rule engine را configurable می‌کنم
2. **RBAC** — RBAC اضافه می‌کنم
3. **Enterprise embeddings** — embedding را به OpenAI یا مدل داخلی سازمان وصل می‌کنم

See [ROADMAP.md](./ROADMAP.md) for full details.

## Code quality

- New geometry rules go in `backend/app/services/geometry.py` with tests.
- Embeddings logic stays in `backend/app/services/embeddings.py`.
- No secrets in git; use `.env.example` for documentation only.
