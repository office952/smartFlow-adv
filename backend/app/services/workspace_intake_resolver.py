from __future__ import annotations

import json
from typing import Any

from app.domain.systems.product_templates import FRONTLIT_TEMPLATE
from app.schemas.intake_v6 import IntakeV6WorkspaceDetail
from app.services.intake_snapshot_builder import build_intake_snapshot

LEGACY_TEMPLATE_TO_SYSTEMS: dict[str, str] = {
    "TPL-VOLUMETRIC-LETTERS_v2": FRONTLIT_TEMPLATE,
}

SYSTEMS_TEMPLATE_TO_LEGACY: dict[str, str] = {
    value: key for key, value in LEGACY_TEMPLATE_TO_SYSTEMS.items()
}


def _parse_intake_snapshot_from_notes(notes: str | None) -> dict[str, Any]:
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


def _merge_snapshots(*sources: dict[str, Any]) -> dict[str, Any]:
    merged: dict[str, Any] = {}
    for source in sources:
        for key, value in source.items():
            if value is None:
                continue
            if value == "":
                continue
            merged[key] = value
    return merged


def _flat_workspace_fallback(workspace: IntakeV6WorkspaceDetail) -> dict[str, Any]:
    return {
        "artwork_width_mm": workspace.width_mm,
        "artwork_height_mm": workspace.height_mm,
        "face_area_m2": workspace.letter_face_area_m2,
        "perimeter_ml": workspace.letter_perimeter_m,
        "cut_length_ml": workspace.letter_perimeter_m,
        "return_depth_mm": workspace.return_depth_mm,
        "letter_count": workspace.letter_count,
        "estimated_led_count": workspace.led_module_count,
        "estimated_power_w": workspace.selected_psu_watts,
        "mounting_required": workspace.mounting_template_enabled,
        "mounting_type": workspace.mounting_template_material_type,
        "mounting_template_area_m2": workspace.mounting_template_area_m2,
        "illuminated": workspace.illuminated,
    }


def resolve_systems_template_code(workspace: IntakeV6WorkspaceDetail) -> str | None:
    payload = workspace.payload_json if isinstance(workspace.payload_json, dict) else {}
    from_payload = payload.get("systems_template_code")
    if isinstance(from_payload, str) and from_payload.strip():
        return from_payload.strip()

    from_notes = _parse_systems_template_from_notes(workspace.notes)
    if from_notes:
        return from_notes

    return LEGACY_TEMPLATE_TO_SYSTEMS.get(workspace.template_code)


def resolve_intake_payload(workspace: IntakeV6WorkspaceDetail) -> dict[str, Any]:
    """Merge intake context for quote preview — payload_json first, legacy fallbacks last."""
    payload_json = workspace.payload_json if isinstance(workspace.payload_json, dict) else {}

    derived = build_intake_snapshot(payload_json) if payload_json else {}

    cached: dict[str, Any] = {}
    if payload_json:
        raw_cached = payload_json.get("intake_snapshot")
        if isinstance(raw_cached, dict):
            cached = raw_cached

    if workspace.intake_snapshot and isinstance(workspace.intake_snapshot, dict):
        cached = _merge_snapshots(cached, workspace.intake_snapshot)

    notes_snapshot = _parse_intake_snapshot_from_notes(workspace.notes)

    if payload_json:
        merged = _merge_snapshots(notes_snapshot, cached, derived)
    else:
        flat_fallback = _flat_workspace_fallback(workspace)
        merged = _merge_snapshots(flat_fallback, notes_snapshot, cached, derived)

    systems_code = resolve_systems_template_code(workspace)
    if systems_code:
        merged.setdefault("systems_template_code", systems_code)

    owner_snapshot = payload_json.get("owner_decisions_snapshot") if payload_json else None
    if isinstance(owner_snapshot, dict):
        for code, value in owner_snapshot.items():
            if code not in merged and value not in (None, ""):
                merged[code] = value

    return merged


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
