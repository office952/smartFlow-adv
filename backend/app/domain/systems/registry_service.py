from __future__ import annotations

from app.domain.systems.commercial_rules import COMMERCIAL_RULES
from app.domain.systems.components import COMPONENTS
from app.domain.systems.intake_fields import INTAKE_FIELDS
from app.domain.systems.materials import MATERIALS
from app.domain.systems.models import (
    CommercialRuleDefinition,
    ComponentDefinition,
    IntakeFieldDefinition,
    MaterialDefinition,
    OperationDefinition,
    OwnerDecisionDefinition,
    ProductFamily,
    ProductTemplate,
)
from app.domain.systems.operations import OPERATIONS
from app.domain.systems.owner_decisions import OWNER_DECISIONS
from app.domain.systems.product_families import PRODUCT_FAMILIES
from app.domain.systems.product_templates import PRODUCT_TEMPLATES


class SystemsRegistryService:
    """Read-only in-memory registry for Phase 1."""

    def list_product_families(self) -> list[ProductFamily]:
        return list(PRODUCT_FAMILIES.values())

    def get_product_family(self, family_code: str) -> ProductFamily | None:
        return PRODUCT_FAMILIES.get(family_code)

    def list_product_templates(self) -> list[ProductTemplate]:
        return list(PRODUCT_TEMPLATES.values())

    def get_product_template(self, template_code: str) -> ProductTemplate | None:
        return PRODUCT_TEMPLATES.get(template_code)

    def list_components_for_template(self, template_code: str) -> list[ComponentDefinition]:
        template = self.get_product_template(template_code)
        if template is None:
            return []
        return [COMPONENTS[code] for code in template.component_codes if code in COMPONENTS]

    def list_commercial_rules_for_template(self, template_code: str) -> list[CommercialRuleDefinition]:
        template = self.get_product_template(template_code)
        if template is None:
            return []
        return [COMMERCIAL_RULES[code] for code in template.commercial_rule_codes if code in COMMERCIAL_RULES]

    def list_intake_fields_for_template(self, template_code: str) -> list[IntakeFieldDefinition]:
        template = self.get_product_template(template_code)
        if template is None:
            return []
        return [INTAKE_FIELDS[code] for code in template.intake_field_codes if code in INTAKE_FIELDS]

    def list_owner_decisions_for_template(self, template_code: str) -> list[OwnerDecisionDefinition]:
        template = self.get_product_template(template_code)
        if template is None:
            return []
        return [OWNER_DECISIONS[code] for code in template.owner_decision_codes if code in OWNER_DECISIONS]

    def list_materials_for_template(self, template_code: str) -> list[MaterialDefinition]:
        template = self.get_product_template(template_code)
        if template is None:
            return []
        return [MATERIALS[code] for code in template.material_codes if code in MATERIALS]

    def list_operations_for_template(self, template_code: str) -> list[OperationDefinition]:
        template = self.get_product_template(template_code)
        if template is None:
            return []
        return [OPERATIONS[code] for code in template.operation_codes if code in OPERATIONS]


systems_registry = SystemsRegistryService()
