import type { MountingReviewState } from "../../types/intakeReview";
import { deriveSupportFromMountingSystem } from "../../lib/intakeReviewOptions";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";
import { Badge } from "../ui/Badge";

type MountingSupportReviewProps = {
  state: MountingReviewState;
  disabled?: boolean;
  options: Pick<IntakeReviewOptions, "mountingSystemOptions" | "supportTypeOptions" | "mountingTypeOptions">;
  onChange: (state: MountingReviewState) => void;
};

export function MountingSupportReview({ state, disabled, options, onChange }: MountingSupportReviewProps) {
  function patch(patch: Partial<MountingReviewState>) {
    onChange({ ...state, ...patch });
  }

  function handleMountingSystem(value: string) {
    const mounting_system = value || null;
    const derived = deriveSupportFromMountingSystem(mounting_system);
    onChange({
      ...state,
      mounting_system,
      support_required: derived.support_required,
      support_type: derived.support_type ?? state.support_type,
    });
  }

  return (
    <div className="mounting-support-review">
      <p className="field-hint">
        <Badge tone="default">Support ≠ mounting</Badge> Support = bars/structure. Mounting = installation template /
        fixing method.
      </p>
      <div className="field-grid">
        <label className="field">
          <span>Mounting system / support structure</span>
          <select
            disabled={disabled}
            value={state.mounting_system ?? ""}
            onChange={(e) => handleMountingSystem(e.target.value)}
          >
            <option value="">Select…</option>
            {options.mountingSystemOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="field-checkbox">
          <span>
            <input type="checkbox" checked={state.support_required} disabled readOnly />
            Support required (derived)
          </span>
        </label>
        <label className="field">
          <span>Support type override</span>
          <select
            disabled={disabled || !state.support_required}
            value={state.support_type ?? ""}
            onChange={(e) => patch({ support_type: e.target.value || null })}
          >
            <option value="">Select…</option>
            {options.supportTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="field-checkbox full">
          <span>
            <input
              type="checkbox"
              checked={state.mounting_template_enabled}
              disabled={disabled}
              onChange={(e) => patch({ mounting_template_enabled: e.target.checked })}
            />
            Mounting template enabled (sablon montaj)
          </span>
        </label>
        <label className="field">
          <span>Template area m²</span>
          <input
            type="number"
            step="any"
            disabled={disabled || !state.mounting_template_enabled}
            value={state.mounting_template_area_m2 ?? ""}
            onChange={(e) =>
              patch({ mounting_template_area_m2: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </label>
        <label className="field">
          <span>Template material</span>
          <input
            type="text"
            disabled={disabled || !state.mounting_template_enabled}
            value={state.mounting_template_material_type ?? ""}
            onChange={(e) => patch({ mounting_template_material_type: e.target.value || null })}
            placeholder="e.g. forex"
          />
        </label>
        <label className="field">
          <span>Mounting / fixing type</span>
          <select
            disabled={disabled}
            value={state.mounting_type ?? ""}
            onChange={(e) => patch({ mounting_type: e.target.value || null })}
          >
            <option value="">Select…</option>
            {options.mountingTypeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}
