export type PersonaId = "cfo" | "category" | "growth";

export type SourceId = "oms" | "ads" | "wms" | "external";

export type MethodId =
  | "grain-reconcile"
  | "freshness-gate"
  | "definition-align"
  | "forecast-holt"
  | "materiality-hybrid"
  | "price-volume-mix"
  | "kahan-hierarchy"
  | "hierarchical-contribution"
  | "causal-did"
  | "knowledge-graph"
  | "driver-score"
  | "confidence-calibrate"
  | "abstention-policy"
  | "action-catalog"
  | "rbac-mask"
  | "feedback-reweight"
  | "narrative-llm"
  | "grounded-qa";

export type ConfidenceBand = "high" | "medium" | "low" | "abstain";

export type InsightStatus = "actionable" | "monitor" | "sparse" | "abstain";

export interface Persona {
  id: PersonaId;
  name: string;
  role: string;
  title: string;
  focus: string;
  decisionRights: string[];
  deniedFields: string[];
  tone: string;
}

export interface DataSource {
  id: SourceId;
  name: string;
  system: string;
  grain: string;
  refreshCadence: string;
  lastRefreshUtc: string;
  lagNote: string;
  quality: "high" | "medium" | "low";
  coverageStart: string;
}

export interface KpiContract {
  id: string;
  name: string;
  owner: string;
  formula: string;
  unit: "usd" | "ratio" | "count";
  grain: string;
  calendar: string;
  sources: SourceId[];
  drivers: string[];
  materiality: {
    dollarFloor: number;
    pctFloor: number;
    zFloor: number;
  };
  lineage: string[];
  access: Record<PersonaId, "full" | "masked" | "denied">;
  relatedKpis: string[];
}

export interface OrderRow {
  date: string;
  week: string;
  sku: string;
  skuName: string;
  category: string;
  region: string;
  channel: string;
  qty: number;
  unitPrice: number;
  unitCogs: number;
  newCustomers: number;
  fulfilledOnTime: number;
  launchCohort: boolean;
}

export interface AdsRow {
  date: string;
  week: string;
  campaign: string;
  channel: string;
  spend: number;
  clicks: number;
  platformConversions: number;
  sessions: number;
}

export interface InventoryRow {
  week: string;
  asOf: string;
  sku: string;
  dc: string;
  onHand: number;
  inboundEta: string | null;
  officialFillRate: number | null;
}

export interface ExternalEvent {
  id: string;
  date: string;
  week: string;
  type: "competitor" | "holiday" | "weather" | "launch";
  region?: string;
  sku?: string;
  title: string;
  description: string;
}

export interface WeeklyKpiPoint {
  week: string;
  start: string;
  end: string;
  netRevenue: number;
  grossMargin: number;
  units: number;
  newCustomers: number;
  spend: number;
  platformConversions: number;
  blendedCac: number;
  platformCac: number;
  auroraGmv: number;
  omsFillRate: number;
  wmsFillRate: number | null;
  wmsStale: boolean;
}

export interface ContributionSlice {
  key: string;
  dimension: "region" | "category" | "sku" | "channel" | "campaign";
  prior: number;
  current: number;
  delta: number;
  shareOfParent: number;
}

export interface PvmResult {
  price: number;
  volume: number;
  mix: number;
  residual: number;
}

export interface ForecastResult {
  method: "holt-linear";
  predicted: number;
  residual: number;
  residualPct: number;
  interval80: [number, number];
  historyWeeks: number;
  outsideInterval: boolean;
}

export interface KahanNode {
  id: string;
  label: string;
  level: "kpi" | "region" | "category" | "sku";
  prior: number;
  current: number;
  delta: number;
  shareOfParent: number;
  knowledgeBoost: number;
  kgHits: string[];
  children: KahanNode[];
}

export interface CausalEstimate {
  id: string;
  method: "difference-in-differences";
  outcome: string;
  treatment: string;
  control: string;
  treatDelta: number;
  controlDelta: number;
  att: number;
  notes: string;
}

export interface KgNode {
  id: string;
  kind: "kpi" | "sku" | "region" | "event" | "lever" | "owner" | "source" | "persona";
  label: string;
}

export interface KgEdge {
  from: string;
  to: string;
  rel: string;
}

export interface KgPath {
  nodes: string[];
  relations: string[];
  summary: string;
}

export interface Driver {
  id: string;
  label: string;
  kind:
    | "price"
    | "volume"
    | "mix"
    | "marketing"
    | "supply"
    | "competition"
    | "seasonality"
    | "launch"
    | "definition";
  contributionUsd: number;
  support: number;
  method: MethodId;
  evidenceIds: string[];
  controllable: boolean;
  lever?: string;
  notes: string;
}

export interface Evidence {
  id: string;
  source: SourceId;
  asOf: string;
  freshnessHours: number;
  method: MethodId;
  statement: string;
  fields: Record<string, string | number | boolean | null>;
  lineage: string[];
}

export interface RecommendedAction {
  id: string;
  driverId: string;
  lever: string;
  action: string;
  expectedImpact: string;
  owner: string;
  ownerPersona: PersonaId;
  confidence: number;
  monitoring: string;
  constraints: string[];
  decisionRights: string;
}

export interface Insight {
  id: string;
  kpiId: string;
  title: string;
  headline: string;
  status: InsightStatus;
  confidence: number;
  confidenceBand: ConfidenceBand;
  prior: number;
  current: number;
  delta: number;
  deltaPct: number;
  zScore: number;
  material: boolean;
  materialWhy: string[];
  unexplainedShare: number;
  forecast?: ForecastResult;
  pvm?: PvmResult;
  kahan?: KahanNode;
  causal?: CausalEstimate[];
  kgPaths?: KgPath[];
  hierarchy: ContributionSlice[];
  drivers: Driver[];
  actions: RecommendedAction[];
  evidence: Evidence[];
  flags: string[];
  methodsUsed: MethodId[];
  narratives: Record<PersonaId, string>;
  questions?: string[];
}

export interface PipelineStage {
  id: string;
  label: string;
  kind: "deterministic" | "statistical" | "rules" | "llm";
  latencyMs: number;
  modelCalls: number;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  notes: string;
}

export interface Brief {
  asOf: string;
  company: string;
  window: { currentWeek: string; priorWeek: string };
  insights: Insight[];
  weekly: WeeklyKpiPoint[];
  telemetry: {
    stages: PipelineStage[];
    totalLatencyMs: number;
    modelCalls: number;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
    cacheHit: boolean;
  };
  sources: DataSource[];
  graph: { nodes: KgNode[]; edges: KgEdge[] };
}

export interface FeedbackEvent {
  id: string;
  at: string;
  persona: PersonaId;
  insightId: string;
  kind: "confirm" | "reject-driver" | "wrong-owner" | "missing-context" | "useful";
  target?: string;
  note: string;
}

export interface FeedbackState {
  events: FeedbackEvent[];
  driverWeights: Record<string, number>;
  ownerOverrides: Record<string, PersonaId>;
}
