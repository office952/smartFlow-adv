import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";

import { OwnerDecisionsPanel } from "../components/quote-preview/OwnerDecisionsPanel";
import { PreviewBlockersPanel } from "../components/quote-preview/PreviewBlockersPanel";
import { QuotePreviewLineGroup } from "../components/quote-preview/QuotePreviewLineGroup";
import { QuotePreviewSummary } from "../components/quote-preview/QuotePreviewSummary";
import { PageHeader } from "../components/ui/PageHeader";
import { Section } from "../components/ui/Section";
import {
  QuoteOwnerDecision,
  QuotePreview,
  WorkspaceDetail,
  buildQuotePreview,
  createCommercialQuoteFromPreview,
  getWorkspace,
  updateLinePrice,
  updateOwnerDecision,
} from "../lib/api";
import { collectUniqueBlockers, groupLinesByComponent } from "../lib/quotePreviewUtils";


export function WorkspacePreviewPage() {
  const { workspaceId } = useParams();
  const [workspace, setWorkspace] = useState<WorkspaceDetail | null>(null);
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [creatingQuote, setCreatingQuote] = useState(false);
  const [savingDecisionCode, setSavingDecisionCode] = useState<string | null>(null);
  const [savingPriceCode, setSavingPriceCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quoteMessage, setQuoteMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function load() {
      if (!workspaceId) {
        return;
      }

      try {
        const data = await getWorkspace(workspaceId);
        if (!active) {
          return;
        }
        setWorkspace(data);
      } catch (cause) {
        if (!active) {
          return;
        }
        setError(cause instanceof Error ? cause.message : "Workspace load failed.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [workspaceId]);

  const lineGroups = useMemo(
    () => (preview ? groupLinesByComponent(preview.lines) : []),
    [preview],
  );

  const allBlockers = useMemo(
    () => (preview ? collectUniqueBlockers(preview) : []),
    [preview],
  );

  async function refreshPreview() {
    if (!workspaceId) {
      return;
    }

    setBuilding(true);
    setError(null);
    try {
      const data = await buildQuotePreview(workspaceId);
      setPreview(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Preview build failed.");
    } finally {
      setBuilding(false);
    }
  }

  async function handleDecisionChange(
    decision: QuoteOwnerDecision,
    patch: Partial<Pick<QuoteOwnerDecision, "status" | "selected_value" | "resolution_notes">>,
  ) {
    if (!workspaceId || !preview) {
      return;
    }

    setSavingDecisionCode(decision.code);
    setError(null);
    const payload = {
      code: decision.code,
      label: decision.label,
      detail: decision.detail,
      line_code: decision.line_code,
      status: patch.status ?? decision.status,
      selected_value: patch.selected_value ?? decision.selected_value,
      resolution_notes: patch.resolution_notes ?? decision.resolution_notes,
    };

    try {
      await updateOwnerDecision(workspaceId, decision.code, payload);
      await refreshPreview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Owner decision update failed.");
    } finally {
      setSavingDecisionCode(null);
    }
  }

  async function handleRulePriceSave(ruleCode: string, unitPrice: number) {
    if (!workspaceId || !preview) {
      return;
    }

    setSavingPriceCode(ruleCode);
    setError(null);
    try {
      await updateLinePrice(workspaceId, ruleCode, {
        line_code: ruleCode,
        unit_price: unitPrice,
        currency: preview.currency,
        notes: null,
      });
      await refreshPreview();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Owner price save failed.");
    } finally {
      setSavingPriceCode(null);
    }
  }

  async function handleCreateQuote() {
    if (!workspaceId || !preview || preview.status !== "ready") {
      return;
    }

    setCreatingQuote(true);
    setError(null);
    setQuoteMessage(null);
    try {
      const result = await createCommercialQuoteFromPreview(workspaceId);
      setQuoteMessage(`Created ${result.quote.quote_code} with total ${result.quote.total_gross} ${result.quote.currency}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Commercial quote creation failed.");
    } finally {
      setCreatingQuote(false);
    }
  }

  if (loading) {
    return <section className="panel">Loading workspace...</section>;
  }

  if (!workspace) {
    return <section className="panel">Workspace not found.</section>;
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Quote preview"
        title={workspace.title}
        description={`Client: ${workspace.client_name}. Legacy template: ${workspace.template_code}. Preview status, blockers, and totals are backend-only.`}
      />

      {error ? <div className="error-box">{error}</div> : null}
      {quoteMessage ? <div className="note">{quoteMessage}</div> : null}

      <div className="grid-two">
        <Section title="Workspace inputs" description="Read-only workspace envelope from intake API.">
          <table className="table">
            <tbody>
              <tr><th>Width</th><td>{workspace.width_mm} mm</td></tr>
              <tr><th>Height</th><td>{workspace.height_mm} mm</td></tr>
              <tr><th>Letter count</th><td>{workspace.letter_count}</td></tr>
              <tr><th>Perimeter</th><td>{workspace.letter_perimeter_m} m</td></tr>
              <tr><th>Face area</th><td>{workspace.letter_face_area_m2} m2</td></tr>
              <tr><th>Return depth</th><td>{workspace.return_depth_mm} mm</td></tr>
              <tr><th>LED modules</th><td>{workspace.led_module_count ?? "—"}</td></tr>
              <tr><th>Selected PSU watts</th><td>{workspace.selected_psu_watts ?? "—"}</td></tr>
            </tbody>
          </table>
        </Section>

        <div className="summary">
          {!preview ? (
            <>
              <span className="badge">Commercial preview</span>
              <p>No preview generated yet. Build preview to load registry-driven commercial rules.</p>
              <div className="actions">
                <button className="button" type="button" onClick={() => void refreshPreview()} disabled={building}>
                  {building ? "Building..." : "Build quote preview"}
                </button>
              </div>
            </>
          ) : (
            <QuotePreviewSummary
              preview={preview}
              building={building}
              creatingQuote={creatingQuote}
              onBuildPreview={() => void refreshPreview()}
              onCreateQuote={() => void handleCreateQuote()}
            />
          )}
        </div>
      </div>

      {preview ? (
        <div className="stack">
          <div className="note">
            Owner prices save with <code>rule_code</code> as the storage key. The UI never calculates line totals or preview readiness.
          </div>

          <PreviewBlockersPanel blockers={allBlockers} />

          <OwnerDecisionsPanel
            decisions={preview.owner_decisions}
            savingDecisionCode={savingDecisionCode}
            onDecisionChange={(decision, patch) => {
              void handleDecisionChange(decision, patch);
            }}
          />

          <Section
            title="Commercial rules by component"
            description="Grouped from backend preview lines — one card per commercial rule."
          >
            <div className="quote-line-groups">
              {lineGroups.map((group) => (
                <QuotePreviewLineGroup
                  key={group.componentCode}
                  group={group}
                  currency={preview.currency}
                  savingRuleCode={savingPriceCode}
                  onSavePrice={handleRulePriceSave}
                />
              ))}
            </div>
          </Section>

          {preview.warnings.length > 0 ? (
            <Section title="Warnings" description="Backend preview warnings.">
              <div className="stack">
                {preview.warnings.map((warning) => (
                  <div key={warning} className="note">{warning}</div>
                ))}
              </div>
            </Section>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
