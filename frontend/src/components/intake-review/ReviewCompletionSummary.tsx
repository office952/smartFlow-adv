import type { ReviewCompletionSummary } from "../../types/intakeReview";
import { Badge } from "../ui/Badge";
import { Card } from "../ui/Card";

type ReviewCompletionSummaryProps = {
  summary: ReviewCompletionSummary;
};

export function ReviewCompletionSummaryPanel({ summary }: ReviewCompletionSummaryProps) {
  return (
    <Card title="Review completion" className="review-completion-card">
      <p className="field-hint">
        Likely intake gaps before backend preview — backend quote preview remains source of truth for blockers.
      </p>
      <dl className="review-completion-stats">
        <div>
          <dt>Letter groups</dt>
          <dd>
            {summary.confirmedLetterGroups}/{summary.letterGroupCount} confirmed
          </dd>
        </div>
        <div>
          <dt>Iluminare</dt>
          <dd>
            <Badge tone={summary.illuminationComplete ? "success" : "warning"}>
              {summary.illuminationComplete ? "complete" : "gaps"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Spate</dt>
          <dd>
            <Badge tone={summary.backingComplete ? "success" : "warning"}>
              {summary.backingComplete ? "complete" : "gaps"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Montaj</dt>
          <dd>
            <Badge tone={summary.mountingComplete ? "success" : "warning"}>
              {summary.mountingComplete ? "complete" : "gaps"}
            </Badge>
          </dd>
        </div>
        <div>
          <dt>Ambalare</dt>
          <dd>
            <Badge tone={summary.packagingComplete ? "success" : "warning"}>
              {summary.packagingComplete ? "complete" : "optional"}
            </Badge>
          </dd>
        </div>
      </dl>
      {summary.gaps.length > 0 ? (
        <ul className="review-gap-list">
          {summary.gaps.map((gap, index) => (
            <li key={`${gap.section}-${index}`}>
              <strong>{gap.section}:</strong> {gap.message}
            </li>
          ))}
        </ul>
      ) : (
        <p className="field-hint">No obvious local gaps — preview may still block on owner decisions or prices.</p>
      )}
    </Card>
  );
}
