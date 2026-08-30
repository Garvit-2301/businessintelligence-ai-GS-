import { runPipeline } from "../lib/engine/pipeline";
import { emptyFeedback } from "../lib/feedback";

const brief = runPipeline(emptyFeedback());
console.log(
  JSON.stringify(
    {
      window: brief.window,
      telemetry: {
        latency: brief.telemetry.totalLatencyMs,
        modelCalls: brief.telemetry.modelCalls,
        tokens: brief.telemetry.promptTokens + brief.telemetry.completionTokens,
        cost: brief.telemetry.costUsd,
      },
      weeklyTail: brief.weekly.slice(-4).map((w) => ({
        week: w.week,
        rev: Math.round(w.netRevenue),
        gm: Math.round(w.grossMargin),
        cac: Number(w.blendedCac.toFixed(1)),
        pcac: Number(w.platformCac.toFixed(1)),
        aurora: Math.round(w.auroraGmv),
        fill: Number(w.omsFillRate.toFixed(3)),
        wms: w.wmsFillRate,
        newCust: w.newCustomers,
        spend: Math.round(w.spend),
      })),
      insights: brief.insights.map((i) => ({
        id: i.id,
        status: i.status,
        band: i.confidenceBand,
        conf: Number(i.confidence.toFixed(2)),
        prior: Math.round(i.prior * 100) / 100,
        current: Math.round(i.current * 100) / 100,
        delta: Math.round(i.delta * 100) / 100,
        pct: Number((i.deltaPct * 100).toFixed(1)),
        z: Number(i.zScore.toFixed(2)),
        material: i.material,
        drivers: i.drivers.map((d) => `${d.id}:${Math.round(d.contributionUsd)}`),
        actions: i.actions.map((a) => a.id),
        pvm: i.pvm,
      })),
    },
    null,
    2,
  ),
);
