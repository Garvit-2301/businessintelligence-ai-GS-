import type { ForecastResult } from "../types";

/**
 * Holt linear (double exponential smoothing).
 * Round 1 detection step: a movement is judged against a forecast residual,
 * not only against last week. The LLM never sees raw series — only this object.
 */
export function holtForecast(history: number[], actual: number): ForecastResult {
  const series = history.filter((n) => Number.isFinite(n));
  if (series.length < 3) {
    const predicted = series[series.length - 1] ?? actual;
    return {
      method: "holt-linear",
      predicted,
      residual: actual - predicted,
      residualPct: predicted === 0 ? 0 : (actual - predicted) / predicted,
      interval80: [predicted, predicted],
      historyWeeks: series.length,
      outsideInterval: false,
    };
  }

  const alpha = 0.35;
  const beta = 0.15;
  let level = series[0];
  let trend = series[1] - series[0];
  const errors: number[] = [];

  for (let i = 1; i < series.length; i++) {
    const prevLevel = level;
    const yhat = level + trend;
    errors.push(series[i] - yhat);
    level = alpha * series[i] + (1 - alpha) * (level + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
  }

  const predicted = level + trend;
  const residual = actual - predicted;
  const mae = errors.reduce((s, e) => s + Math.abs(e), 0) / errors.length;
  const half = 1.28 * mae;
  const interval80: [number, number] = [predicted - half, predicted + half];

  return {
    method: "holt-linear",
    predicted,
    residual,
    residualPct: predicted === 0 ? 0 : residual / predicted,
    interval80,
    historyWeeks: series.length,
    outsideInterval: residual < interval80[0] || residual > interval80[1],
  };
}
