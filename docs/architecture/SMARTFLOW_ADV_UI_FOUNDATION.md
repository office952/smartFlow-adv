# smartflow-adv — UI Foundation

## Purpose

Provide a reusable, professional UI shell for smartflow-adv without embedding calculator or commercial logic in the frontend.

Phase 1B establishes layout, design tokens, light/dark theme, and primitive components. Business pages consume backend truth; they do not compute official totals.

---

## UI principles

1. **Backend/system truth only** — totals, blockers, readiness from API responses.
2. **UI does not calculate official totals** — display backend values or `"blocked"` / null labels.
3. **UI may show preview status, blockers, readiness** — never invent commercial numbers.
4. **Reusable components** — pages compose `PageHeader`, `Card`, `Section`, etc.
5. **Token-based theming** — one component set; `data-theme` switches palette.
6. **No heavy UI library** — plain React + CSS variables (no MUI/shadcn in Phase 1B).

---

## Page structure

```
AppShell
├── SideNav        — product-scoped navigation
├── TopBar         — context + ThemeToggle
└── app-content
    └── Route page — panel + PageHeader + sections
```

### Navigation scope (smartflow-adv only)

| Item | Route | Status |
|------|-------|--------|
| Dashboard | `/` | Active |
| Workspaces | `/workspaces/new`, `/workspaces/:id` | Active |
| Product Systems | `/systems` | Active (read-only explorer) |
| Quote Preview | — | Disabled |
| Offers | — | Disabled |
| Settings | — | Disabled |

**Excluded:** Orders, Execution, Tasks, Employees, smartHub, Shop Floor.

---

## Theme strategy

| Item | Value |
|------|-------|
| Storage key | `smartflow-theme` |
| Root attribute | `data-theme="light"` \| `data-theme="dark"` |
| Provider | `ThemeProvider` + `useTheme()` |
| Toggle | `ThemeToggle` in top bar |
| Initial load | `applyTheme(resolveInitialTheme())` before React render |

### Design tokens (CSS variables)

- `--sf-bg`, `--sf-surface`, `--sf-surface-muted`
- `--sf-text`, `--sf-text-muted`
- `--sf-border`, `--sf-accent`
- `--sf-success`, `--sf-warning`, `--sf-danger`

Pages and legacy classes reference tokens — not hardcoded hex in page files.

---

## Component list

### Layout

| Component | Path |
|-----------|------|
| AppShell | `components/layout/AppShell.tsx` |
| TopBar | `components/layout/TopBar.tsx` |
| SideNav | `components/layout/SideNav.tsx` |

### UI primitives

| Component | Path |
|-----------|------|
| Button | `components/ui/Button.tsx` |
| Card | `components/ui/Card.tsx` |
| Badge | `components/ui/Badge.tsx` |
| PageHeader | `components/ui/PageHeader.tsx` |
| Section | `components/ui/Section.tsx` |
| EmptyState | `components/ui/EmptyState.tsx` |
| ThemeToggle | `components/ui/ThemeToggle.tsx` |

---

## Forbidden UI behavior

- Frontend quote calculator or formula evaluation
- Hardcoded commercial line prices presented as truth
- Inventing totals when backend returns null/blocked
- Official quote creation UX changes beyond existing backend calls (Phase 1B)
- Navigation to orders, execution, smartHub, HR, shop floor

---

## How UI consumes backend systems (Phase 2+)

1. **Product Systems page** — `GET /api/v1/systems/product-templates`
2. **Dynamic intake form** — `GET .../intake-fields` + `.../owner-decisions` via `SystemDrivenIntakeForm`
3. **Quote preview page** — preview API; component-grouped rule cards; owner prices by `rule_code` (Phase 3B)
4. **Offers page** — snapshot/export from frozen backend records

Form fields will be **generated from registry schema**, replacing `NewWorkspacePage` hardcoded inputs.

---

## Implementation files (Phase 1B)

```
frontend/src/theme/ThemeProvider.tsx
frontend/src/theme/themeStorage.ts
frontend/src/components/layout/*
frontend/src/components/ui/*
frontend/src/styles.css          — tokens + layout + primitives
```

---

## Current limitations

- Phase 2B workspace payload schema still pending (legacy adapter + notes snapshot)
- Offers nav item disabled
- No frontend test suite yet — build verification only
- Package name still `workos-vs-code-frontend` (rename later)

### Quote preview components (Phase 3B)

| Component | Path |
|-----------|------|
| QuotePreviewSummary | `components/quote-preview/QuotePreviewSummary.tsx` |
| QuotePreviewLineGroup | `components/quote-preview/QuotePreviewLineGroup.tsx` |
| QuotePreviewLineCard | `components/quote-preview/QuotePreviewLineCard.tsx` |
| OwnerRulePriceEditor | `components/quote-preview/OwnerRulePriceEditor.tsx` |
| PreviewBlockersPanel | `components/quote-preview/PreviewBlockersPanel.tsx` |
| OwnerDecisionsPanel | `components/quote-preview/OwnerDecisionsPanel.tsx` |
| Preview utils | `lib/quotePreviewUtils.ts` |
