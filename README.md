# smartflow-adv

Calculation, intake, quote preview, priced quote, and quote snapshot flow for advertising production.

**In scope:** workspace intake → product/quote input → backend quote preview → official priced quote → quote snapshot → offer output.

**Out of scope (separate products):** smartHub-adv (partners/routing), order execution, task graph, employee mobile.

## Structure

- `backend/` — FastAPI API service
- `frontend/` — React + Vite UI
- `docs/architecture/` — target spine and architecture decisions
- `docs/worklog/` — implementation and audit logs

## Quick start

### Backend

Requires **Python 3.11 or 3.12** (do not use 3.14). If `python` is not on PATH (common on Windows), use the full interpreter path or install [Python 3.12](https://www.python.org/downloads/) and enable **Add python.exe to PATH**.

Example when Python is installed but not on PATH:

```powershell
Set-Location backend
$py = "$env:LOCALAPPDATA\Programs\Python\Python312\python.exe"
& $py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8010
```

When `python` is on PATH:

```powershell
Set-Location backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8010
```

On first run, SQLite creates `backend/data/workos_v6.db` locally (gitignored). The file is disposable — delete it to reset. Demo exports may ship `workos_v6.demo.local.db`; rename or remove that file; do not treat it as production truth.

### Frontend

```powershell
Set-Location frontend
npm.cmd install
npm.cmd run dev
```

## Default URLs

- API: `http://127.0.0.1:8010`
- API docs: `http://127.0.0.1:8010/docs`
- UI: `http://127.0.0.1:5173`

## Architecture

- Product boundary: `docs/architecture/SMARTFLOW_ADV_PRODUCT_BOUNDARY.md`
- Target spine: `docs/architecture/SMARTFLOW_ADV_TARGET_SPINE.md`
- Systems foundation: `docs/architecture/SMARTFLOW_ADV_SYSTEMS_FOUNDATION.md`
- UI foundation: `docs/architecture/SMARTFLOW_ADV_UI_FOUNDATION.md`
- Implementation roadmap: `docs/architecture/SMARTFLOW_ADV_IMPLEMENTATION_ROADMAP.md`
- Legacy archive audit: `docs/architecture/SMARTFLOW_ADV_LEGACY_ARCHIVE_AUDIT.md`
- Clean start audit: `docs/worklog/2026-07-01_smartflow_adv_clean_start_audit.md`
- Legacy reference (not migration checklist): `docs/legacy-e2e-architecture.md`

## Commercial policy

- Quote preview may be **blocked** with null totals until owner-approved rules and prices exist.
- Official priced quotes are created only from a **ready** backend preview.
- No fake totals. Frontend never invents commercial truth.
