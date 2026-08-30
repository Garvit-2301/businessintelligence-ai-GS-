"use client";

import { EntitlementNote } from "@/components/app-shell";
import { MiniKpi, MovementCard } from "@/components/movement-card";
import { RevenueChart } from "@/components/charts";
import { useBrief, usePersonaMeta } from "@/components/persona-provider";
import { ROUND2_MINIMUMS } from "@/lib/checklist";
import { formatPct, formatRate, formatUsd } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  const { insights, weekly, window, sources } = useBrief();
  const persona = usePersonaMeta();
  const last = weekly[weekly.length - 1];
  const prev = weekly[weekly.length - 2];

  return (
    <div className="space-y-8">
      <section className="rise grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-brass">
            Northline weekly briefing · {window.currentWeek}
          </p>
          <h1 className="serif mt-3 max-w-3xl text-4xl leading-[1.1] sm:text-5xl">
            Businesses do not need another dashboard. They need a reasoned brief with an owner.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-paper/70 sm:text-base">
            Same Round 1 analyst loop: Holt forecast, KAHAN hierarchy, causal DiD, knowledge-graph
            walks, then a {persona.title} story. Round 2 adds mismatched grains, entitlements,
            abstention, and a cost meter. The model never invents the numbers.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <EntitlementNote />
            <span className="text-xs text-paper/50">{persona.focus}</span>
          </div>
        </div>
        <aside className="rounded-2xl border border-white/10 bg-ink-2 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Judge path · 8 minutes</p>
          <ol className="mt-3 space-y-2 text-sm text-paper/75">
            <li>1. Stay on this briefing. Switch CFO → Category → Growth.</li>
            <li>
              2. Open{" "}
              <Link className="text-brass underline" href="/insight/net-revenue-w34">
                the multi-factor revenue miss
              </Link>
              .
            </li>
            <li>
              3. Open{" "}
              <Link className="text-brass underline" href="/insight/blended-cac-conflict">
                the CAC abstention
              </Link>{" "}
              and{" "}
              <Link className="text-brass underline" href="/insight/aurora-pulse-sparse">
                Aurora sparse history
              </Link>
              .
            </li>
            <li>
              4. Check{" "}
              <Link className="text-brass underline" href="/semantics">
                the contract
              </Link>
              ,{" "}
              <Link className="text-brass underline" href="/architecture">
                methods
              </Link>
              , and{" "}
              <Link className="text-brass underline" href="/telemetry">
                cost
              </Link>
              .
            </li>
            <li>
              5. Pitch live from{" "}
              <Link className="text-brass underline" href="/pitch">
                /pitch
              </Link>
              .
            </li>
          </ol>
        </aside>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MiniKpi
          label="Net revenue"
          value={formatUsd(last.netRevenue)}
          hint={`${formatPct((last.netRevenue - prev.netRevenue) / prev.netRevenue)} vs ${window.priorWeek}`}
        />
        <MiniKpi
          label="Gross margin $"
          value={persona.id === "growth" ? "Denied" : formatUsd(last.grossMargin)}
          hint={persona.id === "growth" ? "Outside Growth entitlement" : "COGS forward-filled from weekly WMS"}
        />
        <MiniKpi
          label="Blended CAC"
          value={`$${Math.round(last.blendedCac)}`}
          hint="Do not use alone — platform CAC disagrees"
        />
        <MiniKpi
          label="OMS fill proxy"
          value={formatRate(last.omsFillRate)}
          hint={last.wmsStale ? "Official WMS W34 not landed" : "Official WMS available"}
        />
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between">
          <div>
            <h2 className="serif text-3xl">Prioritised movements</h2>
            <p className="mt-1 text-sm text-paper/55">
              Ranked by materiality policy, not by whichever chart is loudest.
            </p>
          </div>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {insights.map((insight) => (
            <MovementCard key={insight.id} insight={insight} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="serif text-3xl">Round 2 minimums</h2>
        <p className="mt-1 text-sm text-paper/55">Every row is wired to a live page in this prototype.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ROUND2_MINIMUMS.map((item) => (
            <Link
              key={item.id}
              href={item.where}
              className="rounded-2xl border border-white/10 bg-ink-2 px-4 py-3 hover:border-brass/40"
            >
              <p className="text-sm text-paper">{item.title}</p>
              <p className="mt-1 text-xs text-paper/50">{item.proof}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Twelve-week close</p>
          <h3 className="serif mt-1 text-2xl">Revenue vs launch GMV</h3>
          <RevenueChart weekly={weekly} />
        </div>
        <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">Heterogeneous sources</p>
          <h3 className="serif mt-1 text-2xl">Grain and freshness</h3>
          <ul className="mt-4 space-y-3">
            {sources
              .filter((s) => s.id !== "external")
              .map((s) => (
                <li key={s.id} className="border-t border-white/8 pt-3 first:border-0 first:pt-0">
                  <p className="text-sm text-paper">{s.name}</p>
                  <p className="text-xs text-paper/50">
                    {s.grain} · {s.refreshCadence}
                  </p>
                  <p className="text-xs text-brass/90">{s.lagNote}</p>
                </li>
              ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
