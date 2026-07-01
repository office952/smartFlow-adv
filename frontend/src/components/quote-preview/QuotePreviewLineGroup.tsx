import type { ComponentLineGroup } from "../../lib/quotePreviewUtils";
import type { QuoteLine } from "../../lib/api";
import { QuotePreviewLineCard } from "./QuotePreviewLineCard";

type QuotePreviewLineGroupProps = {
  group: ComponentLineGroup;
  currency: string;
  savingRuleCode: string | null;
  onSavePrice: (ruleCode: string, unitPrice: number) => Promise<void>;
};

export function QuotePreviewLineGroup({ group, currency, savingRuleCode, onSavePrice }: QuotePreviewLineGroupProps) {
  return (
    <section className="quote-line-group">
      <header className="quote-line-group__header">
        <h3>{group.componentLabel}</h3>
        <p className="quote-line-group__code">
          component: <code>{group.componentCode}</code> · {group.lines.length} rule(s)
        </p>
      </header>
      <div className="quote-line-group__cards">
        {group.lines.map((line: QuoteLine) => (
          <QuotePreviewLineCard
            key={line.rule_code ?? line.code}
            line={line}
            currency={currency}
            savingRuleCode={savingRuleCode}
            onSavePrice={onSavePrice}
          />
        ))}
      </div>
    </section>
  );
}
