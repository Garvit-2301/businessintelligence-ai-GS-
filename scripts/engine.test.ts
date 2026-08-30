import assert from "node:assert/strict";
import { generateOrders } from "../lib/data/generate";
import { pvm } from "../lib/engine/decompose";
import { groundedAnswer } from "../lib/engine/narrative";
import { runPipeline } from "../lib/engine/pipeline";
import { applyEvent, emptyFeedback } from "../lib/feedback";
import { maskInsight } from "../lib/security";
import { ROUND2_MINIMUMS } from "../lib/checklist";
import { CURRENT_WEEK, PRIOR_WEEK } from "../lib/semantics";

const brief = runPipeline(emptyFeedback());
const byId = Object.fromEntries(brief.insights.map((i) => [i.id, i]));

assert.equal(brief.insights.length, 4, "four required scenarios");

const rev = byId["net-revenue-w34"];
assert.ok(rev.material, "revenue movement is material");
assert.equal(rev.status, "actionable");
assert.ok(rev.forecast, "Holt forecast attached");
assert.equal(rev.forecast!.method, "holt-linear");
assert.ok(rev.kahan, "KAHAN tree attached");
assert.equal(rev.kahan!.level, "kpi");
assert.ok(rev.kahan!.children.length >= 3, "KAHAN has regions");
assert.ok(rev.causal && rev.causal.length >= 1, "DiD attached");
assert.equal(rev.causal![0].method, "difference-in-differences");
assert.ok(rev.kgPaths && rev.kgPaths.length > 0, "knowledge-graph paths attached");
assert.ok(rev.pvm, "PVM present");
assert.ok(rev.pvm!.price > 0, "W34 AUR test is a price tailwind");
assert.ok(rev.pvm!.mix < 0, "clearance mix is a headwind");
assert.ok(rev.drivers.some((d) => d.id === "west-hoodie-volume"));
assert.ok(rev.actions.some((a) => a.id === "pause-west-aur"));
assert.ok(rev.narratives.cfo.includes("Priya"));
assert.ok(rev.narratives.growth.includes("Aisha"));

const cac = byId["blended-cac-conflict"];
assert.equal(cac.status, "abstain");
assert.equal(cac.confidenceBand, "abstain");
assert.ok(cac.questions && cac.questions.length > 0);

const aurora = byId["aurora-pulse-sparse"];
assert.equal(aurora.status, "sparse");
assert.ok(aurora.confidence <= 0.45, "sparse history caps confidence");
assert.ok(aurora.flags.includes("sparse-history"));

const fill = byId["fill-rate-reno"];
assert.ok(fill.flags.includes("stale-official-source") || fill.evidence.some((e) => e.id === "e-wms-stale"));
assert.equal(brief.weekly[brief.weekly.length - 1].wmsFillRate, null, "official W34 fill missing");

const last = brief.weekly[brief.weekly.length - 1];
assert.ok(last.blendedCac > last.platformCac, "two CAC series disagree in level");

const growthRev = maskInsight(rev, "growth");
assert.ok(
  !growthRev.evidence.some((e) => e.id === "e-margin"),
  "growth does not receive margin evidence",
);
const growthFill = maskInsight(fill, "growth");
const expedite = growthFill.evidence.find((e) => e.id === "e-reno");
if (expedite) {
  assert.equal(expedite.fields.vendorExpediteCost, "REDACTED");
}

const orders = generateOrders();
const p = pvm(
  orders.filter((o) => o.week === PRIOR_WEEK),
  orders.filter((o) => o.week === CURRENT_WEEK),
);
const recon = p.price + p.volume + p.mix + p.residual;
const delta =
  orders.filter((o) => o.week === CURRENT_WEEK).reduce((s, r) => s + r.qty * r.unitPrice, 0) -
  orders.filter((o) => o.week === PRIOR_WEEK).reduce((s, r) => s + r.qty * r.unitPrice, 0);
assert.ok(Math.abs(recon - delta) < 0.01, "PVM identity holds");

const rejected = applyEvent(emptyFeedback(), {
  id: "t1",
  at: new Date().toISOString(),
  persona: "cfo",
  insightId: "net-revenue-w34",
  kind: "reject-driver",
  target: "summit-days",
  note: "test",
});
const after = runPipeline(rejected);
const d0 = rev.drivers.find((d) => d.id === "summit-days")!.support;
const d1 = after.insights[0].drivers.find((d) => d.id === "summit-days")!.support;
assert.ok(d1 < d0, "rejecting a driver downweights support");

assert.ok(brief.telemetry.modelCalls === 12);
assert.ok(brief.telemetry.costUsd > 0);
assert.ok(brief.telemetry.stages.some((s) => s.kind === "llm"));
assert.ok(brief.telemetry.stages.some((s) => s.kind === "deterministic"));
assert.ok(brief.telemetry.stages.some((s) => s.id === "forecast"));
assert.ok(brief.telemetry.stages.some((s) => s.id === "kahan"));
assert.ok(brief.telemetry.stages.some((s) => s.id === "causal"));
assert.ok(brief.graph.nodes.length > 10);
assert.ok(brief.graph.edges.length > 10);

const qa = groundedAnswer("Why did this move?", rev, "cfo");
assert.equal(qa.refused, false);
assert.ok(qa.answer.includes("West") || qa.answer.includes("driver") || qa.answer.includes("Priya"));
assert.equal(ROUND2_MINIMUMS.length, 10);

console.log("engine.test.ts: all assertions passed");
