# Phase 2D — Letter Group Finishes Review

**Date:** 2026-07-01  
**Project:** smartflow-adv  
**Prior:** Phase 2C (`1a0c12d`) artwork SVG layer roles

---

## Why Phase 2D

Phase 2C established SVG upload, layer roles, and draft `letter_group_finishes[]`, but intake remained too raw for production. Operators need collapsible review sections for finishes, illumination, backing, support/mounting, and packaging — without frontend pricing or invented business truth.

---

## Review UX implemented

Collapsible sections on New Workspace page (after Artwork / SVG):

| Section | Purpose |
|---------|---------|
| Review completion summary | Local gap hints — not commercial readiness |
| Letter groups / Finisaje | Per-group finish cards with metrics + confirm |
| Artwork / logo finishes | Optional rows for non-letter elements |
| Iluminare | illuminated, LED, PSU, policies |
| Spate | backing mode, back material, back area |
| Suport / Montaj | mounting system, support (derived), template |
| Ambalare / Livrare | packaging + delivery policy |

Registry-managed fields hidden from raw intake form — edited in review panels.

---

## Letter group finishes

- Full editor per face group: area, perimeter, face/return finish, Oracal, vinyl roll width, confirm
- Options from `letter_face_finish_type` and `letter_return_finish_type` OwnerDecisionRegistry entries
- Confirmed groups sum into `quote_geometry` via payload builder + snapshot builder

---

## Illumination review

- Writes `finish_setup.illuminated`, `lighting_system_type`, `led_module_count`, `selected_psu_watts`, `light_color`
- Policies: `led_density_policy`, `psu_policy` → `owner_decisions_snapshot`
- LED fields disabled when not illuminated

---

## Backing / support / mounting

- **Spate:** `backing_mode`, `back_material`, `back_area_m2`
- **Montaj:** `mounting_system`, derived `support_required`, template fields, `mounting_type`
- Support (bars/structure) kept distinct from mounting (fixing/template)

---

## Payload fields touched

- `finish_setup`: extended with `back_area_m2`, `support_required`, `support_type`, `packaging_required`, `package_size_class`
- `finish_setup.artwork_finishes[]`: optional logo rows
- `owner_decisions_snapshot`: illumination/backing/packaging decisions merged from review

---

## Snapshot builder impact

- `back_area_m2` from `quote_geometry` or `finish_setup.back_area_m2`
- Explicit `support_required` / `support_type` when set in finish_setup
- `packaging_required`, `package_size_class`, `backing_mode` extracted
- Confirmed-only group metric sums unchanged from Phase 2C

---

## Preview compatibility

- Complete review payload → fewer geometry blockers
- Owner decisions/prices still required for ready preview
- No fake totals; backend QuotePreviewService unchanged in pricing logic

---

## Registry additions

New OwnerDecisionRegistry entries: `letter_face_finish_type`, `letter_return_finish_type`, `backing_mode`, `mounting_system`, `lighting_system_type`, `face_vinyl_roll_width_mm`, `package_size_class`

---

## Tests / build

```bash
cd backend && .venv\Scripts\python.exe -m pytest
cd frontend && npm run build
```

---

## Limitations

- SVG geometry (area/perimeter) still manual — Phase 2E analyzer deferred
- Preview blocker UX on intake page not live (post-create preview only)
- SVG file bytes not stored server-side

---

## Next recommended slice

**B. PHASE_3C_PREVIEW_PAYLOAD_BLOCKER_POLISH** — align preview blocker messages with review/payload field names after intake review is operational.

---

## Forbidden confirmation

No quote write, snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile, frontend totals, or hardcoded business truth.
