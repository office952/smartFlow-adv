export type RegistryStatus = "active" | "draft" | "deprecated";

export type CommercialBasis =
  | "mp"
  | "ml"
  | "buc"
  | "set"
  | "lucrare"
  | "service_fixed"
  | "external_service"
  | "included"
  | "manual_owner_review";

export type BlockingBehavior = "blocking_if_missing" | "manual_owner_review" | "non_blocking";

export type FieldType = "string" | "number" | "integer" | "boolean" | "enum" | "text" | "collection";

export type FieldSource = "user_input" | "computed" | "owner_decision" | "system_default";

export type DecisionType = "material" | "finish" | "policy" | "boolean_gate" | "enum_choice";

export type ProductFamily = {
  family_code: string;
  display_name: string;
  description: string;
  status: RegistryStatus;
  template_codes: string[];
};

export type ProductTemplate = {
  template_code: string;
  family_code: string;
  display_name: string;
  description: string;
  status: RegistryStatus;
  component_codes: string[];
  commercial_rule_codes: string[];
  intake_field_codes: string[];
  owner_decision_codes: string[];
  operation_codes: string[];
  material_codes: string[];
  notes: string | null;
};

export type ComponentDefinition = {
  component_code: string;
  template_code: string;
  family_code: string;
  display_name: string;
  role: string;
  required_measurements: string[];
  required_owner_decisions: string[];
  commercial_visibility: boolean;
  internal_cost_visibility: boolean;
  notes: string | null;
};

export type MaterialDefinition = {
  material_code: string;
  display_name: string;
  category: string;
  unit: string;
  allowed_for_components: string[];
  notes: string | null;
};

export type OperationDefinition = {
  operation_code: string;
  display_name: string;
  category: string;
  internal_basis: string;
  commercial_basis_allowed: CommercialBasis[];
  notes: string | null;
};

export type CommercialRuleDefinition = {
  rule_code: string;
  template_code: string;
  component_code: string;
  display_name: string;
  commercial_basis: CommercialBasis;
  commercial_basis_alternatives: CommercialBasis[];
  required_inputs: string[];
  required_owner_decisions: string[];
  output_line_type: string;
  client_visible: boolean;
  blocking_behavior: BlockingBehavior;
  status: RegistryStatus;
  notes: string | null;
};

export type IntakeFieldDefinition = {
  field_code: string;
  label: string;
  field_type: FieldType;
  required: boolean;
  source: FieldSource;
  applies_to_template_codes: string[];
  feeds_rules: string[];
  validation: Record<string, unknown>;
  notes: string | null;
};

export type OwnerDecisionDefinition = {
  decision_code: string;
  label: string;
  decision_type: DecisionType;
  required: boolean;
  applies_to_template_codes: string[];
  feeds_rules: string[];
  allowed_values: string[];
  blocking_if_missing: boolean;
  notes: string | null;
};

export type SystemIntakeFormValues = Record<string, string | number | boolean | null>;

export type OwnerDecisionFormValues = Record<string, string>;

export type WorkspaceMetaValues = {
  title: string;
  client_name: string;
};
