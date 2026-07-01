import { Badge } from "../ui/Badge";
import type { IntakeFieldDefinition } from "../../types/systems";
import type { SystemIntakeFormValues } from "../../types/systems";


type IntakeFieldRendererProps = {
  field: IntakeFieldDefinition;
  value: string | number | boolean | null | undefined;
  onChange: (fieldCode: string, value: string | number | boolean | null) => void;
  disabled?: boolean;
};

export function IntakeFieldRenderer({ field, value, onChange, disabled }: IntakeFieldRendererProps) {
  if (field.field_code === "template_code") {
    return null;
  }

  const label = (
    <span className="field-label-row">
      {field.label}
      {field.required ? <Badge tone="warning">Required</Badge> : null}
    </span>
  );

  const commonProps = { disabled };

  switch (field.field_type) {
    case "boolean":
      return (
        <label className="field-checkbox full">
          <span>
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(event) => onChange(field.field_code, event.target.checked)}
              {...commonProps}
            />
            {field.label}
            {field.required ? <Badge tone="warning">Required</Badge> : null}
          </span>
          {field.notes ? <small className="field-hint">{field.notes}</small> : null}
        </label>
      );

    case "integer":
    case "number":
      return (
        <label className="field">
          {label}
          <input
            type="number"
            step={field.field_type === "integer" ? 1 : "any"}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => {
              const next = event.target.value;
              onChange(field.field_code, next === "" ? null : Number(next));
            }}
            {...commonProps}
          />
          {field.feeds_rules.length > 0 ? (
            <small className="field-hint">Feeds rules: {field.feeds_rules.join(", ")}</small>
          ) : null}
        </label>
      );

    case "enum": {
      const options = field.validation.options as string[] | undefined;
      if (options && options.length > 0) {
        return (
          <label className="field">
            {label}
            <select
              value={value === null || value === undefined ? "" : String(value)}
              onChange={(event) => onChange(field.field_code, event.target.value || null)}
              {...commonProps}
            >
              <option value="">Select…</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {field.notes ? <small className="field-hint">{field.notes}</small> : null}
          </label>
        );
      }
      return (
        <label className="field">
          {label}
          <input
            type="text"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => onChange(field.field_code, event.target.value || null)}
            {...commonProps}
          />
          {field.notes ? <small className="field-hint">{field.notes}</small> : null}
        </label>
      );
    }

    case "text":
      return (
        <label className="field full">
          {label}
          <textarea
            rows={3}
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => onChange(field.field_code, event.target.value || null)}
            {...commonProps}
          />
        </label>
      );

    case "string":
    default:
      return (
        <label className="field">
          {label}
          <input
            type="text"
            value={value === null || value === undefined ? "" : String(value)}
            onChange={(event) => onChange(field.field_code, event.target.value || null)}
            {...commonProps}
          />
          {field.notes ? <small className="field-hint">{field.notes}</small> : null}
        </label>
      );
  }
}
