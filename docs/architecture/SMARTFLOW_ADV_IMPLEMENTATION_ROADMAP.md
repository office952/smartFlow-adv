# smartflow-adv — Implementation Roadmap

## Direction checkpoint

**Systems first → forms second → quote preview third.**

This roadmap replaces the starter's implicit path (hardcoded form → hardcoded lines → preview).

---

## Phase 0 — Baseline setup

**Status:** Mostly complete (local)

| Item | Status |
|------|--------|
| Starter import | Done |
| Git init + remote | Init done; **initial commit pending** (git identity) |
| Python 3.12 venv | Done |
| Backend smoke test | Done |
| DB clean slate | Demo DB quarantined; fresh empty DB verified |
| Frontend build | Pass |
| Archive/docs audit | **This document set** |

**Exit criteria:** Initial commit on `main`; optional push to `office952/smartflow-adv`.

---

## Phase 1 — Systems foundation

**Status:** Complete (2026-07-01)

**Goal:** Registries and contracts exist before any form or calculator rewrite.

| Deliverable | Description |
|-------------|-------------|
| Registry contracts | ProductFamily, Template, Component, Material, Operation, CommercialRule, IntakeField, OwnerDecision |
| Seed data | One family + one template (volumetric letters) as versioned data |
| Read APIs | Template list, intake schema, commercial rule metadata |
| QuotePreviewContract | Documented and aligned with existing Pydantic schemas |

**Forbidden in Phase 1:** quote pricing logic changes, quote write, snapshot, order, ProductAggregate, Task Graph.

---

## Phase 2 — Intake schema from systems

**Status:** Complete (2026-07-01)

**Goal:** Frontend form driven by backend `IntakeFieldRegistry`.

| Deliverable | Description |
|-------------|-------------|
| Dynamic form renderer | Replace hardcoded `NewWorkspacePage` fields |
| Workspace create | POST payload validated against schema from template |
| Template picker | Select from ProductTemplateRegistry |

**Forbidden:** Hardcoded field list as source of truth; frontend-only validation as canonical.

---

## Phase 3 — Quote preview from rules

**Goal:** `QuotePreviewService` reads CommercialRuleRegistry + OwnerDecisionRegistry — not hardcoded line arrays.

| Deliverable | Description |
|-------------|-------------|
| Rule-driven line builder | Lines, bases, blockers from registry |
| Owner decision gating | From OwnerDecisionRegistry |
| Null totals policy | Preserved — blocked until rules satisfied |
| No fake prices | Unit prices from owner input or registry entries only |

**Forbidden:** Hardcoded quote lines in Python; frontend total calculation.

---

## Phase 4 — Official priced quote

**Goal:** Harden existing `POST /quotes/from-preview/{id}` flow under systems naming.

| Deliverable | Description |
|-------------|-------------|
| Ready-gate enforcement | Only `status=ready` previews |
| One quote per workspace policy | Keep 409 conflict |
| Rename/branding | smartflow-adv API labels |

---

## Phase 5 — Quote snapshot

**Goal:** Immutable frozen offer record distinct from mutable preview.

| Deliverable | Description |
|-------------|-------------|
| Snapshot model | Versioned, immutable JSON |
| Settings immutability | VAT/policy frozen at snapshot time |
| UI separation | Preview workspace vs priced snapshot view |

---

## Phase 6 — Offer output

**Goal:** Client-visible export from snapshot only.

| Deliverable | Description |
|-------------|-------------|
| Offer PDF/HTML | From snapshot, not live preview |
| Export audit | Which snapshot version was exported |

---

## Explicitly forbidden until later

| Item | Product |
|------|---------|
| Order | smartHub-adv / downstream |
| Execution | smartHub-adv |
| ProductAggregate | Forbidden pattern |
| Task Graph | Forbidden pattern |
| ExecutionPlan | Forbidden pattern |
| Employee Mobile | Forbidden |
| smartHub routing / partners | smartHub-adv |
| Shop Floor / Operator / HR / Attendance | Legacy ops |

---

## Phase diagram

```
Phase 0  Baseline ─────────────────────────────────────────►
Phase 1  Systems/registries ───────────────────────────────►
Phase 2  Schema-driven intake form ────────────────────────►
Phase 3  Rule-driven quote preview ────────────────────────►
Phase 4  Official priced quote ────────────────────────────►
Phase 5  Quote snapshot ───────────────────────────────────►
Phase 6  Offer output ─────────────────────────────────────►
                              │
                              │ handoff (later)
                              ▼
                         smartHub-adv
```
