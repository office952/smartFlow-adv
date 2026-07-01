import type { LetterGroupFinish } from "../../types/artwork";
import { Card } from "../ui/Card";

type LetterGroupFinishesPanelProps = {
  groups: LetterGroupFinish[];
  disabled?: boolean;
  finishTypeOptions: string[];
  returnFinishOptions: string[];
  onChange: (groups: LetterGroupFinish[]) => void;
};

export function LetterGroupFinishesPanel({
  groups,
  disabled = false,
  finishTypeOptions,
  returnFinishOptions,
  onChange,
}: LetterGroupFinishesPanelProps) {
  function patchGroup(groupKey: string, patch: Partial<LetterGroupFinish>) {
    onChange(groups.map((group) => (group.group_key === groupKey ? { ...group, ...patch } : group)));
  }

  return (
    <Card title="Letter groups / finishes" className="letter-groups-card">
      <p className="field-hint">
        Draft finish rows from confirmed face layers. Metrics may stay null — backend preview will block missing inputs.
      </p>
      <div className="letter-groups-list">
        {groups.map((group) => (
          <details key={group.group_key} className="letter-group-details" open>
            <summary>
              {group.layer_name} <small>({group.group_key})</small>
            </summary>
            <div className="field-grid">
              <label className="field">
                <span>Face area m²</span>
                <input
                  type="number"
                  step="any"
                  disabled={disabled}
                  value={group.face_area_m2 ?? ""}
                  onChange={(event) =>
                    patchGroup(group.group_key, {
                      face_area_m2: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Perimeter m</span>
                <input
                  type="number"
                  step="any"
                  disabled={disabled}
                  value={group.perimeter_m ?? ""}
                  onChange={(event) =>
                    patchGroup(group.group_key, {
                      perimeter_m: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="field">
                <span>Face finish type</span>
                <select
                  disabled={disabled}
                  value={group.face_finish_type ?? ""}
                  onChange={(event) =>
                    patchGroup(group.group_key, { face_finish_type: event.target.value || null })
                  }
                >
                  <option value="">Select…</option>
                  {finishTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Oracal code (optional)</span>
                <input
                  type="text"
                  disabled={disabled}
                  value={group.face_oracal_code ?? ""}
                  onChange={(event) =>
                    patchGroup(group.group_key, { face_oracal_code: event.target.value || null })
                  }
                />
              </label>
              <label className="field">
                <span>Return finish</span>
                <select
                  disabled={disabled}
                  value={group.return_finish_type ?? ""}
                  onChange={(event) =>
                    patchGroup(group.group_key, { return_finish_type: event.target.value || null })
                  }
                >
                  <option value="">Select…</option>
                  {returnFinishOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
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
                  onChange={(event) =>
                    patchGroup(group.group_key, {
                      return_depth_mm: event.target.value === "" ? null : Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="field-checkbox full">
                <span>
                  <input
                    type="checkbox"
                    checked={group.confirmed}
                    disabled={disabled}
                    onChange={(event) => patchGroup(group.group_key, { confirmed: event.target.checked })}
                  />
                  Group finish confirmed
                </span>
              </label>
            </div>
          </details>
        ))}
      </div>
    </Card>
  );
}
