# Worklog — 2026-07-01 — Legacy archive audit + documentation prep

## Summary

Inspected old WorkOS export archives, current smartflow-adv starter, and `legacy-e2e-architecture.md`. Created systems-first documentation package. **No feature implementation.**

**Verdict:** PASS (audit + docs complete)

---

## Archives inspected

| Archive | Result |
|---------|--------|
| `salvari 2/workos-vs-code_export_clean_2026-07-01_194251.zip` | Found — dirty (venv, node_modules included) |
| `_archive_local/workos-vs-code_export_clean_fixed_2026-07-01_194414.zip` | Found — clean source export (current repo base) |
| Source parity | Same app file sizes — packaging differs only |

---

## Docs inspected

- `docs/legacy-e2e-architecture.md` — full read; concepts extracted per boundary rules
- All starter backend/frontend files listed in task — reviewed (prior audits + confirmation)
- `backend/data/workos_v6.db` — fresh empty; `workos_v6.demo.local.db` — demo only (not production truth)

---

## Useful legacy concepts kept

- Truth layer separation (Intake / Product System / Pricing / Quotes)
- Intake = runtime instance truth
- Product System = structural truth
- Pricing Registry = commercial rule contract surface
- Quotes = frozen commercial truth
- Settings do not rewrite frozen snapshots
- Backend-authoritative readiness; UI truth rules

---

## Discarded legacy scope

- Orders, Execution, Tasks, Shop Floor, Operator, Tablet
- HR, Attendance, Employee Payments, Advances
- Utilaje, full Inventory ops, Reports/Control Tower
- smartHub partner routing (later product)
- ProductAggregate, Task Graph, ExecutionPlan, Employee Mobile
- Dirty archive environment artifacts

---

## Hardcoded risk map

Documented in `SMARTFLOW_ADV_LEGACY_ARCHIVE_AUDIT.md`.

**Highest risk:**

1. `NewWorkspacePage.tsx` + `schemas/intake_v6.py` — hardcoded form
2. `quote_preview_service.py` — hardcoded quote lines / calculator
3. Demo DB with priced quotes — quarantined, not committed

---

## Docs created / updated

| File | Action |
|------|--------|
| `docs/architecture/SMARTFLOW_ADV_PRODUCT_BOUNDARY.md` | Created |
| `docs/architecture/SMARTFLOW_ADV_TARGET_SPINE.md` | Updated — systems-first flow |
| `docs/architecture/SMARTFLOW_ADV_SYSTEMS_FOUNDATION.md` | Created |
| `docs/architecture/SMARTFLOW_ADV_LEGACY_ARCHIVE_AUDIT.md` | Created |
| `docs/architecture/SMARTFLOW_ADV_IMPLEMENTATION_ROADMAP.md` | Created |
| `docs/worklog/2026-07-01_smartflow_adv_legacy_archive_audit_and_docs_prep.md` | Created |

---

## Baseline status (Phase 0)

| Item | Status |
|------|--------|
| Git init + remote | Done |
| Initial commit | **Pending** — git user identity |
| Python venv + backend smoke | Done |
| DB clean slate | Done |
| Frontend build | Pass |

---

## Recommended next slice

**A — BASELINE_SETUP_FIRST** (finish initial commit only)

Then immediately:

**B — SYSTEMS_FOUNDATION_IMPLEMENTATION_NEXT**

Phase 1: registry contracts + read APIs + seed data for volumetric letters template — **no quote calculator rewrite yet**.

---

## Roadmap alignment

| Checkpoint | Value |
|------------|-------|
| Current product | smartflow-adv |
| Current phase | Archive audit + documentation prep (pre–Phase 1) |
| Why here | Avoid hardcoded forms/calculators; preserve useful truth-layer concepts only |
| Must not unlock | quote write changes, snapshot, order, ProductAggregate, Task Graph, ExecutionPlan, smartHub, Employee Mobile |
| **Cat sunt in directia stabilita** | **85/100** |

**−15:** Starter code still hardcoded; baseline commit pending. Documentation and direction are aligned; implementation not started (correct for this task).

---

## Forbidden confirmation

- [x] No feature implementation
- [x] No hardcoded frontend calculator (none added)
- [x] No quote pricing implementation
- [x] No quote write / snapshot / order
- [x] No ProductAggregate / Task Graph / ExecutionPlan / Employee Mobile / smartHub routing
- [x] No fake totals / hardcoded prices / frontend as official total
- [x] No DB/schema migration
