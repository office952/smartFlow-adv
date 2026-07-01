# Worklog — 2026-07-01 — smartflow-adv clean start audit

## Summary

Clean starter export unpacked into `C:\Users\offic\Desktop\smartFlow-adv`. Initial architecture audit completed. No business features implemented. Verdict: **PARTIAL** (starter is usable; git/remote/Python run path and branding need owner follow-up).

---

## Import status

| Item | Status |
|------|--------|
| Source ZIP | `workos-vs-code_export_clean_fixed_2026-07-01_194414.zip` (in project root) |
| Extract target | `C:\Users\offic\Desktop\smartFlow-adv` |
| Top-level after unpack | `backend/`, `frontend/`, `docs/`, `README.md`, `.gitignore`, ZIP (retained) |
| Hidden git overwrite | N/A — no `.git` existed before unpack |

### Framework identification

| Layer | Stack |
|-------|--------|
| Backend | FastAPI 0.116 + Uvicorn, Python 3 (venv expected) |
| Frontend | React 18 + Vite 7 + TypeScript + react-router-dom |
| DB | SQLite (`backend/data/workos_v6.db` in export) |
| Dependency files | `backend/requirements.txt`, `frontend/package.json`, `frontend/package-lock.json` |

---

## Repo status

| Check | Result |
|-------|--------|
| `.git` present | **No** — not initialized locally |
| Remote `office952/smartflow-adv` | **Not configured** (`gh` CLI not available in shell) |
| `.gitignore` present | **Yes** — ignores `.venv`, `node_modules`, `backend/**/*.db`, `.env*` |
| README | **Yes** — still WorkOS-branded (pre-rename) |
| Accidental heavy junk | **None in code** — no ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile |
| Legacy reference doc | `docs/legacy-e2e-architecture.md` — architectural notes only, not executable legacy code |

### Hygiene gaps

1. Initialize git and link to `office952/smartflow-adv` (owner action).
2. Remove or regenerate bundled `workos_v6.db` locally — export includes demo priced quotes (see DB audit).
3. Install Python on dev machine — `python`/`py` not available in PATH during audit.
4. Rebrand WorkOS naming in API title, README, UI copy → smartflow-adv.

---

## Backend audit

**Framework:** FastAPI  
**Entrypoint:** `backend/app/main.py` — mounts `/api/v1`, `/health`  
**Storage:** `WorkspaceStore` — SQLite at `backend/data/workos_v6.db`

### Routes

| Prefix | Endpoints |
|--------|-----------|
| `/api/v1/meta` | Service metadata |
| `/api/v1/intake-v6/workspaces` | CRUD list/create/get workspace |
| `/api/v1/intake-v6/workspaces/{id}/owner-decisions` | List/upsert owner decisions |
| `/api/v1/intake-v6/workspaces/{id}/line-prices` | List/upsert commercial unit prices |
| `/api/v1/intake-v6/workspaces/{id}/quote-preview` | POST build preview |
| `/api/v1/quotes/previews` | List saved previews |
| `/api/v1/quotes` | List commercial quotes |
| `/api/v1/quotes/from-preview/{workspace_id}` | POST create official quote from ready preview |

### Services

| Module | Purpose |
|--------|---------|
| `workspace_store.py` | SQLite persistence: workspaces, previews, owner_decisions, line_prices, quotes |
| `quote_preview_service.py` | Builds quote lines, blockers, totals; persists preview |

### Quote / workspace capability

- **Workspace:** Manual volumetric-letters geometry intake (mm, perimeter, area, LED, optional forex template).
- **Quote preview:** Backend builds lines from workspace + owner decisions + stored unit prices. Returns `blocked` with null totals when prices/decisions missing.
- **Official quote:** Only when preview `status == ready` and totals non-null; copies preview into `CommercialQuoteRecord`.
- **Fake totals in code:** **No** — intentionally null when blocked. Warning string documents policy.
- **Preview vs official:** **Yes** — separate endpoints and models; create quote requires ready preview.

### Backend module table

| File / module | Purpose | Current status | Risk | Keep / rewrite / remove later |
|---------------|---------|----------------|------|-------------------------------|
| `app/main.py` | FastAPI app, CORS | Working scaffold | WorkOS branding | Keep — rename metadata |
| `app/api/router.py` | Route aggregation | Working | Low | Keep |
| `app/api/routes/meta.py` | Health/meta | Working | Low | Keep — update name/modules |
| `app/api/routes/intake_v6.py` | Workspace + preview triggers | Working for manual intake | "V6" legacy naming | Keep — rename prefix later |
| `app/api/routes/quotes.py` | Preview list + commercial quote | Working | Low | Keep |
| `app/services/workspace_store.py` | SQLite ORM-like store | Working | DB filename `workos_v6.db` | Keep — rename DB path later |
| `app/services/quote_preview_service.py` | Preview calculator | Scaffold — manual unit prices | Hardcoded line catalog for one template | **Rewrite** — smartflow-adv rules |
| `app/schemas/intake_v6.py` | Workspace DTOs | Working | Single template assumption | Keep — extend for SVG/product |
| `app/schemas/quotes.py` | Quote DTOs | Working | Low | Keep |
| `docs/legacy-e2e-architecture.md` | Legacy reference | Reference only | Could confuse scope | Keep — mark as legacy reference |

### Build/run verification

- **Backend import/run:** Not verified — Python not found in PATH on audit machine.
- **Frontend build:** **PASS** (`npm run build` succeeded).

---

## Frontend audit

**Framework:** React + Vite + TypeScript  
**Routing:** `/`, `/workspaces/new`, `/workspaces/:workspaceId`  
**API client:** `frontend/src/lib/api.ts` — fetch to `/api/v1` via Vite proxy → port 8010

### Pages

| Page | User can do now |
|------|-----------------|
| Dashboard | List workspaces, previews, commercial quotes from backend |
| New workspace | Create manual geometry workspace |
| Workspace preview | Build preview, set owner decisions, enter unit prices, create commercial quote when ready |

### Data source

- **All displayed totals/lines** come from backend API — no local total calculation.
- Blocked totals shown as `"blocked"` string when null.
- Form defaults on new workspace are **demo geometry values**, not prices.

### Frontend module table

| Page / component | Purpose | Backend dependency | Current status | Risk | Keep / rewrite / remove later |
|------------------|---------|-------------------|----------------|------|-------------------------------|
| `App.tsx` | Shell + nav | None | WorkOS branding | Low | Keep — rebrand |
| `DashboardPage.tsx` | Overview lists | workspaces, previews, quotes | Working | Low | Keep |
| `NewWorkspacePage.tsx` | Intake form | POST workspace | Working — manual only | Demo default field values | Keep — add design upload later |
| `WorkspacePreviewPage.tsx` | Preview + quote UI | preview, decisions, prices, quote create | Working | Owner price entry UX is dev/test oriented | Keep — polish in later phase |
| `lib/api.ts` | API client | All endpoints | Working | Low | Keep — rename paths when backend renames |
| `styles.css` | Layout | None | Working | Low | Keep |

### Missing for smartflow-adv target

- SVG/design upload
- Quote snapshot / offer export page
- Dedicated priced-quote view (vs preview workspace page)
- smartflow-adv branding
- Product template picker beyond single default

---

## DB / data audit

| Item | Finding |
|------|---------|
| DB type | SQLite |
| File | `backend/data/workos_v6.db` (69 KB in export) |
| Tables | `workspaces`, `previews`, `owner_decisions`, `line_prices`, `quotes` |
| Seed/demo data | **Yes** — multiple demo workspaces ("Volumetric letters demo", "Persist Demo") |
| Quote totals in DB | **Yes** — from manual test sessions (e.g. totals 637.6, 3017.84 RON) |
| Real vs placeholder | **Demo/test** — unit prices were entered via UI during export source testing; not authoritative production pricing |
| VAT consistency | Some stored quote JSON shows `total_gross == subtotal_net` (677.4) — likely test data inconsistency |
| In repo? | `.gitignore` excludes `backend/**/*.db` — good; delete local copy before first commit or ship empty DB |

**Recommendation:** Do not commit the bundled DB. Generate fresh empty DB on first backend start. Owner approval required before deleting local file.

---

## Risks

1. **Bundled demo DB** — Priced quotes in export may mislead developers into thinking pricing is “done.”
2. **No local git** — Drift from GitHub `office952/smartflow-adv` until init/clone/push workflow is established.
3. **Python not on PATH** — Backend not smoke-tested on this machine.
4. **WorkOS naming** — API/UI/docs still say WorkOS / Intake V6; needs smartflow-adv rename to avoid scope creep back to monolith.
5. **Single-template line catalog** — `QuotePreviewService` hardcodes volumetric letter lines; not yet product-system driven.
6. **Legacy architecture doc** — Describes full E2E including execution/orders; keep as reference, not implementation guide.
7. **PSU quantity semantics** — Backend warns PSU quantity mirrors watt class input, not piece count.

---

## First recommended implementation slice

**A — BACKEND_QUOTE_PREVIEW_FIRST**

Rationale: Starter already has workspace intake and preview/quote separation. The highest-value next step is hardening backend quote preview for smartflow-adv (real rules, no demo DB reliance, rename modules) before SVG intake or offer export.

---

## Forbidden confirmation

Confirmed **not imported / not implemented** in this session:

- [x] No ProductAggregate
- [x] No Task Graph
- [x] No ExecutionPlan
- [x] No Employee Mobile
- [x] No smartHub-adv routing/partners
- [x] No V2/V4 rollback
- [x] No fake totals in application code
- [x] No frontend preview as official total (UI defers to backend)
- [x] No hardcoded commercial prices in code paths (prices come from stored owner input or remain null)

---

## Files created / changed this session

| Path | Action |
|------|--------|
| `backend/`, `frontend/`, `docs/` (from ZIP) | Extracted |
| `docs/architecture/SMARTFLOW_ADV_TARGET_SPINE.md` | Created |
| `docs/worklog/2026-07-01_smartflow_adv_clean_start_audit.md` | Created |
| `README.md` | Updated (smartflow-adv branding) |

## Commands run

- `Expand-Archive` — unpack starter ZIP
- `npm install` + `npm run build` in `frontend/` — **success**
- Python backend install — **skipped** (Python not in PATH)

## What did NOT change

- No application feature code
- No DB migration or deletion
- No git init / commit / push
- No ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile
