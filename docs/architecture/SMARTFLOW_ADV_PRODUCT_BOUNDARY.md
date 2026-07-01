# smartflow-adv — Product Boundary

## What smartflow-adv is

**smartflow-adv** is the advertising production **calculation / intake / quote / offer** application.

It owns the path from product-system-driven intake through backend quote preview, official priced quote, quote snapshot, and client-facing offer output.

| Responsibility | Description |
|----------------|-------------|
| Product systems surface | Registries for families, templates, components, materials, operations, commercial rules, intake fields |
| Intake workspace | Runtime truth for one concrete client request instance |
| Quote preview | Backend-exploratory pricing; may be blocked with null totals |
| Official priced quote | Commercial truth created only from a ready preview |
| Quote snapshot | Frozen offer record |
| Offer output | Export / preview for client review |

## What smartflow-adv is not

| Out of scope | Belongs to |
|--------------|------------|
| Partner network, routing, production handoff | **smartHub-adv** (later) |
| Order approval and frozen order snapshots | smartHub-adv / downstream ops |
| Execution plan, task graph, shop floor | smartHub-adv / execution products |
| Operator tablet, employee mobile | smartHub-adv / HR ops |
| HR, attendance, payroll, advances | Separate HR products |
| Inventory procurement and stock movement | Inventory / ERP boundary |
| Machine registry (Utilaje) | Production infrastructure / smartHub-adv |
| Full legacy WorkOS menu (Control Tower, Reports, Governance UI) | Legacy reference only |

## smartflow-adv vs smartHub-adv

```
smartflow-adv                         smartHub-adv (later)
─────────────────                     ────────────────────
What to make & at what price    →     Who makes it & how it routes
Intake + quote + offer                  Partners + routing + production network
Systems → form → preview → quote        Orders → execution → tasks
Commercial truth ends at snapshot       Operational truth begins after handoff
```

**Handoff rule:** smartflow-adv produces a **frozen quote snapshot / offer**. smartHub-adv consumes approved commercial truth later — not during smartflow-adv Phase 1–6.

## Forbidden modules (now)

Do not implement or import in smartflow-adv current phases:

- ProductAggregate
- Task Graph
- ExecutionPlan
- Employee Mobile
- smartHub-adv partner / routing logic
- Orders pipeline
- Shop Floor / Operator / Atelier Tablet
- V2/V4 rollback paths
- Hardcoded frontend calculator as commercial truth
- Fake totals or hardcoded quote prices

## Systems-first build order

```
1. Registries & contracts (systems)
2. Intake schema from systems (generated / driven form)
3. Quote preview from commercial rules
4. Official priced quote
5. Quote snapshot
6. Offer output
```

**Wrong order (forbidden as primary path):** hardcoded form → hardcoded calculator → quote.

## Truth authority summary

| Layer | Authority | smartflow-adv role |
|-------|-----------|-------------------|
| Product structure | Product System registries | Define templates/components |
| Runtime request | Intake workspace | Capture instance |
| Calculation | Commercial rules + preview engine | Backend only |
| Commercial | Official quote + snapshot | Backend only |
| UI | Display + input collection | Never invent totals |
