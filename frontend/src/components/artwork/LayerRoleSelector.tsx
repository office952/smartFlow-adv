import { LAYER_ROLES, type LayerRole } from "../../types/artwork";

type LayerRoleSelectorProps = {
  value: LayerRole;
  suggested: LayerRole;
  disabled?: boolean;
  onChange: (role: LayerRole) => void;
};

export function LayerRoleSelector({ value, suggested, disabled = false, onChange }: LayerRoleSelectorProps) {
  return (
    <label className="field">
      <span className="field-label-row">
        Confirmed role
        {value !== suggested ? <small className="field-hint">Suggested: {suggested}</small> : null}
      </span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value as LayerRole)}>
        {LAYER_ROLES.map((role) => (
          <option key={role} value={role}>
            {role}
          </option>
        ))}
      </select>
    </label>
  );
}
