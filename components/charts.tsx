"use client";

import type { ContributionSlice, PvmResult, WeeklyKpiPoint } from "@/lib/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const tooltipStyle = {
  background: "#141c18",
  border: "1px solid rgba(243,237,224,0.12)",
  borderRadius: 12,
  color: "#f3ede0",
  fontSize: 12,
};

export function RevenueChart({ weekly }: { weekly: WeeklyKpiPoint[] }) {
  const data = weekly.slice(-12).map((w) => ({
    week: w.week.replace("2026-", ""),
    revenue: Math.round(w.netRevenue),
    aurora: Math.round(w.auroraGmv),
    margin: Math.round(w.grossMargin),
  }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(243,237,224,0.06)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="revenue" stroke="#c4a574" strokeWidth={2} dot={false} name="Net revenue" />
          <Line type="monotone" dataKey="aurora" stroke="#3d8b6e" strokeWidth={2} dot={false} name="Aurora GMV" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function PvmChart({ pvm }: { pvm: PvmResult }) {
  const data = [
    { name: "Price", v: Math.round(pvm.price) },
    { name: "Volume", v: Math.round(pvm.volume) },
    { name: "Mix", v: Math.round(pvm.mix) },
    { name: "Residual", v: Math.round(pvm.residual) },
  ];
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <BarChart data={data}>
          <CartesianGrid stroke="rgba(243,237,224,0.06)" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="v" name="USD" radius={[6, 6, 0, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.v >= 0 ? "#3d8b6e" : "#c45c3e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HierarchyChart({ slices }: { slices: ContributionSlice[] }) {
  const data = slices
    .filter((s) => s.dimension === "region" || s.dimension === "sku")
    .slice(0, 8)
    .map((s) => ({ name: s.key, v: Math.round(s.delta), dim: s.dimension }));
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid stroke="rgba(243,237,224,0.06)" horizontal={false} />
          <XAxis type="number" tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={88}
            tick={{ fill: "#e7dfcf", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="v" name="Δ USD" radius={[0, 6, 6, 0]}>
            {data.map((d) => (
              <Cell key={d.name} fill={d.v >= 0 ? "#3d8b6e" : "#c45c3e"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CacChart({ weekly }: { weekly: WeeklyKpiPoint[] }) {
  const data = weekly.slice(-10).map((w) => ({
    week: w.week.replace("2026-", ""),
    blended: Number(w.blendedCac.toFixed(1)),
    platform: Number(w.platformCac.toFixed(1)),
  }));
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="rgba(243,237,224,0.06)" vertical={false} />
          <XAxis dataKey="week" tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "#8a8376", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="blended" stroke="#c45c3e" strokeWidth={2} name="First-party CAC" />
          <Line type="monotone" dataKey="platform" stroke="#c4a574" strokeWidth={2} name="Platform CAC" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
