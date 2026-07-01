import type { IlluminationReviewState } from "../../types/intakeReview";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";

type IlluminationReviewProps = {
  state: IlluminationReviewState;
  disabled?: boolean;
  options: Pick<
    IntakeReviewOptions,
    "lightingSystemTypeOptions" | "lightColorOptions" | "ledDensityPolicyOptions" | "psuPolicyOptions"
  >;
  onChange: (state: IlluminationReviewState) => void;
};

export function IlluminationReview({ state, disabled, options, onChange }: IlluminationReviewProps) {
  function patch(patch: Partial<IlluminationReviewState>) {
    onChange({ ...state, ...patch });
  }

  const ledDisabled = disabled || !state.illuminated;

  return (
    <div className="field-grid">
      <label className="field-checkbox full">
        <span>
          <input
            type="checkbox"
            checked={state.illuminated}
            disabled={disabled}
            onChange={(e) =>
              patch({
                illuminated: e.target.checked,
                lighting_system_type: e.target.checked ? state.lighting_system_type ?? "led_modules" : "none",
              })
            }
          />
          Illuminated
        </span>
      </label>
      <label className="field">
        <span>Lighting system</span>
        <select
          disabled={ledDisabled}
          value={state.lighting_system_type ?? ""}
          onChange={(e) => patch({ lighting_system_type: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.lightingSystemTypeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Light color</span>
        <select
          disabled={ledDisabled}
          value={state.light_color ?? ""}
          onChange={(e) => patch({ light_color: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.lightColorOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>LED module count</span>
        <input
          type="number"
          disabled={ledDisabled}
          value={state.led_module_count ?? ""}
          onChange={(e) => patch({ led_module_count: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>PSU watts</span>
        <input
          type="number"
          disabled={ledDisabled}
          value={state.selected_psu_watts ?? ""}
          onChange={(e) => patch({ selected_psu_watts: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </label>
      <label className="field">
        <span>LED density policy</span>
        <select
          disabled={ledDisabled}
          value={state.led_density_policy ?? ""}
          onChange={(e) => patch({ led_density_policy: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.ledDensityPolicyOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>PSU policy</span>
        <select
          disabled={ledDisabled}
          value={state.psu_policy ?? ""}
          onChange={(e) => patch({ psu_policy: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.psuPolicyOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
