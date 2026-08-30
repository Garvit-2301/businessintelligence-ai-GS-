import type { AdsRow, Driver, ExternalEvent, InventoryRow, OrderRow, PvmResult } from "../types";
import { revenueOf, unitsOf } from "./aggregate";

export function rankDrivers(args: {
  pvm: PvmResult;
  priorOrders: OrderRow[];
  currentOrders: OrderRow[];
  priorAds: AdsRow[];
  currentAds: AdsRow[];
  inventory: InventoryRow[];
  events: ExternalEvent[];
  weights: Record<string, number>;
}): Driver[] {
  const { pvm, priorOrders, currentOrders, priorAds, currentAds, inventory, events, weights } = args;
  const westHoodiePrior = priorOrders.filter((r) => r.region === "West" && r.sku === "hoodie-core");
  const westHoodieCurrent = currentOrders.filter((r) => r.region === "West" && r.sku === "hoodie-core");
  const westDelta = revenueOf(westHoodieCurrent) - revenueOf(westHoodiePrior);
  const fillPrior = fill(westHoodiePrior);
  const fillCurrent = fill(westHoodieCurrent);
  const spendDelta = sum(currentAds, "spend") - sum(priorAds, "spend");
  const pixelDelta =
    currentOrders.reduce((s, r) => s + r.newCustomers, 0) -
    priorOrders.reduce((s, r) => s + r.newCustomers, 0);
  const platformDelta =
    currentAds.reduce((s, r) => s + r.platformConversions, 0) -
    priorAds.reduce((s, r) => s + r.platformConversions, 0);
  const reno = inventory.filter((r) => r.dc === "Reno" && r.sku === "hoodie-core");
  const latestReno = reno[reno.length - 1];
  const summit = events.find((e) => e.id === "summit-days-west");

  const clearanceDelta =
    revenueOf(currentOrders.filter((r) => r.sku === "tee-clearance")) -
    revenueOf(priorOrders.filter((r) => r.sku === "tee-clearance"));

  const drivers: Driver[] = [
    {
      id: "west-hoodie-volume",
      label: "West × Core Hoodie volume collapse",
      kind: "volume",
      contributionUsd: westDelta,
      support: 0.92,
      method: "hierarchical-contribution",
      evidenceIds: ["e-west-hoodie", "e-oms-fresh"],
      controllable: true,
      lever: "Availability + regional offer",
      notes: `West hoodie units ${unitsOf(westHoodiePrior)} → ${unitsOf(westHoodieCurrent)}.`,
    },
    {
      id: "summit-days",
      label: "Summit Days competitive promo (West)",
      kind: "competition",
      contributionUsd: westDelta * 0.45,
      support: 0.72,
      method: "driver-score",
      evidenceIds: ["e-summit"],
      controllable: true,
      lever: "Regional bundle, not national price match",
      notes: summit?.description ?? "",
    },
    {
      id: "reno-stock",
      label: "Reno inbound delay / hero-SKU cover",
      kind: "supply",
      contributionUsd: westDelta * 0.35,
      support: fillCurrent < fillPrior - 0.15 ? 0.8 : 0.55,
      method: "freshness-gate",
      evidenceIds: ["e-reno", "e-fill-proxy"],
      controllable: true,
      lever: "Expedite + paid suppression on unfulfillable SKU",
      notes: `OMS West hoodie fill ${pct(fillPrior)} → ${pct(fillCurrent)}. Official WMS W34 not landed.`,
    },
    {
      id: "aur-test",
      label: "Apparel AUR +4.2% test",
      kind: "price",
      contributionUsd: pvm.price,
      support: 0.88,
      method: "price-volume-mix",
      evidenceIds: ["e-pvm"],
      controllable: true,
      lever: "Pause West price test",
      notes: "Price realization is a tailwind; volume more than offsets it.",
    },
    {
      id: "clearance-mix",
      label: "Mix shift into clearance tees",
      kind: "mix",
      contributionUsd: pvm.mix,
      support: 0.84,
      method: "price-volume-mix",
      evidenceIds: ["e-pvm", "e-mix"],
      controllable: true,
      lever: "Promotional depth",
      notes: `Clearance revenue Δ ${Math.round(clearanceDelta)}. Mix effect isolated from volume.`,
    },
    {
      id: "paid-spend",
      label: "Paid spend up with contested conversions",
      kind: "marketing",
      contributionUsd: spendDelta,
      support: 0.4,
      method: "definition-align",
      evidenceIds: ["e-cac-conflict"],
      controllable: true,
      lever: "Attribution standard before reallocation",
      notes: `Spend Δ $${Math.round(spendDelta)}. First-party new customers Δ ${pixelDelta}; platform conversions Δ ${platformDelta}.`,
    },
    {
      id: "aurora-ramp",
      label: "Aurora Pulse launch ramp (sparse)",
      kind: "launch",
      contributionUsd:
        revenueOf(currentOrders.filter((r) => r.sku === "aurora-pulse")) -
        revenueOf(priorOrders.filter((r) => r.sku === "aurora-pulse")),
      support: 0.5,
      method: "materiality-hybrid",
      evidenceIds: ["e-aurora-sparse"],
      controllable: true,
      lever: "Hold launch media; do not annualize",
      notes: "18 selling days. Analog prior only.",
    },
  ];

  if (latestReno) {
    drivers.find((d) => d.id === "reno-stock")!.notes += ` Reno on-hand ${latestReno.onHand}, inbound ${latestReno.inboundEta ?? "n/a"}.`;
  }

  return drivers
    .map((d) => ({
      ...d,
      support: clamp01(d.support * (weights[d.id] ?? weights[d.kind] ?? 1)),
    }))
    .sort(
      (a, b) =>
        Math.abs(b.contributionUsd) * b.support - Math.abs(a.contributionUsd) * a.support,
    );
}

function fill(rows: OrderRow[]): number {
  const u = unitsOf(rows);
  if (u === 0) return 1;
  return rows.reduce((s, r) => s + r.fulfilledOnTime, 0) / u;
}

function sum(rows: AdsRow[], key: "spend"): number {
  return rows.reduce((s, r) => s + r[key], 0);
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

function clamp01(n: number): number {
  return Math.min(1, Math.max(0.15, n));
}
