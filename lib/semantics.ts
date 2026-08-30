import type { DataSource, KpiContract } from "./types";

export const COMPANY = "Northline";
export const AS_OF = "2026-08-24T09:12:00Z";
export const CURRENT_WEEK = "2026-W34";
export const PRIOR_WEEK = "2026-W33";
export const CURRENT_WEEK_START = "2026-08-17";
export const CURRENT_WEEK_END = "2026-08-23";
export const PRIOR_WEEK_START = "2026-08-10";
export const PRIOR_WEEK_END = "2026-08-16";
export const HISTORY_START = "2026-03-02";

export const SOURCES: DataSource[] = [
  {
    id: "oms",
    name: "Order management",
    system: "Northline OMS (custom + Shopify Plus)",
    grain: "order line / day / SKU / region / channel",
    refreshCadence: "Daily 06:00 UTC (T+1 complete)",
    lastRefreshUtc: "2026-08-24T06:02:00Z",
    lagNote: "Complete through 2026-08-23. In-day 08-24 excluded from weekly close.",
    quality: "high",
    coverageStart: "2024-01-08",
  },
  {
    id: "ads",
    name: "Paid media",
    system: "Meta + Google Ads via Northline Lakehouse",
    grain: "hour / campaign, rolled to day for KPI close",
    refreshCadence: "Hourly, ~6 hour platform lag",
    lastRefreshUtc: "2026-08-24T03:40:00Z",
    lagNote: "Sunday 08-23 is complete. Monday 08-24 is partial and unused for W34.",
    quality: "medium",
    coverageStart: "2024-06-01",
  },
  {
    id: "wms",
    name: "Warehouse management",
    system: "Manhattan WMS → weekly snapshot",
    grain: "SKU / DC / week",
    refreshCadence: "Weekly Monday 08:00 UTC",
    lastRefreshUtc: "2026-08-18T08:00:00Z",
    lagNote: "Official W34 snapshot lands 2026-08-25. Current official fill is W33.",
    quality: "high",
    coverageStart: "2023-11-06",
  },
  {
    id: "external",
    name: "External context",
    system: "Competitive + calendar knowledge graph",
    grain: "event / day / optional region or SKU",
    refreshCadence: "Manual + nightly crawl",
    lastRefreshUtc: "2026-08-24T07:15:00Z",
    lagNote: "Summit Days West promo confirmed by category ops, not by scrape alone.",
    quality: "medium",
    coverageStart: "2025-01-01",
  },
];

export const KPI_CONTRACTS: KpiContract[] = [
  {
    id: "net-revenue",
    name: "Net revenue",
    owner: "Finance",
    formula: "Σ qty × net unit price, recognized on ship-confirm date, excluding tax and cancelled lines",
    unit: "usd",
    grain: "day, rolled to ISO week Monday–Sunday",
    calendar: "ISO week; fiscal year = calendar year for this prototype",
    sources: ["oms"],
    drivers: ["price", "volume", "mix", "region", "channel", "competition", "supply"],
    materiality: { dollarFloor: 75000, pctFloor: 0.03, zFloor: 1.8 },
    lineage: [
      "oms.order_lines.net_amount",
      "oms.order_lines.ship_confirm_ts",
      "dims.sku",
      "dims.region",
    ],
    access: { cfo: "full", category: "full", growth: "full" },
    relatedKpis: ["gross-margin", "aurora-gmv", "fill-rate"],
  },
  {
    id: "gross-margin",
    name: "Gross margin $",
    owner: "Finance",
    formula: "Net revenue − Σ qty × latest weekly unit COGS (WMS cost file, forward-filled)",
    unit: "usd",
    grain: "day for revenue, week for COGS — reconciled by forward-fill",
    calendar: "ISO week",
    sources: ["oms", "wms"],
    drivers: ["mix", "price", "cogs", "supply"],
    materiality: { dollarFloor: 40000, pctFloor: 0.04, zFloor: 1.8 },
    lineage: [
      "oms.order_lines.net_amount",
      "wms.cost_file.unit_cogs",
      "reconcile.forward_fill_cogs",
    ],
    access: { cfo: "full", category: "masked", growth: "denied" },
    relatedKpis: ["net-revenue", "fill-rate"],
  },
  {
    id: "blended-cac",
    name: "Blended CAC",
    owner: "Growth",
    formula: "Paid media spend / first-party new customers (OMS). Platform CAC = spend / platform conversions (7-day click / 1-day view).",
    unit: "usd",
    grain: "day spend and customers, reported on ISO week",
    calendar: "ISO week",
    sources: ["ads", "oms"],
    drivers: ["spend", "conversion", "attribution", "fulfillment"],
    materiality: { dollarFloor: 8, pctFloor: 0.12, zFloor: 1.6 },
    lineage: [
      "ads.campaign_stats.spend",
      "oms.customers.new_flag",
      "ads.platform_conversions",
    ],
    access: { cfo: "full", category: "masked", growth: "full" },
    relatedKpis: ["net-revenue", "aurora-gmv"],
  },
  {
    id: "aurora-gmv",
    name: "Aurora Pulse GMV",
    owner: "Category — Wearables",
    formula: "Net revenue of SKU aurora-pulse only. Launch date 2026-08-05. No YoY analog.",
    unit: "usd",
    grain: "day / SKU",
    calendar: "ISO week; launch-relative day used for sparse priors",
    sources: ["oms", "ads", "external"],
    drivers: ["launch", "price", "media", "availability"],
    materiality: { dollarFloor: 20000, pctFloor: 0.15, zFloor: 2.2 },
    lineage: ["oms.order_lines (sku=aurora-pulse)", "ads.campaigns (aurora-launch)"],
    access: { cfo: "full", category: "full", growth: "full" },
    relatedKpis: ["net-revenue", "blended-cac"],
  },
  {
    id: "fill-rate",
    name: "On-time fill rate",
    owner: "Operations",
    formula: "Official: WMS units shipped complete by promise / units ordered (weekly). Proxy: OMS lines with fulfilled_on_time flag (daily).",
    unit: "ratio",
    grain: "WMS week / OMS day",
    calendar: "ISO week; official series lags one Monday",
    sources: ["wms", "oms"],
    drivers: ["supply", "inbound", "dc"],
    materiality: { dollarFloor: 0.02, pctFloor: 0.02, zFloor: 1.5 },
    lineage: [
      "wms.weekly_fill.official_fill_rate",
      "oms.order_lines.fulfilled_on_time",
      "reconcile.definition_delta",
    ],
    access: { cfo: "full", category: "full", growth: "masked" },
    relatedKpis: ["net-revenue", "gross-margin"],
  },
];

export const SKUS = [
  {
    id: "hoodie-core",
    name: "Core Hoodie",
    category: "Apparel",
    basePrice: 78,
    baseCogs: 28,
    launch: null as string | null,
  },
  {
    id: "tee-clearance",
    name: "Clearance Tee",
    category: "Apparel",
    basePrice: 22,
    baseCogs: 9,
    launch: null,
  },
  {
    id: "linen-throw",
    name: "Linen Throw",
    category: "Home",
    basePrice: 64,
    baseCogs: 24,
    launch: null,
  },
  {
    id: "aurora-pulse",
    name: "Aurora Pulse",
    category: "Wearables",
    basePrice: 249,
    baseCogs: 110,
    launch: "2026-08-05",
  },
] as const;

export const REGIONS = ["West", "Central", "East"] as const;
export const CHANNELS = ["DTC Web", "Retail", "Marketplace"] as const;
export const CAMPAIGNS = [
  { id: "brand-search", channel: "Search" },
  { id: "prospecting-meta", channel: "Paid Social" },
  { id: "retargeting", channel: "Paid Social" },
  { id: "aurora-launch", channel: "Paid Social" },
] as const;

export const ACTION_CATALOG = [
  {
    id: "pause-west-aur",
    driverKinds: ["price"],
    lever: "Regional AUR test",
    action:
      "Pause the Apparel +4.2% AUR test in West only. Keep Central/East live as the control.",
    expectedImpact: "Recover a portion of West hoodie volume without giving back national price.",
    owner: "Category Lead + CFO (price governance)",
    ownerPersona: "category" as const,
    monitoring: "West hoodie units and AUR daily for 10 days vs Central.",
    constraints: ["Do not roll back national list price", "Honor in-flight promo calendar"],
    decisionRights: "Category can pause a regional test; CFO notified above $75k revenue swing.",
  },
  {
    id: "reno-expedite",
    driverKinds: ["supply", "volume"],
    lever: "Inbound expedite / DC priority",
    action:
      "If Monday WMS confirms Reno on-hand below 10 days cover, authorize air expedite for Core Hoodie and hold West paid on that SKU.",
    expectedImpact: "Restore West fill; avoid paying for demand we cannot ship.",
    owner: "Ops + CFO (spend gate)",
    ownerPersona: "cfo" as const,
    monitoring: "Reno on-hand, OMS fill proxy, West cancel rate — daily until W35 close.",
    constraints: ["Expedite > $25k needs CFO", "Do not overbuy clearance"],
    decisionRights: "Ops proposes; CFO approves cash. Category owns customer comms.",
  },
  {
    id: "tighten-clearance",
    driverKinds: ["mix"],
    lever: "Promotional depth",
    action:
      "Cut clearance tee sitewide depth from 40% to 25% and cap West homepage merchandising.",
    expectedImpact: "Reduce adverse mix; protect unit margin while hoodie recovers.",
    owner: "Category Lead",
    ownerPersona: "category" as const,
    monitoring: "Clearance share of units and apparel GM$ daily.",
    constraints: ["Aging inventory still needs an exit path by 30 Sep"],
    decisionRights: "Category owns promo depth inside the seasonal exit envelope.",
  },
  {
    id: "hold-cac-reallocation",
    driverKinds: ["marketing", "definition"],
    lever: "Budget attribution standard",
    action:
      "Do not reallocate paid budget on blended CAC this week. Convene Growth + Finance to lock one attribution window before W35 planning.",
    expectedImpact: "Prevent a wrong $80–120k weekly shift on contested conversions.",
    owner: "Growth Director + CFO",
    ownerPersona: "growth" as const,
    monitoring: "Publish both CAC series side-by-side until the standard is signed.",
    constraints: ["Aurora launch budget ring-fenced until 14 days post-launch analog exists"],
    decisionRights: "Growth may not move >15% of paid without an agreed definition.",
  },
  {
    id: "protect-aurora-media",
    driverKinds: ["launch", "marketing"],
    lever: "Launch media guardrail",
    action:
      "Hold Aurora launch media at plan. Do not judge efficiency on 18 days of GMV or a contested blended CAC.",
    expectedImpact: "Avoid killing a wearable launch on sparse history.",
    owner: "Growth Director",
    ownerPersona: "growth" as const,
    monitoring: "Launch-day-relative GMV vs analog wearable priors; stockouts; CAC only as a pair of series.",
    constraints: ["No YoY", "Analog priors are not causal"],
    decisionRights: "Growth owns in-flight launch media inside the approved envelope.",
  },
  {
    id: "west-competitive-response",
    driverKinds: ["competition", "volume"],
    lever: "Competitive offer + merchandising",
    action:
      "Stand up a West-only value bundle (hoodie + tee) rather than matching Summit Days on list price nationally.",
    expectedImpact: "Defend West demand without a national price war.",
    owner: "Category Lead",
    ownerPersona: "category" as const,
    monitoring: "West sessions, conversion, and hoodie AUR vs Central for 14 days.",
    constraints: ["Bundle cannot breach margin floor without CFO"],
    decisionRights: "Category designs the offer; Finance clears the floor.",
  },
];
