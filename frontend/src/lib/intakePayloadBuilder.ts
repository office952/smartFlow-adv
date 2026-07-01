import type { ArtworkIntakeState } from "../types/artwork";
import type { IntakeReviewState } from "../types/intakeReview";
import type { OwnerDecisionDefinition, SystemIntakeFormValues, WorkspaceMetaValues } from "../types/systems";
import { deriveQuoteGeometryFromArtwork } from "./artwork/layerRoleSetup";
import { reviewOptionsFromOwnerDecisions } from "./intakeReviewOptions";

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
    file_size_bytes?: number | null;
    mime_type?: string | null;
    upload_status: "missing" | "analyzed" | "failed";
    uploaded_at?: string | null;
  };
  svg_analysis_json: Record<string, unknown> | null;
  layer_role_setup: {
    confirmation_status: string;
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
    back_area_m2: number | null;
    mounting_system: string | null;
    support_required: boolean | null;
    support_type: string | null;
    mounting_template_enabled: boolean;
    mounting_template_area_m2: number | null;
    mounting_template_material_type: string | null;
    packaging_required: boolean | null;
    package_size_class: string | null;
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

function coalesceDimension(
  formValue: number | null,
  reviewValue: number | null,
  artworkValue: number | null,
  artworkPresent: boolean,
): number | null {
  if (formValue !== null) {
    return formValue;
  }
  if (reviewValue !== null) {
    return reviewValue;
  }
  if (artworkPresent) {
    return artworkValue;
  }
  return null;
}

function sumConfirmedGroupMetric(
  groups: ArtworkIntakeState["letterGroupFinishes"],
  key: "face_area_m2" | "perimeter_m",
  confirmedOnly: boolean,
): number | null {
  const rows = confirmedOnly ? groups.filter((g) => g.confirmed) : groups;
  let total = 0;
  let counted = 0;
  for (const row of rows) {
    const value = row[key];
    if (value !== null && value > 0) {
      total += value;
      counted += 1;
    }
  }
  return counted > 0 ? total : null;
}

/**
 * Build structured payload_json from form values, artwork, and Phase 2D review state.
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
    artwork?: ArtworkIntakeState;
    review?: IntakeReviewState;
  },
): WorkspacePayloadJson {
  const artwork = options?.artwork;
  const review = options?.review;
  const hasArtwork = artwork?.analysis != null && artwork.svgSource.upload_status === "analyzed";
  const letterGroups = artwork?.letterGroupFinishes ?? [];

  const formWidth = readNumber(values, "artwork_width_mm");
  const formHeight = readNumber(values, "artwork_height_mm");
  const artworkGeometry = hasArtwork
    ? deriveQuoteGeometryFromArtwork(artwork!.analysis, letterGroups, artwork!.layerRoleSetup)
    : null;

  const reviewFaceArea = sumConfirmedGroupMetric(letterGroups, "face_area_m2", true);
  const reviewPerimeter = sumConfirmedGroupMetric(letterGroups, "perimeter_m", true);

  const width = coalesceDimension(formWidth, null, artworkGeometry?.width_mm ?? null, Boolean(hasArtwork));
  const height = coalesceDimension(formHeight, null, artworkGeometry?.height_mm ?? null, Boolean(hasArtwork));
  const perimeter =
    readNumber(values, "perimeter_ml") ?? reviewPerimeter ?? artworkGeometry?.letter_perimeter_m ?? null;
  const faceArea =
    readNumber(values, "face_area_m2") ?? reviewFaceArea ?? artworkGeometry?.letter_face_area_m2 ?? null;
  const backArea = review?.backing.back_area_m2 ?? readNumber(values, "back_area_m2");
  const finishArea = readNumber(values, "finish_area_m2") ?? faceArea ?? artworkGeometry?.finish_area_m2 ?? null;
  const cutLength = readNumber(values, "cut_length_ml") ?? perimeter ?? artworkGeometry?.cut_length_ml ?? null;
  const letterCount =
    readOptionalInt(values, "letter_count") ??
    (letterGroups.filter((g) => g.confirmed).length || null) ??
    artworkGeometry?.letter_count ??
    null;

  const illum = review?.illumination;
  const illuminated =
    illum?.illuminated ??
    (templateCode === "volumetric_letters_frontlit" ? readBoolean(values, "illuminated", true) : false);

  const ownerSnapshot: Record<string, string> = {};
  for (const [code, value] of Object.entries(ownerDecisionValues)) {
    const trimmed = value?.trim();
    if (trimmed) {
      ownerSnapshot[code] = trimmed;
    }
  }

  if (illum?.light_color) {
    ownerSnapshot.light_color = illum.light_color;
  }
  if (illum?.led_density_policy) {
    ownerSnapshot.led_density_policy = illum.led_density_policy;
  }
  if (illum?.psu_policy) {
    ownerSnapshot.psu_policy = illum.psu_policy;
  }
  if (review?.backing.back_material) {
    ownerSnapshot.back_material = review.backing.back_material;
  }
  if (review?.packaging.delivery_policy) {
    ownerSnapshot.delivery_policy = review.packaging.delivery_policy;
  }

  const returnDepthFromGroups = letterGroups.find((g) => g.return_depth_mm != null)?.return_depth_mm ?? null;
  const mounting = review?.mounting;

  return {
    schema_version: "1.0.0",
    template_code: LEGACY_TEMPLATE_CODE_MAP[templateCode] ?? templateCode,
    systems_template_code: templateCode,
    client: {
      client_name: meta.client_name.trim(),
      width_mm: width,
      height_mm: height,
    },
    svg_source: artwork?.svgSource ?? {
      file_name: null,
      upload_status: "missing",
    },
    svg_analysis_json: artwork?.analysis ? (artwork.analysis as unknown as Record<string, unknown>) : null,
    layer_role_setup: artwork?.layerRoleSetup ?? {
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
      finish_area_m2: finishArea,
    },
    finish_setup: {
      letter_group_finishes: letterGroups,
      artwork_finishes: review?.artworkFinishes ?? [],
      illuminated,
      lighting_system_type:
        illum?.lighting_system_type ??
        readStringOrNull(values, "lighting_system_type") ??
        (illuminated ? "led_modules" : null),
      led_module_count: illum?.led_module_count ?? readOptionalInt(values, "estimated_led_count"),
      selected_psu_watts: illum?.selected_psu_watts ?? readOptionalInt(values, "estimated_power_w"),
      light_color: illum?.light_color ?? ownerSnapshot.light_color ?? null,
      backing_mode: review?.backing.backing_mode ?? null,
      back_area_m2: backArea,
      mounting_system: mounting?.mounting_system ?? null,
      support_required: mounting?.support_required ?? null,
      support_type: mounting?.support_type ?? null,
      mounting_template_enabled: mounting?.mounting_template_enabled ?? readBoolean(values, "mounting_required"),
      mounting_template_area_m2:
        mounting?.mounting_template_area_m2 ?? readNumber(values, "mounting_template_area_m2"),
      mounting_template_material_type:
        mounting?.mounting_template_material_type ?? readStringOrNull(values, "mounting_type"),
      packaging_required: review?.packaging.packaging_required ?? readBoolean(values, "packaging_required"),
      package_size_class: review?.packaging.package_size_class ?? readStringOrNull(values, "package_size_class"),
      return_depth_mm: readNumber(values, "return_depth_mm") ?? returnDepthFromGroups,
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

export function finishOptionsFromOwnerDecisions(decisions: OwnerDecisionDefinition[]) {
  const opts = reviewOptionsFromOwnerDecisions(decisions);
  return {
    finishTypeOptions:
      opts.letterFaceFinishOptions.length > 0 ? opts.letterFaceFinishOptions : opts.finishTypeOptions,
    returnFinishOptions:
      opts.letterReturnFinishOptions.length > 0 ? opts.letterReturnFinishOptions : [],
  };
}
