import type {
  CommercialRuleDefinition,
  ComponentDefinition,
  IntakeFieldDefinition,
  OwnerDecisionDefinition,
  ProductFamily,
  ProductTemplate,
} from "../types/systems";

const API_BASE = "/api/v1";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);

  if (init?.body !== undefined && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, { headers, ...init });

  if (!response.ok) {
    const text = await response.text();
    if (text) {
      try {
        const parsed = JSON.parse(text) as { detail?: string };
        if (typeof parsed.detail === "string" && parsed.detail.length > 0) {
          throw new Error(parsed.detail);
        }
      } catch (error) {
        if (error instanceof Error && error.message !== text) {
          throw error;
        }
      }
      throw new Error(text);
    }
    throw new Error(`Request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function listProductFamilies() {
  return requestJson<ProductFamily[]>("/systems/product-families");
}

export function getProductFamily(familyCode: string) {
  return requestJson<ProductFamily>(`/systems/product-families/${familyCode}`);
}

export function listProductTemplates() {
  return requestJson<ProductTemplate[]>("/systems/product-templates");
}

export function getProductTemplate(templateCode: string) {
  return requestJson<ProductTemplate>(`/systems/product-templates/${templateCode}`);
}

export function getTemplateComponents(templateCode: string) {
  return requestJson<ComponentDefinition[]>(`/systems/product-templates/${templateCode}/components`);
}

export function getTemplateCommercialRules(templateCode: string) {
  return requestJson<CommercialRuleDefinition[]>(`/systems/product-templates/${templateCode}/commercial-rules`);
}

export function getTemplateIntakeFields(templateCode: string) {
  return requestJson<IntakeFieldDefinition[]>(`/systems/product-templates/${templateCode}/intake-fields`);
}

export function getTemplateOwnerDecisions(templateCode: string) {
  return requestJson<OwnerDecisionDefinition[]>(`/systems/product-templates/${templateCode}/owner-decisions`);
}

export const DEFAULT_INTAKE_TEMPLATE = "volumetric_letters_frontlit";
