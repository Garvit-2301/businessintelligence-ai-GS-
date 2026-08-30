import { runPipeline } from "@/lib/engine/pipeline";
import { emptyFeedback } from "@/lib/feedback";
import { maskInsight } from "@/lib/security";
import type { PersonaId } from "@/lib/types";
import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);
  const persona = (url.searchParams.get("persona") ?? "cfo") as PersonaId;
  const brief = runPipeline(emptyFeedback());
  return NextResponse.json({
    ...brief,
    insights: brief.insights.map((i) => maskInsight(i, persona)),
    persona,
  });
}
