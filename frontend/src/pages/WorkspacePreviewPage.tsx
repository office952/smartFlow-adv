import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import {
  createCommercialQuoteFromPreview,
  QuoteOwnerDecision,
  QuotePreview,
  WorkspaceDetail,
  buildQuotePreview,
  getWorkspace,
  updateLinePrice,
  updateOwnerDecision,
} from "../lib/api";


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

  async function handleBuildPreview() {
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
      const nextPreview = await buildQuotePreview(workspaceId);
      setPreview(nextPreview);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Owner decision update failed.");
    } finally {
      setSavingDecisionCode(null);
    }
  }

  async function handleLinePriceChange(lineCode: string, rawValue: string) {
    if (!workspaceId || !preview) {
      return;
    }

    const value = Number(rawValue);
    if (!Number.isFinite(value) || value < 0) {
      setError("Line price must be a non-negative number.");
      return;
    }

    setSavingPriceCode(lineCode);
    setError(null);
    try {
      await updateLinePrice(workspaceId, lineCode, {
        line_code: lineCode,
        unit_price: value,
        currency: "RON",
        notes: null,
      });
      const nextPreview = await buildQuotePreview(workspaceId);
      setPreview(nextPreview);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Line price update failed.");
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
      <div className="page-head">
        <h2>{workspace.title}</h2>
        <p>
          Client: {workspace.client_name}. Template: {workspace.template_code}. This screen only exposes real preview state returned by the backend.
        </p>
      </div>

      {error ? <div className="error-box">{error}</div> : null}
      {quoteMessage ? <div className="note">{quoteMessage}</div> : null}

      <div className="grid-two">
        <div className="summary">
          <span className="badge">Workspace inputs</span>
          <table className="table">
            <tbody>
              <tr><th>Width</th><td>{workspace.width_mm} mm</td></tr>
              <tr><th>Height</th><td>{workspace.height_mm} mm</td></tr>
              <tr><th>Letter count</th><td>{workspace.letter_count}</td></tr>
              <tr><th>Perimeter</th><td>{workspace.letter_perimeter_m} m</td></tr>
              <tr><th>Face area</th><td>{workspace.letter_face_area_m2} m2</td></tr>
              <tr><th>Return depth</th><td>{workspace.return_depth_mm} mm</td></tr>
              <tr><th>LED modules</th><td>{workspace.led_module_count ?? "-"}</td></tr>
              <tr><th>Selected PSU watts</th><td>{workspace.selected_psu_watts ?? "-"}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="summary">
          <span className="badge">Commercial status</span>
          {preview ? (
            <>
              <strong>{preview.status}</strong>
              {preview.existing_quote_code ? <p>Existing quote: {preview.existing_quote_code}</p> : null}
              <p>Subtotal net: {preview.subtotal_net ?? "blocked"}</p>
              <p>VAT ({Math.round(preview.vat_rate * 100)}%): {preview.vat_amount ?? "blocked"}</p>
              <p>Total gross: {preview.total_gross ?? "blocked"}</p>
              <p>Owner decisions: {preview.owner_decisions.length}</p>
            </>
          ) : (
            <p>No preview generated yet.</p>
          )}
          <div className="actions">
            <button className="button" type="button" onClick={handleBuildPreview} disabled={building}>
              {building ? "Building..." : "Build quote preview"}
            </button>
            <button
              className="button-secondary"
              type="button"
              onClick={handleCreateQuote}
              disabled={creatingQuote || preview?.status !== "ready" || Boolean(preview?.existing_quote_code)}
            >
              {creatingQuote ? "Creating quote..." : preview?.existing_quote_code ? "Commercial quote already exists" : "Create commercial quote"}
            </button>
          </div>
        </div>
      </div>

      {preview ? (
        <div className="stack">
          <div className="note">No fake totals: null totals remain null until owner-approved commercial rule data exists.</div>

          <div className="summary">
            <span className="badge">Owner decisions</span>
            {preview.owner_decisions.length === 0 ? (
              <p>No owner decisions pending.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Decision</th>
                    <th>Detail</th>
                    <th>Line</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.owner_decisions.map((decision) => (
                    <tr key={decision.code}>
                      <td>{decision.label}</td>
                      <td>{decision.detail}</td>
                      <td>{decision.line_code ?? "-"}</td>
                      <td>
                        <select
                          value={decision.status}
                          onChange={(event) => {
                            void handleDecisionChange(decision, {
                              status: event.target.value as QuoteOwnerDecision["status"],
                            });
                          }}
                          disabled={savingDecisionCode === decision.code}
                        >
                          <option value="pending">pending</option>
                          <option value="approved">approved</option>
                          <option value="rejected">rejected</option>
                        </select>
                      </td>
                      <td>
                        {decision.code === "DEBITARE_SPATE_BASIS_ML_VS_M2" ? (
                          <select
                            value={decision.selected_value ?? ""}
                            onChange={(event) => {
                              void handleDecisionChange(decision, {
                                selected_value: event.target.value || null,
                              });
                            }}
                            disabled={savingDecisionCode === decision.code}
                          >
                            <option value="">unset</option>
                            <option value="m2">m2</option>
                            <option value="ml">ml</option>
                          </select>
                        ) : (
                          decision.selected_value ?? "-"
                        )}
                      </td>
                      <td>
                        <input
                          value={decision.resolution_notes ?? ""}
                          placeholder="notes"
                          onBlur={(event) => {
                            void handleDecisionChange(decision, {
                              resolution_notes: event.target.value || null,
                            });
                          }}
                          disabled={savingDecisionCode === decision.code}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="summary">
            <span className="badge">Blockers</span>
            {preview.blockers.length === 0 ? (
              <p>No blockers.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.blockers.map((blocker) => (
                    <tr key={blocker.code}>
                      <td>{blocker.code}</td>
                      <td>{blocker.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="summary">
            <span className="badge">Commercial lines</span>
            <table className="table">
              <thead>
                <tr>
                  <th>Line</th>
                  <th>Basis</th>
                  <th>Quantity</th>
                  <th>Unit price</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {preview.lines.map((line) => (
                  <tr key={line.code}>
                    <td>
                      {line.label}
                      {line.owner_decision_required ? <div><span className="badge">Owner decision</span></div> : null}
                    </td>
                    <td>{line.basis_type}</td>
                    <td>{line.quantity ?? "-"} {line.unit}</td>
                    <td>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={line.commercial_unit_price ?? ""}
                        placeholder="unset"
                        onBlur={(event) => {
                          if (event.target.value !== "") {
                            void handleLinePriceChange(line.code, event.target.value);
                          }
                        }}
                        disabled={line.owner_decision_required || savingPriceCode === line.code}
                      />
                    </td>
                    <td>{line.subtotal ?? "blocked"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="summary">
            <span className="badge">Warnings</span>
            <div className="stack">
              {preview.warnings.map((warning) => (
                <div key={warning} className="note">{warning}</div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}