# smartflow-adv — AI Alignment Guardian

## Owner clarification (2026-07-01)

The useful AI layer for smartflow-adv is **not** an AI that calculates prices or invents products.

The useful AI layer is an **alignment guardian**: it helps the team notice when something that was connected becomes disconnected, and when contracts break between systems, UI, backend, quote preview, snapshot, and documentation.

**AI audits truth connections. AI does not create commercial truth.**

---

## 1. Purpose

The **AI Alignment Guardian** helps keep smartflow-adv aligned with its architecture by detecting disconnects across:

- product systems registries
- system-driven UI
- workspace payload contracts
- quote preview behavior
- official quote and snapshot rules (when implemented)
- documentation and roadmap claims
- scope boundaries (smartflow-adv vs smartHub-adv vs forbidden legacy patterns)

It is a **watchdog and reviewer**, not a product engine.

---

## 2. What AI Guardian is

| Role | Description |
|------|-------------|
| Architecture watchdog | Watches the canonical spine for broken links |
| Contract checker | Verifies registry → UI → backend → preview → snapshot chain |
| Dead-piece detector | Flags orphaned modules, unused routes, stale adapters |
| Scope drift detector | Catches orders, execution, smartHub, ProductAggregate creep |
| Roadmap alignment reviewer | Compares claimed phase status vs code reality |
| Implementation report reviewer | Validates agent/human change reports against contracts |

---

## 3. What AI Guardian is not

| Not this | Why |
|----------|-----|
| Price calculator | Commercial totals are backend-only |
| Product decider | Product structure lives in registries + owner approval |
| Quote writer | Official quote is explicit backend action from ready preview |
| Snapshot creator | Snapshot freezes backend truth — not AI invention |
| Task / execution planner | Forbidden in smartflow-adv; belongs to smartHub-adv later |
| smartHub router | Partner/routing is out of scope |
| Chat copilot for operators | Not in scope for this guardian model |
| OpenAI integration (now) | **Documentation only — no implementation in this phase** |

---

## 4. Core flow it must protect

```
ProductFamilyRegistry
  → ProductTemplateRegistry
  → ComponentRegistry
  → CommercialRuleRegistry
  → IntakeFieldRegistry
  → OwnerDecisionRegistry
  → system-driven UI
  → workspace payload
  → quote preview
  → official quote
  → quote snapshot
  → offer output
```

Any change that breaks an arrow is a **guardian alert**, not a silent drift.

---

## 5. Contract checks

### ProductTemplate / registry changes

| Check | Rule |
|-------|------|
| Components | Every active template has defined components |
| Measurements | Components declare required measurements |
| Owner decisions | Components/rules declare required owner decisions |
| Commercial rules | Every rule references an existing component |
| Intake fields | Required rule inputs have matching intake fields or documented computed sources |
| Owner decisions | Required rule decisions exist in OwnerDecisionRegistry |
| Forbidden bases | No `hour`, `minute`, `labor_time`, `machine_time` commercial bases |

### UI changes

| Check | Rule |
|-------|------|
| Field source | No business fields invented in React as source of truth |
| Pricing | No pricing formulas in frontend |
| Totals | No official totals computed or displayed without backend value |
| Schema | Intake fields render from API/registry/schema |
| Status | Preview/quote readiness/blockers from backend API only |
| Adapter | Legacy adapters documented and temporary — not hidden permanent truth |

### Quote preview changes

| Check | Rule |
|-------|------|
| Rule source | Preview reads CommercialRuleRegistry — not hardcoded line arrays (Phase 3 target) |
| Blockers | Missing input → blockers, not guessed values |
| Totals | Null/blocked when rules incomplete — no fake totals |
| Write scope | Preview does not write official quote or snapshot |
| Separation | Preview exploratory; official quote is separate endpoint |

### Snapshot changes (future)

| Check | Rule |
|-------|------|
| Source | Snapshot freezes backend official quote only |
| Immutability | Settings changes do not rewrite historical snapshots |
| UI | UI displays snapshot JSON — does not recompute |
| Export | Offer output derives from snapshot version, not live preview |

### Documentation changes

| Check | Rule |
|-------|------|
| Code parity | Docs describe what exists, not aspirational fiction |
| Roadmap | Phase status matches deliverables in repo |
| Legacy leak | WorkOS menu scope (orders, execution, tasks, HR) stays reference-only |
| Product boundary | smartflow-adv vs smartHub-adv separation preserved |

---

## 6. AI Guardian report format

Every significant implementation or audit should produce a report in this shape:

```markdown
# SMARTFLOW-ADV AI ALIGNMENT GUARDIAN REPORT

## Verdict
PASS / PARTIAL / BLOCKED

## What changed
(bullets)

## Connected flow check
(registry → UI → payload → preview → quote → snapshot → offer)

## Broken links
(list or "none")

## Dead pieces
(unused modules, orphaned adapters, stale docs)

## UI hardcoding risk
(low / medium / high + notes)

## Backend contract risk
(low / medium / high + notes)

## Docs vs code mismatch
(list or "none")

## Scope drift
(smartHub, orders, execution, ProductAggregate, etc.)

## Recommended next action
(one slice)

## Cat sunt in directia stabilita
X/100%
```

---

## 7. Future audit workflow (Phase 7A — not implemented yet)

When implemented, the guardian may run:

1. **Pre-change** — Which contracts will this touch? Upstream/downstream?
2. **Post-change** — What connected? What disconnected?
3. **Periodic** — Registry ↔ UI ↔ preview ↔ docs cross-check
4. **On PR / agent task** — Emit guardian report; block merge on BLOCKED verdict (policy TBD)

**Inputs AI may inspect (read-only):**

- Source code (backend registries, routes, preview service, frontend intake/preview pages)
- OpenAPI / route list
- Architecture and roadmap markdown
- Test results
- Git diff

**Outputs AI may produce:**

- Guardian reports (format above)
- Disconnect warnings
- Suggested fix slices
- Docs update recommendations

**Outputs AI must not produce:**

- Official quote totals
- Registry mutations without human approval
- Snapshot records
- Production routing decisions

---

## 8. AI Alignment Guardian Rule (for Cursor / agents)

**Before and after each significant implementation**, the agent must report:

1. **Contracts touched** — Which registries, APIs, UI surfaces, docs?
2. **Upstream/downstream dependencies** — What may break if this changes?
3. **What was connected** — Which spine links were strengthened or preserved?
4. **What may have been disconnected** — Orphan fields, stale adapters, docs drift?
5. **UI business truth** — Did UI invent fields, formulas, totals, or readiness?
6. **Backend ↔ UI parity** — Do APIs still satisfy what UI renders?
7. **Docs match implementation** — Roadmap phase claims accurate?

If any item is unknown, say **unknown** — do not assume PASS.

This rule complements (does not replace) existing worklog and audit report formats.

---

## 9. Relationship to other docs

| Document | Relationship |
|----------|--------------|
| `SMARTFLOW_ADV_TARGET_SPINE.md` | Canonical flow the guardian protects |
| `SMARTFLOW_ADV_SYSTEMS_FOUNDATION.md` | Registry contracts to verify |
| `SMARTFLOW_ADV_UI_FOUNDATION.md` | UI forbidden behaviors |
| `SMARTFLOW_ADV_PRODUCT_BOUNDARY.md` | Scope drift boundaries |
| `SMARTFLOW_ADV_IMPLEMENTATION_ROADMAP.md` | Phase 7A placement |

---

## 10. Implementation status

| Item | Status |
|------|--------|
| Architecture documentation | **Done (this document)** |
| Automated checks | Not started |
| OpenAI / LLM integration | **Forbidden until explicit Phase 7A implementation approval** |
| Chat UI | Not started |
| Backend AI endpoints | Not started |

See roadmap: **Phase 7A — AI Alignment Guardian**.
