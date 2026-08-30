"use client";

import { useBrief } from "@/components/persona-provider";

export default function TelemetryPage() {
  const { telemetry, briefAsOf } = useBrief();
  const weeklyCost = telemetry.costUsd * 4 * 5 * 3;
  const annual = weeklyCost * 52;

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brass">Runtime economics</p>
        <h1 className="serif mt-2 text-4xl sm:text-5xl">Latency, calls, tokens, cost per brief</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/65">
          This briefing ran in {telemetry.totalLatencyMs} ms at {new Date(briefAsOf).toLocaleString("en-GB", { timeZone: "UTC" })} UTC.
          Narrative cost is estimated at OpenAI gpt-4o-mini list ($0.15 / $0.60 per 1M tokens). Deterministic stages are $0 model spend.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Tile k="Total latency" v={`${telemetry.totalLatencyMs} ms`} d="Ingest through narratives" />
        <Tile k="Model calls" v={String(telemetry.modelCalls)} d="3 personas × 4 insights" />
        <Tile
          k="Tokens"
          v={`${(telemetry.promptTokens + telemetry.completionTokens).toLocaleString()}`}
          d={`${telemetry.promptTokens} in / ${telemetry.completionTokens} out`}
        />
        <Tile k="Est. cost" v={`$${telemetry.costUsd.toFixed(4)}`} d="Per full multi-persona close" />
      </section>

      <section className="rounded-2xl border border-white/10 bg-ink-2 p-6">
        <h2 className="serif text-2xl">Scale sketch</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-paper/65">
          A mid-market retailer running 4 material insights, 3 personas, 5 days a week: about $
          {weeklyCost.toFixed(2)} / week in narrative tokens, ~${annual.toFixed(0)} / year — before
          caching. The expensive part is not the prose. It is the warehouse jobs, the semantic
          contract, and the people who own the levers.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-paper/75">
          <li>Cache the evidence pack. Rewrite voice only when the persona or language changes.</li>
          <li>Use a small model for narrative. Never a frontier model for arithmetic.</li>
          <li>Abstention is a cost control: we do not spend tokens arguing a definition war.</li>
          <li>Row/column security happens before the prompt is built, so denied fields never enter context.</li>
        </ul>
      </section>
    </div>
  );
}

function Tile({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-ink-2 p-4">
      <p className="text-[10px] uppercase tracking-[0.16em] text-muted">{k}</p>
      <p className="serif mt-1 text-3xl tabular">{v}</p>
      <p className="mt-1 text-xs text-paper/50">{d}</p>
    </div>
  );
}
