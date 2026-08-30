"use client";

import { Badge } from "@/components/ui/badge";
import { useBrief } from "@/components/persona-provider";
import { KPI_CONTRACTS } from "@/lib/semantics";
import { PERSONAS } from "@/lib/personas";

export default function SemanticsPage() {
  const { sources, persona } = useBrief();
  const you = PERSONAS[persona];

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brass">Governed KPI contract</p>
        <h1 className="serif mt-2 text-4xl sm:text-5xl">Definitions, grain, lineage, thresholds, access</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/65">
          Five connected KPIs. Three operational sources plus an external graph. Reading as {you.name} —{" "}
          {you.deniedFields.length ? `fields denied: ${you.deniedFields.join(", ")}` : "unmasked finance seat"}.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {sources.map((s) => (
          <article key={s.id} className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <div className="flex items-center justify-between">
              <h2 className="serif text-2xl">{s.name}</h2>
              <Badge className="border-white/12 text-paper/60">{s.quality} quality</Badge>
            </div>
            <p className="mt-1 text-xs text-paper/50">{s.system}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">Grain</dt>
                <dd>{s.grain}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">Cadence</dt>
                <dd>{s.refreshCadence}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">Last refresh</dt>
                <dd className="font-mono text-xs">{s.lastRefreshUtc}</dd>
              </div>
              <p className="text-brass/90">{s.lagNote}</p>
            </dl>
          </article>
        ))}
      </section>

      <section className="space-y-4">
        {KPI_CONTRACTS.map((k) => (
          <article key={k.id} className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-brass">{k.owner}</p>
                <h2 className="serif text-3xl">{k.name}</h2>
              </div>
              <div className="flex gap-2">
                {(Object.entries(k.access) as [keyof typeof k.access, string][]).map(([p, a]) => (
                  <Badge
                    key={p}
                    className={
                      a === "denied"
                        ? "border-alert/30 text-alert"
                        : a === "masked"
                          ? "border-amber/30 text-amber"
                          : "border-signal/30 text-signal"
                    }
                  >
                    {p} {a}
                  </Badge>
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-paper/75">{k.formula}</p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Grain / calendar</p>
                <p>
                  {k.grain}. {k.calendar}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Materiality</p>
                <p>
                  $ floor {k.materiality.dollarFloor} · % {(k.materiality.pctFloor * 100).toFixed(1)} · z{" "}
                  {k.materiality.zFloor}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Drivers</p>
                <p>{k.drivers.join(", ")}</p>
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] text-paper/45">Lineage: {k.lineage.join(" → ")}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
