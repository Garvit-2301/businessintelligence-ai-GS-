"use client";

import { applyEvent, emptyFeedback, loadFeedback, saveFeedback } from "@/lib/feedback";
import { PERSONA_LIST, PERSONAS } from "@/lib/personas";
import { maskInsight } from "@/lib/security";
import type { FeedbackEvent, FeedbackState, Insight, PersonaId } from "@/lib/types";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { runPipeline } from "@/lib/engine/pipeline";

type Ctx = {
  persona: PersonaId;
  setPersona: (id: PersonaId) => void;
  feedback: FeedbackState;
  recordFeedback: (event: Omit<FeedbackEvent, "id" | "at" | "persona">) => void;
  resetFeedback: () => void;
  insights: Insight[];
  briefAsOf: string;
  telemetry: ReturnType<typeof runPipeline>["telemetry"];
  weekly: ReturnType<typeof runPipeline>["weekly"];
  sources: ReturnType<typeof runPipeline>["sources"];
  window: ReturnType<typeof runPipeline>["window"];
  graph: ReturnType<typeof runPipeline>["graph"];
};

const PersonaCtx = createContext<Ctx | null>(null);

export function PersonaProvider({ children }: { children: React.ReactNode }) {
  const [persona, setPersona] = useState<PersonaId>("cfo");
  const [feedback, setFeedback] = useState<FeedbackState>(emptyFeedback());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFeedback(loadFeedback());
    const saved = window.localStorage.getItem("lithub-persona");
    if (saved === "cfo" || saved === "category" || saved === "growth") setPersona(saved);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) window.localStorage.setItem("lithub-persona", persona);
  }, [persona, hydrated]);

  const brief = useMemo(() => runPipeline(feedback), [feedback]);

  const insights = useMemo(
    () => brief.insights.map((i) => maskInsight(i, persona)),
    [brief.insights, persona],
  );

  const recordFeedback: Ctx["recordFeedback"] = (event) => {
    const full: FeedbackEvent = {
      ...event,
      id: `fb-${Date.now()}`,
      at: new Date().toISOString(),
      persona,
    };
    const next = applyEvent(feedback, full);
    setFeedback(next);
    saveFeedback(next);
  };

  const resetFeedback = () => {
    const empty = emptyFeedback();
    setFeedback(empty);
    saveFeedback(empty);
  };

  return (
    <PersonaCtx.Provider
      value={{
        persona,
        setPersona,
        feedback,
        recordFeedback,
        resetFeedback,
        insights,
        briefAsOf: brief.asOf,
        telemetry: brief.telemetry,
        weekly: brief.weekly,
        sources: brief.sources,
        window: brief.window,
        graph: brief.graph,
      }}
    >
      {children}
    </PersonaCtx.Provider>
  );
}

export function useBrief() {
  const ctx = useContext(PersonaCtx);
  if (!ctx) throw new Error("useBrief must be used inside PersonaProvider");
  return ctx;
}

export function usePersonaMeta() {
  const { persona } = useBrief();
  return PERSONAS[persona];
}

export { PERSONA_LIST };
