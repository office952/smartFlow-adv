# Worklog — 2026-07-01 — Phase 2 Intake Schema From Systems

## Summary

Replaced hardcoded `NewWorkspacePage` form with a system-driven intake form consuming backend `/api/v1/systems` registries. Added temporary legacy workspace adapter, owner decision persistence after create, and read-only Product Systems page.

**Verdict:** PASS

---

## Hardcoded form status

| Before | After |
|--------|-------|
| 15+ hardcoded fields in `NewWorkspacePage` | Fields from `GET .../intake-fields` |
| Static template `TPL-VOLUMETRIC-LETTERS_v2` | Template list from `GET .../product-templates` |
| No owner decisions on create | Rendered from `GET .../owner-decisions`, saved via existing API after create |

**Remaining non-registry fields:** `title`, `client_name` (workspace envelope — documented for Phase 2B).

---

## Systems APIs consumed

- `GET /api/v1/systems/product-templates`
- `GET /api/v1/systems/product-templates/{code}/intake-fields`
- `GET /api/v1/systems/product-templates/{code}/owner-decisions`
- `GET /api/v1/systems/product-templates/{code}` (+ components, rules on `/systems` page)

Client: `frontend/src/lib/systemsApi.ts` (re-exported from `api.ts`).

---

## Components created

| Component | Purpose |
|-----------|---------|
| `SystemDrivenIntakeForm` | Loads schema, renders form, submits payload |
| `IntakeFieldRenderer` | Renders field by `field_type` from registry |
| `OwnerDecisionRenderer` | Renders decision select from `allowed_values` |
| `TemplateSelector` | Active template picker |

---

## Temporary adapter (Option B)

`frontend/src/lib/intakeWorkspaceAdapter.ts`

Maps systems field codes → legacy flat `WorkspaceCreateInput`:

| Systems field | Legacy field |
|---------------|--------------|
| `artwork_width_mm` | `width_mm` |
| `artwork_height_mm` | `height_mm` |
| `perimeter_ml` | `letter_perimeter_m` |
| `face_area_m2` | `letter_face_area_m2` |
| `estimated_led_count` | `led_module_count` |
| `estimated_power_w` | `selected_psu_watts` |
| `mounting_required` | `mounting_template_enabled` |
| `volumetric_letters_frontlit` | `TPL-VOLUMETRIC-LETTERS_v2` |

**Gaps:** `letter_count` defaults to `1` until registry/backend payload update (Phase 2B).

---

## Submit behavior

1. Validate meta + registry required fields + owner decisions
2. Adapt to legacy payload (fail closed for unsupported templates)
3. `POST /intake-v6/workspaces`
4. For each filled owner decision → `PUT .../owner-decisions/{code}` with `approved`
5. Navigate to workspace preview page

No fake success. Non-active templates disable submit.

---

## Product Systems page

**Route:** `/systems` (read-only)

Shows template, components, commercial rules, intake fields, owner decisions from backend. Nav enabled.

---

## Build/tests

```
cd frontend && npm run build — PASS (54 modules)
```

Backend unchanged — no backend tests run.

---

## Limitations

- Workspace envelope fields not in IntakeFieldRegistry yet
- Legacy flat API adapter required until Phase 2B
- Owner decisions use preview-page API shape after create (not stored in systems payload)
- `volumetric_letters_non_lit` stub — submit disabled (non-active template)
- No quote preview rewrite

---

## Commit / push

**Commit:** `9e43dd0` — Drive intake form from smartflow systems schema  
**Remaining gap before Phase 3:** `quote_preview_service.py` hardcoded line catalog (addressed in Phase 3).

---

## Recommended next slice

**A — PHASE_3_QUOTE_PREVIEW_FROM_RULES** (with **Phase 2B** follow-up for `letter_count` + envelope fields in registry when needed)

---

## Forbidden confirmation

- [x] No UI hardcoded business field list as source of truth
- [x] No frontend calculator / official totals
- [x] No quote pricing rewrite, write, snapshot, order
- [x] No DB changes
