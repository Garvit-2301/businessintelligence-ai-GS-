import { KPI_CONTRACTS, SKUS } from "./semantics";
import type { ExternalEvent, KgEdge, KgNode, KgPath } from "./types";

/**
 * Governed knowledge graph: KPI tree, SKUs, events, levers, owners, sources.
 * Round 1 "knowledge graph intelligence" — retrieval is graph walk, not prompt memory.
 */
export function buildKnowledgeGraph(events: ExternalEvent[]): {
  nodes: KgNode[];
  edges: KgEdge[];
} {
  const nodes: KgNode[] = [
    ...KPI_CONTRACTS.map((k) => ({ id: `kpi:${k.id}`, kind: "kpi" as const, label: k.name })),
    ...SKUS.map((s) => ({ id: `sku:${s.id}`, kind: "sku" as const, label: s.name })),
    { id: "region:West", kind: "region", label: "West" },
    { id: "region:Central", kind: "region", label: "Central" },
    { id: "region:East", kind: "region", label: "East" },
    { id: "source:oms", kind: "source", label: "OMS" },
    { id: "source:ads", kind: "source", label: "Paid media" },
    { id: "source:wms", kind: "source", label: "WMS" },
    { id: "source:external", kind: "source", label: "External graph" },
    { id: "lever:aur-test", kind: "lever", label: "Regional AUR test" },
    { id: "lever:expedite", kind: "lever", label: "Reno expedite" },
    { id: "lever:clearance", kind: "lever", label: "Promo depth" },
    { id: "lever:attribution", kind: "lever", label: "Attribution standard" },
    { id: "lever:launch-media", kind: "lever", label: "Launch media guardrail" },
    { id: "owner:cfo", kind: "owner", label: "CFO" },
    { id: "owner:category", kind: "owner", label: "Category" },
    { id: "owner:growth", kind: "owner", label: "Growth" },
    { id: "persona:cfo", kind: "persona", label: "Priya Shah" },
    { id: "persona:category", kind: "persona", label: "Marcus Chen" },
    { id: "persona:growth", kind: "persona", label: "Aisha Rahman" },
  ];

  const edges: KgEdge[] = [
    { from: "kpi:net-revenue", to: "kpi:gross-margin", rel: "DECOMPOSES_TO" },
    { from: "kpi:net-revenue", to: "kpi:aurora-gmv", rel: "INCLUDES" },
    { from: "kpi:net-revenue", to: "kpi:fill-rate", rel: "CONSTRAINED_BY" },
    { from: "kpi:blended-cac", to: "kpi:net-revenue", rel: "ACQUIRES" },
    { from: "kpi:blended-cac", to: "kpi:aurora-gmv", rel: "FUNDS" },
    { from: "kpi:gross-margin", to: "kpi:fill-rate", rel: "SENSITIVE_TO" },
    { from: "kpi:net-revenue", to: "source:oms", rel: "SOURCED_FROM" },
    { from: "kpi:gross-margin", to: "source:wms", rel: "SOURCED_FROM" },
    { from: "kpi:blended-cac", to: "source:ads", rel: "SOURCED_FROM" },
    { from: "kpi:fill-rate", to: "source:wms", rel: "SOURCED_FROM" },
    { from: "kpi:fill-rate", to: "source:oms", rel: "PROXY_FROM" },
    { from: "sku:hoodie-core", to: "kpi:net-revenue", rel: "CONTRIBUTES_TO" },
    { from: "sku:tee-clearance", to: "kpi:net-revenue", rel: "CONTRIBUTES_TO" },
    { from: "sku:aurora-pulse", to: "kpi:aurora-gmv", rel: "CONTRIBUTES_TO" },
    { from: "sku:hoodie-core", to: "lever:aur-test", rel: "CONTROLLED_BY" },
    { from: "sku:hoodie-core", to: "lever:expedite", rel: "CONTROLLED_BY" },
    { from: "sku:tee-clearance", to: "lever:clearance", rel: "CONTROLLED_BY" },
    { from: "kpi:blended-cac", to: "lever:attribution", rel: "CONTROLLED_BY" },
    { from: "sku:aurora-pulse", to: "lever:launch-media", rel: "CONTROLLED_BY" },
    { from: "lever:expedite", to: "owner:cfo", rel: "OWNED_BY" },
    { from: "lever:aur-test", to: "owner:category", rel: "OWNED_BY" },
    { from: "lever:clearance", to: "owner:category", rel: "OWNED_BY" },
    { from: "lever:attribution", to: "owner:growth", rel: "OWNED_BY" },
    { from: "lever:launch-media", to: "owner:growth", rel: "OWNED_BY" },
    { from: "owner:cfo", to: "persona:cfo", rel: "IS" },
    { from: "owner:category", to: "persona:category", rel: "IS" },
    { from: "owner:growth", to: "persona:growth", rel: "IS" },
  ];

  for (const e of events) {
    nodes.push({ id: `event:${e.id}`, kind: "event", label: e.title });
    edges.push({ from: `event:${e.id}`, to: "source:external", rel: "RECORDED_IN" });
    if (e.region) edges.push({ from: `event:${e.id}`, to: `region:${e.region}`, rel: "OCCURRED_IN" });
    if (e.sku) edges.push({ from: `event:${e.id}`, to: `sku:${e.sku}`, rel: "AFFECTS" });
    if (e.id === "summit-days-west") {
      edges.push({ from: `event:${e.id}`, to: "sku:hoodie-core", rel: "AFFECTS" });
      edges.push({ from: `event:${e.id}`, to: "kpi:net-revenue", rel: "EXPLAINS" });
    }
    if (e.id === "apparel-aur-test") {
      edges.push({ from: `event:${e.id}`, to: "sku:hoodie-core", rel: "AFFECTS" });
      edges.push({ from: `event:${e.id}`, to: "lever:aur-test", rel: "ACTIVATES" });
    }
    if (e.id === "aurora-launch") {
      edges.push({ from: `event:${e.id}`, to: "kpi:aurora-gmv", rel: "EXPLAINS" });
    }
  }

  return { nodes, edges };
}

export function knowledgeHits(
  graph: { edges: KgEdge[] },
  region?: string,
  skuName?: string,
): string[] {
  const skuId =
    skuName === "Core Hoodie"
      ? "sku:hoodie-core"
      : skuName === "Clearance Tee"
        ? "sku:tee-clearance"
        : skuName === "Aurora Pulse"
          ? "sku:aurora-pulse"
          : skuName === "Linen Throw"
            ? "sku:linen-throw"
            : undefined;
  const hits: string[] = [];
  for (const e of graph.edges) {
    if (e.rel !== "AFFECTS" && e.rel !== "OCCURRED_IN" && e.rel !== "EXPLAINS") continue;
    if (region && e.to === `region:${region}`) hits.push(e.from);
    if (skuId && e.to === skuId) hits.push(e.from);
  }
  return Array.from(new Set(hits));
}

export function pathsForInsight(
  graph: { nodes: KgNode[]; edges: KgEdge[] },
  insightId: string,
): KgPath[] {
  if (insightId === "net-revenue-w34") {
    return [
      path(graph, ["event:summit-days-west", "region:West", "sku:hoodie-core", "kpi:net-revenue", "lever:aur-test", "owner:category"]),
      path(graph, ["sku:hoodie-core", "lever:expedite", "owner:cfo"]),
      path(graph, ["sku:tee-clearance", "lever:clearance", "owner:category"]),
    ];
  }
  if (insightId === "blended-cac-conflict") {
    return [path(graph, ["kpi:blended-cac", "lever:attribution", "owner:growth"])];
  }
  if (insightId === "aurora-pulse-sparse") {
    return [path(graph, ["event:aurora-launch", "sku:aurora-pulse", "kpi:aurora-gmv", "lever:launch-media", "owner:growth"])];
  }
  return [path(graph, ["sku:hoodie-core", "lever:expedite", "owner:cfo"])];
}

function path(graph: { nodes: KgNode[]; edges: KgEdge[] }, ids: string[]): KgPath {
  const label = (id: string) => graph.nodes.find((n) => n.id === id)?.label ?? id;
  const relations: string[] = [];
  for (let i = 0; i < ids.length - 1; i++) {
    const edge = graph.edges.find((e) => e.from === ids[i] && e.to === ids[i + 1]);
    relations.push(edge?.rel ?? "RELATED");
  }
  return {
    nodes: ids.map(label),
    relations,
    summary: ids.map(label).join(" → "),
  };
}
