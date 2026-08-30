import type { ContributionSlice, OrderRow, PvmResult } from "../types";
import { revenueOf } from "./aggregate";

export function pvm(prior: OrderRow[], current: OrderRow[]): PvmResult {
  const keys = new Set([...prior.map(skuKey), ...current.map(skuKey)]);
  const priorMap = group(prior);
  const currentMap = group(current);

  const q0 = [...keys].reduce((s, k) => s + (priorMap.get(k)?.qty ?? 0), 0);
  const q1 = [...keys].reduce((s, k) => s + (currentMap.get(k)?.qty ?? 0), 0);
  const p0avg = q0 === 0 ? 0 : revenueOf(prior) / q0;

  let price = 0;
  let mix = 0;
  for (const k of keys) {
    const a = priorMap.get(k);
    const b = currentMap.get(k);
    const p0 = a && a.qty ? a.revenue / a.qty : b && b.qty ? b.revenue / b.qty : 0;
    const p1 = b && b.qty ? b.revenue / b.qty : p0;
    const qq1 = b?.qty ?? 0;
    const s0 = q0 === 0 ? 0 : (a?.qty ?? 0) / q0;
    const s1 = q1 === 0 ? 0 : qq1 / q1;
    price += qq1 * (p1 - p0);
    mix += q1 * (s1 - s0) * (p0 - p0avg);
  }

  const volume = (q1 - q0) * p0avg;
  const residual = revenueOf(current) - revenueOf(prior) - price - volume - mix;
  return { price, volume, mix, residual };
}

export function hierarchicalContribution(
  prior: OrderRow[],
  current: OrderRow[],
): ContributionSlice[] {
  const dims: ContributionSlice["dimension"][] = ["region", "category", "sku", "channel"];
  const parentDelta = revenueOf(current) - revenueOf(prior);
  const slices: ContributionSlice[] = [];

  for (const dimension of dims) {
    const keys = new Set([
      ...prior.map((r) => dimValue(r, dimension)),
      ...current.map((r) => dimValue(r, dimension)),
    ]);
    for (const key of keys) {
      const p = revenueOf(prior.filter((r) => dimValue(r, dimension) === key));
      const c = revenueOf(current.filter((r) => dimValue(r, dimension) === key));
      const delta = c - p;
      slices.push({
        key,
        dimension,
        prior: p,
        current: c,
        delta,
        shareOfParent: parentDelta === 0 ? 0 : delta / parentDelta,
      });
    }
  }

  return slices.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
}

function skuKey(r: OrderRow): string {
  return `${r.sku}:${r.region}:${r.channel}`;
}

function dimValue(r: OrderRow, dim: ContributionSlice["dimension"]): string {
  if (dim === "sku") return r.skuName;
  if (dim === "campaign") return r.sku;
  return r[dim];
}

function group(rows: OrderRow[]) {
  const map = new Map<string, { qty: number; revenue: number }>();
  for (const r of rows) {
    const k = skuKey(r);
    const cur = map.get(k) ?? { qty: 0, revenue: 0 };
    cur.qty += r.qty;
    cur.revenue += r.qty * r.unitPrice;
    map.set(k, cur);
  }
  return map;
}
