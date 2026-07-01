# smartflow-adv — Systems Foundation

## Principle

**Systems first, forms second, quote preview third.**

Forms and quote lines must be **outputs** of registries and contracts — not hardcoded in React pages or Python services.

---

## Target registries

Each registry is a **read contract** (Phase 1) before full CRUD admin UI. Data may start as versioned JSON/YAML or SQLite tables — implementation choice comes later.

### ProductFamilyRegistry

| Attribute | Purpose |
|-----------|---------|
| `family_code` | Stable identifier (e.g. `volumetric-letters`) |
| `label` | Human name |
| `description` | Commercial scope |
| `active` | Whether selectable in intake |

**Role:** Top-level product grouping. One family may have many templates.

---

### ProductTemplateRegistry

| Attribute | Purpose |
|-----------|---------|
| `template_code` | Stable identifier (e.g. `TPL-VOLUMETRIC-LETTERS_v2`) |
| `family_code` | Parent family |
| `version` | Template revision |
| `component_codes[]` | Enabled components for this template |
| `operation_codes[]` | Enabled operations |
| `intake_schema_ref` | Link to IntakeFieldRegistry |
| `commercial_rule_set_ref` | Link to CommercialRuleRegistry |

**Role:** Structural truth for a reusable product blueprint. Intake workspace **selects** a template; it does not embed template structure inline.

---

### ComponentRegistry

| Attribute | Purpose |
|-----------|---------|
| `component_code` | Stable line/component id |
| `label` | Display name |
| `quantity_source` | How quantity is derived (intake field, computed, owner decision) |
| `basis_types[]` | Allowed commercial bases (ml, m2, piece, …) |
| `material_refs[]` | Optional material linkage |

**Role:** Reusable building blocks referenced by templates and commercial rules.

---

### MaterialRegistry

| Attribute | Purpose |
|-----------|---------|
| `material_code` | Inventory/catalog id |
| `label` | Name |
| `unit` | Stock unit |
| `commercial_mapping` | Optional link to quote line basis |

**Role:** Structural/material truth. **Not** commercial price truth (that lives in CommercialRuleRegistry / owner-approved prices).

---

### OperationRegistry

| Attribute | Purpose |
|-----------|---------|
| `operation_code` | Stable id |
| `label` | Name |
| `workcenter_hint` | Future smartHub-adv hint only — not executed here |
| `rate_ref` | Internal costing reference (future CostEngine) |

**Role:** Defines **what operations exist** on a template. smartflow-adv uses operations for **commercial line mapping**, not shop-floor execution.

---

### CommercialRuleRegistry

| Attribute | Purpose |
|-----------|---------|
| `rule_set_code` | Versioned rule bundle |
| `template_code` | Applies to |
| `line_rules[]` | Line code, basis resolution, unit price source, blockers |
| `vat_policy_ref` | VAT rate source |
| `owner_decision_refs[]` | Required decisions before line is priced |

**Role:** **Contract surface** (legacy: Pricing Registry). Drives quote preview lines, blockers, and when totals may become non-null.

**Rules:**
- No commercial price by hour/minute for customer quotes.
- Unit prices come from owner-approved registry entries or explicit owner input — never UI guesswork.

---

### IntakeFieldRegistry

| Attribute | Purpose |
|-----------|---------|
| `schema_code` | Intake schema version |
| `template_code` | Bound template |
| `fields[]` | key, type, label, validation, visibility, default |
| `computed_fields[]` | Derived from other fields or SVG parser (later) |

**Role:** Backend publishes intake schema; frontend renders form dynamically. Replaces hardcoded `NewWorkspacePage` fields.

---

### OwnerDecisionRegistry

| Attribute | Purpose |
|-----------|---------|
| `decision_code` | Stable id (e.g. `DEBITARE_SPATE_BASIS_ML_VS_M2`) |
| `label`, `detail` | UX copy |
| `line_code` | Affected commercial line |
| `allowed_values[]` | Enum options |
| `required_before_pricing` | Boolean |

**Role:** Gating decisions that block preview until approved. Starter already models this pattern — must move from hardcoded Python to registry-driven.

---

### QuotePreviewContract

| Attribute | Purpose |
|-----------|---------|
| `request` | workspace_id, template_code, intake payload |
| `response` | status, lines[], blockers[], owner_decisions[], totals (nullable) |
| `modes` | `preview` vs `official_quote_source` |

**Role:** Stable API contract between intake, preview service, quotes route, and frontend. Preserves:

- `blocked` + null totals when rules incomplete
- `ready` only when backend confirms
- Official quote copies ready preview — no recompute in UI

---

## Registry dependency graph

```
ProductFamilyRegistry
        │
        ▼
ProductTemplateRegistry ──► IntakeFieldRegistry
        │                           │
        ├── ComponentRegistry       │
        ├── MaterialRegistry        │
        ├── OperationRegistry       │
        └── CommercialRuleRegistry ◄┘
                    │
                    ▼
         OwnerDecisionRegistry
                    │
                    ▼
         QuotePreviewContract
                    │
                    ▼
    (later) Official Quote / Snapshot / Offer
```

---

## Starter gap analysis

| Registry | In starter today | Action |
|----------|------------------|--------|
| ProductFamilyRegistry | Implicit single family | **Create** |
| ProductTemplateRegistry | Hardcoded `TPL-VOLUMETRIC-LETTERS_v2` | **Create** |
| ComponentRegistry | Hardcoded in `quote_preview_service.py` | **Create** |
| MaterialRegistry | Not present | **Create (minimal)** |
| OperationRegistry | Implicit in line labels | **Create** |
| CommercialRuleRegistry | Ad hoc in preview service | **Create** |
| IntakeFieldRegistry | Hardcoded in schema + form | **Create** |
| OwnerDecisionRegistry | Partial hardcoded in preview service | **Extract to registry** |
| QuotePreviewContract | Pydantic schemas exist | **Keep — formalize** |

---

## Phase 1 deliverables (systems foundation)

**Status: implemented (2026-07-01)**

### Backend layout

```
backend/app/domain/systems/
  models.py                 — Pydantic registry contracts
  product_families.py       — seed: volumetric_letters
  product_templates.py      — seed: frontlit + non_lit stub
  components.py             — 9 frontlit components
  materials.py              — minimal material catalog
  operations.py             — fabrication operations (internal basis only)
  commercial_rules.py       — 10 skeleton rules (no prices)
  intake_fields.py          — 16 intake field definitions
  owner_decisions.py        — 16 owner decision definitions
  registry_service.py       — read-only SystemsRegistryService

backend/app/api/routes/systems.py — read-only HTTP endpoints
backend/tests/test_systems_registry.py — registry + API tests
```

### Read-only API (`/api/v1/systems`)

| Method | Path |
|--------|------|
| GET | `/product-families` |
| GET | `/product-families/{family_code}` |
| GET | `/product-templates` |
| GET | `/product-templates/{template_code}` |
| GET | `/product-templates/{template_code}/components` |
| GET | `/product-templates/{template_code}/commercial-rules` |
| GET | `/product-templates/{template_code}/intake-fields` |
| GET | `/product-templates/{template_code}/owner-decisions` |

### Seed product data

| Code | Status |
|------|--------|
| `volumetric_letters` | Active family |
| `volumetric_letters_frontlit` | Full skeleton |
| `volumetric_letters_non_lit` | Draft stub only |

### Current limitations

- In-memory static seed — no DB, no admin CRUD
- Quote preview reads CommercialRuleRegistry (Phase 3 complete); workspace payload still uses legacy flat columns + intake snapshot notes (Phase 2B)
- No unit prices in registry responses — owner line prices keyed by `rule_code`
- `volumetric_letters_non_lit` has no components/rules

### Phase status

| Phase | Status |
|-------|--------|
| Phase 2 — Intake schema from systems | Complete (2026-07-01) |
| Phase 3 — Quote preview from rules | Complete (2026-07-01) — see worklog |

**Explicitly not in scope yet:** quote write hardening (Phase 4), snapshot, order.

---

## Naming migration (later)

| Legacy / starter | Target |
|------------------|--------|
| `intake-v6` routes | `intake` or `workspaces` |
| `workos_v6.db` | `smartflow_adv.db` |
| `WorkOS API` | `smartflow-adv API` |
| Intake V6 | Intake workspace (runtime instance) |
