from __future__ import annotations

import json
from typing import Any

from app.domain.systems.product_templates import FRONTLIT_TEMPLATE
from app.schemas.intake_v6 import IntakeV6WorkspaceDetail

LEGACY_TEMPLATE_TO_SYSTEMS: dict[str, str] = {
    "TPL-VOLUMETRIC-LETTERS_v2": FRONTLIT_TEMPLATE,
}

SYSTEMS_TEMPLATE_TO_LEGACY: dict[str, str] = {
    value: key for key, value in LEGACY_TEMPLATE_TO_SYSTEMS.items()
}


def _parse_intake_snapshot(notes: str | None) -> dict[str, Any]:
    if not notes:
        return {}
    marker = "System-driven intake snapshot:\n"
    if marker not in notes:
        return {}
    try:
        payload = json.loads(notes.split(marker, 1)[1])
    except json.JSONDecodeError:
        return {}
    snapshot = payload.get("intake_snapshot")
    return snapshot if isinstance(snapshot, dict) else {}


def _parse_systems_template_from_notes(notes: str | None) -> str | None:
    if not notes:
        return None
    marker = "System-driven intake snapshot:\n"
    if marker not in notes:
        return None
    try:
        payload = json.loads(notes.split(marker, 1)[1])
    except json.JSONDecodeError:
        return None
    code = payload.get("systems_template_code")
    return code if isinstance(code, str) and code else None


def resolve_systems_template_code(workspace: IntakeV6WorkspaceDetail) -> str | None:
    from_notes = _parse_systems_template_from_notes(workspace.notes)
    if from_notes:
        return from_notes
    return LEGACY_TEMPLATE_TO_SYSTEMS.get(workspace.template_code)


def resolve_intake_payload(workspace: IntakeV6WorkspaceDetail) -> dict[str, Any]:
    """Merge legacy flat workspace columns with Phase 2 intake snapshot from notes."""
    snapshot = _parse_intake_snapshot(workspace.notes)
    payload: dict[str, Any] = {
        "artwork_width_mm": workspace.width_mm,
        "artwork_height_mm": workspace.height_mm,
        "face_area_m2": workspace.letter_face_area_m2,
        "perimeter_ml": workspace.letter_perimeter_m,
        "return_depth_mm": workspace.return_depth_mm,
        "estimated_led_count": workspace.led_module_count,
        "estimated_power_w": workspace.selected_psu_watts,
        "mounting_required": workspace.mounting_template_enabled,
        "mounting_type": workspace.mounting_template_material_type,
        "letter_count": workspace.letter_count,
    }
    payload.update(snapshot)
    return payload


def is_truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if value is None:
        return False
    if isinstance(value, (int, float)):
        return value != 0
    if isinstance(value, str):
        return value.strip().lower() not in {"", "false", "no", "0"}
    return bool(value)
