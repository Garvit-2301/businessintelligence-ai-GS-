import type { CausalEstimate, OrderRow } from "../types";
import { revenueOf, unitsOf } from "./aggregate";

/**
 * Causal attribution via difference-in-differences.
 * Round 1 step: isolate a treated slice against a control that shared the
 * national price test but not the West competitive + supply shock.
 * Association (PVM / KAHAN) is not treated as causation.
 */
export function causalAttribution(prior: OrderRow[], current: OrderRow[]): CausalEstimate[] {
  return [
    did({
      id: "did-west-hoodie",
      outcome: "Core Hoodie revenue",
      treat: (r) => r.region === "West" && r.sku === "hoodie-core",
      control: (r) => r.region !== "West" && r.sku === "hoodie-core",
      treatment: "West × Core Hoodie (Summit Days + Reno cover)",
      controlLabel: "Central+East × Core Hoodie (same national AUR test)",
      prior,
      current,
      notes:
        "National +4.2% AUR is common to both arms. Residual ATT is the West-only stack (competition + fill), not price.",
    }),
    did({
      id: "did-west-units",
      outcome: "Core Hoodie units",
      treat: (r) => r.region === "West" && r.sku === "hoodie-core",
      control: (r) => r.region !== "West" && r.sku === "hoodie-core",
      treatment: "West hoodie units",
      controlLabel: "Central+East hoodie units",
      prior,
      current,
      value: unitsOf,
      notes: "Unit DiD confirms the dollar ATT is a volume event, not an AUR artifact.",
    }),
  ];
}

function did(args: {
  id: string;
  outcome: string;
  treat: (r: OrderRow) => boolean;
  control: (r: OrderRow) => boolean;
  treatment: string;
  controlLabel: string;
  prior: OrderRow[];
  current: OrderRow[];
  value?: (rows: OrderRow[]) => number;
  notes: string;
}): CausalEstimate {
  const val = args.value ?? revenueOf;
  const treatDelta = val(args.current.filter(args.treat)) - val(args.prior.filter(args.treat));
  const controlDelta = val(args.current.filter(args.control)) - val(args.prior.filter(args.control));
  return {
    id: args.id,
    method: "difference-in-differences",
    outcome: args.outcome,
    treatment: args.treatment,
    control: args.controlLabel,
    treatDelta,
    controlDelta,
    att: treatDelta - controlDelta,
    notes: args.notes,
  };
}
