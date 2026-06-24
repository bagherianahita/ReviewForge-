# ReviewForge

## Run the prototype (≈2 minutes)

**Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop/) only — no API keys, no manual database setup.


Wait ~30–60 seconds on first build, then open:

| | URL |
|---|-----|
| **Web app (start here)** | http://localhost:5173 |
| **API docs** | http://localhost:8001/docs |
| **Health check** | http://localhost:8001/health |

Demo data (3 STL meshes, 4 lessons, AutoReview findings, SME comments) is **seeded automatically** on first startup.

| Sample design | STL file | What you'll see |
|---------------|----------|-----------------|
| Engine Mount Bracket | `engine_mount_bracket.stl` | Thin-wall finding + weld-access comments |
| Radiator Housing Assembly | `radiator_housing.stl` | Thermal housing review + FEA note |
| Hydraulic Pipe Manifold | `hydraulic_manifold.stl` | Routing geometry + hydraulics comments |

**Quick tour:** Dashboard → click *Engine Mount Bracket* → see AutoReview findings → click *Run AutoReview* → post a comment → open *Lessons Learned* and search `welding bracket`.

```bash
docker compose down      # stop
docker compose down -v   # stop + reset database
```

---

**AI-assisted virtual design review for mechanical engineering teams**

ReviewForge is a full-stack portfolio application that demonstrates virtual design reviews, automated geometry checks (AutoReview), and semantic search over lessons learned.

**Badges below** = build status (CI) and tech stack labels ([shields.io](https://shields.io)) — not part of the app itself.

[![CI](https://github.com/bagherianahita/ReviewForge-/actions/workflows/ci.yml/badge.svg)](https://github.com/bagherianahita/ReviewForge-/actions/workflows/ci.yml)
![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?style=flat-square&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square)
![React 18](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Postgres](https://img.shields.io/badge/Postgres-16-336791?style=flat-square&logo=postgresql&logoColor=white)
![pgvector](https://img.shields.io/badge/pgvector-enabled-4169E1?style=flat-square)
![Three.js](https://img.shields.io/badge/Three.js-STL_viewer-F59E0B?style=flat-square)

---

## Optional: enable LLM insights

```bash
cp .env.example .env
# Add OPENAI_API_KEY to .env, then:
docker compose up --build
```

Without an API key, AutoReview uses deterministic geometry rules and a built-in fallback summary.

---

## Guided walkthrough for reviewers

1. **Dashboard** (`/`) — Three pre-seeded designs. Create a new design to test the REST API.
2. **Engine Mount Bracket** (`/designs/1`) — AutoReview findings already populated (thin-wall rule on sample mesh).
3. **Run AutoReview** — Re-run the geometry pipeline. Inspect rule IDs (`GEO-001`…`GEO-004`).
4. **3D viewer** — Issue markers on the Three.js canvas. Click to add an annotation.
5. **Review thread** — Post an SME comment (persisted in PostgreSQL).
6. **Similar designs** — Vector similarity ranks other seeded designs.
7. **Lessons Learned** (`/lessons`) — Search `welding bracket clearance` for semantic retrieval.

---

## What this project demonstrates

| Capability | Implementation |
|------------|----------------|
| Scalable REST APIs | FastAPI, async SQLAlchemy 2, Pydantic v2 |
| Typed full-stack contract | Python schemas ↔ TypeScript interfaces |
| 3D geometry analysis | Trimesh: watertightness, thin features, degenerate faces |
| Hybrid AI review | Rule engine + optional OpenAI with graceful fallback |
| Vector / semantic search | pgvector + cosine similarity |
| Interactive 3D UI | React Three Fiber with severity-coded markers |
| Production patterns | Docker Compose, health checks, CI, idempotent seeding |

---

## Architecture

```
┌──────────────────────┐     REST / JSON      ┌─────────────────────────────────┐
│  React + TypeScript  │ ◄──────────────────► │  FastAPI Backend                │
│  Vite · Three.js     │   /api → Nginx proxy │  ├── api/        (route layer)  │
│  localhost:5173      │                      │  ├── services/   (domain logic) │
└──────────────────────┘                      │  │   ├── geometry.py  (trimesh) │
                                              │  │   ├── ai_review.py (OpenAI)  │
                                              │  │   └── embeddings.py          │
                                              │  └── models/     (SQLAlchemy)   │
                                              └──────────────┬──────────────────┘
                                                             │
                                              ┌──────────────▼──────────────────┐
                                              │  PostgreSQL 16 + pgvector       │
                                              └─────────────────────────────────┘
```

---

## Project structure

```
ReviewForge-/
├── backend/          # FastAPI, Trimesh geometry, OpenAI integration
├── frontend/         # React + Three.js viewer
├── docker-compose.yml
└── scripts/demo.ps1  # Windows helper (same as docker compose up --build)
```

---

## API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health |
| `GET` | `/api/designs` | List designs |
| `POST` | `/api/designs` | Create design |
| `POST` | `/api/designs/{id}/upload` | Upload STL / OBJ / PLY / GLB |
| `POST` | `/api/designs/{id}/autoreview` | Run geometry + AI review |
| `GET` | `/api/designs/{id}/mesh` | Download attached STL/OBJ mesh |
| `GET` | `/api/designs/{id}/issues` | List detected issues |
| `GET` | `/api/designs/{id}/similar` | Similar designs (vector search) |
| `POST` | `/api/reviews` | Start review session |
| `POST` | `/api/reviews/{id}/comments` | Add threaded comment |
| `POST` | `/api/reviews/{id}/annotations` | Add 3D annotation |
| `GET` | `/api/lessons` | List lessons learned |
| `POST` | `/api/lessons/search` | Semantic lesson search |

Interactive documentation: http://localhost:8001/docs

---

## Local development (without Docker)

**Backend**

```bash
cd backend
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
docker compose up db -d   # Postgres with pgvector
uvicorn app.main:app --reload
python scripts/seed.py
```

**Frontend**

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev   # http://localhost:5173 — proxies /api → localhost:8000
```

---

## Testing

```bash
cd backend && pytest
cd frontend && npm run build
```

---

## Design decisions

- **Hybrid AI** — Deterministic rules catch hard failures; LLM adds narrative when configured.
- **Pluggable rule IDs** — `GEO-001`, `STD-101`, etc. — extendable for org standards.
- **Idempotent seeding** — Runs on container start; safe to re-run.
- **Security** — `.env`, uploads, and IDE tooling are gitignored.

---

## Tech stack

| Layer | Technologies |
|-------|-------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, asyncpg, Trimesh |
| Database | PostgreSQL 16, pgvector |
| Frontend | React 18, TypeScript, Vite, React Three Fiber |
| Infra | Docker Compose, Nginx, GitHub Actions |

---

## Roadmap

اگر بخواهم ادامه بدهم، **rule engine را configurable می‌کنم**، **RBAC اضافه می‌کنم**، و **embedding را به OpenAI یا مدل داخلی سازمان وصل می‌کنم**.

| Priority | Enhancement |
|----------|-------------|
| Configurable rule engine | Tunable AutoReview rules (`GEO-*`, `STD-*`) via config/admin |
| RBAC | Reviewer · SME · Admin roles |
| Enterprise embeddings | OpenAI or on-prem model for lessons/similar-design search |

Details: [docs/ROADMAP.md](docs/ROADMAP.md)

---

## License

MIT — see [LICENSE](LICENSE).
