import { Link } from "react-router-dom";

import type { QuotePreview } from "../../lib/api";
import { previewContextStats } from "../../lib/quotePreviewUtils";
import { PreviewStatusBadge } from "./PreviewStatusBadge";
import { Section } from "../ui/Section";

type QuotePreviewSummaryProps = {
  preview: QuotePreview;
  building: boolean;
  creatingQuote: boolean;
  onBuildPreview: () => void;
  onCreateQuote: () => void;
};

export function QuotePreviewSummary({
  preview,
  building,
  creatingQuote,
  onBuildPreview,
  onCreateQuote,
}: QuotePreviewSummaryProps) {
  const stats = previewContextStats(preview);

  return (
    <Section title="Commercial preview" description="Status, totals, and rule counts come from backend only.">
      <div className="quote-preview-summary">
        <div className="quote-preview-summary__status">
          <span>Preview status</span>
          <PreviewStatusBadge status={preview.status} />
        </div>

        <dl className="quote-preview-summary__totals">
          <div>
            <dt>Subtotal net</dt>
            <dd>{preview.subtotal_net ?? "blocked"}</dd>
          </div>
          <div>
            <dt>VAT ({Math.round(preview.vat_rate * 100)}%)</dt>
            <dd>{preview.vat_amount ?? "blocked"}</dd>
          </div>
          <div>
            <dt>Total gross</dt>
            <dd>{preview.total_gross ?? "blocked"}</dd>
          </div>
          <div>
            <dt>Currency</dt>
            <dd>{preview.currency}</dd>
          </div>
        </dl>

        <dl className="quote-preview-summary__context">
          <div>
            <dt>Systems template</dt>
            <dd>{preview.template_code ?? "—"}</dd>
          </div>
          <div>
            <dt>Provenance</dt>
            <dd>{preview.provenance ?? "—"}</dd>
          </div>
          <div>
            <dt>Commercial rules</dt>
            <dd>{stats.ruleCount}</dd>
          </div>
          <div>
            <dt>Priced lines</dt>
            <dd>{stats.pricedCount}</dd>
          </div>
          <div>
            <dt>Blocked lines</dt>
            <dd>{stats.blockedCount}</dd>
          </div>
          <div>
            <dt>Not applicable</dt>
            <dd>{stats.notApplicableCount}</dd>
          </div>
          <div>
            <dt>Blockers</dt>
            <dd>{stats.blockerCount}</dd>
          </div>
        </dl>

        {preview.existing_quote_code ? (
          <p className="note">Existing commercial quote: {preview.existing_quote_code}</p>
        ) : null}

        <p className="note">
          Owner prices are saved by <code>rule_code</code>.{" "}
          {preview.template_code ? (
            <Link to="/systems">View product systems registry</Link>
          ) : null}
        </p>

        <div className="actions">
          <button className="button" type="button" onClick={onBuildPreview} disabled={building}>
            {building ? "Refreshing..." : "Refresh preview"}
          </button>
          <button
            className="button-secondary"
            type="button"
            onClick={onCreateQuote}
            disabled={creatingQuote || preview.status !== "ready" || Boolean(preview.existing_quote_code)}
          >
            {creatingQuote
              ? "Creating quote..."
              : preview.existing_quote_code
                ? "Commercial quote already exists"
                : "Create commercial quote (Phase 4 — existing endpoint)"}
          </button>
        </div>
      </div>
    </Section>
  );
}
