import type { LetterGroupFinish } from "../../types/artwork";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";
import { Badge } from "../ui/Badge";

type LetterGroupFinishCardProps = {
  group: LetterGroupFinish;
  disabled?: boolean;
  options: Pick<IntakeReviewOptions, "letterFaceFinishOptions" | "letterReturnFinishOptions" | "faceVinylRollWidthOptions">;
  onChange: (group: LetterGroupFinish) => void;
};

export function LetterGroupFinishCard({ group, disabled = false, options, onChange }: LetterGroupFinishCardProps) {
  function patch(patch: Partial<LetterGroupFinish>) {
    onChange({ ...group, ...patch });
  }

  return (
    <article className="letter-group-finish-card">
      <header className="letter-group-finish-header">
        <div>
          <strong>{group.layer_name}</strong>
          <small className="field-hint">{group.group_key}</small>
        </div>
        <Badge tone="default">{group.role}</Badge>
        {group.confirmed ? <Badge tone="success">confirmed</Badge> : <Badge tone="warning">draft</Badge>}
      </header>
      <div className="field-grid">
        <label className="field">
          <span>Face area m²</span>
          <input
            type="number"
            step="any"
            disabled={disabled}
            value={group.face_area_m2 ?? ""}
            onChange={(e) => patch({ face_area_m2: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Perimeter m</span>
          <input
            type="number"
            step="any"
            disabled={disabled}
            value={group.perimeter_m ?? ""}
            onChange={(e) => patch({ perimeter_m: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Face finish</span>
          <select
            disabled={disabled}
            value={group.face_finish_type ?? ""}
            onChange={(e) => patch({ face_finish_type: e.target.value || null })}
          >
            <option value="">Select…</option>
            {options.letterFaceFinishOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Oracal code</span>
          <input
            type="text"
            disabled={disabled}
            value={group.face_oracal_code ?? ""}
            onChange={(e) => patch({ face_oracal_code: e.target.value || null })}
          />
        </label>
        <label className="field">
          <span>Return finish</span>
          <select
            disabled={disabled}
            value={group.return_finish_type ?? ""}
            onChange={(e) => patch({ return_finish_type: e.target.value || null })}
          >
            <option value="">Select…</option>
            {options.letterReturnFinishOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Return depth mm</span>
          <input
            type="number"
            disabled={disabled}
            value={group.return_depth_mm ?? ""}
            onChange={(e) => patch({ return_depth_mm: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </label>
        <label className="field">
          <span>Vinyl roll width mm</span>
          <select
            disabled={disabled}
            value={group.face_vinyl_roll_width_mm ?? ""}
            onChange={(e) =>
              patch({ face_vinyl_roll_width_mm: e.target.value === "" ? null : Number(e.target.value) })
            }
          >
            <option value="">Select…</option>
            {options.faceVinylRollWidthOptions.map((opt) => (
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
              checked={group.confirmed}
              disabled={disabled}
              onChange={(e) => patch({ confirmed: e.target.checked })}
            />
            Group finish confirmed
          </span>
        </label>
      </div>
    </article>
  );
}
