import { ThemeToggle } from "../ui/ThemeToggle";


export function TopBar() {
  return (
    <header className="app-topbar">
      <div>
        <p className="app-topbar__label">Production quotation workspace</p>
        <p className="app-topbar__meta">Backend systems truth · Preview may be blocked</p>
      </div>
      <ThemeToggle />
    </header>
  );
}
