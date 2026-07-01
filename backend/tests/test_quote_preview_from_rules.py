from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.domain.systems.commercial_rules import COMMERCIAL_RULES
from app.domain.systems.models import FORBIDDEN_COMMERCIAL_BASES
from app.domain.systems.product_templates import FRONTLIT_TEMPLATE
from app.domain.systems.registry_service import systems_registry
from app.main import app
from app.schemas.intake_v6 import IntakeV6WorkspaceCreate
from app.schemas.quotes import QuoteLinePriceUpdate, QuoteOwnerDecisionUpdate
from app.services.quote_preview_contract import PREVIEW_SOURCE
from app.services.quote_preview_service import QuotePreviewService
from app.services.workspace_store import WorkspaceStore


client = TestClient(app)

FRONTLIT_RULE_CODES = {
    "face_area_rule",
    "face_cut_rule",
    "return_cant_rule",
    "back_panel_rule",
    "led_modules_rule",
    "psu_rule",
    "finish_rule",
    "support_rule",
    "mounting_rule",
    "sablon_montaj_rule",
    "packaging_rule",
}

OLD_HARDCODED_LINE_CODES = {
    "debitare_fata",
    "modelare_cant_aluminiu",
    "debitare_spate",
    "sistem_led_module",
    "sursa_led",
    "finisaje_colantare_vopsire",
    "sablon_montaj_forex",
}


@pytest.fixture
def temp_store(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> WorkspaceStore:
    store = WorkspaceStore(tmp_path / "quote_preview_test.db")
    monkeypatch.setattr("app.api.routes.intake_v6.workspace_store", store)
    monkeypatch.setattr("app.api.routes.quotes.workspace_store", store)
    return store


def _intake_notes(snapshot: dict) -> str:
    payload = {
        "systems_template_code": FRONTLIT_TEMPLATE,
        "intake_snapshot": snapshot,
        "adapter": "phase2_legacy_flat_map",
    }
    return f"System-driven intake snapshot:\n{json.dumps(payload, indent=2)}"


def _complete_snapshot(**overrides: object) -> dict:
    base = {
        "artwork_width_mm": 1200,
        "artwork_height_mm": 400,
        "face_area_m2": 1.2,
        "back_area_m2": 1.0,
        "perimeter_ml": 4.5,
        "return_depth_mm": 80,
        "finish_area_m2": 1.2,
        "estimated_led_count": 12,
        "estimated_power_w": 100,
        "cut_length_ml": 4.5,
        "support_required": False,
        "mounting_required": False,
        "packaging_required": False,
    }
    base.update(overrides)
    return base


def _create_workspace(store: WorkspaceStore, snapshot: dict | None = None) -> str:
    snap = snapshot if snapshot is not None else _complete_snapshot()
    workspace = store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Phase 3 preview test",
            client_name="Test Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=float(snap.get("artwork_width_mm", 1200)),
            height_mm=float(snap.get("artwork_height_mm", 400)),
            letter_count=1,
            letter_perimeter_m=float(snap.get("perimeter_ml", 4.5)),
            letter_face_area_m2=float(snap.get("face_area_m2", 1.2)),
            return_depth_mm=float(snap.get("return_depth_mm", 80)),
            illuminated=True,
            led_module_count=int(snap.get("estimated_led_count", 12)),
            selected_psu_watts=int(snap.get("estimated_power_w", 100)),
            mounting_template_enabled=bool(snap.get("mounting_required", False)),
            notes=_intake_notes(snap),
        )
    )
    return workspace.id


def _approve_core_owner_decisions(store: WorkspaceStore, workspace_id: str) -> None:
    decisions = {
        "face_material": "acrylic_clear",
        "return_material": "aluminum_brushed",
        "back_material": "pvc_white",
        "led_type": "module_standard",
        "led_density_policy": "standard",
        "psu_policy": "auto_class",
        "finish_type": "foil",
    }
    for code, value in decisions.items():
        store.upsert_owner_decision(
            workspace_id,
            QuoteOwnerDecisionUpdate(
                code=code,
                label=code,
                detail="test",
                status="approved",
                selected_value=value,
            ),
        )


def _set_rule_prices(store: WorkspaceStore, workspace_id: str, rule_codes: list[str], price: float = 10.0) -> None:
    for rule_code in rule_codes:
        store.upsert_line_price(
            workspace_id,
            QuoteLinePriceUpdate(line_code=rule_code, unit_price=price, currency="RON"),
        )


def test_preview_uses_registry_rule_codes_not_old_catalog(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    preview = QuotePreviewService(temp_store).build_preview(workspace_id)

    line_codes = {line.code for line in preview.lines}
    assert line_codes == FRONTLIT_RULE_CODES
    assert line_codes.isdisjoint(OLD_HARDCODED_LINE_CODES)
    assert preview.provenance == PREVIEW_SOURCE
    assert all(line.source == PREVIEW_SOURCE for line in preview.lines)
    assert all(line.component_display_name for line in preview.lines if line.component_code)


def test_all_frontlit_commercial_rules_appear_as_lines(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    preview = QuotePreviewService(temp_store).build_preview(workspace_id)
    assert len(preview.lines) == 11
    assert {line.rule_code for line in preview.lines} == FRONTLIT_RULE_CODES


def test_cut_length_ml_derived_from_perimeter_when_omitted(temp_store: WorkspaceStore) -> None:
    snapshot = _complete_snapshot()
    del snapshot["cut_length_ml"]
    workspace_id = _create_workspace(temp_store, snapshot)
    _approve_core_owner_decisions(temp_store, workspace_id)

    preview = QuotePreviewService(temp_store).build_preview(workspace_id)
    cut_line = next(line for line in preview.lines if line.rule_code == "face_cut_rule")

    assert cut_line.quantity == 4.5


def test_missing_perimeter_and_cut_blocks_face_cut_rule(temp_store: WorkspaceStore) -> None:
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="No perimeter",
            client_name="Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1200,
            height_mm=400,
            letter_count=1,
            letter_perimeter_m=0.001,
            letter_face_area_m2=1.2,
            return_depth_mm=60,
            illuminated=True,
            payload_json={
                "systems_template_code": FRONTLIT_TEMPLATE,
                "quote_geometry": {"letter_face_area_m2": 1.2},
                "finish_setup": {},
            },
        )
    )
    _approve_core_owner_decisions(temp_store, workspace.id)
    preview = QuotePreviewService(temp_store).build_preview(workspace.id)
    cut_line = next(line for line in preview.lines if line.rule_code == "face_cut_rule")
    assert cut_line.line_status == "blocked"


def test_missing_owner_decision_blocks_relevant_rule(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    preview = QuotePreviewService(temp_store).build_preview(workspace_id)
    face_line = next(line for line in preview.lines if line.rule_code == "face_area_rule")

    assert face_line.line_status == "blocked"
    assert any(blocker.code == "OWNER_DECISION_MISSING" for blocker in face_line.blockers)


def test_missing_owner_price_blocks_priced_rule(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    _approve_core_owner_decisions(temp_store, workspace_id)

    preview = QuotePreviewService(temp_store).build_preview(workspace_id)
    priced_rules = [
        line for line in preview.lines if line.rule_code in {"face_area_rule", "return_cant_rule", "finish_rule"}
    ]

    assert all(line.line_status == "blocked" for line in priced_rules)
    assert all(
        any(blocker.code == "OWNER_PRICE_MISSING" for blocker in line.blockers) for line in priced_rules
    )


def test_no_fake_totals_when_blocked(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    preview = QuotePreviewService(temp_store).build_preview(workspace_id)

    assert preview.status == "blocked"
    assert preview.subtotal_net is None
    assert preview.vat_amount is None
    assert preview.total_gross is None


def test_preview_ready_when_complete_fixture(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    _approve_core_owner_decisions(temp_store, workspace_id)
    _set_rule_prices(
        temp_store,
        workspace_id,
        [
            "face_area_rule",
            "face_cut_rule",
            "return_cant_rule",
            "back_panel_rule",
            "led_modules_rule",
            "psu_rule",
            "finish_rule",
        ],
        price=25.0,
    )

    preview = QuotePreviewService(temp_store).build_preview(workspace_id)

    assert preview.status == "ready"
    assert preview.subtotal_net is not None and preview.subtotal_net > 0
    assert preview.total_gross is not None and preview.total_gross > preview.subtotal_net


def test_support_and_mounting_rules_remain_separate(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    preview = QuotePreviewService(temp_store).build_preview(workspace_id)
    by_code = {line.rule_code: line for line in preview.lines}

    assert by_code["support_rule"].component_code == "support"
    assert by_code["mounting_rule"].component_code == "mounting"
    assert by_code["support_rule"].component_code != by_code["mounting_rule"].component_code


def test_no_commercial_rule_uses_forbidden_basis() -> None:
    rules = systems_registry.list_commercial_rules_for_template(FRONTLIT_TEMPLATE)
    for rule in rules:
        assert rule.commercial_basis not in FORBIDDEN_COMMERCIAL_BASES
        for alt in rule.commercial_basis_alternatives:
            assert alt not in FORBIDDEN_COMMERCIAL_BASES


def test_api_returns_blocked_preview_for_incomplete_workspace(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    response = client.post(f"/api/v1/intake-v6/workspaces/{workspace_id}/quote-preview")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "blocked"
    assert payload["provenance"] == PREVIEW_SOURCE
    assert payload["total_gross"] is None


def test_api_returns_ready_preview_for_complete_fixture(temp_store: WorkspaceStore) -> None:
    workspace_id = _create_workspace(temp_store)
    _approve_core_owner_decisions(temp_store, workspace_id)
    _set_rule_prices(
        temp_store,
        workspace_id,
        [
            "face_area_rule",
            "face_cut_rule",
            "return_cant_rule",
            "back_panel_rule",
            "led_modules_rule",
            "psu_rule",
            "finish_rule",
        ],
    )

    response = client.post(f"/api/v1/intake-v6/workspaces/{workspace_id}/quote-preview")
    assert response.status_code == 200
    payload = response.json()
    assert payload["status"] == "ready"
    assert payload["template_code"] == FRONTLIT_TEMPLATE


def test_registry_commercial_rules_count() -> None:
    assert len(COMMERCIAL_RULES) >= 11


def test_preview_with_payload_json_workspace(temp_store: WorkspaceStore) -> None:
    payload_json = {
        "systems_template_code": FRONTLIT_TEMPLATE,
        "quote_geometry": {
            "letter_face_area_m2": 1.5,
            "letter_perimeter_m": 6.0,
            "back_area_m2": 1.2,
        },
        "finish_setup": {
            "illuminated": True,
            "led_module_count": 15,
            "selected_psu_watts": 100,
            "return_depth_mm": 80,
        },
    }
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Payload preview",
            client_name="Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1200,
            height_mm=400,
            letter_count=1,
            letter_perimeter_m=1.0,
            letter_face_area_m2=1.0,
            return_depth_mm=60,
            illuminated=True,
            payload_json=payload_json,
        )
    )
    preview = QuotePreviewService(temp_store).build_preview(workspace.id)
    face_line = next(line for line in preview.lines if line.rule_code == "face_area_rule")
    assert face_line.quantity == 1.5
    assert preview.status == "blocked"
    assert preview.total_gross is None
