import type { Persona, PersonaId } from "./types";

export const PERSONAS: Record<PersonaId, Persona> = {
  cfo: {
    id: "cfo",
    name: "Priya Shah",
    role: "Chief Financial Officer",
    title: "CFO",
    focus: "P&L, cash, materiality, board-ready decisions",
    decisionRights: [
      "Approve expedites above $25k",
      "Pause or extend price tests",
      "Set weekly materiality floors",
      "Hold budget until attribution is reconciled",
    ],
    deniedFields: [],
    tone: "Board brief. Lead with dollars, residual risk, and who must decide this week.",
  },
  category: {
    id: "category",
    name: "Marcus Chen",
    role: "Category Lead, Apparel & Wearables",
    title: "Category",
    focus: "Price, mix, inventory, hero SKUs, launch quality",
    decisionRights: [
      "Change promotional depth",
      "Rebalance clearance vs full-price",
      "Request replenishment and DC priority",
      "Adjust AUR tests by region",
    ],
    deniedFields: ["fullyLoadedCac", "corporateOverhead", "vendorContractTerms"],
    tone: "Operator memo. Name the SKU, the region, the lever you own, and what to watch Monday.",
  },
  growth: {
    id: "growth",
    name: "Aisha Rahman",
    role: "Director of Growth",
    title: "Growth",
    focus: "CAC, channel mix, launch spend, attribution",
    decisionRights: [
      "Reallocate paid budgets across campaigns",
      "Pause prospecting when fulfillment is broken",
      "Set attribution standard for budget meetings",
      "Protect launch media when evidence is thin",
    ],
    deniedFields: ["unitCogs", "vendorExpediteCost", "grossMarginByVendor"],
    tone: "Growth desk. Separate demand from fulfillment. Do not reallocate on a contested CAC.",
  },
};

export const PERSONA_LIST = Object.values(PERSONAS);
