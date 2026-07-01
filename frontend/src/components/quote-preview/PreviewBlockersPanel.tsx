import type { QuoteBlocker } from "../../lib/api";
import { BLOCKER_HINTS } from "../../lib/quotePreviewUtils";
import { Section } from "../ui/Section";

type PreviewBlockersPanelProps = {
  blockers: QuoteBlocker[];
};

export function PreviewBlockersPanel({ blockers }: PreviewBlockersPanelProps) {
  if (blockers.length === 0) {
    return (
      <Section title="Blockers" description="No blockers reported by backend preview.">
        <p className="empty">Preview may still be blocked until all rules are priced.</p>
      </Section>
    );
  }

  return (
    <Section title="Blockers" description="Backend-reported reasons the preview cannot become ready.">
      <ul className="quote-blocker-list">
        {blockers.map((blocker) => (
          <li key={`${blocker.code}-${blocker.message}`} className="quote-blocker-item">
            <strong className="quote-blocker-item__code">{blocker.code}</strong>
            <p className="quote-blocker-item__message">{blocker.message}</p>
            {BLOCKER_HINTS[blocker.code] ? (
              <p className="quote-blocker-item__hint">{BLOCKER_HINTS[blocker.code]}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </Section>
  );
}
