import { Route, Routes } from "react-router-dom";

import { AppShell } from "./components/layout/AppShell";
import { DashboardPage } from "./pages/DashboardPage";
import { NewWorkspacePage } from "./pages/NewWorkspacePage";
import { WorkspacePreviewPage } from "./pages/WorkspacePreviewPage";


export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/workspaces/new" element={<NewWorkspacePage />} />
        <Route path="/workspaces/:workspaceId" element={<WorkspacePreviewPage />} />
      </Routes>
    </AppShell>
  );
}
