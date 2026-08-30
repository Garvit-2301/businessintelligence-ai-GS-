"use client";

import { CacChart, HierarchyChart, PvmChart } from "@/components/charts";
import { EntitlementNote } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatKpiValue } from "@/components/movement-card";
import { useBrief, usePersonaMeta } from "@/components/persona-provider";
import { groundedAnswer } from "@/lib/engine/narrative";
import { bandClass } from "@/lib/utils-ui";
import { formatPct, formatRate, formatUsd } from "@/lib/utils";
import Link from "next/link";
import { use, useMemo, useState } from "react";

export default function InsightPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { insights, weekly, recordFeedback, persona } = useBrief();
  const meta = usePersonaMeta();
  const insight = insights.find((i) => i.id === id);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ answer: string; citations: string[]; refused: boolean } | null>(
    null,
  );

  const values = useMemo(() => (insight ? formatKpiValue(insight) : null), [insight]);

  if (!insight || !values) {
    return (
      <div>
        <p>Insight not found.</p>
        <Link href="/" className="text-brass underline">
          Back to briefing
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-xs uppercase tracking-[0.16em] text-brass">
          ← Briefing
        </Link>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge className={bandClass(insight.status)}>{insight.status}</Badge>
          <Badge className={bandClass(insight.confidenceBand)}>
            {Math.round(insight.confidence * 100)}% {insight.confidenceBand}
          </Badge>
          {insight.material ? (
            <Badge className="border-alert/30 bg-alert/10 text-alert">Material</Badge>
          ) : null}
          <EntitlementNote />
        </div>
        <h1 className="serif mt-4 max-w-4xl text-4xl leading-tight sm:text-5xl">{insight.headline}</h1>
        <p className="mt-3 text-sm text-paper/55">
          {insight.title} · {values.prior} → {values.current} · z={insight.zScore.toFixed(2)} · written for{" "}
          {meta.name}
        </p>
      </div>

      <section className="paper rise rounded-3xl p-6 sm:p-8">
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#7a5340]">Persona narrative · LLM voice, engine numbers</p>
        <p className="serif mt-3 text-xl leading-8 text-ink sm:text-2xl">{insight.narratives[persona]}</p>
        {insight.questions && insight.questions.length > 0 ? (
          <div className="mt-6 rounded-2xl bg-ink px-4 py-3 text-paper">
            <p className="text-[10px] uppercase tracking-[0.16em] text-brass">Engine is asking</p>
            <ul className="mt-2 space-y-1 text-sm">
              {insight.questions.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {insight.materialWhy.map((r) => (
          <div key={r} className="rounded-2xl border border-white/10 bg-ink-2 p-4 text-sm text-paper/75">
            {r}
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {insight.forecast ? (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-brass">Round 1 · Forecasting</p>
            <h2 className="serif mt-1 text-2xl">Holt linear vs actual</h2>
            <p className="mt-1 text-xs text-paper/50">
              Detection is residual vs an 80% interval — not a language-model guess.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">Predicted</dt>
                <dd className="tabular text-lg">{fmtMetric(insight.kpiId, insight.forecast.predicted)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">Residual</dt>
                <dd className="tabular text-lg">{fmtMetric(insight.kpiId, insight.forecast.residual)}</dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">80% interval</dt>
                <dd className="tabular text-xs">
                  {fmtMetric(insight.kpiId, insight.forecast.interval80[0])} –{" "}
                  {fmtMetric(insight.kpiId, insight.forecast.interval80[1])}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-muted">Outside band</dt>
                <dd>{insight.forecast.outsideInterval ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>
        ) : null}
        {insight.causal && insight.causal.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-brass">Round 1 · Causal attribution</p>
            <h2 className="serif mt-1 text-2xl">Difference-in-differences</h2>
            {insight.causal.map((c) => (
              <div key={c.id} className="mt-3 border-t border-white/8 pt-3 first:border-0 first:pt-0">
                <p className="text-sm text-paper/80">{c.outcome}</p>
                <p className="tabular mt-1 text-2xl">
                  {c.outcome.includes("units") ? `${Math.round(c.att)} units` : formatUsd(c.att)} ATT
                </p>
                <p className="mt-1 text-xs text-paper/50">
                  Treat Δ {c.outcome.includes("units") ? Math.round(c.treatDelta) : formatUsd(c.treatDelta)} −
                  control Δ {c.outcome.includes("units") ? Math.round(c.controlDelta) : formatUsd(c.controlDelta)}.{" "}
                  {c.notes}
                </p>
              </div>
            ))}
          </div>
        ) : insight.kgPaths && insight.kgPaths.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <p className="text-[10px] uppercase tracking-[0.16em] text-brass">Round 1 · Knowledge graph</p>
            <h2 className="serif mt-1 text-2xl">Retrieved paths</h2>
            <ul className="mt-3 space-y-2 text-sm text-paper/75">
              {insight.kgPaths.map((p) => (
                <li key={p.summary}>{p.summary}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      {insight.kahan ? (
        <section className="rounded-2xl border border-white/10 bg-ink-2 p-5">
          <p className="text-[10px] uppercase tracking-[0.16em] text-brass">Round 1 · KAHAN</p>
          <h2 className="serif mt-1 text-2xl">Knowledge-aware hierarchical attribution</h2>
          <p className="mt-1 text-xs text-paper/50">
            Region → category → SKU. Nodes linked to a graph event are boosted. Rank is |Δ| × knowledge boost.
          </p>
          <div className="mt-4 space-y-3">
            {insight.kahan.children.slice(0, 3).map((region) => (
              <div key={region.id} className="rounded-xl bg-ink px-4 py-3">
                <div className="flex justify-between gap-3 text-sm">
                  <span>
                    {region.label}
                    {region.kgHits.length > 0 ? (
                      <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-brass">KG hit</span>
                    ) : null}
                  </span>
                  <span className="tabular">{formatUsd(region.delta)}</span>
                </div>
                <ul className="mt-2 space-y-1 text-xs text-paper/60">
                  {region.children.slice(0, 3).flatMap((cat) =>
                    cat.children.slice(0, 2).map((sku) => (
                      <li key={sku.id} className="flex justify-between">
                        <span>
                          {cat.label} · {sku.label}
                          {sku.kgHits.length > 0 ? " · graph-linked" : ""}
                        </span>
                        <span className="tabular">{formatUsd(sku.delta)}</span>
                      </li>
                    )),
                  )}
                </ul>
              </div>
            ))}
          </div>
          {insight.kgPaths && insight.kgPaths.length > 0 ? (
            <p className="mt-4 text-xs text-paper/50">
              Graph walks: {insight.kgPaths.map((p) => p.summary).join(" · ")}
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {insight.pvm ? (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <h2 className="serif text-2xl">Price · volume · mix</h2>
            <p className="mt-1 text-xs text-paper/50">
              Deterministic PVM. Residual {formatUsd(insight.pvm.residual)} is a reconciliation check, not a
              story.
            </p>
            <PvmChart pvm={insight.pvm} />
          </div>
        ) : insight.id === "blended-cac-conflict" ? (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <h2 className="serif text-2xl">Two CAC series</h2>
            <p className="mt-1 text-xs text-paper/50">
              First-party vs platform. Disagreement is why the engine abstains.
            </p>
            <CacChart weekly={weekly} />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <h2 className="serif text-2xl">Why this is not a run-rate</h2>
            <p className="mt-3 text-sm leading-6 text-paper/70">
              History length is below the 28-day prior we require to treat a launch KPI as statistically
              stable. Analog SKUs are labeled as analogs, not as causal controls.
            </p>
          </div>
        )}
        {insight.hierarchy.length > 0 ? (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <h2 className="serif text-2xl">Hierarchical contribution</h2>
            <p className="mt-1 text-xs text-paper/50">
              Flat contribution view. The KAHAN tree above is the Round 1 hierarchical step.
            </p>
            <HierarchyChart slices={insight.hierarchy} />
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-ink-2 p-5">
            <h2 className="serif text-2xl">Methods used</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {insight.methodsUsed.map((m) => (
                <Badge key={m} className="border-white/12 text-paper/70">
                  {m}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="serif text-3xl">Ranked drivers</h2>
        <p className="mt-1 text-sm text-paper/55">
          Score = |contribution| × support × feedback weight. Confirm or reject to teach the ranker.
        </p>
        <div className="mt-4 space-y-3">
          {insight.drivers.map((d) => (
            <div key={d.id} className="rounded-2xl border border-white/10 bg-ink-2 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-brass">{d.kind}</p>
                  <h3 className="serif text-xl">{d.label}</h3>
                  <p className="mt-1 text-sm text-paper/60">{d.notes}</p>
                </div>
                <div className="text-right">
                  <p className="tabular text-lg">{formatUsd(d.contributionUsd)}</p>
                  <p className="text-xs text-paper/50">support {Math.round(d.support * 100)}%</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    recordFeedback({
                      insightId: insight.id,
                      kind: "confirm",
                      target: d.id,
                      note: "Driver confirmed",
                    })
                  }
                >
                  Confirm driver
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    recordFeedback({
                      insightId: insight.id,
                      kind: "reject-driver",
                      target: d.id,
                      note: "Driver downweighted",
                    })
                  }
                >
                  Reject / downweight
                </Button>
                <span className="self-center text-[11px] text-paper/40">{d.method}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="serif text-3xl">Recommended actions</h2>
        <p className="mt-1 text-sm text-paper/55">
          driver → lever → action → expected impact → owner → confidence → monitoring
        </p>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {insight.actions.map((a) => (
            <article key={a.id} className="rounded-2xl border border-white/10 bg-ink-2 p-5">
              <p className="text-[10px] uppercase tracking-[0.16em] text-brass">{a.lever}</p>
              <h3 className="serif mt-2 text-2xl leading-tight">{a.action}</h3>
              <dl className="mt-4 space-y-2 text-sm">
                <Row k="Expected impact" v={a.expectedImpact} />
                <Row k="Owner" v={a.owner} />
                <Row k="Decision rights" v={a.decisionRights} />
                <Row k="Monitoring" v={a.monitoring} />
                <Row k="Confidence" v={`${Math.round(a.confidence * 100)}%`} />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                {a.constraints.map((c) => (
                  <Badge key={c} className="border-white/10 text-paper/55">
                    {c}
                  </Badge>
                ))}
              </div>
              <Button
                size="sm"
                variant="ghost"
                className="mt-4"
                onClick={() =>
                  recordFeedback({
                    insightId: insight.id,
                    kind: "wrong-owner",
                    target: a.id,
                    note: "Cycle action owner",
                  })
                }
              >
                Wrong owner — cycle routing
              </Button>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2 className="serif text-3xl">Evidence, freshness, lineage</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-ink-2 text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Source</th>
                <th className="px-3 py-2">Age</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Statement</th>
                <th className="px-3 py-2">Fields</th>
              </tr>
            </thead>
            <tbody>
              {insight.evidence.map((e) => (
                <tr key={e.id} className="border-t border-white/8">
                  <td className="px-3 py-3 font-mono text-xs text-brass">{e.id}</td>
                  <td className="px-3 py-3 uppercase">{e.source}</td>
                  <td className="tabular px-3 py-3">
                    {e.freshnessHours >= 24
                      ? `${(e.freshnessHours / 24).toFixed(1)}d`
                      : `${e.freshnessHours.toFixed(1)}h`}
                  </td>
                  <td className="px-3 py-3 text-xs">{e.method}</td>
                  <td className="max-w-sm px-3 py-3 text-paper/75">{e.statement}</td>
                  <td className="px-3 py-3 font-mono text-[11px] text-paper/55">
                    {Object.entries(e.fields)
                      .slice(0, 4)
                      .map(([k, v]) => `${k}=${v}`)
                      .join(" · ")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-paper/45">
          Growth cannot see unit COGS or vendor expedite fields — they render as REDACTED or drop out.
          Switch persona to verify.
        </p>
      </section>

      <section className="rounded-2xl border border-white/10 bg-ink-2 p-5">
        <h2 className="serif text-2xl">Ask the brief</h2>
        <p className="mt-1 text-sm text-paper/55">
          Grounded Q&amp;A over this insight only. The model cannot invent a number that is not in the
          evidence pack.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Why did revenue move? What should I do? How sure are you?"
            className="h-11 flex-1 rounded-full border border-white/12 bg-ink px-4 text-sm outline-none focus:border-brass"
          />
          <Button
            onClick={() => {
              setAnswer(groundedAnswer(question || "why did this move", insight, persona));
            }}
          >
            Ask
          </Button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Why did this move?", "What should I do?", "How confident are you?", "Show me secret COGS"].map(
            (q) => (
              <button
                key={q}
                className="rounded-full border border-white/12 px-3 py-1 text-xs text-paper/70 hover:bg-white/6"
                onClick={() => {
                  setQuestion(q);
                  setAnswer(groundedAnswer(q, insight, persona));
                }}
              >
                {q}
              </button>
            ),
          )}
        </div>
        {answer ? (
          <div className="mt-4 rounded-2xl bg-ink p-4 text-sm leading-6">
            {answer.refused ? <Badge className="mb-2 border-alert/30 text-alert">Refused</Badge> : null}
            <p className="whitespace-pre-wrap text-paper/85">{answer.answer}</p>
            {answer.citations.length > 0 ? (
              <p className="mt-2 text-[11px] text-brass">Cited {answer.citations.join(", ")}</p>
            ) : null}
          </div>
        ) : null}
      </section>
    </div>
  );
}

function fmtMetric(kpiId: string, n: number): string {
  if (kpiId === "fill-rate") return formatRate(n);
  if (kpiId === "blended-cac") return `$${Math.round(n)}`;
  return formatUsd(n);
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-muted">{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
