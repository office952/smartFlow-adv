import type { QuoteBlocker } from "./api";

export type BlockerRoute = {
  section: string;
  action: string;
  anchor?: string;
  detail?: string;
};

const OWNER_DECISION_SECTIONS: Record<string, Omit<BlockerRoute, "detail">> = {
  back_material: {
    section: "Spate",
    action: "Completează Material spate",
    anchor: "review-spate",
  },
  backing_mode: {
    section: "Spate",
    action: "Completează Mod spate / backing",
    anchor: "review-spate",
  },
  face_material: {
    section: "Owner decisions",
    action: "Completează Material față",
  },
  face_finish: {
    section: "Owner decisions",
    action: "Completează Finisaj față",
  },
  return_material: {
    section: "Owner decisions",
    action: "Completează Material cant",
  },
  return_finish: {
    section: "Owner decisions",
    action: "Completează Finisaj cant",
  },
  light_color: {
    section: "Iluminare",
    action: "Completează Culoare lumină",
    anchor: "review-iluminare",
  },
  led_density_policy: {
    section: "Iluminare",
    action: "Completează Politica densitate LED",
    anchor: "review-iluminare",
  },
  psu_policy: {
    section: "Iluminare",
    action: "Completează Politica sursă alimentare",
    anchor: "review-iluminare",
  },
  led_type: {
    section: "Iluminare",
    action: "Completează Tip LED",
    anchor: "review-iluminare",
  },
  finish_type: {
    section: "Finisaje / Letter Groups",
    action: "Completează Tip finisaj",
    anchor: "review-finisaje",
  },
  support_required_decision: {
    section: "Suport / Montaj",
    action: "Confirmă dacă suportul este necesar",
    anchor: "review-montaj",
  },
  support_type_decision: {
    section: "Suport / Montaj",
    action: "Completează Tip suport",
    anchor: "review-montaj",
  },
  mounting_required_decision: {
    section: "Suport / Montaj",
    action: "Confirmă dacă montajul este necesar",
    anchor: "review-montaj",
  },
  mounting_type_decision: {
    section: "Suport / Montaj",
    action: "Completează Tip montaj",
    anchor: "review-montaj",
  },
  mounting_system: {
    section: "Suport / Montaj",
    action: "Completează Sistem montaj / suport",
    anchor: "review-montaj",
  },
  packaging_required_decision: {
    section: "Ambalare / Livrare",
    action: "Confirmă dacă ambalarea este necesară",
    anchor: "review-ambalare",
  },
  delivery_policy: {
    section: "Ambalare / Livrare",
    action: "Completează Politica livrare",
    anchor: "review-ambalare",
  },
  package_size_class: {
    section: "Ambalare / Livrare",
    action: "Completează Clasa dimensiune ambalare",
    anchor: "review-ambalare",
  },
};

const REQUIRED_INPUT_SECTIONS: Record<string, Omit<BlockerRoute, "detail">> = {
  face_area_m2: {
    section: "Finisaje / Letter Groups",
    action: "Completează aria pe grupurile confirmate",
    anchor: "review-finisaje",
  },
  finish_area_m2: {
    section: "Finisaje / Letter Groups",
    action: "Completează suprafața finisaj pe grupuri sau global",
    anchor: "review-finisaje",
  },
  perimeter_ml: {
    section: "Finisaje / Letter Groups",
    action: "Completează perimetrul pe grupurile confirmate",
    anchor: "review-finisaje",
  },
  cut_length_ml: {
    section: "Finisaje / Letter Groups",
    action: "Completează lungimea de debitare (sau perimetru pe grupuri)",
    anchor: "review-finisaje",
  },
  letter_count: {
    section: "Finisaje / Letter Groups",
    action: "Confirmă grupurile litere sau numărul de litere",
    anchor: "review-finisaje",
  },
  back_area_m2: {
    section: "Spate",
    action: "Completează Suprafața spate (m²)",
    anchor: "review-spate",
  },
  artwork_width_mm: {
    section: "Artwork / SVG",
    action: "Completează lățimea artwork",
    anchor: "review-artwork",
  },
  artwork_height_mm: {
    section: "Artwork / SVG",
    action: "Completează înălțimea artwork",
    anchor: "review-artwork",
  },
  return_depth_mm: {
    section: "Finisaje / Letter Groups",
    action: "Completează adâncimea cant pe grupuri",
    anchor: "review-finisaje",
  },
  estimated_led_count: {
    section: "Iluminare",
    action: "Completează numărul estimat module LED",
    anchor: "review-iluminare",
  },
  estimated_power_w: {
    section: "Iluminare",
    action: "Completează puterea estimată (W) / PSU",
    anchor: "review-iluminare",
  },
  mounting_template_area_m2: {
    section: "Suport / Montaj",
    action: "Completează aria șablon montaj (m²)",
    anchor: "review-montaj",
  },
};

const RULE_INPUT_HINTS: Record<string, Omit<BlockerRoute, "detail">> = {
  face_area_rule: {
    section: "Finisaje / Letter Groups",
    action: "Completează aria față pe grupurile confirmate",
    anchor: "review-finisaje",
  },
  return_cant_rule: {
    section: "Finisaje / Letter Groups",
    action: "Completează perimetrul / adâncimea cant pe grupuri",
    anchor: "review-finisaje",
  },
  back_panel_rule: {
    section: "Spate",
    action: "Completează Material spate și suprafața spate",
    anchor: "review-spate",
  },
  finish_rule: {
    section: "Finisaje / Letter Groups",
    action: "Completează finisajele pe grupuri",
    anchor: "review-finisaje",
  },
  led_modules_rule: {
    section: "Iluminare",
    action: "Completează câmpurile iluminare",
    anchor: "review-iluminare",
  },
  psu_rule: {
    section: "Iluminare",
    action: "Completează puterea PSU estimată",
    anchor: "review-iluminare",
  },
};

function extractQuotedToken(message: string, prefix: string): string | null {
  const pattern = new RegExp(`${prefix} '([^']+)'`, "i");
  const match = message.match(pattern);
  return match?.[1] ?? null;
}

function extractRuleCode(message: string): string | null {
  return extractQuotedToken(message, "for rule") ?? extractQuotedToken(message, "rule");
}

export function parseBlockerDetail(blocker: QuoteBlocker): string | undefined {
  const { code, message } = blocker;
  if (code === "OWNER_DECISION_MISSING") {
    const decision = extractQuotedToken(message, "Owner decision");
    return decision ?? undefined;
  }
  if (code === "REQUIRED_INPUT_MISSING") {
    const input = extractQuotedToken(message, "Required input");
    if (input) {
      return input;
    }
    const rule = extractRuleCode(message);
    return rule ?? undefined;
  }
  if (code === "OWNER_PRICE_MISSING") {
    const rule = extractQuotedToken(message, "for rule") ?? extractQuotedToken(message, "rule");
    return rule ?? undefined;
  }
  return undefined;
}

export function routeBlocker(blocker: QuoteBlocker): BlockerRoute {
  const detail = parseBlockerDetail(blocker);

  if (blocker.code === "OWNER_DECISION_MISSING" && detail && OWNER_DECISION_SECTIONS[detail]) {
    return { ...OWNER_DECISION_SECTIONS[detail], detail };
  }

  if (blocker.code === "REQUIRED_INPUT_MISSING" && detail && REQUIRED_INPUT_SECTIONS[detail]) {
    return { ...REQUIRED_INPUT_SECTIONS[detail], detail };
  }

  if (blocker.code === "REQUIRED_INPUT_MISSING" && detail && RULE_INPUT_HINTS[detail]) {
    return { ...RULE_INPUT_HINTS[detail], detail };
  }

  if (blocker.code === "OWNER_PRICE_MISSING" && detail) {
    return {
      section: "Quote Preview / Owner Prices",
      action: `Introdu preț pentru ${detail}`,
      anchor: `price-${detail}`,
      detail,
    };
  }

  if (blocker.code === "OWNER_DECISION_MISSING") {
    return {
      section: "Owner decisions",
      action: detail ? `Completează decizia ${detail}` : "Aprobă decizia owner lipsă",
      detail,
    };
  }

  if (blocker.code === "REQUIRED_INPUT_MISSING") {
    const rule = extractRuleCode(blocker.message);
    if (rule && RULE_INPUT_HINTS[rule]) {
      return { ...RULE_INPUT_HINTS[rule], detail: rule };
    }
    return {
      section: "Intake review",
      action: detail ? `Completează câmpul ${detail}` : "Completează inputul lipsă din payload",
      detail,
    };
  }

  if (blocker.code === "OWNER_PRICE_MISSING") {
    return {
      section: "Quote Preview / Owner Prices",
      action: "Introdu preț owner pentru regula blocată",
      anchor: detail ? `price-${detail}` : "owner-prices",
      detail,
    };
  }

  return {
    section: "Quote Preview",
    action: "Verifică detaliile blocantului în mesajul backend",
    detail,
  };
}

export function formatBlockerHeadline(blocker: QuoteBlocker): string {
  const detail = parseBlockerDetail(blocker);
  return detail ? `${blocker.code}: ${detail}` : blocker.code;
}
