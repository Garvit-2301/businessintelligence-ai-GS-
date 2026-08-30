"use client";

import { Badge } from "@/components/ui/badge";
import { useBrief } from "@/components/persona-provider";
import { ROUND1_PIPELINE, ROUND2_MINIMUMS } from "@/lib/checklist";
import { methodKindLabel } from "@/lib/utils-ui";
import Link from "next/link";

export default function ArchitecturePage() {
  const { telemetry } = useBrief();
  const llm = telemetry.stages.filter((s) => s.kind === "llm");
  const other = telemetry.stages.filter((s) => s.kind !== "llm");

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brass">Round 1 pipeline, still the contract</p>
        <h1 className="serif mt-2 text-4xl sm:text-5xl">Forecast → KAHAN → causal → graph → story</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/65">
          The Round 1 PDF named a research-backed analyst loop: detect meaningful change, uncover
          causes, validate with evidence, recommend the next action. Round 2 did not replace that
          loop. It added grain, entitlements, abstention, and a cost meter around it. The LLM still
          only writes.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Non-LLM stages" value={String(other.length)} hint={`${other.reduce((s, x) => s + x.latencyMs, 0)} ms`} />
        <Stat label="LLM-shaped stages" value={String(llm.length)} hint={`${telemetry.modelCalls} calls · persona × insight`} />
        <Stat
          label="Est. narrative cost"
          value={`$${telemetry.costUsd.toFixed(4)}`}
          hint={`${telemetry.promptTokens + telemetry.completionTokens} tokens @ gpt-4o-mini list`}
        />
      </section>

      <ol className="space-y-3">
        {ROUND1_PIPELINE.map((s, i) => (
          <li key={s.id} className="grid gap-4 rounded-2xl border border-white/10 bg-ink-2 p-5 md:grid-cols-[80px_1fr]">
            <p className="serif text-3xl text-brass">{String(i + 1).padStart(2, "0")}</p>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="serif text-2xl">{s.title}</h2>
                <Badge className="border-white/12 text-paper/60">{s.kind}</Badge>
              </div>
              <p className="mt-2 text-sm text-paper/80">{s.why}</p>
              <p className="mt-1 text-sm text-paper/55">{s.does}</p>
            </div>
          </li>
        ))}
      </ol>

      <section>
        <h2 className="serif text-3xl">Round 2 minimums — live</h2>
        <p className="mt-1 text-sm text-paper/55">Each line is implemented in this prototype, not a slide claim.</p>
        <ol className="mt-4 space-y-2">
          {ROUND2_MINIMUMS.map((item) => (
            <li key={item.id} className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-ink-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-paper">{item.title}</p>
                <p className="text-xs text-paper/50">{item.proof}</p>
              </div>
              <Link href={item.where} className="text-xs uppercase tracking-[0.14em] text-brass">
                Open
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className="rounded-2xl border border-white/10 bg-ink-2 p-5">
        <h2 className="serif text-2xl">This run, stage by stage</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.14em] text-muted">
              <tr>
                <th className="py-2">Stage</th>
                <th>Kind</th>
                <th>ms</th>
                <th>Calls</th>
                <th>Tokens</th>
                <th>USD</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {telemetry.stages.map((s) => (
                <tr key={s.id} className="border-t border-white/8">
                  <td className="py-2 pr-3">{s.label}</td>
                  <td>
                    <Badge className="border-white/12">{methodKindLabel(s.kind)}</Badge>
                  </td>
                  <td className="tabular">{s.latencyMs}</td>
                  <td className="tabular">{s.modelCalls}</td>
                  <td className="tabular">{s.promptTokens + s.completionTokens}</td>
                  <td className="tabular">{s.costUsd ? s.costUsd.toFixed(5) : "—"}</td>
                  <td className="max-w-md text-paper/55">{s.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-2 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="serif mt-1 text-3xl">{value}</p>
      <p className="mt-1 text-xs text-paper/50">{hint}</p>
    </div>
  );
}
