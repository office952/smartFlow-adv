import type { QuoteLine } from "../../lib/api";
import { BlockerRouteHint } from "./BlockerRouteHint";
import { OwnerRulePriceEditor } from "./OwnerRulePriceEditor";
import { LineStatusBadge } from "./PreviewStatusBadge";

type QuotePreviewLineCardProps = {
  line: QuoteLine;
  currency: string;
  savingRuleCode: string | null;
  onSavePrice: (ruleCode: string, unitPrice: number) => Promise<void>;
};

export function QuotePreviewLineCard({ line, currency, savingRuleCode, onSavePrice }: QuotePreviewLineCardProps) {
  const ruleCode = line.rule_code ?? line.code;
  const status = line.line_status ?? "blocked";

  return (
    <article className="quote-line-card">
      <header className="quote-line-card__header">
        <div>
          <p className="quote-line-card__rule">
            <code>{ruleCode}</code>
          </p>
          <h4 className="quote-line-card__label">{line.label}</h4>
        </div>
        <LineStatusBadge status={status} />
      </header>

      <dl className="quote-line-card__meta">
        <div>
          <dt>Basis</dt>
          <dd>{line.basis_type}</dd>
        </div>
        <div>
          <dt>Quantity</dt>
          <dd>{line.quantity ?? "—"} {line.unit}</dd>
        </div>
        <div>
          <dt>Line total</dt>
          <dd>{line.subtotal ?? "blocked"}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{line.source ?? "—"}</dd>
        </div>
      </dl>

      {(line.required_inputs?.length ?? 0) > 0 ? (
        <p className="quote-line-card__requirements">
          Required inputs: {(line.required_inputs ?? []).join(", ")}
        </p>
      ) : null}

      {(line.required_owner_decisions?.length ?? 0) > 0 ? (
        <p className="quote-line-card__requirements">
          Required owner decisions: {(line.required_owner_decisions ?? []).join(", ")}
        </p>
      ) : null}

      {(line.blockers?.length ?? 0) > 0 ? (
        <ul className="quote-line-card__blockers">
          {(line.blockers ?? []).map((blocker) => (
            <li key={`${blocker.code}-${blocker.message}`}>
              <BlockerRouteHint blocker={blocker} />
            </li>
          ))}
        </ul>
      ) : null}

      <div id={`price-editor-${ruleCode}`}>
        <OwnerRulePriceEditor
        line={line}
        currency={currency}
        saving={savingRuleCode === ruleCode}
        onSave={onSavePrice}
      />
      </div>
    </article>
  );
}
