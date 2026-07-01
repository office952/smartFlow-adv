import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  DEFAULT_INTAKE_TEMPLATE,
  getTemplateIntakeFields,
  getTemplateOwnerDecisions,
  listProductTemplates,
} from "../../lib/systemsApi";
import type {
  IntakeFieldDefinition,
  OwnerDecisionDefinition,
  OwnerDecisionFormValues,
  ProductTemplate,
  SystemIntakeFormValues,
  WorkspaceMetaValues,
} from "../../types/systems";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { EmptyState } from "../ui/EmptyState";
import { Section } from "../ui/Section";
import { IntakeFieldRenderer } from "./IntakeFieldRenderer";
import { OwnerDecisionRenderer } from "./OwnerDecisionRenderer";
import { TemplateSelector } from "./TemplateSelector";


export type SystemDrivenIntakeSubmitPayload = {
  templateCode: string;
  meta: WorkspaceMetaValues;
  intakeValues: SystemIntakeFormValues;
  ownerDecisionValues: OwnerDecisionFormValues;
};

type SystemDrivenIntakeFormProps = {
  onSubmit: (payload: SystemDrivenIntakeSubmitPayload) => Promise<void>;
  submitting?: boolean;
  submitError?: string | null;
};

function buildDefaultIntakeValues(fields: IntakeFieldDefinition[]): SystemIntakeFormValues {
  const values: SystemIntakeFormValues = {};
  for (const field of fields) {
    if (field.field_type === "boolean") {
      values[field.field_code] = false;
    } else {
      values[field.field_code] = null;
    }
  }
  return values;
}

function buildDefaultOwnerValues(decisions: OwnerDecisionDefinition[]): OwnerDecisionFormValues {
  const values: OwnerDecisionFormValues = {};
  for (const decision of decisions) {
    values[decision.decision_code] = "";
  }
  return values;
}

export function SystemDrivenIntakeForm({ onSubmit, submitting = false, submitError = null }: SystemDrivenIntakeFormProps) {
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [templateCode, setTemplateCode] = useState(DEFAULT_INTAKE_TEMPLATE);
  const [intakeFields, setIntakeFields] = useState<IntakeFieldDefinition[]>([]);
  const [ownerDecisions, setOwnerDecisions] = useState<OwnerDecisionDefinition[]>([]);
  const [intakeValues, setIntakeValues] = useState<SystemIntakeFormValues>({});
  const [ownerValues, setOwnerValues] = useState<OwnerDecisionFormValues>({});
  const [meta, setMeta] = useState<WorkspaceMetaValues>({ title: "", client_name: "" });
  const [loading, setLoading] = useState(true);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      try {
        const data = await listProductTemplates();
        if (!active) {
          return;
        }
        setTemplates(data);
        const preferred = data.find((template) => template.template_code === DEFAULT_INTAKE_TEMPLATE);
        if (preferred) {
          setTemplateCode(preferred.template_code);
        } else if (data.find((template) => template.status === "active")) {
          setTemplateCode(data.find((template) => template.status === "active")!.template_code);
        }
      } catch (cause) {
        if (!active) {
          return;
        }
        setSchemaError(cause instanceof Error ? cause.message : "Failed to load product templates.");
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
    setSchemaError(null);

    async function loadSchema() {
      try {
        const [fields, decisions] = await Promise.all([
          getTemplateIntakeFields(templateCode),
          getTemplateOwnerDecisions(templateCode),
        ]);
        if (!active) {
          return;
        }
        setIntakeFields(fields);
        setOwnerDecisions(decisions);
        setIntakeValues(buildDefaultIntakeValues(fields));
        setOwnerValues(buildDefaultOwnerValues(decisions));
      } catch (cause) {
        if (!active) {
          return;
        }
        setSchemaError(cause instanceof Error ? cause.message : "Failed to load intake schema.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadSchema();
    return () => {
      active = false;
    };
  }, [templateCode]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.template_code === templateCode) ?? null,
    [templates, templateCode],
  );

  const visibleIntakeFields = intakeFields.filter(
    (field) => field.field_code !== "template_code" && field.source !== "computed",
  );

  function updateIntakeValue(fieldCode: string, value: string | number | boolean | null) {
    setIntakeValues((current) => ({ ...current, [fieldCode]: value }));
  }

  function updateOwnerValue(decisionCode: string, value: string) {
    setOwnerValues((current) => ({ ...current, [decisionCode]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({
      templateCode,
      meta,
      intakeValues: { ...intakeValues, template_code: templateCode },
      ownerDecisionValues: ownerValues,
    });
  }

  if (loading && templates.length === 0) {
    return <EmptyState title="Loading product systems…" description="Fetching templates from backend registry." />;
  }

  if (schemaError) {
    return <div className="error-box">{schemaError}</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="note intake-system-note">
        <Badge tone="default">System-driven</Badge> Fields and owner decisions are loaded from{" "}
        <code>/api/v1/systems</code>. The UI does not define commercial requirements locally.
      </div>

      <Section title="Workspace envelope">
        <div className="field-grid">
          <label className="field">
            <span className="field-label-row">
              Workspace title
              <Badge tone="warning">Required</Badge>
            </span>
            <input
              value={meta.title}
              onChange={(event) => setMeta((current) => ({ ...current, title: event.target.value }))}
              disabled={submitting}
            />
            <small className="field-hint">Workspace metadata — not yet in IntakeFieldRegistry (Phase 2B).</small>
          </label>
          <label className="field">
            <span className="field-label-row">
              Client name
              <Badge tone="warning">Required</Badge>
            </span>
            <input
              value={meta.client_name}
              onChange={(event) => setMeta((current) => ({ ...current, client_name: event.target.value }))}
              disabled={submitting}
            />
          </label>
        </div>
      </Section>

      <Section title="Template">
        <div className="field-grid">
          <TemplateSelector
            templates={templates}
            value={templateCode}
            onChange={setTemplateCode}
            disabled={submitting || loading}
          />
          {selectedTemplate ? (
            <div className="field full">
              <small className="field-hint">{selectedTemplate.description}</small>
              {selectedTemplate.status !== "active" ? (
                <div className="note">This template is not active. Submit may be disabled.</div>
              ) : null}
            </div>
          ) : null}
        </div>
      </Section>

      {loading ? (
        <EmptyState title="Loading intake schema…" description={`Fetching fields for ${templateCode}.`} />
      ) : (
        <>
          <Section title="Intake fields (registry)">
            {visibleIntakeFields.length === 0 ? (
              <EmptyState title="No intake fields" description="Backend returned an empty IntakeFieldRegistry for this template." />
            ) : (
              <div className="field-grid">
                {visibleIntakeFields.map((field) => (
                  <IntakeFieldRenderer
                    key={field.field_code}
                    field={field}
                    value={intakeValues[field.field_code]}
                    onChange={updateIntakeValue}
                    disabled={submitting}
                  />
                ))}
              </div>
            )}
          </Section>

          <Section title="Owner decisions (registry)">
            {ownerDecisions.length === 0 ? (
              <EmptyState title="No owner decisions" description="Backend returned no OwnerDecisionRegistry entries for this template." />
            ) : (
              <div className="field-grid">
                {ownerDecisions.map((decision) => (
                  <OwnerDecisionRenderer
                    key={decision.decision_code}
                    decision={decision}
                    value={ownerValues[decision.decision_code] ?? ""}
                    onChange={updateOwnerValue}
                    disabled={submitting}
                  />
                ))}
              </div>
            )}
          </Section>
        </>
      )}

      {submitError ? <div className="error-box">{submitError}</div> : null}

      <div className="actions">
        <Button type="submit" disabled={submitting || loading || selectedTemplate?.status !== "active"}>
          {submitting ? "Creating workspace…" : "Create workspace"}
        </Button>
      </div>
    </form>
  );
}
