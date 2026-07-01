from __future__ import annotations

from typing import Literal

PreviewStatus = Literal["blocked", "ready"]
PreviewLineStatus = Literal["blocked", "priced", "included", "manual_review", "not_applicable"]

PREVIEW_SOURCE = "commercial_rule_registry"
PROVENANCE = "commercial_rule_registry"

BLOCKER_REQUIRED_INPUT_MISSING = "REQUIRED_INPUT_MISSING"
BLOCKER_OWNER_DECISION_MISSING = "OWNER_DECISION_MISSING"
BLOCKER_OWNER_PRICE_MISSING = "OWNER_PRICE_MISSING"
BLOCKER_UNSUPPORTED_BASIS = "UNSUPPORTED_BASIS"
BLOCKER_MANUAL_OWNER_REVIEW = "MANUAL_OWNER_REVIEW_REQUIRED"
BLOCKER_UNSUPPORTED_TEMPLATE = "UNSUPPORTED_TEMPLATE"
BLOCKER_NO_COMMERCIAL_RULES = "NO_COMMERCIAL_RULES"

NON_QUANTITY_BASES = frozenset(
    {
        "service_fixed",
        "external_service",
        "manual_owner_review",
        "included",
        "lucrare",
        "set",
    }
)

MP_QUANTITY_FIELDS = ("face_area_m2", "back_area_m2", "finish_area_m2", "mounting_template_area_m2")
ML_QUANTITY_FIELDS = ("perimeter_ml", "cut_length_ml")
BUC_QUANTITY_FIELDS = ("estimated_led_count", "estimated_power_w", "letter_count")

CONDITIONAL_INPUTS: dict[str, tuple[str, bool]] = {
    "support_type": ("support_required", True),
    "mounting_type": ("mounting_required", True),
    "package_size_class": ("packaging_required", True),
}


def basis_type_display(basis: str) -> str:
    return {"mp": "m2", "buc": "piece", "ml": "ml"}.get(basis, basis)
