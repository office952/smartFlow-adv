import { useEffect, useState } from "react";

import { TemplateSelector } from "../components/intake/TemplateSelector";
import { Badge } from "../components/ui/Badge";
import { Card } from "../components/ui/Card";
import { EmptyState } from "../components/ui/EmptyState";
import { PageHeader } from "../components/ui/PageHeader";
import { Section } from "../components/ui/Section";
import {
  DEFAULT_INTAKE_TEMPLATE,
  getProductTemplate,
  getTemplateCommercialRules,
  getTemplateComponents,
  getTemplateIntakeFields,
  getTemplateOwnerDecisions,
  listProductTemplates,
} from "../lib/systemsApi";
import type {
  CommercialRuleDefinition,
  ComponentDefinition,
  IntakeFieldDefinition,
  OwnerDecisionDefinition,
  ProductTemplate,
} from "../types/systems";


export function ProductSystemsPage() {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [templateCode, setTemplateCode] = useState(DEFAULT_INTAKE_TEMPLATE);
  const [template, setTemplate] = useState<ProductTemplate | null>(null);
  const [components, setComponents] = useState<ComponentDefinition[]>([]);
  const [rules, setRules] = useState<CommercialRuleDefinition[]>([]);
  const [fields, setFields] = useState<IntakeFieldDefinition[]>([]);
  const [decisions, setDecisions] = useState<OwnerDecisionDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      try {
        const data = await listProductTemplates();
        if (!active) {
          return;
        }
        setTemplates(data);
      } catch (cause) {
        if (!active) {
          return;
        }
        setError(cause instanceof Error ? cause.message : "Failed to load templates.");
        setLoading(false);
      }
    }

    void loadTemplates();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!templateCode) {
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    async function loadDetail() {
      try {
        const [templateData, componentData, ruleData, fieldData, decisionData] = await Promise.all([
          getProductTemplate(templateCode),
          getTemplateComponents(templateCode),
          getTemplateCommercialRules(templateCode),
          getTemplateIntakeFields(templateCode),
          getTemplateOwnerDecisions(templateCode),
        ]);
        if (!active) {
          return;
        }
        setTemplate(templateData);
        setComponents(componentData);
        setRules(ruleData);
        setFields(fieldData);
        setDecisions(decisionData);
      } catch (cause) {
        if (!active) {
          return;
        }
        setError(cause instanceof Error ? cause.message : "Failed to load template registry data.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [templateCode]);

  return (
    <section className="panel">
      <PageHeader
        eyebrow="Product systems"
        title="Registry explorer"
        description="Read-only view of backend product template contracts. No calculator, no edits, no totals."
      />

      {error ? <div className="error-box">{error}</div> : null}

      <div className="note">
        <Badge tone="default">Read-only</Badge> Data from <code>/api/v1/systems</code>. UI displays backend truth only.
      </div>

      <Section title="Template selection">
        <div className="field-grid">
          <TemplateSelector templates={templates} value={templateCode} onChange={setTemplateCode} disabled={loading} />
        </div>
        {template ? (
          <Card eyebrow={template.family_code} title={template.display_name}>
            <p>{template.description}</p>
            <p>Status: {template.status}</p>
          </Card>
        ) : null}
      </Section>

      {loading ? (
        <EmptyState title="Loading registry…" description={`Fetching systems data for ${templateCode}.`} />
      ) : (
        <div className="stack">
          <Section title={`Components (${components.length})`}>
            {components.length === 0 ? (
              <EmptyState title="No components" />
            ) : (
              <div className="stack">
                {components.map((component) => (
                  <Card key={component.component_code} eyebrow={component.component_code} title={component.display_name}>
                    <p>Role: {component.role}</p>
                    <p>Measurements: {component.required_measurements.join(", ") || "—"}</p>
                  </Card>
                ))}
              </div>
            )}
          </Section>

          <Section title={`Commercial rules (${rules.length})`}>
            {rules.length === 0 ? (
              <EmptyState title="No rules" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Component</th>
                    <th>Basis</th>
                    <th>Blocking</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.rule_code}>
                      <td>{rule.display_name}</td>
                      <td>{rule.component_code}</td>
                      <td>{rule.commercial_basis}</td>
                      <td>{rule.blocking_behavior}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>

          <Section title={`Intake fields (${fields.length})`}>
            {fields.length === 0 ? (
              <EmptyState title="No intake fields" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Source</th>
                    <th>Feeds rules</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field) => (
                    <tr key={field.field_code}>
                      <td>{field.label}</td>
                      <td>
                        {field.field_type}
                        {field.field_type === "collection" ? (
                          <Badge tone="default"> collection</Badge>
                        ) : null}
                      </td>
                      <td>{field.required ? "yes" : "no"}</td>
                      <td>
                        {field.field_type === "collection" ? (
                          <Badge tone="success">collection / SVG</Badge>
                        ) : field.source === "computed" ? (
                          <Badge tone="warning">computed</Badge>
                        ) : (
                          field.source
                        )}
                      </td>
                      <td>{field.feeds_rules.join(", ") || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="field-hint">
              Collection fields and geometry metrics may be populated from SVG layer role setup (Phase 2C) — not hardcoded in UI.
            </p>
          </Section>

          <Section title={`Owner decisions (${decisions.length})`}>
            {decisions.length === 0 ? (
              <EmptyState title="No owner decisions" />
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Decision</th>
                    <th>Type</th>
                    <th>Required</th>
                    <th>Allowed values</th>
                  </tr>
                </thead>
                <tbody>
                  {decisions.map((decision) => (
                    <tr key={decision.decision_code}>
                      <td>{decision.label}</td>
                      <td>{decision.decision_type}</td>
                      <td>{decision.required ? "yes" : "no"}</td>
                      <td>{decision.allowed_values.join(", ")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Section>
        </div>
      )}
    </section>
  );
}
