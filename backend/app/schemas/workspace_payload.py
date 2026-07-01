"""SmartFlow workspace payload_json contract — Phase 2B."""

from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, Field


PAYLOAD_SCHEMA_VERSION = "1.0.0"

SvgUploadStatus = Literal["missing", "analyzed", "failed"]
LayerSetupStatus = Literal["missing", "draft", "partial", "confirmed", "complete"]


class WorkspaceClientPayload(BaseModel):
    client_name: str | None = None
    width_mm: float | None = None
    height_mm: float | None = None


class WorkspaceSvgSourcePayload(BaseModel):
    file_name: str | None = None
    file_size_bytes: int | None = None
    mime_type: str | None = None
    upload_status: SvgUploadStatus = "missing"
    uploaded_at: str | None = None


class WorkspaceLayerRoleMetricsPayload(BaseModel):
    face_area_m2: float | None = None
    perimeter_m: float | None = None


class WorkspaceLayerRoleLayerPayload(BaseModel):
    layer_id: str | None = None
    layer_key: str | None = None
    layer_name: str | None = None
    source: str | None = None
    suggested_role: str | None = None
    confirmed_role: str | None = None
    confirmed: bool = False
    ignored: bool = False
    confirmation_state: str | None = None
    path_count: int | None = None
    metrics: WorkspaceLayerRoleMetricsPayload | None = None


class WorkspaceLayerRoleSetupPayload(BaseModel):
    confirmation_status: LayerSetupStatus = "missing"
    layers: list[WorkspaceLayerRoleLayerPayload] = Field(default_factory=list)


class WorkspaceLetterGroupFinishPayload(BaseModel):
    group_key: str | None = None
    layer_name: str | None = None
    role: str | None = None
    face_area_m2: float | None = None
    perimeter_m: float | None = None
    face_finish_type: str | None = None
    face_oracal_code: str | None = None
    return_finish_type: str | None = None
    return_depth_mm: float | None = None
    face_vinyl_roll_width_mm: float | None = None
    confirmed: bool = False


class WorkspaceArtworkFinishPayload(BaseModel):
    layer_key: str | None = None
    layer_name: str | None = None
    estimated_area_m2: float | None = None
    confirmed: bool = False


class WorkspaceCommercialInputsPayload(BaseModel):
    markup_percent: float | None = None
    discount_percent: float | None = None
    vat_percent: float | None = None
    manual_adjustment_ron: float | None = None


class WorkspaceFinishSetupPayload(BaseModel):
    letter_group_finishes: list[WorkspaceLetterGroupFinishPayload] = Field(default_factory=list)
    artwork_finishes: list[WorkspaceArtworkFinishPayload] = Field(default_factory=list)
    illuminated: bool | None = True
    lighting_system_type: str | None = None
    led_module_count: int | None = None
    selected_psu_watts: int | None = None
    light_color: str | None = None
    backing_mode: str | None = None
    mounting_system: str | None = None
    mounting_template_enabled: bool | None = None
    mounting_template_area_m2: float | None = None
    mounting_template_material_type: str | None = None
    return_depth_mm: float | None = None
    commercial_inputs: WorkspaceCommercialInputsPayload | None = None


class WorkspaceQuoteGeometryPayload(BaseModel):
    width_mm: float | None = None
    height_mm: float | None = None
    letter_count: int | None = None
    letter_perimeter_m: float | None = None
    letter_face_area_m2: float | None = None
    back_area_m2: float | None = None
    cut_length_ml: float | None = None
    finish_area_m2: float | None = None


class WorkspaceSystemLinksPayload(BaseModel):
    template_code: str | None = None
    family_code: str | None = None
    component_codes: list[str] = Field(default_factory=list)
    commercial_rule_codes: list[str] = Field(default_factory=list)


class WorkspacePayloadJson(BaseModel):
    schema_version: str = PAYLOAD_SCHEMA_VERSION
    template_code: str | None = None
    systems_template_code: str | None = None
    client: WorkspaceClientPayload = Field(default_factory=WorkspaceClientPayload)
    svg_source: WorkspaceSvgSourcePayload | None = None
    svg_analysis_json: dict[str, Any] | None = None
    layer_role_setup: WorkspaceLayerRoleSetupPayload | None = None
    quote_geometry: WorkspaceQuoteGeometryPayload = Field(default_factory=WorkspaceQuoteGeometryPayload)
    finish_setup: WorkspaceFinishSetupPayload = Field(default_factory=WorkspaceFinishSetupPayload)
    owner_decisions_snapshot: dict[str, Any] = Field(default_factory=dict)
    intake_snapshot: dict[str, Any] | None = None
    system_links: WorkspaceSystemLinksPayload | None = None

    model_config = {"extra": "allow"}


def parse_workspace_payload(raw: dict[str, Any] | None) -> dict[str, Any]:
    """Validate loosely — preserve unknown keys for forward compatibility."""
    if not raw or not isinstance(raw, dict):
        return {}
    validated = WorkspacePayloadJson.model_validate(raw)
    merged = validated.model_dump(exclude_none=False)
    for key, value in raw.items():
        if key not in merged:
            merged[key] = value
    return merged
