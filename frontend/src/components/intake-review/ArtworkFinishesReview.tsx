import type { ArtworkFinishRow } from "../../types/intakeReview";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";

type ArtworkFinishesReviewProps = {
  rows: ArtworkFinishRow[];
  disabled?: boolean;
  finishTypeOptions: string[];
  onChange: (rows: ArtworkFinishRow[]) => void;
};

export function ArtworkFinishesReview({ rows, disabled, finishTypeOptions, onChange }: ArtworkFinishesReviewProps) {
  function addRow() {
    const key = `artwork_${rows.length + 1}`;
    onChange([
      ...rows,
      { group_key: key, layer_name: `Logo ${rows.length + 1}`, estimated_area_m2: null, finish_type: null, confirmed: false },
    ]);
  }

  function patch(key: string, patch: Partial<ArtworkFinishRow>) {
    onChange(rows.map((row) => (row.group_key === key ? { ...row, ...patch } : row)));
  }

  if (rows.length === 0) {
    return (
      <div className="artwork-finishes-review">
        <EmptyState title="No artwork/logo finish rows" description="Optional — add rows for non-letter artwork elements." />
        <Button type="button" variant="secondary" disabled={disabled} onClick={addRow}>
          Add artwork finish row
        </Button>
      </div>
    );
  }

  return (
    <div className="artwork-finishes-review">
      {rows.map((row) => (
        <div key={row.group_key} className="artwork-finish-row field-grid">
          <label className="field">
            <span>Name</span>
            <input
              type="text"
              disabled={disabled}
              value={row.layer_name}
              onChange={(e) => patch(row.group_key, { layer_name: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Area m²</span>
            <input
              type="number"
              step="any"
              disabled={disabled}
              value={row.estimated_area_m2 ?? ""}
              onChange={(e) =>
                patch(row.group_key, { estimated_area_m2: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </label>
          <label className="field">
            <span>Finish type</span>
            <select
              disabled={disabled}
              value={row.finish_type ?? ""}
              onChange={(e) => patch(row.group_key, { finish_type: e.target.value || null })}
            >
              <option value="">Select…</option>
              {finishTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
          <label className="field-checkbox">
            <span>
              <input
                type="checkbox"
                checked={row.confirmed}
                disabled={disabled}
                onChange={(e) => patch(row.group_key, { confirmed: e.target.checked })}
              />
              Confirmed
            </span>
          </label>
        </div>
      ))}
      <Button type="button" variant="secondary" disabled={disabled} onClick={addRow}>
        Add row
      </Button>
    </div>
  );
}
