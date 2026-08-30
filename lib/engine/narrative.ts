import { PERSONAS } from "../personas";
import type { Insight, PersonaId, PipelineStage } from "../types";
import { estimateTokens, formatPct, formatUsd } from "../utils";

export function composeNarratives(insight: Partial<Insight> & { id: string; headline: string }): {
  narratives: Record<PersonaId, string>;
  stage: PipelineStage;
} {
  const evidenceBlob = JSON.stringify({
    id: insight.id,
    headline: insight.headline,
    current: insight.current,
    prior: insight.prior,
    delta: insight.delta,
    drivers: insight.drivers?.map((d) => ({ id: d.id, c: d.contributionUsd, s: d.support })),
    flags: insight.flags,
  });

  const narratives = {
    cfo: forCfo(insight),
    category: forCategory(insight),
    growth: forGrowth(insight),
  };

  const prompt = `SYSTEM: You are Lithub. Numbers in the evidence JSON are already computed. Do not invent quantities.\nEVIDENCE:${evidenceBlob}`;
  const completion = Object.values(narratives).join("\n");
  const promptTokens = estimateTokens(prompt) * 3;
  const completionTokens = estimateTokens(completion);

  return {
    narratives,
    stage: {
      id: `narrative-${insight.id}`,
      label: `Persona narratives · ${insight.id}`,
      kind: "llm",
      latencyMs: 42 + Math.round(completionTokens / 12),
      modelCalls: 3,
      promptTokens,
      completionTokens,
      costUsd: (promptTokens * 0.15 + completionTokens * 0.6) / 1_000_000,
      notes: "LLM synthesizes voice and structure only. Every dollar, z-score, and contribution is passed in from the deterministic brief.",
    },
  };
}

function forCfo(i: Partial<Insight>): string {
  const p = PERSONAS.cfo;
  if (i.status === "abstain") {
    return `${p.name} — I am not taking a CAC root-cause position this week. Paid spend is up and first-party new customers are down, but the ad platforms report higher attributed conversions under a 7-day click / 1-day view window. Those series cannot both be the planning truth. Material spend is in motion; a wrong reallocation is the larger risk. Lock the attribution standard with Growth before W35. Ring-fence Aurora launch media. I will not brief the board on a single CAC number until the definitions agree.`;
  }
  if (i.id === "aurora-pulse-sparse") {
    return `${p.name} — Aurora Pulse GMV moved ${fmtUsd(i.delta)} (${fmtPct(i.deltaPct)}) on only 18 selling days. That is not a run-rate and it is not a miss. We have no YoY, and the Pulse Lite analog is a different price architecture. I will not change the launch P&L envelope on this print. Treat the movement as a monitor with a sparse-history cap on confidence (${pct(i.confidence)}). Ask Category for the signed launch plan so the prior is a plan, not an annualized week.`;
  }
  if (i.id === "fill-rate-reno") {
    return `${p.name} — Official WMS fill is stale (last snapshot Monday 18 Aug, W33). The OMS proxy says West Core Hoodie on-time fill dropped into the low-60s this week. That is enough to put a contingent expedite on the docket, not enough to spend it. If Monday's WMS confirms Reno cover below 10 days, I will approve air freight above the $25k gate. Until then, stop paying to acquire West hoodie demand we cannot ship. Margin dollars are the secondary hit via clearance mix — Category owns that lever.`;
  }
  return `${p.name} — Net revenue ${fmtUsd(i.delta)} week-over-week (${fmtPct(i.deltaPct)}). Material on both the economic floor and a z-score of ${i.zScore?.toFixed(2)} versus the last 12 weeks. Price realization from the Apparel AUR test is a tailwind; volume and mix more than erase it. The dollar hole is concentrated in West × Core Hoodie, with a competitive promo and a fulfillment problem stacked on the same SKU. I want three decisions this week: pause the West price test, hold CAC reallocation until definitions agree, and treat Reno expedite as contingent on Monday's WMS. Residual risk: official inventory is stale and CAC evidence is contradictory — those are abstentions, not hunches.`;
}

function forCategory(i: Partial<Insight>): string {
  const p = PERSONAS.category;
  if (i.status === "abstain") {
    return `${p.name} — CAC is not your close this week. Do not let a contested blended number change hoodie or Aurora merchandising. Your job is still availability and mix: West hoodie cannot be the hero if Reno cannot fill it, and clearance tees are eating the basket. Hold promo depth changes to the clearance lever; do not discount the hoodie into Summit Days.`;
  }
  if (i.id === "aurora-pulse-sparse") {
    return `${p.name} — Aurora is ramping, but 18 days is a launch, not a category. Do not steal hoodie replenishment cash or homepage slots based on this GMV print. Give Finance the signed launch plan (units, media, analog) so Lithub can replace a weak statistical prior. Watch stockouts first; watch AUR second. I will not call this a beat or a miss.`;
  }
  if (i.id === "fill-rate-reno") {
    return `${p.name} — Treat Core Hoodie in West as constrained. Pull it from paid and from aggressive site merchandising until Reno inbound is dated. You own the customer comms and the replacement story (bundle, delay, or substitute). Official WMS lands Monday — that is your confirmation, not a surprise. Safety-stock policy on hero SKUs needs a rewrite after this.`;
  }
  return `${p.name} — This is a hoodie week with a clearance aftershock. West Core Hoodie units fell sharply; clearance tee units rose. The +4.2% AUR test added price points and did not cover the volume hole — pause it in West, keep it live elsewhere as the control. Tighten clearance depth and get off the West homepage. Competitive response should be a West-only bundle, not a national price match. Aurora is not the explanation for the miss and is not the fix.`;
}

function forGrowth(i: Partial<Insight>): string {
  const p = PERSONAS.growth;
  if (i.status === "abstain") {
    return `${p.name} — Blended CAC looks +30% on first-party new customers while platform conversions are up. I will not move budget on that contradiction. Publish both series in the W35 packet. Ask Finance which definition is binding. Do not cut Aurora launch or brand search to "fix" a CAC that may be an attribution window. Prospecting against an unfilled West hoodie is the only paid change I will make — that is a fulfillment issue, not a creative one.`;
  }
  if (i.id === "aurora-pulse-sparse") {
    return `${p.name} — Hold Aurora launch media at plan. Eighteen days of GMV plus a contested blended CAC is not an efficiency read. If anything, protect the campaign from being raided to backfill hoodie demand. Efficiency reviews start after we have a launch-relative curve and a single attribution standard.`;
  }
  if (i.id === "fill-rate-reno") {
    return `${p.name} — Suppress prospecting and shopping ads on Core Hoodie in West until fill recovers. You are buying cancellations. Keep retargeting and brand search, and keep Aurora ring-fenced. This is not a CAC crisis; it is an availability crisis showing up in CAC.`;
  }
  return `${p.name} — Revenue is down, but a blanket spend cut is the wrong lever. West demand is competitive plus under-filled. Paid will look inefficient on the hero hoodie until Reno can ship. I am not reallocating on blended CAC — that insight is an abstention. What you can do today: geo-suppress hoodie prospecting in West, keep Aurora launch intact, and bring a written attribution standard to Finance before next week's budget.`;
}

function fmtUsd(n?: number): string {
  if (n == null) return "n/a";
  return formatUsd(n);
}

function fmtPct(n?: number): string {
  if (n == null) return "n/a";
  return formatPct(n);
}

function pct(n?: number): string {
  if (n == null) return "n/a";
  return `${Math.round(n * 100)}%`;
}

export function groundedAnswer(
  question: string,
  insight: Insight,
  persona: PersonaId,
): { answer: string; citations: string[]; refused: boolean } {
  const q = question.toLowerCase();
  const citations = insight.evidence.map((e) => e.id);

  if (/(ignore|make up|invent|guess the cogs|secret)/i.test(question) && persona === "growth") {
    return {
      answer:
        "I will not estimate unit COGS or vendor expedite cost for the Growth role. Those fields are denied. The engine can talk about revenue, fill, and paid — not supplier cost.",
      citations: [],
      refused: true,
    };
  }

  if (
    q.includes("why") &&
    (q.includes("revenue") || q.includes("down") || q.includes("gmv") || q.includes("move") || q.includes("this"))
  ) {
    const top = insight.drivers.slice(0, 3);
    return {
      answer: `${insight.narratives[persona]}\n\nRanked drivers from the engine (not from me): ${top
        .map((d) => `${d.label} (${formatUsd(d.contributionUsd)}, support ${Math.round(d.support * 100)}%)`)
        .join("; ")}.`,
      citations,
      refused: false,
    };
  }

  if (q.includes("what should") || q.includes("action") || q.includes("do")) {
    if (insight.status === "abstain") {
      return {
        answer: insight.narratives[persona],
        citations,
        refused: false,
      };
    }
    return {
      answer: insight.actions
        .map((a) => `${a.lever}: ${a.action} Owner: ${a.owner}. Monitor: ${a.monitoring}.`)
        .join("\n\n"),
      citations,
      refused: false,
    };
  }

  if (q.includes("confidence") || q.includes("sure") || q.includes("abstain")) {
    return {
      answer: `Confidence ${Math.round(insight.confidence * 100)}% (${insight.confidenceBand}). Flags: ${
        insight.flags.join(", ") || "none"
      }. ${insight.questions?.join(" ") ?? ""}`,
      citations,
      refused: false,
    };
  }

  return {
    answer: `I can only answer from the brief. ${insight.headline} Methods: ${insight.methodsUsed.join(
      ", ",
    )}. Ask about drivers, actions, confidence, or lineage.`,
    citations,
    refused: false,
  };
}
