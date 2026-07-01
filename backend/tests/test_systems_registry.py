from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.domain.systems.models import FORBIDDEN_COMMERCIAL_BASES
from app.domain.systems.product_templates import FRONTLIT_COMPONENT_CODES, FRONTLIT_TEMPLATE
from app.domain.systems.registry_service import systems_registry
from app.main import app


client = TestClient(app)

FRONTLIT_COMPONENTS = set(FRONTLIT_COMPONENT_CODES)


def test_volumetric_letters_family_exists() -> None:
    family = systems_registry.get_product_family("volumetric_letters")
    assert family is not None
    assert family.display_name == "Volumetric Letters"
    assert "volumetric_letters_frontlit" in family.template_codes


def test_frontlit_template_exists() -> None:
    template = systems_registry.get_product_template(FRONTLIT_TEMPLATE)
    assert template is not None
    assert template.status == "active"
    assert template.family_code == "volumetric_letters"


def test_frontlit_has_expected_components() -> None:
    components = systems_registry.list_components_for_template(FRONTLIT_TEMPLATE)
    codes = {component.component_code for component in components}
    assert codes == FRONTLIT_COMPONENTS
    assert "support" in codes
    assert "mounting" in codes
    assert "support" != "mounting"


def test_frontlit_commercial_rules_exist() -> None:
    rules = systems_registry.list_commercial_rules_for_template(FRONTLIT_TEMPLATE)
    assert len(rules) == 11
    rule_codes = {rule.rule_code for rule in rules}
    assert "support_rule" in rule_codes
    assert "mounting_rule" in rule_codes
    assert "sablon_montaj_rule" in rule_codes


def test_no_forbidden_commercial_basis() -> None:
    rules = systems_registry.list_commercial_rules_for_template(FRONTLIT_TEMPLATE)
    for rule in rules:
        assert rule.commercial_basis not in FORBIDDEN_COMMERCIAL_BASES
        for alt in rule.commercial_basis_alternatives:
            assert alt not in FORBIDDEN_COMMERCIAL_BASES


def test_support_and_mounting_are_separate_rules() -> None:
    rules = {rule.rule_code: rule for rule in systems_registry.list_commercial_rules_for_template(FRONTLIT_TEMPLATE)}
    assert rules["support_rule"].component_code == "support"
    assert rules["mounting_rule"].component_code == "mounting"
    assert rules["support_rule"].component_code != rules["mounting_rule"].component_code


def test_frontlit_intake_fields_listed() -> None:
    fields = systems_registry.list_intake_fields_for_template(FRONTLIT_TEMPLATE)
    codes = {field.field_code for field in fields}
    assert "artwork_width_mm" in codes
    assert "face_area_m2" in codes
    assert "mounting_required" in codes
    assert len(codes) >= 24


def test_frontlit_owner_decisions_listed() -> None:
    decisions = systems_registry.list_owner_decisions_for_template(FRONTLIT_TEMPLATE)
    codes = {decision.decision_code for decision in decisions}
    assert "face_material" in codes
    assert "mounting_type_decision" in codes
    assert len(codes) >= 18


@pytest.mark.parametrize(
    "path",
    [
        "/api/v1/systems/product-families",
        "/api/v1/systems/product-families/volumetric_letters",
        "/api/v1/systems/product-templates",
        f"/api/v1/systems/product-templates/{FRONTLIT_TEMPLATE}",
        f"/api/v1/systems/product-templates/{FRONTLIT_TEMPLATE}/components",
        f"/api/v1/systems/product-templates/{FRONTLIT_TEMPLATE}/commercial-rules",
        f"/api/v1/systems/product-templates/{FRONTLIT_TEMPLATE}/intake-fields",
        f"/api/v1/systems/product-templates/{FRONTLIT_TEMPLATE}/owner-decisions",
    ],
)
def test_systems_api_returns_success(path: str) -> None:
    response = client.get(path)
    assert response.status_code == 200
    payload = response.json()
    assert payload is not None


def test_systems_api_does_not_return_price_totals() -> None:
    response = client.get(f"/api/v1/systems/product-templates/{FRONTLIT_TEMPLATE}/commercial-rules")
    assert response.status_code == 200
    body = response.text.lower()
    forbidden_keys = ["total_gross", "subtotal_net", "unit_price", "vat_amount"]
    for key in forbidden_keys:
        assert key not in body
    rules = response.json()
    for rule in rules:
        assert "price" not in rule
        assert "total" not in rule
