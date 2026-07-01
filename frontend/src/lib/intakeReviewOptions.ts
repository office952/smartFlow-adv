import type { OwnerDecisionDefinition } from "../types/systems";

function valuesFor(decisions: OwnerDecisionDefinition[], code: string): string[] {
  return decisions.find((d) => d.decision_code === code)?.allowed_values ?? [];
}

export type IntakeReviewOptions = {
  letterFaceFinishOptions: string[];
  letterReturnFinishOptions: string[];
  backingModeOptions: string[];
  backMaterialOptions: string[];
  mountingSystemOptions: string[];
  lightingSystemTypeOptions: string[];
  lightColorOptions: string[];
  ledDensityPolicyOptions: string[];
  psuPolicyOptions: string[];
  faceVinylRollWidthOptions: string[];
  supportTypeOptions: string[];
  mountingTypeOptions: string[];
  packageSizeClassOptions: string[];
  deliveryPolicyOptions: string[];
  finishTypeOptions: string[];
};

export function reviewOptionsFromOwnerDecisions(decisions: OwnerDecisionDefinition[]): IntakeReviewOptions {
  return {
    letterFaceFinishOptions: valuesFor(decisions, "letter_face_finish_type"),
    letterReturnFinishOptions: valuesFor(decisions, "letter_return_finish_type"),
    backingModeOptions: valuesFor(decisions, "backing_mode"),
    backMaterialOptions: valuesFor(decisions, "back_material"),
    mountingSystemOptions: valuesFor(decisions, "mounting_system"),
    lightingSystemTypeOptions: valuesFor(decisions, "lighting_system_type"),
    lightColorOptions: valuesFor(decisions, "light_color"),
    ledDensityPolicyOptions: valuesFor(decisions, "led_density_policy"),
    psuPolicyOptions: valuesFor(decisions, "psu_policy"),
    faceVinylRollWidthOptions: valuesFor(decisions, "face_vinyl_roll_width_mm"),
    supportTypeOptions: valuesFor(decisions, "support_type_decision"),
    mountingTypeOptions: valuesFor(decisions, "mounting_type_decision"),
    packageSizeClassOptions: valuesFor(decisions, "package_size_class"),
    deliveryPolicyOptions: valuesFor(decisions, "delivery_policy"),
    finishTypeOptions: valuesFor(decisions, "finish_type"),
  };
}

const BAR_MOUNTING = new Set(["steel_bars", "aluminum_bars"]);

export function deriveSupportFromMountingSystem(mountingSystem: string | null): {
  support_required: boolean;
  support_type: string | null;
} {
  if (!mountingSystem) {
    return { support_required: false, support_type: null };
  }
  if (BAR_MOUNTING.has(mountingSystem)) {
    return { support_required: true, support_type: mountingSystem };
  }
  return { support_required: false, support_type: null };
}
