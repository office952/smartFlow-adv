import type { QuoteBlocker } from "../../lib/api";
import { BlockerRouteHint } from "./BlockerRouteHint";
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
    <Section
      title="Blockers"
      description="Backend-reported reasons the preview cannot become ready — mapped to intake sections."
    >
      <ul className="quote-blocker-list" id="preview-blockers">
        {blockers.map((blocker) => (
          <li key={`${blocker.code}-${blocker.message}`} className="quote-blocker-item">
            <BlockerRouteHint blocker={blocker} />
          </li>
        ))}
      </ul>
    </Section>
  );
}
