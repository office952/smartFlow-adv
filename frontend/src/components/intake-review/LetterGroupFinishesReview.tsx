import type { LetterGroupFinish } from "../../types/artwork";
import type { IntakeReviewOptions } from "../../lib/intakeReviewOptions";
import { EmptyState } from "../ui/EmptyState";
import { LetterGroupFinishCard } from "./LetterGroupFinishCard";

type LetterGroupFinishesReviewProps = {
  groups: LetterGroupFinish[];
  disabled?: boolean;
  options: Pick<IntakeReviewOptions, "letterFaceFinishOptions" | "letterReturnFinishOptions" | "faceVinylRollWidthOptions">;
  onChange: (groups: LetterGroupFinish[]) => void;
};

export function LetterGroupFinishesReview({ groups, disabled, options, onChange }: LetterGroupFinishesReviewProps) {
  function patchGroup(groupKey: string, next: LetterGroupFinish) {
    onChange(groups.map((g) => (g.group_key === groupKey ? next : g)));
  }

  if (groups.length === 0) {
    return (
      <EmptyState
        title="No letter groups yet"
        description="Upload SVG and confirm face layers in the Artwork section to create letter group finish rows."
      />
    );
  }

  return (
    <div className="letter-groups-review">
      <p className="field-hint">
        Per-group finish intake truth. Options from OwnerDecisionRegistry — no pricing on this screen.
      </p>
      <div className="letter-groups-review-list">
        {groups.map((group) => (
          <LetterGroupFinishCard
            key={group.group_key}
            group={group}
            disabled={disabled}
            options={options}
            onChange={(next) => patchGroup(group.group_key, next)}
          />
        ))}
      </div>
    </div>
  );
}
