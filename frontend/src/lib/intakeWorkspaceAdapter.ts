import type { ArtworkIntakeState } from "../types/artwork";
import type { IntakeFieldDefinition, OwnerDecisionDefinition, SystemIntakeFormValues, WorkspaceMetaValues } from "../types/systems";
import type { WorkspaceCreateInput } from "./api";
import { buildLegacyFlatFallbackFromPayload, buildWorkspacePayloadJson } from "./intakePayloadBuilder";

/** Maps systems template codes to legacy intake-v6 workspace API template_code values. */
const LEGACY_TEMPLATE_CODE_MAP: Record<string, string> = {
  volumetric_letters_frontlit: "TPL-VOLUMETRIC-LETTERS_v2",
};

export type AdaptResult =
  | { ok: true; payload: WorkspaceCreateInput }
  | { ok: false; issues: string[] };

export function canAdaptTemplateToLegacyWorkspace(templateCode: string): boolean {
  return templateCode in LEGACY_TEMPLATE_CODE_MAP;
}

function readNumber(values: SystemIntakeFormValues, key: string, label: string, required: boolean, issues: string[]): number | null {
  const raw = values[key];
  if (raw === null || raw === undefined || raw === "") {
    if (required) {
      issues.push(`${label} is required.`);
    }
    return null;
  }
  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) {
    issues.push(`${label} must be a number.`);
    return null;
  }
  return parsed;
}

function readOptionalInt(values: SystemIntakeFormValues, key: string): number | null {
  const raw = values[key];
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : null;
}

function readBoolean(values: SystemIntakeFormValues, key: string, fallback = false): boolean {
  const raw = values[key];
  if (typeof raw === "boolean") {
    return raw;
  }
  if (raw === "true" || raw === 1) {
    return true;
  }
  if (raw === "false" || raw === 0) {
    return false;
  }
  return fallback;
}

function readStringOrNull(values: SystemIntakeFormValues, key: string): string | null {
  const raw = values[key];
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  return String(raw);
}

/**
 * Phase 2B adapter: systems registry values → payload_json + compatibility flat create payload.
 */
export function adaptSystemIntakeToWorkspaceCreate(
  templateCode: string,
  meta: WorkspaceMetaValues,
  values: SystemIntakeFormValues,
  intakeFields: IntakeFieldDefinition[],
  ownerDecisionValues: Record<string, string> = {},
  artwork?: ArtworkIntakeState,
): AdaptResult {
  const issues: string[] = [];

  if (!canAdaptTemplateToLegacyWorkspace(templateCode)) {
    return { ok: false, issues: [`Template "${templateCode}" is not yet supported by the workspace API.`] };
  }

  if (meta.title.trim().length < 3) {
    issues.push("Workspace title must be at least 3 characters.");
  }
  if (meta.client_name.trim().length < 2) {
    issues.push("Client name must be at least 2 characters.");
  }

  for (const field of intakeFields) {
    if (field.field_code === "template_code" || field.field_type === "collection" || field.source === "computed") {
      continue;
    }
    if (!field.required) {
      continue;
    }
    const value = values[field.field_code];
    if (value === null || value === undefined || value === "") {
      issues.push(`${field.label} is required by intake schema.`);
    }
  }

  const width = readNumber(values, "artwork_width_mm", "Artwork width", !artwork?.analysis, issues);
  const height = readNumber(values, "artwork_height_mm", "Artwork height", !artwork?.analysis, issues);
  const perimeter = readNumber(values, "perimeter_ml", "Perimeter", !artwork?.letterGroupFinishes.length, issues);
  const faceArea = readNumber(values, "face_area_m2", "Face area", !artwork?.letterGroupFinishes.length, issues);
  const returnDepth = readNumber(values, "return_depth_mm", "Return depth", true, issues);

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const payloadJson = buildWorkspacePayloadJson(templateCode, meta, values, ownerDecisionValues, { artwork });
  const flat = buildLegacyFlatFallbackFromPayload(payloadJson);

  const payload: WorkspaceCreateInput = {
    title: meta.title.trim(),
    client_name: meta.client_name.trim(),
    template_code: LEGACY_TEMPLATE_CODE_MAP[templateCode],
    width_mm: flat.width_mm,
    height_mm: flat.height_mm,
    letter_count: flat.letter_count,
    letter_perimeter_m: flat.letter_perimeter_m,
    letter_face_area_m2: flat.letter_face_area_m2,
    return_depth_mm: flat.return_depth_mm,
    illuminated: flat.illuminated,
    led_module_count: flat.led_module_count,
    selected_psu_watts: flat.selected_psu_watts,
    mounting_template_enabled: flat.mounting_template_enabled,
    mounting_template_area_m2: flat.mounting_template_area_m2,
    mounting_template_material_type: flat.mounting_template_material_type,
    notes: buildCompatibilityNotes(templateCode),
    payload_json: payloadJson,
  };

  return { ok: true, payload };
}

function buildCompatibilityNotes(templateCode: string): string {
  return `Phase 2B payload_json workspace (${templateCode}) — notes retained for legacy tooling only.`;
}

export function validateOwnerDecisions(
  decisions: OwnerDecisionDefinition[],
  values: Record<string, string>,
): string[] {
  const issues: string[] = [];
  for (const decision of decisions) {
    if (!decision.required) {
      continue;
    }
    const value = values[decision.decision_code]?.trim();
    if (!value) {
      issues.push(`${decision.label} is required.`);
    }
  }
  return issues;
}
