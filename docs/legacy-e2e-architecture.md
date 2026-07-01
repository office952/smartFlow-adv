# Legacy E2E Architecture Notes

This document captures the studied architecture of the previous WorkOS application and preserves the product ideas that must survive in the clean repo.

It is not a code migration checklist. It is the functional and architectural reference for rebuilding the new application coherently.

## Core conclusion

The previous application is not just an intake screen with some surrounding pages. It is a modular operational-commercial system with distinct truth layers.

The canonical flow observed in the legacy app is:

`Operational Core -> Work Intake -> Product System -> CostEngine/Pricing -> Quotes -> Orders -> WorkOS/Execution -> Tasks`

This means the new repo must not collapse everything into a single `Intake V6` implementation.

## Truth layers

### Intake V6

`Intake V6` is the runtime truth of the concrete product request.

It holds the request-specific product inputs such as:

- dimensions
- quantities
- selected options
- mounting and lighting options
- request constraints
- the canonical runtime fields required by downstream calculation

It is the truth of the requested instance, not the whole product universe.

### Product System

`Product System` is the structural truth of the product family.

It defines:

- templates
- modules
- components
- materials
- operations
- workflow
- dossier/blueprint-level product structure

It must exist independently from any single intake.

### Pricing and CostEngine

`Pricing` and `CostEngine` are the internal calculation truth.

From the legacy app, Pricing explicitly states that it is:

- internal pricing input
- not canonical commercial truth
- not execution truth

It links the selected product structure to:

- inventory materials
- operational rates
- task linkage
- workcenters and machines
- employee/cost linkage

### Quotes

`Quotes` are the frozen commercial truth.

The legacy app explicitly treats quote readiness as backend-canonical and not a UI invention. Commercial truth appears only after the quote snapshot is frozen.

### Orders

`Orders` are the approved and frozen downstream truth.

This is the snapshot that should feed execution planning and later execution reality.

### Execution

`Execution` is the operational truth that compares plan against captured reality.

The legacy app consistently shows execution pages as backend-authoritative and audit-oriented. The UI does not invent missing reality.

## Menu documentation

The following sections summarize the studied pages from the legacy app menu, from Dashboard to Settings.

### Control Tower

Route: `/dashboard`

Purpose:

- top-level operational dashboard
- quick KPI surface for management

Observed content:

- active jobs
- blocked jobs
- OTIF
- throughput
- machine utilization
- delivery risk summary

### Shop Floor

Route: `/shop-floor`

Purpose:

- live production visibility by workcenter and machine

Observed content:

- queues by workcenter
- active/idle machine status
- blocked jobs
- utilization and runtime views

### Operator

Route: `/operator`

Purpose:

- manual orchestration of execution work

Observed content:

- active employee selection
- operator eligibility preview for operations
- task assignment from execution plan
- manual execution instructions
- critical material status
- task timeline

### Atelier Tablet

Route: `/tablet`

Purpose:

- simplified station-oriented workshop view

Observed content:

- station cards
- queue counts
- in-progress counts
- blocked counts
- operator/help indicators

### Clients

Route: `/clients`

Purpose:

- client registry and commercial overview

Observed content:

- client list
- contact/entity status
- total revenue hints
- recent activity dates

### Work Intake

Route: `/intake`

Purpose:

- intake registry and entry point for requests

Observed content:

- new requests
- in-analysis requests
- missing-info buckets
- ready-for-quote buckets
- blocked buckets
- request search and list

Important interpretation:

`Work Intake` is where the concrete request is captured. It is not the whole product truth stack, but it is the source of runtime truth for the requested product instance.

### Quotes

Route: `/quotes`

Purpose:

- commercial quote registry and pipeline

Observed content:

- draft and accepted filters
- client-linked offers
- source request references
- line counts
- margin hints
- validity windows

Important interpretation:

The page explicitly states that quote readiness is decided canonically in the backend by ProductSystem, CostEngine, and Quotes policy.

### Orders

Route: `/orders`

Purpose:

- frozen approved commercial snapshots ready for downstream use

Observed content:

- order list
- frozen status
- payment state
- client and deadline references
- detail selection surface

### Execution

Routes: `/execution` and `/execution/{order_id}`

Purpose:

- backend-authoritative execution dashboard and audit detail

Observed content:

- order plan presence
- execution reality presence
- alert state
- planned vs actual minutes
- execution detail truth layer
- operational actions to capture reality
- execution plan generation gate
- materialization audit

Important interpretation:

Execution pages strongly enforce read-only truth principles. They treat reality capture as a backend concern and refuse to substitute missing values in the UI.

### Documents

Route: `/documents`

Purpose:

- document center over the commercial and operational lifecycle

Observed content:

- commercial offers
- order confirmations
- contracts
- invoices
- delivery and acceptance documents
- guarantees and technical sheets

Important interpretation:

The lifecycle is broader than quotes and orders alone. Documents sit above frozen commercial and operational snapshots.

### Inventory and Procurement

Route: `/inventory`

Purpose:

- stock, suppliers, receipts, consumption

Observed content:

- material criticality
- stock levels
- remaining days
- supplier linkage
- stock movement hints

Important interpretation:

The page explicitly separates operational acquisition pricing from commercial quote pricing.

### Pricing Registry

Route: `/inventory/pricing`

Purpose:

- contract surface between the selected runtime template and downstream costing/execution inputs

Observed content:

- downstream template linkage
- material coverage by template
- operation/rate coverage
- owner-confirmed vs review-needed entries
- linkage to inventory, tasks, workcenters, and future employee/machine materialization

Important interpretation:

This page is one of the clearest proofs that the intended system is modular. The runtime template activates a set of product modules, and Pricing binds those modules to calculable materials and rates.

### Product System

Route: `/product-system`

Purpose:

- template and product-family registry

Observed content:

- product families
- templates
- component counts
- operation counts
- material counts
- workflow validity
- blueprint and dossier-oriented editing affordances

Important interpretation:

This is the structural product core. `Intake V6` should consume this layer, not replace it.

### Colaboratori

Route: `/colaboratori`

Purpose:

- external partner registry

Observed content:

- makers/fabricators
- service providers
- preferred partners
- outsourced value hints

### Utilaje

Route: `/utilaje`

Purpose:

- machine registry and execution infrastructure

Observed content:

- machine list
- workcenter grouping
- machine state
- utilization hints
- read-only note that creation is blocked by backend limitations in this build

### Reports

Route: `/reports`

Purpose:

- operational analytics over production reality

Observed content:

- throughput
- OTIF
- rework rate
- machine utilization
- lead time
- short-range revenue indicators

### Employees

Route: `/employees`

Purpose:

- operational employee registry

Observed content:

- employee status
- productive vs indirect classification
- mobile access state
- cost completeness hints
- explicit reference to CostEngine participation

Important interpretation:

This page separates operational people truth from payroll truth and shows that employee data is a downstream input into costing/execution.

### Internal HR Records

Route: `/employees-records`

Purpose:

- internal HR administration layer

Observed content:

- employee records
- document expiry hints
- medicine-of-work reminders
- local/demo framing

### Attendance

Route: `/attendance`

Purpose:

- attendance and time-exception ledger

Observed content:

- standard hours
- monthly events
- absence and overtime tracking
- employee summaries

### Employee Payments

Route: `/employee-payments`

Purpose:

- internal payment tracking

Observed content:

- calculated vs paid vs remaining
- mid-month and end-month tranches
- filters by payment status
- payment entry flow

### Employee Advances and Debts

Route: `/employee-advances`

Purpose:

- ledger for advances, loans, and deductions

Observed content:

- transactions
- balance summaries
- per-employee active balances

### Module Chain

Route: `/modules`

Purpose:

- canonical handoff map across business modules

Observed content:

- the modular chain from Operational Core to Tasks
- payload contracts between modules
- explicit forbidden mutations after handoff

Important interpretation:

This route is the strongest architectural statement in the old app. It proves the intended system is a modular chain with contract boundaries, not a monolith centered on one screen.

### Governance

Route: `/governance`

Purpose:

- canonical governance, truth rules, and source-of-authority guidance

Observed content:

- canonical flow
- status flows
- source-of-truth views
- guardrails
- ready-for-quotes guidance
- UI truth rules

### Settings

Route: `/settings`

Purpose:

- cross-cutting configuration and policy inputs

Observed content:

- company profile
- offer VAT setting
- EUR/RON rate
- payments tab
- CostEngine tab
- integrations tab

Important interpretation:

Settings affect policy inputs but do not rewrite frozen historical truth. The legacy app explicitly states that offers persist their VAT snapshot at generation time.

## Canonical rebuild interpretation for the new repo

The new repo should preserve the following domain rule set:

1. `Intake V6` is the canonical runtime truth of the requested product instance.
2. `Product System` is the structural truth of the reusable product family.
3. `Pricing/CostEngine` is the internal calculation truth.
4. `Quotes` are the frozen commercial truth.
5. `Orders` are the approved downstream truth.
6. `Execution reality` is the operational truth captured against plan.

## What this means for implementation

The clean repo should evolve toward a modular platform, not a one-off intake application.

Practical implications:

- `Intake V6` must remain backend-authoritative for request-specific product truth.
- future intakes should be variants over the same modular product foundation
- Product System definitions must be reusable outside a single intake surface
- pricing and cost rules must stay distinct from inventory stock truth
- quotes and orders must remain snapshot-driven, not recomputed implicitly in the UI
- execution must stay reality-first and backend-authoritative

## Immediate architectural guidance

When extending the clean repo, treat `Intake V6` as one runtime adapter into a broader modular engine:

- intake captures request truth
- product system resolves structure
- cost engine resolves internal cost
- commercial engine resolves quote output
- orders freeze the approved result
- execution works only from frozen downstream truth and captured reality