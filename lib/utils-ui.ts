import type { ConfidenceBand, InsightStatus, PipelineStage } from "./types";

export function bandClass(band: ConfidenceBand | InsightStatus): string {
  if (band === "high" || band === "actionable") return "bg-signal/15 text-signal border-signal/30";
  if (band === "medium" || band === "monitor") return "bg-amber/15 text-amber border-amber/30";
  if (band === "low" || band === "sparse") return "bg-brass/15 text-brass-2 border-brass/30";
  return "bg-alert/15 text-alert border-alert/30";
}

export function methodKindLabel(kind: PipelineStage["kind"]): string {
  if (kind === "llm") return "LLM";
  if (kind === "statistical") return "Stats";
  if (kind === "rules") return "Rules";
  return "Deterministic";
}
