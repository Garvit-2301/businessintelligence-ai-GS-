import {
  CURRENT_WEEK,
  CURRENT_WEEK_END,
  CURRENT_WEEK_START,
  PRIOR_WEEK,
  PRIOR_WEEK_END,
  PRIOR_WEEK_START,
} from "../semantics";
import type { AdsRow, InventoryRow, OrderRow, WeeklyKpiPoint } from "../types";
import { startOfIsoWeek, weekId } from "../utils";

export function filterWeek(orders: OrderRow[], week: string): OrderRow[] {
  return orders.filter((o) => o.week === week);
}

export function revenueOf(rows: OrderRow[]): number {
  return rows.reduce((s, r) => s + r.qty * r.unitPrice, 0);
}

export function marginOf(rows: OrderRow[]): number {
  return rows.reduce((s, r) => s + r.qty * (r.unitPrice - r.unitCogs), 0);
}

export function unitsOf(rows: OrderRow[]): number {
  return rows.reduce((s, r) => s + r.qty, 0);
}

export function buildWeekly(
  orders: OrderRow[],
  ads: AdsRow[],
  inventory: InventoryRow[],
): WeeklyKpiPoint[] {
  const weeks = Array.from(new Set(orders.map((o) => o.week))).sort();
  return weeks.map((week) => {
    const o = orders.filter((r) => r.week === week);
    const a = ads.filter((r) => r.week === week);
    const start = o[0] ? startOfIsoWeek(o[0].date) : week;
    const end = o.reduce((e, r) => (r.date > e ? r.date : e), start);
    const netRevenue = revenueOf(o);
    const grossMargin = marginOf(o);
    const units = unitsOf(o);
    const newCustomers = o.reduce((s, r) => s + r.newCustomers, 0);
    const spend = a.reduce((s, r) => s + r.spend, 0);
    const platformConversions = a.reduce((s, r) => s + r.platformConversions, 0);
    const auroraGmv = revenueOf(o.filter((r) => r.sku === "aurora-pulse"));
    const omsFillRate =
      units === 0 ? 0 : o.reduce((s, r) => s + r.fulfilledOnTime, 0) / units;
    const wmsRows = inventory.filter((r) => r.week === week && r.officialFillRate != null);
    const wmsFillRate =
      wmsRows.length === 0
        ? null
        : wmsRows.reduce((s, r) => s + (r.officialFillRate ?? 0), 0) / wmsRows.length;
    return {
      week,
      start,
      end,
      netRevenue,
      grossMargin,
      units,
      newCustomers,
      spend,
      platformConversions,
      blendedCac: newCustomers === 0 ? 0 : spend / newCustomers,
      platformCac: platformConversions === 0 ? 0 : spend / platformConversions,
      auroraGmv,
      omsFillRate,
      wmsFillRate,
      wmsStale: week === CURRENT_WEEK && wmsFillRate == null,
    };
  });
}

export function currentPrior(weekly: WeeklyKpiPoint[]) {
  const current = weekly.find((w) => w.week === CURRENT_WEEK);
  const prior = weekly.find((w) => w.week === PRIOR_WEEK);
  if (!current || !prior) {
    throw new Error("Weekly close missing current or prior week");
  }
  return { current, prior };
}

export const WINDOW = {
  currentWeek: CURRENT_WEEK,
  priorWeek: PRIOR_WEEK,
  currentStart: CURRENT_WEEK_START,
  currentEnd: CURRENT_WEEK_END,
  priorStart: PRIOR_WEEK_START,
  priorEnd: PRIOR_WEEK_END,
};

export { weekId };
