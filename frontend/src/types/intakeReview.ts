import type { LetterGroupFinish } from "./artwork";

export type ArtworkFinishRow = {
  group_key: string;
  layer_name: string;
  estimated_area_m2: number | null;
  finish_type: string | null;
  confirmed: boolean;
};

export type IlluminationReviewState = {
  illuminated: boolean;
  lighting_system_type: string | null;
  light_color: string | null;
  led_module_count: number | null;
  selected_psu_watts: number | null;
  led_density_policy: string | null;
  psu_policy: string | null;
};

export type BackingReviewState = {
  backing_mode: string | null;
  back_material: string | null;
  back_area_m2: number | null;
};

export type MountingReviewState = {
  mounting_system: string | null;
  support_required: boolean;
  support_type: string | null;
  mounting_template_enabled: boolean;
  mounting_template_area_m2: number | null;
  mounting_template_material_type: string | null;
  mounting_type: string | null;
};

export type PackagingReviewState = {
  packaging_required: boolean;
  package_size_class: string | null;
  delivery_policy: string | null;
};

export type IntakeReviewState = {
  artworkFinishes: ArtworkFinishRow[];
  illumination: IlluminationReviewState;
  backing: BackingReviewState;
  mounting: MountingReviewState;
  packaging: PackagingReviewState;
};

export type ReviewGap = {
  section: string;
  message: string;
};

export type ReviewCompletionSummary = {
  letterGroupCount: number;
  confirmedLetterGroups: number;
  groupsMissingMetrics: number;
  illuminationComplete: boolean;
  backingComplete: boolean;
  mountingComplete: boolean;
  packagingComplete: boolean;
  gaps: ReviewGap[];
};

export function createDefaultIlluminationReview(illuminatedDefault = true): IlluminationReviewState {
  return {
    illuminated: illuminatedDefault,
    lighting_system_type: illuminatedDefault ? "led_modules" : "none",
    light_color: null,
    led_module_count: null,
    selected_psu_watts: null,
    led_density_policy: null,
    psu_policy: null,
  };
}

export function createDefaultBackingReview(): BackingReviewState {
  return {
    backing_mode: null,
    back_material: null,
    back_area_m2: null,
  };
}

export function createDefaultMountingReview(): MountingReviewState {
  return {
    mounting_system: "direct_wall",
    support_required: false,
    support_type: null,
    mounting_template_enabled: false,
    mounting_template_area_m2: null,
    mounting_template_material_type: null,
    mounting_type: null,
  };
}

export function createDefaultPackagingReview(): PackagingReviewState {
  return {
    packaging_required: false,
    package_size_class: null,
    delivery_policy: null,
  };
}

export function createEmptyReviewState(illuminatedDefault = true): IntakeReviewState {
  return {
    artworkFinishes: [],
    illumination: createDefaultIlluminationReview(illuminatedDefault),
    backing: createDefaultBackingReview(),
    mounting: createDefaultMountingReview(),
    packaging: createDefaultPackagingReview(),
  };
}

/** Fields managed by Phase 2D review — hidden from raw registry form. */
export const REVIEW_MANAGED_FIELD_CODES = new Set([
  "face_area_m2",
  "back_area_m2",
  "perimeter_ml",
  "finish_area_m2",
  "cut_length_ml",
  "letter_count",
  "estimated_led_count",
  "estimated_power_w",
  "illuminated",
  "lighting_system_type",
  "support_required",
  "support_type",
  "mounting_required",
  "mounting_type",
  "mounting_template_area_m2",
  "packaging_required",
  "package_size_class",
  "letter_group_finishes",
  "artwork_finishes",
  "letter_groups_confirmed",
  "artwork_confirmed",
]);

export type LetterGroupFinishContext = {
  groups: LetterGroupFinish[];
  onGroupsChange: (groups: LetterGroupFinish[]) => void;
};
