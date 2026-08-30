import { knowledgeHits } from "../knowledge-graph";
import type { KgEdge, KgNode, KahanNode, OrderRow } from "../types";
import { revenueOf } from "./aggregate";

/**
 * KAHAN — knowledge-aware hierarchical attribution.
 * Recursively attributes a parent KPI move down region → category → SKU,
 * then boosts nodes that the knowledge graph already links to an event.
 * This is the Round 1 hierarchical reasoning step. Not an LLM.
 */
export function kahanTree(
  prior: OrderRow[],
  current: OrderRow[],
  graph: { nodes: KgNode[]; edges: KgEdge[] },
): KahanNode {
  const parentPrior = revenueOf(prior);
  const parentCurrent = revenueOf(current);
  const parentDelta = parentCurrent - parentPrior;

  const regions = unique([...prior, ...current].map((r) => r.region));
  const children = regions.map((region) => {
    const pR = prior.filter((r) => r.region === region);
    const cR = current.filter((r) => r.region === region);
    const categories = unique([...pR, ...cR].map((r) => r.category));
    const catNodes = categories.map((category) => {
      const pC = pR.filter((r) => r.category === category);
      const cC = cR.filter((r) => r.category === category);
      const skus = unique([...pC, ...cC].map((r) => r.skuName));
      const skuNodes = skus.map((sku) => {
        const pS = pC.filter((r) => r.skuName === sku);
        const cS = cC.filter((r) => r.skuName === sku);
        return leaf("sku", `${region}:${category}:${sku}`, sku, pS, cS, revenueOf(cC) - revenueOf(pC), graph, region, sku);
      });
      return roll(
        "category",
        `${region}:${category}`,
        `${region} · ${category}`,
        pC,
        cC,
        revenueOf(cR) - revenueOf(pR),
        graph,
        region,
        skuNodes,
      );
    });
    return roll("region", region, region, pR, cR, parentDelta, graph, region, catNodes);
  });

  children.sort((a, b) => weighted(b) - weighted(a));

  return {
    id: "net-revenue",
    label: "Net revenue",
    level: "kpi",
    prior: parentPrior,
    current: parentCurrent,
    delta: parentDelta,
    shareOfParent: 1,
    knowledgeBoost: 0,
    kgHits: [],
    children,
  };
}

function leaf(
  level: KahanNode["level"],
  id: string,
  label: string,
  prior: OrderRow[],
  current: OrderRow[],
  parentDelta: number,
  graph: { nodes: KgNode[]; edges: KgEdge[] },
  region: string,
  sku: string,
): KahanNode {
  const hits = knowledgeHits(graph, region, sku);
  return {
    id,
    label,
    level,
    prior: revenueOf(prior),
    current: revenueOf(current),
    delta: revenueOf(current) - revenueOf(prior),
    shareOfParent: parentDelta === 0 ? 0 : (revenueOf(current) - revenueOf(prior)) / parentDelta,
    knowledgeBoost: hits.length ? 1 + 0.15 * hits.length : 1,
    kgHits: hits,
    children: [],
  };
}

function roll(
  level: KahanNode["level"],
  id: string,
  label: string,
  prior: OrderRow[],
  current: OrderRow[],
  parentDelta: number,
  graph: { nodes: KgNode[]; edges: KgEdge[] },
  region: string,
  children: KahanNode[],
): KahanNode {
  const hits = knowledgeHits(graph, region);
  children.sort((a, b) => weighted(b) - weighted(a));
  return {
    id,
    label,
    level,
    prior: revenueOf(prior),
    current: revenueOf(current),
    delta: revenueOf(current) - revenueOf(prior),
    shareOfParent: parentDelta === 0 ? 0 : (revenueOf(current) - revenueOf(prior)) / parentDelta,
    knowledgeBoost: hits.length ? 1 + 0.1 * hits.length : 1,
    kgHits: hits,
    children,
  };
}

export function flattenKahan(node: KahanNode, acc: KahanNode[] = []): KahanNode[] {
  acc.push(node);
  for (const c of node.children) flattenKahan(c, acc);
  return acc;
}

export function weighted(node: KahanNode): number {
  return Math.abs(node.delta) * node.knowledgeBoost;
}

function unique(xs: string[]): string[] {
  return Array.from(new Set(xs));
}
