import { generateAds, generateEvents, generateInventory, generateOrders } from "../data/generate";
import { emptyFeedback } from "../feedback";
import { buildKnowledgeGraph, pathsForInsight } from "../knowledge-graph";
import { PERSONAS } from "../personas";
import {
  AS_OF,
  COMPANY,
  CURRENT_WEEK,
  KPI_CONTRACTS,
  PRIOR_WEEK,
  SOURCES,
} from "../semantics";
import type {
  Brief,
  Evidence,
  FeedbackState,
  Insight,
  PipelineStage,
} from "../types";
import { formatPct, formatUsd } from "../utils";
import { buildWeekly, currentPrior, filterWeek, revenueOf, unitsOf } from "./aggregate";
import { recommendActions } from "./actions";
import { causalAttribution } from "./causal";
import { calibrate, unexplainedShare } from "./confidence";
import { hierarchicalContribution, pvm } from "./decompose";
import { rankDrivers } from "./drivers";
import { holtForecast } from "./forecast";
import { kahanTree } from "./kahan";
import { assessMateriality, historySeries } from "./materiality";
import { composeNarratives } from "./narrative";

let cached: { key: string; brief: Brief } | null = null;

export function runPipeline(feedback: FeedbackState = emptyFeedback()): Brief {
  const key = JSON.stringify({
    w: feedback.driverWeights,
    o: feedback.ownerOverrides,
  });
  if (cached && cached.key === key) {
    return {
      ...cached.brief,
      telemetry: { ...cached.brief.telemetry, cacheHit: true },
    };
  }

  const t0 = now();
  const stages: PipelineStage[] = [];

  const tData = now();
  const orders = generateOrders();
  const ads = generateAds(orders);
  const inventory = generateInventory();
  const events = generateEvents();
  stages.push(
    stage("ingest", "Generate + load heterogeneous sources", "deterministic", tData, {
      notes: "OMS daily, ads hourly-rolled, WMS weekly, external events. Not an LLM step.",
    }),
  );

  const tRec = now();
  const weekly = buildWeekly(orders, ads, inventory);
  const { current, prior } = currentPrior(weekly);
  const currentOrders = filterWeek(orders, CURRENT_WEEK);
  const priorOrders = filterWeek(orders, PRIOR_WEEK);
  const currentAds = ads.filter((r) => r.week === CURRENT_WEEK);
  const priorAds = ads.filter((r) => r.week === PRIOR_WEEK);
  const graph = buildKnowledgeGraph(events);
  stages.push(
    stage("reconcile", "Grain, calendar, COGS fill, definition align", "deterministic", tRec, {
      notes: "ISO week close. COGS forward-filled from weekly cost. Fill rate carries official vs proxy.",
    }),
  );

  const tFc = now();
  const revForecast = holtForecast(historySeries(weekly, "netRevenue", CURRENT_WEEK), current.netRevenue);
  const cacForecast = holtForecast(historySeries(weekly, "blendedCac", CURRENT_WEEK), current.blendedCac);
  const auroraHistory = weekly.filter((w) => w.auroraGmv > 0 && w.week < CURRENT_WEEK).map((w) => w.auroraGmv);
  const auroraForecast = holtForecast(auroraHistory, current.auroraGmv);
  const fillForecast = holtForecast(historySeries(weekly, "omsFillRate", CURRENT_WEEK), current.omsFillRate);
  stages.push(
    stage("forecast", "Holt linear forecast — detect vs expected", "statistical", tFc, {
      notes: "Round 1 detection. Residual vs 80% interval, not a language-model guess.",
    }),
  );

  const tStat = now();
  const revenueContract = KPI_CONTRACTS.find((k) => k.id === "net-revenue")!;
  const cacContract = KPI_CONTRACTS.find((k) => k.id === "blended-cac")!;
  const auroraContract = KPI_CONTRACTS.find((k) => k.id === "aurora-gmv")!;
  const fillContract = KPI_CONTRACTS.find((k) => k.id === "fill-rate")!;

  const westHoodiePreview = hierarchicalContribution(
    filterWeek(orders, PRIOR_WEEK),
    filterWeek(orders, CURRENT_WEEK),
  ).find((s) => s.dimension === "sku" && s.key === "Core Hoodie");

  const revM = assessMateriality({
    contract: revenueContract,
    current: current.netRevenue,
    prior: prior.netRevenue,
    history: historySeries(weekly, "netRevenue", CURRENT_WEEK),
    unit: "usd",
    compositionHitUsd: westHoodiePreview?.delta,
    forecast: revForecast,
  });
  const cacM = assessMateriality({
    contract: cacContract,
    current: current.blendedCac,
    prior: prior.blendedCac,
    history: historySeries(weekly, "blendedCac", CURRENT_WEEK),
    unit: "usd",
    forecast: cacForecast,
  });
  const auroraM = assessMateriality({
    contract: auroraContract,
    current: current.auroraGmv,
    prior: prior.auroraGmv,
    history: auroraHistory,
    unit: "usd",
    forecast: auroraForecast,
  });
  const westHoodieFillPrior = (() => {
    const rows = filterWeek(orders, PRIOR_WEEK).filter((r) => r.region === "West" && r.sku === "hoodie-core");
    const u = unitsOf(rows);
    return u === 0 ? 1 : rows.reduce((s, r) => s + r.fulfilledOnTime, 0) / u;
  })();
  const westHoodieFillCurrent = (() => {
    const rows = filterWeek(orders, CURRENT_WEEK).filter((r) => r.region === "West" && r.sku === "hoodie-core");
    const u = unitsOf(rows);
    return u === 0 ? 1 : rows.reduce((s, r) => s + r.fulfilledOnTime, 0) / u;
  })();
  const fillM = assessMateriality({
    contract: fillContract,
    current: current.omsFillRate,
    prior: prior.omsFillRate,
    history: historySeries(weekly, "omsFillRate", CURRENT_WEEK),
    unit: "ratio",
    compositionHitUsd:
      westHoodieFillCurrent < westHoodieFillPrior - 0.15 ? fillContract.materiality.dollarFloor : undefined,
    forecast: fillForecast,
  });
  stages.push(
    stage("materiality", "Hybrid statistical + economic + forecast materiality", "statistical", tStat, {
      notes: "z-score, dollar/percent floors, composition, and Holt residual. Not an LLM step.",
    }),
  );

  const tKahan = now();
  const pvmRev = pvm(priorOrders, currentOrders);
  const hierarchy = hierarchicalContribution(priorOrders, currentOrders);
  const kahan = kahanTree(priorOrders, currentOrders, graph);
  stages.push(
    stage("kahan", "KAHAN hierarchical reasoning", "statistical", tKahan, {
      notes: "Recursive region → category → SKU attribution, knowledge-boosted by the graph.",
    }),
  );

  const tCausal = now();
  const causal = causalAttribution(priorOrders, currentOrders);
  const drivers = rankDrivers({
    pvm: pvmRev,
    priorOrders,
    currentOrders,
    priorAds,
    currentAds,
    inventory,
    events,
    weights: feedback.driverWeights,
  });
  stages.push(
    stage("causal", "Causal attribution + knowledge graph", "statistical", tCausal, {
      notes: "West vs Central+East DiD. Graph walks event → SKU → lever → owner. PVM is identity, not cause.",
    }),
  );

  const explained =
    Math.abs(pvmRev.price) + Math.abs(pvmRev.volume) + Math.abs(pvmRev.mix);
  const unexplained = unexplainedShare(revM.delta, explained);

  const westHoodie = hierarchy.find((s) => s.dimension === "sku" && s.key === "Core Hoodie");
  const freshnessHours = {
    oms: 3.2,
    ads: 5.5,
    wms: 25 * 24 + 1.2,
    external: 2,
  };

  const evidence = buildEvidence({
    current,
    prior,
    pvmRev,
    westHoodieDelta: westHoodie?.delta ?? 0,
    freshnessHours,
    currentOrders,
    priorOrders,
    forecastResidual: revForecast.residual,
    forecastPredicted: revForecast.predicted,
    didAtt: causal[0]?.att ?? 0,
  });

  const tConf = now();
  const revCal = calibrate({
    historyWeeks: 12,
    sourceAgreement: 0.86,
    completeness: 0.94,
    unexplainedShare: unexplained,
    freshnessPenalty: 0.04,
    sparse: false,
    contradictory: false,
  });
  const cacCal = calibrate({
    historyWeeks: 12,
    sourceAgreement: 0.22,
    completeness: 0.9,
    unexplainedShare: 0.4,
    freshnessPenalty: 0.02,
    sparse: false,
    contradictory: true,
  });
  const auroraCal = calibrate({
    historyWeeks: weekly.filter((w) => w.auroraGmv > 0).length,
    sourceAgreement: 0.7,
    completeness: 0.8,
    unexplainedShare: 0.2,
    freshnessPenalty: 0.03,
    sparse: true,
    contradictory: false,
  });
  const fillCal = calibrate({
    historyWeeks: 12,
    sourceAgreement: 0.58,
    completeness: 0.7,
    unexplainedShare: 0.18,
    freshnessPenalty: 0.12,
    sparse: false,
    contradictory: false,
  });
  stages.push(
    stage("confidence", "Confidence, abstention, sparse-history cap", "rules", tConf, {
      notes: "Abstain on source contradiction. Cap confidence when history < 28 days. Penalize stale official series.",
    }),
  );

  const tAct = now();
  const revActions = recommendActions(
    drivers.filter((d) =>
      ["west-hoodie-volume", "summit-days", "reno-stock", "aur-test", "clearance-mix"].includes(d.id),
    ),
    feedback,
  );
  const auroraActions = recommendActions(
    drivers.filter((d) => d.kind === "launch" || d.kind === "marketing"),
    feedback,
    { sparseLaunch: true },
  );
  const fillActions = recommendActions(
    drivers.filter((d) => d.kind === "supply" || d.kind === "volume"),
    feedback,
  );
  const cacActions = recommendActions(
    drivers.filter((d) => d.kind === "marketing" || d.kind === "definition"),
    feedback,
    { includeMarketing: true },
  );
  stages.push(
    stage("actions", "Action catalog: lever → owner → monitor", "rules", tAct, {
      notes: "Business-rule matching against ranked drivers, decision rights, and feedback owner overrides.",
    }),
  );

  const revenueInsight = baseInsight({
    id: "net-revenue-w34",
    kpiId: "net-revenue",
    title: "Net revenue",
    headline: `Net revenue ${formatUsd(revM.delta)} WoW (${formatPct(revM.deltaPct)}) — multi-factor, material`,
    status: revCal.status,
    confidence: revCal.confidence,
    confidenceBand: revCal.band,
    prior: prior.netRevenue,
    current: current.netRevenue,
    delta: revM.delta,
    deltaPct: revM.deltaPct,
    zScore: revM.z,
    material: revM.material,
    materialWhy: revM.reasons,
    unexplainedShare: unexplained,
    forecast: revForecast,
    pvm: pvmRev,
    kahan,
    causal,
    kgPaths: pathsForInsight(graph, "net-revenue-w34"),
    hierarchy,
    drivers: drivers.filter((d) =>
      ["west-hoodie-volume", "summit-days", "reno-stock", "aur-test", "clearance-mix"].includes(d.id),
    ),
    actions: revActions.filter((a) => a.id !== "protect-aurora-media" && a.id !== "hold-cac-reallocation"),
    evidence: evidence.filter((e) =>
      ["e-oms-fresh", "e-west-hoodie", "e-pvm", "e-mix", "e-summit", "e-reno", "e-forecast", "e-did"].includes(e.id),
    ),
    flags: revCal.flags,
    methodsUsed: [
      "forecast-holt",
      "materiality-hybrid",
      "price-volume-mix",
      "kahan-hierarchy",
      "causal-did",
      "knowledge-graph",
      "action-catalog",
    ],
    questions: revCal.questions,
  });

  const cacInsight = baseInsight({
    id: "blended-cac-conflict",
    kpiId: "blended-cac",
    title: "Blended CAC",
    headline: `Blended CAC ${formatUsd(cacM.delta, 0)} (${formatPct(cacM.deltaPct)}) — engine abstains`,
    status: cacCal.status,
    confidence: cacCal.confidence,
    confidenceBand: cacCal.band,
    prior: prior.blendedCac,
    current: current.blendedCac,
    delta: cacM.delta,
    deltaPct: cacM.deltaPct,
    zScore: cacM.z,
    material: cacM.material,
    materialWhy: cacM.reasons,
    unexplainedShare: 0.51,
    forecast: cacForecast,
    hierarchy: [],
    kgPaths: pathsForInsight(graph, "blended-cac-conflict"),
    drivers: drivers.filter((d) => d.id === "paid-spend"),
    actions: cacActions.filter((a) => a.id === "hold-cac-reallocation"),
    evidence: evidence.filter((e) => e.id === "e-cac-conflict" || e.id === "e-ads-fresh"),
    flags: cacCal.flags,
    methodsUsed: ["forecast-holt", "definition-align", "abstention-policy", "freshness-gate", "knowledge-graph"],
    questions: cacCal.questions,
  });

  const auroraDays = 19;
  const auroraInsight = baseInsight({
    id: "aurora-pulse-sparse",
    kpiId: "aurora-gmv",
    title: "Aurora Pulse GMV",
    headline: `Aurora Pulse GMV ${formatUsd(auroraM.delta)} (${formatPct(auroraM.deltaPct)}) — sparse history`,
    status: auroraCal.status,
    confidence: auroraCal.confidence,
    confidenceBand: auroraCal.band,
    prior: prior.auroraGmv,
    current: current.auroraGmv,
    delta: auroraM.delta,
    deltaPct: auroraM.deltaPct,
    zScore: auroraM.z,
    material: false,
    materialWhy: [
      ...auroraM.reasons,
      `${auroraDays} selling days. Statistical floors are unreliable; economic floors are advisory only.`,
    ],
    unexplainedShare: 0.2,
    forecast: auroraForecast,
    kgPaths: pathsForInsight(graph, "aurora-pulse-sparse"),
    hierarchy: hierarchy.filter((s) => s.dimension === "sku" && s.key === "Aurora Pulse"),
    drivers: drivers.filter((d) => d.id === "aurora-ramp"),
    actions: auroraActions.filter((a) => a.id === "protect-aurora-media"),
    evidence: evidence.filter((e) => e.id === "e-aurora-sparse"),
    flags: auroraCal.flags,
    methodsUsed: ["forecast-holt", "knowledge-graph", "confidence-calibrate", "action-catalog"],
    questions: auroraCal.questions,
  });

  const fillInsight = baseInsight({
    id: "fill-rate-reno",
    kpiId: "fill-rate",
    title: "On-time fill rate",
    headline: `OMS fill proxy ${formatPct(fillM.deltaPct)} — official WMS stale`,
    status: fillCal.status,
    confidence: fillCal.confidence,
    confidenceBand: fillCal.band,
    prior: prior.omsFillRate,
    current: current.omsFillRate,
    delta: fillM.delta,
    deltaPct: fillM.deltaPct,
    zScore: fillM.z,
    material: fillM.material,
    materialWhy: [
      ...fillM.reasons,
      "Official WMS W34 not landed. Definition of OMS proxy ≠ WMS official fill.",
    ],
    unexplainedShare: 0.18,
    forecast: fillForecast,
    causal: causal.filter((c) => c.id === "did-west-hoodie"),
    kgPaths: pathsForInsight(graph, "fill-rate-reno"),
    hierarchy: [],
    drivers: drivers.filter((d) => d.id === "reno-stock" || d.id === "west-hoodie-volume"),
    actions: fillActions.filter((a) => a.id === "reno-expedite"),
    evidence: evidence.filter((e) => ["e-fill-proxy", "e-reno", "e-wms-stale"].includes(e.id)),
    flags: fillCal.flags,
    methodsUsed: ["forecast-holt", "freshness-gate", "definition-align", "causal-did", "knowledge-graph", "rbac-mask"],
    questions: fillCal.questions,
  });

  const insights: Insight[] = [];
  for (const draft of [revenueInsight, cacInsight, auroraInsight, fillInsight]) {
    const { narratives, stage: nStage } = composeNarratives(draft);
    stages.push(nStage);
    insights.push({ ...draft, narratives });
  }

  const totalLatencyMs = now() - t0;
  const brief: Brief = {
    asOf: AS_OF,
    company: COMPANY,
    window: { currentWeek: CURRENT_WEEK, priorWeek: PRIOR_WEEK },
    insights,
    weekly,
    telemetry: {
      stages,
      totalLatencyMs,
      modelCalls: stages.reduce((s, x) => s + x.modelCalls, 0),
      promptTokens: stages.reduce((s, x) => s + x.promptTokens, 0),
      completionTokens: stages.reduce((s, x) => s + x.completionTokens, 0),
      costUsd: stages.reduce((s, x) => s + x.costUsd, 0),
      cacheHit: false,
    },
    sources: SOURCES,
    graph,
  };

  cached = { key, brief };
  return brief;
}

export function resetPipelineCache() {
  cached = null;
}

function baseInsight(partial: Omit<Insight, "narratives">): Insight {
  return { ...partial, narratives: { cfo: "", category: "", growth: "" } };
}

function buildEvidence(args: {
  current: Brief["weekly"][number];
  prior: Brief["weekly"][number];
  pvmRev: { price: number; volume: number; mix: number; residual: number };
  westHoodieDelta: number;
  freshnessHours: Record<string, number>;
  currentOrders: ReturnType<typeof filterWeek>;
  priorOrders: ReturnType<typeof filterWeek>;
  forecastResidual: number;
  forecastPredicted: number;
  didAtt: number;
}): Evidence[] {
  const { current, prior, pvmRev, westHoodieDelta, freshnessHours, currentOrders, priorOrders } = args;
  const westH0 = priorOrders.filter((r) => r.region === "West" && r.sku === "hoodie-core");
  const westH1 = currentOrders.filter((r) => r.region === "West" && r.sku === "hoodie-core");

  return [
    {
      id: "e-oms-fresh",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "freshness-gate",
      statement: "OMS daily close is complete through Sunday 23 Aug. W34 is a closed week.",
      fields: {
        lastRefresh: "2026-08-24T06:02:00Z",
        grain: "day / SKU / region / channel",
        rows: currentOrders.length,
      },
      lineage: ["oms.order_lines", "dims.sku", "calendar.iso_week"],
    },
    {
      id: "e-ads-fresh",
      source: "ads",
      asOf: "2026-08-24T03:40:00Z",
      freshnessHours: freshnessHours.ads,
      method: "freshness-gate",
      statement: "Ads hourly feed lagged ~6h. Sunday complete; Monday partial unused.",
      fields: {
        lastRefresh: "2026-08-24T03:40:00Z",
        spendW34: Math.round(current.spend),
        spendW33: Math.round(prior.spend),
      },
      lineage: ["ads.campaign_stats.spend", "ads.platform_conversions"],
    },
    {
      id: "e-wms-stale",
      source: "wms",
      asOf: "2026-08-18T08:00:00Z",
      freshnessHours: freshnessHours.wms,
      method: "freshness-gate",
      statement: "Official WMS weekly snapshot is W33. W34 official fill has not landed.",
      fields: {
        lastRefresh: "2026-08-18T08:00:00Z",
        officialWeek: PRIOR_WEEK,
        nextLand: "2026-08-25T08:00:00Z",
      },
      lineage: ["wms.weekly_fill", "wms.cost_file"],
    },
    {
      id: "e-west-hoodie",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "hierarchical-contribution",
      statement: "Largest SKU-region contribution is West × Core Hoodie.",
      fields: {
        contributionUsd: Math.round(revenueOf(westH1) - revenueOf(westH0)),
        nationalSkuDelta: Math.round(westHoodieDelta),
        unitsPrior: unitsOf(westH0),
        unitsCurrent: unitsOf(westH1),
        revenuePrior: Math.round(revenueOf(westH0)),
        revenueCurrent: Math.round(revenueOf(westH1)),
      },
      lineage: ["oms.order_lines", "hierarchical-contribution"],
    },
    {
      id: "e-pvm",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "price-volume-mix",
      statement: "National PVM on net revenue: price tailwind, volume and mix headwinds.",
      fields: {
        price: Math.round(pvmRev.price),
        volume: Math.round(pvmRev.volume),
        mix: Math.round(pvmRev.mix),
        residual: Math.round(pvmRev.residual),
      },
      lineage: ["oms.order_lines.qty", "oms.order_lines.net_price", "pvm.laspeyres-style"],
    },
    {
      id: "e-mix",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "price-volume-mix",
      statement: "Clearance tee unit share rose; hoodie share fell. Mix is isolated from volume.",
      fields: {
        mixUsd: Math.round(pvmRev.mix),
        unitCogsHoodie: 28,
        unitCogsTee: 9,
      },
      lineage: ["oms.order_lines", "wms.cost_file"],
    },
    {
      id: "e-summit",
      source: "external",
      asOf: "2026-08-24T07:15:00Z",
      freshnessHours: freshnessHours.external,
      method: "driver-score",
      statement: "Summit Days West promo 17–23 Aug, 25–40% off hoodies. Confirmed by ops, not scrape alone.",
      fields: { event: "summit-days-west", region: "West", confidence: "medium-high" },
      lineage: ["kg.external_events", "category-ops.confirm"],
    },
    {
      id: "e-reno",
      source: "wms",
      asOf: "2026-08-18T08:00:00Z",
      freshnessHours: freshnessHours.wms,
      method: "freshness-gate",
      statement: "Reno Core Hoodie on-hand is thin on the last official snapshot; inbound dated 29 Aug.",
      fields: { dc: "Reno", sku: "hoodie-core", inboundEta: "2026-08-29", vendorExpediteCost: 32000 },
      lineage: ["wms.on_hand", "wms.inbound"],
    },
    {
      id: "e-fill-proxy",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "definition-align",
      statement: "OMS on-time flag is a proxy, not the official WMS fill definition.",
      fields: {
        omsFillW34: Number(current.omsFillRate.toFixed(3)),
        omsFillW33: Number(prior.omsFillRate.toFixed(3)),
        officialW34: null,
      },
      lineage: ["oms.fulfilled_on_time", "wms.official_fill_rate", "reconcile.definition_delta"],
    },
    {
      id: "e-cac-conflict",
      source: "ads",
      asOf: "2026-08-24T03:40:00Z",
      freshnessHours: freshnessHours.ads,
      method: "definition-align",
      statement:
        "First-party new customers fell while platform conversions rose. Spend rose. Definitions disagree — abstain.",
      fields: {
        spendW34: Math.round(current.spend),
        spendW33: Math.round(prior.spend),
        newCustomersW34: current.newCustomers,
        newCustomersW33: prior.newCustomers,
        platformConvW34: current.platformConversions,
        platformConvW33: prior.platformConversions,
        blendedCacW34: Number(current.blendedCac.toFixed(2)),
        blendedCacW33: Number(prior.blendedCac.toFixed(2)),
        platformCacW34: Number(current.platformCac.toFixed(2)),
        platformCacW33: Number(prior.platformCac.toFixed(2)),
      },
      lineage: ["ads.spend", "oms.new_customers", "ads.platform_conversions"],
    },
    {
      id: "e-aurora-sparse",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "confidence-calibrate",
      statement: "Aurora Pulse launched 5 Aug. 18 complete selling days plus Sunday. No YoY. Analog only.",
      fields: {
        launch: "2026-08-05",
        sellingDays: 19,
        gmvW34: Math.round(current.auroraGmv),
        gmvW33: Math.round(prior.auroraGmv),
        analog: "2025 Pulse Lite (different price, channel mix)",
      },
      lineage: ["oms.order_lines (sku=aurora-pulse)", "kg.launch_events"],
    },
    {
      id: "e-forecast",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "forecast-holt",
      statement: "Holt linear forecast on the 12-week net-revenue close. Residual is the detection signal.",
      fields: {
        predicted: Math.round(args.forecastPredicted),
        residual: Math.round(args.forecastResidual),
        method: "holt-linear",
      },
      lineage: ["oms.weekly_close.net_revenue", "forecast.holt-linear"],
    },
    {
      id: "e-did",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "causal-did",
      statement: "DiD ATT for West hoodie vs Central+East hoodie. National AUR is the common shock.",
      fields: {
        att: Math.round(args.didAtt),
        treatment: "West × Core Hoodie",
        control: "Central+East × Core Hoodie",
      },
      lineage: ["oms.order_lines", "causal.difference-in-differences"],
    },
    {
      id: "e-margin",
      source: "oms",
      asOf: "2026-08-24T06:02:00Z",
      freshnessHours: freshnessHours.oms,
      method: "grain-reconcile",
      statement: "Gross margin $ uses weekly COGS forward-filled onto daily orders.",
      fields: {
        gmW34: Math.round(current.grossMargin),
        gmW33: Math.round(prior.grossMargin),
        unitCogsHoodie: 28,
        unitCogsTee: 9,
      },
      lineage: ["oms.net_amount", "wms.cost_file", "reconcile.forward_fill_cogs"],
    },
  ];
}

function now() {
  return Date.now();
}

function stage(
  id: string,
  label: string,
  kind: PipelineStage["kind"],
  started: number,
  extra: Partial<PipelineStage>,
): PipelineStage {
  return {
    id,
    label,
    kind,
    latencyMs: Math.max(1, now() - started),
    modelCalls: 0,
    promptTokens: 0,
    completionTokens: 0,
    costUsd: 0,
    notes: "",
    ...extra,
  };
}

export function insightsForPersona(brief: Brief, persona: keyof typeof PERSONAS): Insight[] {
  const access = (kpiId: string) =>
    KPI_CONTRACTS.find((k) => k.id === kpiId)?.access[persona] ?? "full";
  return brief.insights.filter((i) => access(i.kpiId) !== "denied");
}
