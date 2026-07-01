from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class IntakeV6WorkspaceCreate(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    client_name: str = Field(min_length=2, max_length=120)
    template_code: str = "TPL-VOLUMETRIC-LETTERS_v2"
    width_mm: float = Field(gt=0)
    height_mm: float = Field(gt=0)
    letter_count: int = Field(gt=0)
    letter_perimeter_m: float = Field(gt=0)
    letter_face_area_m2: float = Field(gt=0)
    return_depth_mm: float = Field(gt=0)
    illuminated: bool = True
    led_module_count: int | None = Field(default=None, ge=0)
    selected_psu_watts: int | None = Field(default=None, ge=0)
    mounting_template_enabled: bool = False
    mounting_template_area_m2: float | None = Field(default=None, ge=0)
    mounting_template_material_type: str | None = None
    notes: str | None = None
    payload_json: dict[str, Any] | None = None


class IntakeV6WorkspacePayloadUpdate(BaseModel):
    payload_json: dict[str, Any]


class IntakeV6WorkspaceSummary(BaseModel):
    id: str
    title: str
    client_name: str
    template_code: str
    status: str


class IntakeV6WorkspaceDetail(IntakeV6WorkspaceSummary):
    width_mm: float
    height_mm: float
    letter_count: int
    letter_perimeter_m: float
    letter_face_area_m2: float
    return_depth_mm: float
    illuminated: bool
    led_module_count: int | None = None
    selected_psu_watts: int | None = None
    mounting_template_enabled: bool
    mounting_template_area_m2: float | None = None
    mounting_template_material_type: str | None = None
    notes: str | None = None
    payload_json: dict[str, Any] | None = None
    intake_snapshot: dict[str, Any] | None = None
