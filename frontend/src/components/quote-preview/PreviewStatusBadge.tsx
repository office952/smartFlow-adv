import { Badge } from "../ui/Badge";
import type { PreviewLineStatus } from "../../lib/quotePreviewUtils";
import { LINE_STATUS_LABELS } from "../../lib/quotePreviewUtils";

type PreviewStatusBadgeProps = {
  status: string;
};

const STATUS_TONE: Record<string, "default" | "success" | "warning" | "danger"> = {
  ready: "success",
  blocked: "warning",
};

export function PreviewStatusBadge({ status }: PreviewStatusBadgeProps) {
  return <Badge tone={STATUS_TONE[status] ?? "default"}>{status}</Badge>;
}

type LineStatusBadgeProps = {
  status: PreviewLineStatus;
};

const LINE_TONE: Record<PreviewLineStatus, "default" | "success" | "warning" | "danger"> = {
  blocked: "danger",
  priced: "success",
  included: "default",
  manual_review: "warning",
  not_applicable: "default",
};

export function LineStatusBadge({ status }: LineStatusBadgeProps) {
  return <Badge tone={LINE_TONE[status]}>{LINE_STATUS_LABELS[status]}</Badge>;
}
