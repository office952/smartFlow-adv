"""Derive canonical flat intake_snapshot from structured payload_json."""

from __future__ import annotations

from typing import Any

BAR_MOUNTING_SYSTEMS = frozenset({"steel_bars", "aluminum_bars"})


def _get_dict(root: Any, key: str) -> dict[str, Any]:
    if not isinstance(root, dict):
        return {}
    value = root.get(key)
    return value if isinstance(value, dict) else {}


def _positive_number(raw: Any) -> float | None:
    if raw is None or raw == "":
        return None
    try:
        value = float(raw)
    except (TypeError, ValueError):
        return None
    if value <= 0:
        return None
    return value


def _positive_int(raw: Any) -> int | None:
    value = _positive_number(raw)
    if value is None:
        return None
    return int(value)


def _sum_confirmed_group_metric(groups: list[Any], key: str) -> float | None:
    total = 0.0
    counted = 0
    for row in groups:
        if not isinstance(row, dict):
            continue
        if row.get("confirmed") is not True:
            continue
        metric = _positive_number(row.get(key))
        if metric is None:
            continue
        total += metric
        counted += 1
    return round(total, 6) if counted > 0 else None


def _default_return_depth_mm(groups: list[Any], finish: dict[str, Any]) -> float | None:
    explicit = _positive_number(finish.get("return_depth_mm"))
    if explicit is not None:
        return explicit
    for row in groups:
        if not isinstance(row, dict):
            continue
        depth = _positive_number(row.get("return_depth_mm"))
        if depth is not None:
            return depth
    return None


def _letter_groups_confirmed(groups: list[Any]) -> bool | None:
    if not groups:
        return None
    valid = [row for row in groups if isinstance(row, dict)]
    if not valid:
        return None
    return all(row.get("confirmed") is True for row in valid)


def _artwork_confirmed(artworks: list[Any]) -> bool | None:
    if not artworks:
        return None
    valid = [row for row in artworks if isinstance(row, dict)]
    if not valid:
        return None
    return all(row.get("confirmed") is True for row in valid)


def _count_confirmed_face_layers(layer_setup: dict[str, Any]) -> int | None:
    layers = layer_setup.get("layers")
    if not isinstance(layers, list):
        return None
    confirmed = [
        row
        for row in layers
        if isinstance(row, dict)
        and row.get("confirmed") is True
        and row.get("ignored") is not True
        and str(row.get("confirmed_role") or "").strip() == "face"
    ]
    return len(confirmed) if confirmed else None


def build_intake_snapshot(payload_json: dict[str, Any] | None) -> dict[str, Any]:
    """Derive flat canonical intake fields. Missing values stay absent — never invented."""
    if not payload_json or not isinstance(payload_json, dict):
        return {}

    client = _get_dict(payload_json, "client")
    geometry = _get_dict(payload_json, "quote_geometry")
    finish = _get_dict(payload_json, "finish_setup")
    groups = finish.get("letter_group_finishes")
    group_list = groups if isinstance(groups, list) else []
    artworks = finish.get("artwork_finishes")
    artwork_list = artworks if isinstance(artworks, list) else []

    width_mm = _positive_number(geometry.get("width_mm")) or _positive_number(client.get("width_mm"))
    height_mm = _positive_number(geometry.get("height_mm")) or _positive_number(client.get("height_mm"))

    face_area = _positive_number(geometry.get("letter_face_area_m2")) or _positive_number(geometry.get("face_area_m2"))
    if face_area is None:
        face_area = _sum_confirmed_group_metric(group_list, "face_area_m2")

    perimeter_m = _positive_number(geometry.get("letter_perimeter_m")) or _positive_number(geometry.get("perimeter_m"))
    if perimeter_m is None:
        perimeter_m = _sum_confirmed_group_metric(group_list, "perimeter_m")

    cut_length = _positive_number(geometry.get("cut_length_ml"))
    if cut_length is None and perimeter_m is not None:
        cut_length = perimeter_m

    back_area = _positive_number(geometry.get("back_area_m2"))
    if back_area is None:
        back_area = _positive_number(finish.get("back_area_m2"))
    finish_area = _positive_number(geometry.get("finish_area_m2"))
    if finish_area is None and face_area is not None:
        finish_area = face_area

    letter_count = _positive_int(geometry.get("letter_count"))
    if letter_count is None and group_list:
        confirmed_groups = [row for row in group_list if isinstance(row, dict) and row.get("confirmed") is True]
        if confirmed_groups:
            letter_count = len(confirmed_groups)
    if letter_count is None:
        layer_setup = _get_dict(payload_json, "layer_role_setup")
        letter_count = _count_confirmed_face_layers(layer_setup)

    mounting_system = finish.get("mounting_system")
    support_required: bool | None = None
    support_type: str | None = None
    if finish.get("support_required") is not None:
        support_required = bool(finish.get("support_required"))
        st = finish.get("support_type")
        support_type = str(st).strip() if st is not None and str(st).strip() else None
    elif mounting_system is not None:
        ms = str(mounting_system).strip()
        support_required = ms in BAR_MOUNTING_SYSTEMS
        support_type = ms if ms in BAR_MOUNTING_SYSTEMS else None

    mounting_required: bool | None = None
    if finish.get("mounting_template_enabled") is not None:
        mounting_required = bool(finish.get("mounting_template_enabled"))

    mounting_type = finish.get("mounting_template_material_type")
    if mounting_type is not None:
        mounting_type = str(mounting_type).strip() or None

    snapshot: dict[str, Any] = {}

    template_code = payload_json.get("template_code")
    if isinstance(template_code, str) and template_code.strip():
        snapshot["template_code"] = template_code.strip()

    systems_template = payload_json.get("systems_template_code")
    if isinstance(systems_template, str) and systems_template.strip():
        snapshot["systems_template_code"] = systems_template.strip()

    def put(key: str, value: Any) -> None:
        if value is None:
            return
        if isinstance(value, bool):
            snapshot[key] = value
            return
        if value == "":
            return
        snapshot[key] = value

    put("artwork_width_mm", width_mm)
    put("artwork_height_mm", height_mm)
    put("letter_count", letter_count)
    put("face_area_m2", face_area)
    put("back_area_m2", back_area)
    put("perimeter_ml", perimeter_m)
    put("cut_length_ml", cut_length)
    put("return_depth_mm", _default_return_depth_mm(group_list, finish))
    put("finish_area_m2", finish_area)
    put("estimated_led_count", _positive_int(finish.get("led_module_count")))
    put("estimated_power_w", _positive_number(finish.get("selected_psu_watts")))

    if finish.get("illuminated") is not None:
        put("illuminated", bool(finish.get("illuminated")))

    lighting = finish.get("lighting_system_type")
    if lighting is not None and str(lighting).strip():
        put("lighting_system_type", str(lighting).strip())

    light_color = finish.get("light_color")
    if light_color is not None and str(light_color).strip():
        put("light_color", str(light_color).strip())

    put("support_required", support_required)
    put("support_type", support_type)
    put("mounting_required", mounting_required)
    put("mounting_type", mounting_type)
    put("mounting_template_area_m2", _positive_number(finish.get("mounting_template_area_m2")))

    if finish.get("packaging_required") is not None:
        put("packaging_required", bool(finish.get("packaging_required")))
    pkg = finish.get("package_size_class")
    if pkg is not None and str(pkg).strip():
        put("package_size_class", str(pkg).strip())

    backing = finish.get("backing_mode")
    if backing is not None and str(backing).strip():
        put("backing_mode", str(backing).strip())

    put("letter_groups_confirmed", _letter_groups_confirmed(group_list))
    put("artwork_confirmed", _artwork_confirmed(artwork_list))

    return snapshot
