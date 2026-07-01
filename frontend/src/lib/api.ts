export type WorkspaceSummary = {
  id: string;
  title: string;
  client_name: string;
  template_code: string;
  status: string;
};

export type WorkspaceDetail = WorkspaceSummary & {
  width_mm: number;
  height_mm: number;
  letter_count: number;
  letter_perimeter_m: number;
  letter_face_area_m2: number;
  return_depth_mm: number;
  illuminated: boolean;
  led_module_count: number | null;
  selected_psu_watts: number | null;
  mounting_template_enabled: boolean;
  mounting_template_area_m2: number | null;
  mounting_template_material_type: string | null;
  notes: string | null;
};

export type WorkspaceCreateInput = {
  title: string;
  client_name: string;
  template_code: string;
  width_mm: number;
  height_mm: number;
  letter_count: number;
  letter_perimeter_m: number;
  letter_face_area_m2: number;
  return_depth_mm: number;
  illuminated: boolean;
  led_module_count: number | null;
  selected_psu_watts: number | null;
  mounting_template_enabled: boolean;
  mounting_template_area_m2: number | null;
  mounting_template_material_type: string | null;
  notes: string | null;
};

export type QuoteLine = {
  code: string;
  label: string;
  basis_type: string;
  quantity: number | null;
  unit: string;
  commercial_unit_price: number | null;
  subtotal: number | null;
  owner_decision_required: boolean;
};

export type QuoteLinePrice = {
  line_code: string;
  unit_price: number;
  currency: string;
  notes: string | null;
};

export type QuoteLinePriceUpdate = {
  line_code: string;
  unit_price: number;
  currency: string;
  notes: string | null;
};

export type QuoteBlocker = {
  code: string;
  message: string;
};

export type QuoteOwnerDecision = {
  code: string;
  label: string;
  detail: string;
  line_code: string | null;
  status: "pending" | "approved" | "rejected";
  selected_value: string | null;
  resolution_notes: string | null;
};

export type QuoteOwnerDecisionUpdate = {
  code: string;
  label: string;
  detail: string;
  line_code: string | null;
  status: "pending" | "approved" | "rejected";
  selected_value: string | null;
  resolution_notes: string | null;
};

export type QuotePreview = {
  workspace_id: string;
  workspace_title: string;
  client_name: string;
  status: string;
  existing_quote_id: string | null;
  existing_quote_code: string | null;
  subtotal_net: number | null;
  vat_rate: number;
  vat_amount: number | null;
  total_gross: number | null;
  currency: string;
  lines: QuoteLine[];
  blockers: QuoteBlocker[];
  owner_decisions: QuoteOwnerDecision[];
  warnings: string[];
};

export type CommercialQuote = {
  id: string;
  quote_code: string;
  workspace_id: string;
  workspace_title: string;
  client_name: string;
  status: "priced";
  subtotal_net: number;
  vat_rate: number;
  vat_amount: number;
  total_gross: number;
  currency: string;
  lines: QuoteLine[];
};

export type CreateCommercialQuoteResponse = {
  quote: CommercialQuote;
  source_preview_status: string;
};

const API_BASE = "/api/v1";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...init,
  });

  if (!response.ok) {
    const text = await response.text();
    if (text) {
      let detailMessage: string | null = null;
      try {
        const parsed = JSON.parse(text) as { detail?: string };
        if (typeof parsed.detail === "string" && parsed.detail.length > 0) {
          detailMessage = parsed.detail;
        }
      } catch {
        detailMessage = null;
      }
      throw new Error(detailMessage ?? text);
    }
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listWorkspaces() {
  return requestJson<WorkspaceSummary[]>("/intake-v6/workspaces");
}

export function createWorkspace(payload: WorkspaceCreateInput) {
  return requestJson<WorkspaceDetail>("/intake-v6/workspaces", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getWorkspace(workspaceId: string) {
  return requestJson<WorkspaceDetail>(`/intake-v6/workspaces/${workspaceId}`);
}

export function buildQuotePreview(workspaceId: string) {
  return requestJson<QuotePreview>(`/intake-v6/workspaces/${workspaceId}/quote-preview`, {
    method: "POST",
  });
}

export function listOwnerDecisions(workspaceId: string) {
  return requestJson<QuoteOwnerDecision[]>(`/intake-v6/workspaces/${workspaceId}/owner-decisions`);
}

export function updateOwnerDecision(workspaceId: string, decisionCode: string, payload: QuoteOwnerDecisionUpdate) {
  return requestJson<QuoteOwnerDecision>(`/intake-v6/workspaces/${workspaceId}/owner-decisions/${decisionCode}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function updateLinePrice(workspaceId: string, lineCode: string, payload: QuoteLinePriceUpdate) {
  return requestJson<QuoteLinePrice>(`/intake-v6/workspaces/${workspaceId}/line-prices/${lineCode}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listQuotePreviews() {
  return requestJson<QuotePreview[]>("/quotes/previews");
}

export function listCommercialQuotes() {
  return requestJson<CommercialQuote[]>("/quotes");
}

export function createCommercialQuoteFromPreview(workspaceId: string) {
  return requestJson<CreateCommercialQuoteResponse>(`/quotes/from-preview/${workspaceId}`, {
    method: "POST",
  });
}
