# Phase 2C — Artwork SVG Layer Roles

**Date:** 2026-07-01  
**Project:** smartflow-adv  
**Prior:** Phase 2B (`ffae500`) payload_json + intake snapshot

---

## Why Phase 2C

Phase 2B established structured `payload_json` and server-side `build_intake_snapshot()`, but intake was still a raw registry form. Production intake must be artwork-driven: SVG upload, layer/group extraction, operator role confirmation, and initial `letter_group_finishes[]` inside payload truth.

---

## SVG upload / parser

- **Frontend:** `frontend/src/lib/svg/svgMetadata.ts` — DOMParser, no external deps
- Extracts: file metadata, width/height, viewBox, `<g>` layers (id, inkscape:label, data-name), path/shape counts
- **Does not** compute commercial area/perimeter — metrics stay `null`
- Errors: invalid SVG, empty layers, wrong MIME type

---

## Layer role setup

- Roles: `face`, `return_cant`, `back`, `cut`, `print`, `paint`, `support`, `reference`, `ignored`, `unknown`
- Suggestions are draft aid via name heuristics; only operator-confirmed roles become payload truth
- Written to `payload_json.layer_role_setup` with `confirmation_status`: draft / partial / confirmed

---

## Letter group finishes

- Face layers produce draft rows in `finish_setup.letter_group_finishes[]`
- Finish type options from OwnerDecisionRegistry (`finish_type`, `return_finish`) — not hardcoded in UI
- Operator may enter metrics manually; `confirmed` per group gates snapshot sums

---

## Payload fields touched

| Section | Fields |
|---------|--------|
| `svg_source` | file_name, file_size_bytes, mime_type, upload_status, uploaded_at |
| `svg_analysis_json` | width, height, viewBox, group_count, path_count, layers[], parser_version |
| `layer_role_setup` | confirmation_status, layers[] with roles + metrics |
| `finish_setup.letter_group_finishes[]` | group_key, layer_name, role, finish fields, confirmed |
| `quote_geometry` | Derived from confirmed groups / SVG dims when safe |

---

## Snapshot builder changes

- Sums `face_area_m2` / `perimeter_m` from **confirmed** letter groups only
- `letter_count` from confirmed groups, else confirmed face layers in `layer_role_setup`
- `cut_length_ml` from perimeter when present
- `letter_groups_confirmed` false when any group unconfirmed
- Missing metrics → absent from snapshot → preview blockers (no fake values)

---

## Backend API

- Create workspace still writes full `payload_json` at create time
- **New:** `PATCH /api/v1/intake-v6/workspaces/{workspace_id}/payload` for post-create artwork saves
- Pydantic schema extended in `workspace_payload.py` for Phase 2C fields

---

## Preview compatibility

- `resolve_intake_payload` prefers payload_json → snapshot includes group-derived fields
- Preview lines remain registry-driven; missing metrics/decisions/prices → blockers
- No fake totals

---

## UI impact

- Artwork section on New Workspace page **before** registry fields
- Components: ArtworkUploadPanel, SvgMetadataPanel, SvgLayerList, LayerRoleSelector, LetterGroupFinishesPanel
- Product Systems page: collection field / source column (read-only)

---

## Tests / build

```bash
cd backend && python -m pytest   # includes artwork payload + PATCH + snapshot tests
cd frontend && npm run build
```

---

## Limitations

- No SVG path geometry analyzer (area/perimeter not auto-computed)
- No collection field UI edit for full letter_group_finishes review tabs (Phase 2D)
- SVG file content not persisted server-side — metadata + analysis JSON only
- Legacy flat columns still used as create API compatibility shim

---

## Next recommended slice

**A. PHASE_2D_LETTER_GROUP_FINISHES_REVIEW** — full review tabs for finishes, illumination, mounting after SVG/layers foundation is stable.

---

## Forbidden confirmation

- No UI hardcoded business truth
- No frontend calculator / official totals
- No quote write, snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile
