# smartflow-adv — Legacy Archive Audit

## Archives inspected

| Archive | Location | Notes |
|---------|----------|-------|
| `workos-vs-code_export_clean_2026-07-01_194251.zip` | `C:\Users\offic\Desktop\salvari 2\` | **Dirty export** — includes `backend/.venv`, `frontend/node_modules`, `__pycache__` |
| `workos-vs-code_export_clean_fixed_2026-07-01_194414.zip` | `smartFlow-adv/_archive_local/` | **Clean export** — source only; used for current repo |
| Current repo | `C:\Users\offic\Desktop\smartFlow-adv` | Matches clean export + audit/baseline docs |

**Source parity:** Application source files (`backend/app/*`, `frontend/src/*`, `docs/legacy-e2e-architecture.md`) are **byte-identical in size** between dirty and clean exports — same starter logic, different packaging hygiene.

**Do not use 194251 archive as import source** — it bundles environment artifacts.

---

## Starter audit table

| Area | File / module | What it does now | Good idea to keep | Risk | SmartFlow action |
|------|---------------|------------------|-------------------|------|------------------|
| Backend shell | `app/main.py` | FastAPI app, CORS, `/health` | Clean separation | WorkOS branding | **Keep** — rename |
| Routing | `app/api/router.py` | Mounts meta, intake-v6, quotes | Modular routes | Legacy prefix | **Keep** — rename routes |
| Intake routes | `routes/intake_v6.py` | Workspace CRUD, decisions, line prices, preview trigger | Backend-authoritative intake | Hardcoded V6 naming; no schema API | **Rewrite** — systems-driven |
| Quotes routes | `routes/quotes.py` | List previews/quotes; create quote from ready preview | Preview→quote gate | Good pattern, pre-systems | **Keep** — align with Phase 4 |
| Meta | `routes/meta.py` | Service metadata, `fake_totals: false` policy | Policy declaration | WorkOS name | **Keep** — update |
| Workspace store | `services/workspace_store.py` | SQLite: workspaces, previews, decisions, prices, quotes | Persistence pattern | `workos_v6.db`; flat workspace columns | **Rewrite** — schema from intake registry |
| Quote preview | `services/quote_preview_service.py` | Hardcoded volumetric lines, blockers, VAT | Blocked/null totals policy | **Hardcoded calculator** — wrong direction | **Rewrite** — CommercialRuleRegistry |
| Schemas intake | `schemas/intake_v6.py` | Fixed Pydantic fields for one template | Typed validation | Hardcoded field set | **Rewrite** — dynamic from registry |
| Schemas quotes | `schemas/quotes.py` | Preview/quote/line/blocker models | QuotePreviewContract base | Solid | **Keep** — formalize contract |
| Frontend shell | `App.tsx` | Nav + routes | Minimal SPA | WorkOS copy | **Keep** — rebrand |
| Dashboard | `DashboardPage.tsx` | Lists workspaces, previews, quotes | Backend lists | Fine for dev | **Keep** — later polish |
| New workspace | `NewWorkspacePage.tsx` | **Hardcoded form** for volumetric letters | Create flow UX | **Systems violation** | **Rewrite** — schema-driven |
| Preview page | `WorkspacePreviewPage.tsx` | Preview build, decisions, prices, quote create | Backend-only totals display | Manual price inputs OK for owner gate | **Keep** — wire to rules later |
| API client | `lib/api.ts` | Typed fetch wrappers | Clean client | `/intake-v6` paths | **Keep** — extend for systems APIs |
| Legacy docs | `legacy-e2e-architecture.md` | Full WorkOS E2E truth layers + menu survey | Truth layer concepts | Entire menu scope | **Reference only** |
| Bundled DB | `workos_v6.db` / `.demo.local.db` | Demo workspaces, priced quotes | Schema reference | **Fake production truth** | **Remove from repo** — local disposable |
| Config | `requirements.txt`, `package.json` | Minimal deps | Lean stack | Fine | **Keep** |
| README / gitignore | Root | Setup notes | Hygiene | Updated in baseline | **Keep** |

---

## Legacy documentation audit (`legacy-e2e-architecture.md`)

### What survives into smartflow-adv

| Concept | Legacy source | smartflow-adv use |
|---------|---------------|-------------------|
| Truth layer separation | Core conclusion | Foundation for all architecture docs |
| Intake as runtime request truth | Intake V6 section | Intake workspace — instance, not catalog |
| Product System as structural truth | Product System section | ProductFamily/Template/Component registries |
| Pricing/Cost as calculation truth, not UI truth | Pricing section | CommercialRuleRegistry; CostEngine later/internal |
| Quotes as frozen commercial truth | Quotes section | Official quote + snapshot phases |
| Settings don't rewrite frozen history | Settings section | VAT/policy frozen at snapshot |
| Pricing Registry as contract surface | Pricing Registry route | CommercialRuleRegistry design |
| Module chain / handoff contracts | Module Chain route | Informs smartflow→smartHub boundary |
| Governance: UI truth rules | Governance route | No fake totals, backend authoritative |
| Backend-authoritative readiness | Quotes page interpretation | Preview blocked until ready |

### What stays legacy / reference only

| Concept | Reason |
|---------|--------|
| Full WorkOS menu (Dashboard KPIs, Shop Floor, Operator, Tablet) | Operational visibility — not smartflow-adv |
| Orders pipeline | Downstream of quote snapshot |
| Execution / execution plan / materialization audit | smartHub-adv / execution products |
| Tasks | Task Graph forbidden |
| Inventory procurement pages | Separate inventory domain |
| HR, Attendance, Employee Payments, Advances | HR products |
| Utilaje (machines) | Production infrastructure |
| Colaboratori page as routing | Becomes smartHub-adv partner registry later |
| Reports / Control Tower | Management analytics — not intake/quote |
| Governance UI as product feature | Principles extracted to docs only |
| Full module chain implementation | Reference for boundaries, not code import |

### What belongs later to smartHub-adv

| Item | Role |
|------|------|
| Partner / colaboratori routing | Production network |
| Orders after commercial approval | Handoff from frozen quote |
| Execution plan generation | Shop operations |
| Task assignment / operator / tablet | Floor execution |
| Shop floor visibility | Live production |
| Machine registry (Utilaje) | Capacity/routing inputs |

### What is forbidden now

- ProductAggregate, Task Graph, ExecutionPlan, Employee Mobile
- smartHub partner routing
- Orders, execution, shop floor UI
- Importing legacy menu as smartflow-adv scope
- Hardcoded form + hardcoded calculator as architecture
- V2/V4 rollback
- Fake totals / hardcoded prices / frontend as commercial truth

---

## Hardcoded risk map

| Hardcoded area | Current file | Why risky | Temp acceptable? | Replacement system | Phase |
|----------------|--------------|-----------|------------------|-------------------|-------|
| Intake form fields (title, width, perimeter, LED, …) | `NewWorkspacePage.tsx` + `schemas/intake_v6.py` | Form defines product truth instead of systems | **No** — wrong direction | IntakeFieldRegistry + dynamic form | 2 |
| Default demo geometry values | `NewWorkspacePage.tsx` `initialState` | Implies one product shape | Dev only | Template-specific schema defaults from registry | 2 |
| Quote line catalog (6+ hardcoded lines) | `quote_preview_service.py` | Calculator embedded in code | **No** | CommercialRuleRegistry + ComponentRegistry | 3 |
| Owner decisions inline | `quote_preview_service.py` | Decisions not data-driven | Short-term | OwnerDecisionRegistry | 1→3 |
| Single template default | `intake_v6.py` schema default | One product family assumed | Short-term | ProductTemplateRegistry | 1 |
| VAT_RATE constant | `quote_preview_service.py` | Should be policy ref | Yes until settings | CommercialRuleRegistry / settings snapshot | 3→5 |
| Workspace flat columns | `workspace_store.py` | Cannot support multiple templates | **No** | JSON intake payload validated by schema | 2 |
| DB filename `workos_v6.db` | `workspace_store.py` | Legacy naming | Yes | `smartflow_adv.db` | 1 |
| API title "WorkOS API" | `main.py` | Wrong product | Yes | smartflow-adv API | 1 |
| Route prefix `intake-v6` | `router.py`, `api.ts` | Legacy naming | Yes | `/intake` or `/workspaces` | 1 |
| Frontend package name | `package.json` | workos-vs-code-frontend | Yes | smartflow-adv-frontend | 1 |
| Demo DB priced quotes | `workos_v6.demo.local.db` | Looks like real pricing | **Never** | Empty local DB only | 0 ✓ |

---

## Intentionally not imported from archive

1. **Environment junk** from 194251 zip (venv, node_modules, pycache)
2. **Demo priced quote data** — quarantined as `.demo.local.db`
3. **Full WorkOS operational menu** — documented as reference only
4. **ProductAggregate / Task Graph / ExecutionPlan** patterns
5. **Employee Mobile** and HR modules
6. **smartHub routing** and partner assignment logic
7. **Hardcoded commercial prices** from test sessions in demo DB

---

## Archive vs systems-first direction

The starter is **architecturally aligned** on:

- Backend-authoritative preview
- Blocked/null totals policy
- Separate official quote creation
- Owner decision gating

The starter is **misaligned** on:

- Hardcoded intake form (frontend + schema)
- Hardcoded quote lines (backend service)
- Missing registry layer entirely
- WorkOS naming throughout

**Conclusion:** Starter is a **useful scaffold**, not a systems foundation. Phase 1 must add registries before rewriting preview/calculator.

---

## Related documents created

- `SMARTFLOW_ADV_PRODUCT_BOUNDARY.md`
- `SMARTFLOW_ADV_TARGET_SPINE.md` (updated)
- `SMARTFLOW_ADV_SYSTEMS_FOUNDATION.md`
- `SMARTFLOW_ADV_IMPLEMENTATION_ROADMAP.md`
- This audit
