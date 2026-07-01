import { NavLink, Route, Routes } from "react-router-dom";

import { DashboardPage } from "./pages/DashboardPage";
import { NewWorkspacePage } from "./pages/NewWorkspacePage";
import { WorkspacePreviewPage } from "./pages/WorkspacePreviewPage";


export default function App() {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">WorkOS reboot</p>
          <h1 className="sidebar-title">V6 clean commercial spine</h1>
          <p className="sidebar-copy">
            Intake V6 workspaces and quote previews stay backend-authoritative. No fake totals are shown.
          </p>
        </div>

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            Dashboard
          </NavLink>
          <NavLink to="/workspaces/new" className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}>
            New workspace
          </NavLink>
        </nav>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/workspaces/new" element={<NewWorkspacePage />} />
          <Route path="/workspaces/:workspaceId" element={<WorkspacePreviewPage />} />
        </Routes>
      </main>
    </div>
  );
}
