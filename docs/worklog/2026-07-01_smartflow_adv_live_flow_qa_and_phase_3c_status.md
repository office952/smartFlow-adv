# Live Flow QA + Phase 3C Status Clarification

**Date:** 2026-07-01  
**Project:** smartflow-adv  
**QA workspace (API):** `85725632-69be-49ac-9c22-e3c8601b7914`

---

## Overall verdict

**PARTIAL** — live intake → payload → preview → owner prices chain **works**; Phase 3C blocker routing is **frontend-only UX** (not backend structured contract).

---

## Backend / frontend status

| Service | URL | Status |
|---------|-----|--------|
| Backend FastAPI | http://127.0.0.1:8010 | Running, health/meta/systems/workspaces/previews **200** |
| Frontend Vite dev | http://localhost:5174 | Running (5173 in use) |
| API proxy | `/api` → `127.0.0.1:8010` | Works via `vite.config.ts` — no `VITE_API_BASE_URL` override needed |

Browser verified: Dashboard, `/systems`, `/workspaces/new`, workspace preview page — no runtime crash. Light/dark toggle present.

---

## Live workspace flow

**UI path:** `/workspaces/new` loads system-driven form (templates from backend). Full SVG upload flow not exercised end-to-end in browser this session (no committed SVG fixture); **API simulation** used for payload verification with Phase 2C/2D-shaped `payload_json`.

**API path (representative):**

1. POST workspace with full `payload_json` (SVG metadata, layer roles, letter groups, finish_setup review fields)
2. Response includes `payload_json` + derived `intake_snapshot`
3. Navigate to `/workspaces/:id` → Build quote preview → blocked preview with registry lines

**No UI totals calculated** — preview `subtotal` remained `null` while blocked.

---

## Payload_json verification (workspace `85725632-69be-49ac-9c22-e3c8601b7914`)

Confirmed in create response:

| Field | Present |
|-------|---------|
| `schema_version` | ✓ `1.0.0` |
| `template_code` / `systems_template_code` | ✓ |
| `client` | ✓ |
| `svg_source` / `svg_analysis_json` | ✓ |
| `layer_role_setup` | ✓ confirmed face layers |
| `quote_geometry` | ✓ face 1.5 m², perimeter 6.8 m |
| `finish_setup.letter_group_finishes[]` | ✓ 2 confirmed groups |
| illumination / backing / mounting fields | ✓ |
| `owner_decisions_snapshot` | ✓ partial |
| `intake_snapshot` (derived) | ✓ `face_area_m2=1.5`, `perimeter_ml=6.8` |

No fake commercial totals in payload. Legacy flat columns exist as create API shim only.

---

## Intake snapshot / preview verification

- **Resolver:** payload_json first — snapshot face/perimeter match confirmed group sums (1.5 / 6.8), not legacy flat-only values when payload present
- **Preview status:** `blocked` with `subtotal: null` — correct null-totals policy
- **Lines:** 11 rules from CommercialRuleRegistry, grouped by component in UI (Fata, Cant, Spate, LED, PSU, Finisaj, Suport, Montaj, Ambalare)
- **Blockers:** missing owner decisions/prices/inputs produce blockers — no fake ready state

After `PUT .../line-prices/return_cant_rule` with unit price 45.0:

- Price stored on `rule_code` key ✓
- Line still `blocked` (other blockers remain) — price `45.0` visible ✓

---

## Owner price UI verification

On `/workspaces/:id` after Build preview:

- Lines grouped by component ✓
- Each card shows `rule_code` (e.g. `face_area_rule`, `return_cant_rule`) ✓
- Price editor label: `Price key: {rule_code}` ✓
- Blocker links: `Introdu preț pentru face_area_rule` → `#price-face_area_rule` ✓
- Save endpoint: `PUT /api/v1/intake-v6/workspaces/{id}/line-prices/{rule_code}` ✓

---

## Phase 3C blocker routing status

### Verdict: **PARTIAL**

**Option B — Frontend parsing only.**

Backend `QuoteBlocker` schema:

```python
class QuoteBlocker(BaseModel):
    code: str
    message: str
```

API blocker objects contain **only** `code` and `message` (verified live: `BLOCKER_FIELDS ['code', 'message']`).

Frontend `blockerRouting.ts` regex-parses messages and maps via static tables — **temporary UX helper**, not backend contract truth.

### Blocker routing examples (live browser on QA workspace)

| Example | Secțiune | Acțiune | Works? |
|---------|----------|---------|--------|
| `OWNER_DECISION_MISSING: back_material` | Spate | Completează Material spate | ✓ |
| `REQUIRED_INPUT_MISSING: face_area_m2` | Finisaje / Letter Groups | Completează aria pe grupurile confirmate | ✓ (mapping in code; QA workspace had face area filled so blocker not triggered live) |
| `OWNER_PRICE_MISSING: return_cant_rule` | Quote Preview / Owner Prices | Introdu preț pentru return_cant_rule | ✓ (link visible; QA workspace showed price blockers for face rules; return_cant had input/decision blockers first) |

Phase 3C **commit:** `1375541` — already pushed.

---

## Tests / build

| Command | Result |
|---------|--------|
| `backend/.venv/Scripts/python.exe -m pytest` | **52 passed** |
| `frontend npm run build` | **PASS** |

---

## Files changed this QA task

**None** — QA/docs only. No code fixes required for live flow.

---

## Recommended next slice

**A — PHASE_3C_BACKEND_STRUCTURED_BLOCKERS**

Live flow works; blocker routing UX works but depends on fragile message parsing. Next: emit structured blocker metadata from `QuotePreviewService` before owner live sign-off or official quote work.

Alternative if owner wants visual walkthrough first: **E — STOP_OWNER_REVIEW_LIVE_FLOW**

---

## Roadmap alignment

1. **Product:** smartflow-adv  
2. **Phase:** Live flow QA + Phase 3C clarification  
3. **Why:** Verify spine before official quote; clarify 3C partial status  
4. **Must not unlock:** quote write, snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile  
5. **Alignment:** **90/100** — spine connected live; structured blockers + post-create intake edit remain gaps

---

## Forbidden confirmation

No quote write, snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile, frontend calculator, fake totals, hardcoded prices, DB committed.
