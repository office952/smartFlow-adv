import type { LetterGroupFinish } from "../types/artwork";
import type { IntakeReviewState, ReviewCompletionSummary, ReviewGap } from "../types/intakeReview";

export function buildReviewCompletionSummary(
  letterGroups: LetterGroupFinish[],
  review: IntakeReviewState,
): ReviewCompletionSummary {
  const gaps: ReviewGap[] = [];
  const confirmed = letterGroups.filter((g) => g.confirmed);
  const groupsMissingMetrics = letterGroups.filter(
    (g) => g.confirmed && (g.face_area_m2 == null || g.perimeter_m == null),
  ).length;

  if (letterGroups.length === 0) {
    gaps.push({ section: "Finisaje", message: "No letter groups from SVG layers yet." });
  } else if (confirmed.length < letterGroups.length) {
    gaps.push({
      section: "Finisaje",
      message: `${letterGroups.length - confirmed.length} letter group(s) not confirmed.`,
    });
  }
  if (groupsMissingMetrics > 0) {
    gaps.push({
      section: "Finisaje",
      message: `${groupsMissingMetrics} confirmed group(s) missing face area or perimeter.`,
    });
  }

  const illum = review.illumination;
  let illuminationComplete = true;
  if (illum.illuminated) {
    if (!illum.lighting_system_type) {
      illuminationComplete = false;
      gaps.push({ section: "Iluminare", message: "Lighting system type not set." });
    }
    if (!illum.light_color) {
      illuminationComplete = false;
      gaps.push({ section: "Iluminare", message: "Light color not set." });
    }
    if (illum.led_module_count == null) {
      illuminationComplete = false;
      gaps.push({ section: "Iluminare", message: "LED module count missing." });
    }
    if (illum.selected_psu_watts == null) {
      illuminationComplete = false;
      gaps.push({ section: "Iluminare", message: "PSU watts missing." });
    }
  }

  let backingComplete = Boolean(review.backing.backing_mode);
  if (!backingComplete) {
    gaps.push({ section: "Spate", message: "Backing mode not selected." });
  }
  if (review.backing.back_area_m2 == null) {
    gaps.push({ section: "Spate", message: "Back area (m²) not entered — may block back panel rule." });
  }

  let mountingComplete = Boolean(review.mounting.mounting_system);
  if (!mountingComplete) {
    gaps.push({ section: "Montaj", message: "Mounting system not selected." });
  }
  if (review.mounting.mounting_template_enabled && review.mounting.mounting_template_area_m2 == null) {
    mountingComplete = false;
    gaps.push({ section: "Montaj", message: "Mounting template enabled but area missing." });
  }

  let packagingComplete = true;
  if (review.packaging.packaging_required && !review.packaging.package_size_class) {
    packagingComplete = false;
    gaps.push({ section: "Ambalare", message: "Packaging required but size class not set." });
  }

  return {
    letterGroupCount: letterGroups.length,
    confirmedLetterGroups: confirmed.length,
    groupsMissingMetrics,
    illuminationComplete,
    backingComplete,
    mountingComplete,
    packagingComplete,
    gaps,
  };
}
