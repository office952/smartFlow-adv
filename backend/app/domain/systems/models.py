from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


RegistryStatus = Literal["active", "draft", "deprecated"]

CommercialBasis = Literal[
    "mp",
    "ml",
    "buc",
    "set",
    "lucrare",
    "service_fixed",
    "external_service",
    "included",
    "manual_owner_review",
]

FORBIDDEN_COMMERCIAL_BASES = frozenset(
    {"hour", "minute", "internal_time", "labor_time", "machine_time"}
)

BlockingBehavior = Literal["blocking_if_missing", "manual_owner_review", "non_blocking"]

FieldType = Literal[
    "string",
    "number",
    "integer",
    "boolean",
    "enum",
    "text",
]

FieldSource = Literal["user_input", "computed", "owner_decision", "system_default"]

DecisionType = Literal["material", "finish", "policy", "boolean_gate", "enum_choice"]


class ProductFamily(BaseModel):
    family_code: str
    display_name: str
    description: str
    status: RegistryStatus = "active"
    template_codes: list[str] = Field(default_factory=list)


class ProductTemplate(BaseModel):
    template_code: str
    family_code: str
    display_name: str
    description: str
    status: RegistryStatus = "active"
    component_codes: list[str] = Field(default_factory=list)
    commercial_rule_codes: list[str] = Field(default_factory=list)
    intake_field_codes: list[str] = Field(default_factory=list)
    owner_decision_codes: list[str] = Field(default_factory=list)
    operation_codes: list[str] = Field(default_factory=list)
    material_codes: list[str] = Field(default_factory=list)
    notes: str | None = None


class ComponentDefinition(BaseModel):
    component_code: str
    template_code: str
    family_code: str
    display_name: str
    role: str
    required_measurements: list[str] = Field(default_factory=list)
    required_owner_decisions: list[str] = Field(default_factory=list)
    commercial_visibility: bool = True
    internal_cost_visibility: bool = True
    notes: str | None = None


class MaterialDefinition(BaseModel):
    material_code: str
    display_name: str
    category: str
    unit: str
    allowed_for_components: list[str] = Field(default_factory=list)
    notes: str | None = None


class OperationDefinition(BaseModel):
    operation_code: str
    display_name: str
    category: str
    internal_basis: str
    commercial_basis_allowed: list[CommercialBasis] = Field(default_factory=list)
    notes: str | None = None


class CommercialRuleDefinition(BaseModel):
    rule_code: str
    template_code: str
    component_code: str
    display_name: str
    commercial_basis: CommercialBasis
    commercial_basis_alternatives: list[CommercialBasis] = Field(default_factory=list)
    required_inputs: list[str] = Field(default_factory=list)
    required_owner_decisions: list[str] = Field(default_factory=list)
    output_line_type: str
    client_visible: bool = True
    blocking_behavior: BlockingBehavior = "blocking_if_missing"
    status: RegistryStatus = "active"
    notes: str | None = None


class IntakeFieldDefinition(BaseModel):
    field_code: str
    label: str
    field_type: FieldType
    required: bool = False
    source: FieldSource = "user_input"
    applies_to_template_codes: list[str] = Field(default_factory=list)
    feeds_rules: list[str] = Field(default_factory=list)
    validation: dict[str, Any] = Field(default_factory=dict)
    notes: str | None = None


class OwnerDecisionDefinition(BaseModel):
    decision_code: str
    label: str
    decision_type: DecisionType
    required: bool = True
    applies_to_template_codes: list[str] = Field(default_factory=list)
    feeds_rules: list[str] = Field(default_factory=list)
    allowed_values: list[str] = Field(default_factory=list)
    blocking_if_missing: bool = True
    notes: str | None = None
