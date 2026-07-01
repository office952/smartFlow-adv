import type { ProductTemplate } from "../../types/systems";


type TemplateSelectorProps = {
  templates: ProductTemplate[];
  value: string;
  onChange: (templateCode: string) => void;
  disabled?: boolean;
};

export function TemplateSelector({ templates, value, onChange, disabled }: TemplateSelectorProps) {
  const activeTemplates = templates.filter((template) => template.status === "active");

  return (
    <label className="field full">
      <span>Product template</span>
      <select value={value} disabled={disabled} onChange={(event) => onChange(event.target.value)}>
        {activeTemplates.length === 0 ? <option value="">No active templates</option> : null}
        {activeTemplates.map((template) => (
          <option key={template.template_code} value={template.template_code}>
            {template.display_name} ({template.template_code})
          </option>
        ))}
        {templates
          .filter((template) => template.status !== "active")
          .map((template) => (
            <option key={template.template_code} value={template.template_code} disabled>
              {template.display_name} — {template.status}
            </option>
          ))}
      </select>
    </label>
  );
}
