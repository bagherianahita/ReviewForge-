# ReviewForge

**AI-assisted virtual design review for mechanical engineering teams**

ReviewForge is a full-stack portfolio application that demonstrates how engineering organizations can run virtual design reviews, automate first-pass geometry checks, and search institutional knowledge — patterns common in modern engineering collaboration platforms.

[![CI](https://github.com/bagherianahita/ReviewForge-/actions/workflows/ci.yml/badge.svg)](https://github.com/bagherianahita/ReviewForge-/actions/workflows/ci.yml)
![Python](https://img.shields.io/badge/Python-3.12-FastAPI-009688?style=flat-square)
![Frontend](https://img.shields.io/badge/React-18-TypeScript-61DAFB?style=flat-square)
![Database](https://img.shields.io/badge/Postgres-pgvector-336791?style=flat-square)
![3D](https://img.shields.io/badge/3D-Trimesh%20%2B%20Three.js-orange?style=flat-square)

---

## Try the demo (≈2 minutes)

> **Best place for the demo instructions: this README.**  
> Recruiters and hiring managers typically land here first on GitHub. Everything needed to run and evaluate the project is self-contained below — no separate docs required.

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose v2)
- 4 GB free RAM recommended
- *(Optional)* OpenAI API key for LLM peer-review summaries

### Run

```bash
git clone https://github.com/bagherianahita/ReviewForge-.git
cd ReviewForge-
docker compose up --build
```

**Windows (PowerShell):**

```powershell
git clone https://github.com/bagherianahita/ReviewForge-.git
cd ReviewForge-
.\scripts\demo.ps1
```

Wait until all three services are healthy (~30–60 seconds on first build). Then open:

| Service | URL |
|---------|-----|
| **Application** | http://localhost:5173 |
| **API docs (Swagger)** | http://localhost:8001/docs |
| **Health check** | http://localhost:8001/health |

Demo data is **seeded automatically** on first startup — no manual setup step.

### Optional: enable LLM insights

```bash
cp .env.example .env
# Add your key to .env, then:
docker compose up --build
```

Without an API key, AutoReview still runs using deterministic geometry rules and a built-in fallback summary.

### Stop / reset

```bash
docker compose down          # stop containers
docker compose down -v       # stop + wipe database (re-seeds on next start)
```

---

## Guided walkthrough for reviewers

Use this 5-minute path to evaluate the full stack:

1. **Dashboard** (`/`) — Three pre-seeded designs are listed. Create a new design to test the REST API round-trip.
2. **Engine Mount Bracket** (`/designs/1`) — Open the seeded design. AutoReview findings are already populated (thin-wall geometry rule triggered on sample mesh).
3. **Run AutoReview** — Click the button to re-run the geometry pipeline. Inspect rule IDs (`GEO-001`…`GEO-004`, `STD-101`…) in the sidebar.
4. **3D viewer** — Issue markers render on the Three.js canvas. Click the canvas to add a human annotation (persisted via `/api/reviews/{id}/annotations`).
5. **Review thread** — Post an SME comment; it is stored in PostgreSQL and returned on refresh.
6. **Similar designs** — Vector similarity ranks other seeded designs by embedding cosine distance.
7. **Lessons Learned** (`/lessons`) — Search `welding bracket clearance` to see semantic retrieval over institutional knowledge.

---

## What this project demonstrates

| Capability | Implementation |
|------------|----------------|
| Scalable REST APIs | FastAPI, async SQLAlchemy 2, Pydantic v2 |
| Typed full-stack contract | Shared request/response shapes (Python schemas ↔ TypeScript interfaces) |
| 3D geometry analysis | Trimesh pipeline: watertightness, thin features, degenerate faces |
| Hybrid AI review | Deterministic rule engine + optional OpenAI LLM layer with graceful fallback |
| Vector / semantic search | pgvector storage + cosine similarity for designs and lessons |
| Interactive 3D UI | React Three Fiber viewer with severity-coded markers |
| Production patterns | Docker Compose, health checks, CI, idempotent seeding, Nginx reverse proxy |

---

## Architecture

```
┌──────────────────────┐     REST / JSON      ┌─────────────────────────────────┐
│  React + TypeScript  │ ◄──────────────────► │  FastAPI Backend                │
│  Vite · Three.js     │   /api → Nginx proxy │  ├── api/        (route layer)  │
│  localhost:5173      │                      │  ├── services/   (domain logic) │
└──────────────────────┘                      │  │   ├── geometry.py  (trimesh) │
                                              │  │   ├── ai_review.py (OpenAI)│
                                              │  │   └── embeddings.py       │
                                              │  └── models/     (SQLAlchemy)  │
                                              └──────────────┬──────────────────┘
                                                             │
                                              ┌──────────────▼──────────────────┐
                                              │  PostgreSQL 16 + pgvector       │
                                              │  designs · reviews · issues     │
                                              │  annotations · lessons_learned  │
                                              └─────────────────────────────────┘
```

### Request flow (AutoReview example)

```
DesignReviewPage  →  api/client.ts  →  POST /api/designs/{id}/autoreview
                                              ↓
                                    review_service.run_autoreview()
                                              ↓
                         geometry.load_and_analyze()  +  ai_review (optional)
                                              ↓
                              Persist Issue rows + update design embedding
                                              ↓
                         AutoReviewResponse JSON  →  React state  →  ModelViewer markers
```

---

## Project structure

```
ReviewForge-/
├── backend/
│   ├── app/
│   │   ├── api/           # FastAPI routers (designs, reviews, lessons)
│   │   ├── models/        # SQLAlchemy ORM models
│   │   ├── services/      # Geometry, AI, embeddings, orchestration
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   └── schemas.py     # Pydantic DTOs
│   ├── scripts/
│   │   ├── seed.py        # Idempotent demo data + sample mesh
│   │   └── wait_for_db.py
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/client.ts  # Typed HTTP client
│   │   ├── pages/         # Dashboard, DesignReview, Lessons
│   │   └── components/    # ModelViewer (R3F), Layout
│   ├── Dockerfile
│   └── nginx.conf         # Proxies /api → backend
├── .github/workflows/ci.yml
├── docker-compose.yml
└── scripts/demo.ps1       # One-command demo helpers
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
# Start Postgres with pgvector (or: docker compose up db)
uvicorn app.main:app --reload
python scripts/seed.py
```

**Frontend**

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Vite dev server proxies `/api` to `localhost:8000` (see `vite.config.ts`).

---

## Testing

```bash
# Backend (requires Postgres)
cd backend && pytest

# Frontend type-check + production build
cd frontend && npm run build
```

CI runs both on every push to `main` / `master`.

---

## Design decisions

- **Hybrid AI** — Hard geometry failures are caught by deterministic rules; the LLM adds contextual narrative only when configured. The demo never depends on paid API access.
- **Pluggable rule IDs** — Issues use stable identifiers (`GEO-001`, `STD-101`) so org-specific standards can be added without schema changes.
- **Idempotent seeding** — `scripts/seed.py` runs on container start; safe to re-run, skips if data exists.
- **Embeddings** — Demo uses lightweight hash-based vectors (no external API). Schema is pgvector-ready for production embedding models.
- **Security** — `.env`, uploads, IDE tooling, and local scratch files are gitignored. Never commit API keys or user-uploaded meshes.

---

## Tech stack

| Layer | Technologies |
|-------|-------------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2, asyncpg, Pydantic Settings |
| Geometry | Trimesh, NumPy |
| AI | OpenAI SDK (optional), rule-engine fallback |
| Database | PostgreSQL 16, pgvector |
| Frontend | React 18, TypeScript, Vite 6, React Router, React Three Fiber |
| Infra | Docker Compose, Nginx, GitHub Actions |

---

## License

MIT — see [LICENSE](LICENSE).

---

**Questions?** Open an issue or reach out via the contact on my GitHub profile.
