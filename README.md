 HEAD
# Proposal-Presentation-Prototype

# Child Nutrition Intelligence Platform

**AI-Assisted Malnutrition Risk & Progress Monitoring**

Undergraduate research prototype (Component 1 · J26-IT-399).  
**AI-assisted decision support. Clinical review required.**  
When the demo adapter is active the UI shows **DEMO MODEL — NOT FOR CLINICAL USE**.

Product name lives in `packages/contracts/product.json`.

---

## Architecture

| Service | Role |
|---|---|
| `client` | Next.js clinical / research UI (React) |
| `services/api` | FastAPI domain API, auth, RBAC, audit |
| `services/inference` | Model adapters (demo / sklearn / pytorch / onnx) |
| `workers/alerts` | Celery beat + worker for missed follow-ups |
| `ml/` | Training, evaluation, calibration, trajectory projection |
| PostgreSQL + Redis | Persistence and queue |

See `docs/ARCHITECTURE.md` for data flow.
See `docs/COMPONENT1_CONTEXT.md` for authoritative Component 1 research, clinical UX, and component-boundary specification (J26-IT-399).

---

## Prerequisites

- Docker and Docker Compose (recommended), or
- Node.js 22, Python 3.12, PostgreSQL 16, Redis 7

---

## Quick start (Docker)

```bash
cp .env.example .env
docker compose up --build
```

- Web: http://localhost:3000
- API + OpenAPI: http://localhost:8000/docs
- Inference: http://localhost:8001/health

First boot runs `alembic upgrade head` and seeds demonstration data.

### Viva / frontend prototype

For panel demonstrations of the **React UI** only:

```powershell
npm run dev:ui
```

This starts the Next.js client at http://localhost:3000. For live data, run the API in a second terminal: `npm run dev:backend`.

### Local web dev (without rebuilding Docker web)

Fastest option on Windows — backend in Docker, **React/Next.js** frontend with hot reload:

```powershell
.\scripts\dev-local.ps1
```

Or from the **repository root**:

```bash
npm run dev:fast
```

This starts `postgres`, `redis`, `api`, and `inference` in Docker, then runs the React UI via `next dev` (no 1 GB Docker web rebuild).

For frontend only (API already running):

```bash
npm run dev
```

Or from `client` directly. The React/Next.js app lives in `client/` — root `package.json` scripts delegate there.

API and database should still be running via Docker:

```bash
docker compose up -d postgres redis api inference
```

### Docker build performance

Docker builds exclude local `node_modules` and `.next` folders. The web image uses a scoped `client/` build context.

### Troubleshooting (Windows)

**`container name already in use` (cnip-redis, etc.)**  
Old containers from a previous folder (e.g. Downloads) conflict with this project. Fix:

```powershell
npm run dev:cleanup
npm run dev:backend
```

**`EADDRINUSE` on port 3000**  
A previous Next.js dev server is still running. Fix:

```powershell
npm run dev:cleanup
npm run dev:fast
```

Or if the backend is already healthy (`http://localhost:8000/health` returns ok), just run:

```powershell
npm run dev
```

---

## Demo accounts (development only)

Password for all seed users: `Doc123`

| Role | Email | Facility |
|---|---|---|
| Doctor (Colombo) | doctor@gmail.com | MOH Colombo Demo |
| Doctor (Kandy) | doctor.kandy@demo.local | MOH Kandy Demo |

Only doctor accounts can sign in. Non-doctor seed roles are not created in new installs.

Never use these passwords in production.

The seed includes **25 synthetic demonstration children** across Colombo, Kandy, and Galle facilities.

Canonical demonstration child: **C-1042** (risk 82% → 61% → 59%, stagnating).

---

## Environment

Copy `.env.example`. Important keys:

- `DATABASE_URL`, `REDIS_URL`
- `JWT_SECRET`, `JWT_REFRESH_SECRET`
- `MODEL_MODE=demo` (or `pytorch` / `sklearn` / `onnx`)
- `MODEL_ARTIFACT_PATH`
- `FRONTEND_URL`
- `NOTIFICATION_PROVIDER=mock`

---

## Database

```bash
cd services/api
alembic upgrade head
python -m app.seed
```

---

## Tests

```bash
# API
cd services/api && pytest -q

# ML
cd ../.. && PYTHONPATH=. pytest -q ml/tests

# Frontend
npm run test
npm run build
```

(`npm run dev`, `npm test`, etc. work from the repository root and delegate to `client/`.)

---

## Train models

From the repository root:

```bash
python -m ml.data.make_synthetic
python -m ml.training.train_baselines
python -m ml.training.train_multimodal
python -m ml.evaluation.compare_models
python -m ml.trajectory.fit_projection
```

Configs: `ml/configs/baseline.yaml`, `multimodal.yaml`, `longitudinal.yaml`.

If no experiment has been run, research pages show **No experimental result available**. Metrics are never fabricated.

---

## Switch Demo → real model

1. Train and place an artifact under `MODEL_ARTIFACT_PATH`.
2. Set in `.env`:

```text
MODEL_MODE=pytorch
MODEL_ARTIFACT_PATH=/artifacts/active/multimodal.pt
```

3. Restart the inference service. The frontend does not need changes. Demo badge disappears only when `mode` is not `DEMO`.

---

## Production

See `docs/DEPLOYMENT.md` and `docker-compose.prod.yml`.  f6aea31 (Initial commit: Child Nutrition Intelligence Platform)
