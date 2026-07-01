from __future__ import annotations

import pytest

from app.services.intake_snapshot_builder import build_intake_snapshot


def test_derives_width_height_from_client() -> None:
    snapshot = build_intake_snapshot(
        {
            "client": {"width_mm": 1500, "height_mm": 500},
            "quote_geometry": {},
            "finish_setup": {},
        }
    )
    assert snapshot["artwork_width_mm"] == 1500
    assert snapshot["artwork_height_mm"] == 500


def test_prefers_quote_geometry_dimensions_over_client() -> None:
    snapshot = build_intake_snapshot(
        {
            "client": {"width_mm": 1000, "height_mm": 300},
            "quote_geometry": {"width_mm": 1200, "height_mm": 400},
            "finish_setup": {},
        }
    )
    assert snapshot["artwork_width_mm"] == 1200
    assert snapshot["artwork_height_mm"] == 400


def test_sums_face_area_from_confirmed_letter_groups() -> None:
    snapshot = build_intake_snapshot(
        {
            "quote_geometry": {},
            "finish_setup": {
                "letter_group_finishes": [
                    {"group_key": "a", "face_area_m2": 0.5, "confirmed": True},
                    {"group_key": "b", "face_area_m2": 0.7, "confirmed": True},
                    {"group_key": "c", "face_area_m2": 9.9, "confirmed": False},
                ]
            },
        }
    )
    assert snapshot["face_area_m2"] == 1.2


def test_sums_perimeter_into_perimeter_ml() -> None:
    snapshot = build_intake_snapshot(
        {
            "quote_geometry": {},
            "finish_setup": {
                "letter_group_finishes": [
                    {"group_key": "a", "perimeter_m": 2.5, "confirmed": True},
                    {"group_key": "b", "perimeter_m": 2.0, "confirmed": True},
                ]
            },
        }
    )
    assert snapshot["perimeter_ml"] == 4.5


def test_derives_cut_length_ml_from_perimeter() -> None:
    snapshot = build_intake_snapshot(
        {
            "quote_geometry": {"letter_perimeter_m": 8.25},
            "finish_setup": {},
        }
    )
    assert snapshot["perimeter_ml"] == 8.25
    assert snapshot["cut_length_ml"] == 8.25


def test_derives_support_from_mounting_system() -> None:
    snapshot = build_intake_snapshot(
        {
            "finish_setup": {"mounting_system": "steel_bars"},
        }
    )
    assert snapshot["support_required"] is True
    assert snapshot["support_type"] == "steel_bars"

    direct = build_intake_snapshot({"finish_setup": {"mounting_system": "direct_wall"}})
    assert direct["support_required"] is False
    assert direct["support_type"] == "direct_wall"


def test_derives_mounting_from_template_fields() -> None:
    snapshot = build_intake_snapshot(
        {
            "finish_setup": {
                "mounting_template_enabled": True,
                "mounting_template_area_m2": 3.05,
                "mounting_template_material_type": "forex",
            }
        }
    )
    assert snapshot["mounting_required"] is True
    assert snapshot["mounting_type"] == "forex"
    assert snapshot["mounting_template_area_m2"] == 3.05


def test_unconfirmed_groups_produce_letter_groups_confirmed_false() -> None:
    snapshot = build_intake_snapshot(
        {
            "finish_setup": {
                "letter_group_finishes": [
                    {"group_key": "a", "confirmed": False},
                    {"group_key": "b", "confirmed": True},
                ]
            }
        }
    )
    assert snapshot["letter_groups_confirmed"] is False


def test_missing_values_stay_missing() -> None:
    snapshot = build_intake_snapshot({"client": {}, "quote_geometry": {}, "finish_setup": {}})
    assert "face_area_m2" not in snapshot
    assert "perimeter_ml" not in snapshot
    assert "estimated_led_count" not in snapshot


def test_empty_payload_returns_empty_snapshot() -> None:
    assert build_intake_snapshot({}) == {}
    assert build_intake_snapshot(None) == {}
