from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.schemas.intake_v6 import IntakeV6WorkspaceCreate
from app.services.workspace_intake_resolver import resolve_intake_payload
from app.services.workspace_store import WorkspaceStore

client = TestClient(app)


@pytest.fixture
def temp_store(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> WorkspaceStore:
    store = WorkspaceStore(tmp_path / "payload_json_test.db")
    monkeypatch.setattr("app.api.routes.intake_v6.workspace_store", store)
    return store


def _sample_payload_json() -> dict:
    return {
        "schema_version": "1.0.0",
        "template_code": "TPL-VOLUMETRIC-LETTERS_v2",
        "systems_template_code": "volumetric_letters_frontlit",
        "client": {"client_name": "Payload Client", "width_mm": 2000, "height_mm": 600},
        "quote_geometry": {
            "width_mm": 2000,
            "height_mm": 600,
            "letter_count": 4,
            "letter_perimeter_m": 18.5,
            "letter_face_area_m2": 2.4,
            "back_area_m2": 2.0,
            "cut_length_ml": 18.5,
            "finish_area_m2": 2.4,
        },
        "finish_setup": {
            "letter_group_finishes": [],
            "illuminated": True,
            "led_module_count": 48,
            "selected_psu_watts": 160,
            "mounting_template_enabled": False,
            "return_depth_mm": 80,
        },
        "owner_decisions_snapshot": {"face_material": "acrylic_clear"},
    }


def test_workspace_create_read_preserves_payload_json(temp_store: WorkspaceStore) -> None:
    payload_json = _sample_payload_json()
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Payload JSON workspace",
            client_name="Payload Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=2000,
            height_mm=600,
            letter_count=4,
            letter_perimeter_m=18.5,
            letter_face_area_m2=2.4,
            return_depth_mm=80,
            illuminated=True,
            led_module_count=48,
            selected_psu_watts=160,
            mounting_template_enabled=False,
            payload_json=payload_json,
        )
    )

    loaded = temp_store.get_workspace(workspace.id)
    assert loaded is not None
    assert loaded.payload_json is not None
    assert loaded.payload_json["systems_template_code"] == "volumetric_letters_frontlit"
    assert loaded.intake_snapshot is not None
    assert loaded.intake_snapshot["face_area_m2"] == 2.4
    assert loaded.intake_snapshot["letter_count"] == 4


def test_resolver_prefers_payload_json_over_flat_columns(temp_store: WorkspaceStore) -> None:
    payload_json = _sample_payload_json()
    payload_json["quote_geometry"]["letter_face_area_m2"] = 9.9

    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Resolver priority",
            client_name="Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=100,
            height_mm=100,
            letter_count=1,
            letter_perimeter_m=1.0,
            letter_face_area_m2=1.0,
            return_depth_mm=60,
            illuminated=True,
            payload_json=payload_json,
        )
    )
    loaded = temp_store.get_workspace(workspace.id)
    assert loaded is not None

    resolved = resolve_intake_payload(loaded)
    assert resolved["face_area_m2"] == 9.9
    assert resolved["systems_template_code"] == "volumetric_letters_frontlit"
    assert resolved["face_material"] == "acrylic_clear"


def test_resolver_falls_back_to_legacy_flat_columns(temp_store: WorkspaceStore) -> None:
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Legacy flat",
            client_name="Legacy",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1100,
            height_mm=350,
            letter_count=2,
            letter_perimeter_m=5.5,
            letter_face_area_m2=1.1,
            return_depth_mm=70,
            illuminated=True,
        )
    )
    loaded = temp_store.get_workspace(workspace.id)
    assert loaded is not None
    assert loaded.payload_json is None

    resolved = resolve_intake_payload(loaded)
    assert resolved["artwork_width_mm"] == 1100
    assert resolved["face_area_m2"] == 1.1
    assert resolved["cut_length_ml"] == 5.5


def test_api_create_with_payload_json(temp_store: WorkspaceStore) -> None:
    body = {
        "title": "API payload workspace",
        "client_name": "API Client",
        "template_code": "TPL-VOLUMETRIC-LETTERS_v2",
        "width_mm": 1200,
        "height_mm": 400,
        "letter_count": 3,
        "letter_perimeter_m": 12.0,
        "letter_face_area_m2": 1.5,
        "return_depth_mm": 60,
        "illuminated": True,
        "led_module_count": 20,
        "selected_psu_watts": 100,
        "mounting_template_enabled": False,
        "mounting_template_area_m2": None,
        "mounting_template_material_type": None,
        "notes": None,
        "payload_json": _sample_payload_json(),
    }
    response = client.post("/api/v1/intake-v6/workspaces", json=body)
    assert response.status_code == 200
    data = response.json()
    assert data["payload_json"] is not None
    assert data["intake_snapshot"]["face_area_m2"] == 2.4


def test_payload_json_roundtrip_in_sqlite(temp_store: WorkspaceStore) -> None:
    payload_json = _sample_payload_json()
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Roundtrip",
            client_name="Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1200,
            height_mm=400,
            letter_count=1,
            letter_perimeter_m=4.5,
            letter_face_area_m2=1.2,
            return_depth_mm=60,
            illuminated=True,
            payload_json=payload_json,
        )
    )

    with temp_store._connect() as connection:
        row = connection.execute(
            "SELECT payload_json FROM workspaces WHERE id = ?",
            (workspace.id,),
        ).fetchone()
    assert row is not None
    stored = json.loads(row["payload_json"])
    assert stored["systems_template_code"] == "volumetric_letters_frontlit"


def _artwork_payload_json() -> dict:
    base = _sample_payload_json()
    base["svg_source"] = {
        "file_name": "sign.svg",
        "file_size_bytes": 4096,
        "mime_type": "image/svg+xml",
        "upload_status": "analyzed",
        "uploaded_at": "2026-07-01T12:00:00Z",
    }
    base["svg_analysis_json"] = {
        "parser_version": "1.0.0",
        "width": 1200,
        "height": 400,
        "viewBox": "0 0 1200 400",
        "group_count": 2,
        "path_count": 5,
        "layers": [
            {"layer_id": "face_a", "layer_name": "Face A", "source": "g_id", "path_count": 2, "child_group_count": 0},
        ],
    }
    base["layer_role_setup"] = {
        "confirmation_status": "confirmed",
        "layers": [
            {
                "layer_id": "face_a",
                "layer_name": "Face A",
                "source": "g_id",
                "suggested_role": "face",
                "confirmed_role": "face",
                "confirmed": True,
                "ignored": False,
                "path_count": 2,
                "metrics": {"face_area_m2": None, "perimeter_m": None},
            }
        ],
    }
    base["finish_setup"]["letter_group_finishes"] = [
        {
            "group_key": "face_a",
            "layer_name": "Face A",
            "role": "face",
            "face_area_m2": 1.5,
            "perimeter_m": 6.0,
            "face_finish_type": "oracal",
            "return_finish_type": "paint",
            "return_depth_mm": 80,
            "confirmed": True,
        }
    ]
    base["quote_geometry"]["letter_face_area_m2"] = 1.5
    base["quote_geometry"]["letter_perimeter_m"] = 6.0
    base["quote_geometry"]["letter_count"] = 1
    return base


def test_workspace_create_preserves_layer_role_setup(temp_store: WorkspaceStore) -> None:
    payload_json = _artwork_payload_json()
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Artwork workspace",
            client_name="Art Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1200,
            height_mm=400,
            letter_count=1,
            letter_perimeter_m=6.0,
            letter_face_area_m2=1.5,
            return_depth_mm=80,
            illuminated=True,
            payload_json=payload_json,
        )
    )
    loaded = temp_store.get_workspace(workspace.id)
    assert loaded is not None
    assert loaded.payload_json is not None
    assert loaded.payload_json["layer_role_setup"]["confirmation_status"] == "confirmed"
    assert len(loaded.payload_json["finish_setup"]["letter_group_finishes"]) == 1
    assert loaded.intake_snapshot is not None
    assert loaded.intake_snapshot["face_area_m2"] == 1.5
    assert loaded.intake_snapshot["letter_count"] == 1


def test_patch_workspace_payload_updates_artwork(temp_store: WorkspaceStore) -> None:
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Patch target",
            client_name="Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1000,
            height_mm=300,
            letter_count=1,
            letter_perimeter_m=4.0,
            letter_face_area_m2=1.0,
            return_depth_mm=60,
            illuminated=True,
            payload_json=_sample_payload_json(),
        )
    )
    updated_payload = _artwork_payload_json()
    result = temp_store.update_workspace_payload(workspace.id, updated_payload)
    assert result is not None
    assert result.payload_json is not None
    assert result.payload_json["svg_source"]["file_name"] == "sign.svg"
    assert result.intake_snapshot is not None
    assert result.intake_snapshot["perimeter_ml"] == 6.0


def test_api_patch_payload(temp_store: WorkspaceStore) -> None:
    create_body = {
        "title": "API patch workspace",
        "client_name": "Client",
        "template_code": "TPL-VOLUMETRIC-LETTERS_v2",
        "width_mm": 1000,
        "height_mm": 300,
        "letter_count": 1,
        "letter_perimeter_m": 4.0,
        "letter_face_area_m2": 1.0,
        "return_depth_mm": 60,
        "illuminated": True,
        "payload_json": _sample_payload_json(),
    }
    create_response = client.post("/api/v1/intake-v6/workspaces", json=create_body)
    assert create_response.status_code == 200
    workspace_id = create_response.json()["id"]

    patch_response = client.patch(
        f"/api/v1/intake-v6/workspaces/{workspace_id}/payload",
        json={"payload_json": _artwork_payload_json()},
    )
    assert patch_response.status_code == 200
    data = patch_response.json()
    assert data["payload_json"]["svg_source"]["upload_status"] == "analyzed"
    assert data["intake_snapshot"]["face_area_m2"] == 1.5


def test_preview_resolver_reads_artwork_payload(temp_store: WorkspaceStore) -> None:
    payload_json = _artwork_payload_json()
    workspace = temp_store.create_workspace(
        IntakeV6WorkspaceCreate(
            title="Preview artwork",
            client_name="Client",
            template_code="TPL-VOLUMETRIC-LETTERS_v2",
            width_mm=1200,
            height_mm=400,
            letter_count=1,
            letter_perimeter_m=6.0,
            letter_face_area_m2=1.5,
            return_depth_mm=80,
            illuminated=True,
            payload_json=payload_json,
        )
    )
    loaded = temp_store.get_workspace(workspace.id)
    assert loaded is not None
    resolved = resolve_intake_payload(loaded)
    assert resolved["face_area_m2"] == 1.5
    assert resolved["perimeter_ml"] == 6.0
    assert resolved["letter_groups_confirmed"] is True
