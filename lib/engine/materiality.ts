import type { ForecastResult, KpiContract, WeeklyKpiPoint } from "../types";
import { zScore } from "../utils";

export function assessMateriality(args: {
  contract: KpiContract;
  current: number;
  prior: number;
  history: number[];
  unit: "usd" | "ratio" | "count";
  compositionHitUsd?: number;
  forecast?: ForecastResult;
}): {
  delta: number;
  deltaPct: number;
  z: number;
  material: boolean;
  reasons: string[];
} {
  const { contract, current, prior, history } = args;
  const delta = current - prior;
  const deltaPct = prior === 0 ? 0 : delta / prior;
  const z = Math.abs(zScore(current, history));
  const dollarHit = args.unit === "usd" && Math.abs(delta) >= contract.materiality.dollarFloor;
  const ratioHit =
    args.unit !== "usd" && Math.abs(delta) >= contract.materiality.dollarFloor;
  const pctHit = Math.abs(deltaPct) >= contract.materiality.pctFloor;
  const zHit = z >= contract.materiality.zFloor;
  const compositionHit =
    args.compositionHitUsd != null &&
    Math.abs(args.compositionHitUsd) >= contract.materiality.dollarFloor;
  const forecastHit =
    args.forecast != null &&
    args.forecast.outsideInterval &&
    (args.unit !== "usd" || Math.abs(args.forecast.residual) >= contract.materiality.dollarFloor);
  const economic =
    dollarHit ||
    ratioHit ||
    compositionHit ||
    forecastHit ||
    (args.unit === "usd" && Math.abs(delta) >= 200000);
  const material =
    (economic && (pctHit || zHit || compositionHit || forecastHit)) ||
    (economic && Math.abs(delta) >= 200000);

  const reasons: string[] = [];
  if (dollarHit || ratioHit) {
    reasons.push(
      args.unit === "usd"
        ? `Economic floor met (|Δ| vs $${contract.materiality.dollarFloor.toLocaleString()} floor)`
        : `Threshold floor met (|Δ| vs ${contract.materiality.dollarFloor})`,
    );
  }
  if (pctHit) reasons.push(`Percent floor met (|Δ%| vs ${(contract.materiality.pctFloor * 100).toFixed(1)}%)`);
  if (zHit) reasons.push(`Statistical unusual vs 12-week history (z=${z.toFixed(2)} ≥ ${contract.materiality.zFloor})`);
  if (compositionHit) {
    reasons.push(
      `Composition materiality: a child contribution of ${Math.round(args.compositionHitUsd!).toLocaleString()} exceeds the economic floor even if the headline net is smaller`,
    );
  }
  if (args.forecast) {
    reasons.push(
      `Holt forecast residual ${Math.round(args.forecast.residual).toLocaleString()} vs 80% interval [${Math.round(args.forecast.interval80[0]).toLocaleString()}, ${Math.round(args.forecast.interval80[1]).toLocaleString()}]${args.forecast.outsideInterval ? " — outside band" : ""}`,
    );
  }
  if (!material) reasons.push("Below joint statistical + economic materiality policy");

  return { delta, deltaPct, z, material, reasons };
}

export function historySeries(
  weekly: WeeklyKpiPoint[],
  key: keyof WeeklyKpiPoint,
  excludeWeek: string,
  n = 12,
): number[] {
  return weekly
    .filter((w) => w.week < excludeWeek && typeof w[key] === "number")
    .slice(-n)
    .map((w) => Number(w[key]));
}
