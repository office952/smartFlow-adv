# Worklog — 2026-07-01 — Phase 3 Quote Preview From Rules

## Summary

Rewrote `QuotePreviewService` to derive preview line skeleton from **CommercialRuleRegistry** for the resolved systems template. Preview evaluates intake payload (legacy flat + Phase 2 notes snapshot), owner decisions, and owner line prices keyed by `rule_code`. Blocked previews keep null totals.

**Verdict:** PASS

---

## Phase 2 worklog/hash pre-check

- Phase 2 worklog updated with commit `9e43dd0`
- Confirmed: system-driven form, temporary adapter, hardcoded preview was the remaining gap

---

## Old hardcoded preview audit

| Item | Before |
|------|--------|
| Line catalog | 6–7 hardcoded codes (`debitare_fata`, `modelare_cant_aluminiu`, etc.) |
| Rule source | Local Python array in `quote_preview_service.py` |
| Owner decisions | Legacy codes (`DEBITARE_SPATE_BASIS_ML_VS_M2`, `SABLON_FOREX_*`) |
| Line prices | Keyed by old line codes |
| Template | Implicit volumetric only |

---

## New registry-driven preview behavior

| Item | After |
|------|--------|
| Line skeleton | 10 rules from `CommercialRuleRegistry` for `volumetric_letters_frontlit` |
| Line `code` / `rule_code` | Registry `rule_code` (e.g. `face_area_rule`) |
| Provenance | `provenance` + per-line `source = commercial_rule_registry` |
| Quantity | From intake/owner context by basis (`mp`, `ml`, `buc`) |
| Template resolution | Legacy `TPL-VOLUMETRIC-LETTERS_v2` → `volumetric_letters_frontlit` + notes snapshot |

**New modules:**

- `backend/app/services/workspace_intake_resolver.py` — merge flat workspace + intake snapshot
- `backend/app/services/quote_preview_contract.py` — blocker codes, basis helpers

---

## Blocker behavior

| Code | When |
|------|------|
| `REQUIRED_INPUT_MISSING` | Registry required input absent (e.g. `cut_length_ml`) |
| `OWNER_DECISION_MISSING` | Required owner decision not approved |
| `OWNER_PRICE_MISSING` | Priced rule without owner unit price |
| `MANUAL_OWNER_REVIEW_REQUIRED` | `service_fixed` / `manual_owner_review` rules |
| `UNSUPPORTED_BASIS` | Forbidden basis (none in seed) |
| `UNSUPPORTED_TEMPLATE` | No systems mapping |

Support/mounting/packaging rules → `not_applicable` when respective `*_required` is false.

---

## Ready preview behavior

Preview `status=ready` only when:

- All active client-visible lines are `priced` or `included`
- No preview/line blockers
- `subtotal_net`, `vat_amount`, `total_gross` computed from backend priced lines only

---

## Workspace payload compatibility (Phase 2 adapter)

- Reads legacy columns (`letter_perimeter_m`, `letter_face_area_m2`, etc.)
- Overlays `intake_snapshot` from workspace `notes` JSON
- Owner decisions from existing `owner_decisions` table (systems codes)
- Line prices must use **`rule_code`** (old line codes not silently mapped)

**Phase 2B still recommended:** unified workspace payload schema; `cut_length_ml` not in flat legacy columns.

---

## API/schema/frontend impact

**Schema extensions (backward compatible):**

- `QuoteLine`: `rule_code`, `component_code`, `line_status`, `blockers`, `source`, …
- `QuotePreviewResponse`: `template_code`, `provenance`

**Frontend (display only):**

- Show `rule_code`, `line_status`, `template_code`, `provenance`
- Removed hardcoded `DEBITARE_SPATE_BASIS_ML_VS_M2` UI branch
- No frontend totals calculation

---

## Tests run

```
cd backend && .venv\Scripts\python.exe -m pytest tests/ -v
29 passed
```

```
cd frontend && npm run build
PASS
```

---

## Files changed

| Area | Files |
|------|-------|
| Backend service | `quote_preview_service.py`, `workspace_intake_resolver.py`, `quote_preview_contract.py` |
| Schemas | `schemas/quotes.py` |
| Tests | `tests/test_quote_preview_from_rules.py` |
| Frontend | `api.ts`, `WorkspacePreviewPage.tsx` |
| Docs | roadmap, systems foundation, phase 2 worklog hash |

---

## Commit / push

_(filled after commit)_

---

## Recommended next slice

**C — PHASE_3B_OWNER_PRICE_DECISION_UI**

Preview is registry-driven; owner price entry on preview page still uses generic inputs keyed by `rule_code` — improve UX to show registry labels and group by component. Alternatively **B — PHASE_2B** if workspace payload gaps block real workspaces.

---

## AI Guardian connection check

| Check | Result |
|-------|--------|
| Contracts touched | CommercialRuleRegistry → QuotePreviewService → API → preview UI |
| Connected | Registry rule codes flow to preview lines and price keys |
| Disconnected risk | Legacy workspace flat fields without notes snapshot |
| UI business truth | None added — display only |
| Docs match | Updated |

**Cat sunt in directia stabilita:** 94/100

---

## Forbidden confirmation

- [x] No UI hardcoded business truth / calculator / official totals
- [x] No fake totals
- [x] No hardcoded final prices in preview service
- [x] No quote write changes beyond existing endpoint
- [x] No snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, Employee Mobile, smartHub
- [x] No DB committed
