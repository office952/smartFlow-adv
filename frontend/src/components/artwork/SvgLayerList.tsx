import { LAYER_ROLES, type LayerRole, type LayerRoleSetup } from "../../types/artwork";
import { confirmAllLayerRoles, updateLayerRole } from "../../lib/artwork/layerRoleSetup";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { LayerRoleSelector } from "./LayerRoleSelector";

type SvgLayerListProps = {
  setup: LayerRoleSetup;
  disabled?: boolean;
  onChange: (setup: LayerRoleSetup) => void;
};

export function SvgLayerList({ setup, disabled = false, onChange }: SvgLayerListProps) {
  return (
    <Card title="Layer role setup" className="layer-role-card">
      <div className="layer-role-actions">
        <Badge tone={setup.confirmation_status === "confirmed" ? "success" : "warning"}>
          {setup.confirmation_status}
        </Badge>
        <Button
          type="button"
          variant="secondary"
          disabled={disabled}
          onClick={() => onChange(confirmAllLayerRoles(setup))}
        >
          Confirm all roles
        </Button>
      </div>
      <div className="layer-list">
        {setup.layers.map((layer) => (
          <div key={layer.layer_id} className="layer-row">
            <div className="layer-row-head">
              <strong>{layer.layer_name}</strong>
              <small>{layer.layer_id}</small>
              <Badge tone="default">{layer.source}</Badge>
              {layer.path_count != null ? <Badge tone="default">{layer.path_count} shapes</Badge> : null}
            </div>
            <LayerRoleSelector
              value={layer.confirmed_role}
              suggested={layer.suggested_role}
              disabled={disabled || layer.ignored}
              onChange={(role: LayerRole) =>
                onChange(updateLayerRole(setup, layer.layer_id, { confirmed_role: role, confirmed: true }))
              }
            />
            <label className="field-checkbox">
              <span>
                <input
                  type="checkbox"
                  checked={layer.confirmed}
                  disabled={disabled || layer.ignored}
                  onChange={(event) =>
                    onChange(updateLayerRole(setup, layer.layer_id, { confirmed: event.target.checked }))
                  }
                />
                Role confirmed
              </span>
            </label>
            <label className="field-checkbox">
              <span>
                <input
                  type="checkbox"
                  checked={layer.ignored}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange(
                      updateLayerRole(setup, layer.layer_id, {
                        ignored: event.target.checked,
                        confirmed_role: event.target.checked ? "ignored" : layer.suggested_role,
                      }),
                    )
                  }
                />
                Ignore layer
              </span>
            </label>
          </div>
        ))}
      </div>
      <small className="field-hint">Allowed roles: {LAYER_ROLES.join(", ")}</small>
    </Card>
  );
}
