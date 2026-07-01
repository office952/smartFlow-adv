import type { PackagingReviewState } from "../../types/intakeReview";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";

type PackagingReviewProps = {
  state: PackagingReviewState;
  disabled?: boolean;
  options: Pick<IntakeReviewOptions, "packageSizeClassOptions" | "deliveryPolicyOptions">;
  onChange: (state: PackagingReviewState) => void;
};

export function PackagingReview({ state, disabled, options, onChange }: PackagingReviewProps) {
  function patch(patch: Partial<PackagingReviewState>) {
    onChange({ ...state, ...patch });
  }

  return (
    <div className="field-grid">
      <label className="field-checkbox full">
        <span>
          <input
            type="checkbox"
            checked={state.packaging_required}
            disabled={disabled}
            onChange={(e) => patch({ packaging_required: e.target.checked })}
          />
          Packaging required
        </span>
      </label>
      <label className="field">
        <span>Package size class</span>
        <select
          disabled={disabled || !state.packaging_required}
          value={state.package_size_class ?? ""}
          onChange={(e) => patch({ package_size_class: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.packageSizeClassOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
      <label className="field">
        <span>Delivery policy</span>
        <select
          disabled={disabled}
          value={state.delivery_policy ?? ""}
          onChange={(e) => patch({ delivery_policy: e.target.value || null })}
        >
          <option value="">Select…</option>
          {options.deliveryPolicyOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
