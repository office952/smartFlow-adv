import { NavLink, useLocation } from "react-router-dom";


export type NavItem = {
  label: string;
  to?: string;
  end?: boolean;
  matchPrefix?: string;
  disabled?: boolean;
  hint?: string;
};

export const SMARTFLOW_NAV: NavItem[] = [
  { label: "Dashboard", to: "/", end: true },
  { label: "Workspaces", to: "/workspaces/new", matchPrefix: "/workspaces" },
  { label: "Product Systems", to: "/systems", matchPrefix: "/systems" },
  { label: "Quote Preview", disabled: true, hint: "Soon" },
  { label: "Offers", disabled: true, hint: "Soon" },
  { label: "Settings", disabled: true, hint: "Soon" },
];

function isActiveItem(item: NavItem, pathname: string) {
  if (!item.to) {
    return false;
  }
  if (item.end) {
    return pathname === item.to;
  }
  if (item.matchPrefix) {
    return pathname.startsWith(item.matchPrefix);
  }
  return pathname.startsWith(item.to);
}

export function SideNav() {
  const { pathname } = useLocation();

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__brand">
        <p className="app-sidebar__eyebrow">smartflow-adv</p>
        <h1 className="app-sidebar__title">Intake &amp; Quote</h1>
        <p className="app-sidebar__copy">
          Systems-driven intake and backend-authoritative quote preview. UI never owns commercial totals.
        </p>
      </div>

      <nav className="app-sidebar__nav" aria-label="Primary">
        {SMARTFLOW_NAV.map((item) => {
          if (item.disabled) {
            return (
              <span key={item.label} className="app-nav-link app-nav-link--disabled" aria-disabled="true">
                <span>{item.label}</span>
                {item.hint ? <small>{item.hint}</small> : null}
              </span>
            );
          }

          const active = isActiveItem(item, pathname);
          return (
            <NavLink
              key={item.label}
              to={item.to!}
              end={item.end}
              className={active ? "app-nav-link active" : "app-nav-link"}
            >
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      <p className="app-sidebar__footnote">Phase 2 — system-driven intake from backend registries.</p>
    </aside>
  );
}
