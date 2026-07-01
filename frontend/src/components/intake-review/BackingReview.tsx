import type { BackingReviewState } from "../../types/intakeReview";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";

type BackingReviewProps = {
  state: BackingReviewState;
  disabled?: boolean;
  options: Pick<IntakeReviewOptions, "backingModeOptions" | "backMaterialOptions">;
  onChange: (state: BackingReviewState) => void;
};

export function BackingReview({ state, disabled, options, onChange }: BackingReviewProps) {
  function patch(patch: Partial<BackingReviewState>) {
    onChange({ ...state, ...patch });
  }

  return (
    <div className="field-grid">
      <label className="field">
        <span>Backing mode</span>
        <select
          disabled={disabled}
          value={state.backing_mode ?? ""}
          onChange={(e) => patch({ backing_mode: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.backingModeOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Back material</span>
        <select
          disabled={disabled}
          value={state.back_material ?? ""}
          onChange={(e) => patch({ back_material: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.backMaterialOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Back area m²</span>
        <input
          type="number"
          step="any"
          disabled={disabled}
          value={state.back_area_m2 ?? ""}
          onChange={(e) => patch({ back_area_m2: e.target.value === "" ? null : Number(e.target.value) })}
        />
        <small className="field-hint">Manual entry — not auto-calculated from SVG in Phase 2D.</small>
      </label>
    </div>
  );
}
