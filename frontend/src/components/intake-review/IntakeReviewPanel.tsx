import { useMemo } from "react";

import type { LetterGroupFinish } from "../../types/artwork";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";
import { buildReviewCompletionSummary } from "../../lib/intakeReviewSummary";
import type { IntakeReviewState } from "../../types/intakeReview";
import { Badge } from "../ui/Badge";
import { ArtworkFinishesReview } from "./ArtworkFinishesReview";
import { BackingReview } from "./BackingReview";
import { IlluminationReview } from "./IlluminationReview";
import { LetterGroupFinishesReview } from "./LetterGroupFinishesReview";
import { MountingSupportReview } from "./MountingSupportReview";
import { PackagingReview } from "./PackagingReview";
import { ReviewCompletionSummaryPanel } from "./ReviewCompletionSummary";
import { ReviewSection } from "./ReviewSection";

type IntakeReviewPanelProps = {
  review: IntakeReviewState;
  letterGroups: LetterGroupFinish[];
  disabled?: boolean;
  options: IntakeReviewOptions;
  onReviewChange: (review: IntakeReviewState) => void;
  onLetterGroupsChange: (groups: LetterGroupFinish[]) => void;
};

export function IntakeReviewPanel({
  review,
  letterGroups,
  disabled = false,
  options,
  onReviewChange,
  onLetterGroupsChange,
}: IntakeReviewPanelProps) {
  const summary = useMemo(
    () => buildReviewCompletionSummary(letterGroups, review),
    [letterGroups, review],
  );

  const finisajeSummary = `${summary.confirmedLetterGroups}/${summary.letterGroupCount} groups confirmed`;

  return (
    <div className="intake-review-panel">
      <div className="note review-note">
        <Badge tone="default">Phase 2D review</Badge> Finish, illumination, backing, and mounting intake truth. No
        pricing or totals on this screen.
      </div>

      <ReviewCompletionSummaryPanel summary={summary} />

      <ReviewSection id="review-finisaje" title="Letter groups / Finisaje" summary={finisajeSummary} defaultOpen>
        <LetterGroupFinishesReview
          groups={letterGroups}
          disabled={disabled}
          options={options}
          onChange={onLetterGroupsChange}
        />
      </ReviewSection>

      <ReviewSection
        id="review-artwork-finishes"
        title="Artwork / logo finishes"
        summary={`${review.artworkFinishes.length} row(s)`}
      >
        <ArtworkFinishesReview
          rows={review.artworkFinishes}
          disabled={disabled}
          finishTypeOptions={options.finishTypeOptions}
          onChange={(artworkFinishes) => onReviewChange({ ...review, artworkFinishes })}
        />
      </ReviewSection>

      <ReviewSection
        id="review-iluminare"
        title="Iluminare"
        summary={review.illumination.illuminated ? "illuminated" : "non-illuminated"}
        defaultOpen
      >
        <IlluminationReview
          state={review.illumination}
          disabled={disabled}
          options={options}
          onChange={(illumination) => onReviewChange({ ...review, illumination })}
        />
      </ReviewSection>

      <ReviewSection id="review-spate" title="Spate" summary={review.backing.backing_mode ?? "not set"}>
        <BackingReview
          state={review.backing}
          disabled={disabled}
          options={options}
          onChange={(backing) => onReviewChange({ ...review, backing })}
        />
      </ReviewSection>

      <ReviewSection
        id="review-montaj"
        title="Suport / Montaj"
        summary={review.mounting.mounting_system ?? "not set"}
      >
        <MountingSupportReview
          state={review.mounting}
          disabled={disabled}
          options={options}
          onChange={(mounting) => onReviewChange({ ...review, mounting })}
        />
      </ReviewSection>

      <ReviewSection id="review-ambalare" title="Ambalare / Livrare" summary={review.packaging.delivery_policy ?? "optional"}>
        <PackagingReview
          state={review.packaging}
          disabled={disabled}
          options={options}
          onChange={(packaging) => onReviewChange({ ...review, packaging })}
        />
      </ReviewSection>
    </div>
  );
}
