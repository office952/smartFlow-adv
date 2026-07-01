# Phase 2B — Payload JSON + Intake Snapshot Resolver

**Date:** 2026-07-01  
**Status:** PASS

---

## Why Phase 2B was needed

Phase 2 delivered a system-driven intake form, but workspace truth still lived in flat SQLite columns plus a `notes`/`intake_snapshot` compatibility hack. Legacy WorkOS Intake V6 proved that real production intake requires structured `payload_json` (geometry, finish setup, letter groups) with a derived flat snapshot for quote preview.

Official quote write (Phase 4) must not proceed on flat-only workspace truth.

---

## Mapping doc

Created `docs/architecture/SMARTFLOW_LEGACY_PAYLOAD_MAPPING.md` as the Phase 2B contract: legacy payload paths → SmartFlow envelope → registries → quote preview input.

---

## Backend schema/storage

| Change | Detail |
|--------|--------|
| `schemas/workspace_payload.py` | Flexible Pydantic payload contract |
| `schemas/intake_v6.py` | `payload_json`, `intake_snapshot` on workspace detail; optional on create |
| `workspace_store.py` | Idempotent `payload_json` SQLite column; persist/read JSON; derive snapshot on read |
| Flat columns | Retained as denormalized compatibility; synced from snapshot on create when payload present |

---

## Snapshot builder

`services/intake_snapshot_builder.py` — `build_intake_snapshot(payload_json)`:

- Aggregates confirmed `letter_group_finishes` for area/perimeter
- Falls back to `quote_geometry` then `client`
- Derives `cut_length_ml`, support/mounting flags, confirmation gates
- Returns missing values as absent — no fake quantities

---

## Resolver order

`workspace_intake_resolver.py`:

1. `build_intake_snapshot(payload_json)` (wins)
2. Cached `payload_json.intake_snapshot`
3. Workspace `intake_snapshot` on detail
4. Notes legacy hack
5. Flat column fallback

Owner decisions merged from `owner_decisions_snapshot` when not in flat snapshot.

---

## Registry extensions

**IntakeFieldRegistry:** `letter_count`, `cut_length_ml`, `illuminated`, `lighting_system_type`, `mounting_template_area_m2`, confirmation gates, collection placeholders.

**OwnerDecisionRegistry:** `back_cut_basis`, `forex_template_price`, `packaging_commercial`, `site_mount_commercial`.

**CommercialRuleRegistry:** `sablon_montaj_rule`; `back_panel_rule` ml alternative note.

**FieldType:** added `collection` for Phase 2C/2D payload paths.

---

## Frontend adapter

| File | Role |
|------|------|
| `intakePayloadBuilder.ts` | Builds structured `payload_json` from registry form values |
| `intakeWorkspaceAdapter.ts` | Submits `payload_json` + flat compatibility create payload |
| `IntakeFieldRenderer.tsx` | Collection fields show Phase 2C placeholder (no invented data) |

Backend remains source of derived `intake_snapshot` truth.

---

## Tests / build

- `test_intake_payload_snapshot_builder.py` — 10 snapshot derivation cases
- `test_workspace_payload_json.py` — storage, resolver priority, API create
- Updated quote preview + systems registry tests (11 commercial rules)
- `python -m pytest` — all pass
- `npm run build` — pass

---

## Limitations

- No SVG upload, layer roles, or letter group review UI (Phase 2C/2D)
- Collection fields not editable in form yet
- `back_cut_basis` not wired to alternate back_panel quantity path
- Flat columns still written for backward compatibility

---

## Next recommended slice

**A — PHASE_2C_ARTWORK_SVG_LAYER_ROLES** — payload base is ready; add SVG analyzer + layer role setup into `payload_json`.

---

## Forbidden confirmation

No official quote write, snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, Employee Mobile, smartHub, frontend totals, fake prices, or committed DB.
