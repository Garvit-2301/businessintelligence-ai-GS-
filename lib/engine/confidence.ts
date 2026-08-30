import type { ConfidenceBand, InsightStatus } from "../types";
import { clamp } from "../utils";

export function calibrate(args: {
  historyWeeks: number;
  sourceAgreement: number;
  completeness: number;
  unexplainedShare: number;
  freshnessPenalty: number;
  sparse: boolean;
  contradictory: boolean;
}): {
  confidence: number;
  band: ConfidenceBand;
  status: InsightStatus;
  flags: string[];
  questions: string[];
} {
  const flags: string[] = [];
  const questions: string[] = [];

  if (args.contradictory) {
    flags.push("contradictory-evidence");
    questions.push(
      "Which conversion definition is binding for W35 budget: first-party new customers or platform 7/1 attributed conversions?",
    );
    return {
      confidence: 0.28,
      band: "abstain",
      status: "abstain",
      flags,
      questions,
    };
  }

  const historyFactor = args.sparse ? 0.42 : clamp(args.historyWeeks / 12, 0.35, 1);
  if (args.sparse) {
    flags.push("sparse-history");
    questions.push(
      "Is there a signed launch plan (media, inventory, analog SKU) we should treat as the prior instead of annualizing 18 days?",
    );
  }

  const unexplainedPenalty = 1 - clamp(args.unexplainedShare, 0, 0.6);
  let confidence = clamp(
    0.18 +
      0.28 * args.completeness +
      0.22 * args.sourceAgreement +
      0.18 * historyFactor +
      0.14 * unexplainedPenalty -
      args.freshnessPenalty,
    0.12,
    0.93,
  );

  if (args.sparse) {
    confidence = Math.min(confidence, 0.44);
  }

  if (args.freshnessPenalty > 0.08) flags.push("stale-official-source");
  if (args.unexplainedShare > 0.28) {
    flags.push("high-residual");
    questions.push("Any unrecorded West discounting, store closures, or weather we should add to the graph?");
  }

  let band: ConfidenceBand = "high";
  let status: InsightStatus = "actionable";
  if (args.sparse) {
    band = "low";
    status = "sparse";
  } else if (confidence < 0.45) {
    band = "low";
    status = "monitor";
  } else if (confidence < 0.68) {
    band = "medium";
    status = "actionable";
  }

  return { confidence, band, status, flags, questions };
}

export function unexplainedShare(delta: number, explained: number): number {
  if (delta === 0) return 0;
  return clamp(Math.abs(Math.abs(delta) - Math.abs(explained)) / Math.abs(delta), 0, 1);
}
