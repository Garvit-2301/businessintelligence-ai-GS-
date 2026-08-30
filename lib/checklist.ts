export const ROUND2_MINIMUMS = [
  {
    id: "kpis-sources",
    title: "3–5 connected KPIs across 2–3 sources",
    where: "/semantics",
    proof: "Net revenue, gross margin $, blended CAC, Aurora GMV, fill rate. OMS daily, ads hourly, WMS weekly.",
  },
  {
    id: "contract",
    title: "KPI / semantic contract",
    where: "/semantics",
    proof: "Definitions, formulas, drivers, thresholds, lineage, and persona access on every KPI.",
  },
  {
    id: "personas",
    title: "Two+ personas, different narratives and actions",
    where: "/",
    proof: "CFO, Category, Growth — switcher changes copy, denied fields, and owned levers.",
  },
  {
    id: "multifactor",
    title: "One multi-factor movement with known drivers",
    where: "/insight/net-revenue-w34",
    proof: "Price, volume, mix, West hoodie, Summit Days, Reno cover — KAHAN + DiD + PVM.",
  },
  {
    id: "abstain",
    title: "One low-confidence abstention",
    where: "/insight/blended-cac-conflict",
    proof: "First-party vs platform CAC. Engine asks which definition is binding.",
  },
  {
    id: "sparse",
    title: "One sparse-history / new KPI",
    where: "/insight/aurora-pulse-sparse",
    proof: "Aurora Pulse, 18 selling days, confidence capped, launch media protected.",
  },
  {
    id: "rbac",
    title: "One role-based entitlement scenario",
    where: "/insight/fill-rate-reno",
    proof: "Growth cannot see unit COGS or vendor expedite. Fields REDACTED before narrative.",
  },
  {
    id: "evidence",
    title: "Evidence: freshness, method, contribution, confidence, lineage",
    where: "/insight/net-revenue-w34",
    proof: "Every insight table cites source age, method id, dollars, and lineage path.",
  },
  {
    id: "llm-split",
    title: "Clear LLM vs non-LLM breakdown",
    where: "/architecture",
    proof: "Round 1 stages are deterministic/stats. LLM writes persona voice only.",
  },
  {
    id: "telemetry",
    title: "Runtime telemetry",
    where: "/telemetry",
    proof: "Latency, model calls, tokens, estimated $ per brief.",
  },
] as const;

export const ROUND1_PIPELINE = [
  {
    id: "forecast",
    title: "Forecasting",
    kind: "Statistical",
    why: "Detect meaningful change against what the series was supposed to do.",
    does: "Holt linear on the weekly close. Residual vs an 80% interval feeds materiality.",
  },
  {
    id: "kahan",
    title: "Hierarchical reasoning (KAHAN)",
    kind: "Statistical + graph",
    why: "A parent miss must name the child. Knowledge should boost the node an event already points at.",
    does: "Recursive region → category → SKU attribution, boosted by knowledge-graph hits.",
  },
  {
    id: "causal",
    title: "Causal attribution",
    kind: "Statistical",
    why: "PVM adds up. It does not say what caused West to diverge from Central.",
    does: "Difference-in-differences: West hoodie vs Central+East hoodie. National AUR is the common shock.",
  },
  {
    id: "kg",
    title: "Knowledge graph intelligence",
    kind: "Deterministic retrieval",
    why: "Summit Days, Reno inbound, and decision rights do not live in the order fact table.",
    does: "Graph walk: event → region → SKU → KPI → lever → owner. Used to boost KAHAN and route actions.",
  },
  {
    id: "story",
    title: "AI storytelling",
    kind: "LLM-shaped",
    why: "Leaders need a brief in their voice, not a dump of residuals.",
    does: "Persona narrative over a frozen evidence pack. Grounded Q&A. No invented quantities.",
  },
] as const;
