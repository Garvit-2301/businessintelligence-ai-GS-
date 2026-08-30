import { PERSONAS } from "./personas";
import type { Evidence, Insight, PersonaId, RecommendedAction } from "./types";

const DENIED_FIELD_FRAGMENTS: Record<string, string[]> = {
  unitCogs: ["unitCogs", "unit_cogs", "cogs", "grossMargin", "gm$", "vendor"],
  vendorExpediteCost: ["expedite", "air freight", "vendor"],
  grossMarginByVendor: ["grossMargin", "gm$", "cogs"],
  fullyLoadedCac: ["fully loaded"],
  corporateOverhead: ["overhead"],
  vendorContractTerms: ["contract"],
};

export function canSeeKpi(persona: PersonaId, access: "full" | "masked" | "denied"): boolean {
  return access !== "denied";
}

export function maskInsight(insight: Insight, persona: PersonaId): Insight {
  const denied = PERSONAS[persona].deniedFields;
  if (denied.length === 0) return insight;

  const hideMargin = persona === "growth";
  const hideCacDetail = persona === "category";

  const evidence = insight.evidence
    .map((e) => maskEvidence(e, denied, hideMargin))
    .filter(Boolean) as Evidence[];

  const actions = insight.actions.map((a) => maskAction(a, persona, hideMargin));

  let narratives = { ...insight.narratives };
  if (hideMargin) {
    narratives = {
      ...narratives,
      growth: stripMarginLanguage(narratives.growth),
    };
  }

  return {
    ...insight,
    evidence,
    actions,
    narratives,
    flags: hideCacDetail
      ? insight.flags.concat(insight.id.includes("cac") ? ["cac-detail-masked"] : [])
      : insight.flags,
  };
}

function maskEvidence(
  evidence: Evidence,
  denied: string[],
  hideMargin: boolean,
): Evidence | null {
  if (hideMargin && evidence.id === "e-margin") return null;
  const fields = { ...evidence.fields };
  for (const key of Object.keys(fields)) {
    if (denied.some((d) => matches(key, d)) || (hideMargin && /cogs|margin|gm/i.test(key))) {
      fields[key] = "REDACTED";
    }
  }
  return { ...evidence, fields };
}

function maskAction(
  action: RecommendedAction,
  persona: PersonaId,
  hideMargin: boolean,
): RecommendedAction {
  if (hideMargin && /margin floor|GM\$|expedite/i.test(action.action + action.expectedImpact)) {
    return {
      ...action,
      expectedImpact: action.expectedImpact.replace(/margin[^.]+\./gi, "Financial floor is owned by Finance. "),
    };
  }
  if (persona === "growth" && action.id === "reno-expedite") {
    return {
      ...action,
      action:
        "You do not approve cash expedites. Suppress West hoodie paid until Ops/Finance confirm Reno cover. The dollar gate is a CFO decision.",
    };
  }
  return action;
}

function matches(field: string, denied: string): boolean {
  const frags = DENIED_FIELD_FRAGMENTS[denied] ?? [denied];
  return frags.some((f) => field.toLowerCase().includes(f.toLowerCase()));
}

function stripMarginLanguage(text: string): string {
  return text.replace(/margin dollars[^.]+\./gi, "Unit-cost detail is outside your entitlement.").trim();
}

export function fieldAllowed(persona: PersonaId, field: string): boolean {
  const denied = PERSONAS[persona].deniedFields;
  return !denied.some((d) => matches(field, d));
}
