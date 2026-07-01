import type { OwnerDecisionDefinition, SystemIntakeFormValues, WorkspaceMetaValues } from "../types/systems";

export type WorkspacePayloadJson = {
  schema_version: string;
  template_code: string;
  systems_template_code: string;
  client: {
    client_name: string;
    width_mm: number | null;
    height_mm: number | null;
  };
  svg_source: {
    file_name: string | null;
    upload_status: "missing" | "analyzed" | "failed";
  };
  svg_analysis_json: Record<string, unknown> | null;
  layer_role_setup: {
    confirmation_status: "missing" | "partial" | "complete";
    layers: unknown[];
  };
  quote_geometry: {
    width_mm: number | null;
    height_mm: number | null;
    letter_count: number | null;
    letter_perimeter_m: number | null;
    letter_face_area_m2: number | null;
    back_area_m2: number | null;
    cut_length_ml: number | null;
    finish_area_m2: number | null;
  };
  finish_setup: {
    letter_group_finishes: unknown[];
    artwork_finishes: unknown[];
    illuminated: boolean;
    lighting_system_type: string | null;
    led_module_count: number | null;
    selected_psu_watts: number | null;
    light_color: string | null;
    backing_mode: string | null;
    mounting_system: string | null;
    mounting_template_enabled: boolean;
    mounting_template_area_m2: number | null;
    mounting_template_material_type: string | null;
    return_depth_mm: number | null;
    commercial_inputs: null;
  };
  owner_decisions_snapshot: Record<string, string>;
  intake_snapshot: null;
  system_links: {
    template_code: string;
    family_code: string;
    component_codes: string[];
    commercial_rule_codes: string[];
  };
};

const LEGACY_TEMPLATE_CODE_MAP: Record<string, string> = {
  volumetric_letters_frontlit: "TPL-VOLUMETRIC-LETTERS_v2",
};

function readNumber(values: SystemIntakeFormValues, key: string): number | null {
  const raw = values[key];
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const parsed = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function readOptionalInt(values: SystemIntakeFormValues, key: string): number | null {
  const parsed = readNumber(values, key);
  return parsed === null ? null : Math.trunc(parsed);
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

function mapMountingSystem(values: SystemIntakeFormValues): string | null {
  if (readBoolean(values, "support_required")) {
    const supportType = readStringOrNull(values, "support_type");
    if (supportType === "frame" || supportType === "panel") {
      return "steel_bars";
    }
    if (supportType === "custom") {
      return "aluminum_bars";
    }
  }
  return "direct_wall";
}

/**
 * Build structured payload_json from system-driven form values.
 * Does not invent SVG/layer data — Phase 2C will populate collections.
 */
export function buildWorkspacePayloadJson(
  templateCode: string,
  meta: WorkspaceMetaValues,
  values: SystemIntakeFormValues,
  ownerDecisionValues: Record<string, string>,
  options?: {
    familyCode?: string;
    componentCodes?: string[];
    commercialRuleCodes?: string[];
  },
): WorkspacePayloadJson {
  const width = readNumber(values, "artwork_width_mm");
  const height = readNumber(values, "artwork_height_mm");
  const perimeter = readNumber(values, "perimeter_ml");
  const faceArea = readNumber(values, "face_area_m2");
  const backArea = readNumber(values, "back_area_m2");
  const finishArea = readNumber(values, "finish_area_m2");
  const cutLength = readNumber(values, "cut_length_ml") ?? perimeter;
  const letterCount = readOptionalInt(values, "letter_count") ?? 1;
  const illuminated = templateCode === "volumetric_letters_frontlit" ? readBoolean(values, "illuminated", true) : false;

  const ownerSnapshot: Record<string, string> = {};
  for (const [code, value] of Object.entries(ownerDecisionValues)) {
    const trimmed = value?.trim();
    if (trimmed) {
      ownerSnapshot[code] = trimmed;
    }
  }

  return {
    schema_version: "1.0.0",
    template_code: LEGACY_TEMPLATE_CODE_MAP[templateCode] ?? templateCode,
    systems_template_code: templateCode,
    client: {
      client_name: meta.client_name.trim(),
      width_mm: width,
      height_mm: height,
    },
    svg_source: {
      file_name: null,
      upload_status: "missing",
    },
    svg_analysis_json: null,
    layer_role_setup: {
      confirmation_status: "missing",
      layers: [],
    },
    quote_geometry: {
      width_mm: width,
      height_mm: height,
      letter_count: letterCount,
      letter_perimeter_m: perimeter,
      letter_face_area_m2: faceArea,
      back_area_m2: backArea,
      cut_length_ml: cutLength,
      finish_area_m2: finishArea ?? faceArea,
    },
    finish_setup: {
      letter_group_finishes: [],
      artwork_finishes: [],
      illuminated,
      lighting_system_type: readStringOrNull(values, "lighting_system_type") ?? (illuminated ? "led_modules" : null),
      led_module_count: readOptionalInt(values, "estimated_led_count"),
      selected_psu_watts: readOptionalInt(values, "estimated_power_w"),
      light_color: ownerSnapshot.light_color ?? null,
      backing_mode: null,
      mounting_system: mapMountingSystem(values),
      mounting_template_enabled: readBoolean(values, "mounting_required"),
      mounting_template_area_m2: readNumber(values, "mounting_template_area_m2"),
      mounting_template_material_type: readStringOrNull(values, "mounting_type"),
      return_depth_mm: readNumber(values, "return_depth_mm"),
      commercial_inputs: null,
    },
    owner_decisions_snapshot: ownerSnapshot,
    intake_snapshot: null,
    system_links: {
      template_code: templateCode,
      family_code: options?.familyCode ?? "volumetric_letters",
      component_codes: options?.componentCodes ?? [],
      commercial_rule_codes: options?.commercialRuleCodes ?? [],
    },
  };
}

export function buildLegacyFlatFallbackFromPayload(payloadJson: WorkspacePayloadJson) {
  const geometry = payloadJson.quote_geometry;
  const finish = payloadJson.finish_setup;
  return {
    title: payloadJson.client.client_name,
    template_code: payloadJson.template_code,
    width_mm: geometry.width_mm ?? payloadJson.client.width_mm ?? 1,
    height_mm: geometry.height_mm ?? payloadJson.client.height_mm ?? 1,
    letter_count: geometry.letter_count ?? 1,
    letter_perimeter_m: geometry.letter_perimeter_m ?? 0.001,
    letter_face_area_m2: geometry.letter_face_area_m2 ?? 0.001,
    return_depth_mm: finish.return_depth_mm ?? 60,
    illuminated: finish.illuminated,
    led_module_count: finish.led_module_count,
    selected_psu_watts: finish.selected_psu_watts,
    mounting_template_enabled: finish.mounting_template_enabled,
    mounting_template_area_m2: finish.mounting_template_area_m2,
    mounting_template_material_type: finish.mounting_template_material_type,
  };
}
