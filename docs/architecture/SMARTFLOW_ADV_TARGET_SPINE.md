# smartflow-adv — Target Spine

## 1. Purpose

**smartflow-adv** is the calculation, intake, quote preview, priced quote, and quote snapshot application for advertising production.

It owns the commercial offer path from product-system definition through workspace intake to a frozen priced offer. It does not execute production, route work to partners, or manage the operational hub.

## 2. Build order (non-negotiable)

```
Systems first  →  Forms second  →  Quote preview third
```

| Order | Layer | Wrong shortcut |
|-------|-------|----------------|
| 1 | Product Systems / Registries | Hardcoded React form fields |
| 2 | Intake schema from systems | Copy-paste volumetric form |
| 3 | Quote preview from commercial rules | Hardcoded lines in Python service |
| 4+ | Official quote → snapshot → offer | UI-calculated totals |

## 3. What smartflow-adv is

- Product family / template / component / rule registries (systems layer)
- Intake workspace for one concrete request instance
- System-driven intake form (generated from IntakeFieldRegistry)
- Backend-authoritative quote preview (exploratory, may be blocked)
- Backend-authoritative official priced quote
- Quote snapshot / frozen offer record
- Offer export and client-facing output

## 4. What smartflow-adv is not

- **smartHub-adv** — partner network, routing, production handoff
- Orders, execution, task graph, shop floor, employee mobile
- HR, attendance, payroll, machine registry as primary features
- A monolithic WorkOS rebuild

See also: `SMARTFLOW_ADV_PRODUCT_BOUNDARY.md`

## 5. Canonical flow

```
Product Systems / Registries
        │
        ▼
Intake Workspace
        │
        ▼
Product / Quote Input  (schema-validated instance data)
        │
        ▼
Backend Quote Preview  (rule-driven; may be blocked)
        │
        ▼
Official Priced Quote  (ready preview only)
        │
        ▼
Quote Snapshot  (immutable)
        │
        ▼
Offer Output  (export / client view)
```

| Stage | Role | Truth level |
|-------|------|-------------|
| Product Systems / Registries | Families, templates, components, commercial rules, intake schema | Structural / policy truth |
| Intake Workspace | Client, template selection, instance inputs | Request draft |
| Product / Quote Input | Validated payload bound to template | Request instance truth |
| Backend Quote Preview | Rule-driven lines; null totals when blocked | Exploratory / non-commercial |
| Official Priced Quote | Persist priced record from ready preview | Commercial truth |
| Quote Snapshot | Frozen offer tied to workspace | Frozen commercial truth |
| Offer Output | PDF/HTML/export | Derived from snapshot |

## 6. Forbidden now

- ProductAggregate, Task Graph, ExecutionPlan, Employee Mobile
- smartHub-adv routing / partners / production network
- V2/V4 rollback paths
- Hardcoded form → hardcoded calculator → quote as primary architecture
- Orders and execution pipeline

## 7. Preview vs Official Quote rule

- **Quote preview** may return `status: blocked` with `null` totals.
- **Official priced quote** only from **ready** preview via explicit backend action.
- UI never invents totals.
- Snapshot freezes policy (e.g. VAT) at generation time; settings do not rewrite history.

## 8. No fake totals rule

No hardcoded quote totals. Blocked previews show `null` / `"blocked"`, not zero or guesses.

## 9. No frontend-total-as-truth rule

All commercial numbers from backend API. Frontend collects inputs, POSTs, re-fetches — does not calculate authoritative totals.

## 10. No commercial price by hour/minute rule

Customer quotes use product/commercial units (ml, m², piece). Internal CostEngine rates are separate and not shown as client line prices.

## 11. Implementation phases

See `SMARTFLOW_ADV_IMPLEMENTATION_ROADMAP.md`:

| Phase | Focus |
|-------|--------|
| 0 | Baseline setup |
| 1 | Systems foundation (registries) |
| 2 | Intake schema from systems |
| 3 | Quote preview from rules |
| 4 | Official priced quote |
| 5 | Quote snapshot |
| 6 | Offer output |

**Current position:** Phase 0 tail + documentation prep complete → Phase 1 next.

## 12. Related docs

- `SMARTFLOW_ADV_PRODUCT_BOUNDARY.md`
- `SMARTFLOW_ADV_SYSTEMS_FOUNDATION.md`
- `SMARTFLOW_ADV_LEGACY_ARCHIVE_AUDIT.md`
- `SMARTFLOW_ADV_IMPLEMENTATION_ROADMAP.md`
- `docs/legacy-e2e-architecture.md` (reference only)
