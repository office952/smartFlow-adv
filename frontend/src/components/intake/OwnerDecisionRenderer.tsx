import { Badge } from "../ui/Badge";
import type { OwnerDecisionDefinition } from "../../types/systems";


type OwnerDecisionRendererProps = {
  decision: OwnerDecisionDefinition;
  value: string;
  onChange: (decisionCode: string, value: string) => void;
  disabled?: boolean;
};

export function OwnerDecisionRenderer({ decision, value, onChange, disabled }: OwnerDecisionRendererProps) {
  return (
    <label className="field">
      <span className="field-label-row">
        {decision.label}
        {decision.required ? <Badge tone="warning">Required</Badge> : null}
        <Badge tone="muted">{decision.decision_type}</Badge>
      </span>
      <select
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(decision.decision_code, event.target.value)}
      >
        <option value="">Select…</option>
        {decision.allowed_values.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      {decision.feeds_rules.length > 0 ? (
        <small className="field-hint">Feeds rules: {decision.feeds_rules.join(", ")}</small>
      ) : null}
      {decision.notes ? <small className="field-hint">{decision.notes}</small> : null}
    </label>
  );
}
