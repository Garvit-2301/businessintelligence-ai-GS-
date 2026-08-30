"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const SLIDES: { kicker: string; title: string; body: React.ReactNode }[] = [
  {
    kicker: "Accenture Innovation Challenge 2026 · Round 2",
    title: "Lithub",
    body: (
      <div className="space-y-4">
        <p className="serif text-3xl text-brass-2 sm:text-4xl">From KPI movement to owned action.</p>
        <p className="max-w-2xl text-lg text-paper/70">
          Team Lithub · IIT Patna · Garvit Sahni, Pranav Gupta, Jatin Aggarwal
        </p>
        <p className="text-sm uppercase tracking-[0.18em] text-muted">Arrow keys or tap the edges</p>
      </div>
    ),
  },
  {
    kicker: "The problem",
    title: "They already have dashboards.",
    body: (
      <ul className="max-w-2xl space-y-3 text-lg text-paper/75">
        <li>Sources disagree on grain, freshness, and what a customer is.</li>
        <li>The loudest chart wins the meeting, not the material one.</li>
        <li>A launch with 18 days of history gets treated like a run-rate.</li>
        <li>Growth and Finance brief two different CACs and both sound sure.</li>
      </ul>
    ),
  },
  {
    kicker: "Thesis",
    title: "Reasoning is a pipeline, not a prompt.",
    body: (
      <p className="max-w-2xl text-xl leading-8 text-paper/80">
        The Round 1 loop is unchanged: Holt forecast, KAHAN hierarchy, causal DiD, knowledge-graph
        walks, then a persona story. Round 2 wraps that loop in grain, entitlements, abstention, and
        a cost meter. Never let the model be the source of a dollar.
      </p>
    ),
  },
  {
    kicker: "Round 1 architecture — unchanged",
    title: "Five jobs. Same order.",
    body: (
      <ol className="max-w-2xl space-y-2 text-lg text-paper/80">
        <li>1. Forecasting — Holt residual vs an 80% interval.</li>
        <li>2. KAHAN — region → category → SKU, knowledge-boosted.</li>
        <li>3. Causal attribution — West vs Central+East DiD.</li>
        <li>4. Knowledge graph — event → SKU → lever → owner.</li>
        <li>5. AI storytelling — persona voice over frozen evidence.</li>
      </ol>
    ),
  },
  {
    kicker: "Northline · W34",
    title: "Four movements. Four tests.",
    body: (
      <ul className="max-w-3xl space-y-3 text-lg">
        <li>
          <span className="text-brass">Multi-factor revenue</span> — price tailwind, volume and mix
          headwinds, West hoodie, Summit Days, Reno cover.
        </li>
        <li>
          <span className="text-alert">CAC abstention</span> — spend up, first-party customers down,
          platform conversions up. We will not pick a winner.
        </li>
        <li>
          <span className="text-brass-2">Aurora sparse</span> — GMV up, 18 days, confidence capped,
          launch media protected.
        </li>
        <li>
          <span className="text-signal">Fill + entitlement</span> — official WMS stale; Growth never
          sees expedite cost.
        </li>
      </ul>
    ),
  },
  {
    kicker: "Hybrid methods",
    title: "Who is allowed to do which job",
    body: (
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2 text-base">
        <div className="rounded-2xl border border-white/12 p-4">
          <p className="text-brass">Not the LLM</p>
          <p className="mt-2 text-paper/75">
            Holt forecast, KAHAN tree, DiD, knowledge graph, PVM, materiality, abstention, action
            catalog, RBAC, cost telemetry.
          </p>
        </div>
        <div className="rounded-2xl border border-white/12 p-4">
          <p className="text-brass">The LLM</p>
          <p className="mt-2 text-paper/75">
            Persona voice. Structure. Grounded questions over a frozen evidence pack. Refusal when
            the field is denied.
          </p>
        </div>
      </div>
    ),
  },
  {
    kicker: "Personas",
    title: "Same close. Three decision rights.",
    body: (
      <ul className="max-w-2xl space-y-3 text-lg text-paper/80">
        <li>Priya Shah, CFO — dollars, cash gates, what we will not brief the board.</li>
        <li>Marcus Chen, Category — SKU, region, promo depth, inbound.</li>
        <li>Aisha Rahman, Growth — do not reallocate on a contested CAC; stop buying unfilled demand.</li>
      </ul>
    ),
  },
  {
    kicker: "Economics",
    title: "The brief is cheap. The bad meeting is not.",
    body: (
      <p className="max-w-2xl text-xl leading-8 text-paper/80">
        This close: tens of milliseconds of engine, twelve small-model calls, well under a cent of
        tokens. A wrong weekly media shift is five figures. We cache evidence, write voice last, and
        treat abstention as a cost control.
      </p>
    ),
  },
  {
    kicker: "Roadmap",
    title: "Pilot the close. Then earn production.",
    body: (
      <ol className="max-w-2xl space-y-2 text-lg text-paper/80">
        <li>1. Five KPIs, three sources, three seats — what you can click today.</li>
        <li>2. Warehouse jobs, identity, labeled-week evaluation.</li>
        <li>3. Causal tests and hierarchical forecasts as priors.</li>
        <li>4. Actions that open tickets and close themselves.</li>
      </ol>
    ),
  },
  {
    kicker: "Ask",
    title: "Judge the mechanism, not the wallpaper.",
    body: (
      <div className="space-y-4">
        <p className="max-w-2xl text-xl text-paper/80">
          Open the briefing. Switch seats. Watch the engine refuse a bad CAC story. That is Lithub.
        </p>
        <Link href="/" className="inline-flex rounded-full bg-brass px-5 py-2 text-ink">
          Enter the prototype
        </Link>
      </div>
    ),
  },
];

export default function PitchPage() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") setI((n) => Math.min(SLIDES.length - 1, n + 1));
      if (e.key === "ArrowLeft") setI((n) => Math.max(0, n - 1));
      if (e.key === "Escape") window.location.href = "/";
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const slide = SLIDES[i];

  return (
    <div className="relative min-h-screen bg-ink text-paper">
      <button
        aria-label="Previous"
        className="absolute inset-y-0 left-0 z-10 w-1/5 cursor-w-resize"
        onClick={() => setI((n) => Math.max(0, n - 1))}
      />
      <button
        aria-label="Next"
        className="absolute inset-y-0 right-0 z-10 w-1/5 cursor-e-resize"
        onClick={() => setI((n) => Math.min(SLIDES.length - 1, n + 1))}
      />
      <div className="relative z-0 mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-8 py-16 sm:px-12">
        <div className="mb-8 flex items-center justify-between text-[11px] uppercase tracking-[0.2em] text-brass">
          <Link href="/" className="hover:text-brass-2">
            Lithub
          </Link>
          <span>
            {String(i + 1).padStart(2, "0")} / {String(SLIDES.length).padStart(2, "0")}
          </span>
        </div>
        <p className="text-sm uppercase tracking-[0.2em] text-muted">{slide.kicker}</p>
        <h1 className="serif mt-4 text-4xl leading-[1.05] sm:text-6xl">{slide.title}</h1>
        <div className="mt-8">{slide.body}</div>
        <div className="mt-16 flex gap-1.5">
          {SLIDES.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setI(idx)}
              className={`h-1.5 rounded-full ${idx === i ? "w-8 bg-brass" : "w-3 bg-white/20"}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
