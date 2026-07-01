import type { QuoteOwnerDecision } from "../../lib/api";
import { Section } from "../ui/Section";

type OwnerDecisionsPanelProps = {
  decisions: QuoteOwnerDecision[];
  savingDecisionCode: string | null;
  onDecisionChange: (
    decision: QuoteOwnerDecision,
    patch: Partial<Pick<QuoteOwnerDecision, "status" | "selected_value" | "resolution_notes">>,
  ) => void;
};

export function OwnerDecisionsPanel({ decisions, savingDecisionCode, onDecisionChange }: OwnerDecisionsPanelProps) {
  return (
    <Section title="Owner decisions" description="Decision status from backend preview contract.">
      {decisions.length === 0 ? (
        <p className="empty">No owner decisions listed for this preview.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>Decision</th>
              <th>Linked rule</th>
              <th>Status</th>
              <th>Value</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {decisions.map((decision) => (
              <tr key={decision.code}>
                <td>
                  <strong>{decision.label}</strong>
                  <div className="quote-decision-code">
                    <code>{decision.code}</code>
                  </div>
                  <p className="quote-decision-detail">{decision.detail}</p>
                </td>
                <td>{decision.line_code ?? "—"}</td>
                <td>
                  <select
                    value={decision.status}
                    onChange={(event) => {
                      onDecisionChange(decision, {
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
                <td>{decision.selected_value ?? "—"}</td>
                <td>
                  <input
                    value={decision.resolution_notes ?? ""}
                    placeholder="notes"
                    onBlur={(event) => {
                      onDecisionChange(decision, {
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
    </Section>
  );
}
