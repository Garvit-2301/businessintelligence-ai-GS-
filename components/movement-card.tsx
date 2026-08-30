"use client";

import { Badge } from "@/components/ui/badge";
import { bandClass } from "@/lib/utils-ui";
import type { Insight } from "@/lib/types";
import { formatNumber, formatPct, formatRate, formatUsd } from "@/lib/utils";
import Link from "next/link";

export function MovementCard({ insight }: { insight: Insight }) {
  const money = insight.kpiId === "fill-rate";
  const current = money ? formatRate(insight.current) : formatUsd(insight.current);
  const delta = money ? formatPct(insight.deltaPct) : formatUsd(insight.delta);

  return (
    <Link
      href={`/insight/${insight.id}`}
      className="group rise flex flex-col justify-between rounded-2xl border border-white/10 bg-ink-2 p-5 transition hover:border-brass/40 hover:bg-ink-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-brass">{insight.title}</p>
          <h3 className="serif mt-2 text-2xl leading-tight text-paper">{insight.headline}</h3>
        </div>
        <Badge className={bandClass(insight.status)}>{insight.status}</Badge>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Current" value={current} />
        <Stat label="WoW" value={delta} warn={insight.delta < 0 && insight.kpiId !== "blended-cac"} />
        <Stat label="Confidence" value={`${Math.round(insight.confidence * 100)}%`} />
      </div>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {insight.flags.slice(0, 3).map((f) => (
          <Badge key={f} className="border-white/10 text-paper/60">
            {f}
          </Badge>
        ))}
        {insight.material ? (
          <Badge className="border-alert/30 bg-alert/10 text-alert">Material</Badge>
        ) : (
          <Badge className="border-white/10 text-paper/50">Below floor / advisory</Badge>
        )}
      </div>
      <p className="mt-4 text-xs text-paper/55">
        Top driver: {insight.drivers[0]?.label ?? "None ranked"} ·{" "}
        {insight.actions[0]?.lever ?? "No action"}
      </p>
    </Link>
  );
}

function Stat({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{label}</p>
      <p className={`tabular mt-1 text-base ${warn ? "text-alert" : "text-paper"}`}>{value}</p>
    </div>
  );
}

export function MiniKpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-2 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="tabular serif mt-1 text-2xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-paper/50">{hint}</p> : null}
    </div>
  );
}

export function formatKpiValue(insight: Insight): { current: string; prior: string; delta: string } {
  if (insight.kpiId === "fill-rate") {
    return {
      current: formatRate(insight.current),
      prior: formatRate(insight.prior),
      delta: formatPct(insight.deltaPct),
    };
  }
  if (insight.kpiId === "blended-cac") {
    return {
      current: `$${formatNumber(insight.current, 0)}`,
      prior: `$${formatNumber(insight.prior, 0)}`,
      delta: formatUsd(insight.delta, 0),
    };
  }
  return {
    current: formatUsd(insight.current),
    prior: formatUsd(insight.prior),
    delta: formatUsd(insight.delta),
  };
}
