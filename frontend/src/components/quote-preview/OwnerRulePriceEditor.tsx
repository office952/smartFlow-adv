import { useEffect, useState } from "react";

import type { QuoteLine } from "../../lib/api";
import { canEditOwnerPrice, rulePriceKey } from "../../lib/quotePreviewUtils";

type OwnerRulePriceEditorProps = {
  line: QuoteLine;
  currency: string;
  saving: boolean;
  onSave: (ruleCode: string, unitPrice: number) => Promise<void>;
};

export function OwnerRulePriceEditor({ line, currency, saving, onSave }: OwnerRulePriceEditorProps) {
  const ruleCode = rulePriceKey(line);
  const editable = canEditOwnerPrice(line);
  const [draft, setDraft] = useState(line.commercial_unit_price?.toString() ?? "");
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(line.commercial_unit_price?.toString() ?? "");
  }, [line.commercial_unit_price, ruleCode]);

  async function handleBlur() {
    if (!editable || draft.trim() === "") {
      return;
    }

    const value = Number(draft);
    if (!Number.isFinite(value) || value < 0) {
      setLocalError("Unit price must be a non-negative number.");
      return;
    }

    setLocalError(null);
    await onSave(ruleCode, value);
  }

  if (!editable) {
    return (
      <div className="quote-price-readonly">
        <span>{line.commercial_unit_price ?? "—"}</span>
        <span className="quote-price-readonly__note">
          {line.line_status === "not_applicable"
            ? "Rule not applicable."
            : line.line_status === "included"
              ? "Included — no owner price."
              : line.owner_decision_required
                ? "Approve owner decisions first."
                : "Price entry not available for this line status."}
        </span>
      </div>
    );
  }

  return (
    <div className="quote-price-editor">
      <label className="quote-price-editor__label" htmlFor={`price-${ruleCode}`}>
        Owner unit price ({currency})
      </label>
      <input
        id={`price-${ruleCode}`}
        className="quote-price-editor__input"
        type="number"
        step="0.01"
        min="0"
        value={draft}
        placeholder="unset"
        disabled={saving}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          void handleBlur();
        }}
      />
      <p className="quote-price-editor__key">Price key: <code>{ruleCode}</code></p>
      {localError ? <p className="quote-price-editor__error">{localError}</p> : null}
      {!line.commercial_unit_price ? (
        <p className="quote-price-editor__missing">Owner price missing — preview stays blocked for this rule.</p>
      ) : null}
    </div>
  );
}
