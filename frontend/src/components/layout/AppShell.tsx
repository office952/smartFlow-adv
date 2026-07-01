import type { ReactNode } from "react";

import { SideNav } from "./SideNav";
import { TopBar } from "./TopBar";


type AppShellProps = {
  children: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="app-shell">
      <SideNav />
      <div className="app-main">
        <TopBar />
        <main className="app-content">{children}</main>
      </div>
    </div>
  );
}
