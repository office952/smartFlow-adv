from fastapi import APIRouter, HTTPException

from app.domain.systems.models import (
    CommercialRuleDefinition,
    ComponentDefinition,
    IntakeFieldDefinition,
    OwnerDecisionDefinition,
    ProductFamily,
    ProductTemplate,
)
from app.domain.systems.registry_service import systems_registry


router = APIRouter()


@router.get("/product-families", response_model=list[ProductFamily])
async def list_product_families() -> list[ProductFamily]:
    return systems_registry.list_product_families()


@router.get("/product-families/{family_code}", response_model=ProductFamily)
async def get_product_family(family_code: str) -> ProductFamily:
    family = systems_registry.get_product_family(family_code)
    if family is None:
        raise HTTPException(status_code=404, detail="Product family not found")
    return family


@router.get("/product-templates", response_model=list[ProductTemplate])
async def list_product_templates() -> list[ProductTemplate]:
    return systems_registry.list_product_templates()


@router.get("/product-templates/{template_code}", response_model=ProductTemplate)
async def get_product_template(template_code: str) -> ProductTemplate:
    template = systems_registry.get_product_template(template_code)
    if template is None:
        raise HTTPException(status_code=404, detail="Product template not found")
    return template


@router.get("/product-templates/{template_code}/components", response_model=list[ComponentDefinition])
async def list_template_components(template_code: str) -> list[ComponentDefinition]:
    _require_template(template_code)
    return systems_registry.list_components_for_template(template_code)


@router.get("/product-templates/{template_code}/commercial-rules", response_model=list[CommercialRuleDefinition])
async def list_template_commercial_rules(template_code: str) -> list[CommercialRuleDefinition]:
    _require_template(template_code)
    return systems_registry.list_commercial_rules_for_template(template_code)


@router.get("/product-templates/{template_code}/intake-fields", response_model=list[IntakeFieldDefinition])
async def list_template_intake_fields(template_code: str) -> list[IntakeFieldDefinition]:
    _require_template(template_code)
    return systems_registry.list_intake_fields_for_template(template_code)


@router.get("/product-templates/{template_code}/owner-decisions", response_model=list[OwnerDecisionDefinition])
async def list_template_owner_decisions(template_code: str) -> list[OwnerDecisionDefinition]:
    _require_template(template_code)
    return systems_registry.list_owner_decisions_for_template(template_code)


def _require_template(template_code: str) -> None:
    if systems_registry.get_product_template(template_code) is None:
        raise HTTPException(status_code=404, detail="Product template not found")
