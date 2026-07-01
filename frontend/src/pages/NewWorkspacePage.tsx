import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  SystemDrivenIntakeForm,
  type SystemDrivenIntakeSubmitPayload,
} from "../components/intake/SystemDrivenIntakeForm";
import { PageHeader } from "../components/ui/PageHeader";
import {
  adaptSystemIntakeToWorkspaceCreate,
  canAdaptTemplateToLegacyWorkspace,
  validateOwnerDecisions,
} from "../lib/intakeWorkspaceAdapter";
import { createWorkspace, updateOwnerDecision } from "../lib/api";
import { getTemplateIntakeFields, getTemplateOwnerDecisions } from "../lib/systemsApi";


export function NewWorkspacePage() {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  async function handleSubmit(payload: SystemDrivenIntakeSubmitPayload) {
    setSaving(true);
    setError(null);

    try {
      if (!canAdaptTemplateToLegacyWorkspace(payload.templateCode)) {
        setError(`Template "${payload.templateCode}" cannot be submitted yet. Legacy workspace API alignment pending (Phase 2B).`);
        return;
      }

      const [intakeFields, ownerDecisionDefs] = await Promise.all([
        getTemplateIntakeFields(payload.templateCode),
        getTemplateOwnerDecisions(payload.templateCode),
      ]);

      const ownerIssues = validateOwnerDecisions(ownerDecisionDefs, payload.ownerDecisionValues);
      const adapted = adaptSystemIntakeToWorkspaceCreate(
        payload.templateCode,
        payload.meta,
        payload.intakeValues,
        intakeFields,
      );

      const issues = [...ownerIssues, ...(adapted.ok ? [] : adapted.issues)];
      if (issues.length > 0) {
        setError(issues.join(" "));
        return;
      }

      if (!adapted.ok) {
        setError("Workspace payload could not be adapted.");
        return;
      }

      const workspace = await createWorkspace(adapted.payload);

      for (const decision of ownerDecisionDefs) {
        const selected = payload.ownerDecisionValues[decision.decision_code]?.trim();
        if (!selected) {
          continue;
        }
        await updateOwnerDecision(workspace.id, decision.decision_code, {
          code: decision.decision_code,
          label: decision.label,
          detail: decision.notes ?? `Owner decision from system-driven intake: ${decision.label}`,
          line_code: null,
          status: "approved",
          selected_value: selected,
          resolution_notes: "Captured during Phase 2 system-driven workspace create",
        });
      }

      navigate(`/workspaces/${workspace.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace creation failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Intake"
        title="New workspace"
        description="Form fields and owner decisions are generated from backend product systems registries — not hardcoded in React."
      />

      <SystemDrivenIntakeForm onSubmit={handleSubmit} submitting={saving} submitError={error} />
    </section>
  );
}
