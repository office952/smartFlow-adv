import type { ReactNode } from "react";

type ReviewSectionProps = {
  id: string;
  title: string;
  summary: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function ReviewSection({ id, title, summary, defaultOpen = false, children }: ReviewSectionProps) {
  return (
    <details className="review-section" id={id} open={defaultOpen}>
      <summary className="review-section-summary">
        <span className="review-section-title">{title}</span>
        <span className="review-section-hint">{summary}</span>
      </summary>
      <div className="review-section-body">{children}</div>
    </details>
  );
}
