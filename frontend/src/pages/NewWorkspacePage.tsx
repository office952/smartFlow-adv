import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { PageHeader } from "../components/ui/PageHeader";
import { WorkspaceCreateInput, createWorkspace } from "../lib/api";


const initialState: WorkspaceCreateInput = {
  title: "Volumetric letters demo",
  client_name: "Client demo",
  template_code: "TPL-VOLUMETRIC-LETTERS_v2",
  width_mm: 1200,
  height_mm: 400,
  letter_count: 5,
  letter_perimeter_m: 12.5,
  letter_face_area_m2: 1.2,
  return_depth_mm: 60,
  illuminated: true,
  led_module_count: 20,
  selected_psu_watts: 60,
  mounting_template_enabled: false,
  mounting_template_area_m2: null,
  mounting_template_material_type: null,
  notes: "Clean V6 demo workspace",
};


export function NewWorkspacePage() {
  const [form, setForm] = useState<WorkspaceCreateInput>(initialState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function updateField<Key extends keyof WorkspaceCreateInput>(key: Key, value: WorkspaceCreateInput[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const workspace = await createWorkspace(form);
      navigate(`/workspaces/${workspace.id}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Workspace creation failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Intake"
        title="New workspace"
        description="Temporary manual intake form. Phase 2 will render fields from backend product systems."
      />

      {error ? <div className="error-box">{error}</div> : null}

      <form onSubmit={handleSubmit}>
        <div className="field-grid">
          <label className="field">
            <span>Workspace title</span>
            <input value={form.title} onChange={(event) => updateField("title", event.target.value)} />
          </label>

          <label className="field">
            <span>Client name</span>
            <input value={form.client_name} onChange={(event) => updateField("client_name", event.target.value)} />
          </label>

          <label className="field">
            <span>Width mm</span>
            <input type="number" value={form.width_mm} onChange={(event) => updateField("width_mm", Number(event.target.value))} />
          </label>

          <label className="field">
            <span>Height mm</span>
            <input type="number" value={form.height_mm} onChange={(event) => updateField("height_mm", Number(event.target.value))} />
          </label>

          <label className="field">
            <span>Letter count</span>
            <input type="number" value={form.letter_count} onChange={(event) => updateField("letter_count", Number(event.target.value))} />
          </label>

          <label className="field">
            <span>Letter perimeter m</span>
            <input type="number" step="0.0001" value={form.letter_perimeter_m} onChange={(event) => updateField("letter_perimeter_m", Number(event.target.value))} />
          </label>

          <label className="field">
            <span>Face area m2</span>
            <input type="number" step="0.0001" value={form.letter_face_area_m2} onChange={(event) => updateField("letter_face_area_m2", Number(event.target.value))} />
          </label>

          <label className="field">
            <span>Return depth mm</span>
            <input type="number" value={form.return_depth_mm} onChange={(event) => updateField("return_depth_mm", Number(event.target.value))} />
          </label>

          <label className="field-checkbox">
            <span>
              <input type="checkbox" checked={form.illuminated} onChange={(event) => updateField("illuminated", event.target.checked)} />
              Illuminated
            </span>
          </label>

          <label className="field-checkbox">
            <span>
              <input
                type="checkbox"
                checked={form.mounting_template_enabled}
                onChange={(event) => updateField("mounting_template_enabled", event.target.checked)}
              />
              Mounting template enabled
            </span>
          </label>

          <label className="field">
            <span>LED module count</span>
            <input
              type="number"
              value={form.led_module_count ?? ""}
              onChange={(event) => updateField("led_module_count", event.target.value ? Number(event.target.value) : null)}
            />
          </label>

          <label className="field">
            <span>Selected PSU watts</span>
            <input
              type="number"
              value={form.selected_psu_watts ?? ""}
              onChange={(event) => updateField("selected_psu_watts", event.target.value ? Number(event.target.value) : null)}
            />
          </label>

          <label className="field">
            <span>Mounting template area m2</span>
            <input
              type="number"
              step="0.0001"
              value={form.mounting_template_area_m2 ?? ""}
              onChange={(event) => updateField("mounting_template_area_m2", event.target.value ? Number(event.target.value) : null)}
            />
          </label>

          <label className="field">
            <span>Template material</span>
            <select
              value={form.mounting_template_material_type ?? ""}
              onChange={(event) => updateField("mounting_template_material_type", event.target.value || null)}
            >
              <option value="">None</option>
              <option value="paper">Paper</option>
              <option value="forex">Forex</option>
            </select>
          </label>

          <label className="field full">
            <span>Notes</span>
            <textarea rows={4} value={form.notes ?? ""} onChange={(event) => updateField("notes", event.target.value || null)} />
          </label>
        </div>

        <div className="actions">
          <Button type="submit" disabled={saving}>
            {saving ? "Creating..." : "Create workspace"}
          </Button>
        </div>
      </form>
    </section>
  );
}
