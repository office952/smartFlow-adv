# Phase 3C — Preview Payload Blocker Polish

**Date:** 2026-07-01  
**Project:** smartflow-adv  
**Prior:** Phase 2D (`47e363a`) letter group finishes review

---

## Verdict

**PARTIAL** — frontend blocker routing UX implemented; backend structured blocker contract **not** implemented.

Full Phase 3C PASS requires backend `QuoteBlocker` to expose structured metadata (`review_section`, `field_code`, `owner_decision_code`, `rule_code`, `operator_action_hint`, `severity`, `source_layer`). Current routing derives section/action from **frontend parsing** of `code` + `message` strings.

---

## What was implemented

### Frontend blocker routing UX

- `blockerRouting.ts` — parses backend blocker messages (regex on quoted tokens) and maps to intake/preview sections
- `BlockerRouteHint.tsx` — displays headline, backend message, **Secțiune**, **Acțiune**
- `PreviewBlockersPanel` — uses routed hints for all preview blockers
- `QuotePreviewLineCard` — per-line blockers use same routing component
- `intakeReviewSummary.ts` — aligned local gap copy for Spate / Finisaje (preview-adjacent, not backend blockers)
- Section anchors: `#review-spate`, `#review-finisaje`, `#review-iluminare`, `#review-artwork`, `#owner-prices`, `#price-{rule_code}`

### Example mappings (frontend-derived)

| Blocker | Secțiune | Acțiune |
|---------|----------|---------|
| `OWNER_DECISION_MISSING: back_material` | Spate | Completează Material spate |
| `REQUIRED_INPUT_MISSING: face_area_m2` | Finisaje / Letter Groups | Completează aria pe grupurile confirmate |
| `OWNER_PRICE_MISSING: return_cant_rule` | Quote Preview / Owner Prices | Introdu preț pentru return_cant_rule |

Price blockers link to `#price-{rule_code}` on the preview page.

---

## Backend structured blocker status

**Not implemented.**

Current contract (`backend/app/schemas/quotes.py`):

```python
class QuoteBlocker(BaseModel):
    code: str
    message: str
```

`QuotePreviewService` emits human-readable English messages only, e.g.:

- `Required input 'face_area_m2' missing for rule 'face_area_rule'.`
- `Owner decision 'back_material' missing or not approved for rule 'back_panel_rule'.`
- `Owner unit price missing for rule 'return_cant_rule'.`

No fields: `review_section`, `field_code`, `owner_decision_code`, `rule_code`, `operator_action_hint`, `severity`, `source_layer`.

**Risk:** frontend routing breaks if backend message format changes.

---

## Files changed (this slice)

| File | Change |
|------|--------|
| `frontend/src/lib/blockerRouting.ts` | New — parse + route maps |
| `frontend/src/components/quote-preview/BlockerRouteHint.tsx` | New — routed display |
| `frontend/src/components/quote-preview/PreviewBlockersPanel.tsx` | Uses BlockerRouteHint |
| `frontend/src/components/quote-preview/QuotePreviewLineCard.tsx` | Uses BlockerRouteHint + price anchors |
| `frontend/src/pages/WorkspacePreviewPage.tsx` | `#owner-prices` anchor |
| `frontend/src/components/intake/SystemDrivenIntakeForm.tsx` | `#review-artwork` anchor |
| `frontend/src/lib/intakeReviewSummary.ts` | Aligned gap copy |
| `frontend/src/styles.css` | Blocker route hint styles |

Backend: **not touched** in this slice.

---

## Build / tests

```bash
cd frontend && npm run build   # PASS
```

Backend pytest not re-run (no backend changes).

---

## Remaining gap

1. **Backend structured blockers** — extend `QuoteBlocker` + `QuotePreviewService` to emit routing metadata from registry/intake field definitions instead of relying on message parsing.
2. **Intake edit flow for existing workspaces** — preview page links to `#review-*` on `/workspaces/new` only; no post-create intake edit UI yet (PATCH payload exists but no dedicated page).
3. **i18n** — operator hints are Romanian in frontend map; backend messages remain English.

---

## Recommended next slice

**PHASE_3C_BACKEND_STRUCTURED_BLOCKERS**

Add structured fields to `QuoteBlocker`, populate from CommercialRuleRegistry + IntakeFieldRegistry + OwnerDecisionRegistry in `QuotePreviewService`, then simplify frontend to consume API metadata (keep frontend map as fallback only).

---

## Forbidden confirmation

- No frontend calculator  
- No fake totals  
- No quote write  
- No snapshot  
- No order  
- No ProductAggregate runtime  
- No smartHub  
- No DB committed  
