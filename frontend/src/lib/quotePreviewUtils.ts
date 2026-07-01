import type { QuoteBlocker, QuoteLine, QuotePreview } from "../lib/api";

export type PreviewLineStatus = NonNullable<QuoteLine["line_status"]>;

export type ComponentLineGroup = {
  componentCode: string;
  componentLabel: string;
  lines: QuoteLine[];
};

/** UI hint for backend blocker codes — not commercial truth. */
export const BLOCKER_HINTS: Record<string, string> = {
  REQUIRED_INPUT_MISSING: "A registry intake input is missing from the workspace payload.",
  OWNER_DECISION_MISSING: "An owner decision required by the commercial rule is not approved yet.",
  OWNER_PRICE_MISSING: "Owner must enter a unit price keyed by rule_code.",
  MANUAL_OWNER_REVIEW_REQUIRED: "This rule needs manual owner review or a fixed owner price before pricing.",
  UNSUPPORTED_BASIS: "The commercial basis is not supported for automated preview.",
  UNSUPPORTED_TEMPLATE: "The workspace template is not mapped to a systems product template.",
  NO_COMMERCIAL_RULES: "No commercial rules exist for the resolved template.",
};

export const LINE_STATUS_LABELS: Record<PreviewLineStatus, string> = {
  blocked: "Blocked",
  priced: "Priced",
  included: "Included",
  manual_review: "Manual review",
  not_applicable: "Not applicable",
};

export function rulePriceKey(line: QuoteLine): string {
  return line.rule_code ?? line.code;
}

export function canEditOwnerPrice(line: QuoteLine): boolean {
  if (line.line_status === "not_applicable" || line.line_status === "included") {
    return false;
  }
  if (line.owner_decision_required) {
    return false;
  }
  return true;
}

export function groupLinesByComponent(lines: QuoteLine[]): ComponentLineGroup[] {
  const groups = new Map<string, ComponentLineGroup>();

  for (const line of lines) {
    const componentCode = line.component_code ?? "unassigned";
    const componentLabel = line.component_display_name ?? componentCode;
    const existing = groups.get(componentCode);
    if (existing) {
      existing.lines.push(line);
      continue;
    }
    groups.set(componentCode, {
      componentCode,
      componentLabel,
      lines: [line],
    });
  }

  return Array.from(groups.values());
}

export function countLinesByStatus(lines: QuoteLine[]): Record<PreviewLineStatus, number> {
  const counts: Record<PreviewLineStatus, number> = {
    blocked: 0,
    priced: 0,
    included: 0,
    manual_review: 0,
    not_applicable: 0,
  };

  for (const line of lines) {
    const status = line.line_status ?? "blocked";
    counts[status] += 1;
  }

  return counts;
}

export function collectUniqueBlockers(preview: QuotePreview): QuoteBlocker[] {
  const seen = new Set<string>();
  const blockers: QuoteBlocker[] = [];

  for (const blocker of preview.blockers) {
    const key = `${blocker.code}::${blocker.message}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    blockers.push(blocker);
  }

  for (const line of preview.lines) {
    for (const blocker of line.blockers ?? []) {
      const key = `${blocker.code}::${blocker.message}`;
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);
      blockers.push(blocker);
    }
  }

  return blockers;
}

export function previewContextStats(preview: QuotePreview) {
  const statusCounts = countLinesByStatus(preview.lines);
  return {
    ruleCount: preview.lines.length,
    blockedCount: statusCounts.blocked,
    pricedCount: statusCounts.priced,
    includedCount: statusCounts.included,
    manualReviewCount: statusCounts.manual_review,
    notApplicableCount: statusCounts.not_applicable,
    blockerCount: collectUniqueBlockers(preview).length,
  };
}
