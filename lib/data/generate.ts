import {
  CAMPAIGNS,
  CHANNELS,
  CURRENT_WEEK_END,
  HISTORY_START,
  REGIONS,
  SKUS,
} from "../semantics";
import type { AdsRow, ExternalEvent, InventoryRow, OrderRow } from "../types";
import { addDays, isoDate, parseIso, weekId } from "../utils";

function mulberry32(seed: number) {
  return function rand() {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashSeed(label: string): number {
  let h = 2166136261;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function eachDate(start: string, end: string): string[] {
  const out: string[] = [];
  let cur = start;
  while (cur <= end) {
    out.push(cur);
    cur = addDays(cur, 1);
  }
  return out;
}

function isoWeekNumber(date: string): number {
  const d = parseIso(date);
  const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  return Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function weeksSince(date: string, origin: string): number {
  return Math.round((parseIso(date).getTime() - parseIso(origin).getTime()) / (7 * 86400000));
}

export function generateOrders(): OrderRow[] {
  const dates = eachDate(HISTORY_START, CURRENT_WEEK_END);
  const rows: OrderRow[] = [];

  for (const date of dates) {
    const week = weekId(date);
    const w = isoWeekNumber(date);
    const t = weeksSince(date, HISTORY_START);
    const dow = parseIso(date).getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 1.08 : 1;
    const season = 1 + 0.06 * Math.sin((2 * Math.PI * w) / 52);

    for (const sku of SKUS) {
      if (sku.launch && date < sku.launch) continue;
      const rand = mulberry32(hashSeed(`${date}:${sku.id}`));

      for (const region of REGIONS) {
        for (const channel of CHANNELS) {
          let demand =
            sku.id === "hoodie-core"
              ? 42
              : sku.id === "tee-clearance"
                ? 38
                : sku.id === "linen-throw"
                  ? 18
                  : 6;

          demand *=
            region === "West" ? 1.12 : region === "East" ? 1.05 : 0.9;
          demand *=
            channel === "DTC Web" ? 1.15 : channel === "Retail" ? 0.95 : 0.75;
          demand *= season * weekend;
          demand *= 1 + 0.002 * t;

          if (sku.id === "aurora-pulse") {
            const day = Math.floor(
              (parseIso(date).getTime() - parseIso(sku.launch!).getTime()) / 86400000,
            );
            demand = (8 + day * 0.42) * (region === "West" ? 1.15 : 1) * (channel === "DTC Web" ? 1.35 : 0.5);
          }

          let price = sku.basePrice;
          if (sku.id !== "aurora-pulse" && sku.category === "Apparel" && date >= "2026-08-17") {
            price = sku.basePrice * 1.042;
          }

          if (date >= "2026-08-17") {
            if (sku.id === "hoodie-core") demand *= 0.7;
            if (sku.id === "tee-clearance") demand *= 1.42;
            if (sku.id === "linen-throw") demand *= 0.96;
            if (region === "West" && sku.id === "hoodie-core") demand *= 0.4;
            if (region === "West" && sku.id === "hoodie-core" && channel === "DTC Web") {
              demand *= 0.82;
            }
          }

          const noise = 0.88 + rand() * 0.24;
          const qty = Math.max(0, Math.round(demand * noise));
          if (qty === 0) continue;

          let fulfilled = qty;
          if (date >= "2026-08-17" && region === "West" && sku.id === "hoodie-core") {
            fulfilled = Math.round(qty * 0.62);
          } else {
            fulfilled = Math.round(qty * (0.93 + rand() * 0.05));
          }

          const newRate =
            sku.id === "aurora-pulse" ? 0.62 : channel === "DTC Web" ? 0.18 : 0.08;
          let newCustomers = Math.round(qty * newRate * (0.85 + rand() * 0.3));
          if (date >= "2026-08-17") {
            newCustomers = Math.round(newCustomers * 0.88);
          }

          rows.push({
            date,
            week,
            sku: sku.id,
            skuName: sku.name,
            category: sku.category,
            region,
            channel,
            qty,
            unitPrice: Math.round(price * 100) / 100,
            unitCogs: sku.baseCogs,
            newCustomers,
            fulfilledOnTime: Math.min(qty, fulfilled),
            launchCohort: Boolean(sku.launch),
          });
        }
      }
    }
  }

  return rows;
}

export function generateAds(orders: OrderRow[]): AdsRow[] {
  const dates = eachDate(HISTORY_START, CURRENT_WEEK_END);
  const rows: AdsRow[] = [];

  for (const date of dates) {
    const week = weekId(date);
    const dayOrders = orders.filter((o) => o.date === date);
    const units = dayOrders.reduce((s, o) => s + o.qty, 0);
    const auroraLive = date >= "2026-08-05";
    const rand = mulberry32(hashSeed(`ads:${date}`));

    for (const campaign of CAMPAIGNS) {
      if (campaign.id === "aurora-launch" && !auroraLive) continue;

      let spend =
        campaign.id === "brand-search"
          ? 4200
          : campaign.id === "prospecting-meta"
            ? 5100
            : campaign.id === "retargeting"
              ? 2800
              : 1900;

      spend *= 1 + 0.0015 * weeksSince(date, HISTORY_START);
      spend *= 0.92 + rand() * 0.16;
      if (date >= "2026-08-17") spend *= 1.18;
      if (campaign.id === "aurora-launch") {
        const day = Math.floor(
          (parseIso(date).getTime() - parseIso("2026-08-05").getTime()) / 86400000,
        );
        spend = 1600 + day * 70;
        if (date >= "2026-08-17") spend *= 1.1;
      }

      const clicks = Math.round(spend * (campaign.id === "brand-search" ? 0.42 : 0.18));
      const sessions = Math.round(clicks * (1.15 + rand() * 0.2));
      let platformConversions = Math.round(
        spend / (campaign.id === "brand-search" ? 38 : campaign.id === "aurora-launch" ? 72 : 54),
      );
      if (date >= "2026-08-17") platformConversions = Math.round(platformConversions * 1.09);

      if (campaign.id === "prospecting-meta") {
        platformConversions = Math.max(
          8,
          Math.round(platformConversions + units * 0.004 * rand()),
        );
      }

      rows.push({
        date,
        week,
        campaign: campaign.id,
        channel: campaign.channel,
        spend: Math.round(spend * 100) / 100,
        clicks,
        platformConversions,
        sessions,
      });
    }
  }

  return rows;
}

export function generateInventory(): InventoryRow[] {
  const mondays: string[] = [];
  let d = HISTORY_START;
  while (d <= CURRENT_WEEK_END) {
    const dt = parseIso(d);
    if (dt.getUTCDay() === 1) mondays.push(d);
    d = addDays(d, 1);
  }

  const dcs = ["Reno", "Columbus", "Savannah"];
  const rows: InventoryRow[] = [];

  for (const monday of mondays) {
    const week = weekId(monday);
    const snapshotFor = week;
    for (const sku of SKUS) {
      if (sku.launch && monday < sku.launch) continue;
      for (const dc of dcs) {
        let onHand =
          sku.id === "hoodie-core" ? 2400 : sku.id === "tee-clearance" ? 4200 : sku.id === "linen-throw" ? 1600 : 380;
        if (dc === "Reno") onHand *= 0.9;
        if (sku.id === "hoodie-core" && dc === "Reno" && monday >= "2026-08-17") {
          onHand = 140;
        }
        const officialFill =
          monday >= "2026-08-17"
            ? null
            : sku.id === "hoodie-core" && dc === "Reno" && monday >= "2026-08-10"
              ? 0.91
              : 0.94 + (hashSeed(`${monday}:${sku.id}:${dc}`) % 5) / 100;

        rows.push({
          week: snapshotFor,
          asOf: `${monday}T08:00:00Z`,
          sku: sku.id,
          dc,
          onHand: Math.round(onHand),
          inboundEta:
            sku.id === "hoodie-core" && dc === "Reno" && monday >= "2026-08-17"
              ? "2026-08-29"
              : null,
          officialFillRate: officialFill,
        });
      }
    }
  }

  return rows;
}

export function generateEvents(): ExternalEvent[] {
  return [
    {
      id: "summit-days-west",
      date: "2026-08-17",
      week: "2026-W34",
      type: "competitor",
      region: "West",
      title: "Summit Days — West regional promo",
      description:
        "Competitor Summit Outfitters ran 25–40% off hoodies and mid-layers in CA/OR/WA from 17–23 Aug. Confirmed by category ops and two retail circulars.",
    },
    {
      id: "aurora-launch",
      date: "2026-08-05",
      week: "2026-W32",
      type: "launch",
      sku: "aurora-pulse",
      title: "Aurora Pulse wearable launch",
      description:
        "New SKU. 18 selling days as of W34 close. No YoY. Analog prior: 2025 Pulse Lite (different price and channel mix).",
    },
    {
      id: "apparel-aur-test",
      date: "2026-08-10",
      week: "2026-W33",
      type: "launch",
      title: "Apparel AUR +4.2% test",
      description:
        "List-price test on Core Hoodie and Clearance Tee starting W33. Still live in all regions in W34.",
    },
  ];
}

export function warehouseAsOfLabel(): string {
  return isoDate(new Date("2026-08-18T08:00:00Z"));
}
