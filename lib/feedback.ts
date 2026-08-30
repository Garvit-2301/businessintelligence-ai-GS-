import type { FeedbackEvent, FeedbackState, PersonaId } from "./types";

const KEY = "lithub-feedback-v1";

export const emptyFeedback = (): FeedbackState => ({
  events: [],
  driverWeights: {},
  ownerOverrides: {},
});

export function applyEvent(state: FeedbackState, event: FeedbackEvent): FeedbackState {
  const next: FeedbackState = {
    events: [event, ...state.events].slice(0, 80),
    driverWeights: { ...state.driverWeights },
    ownerOverrides: { ...state.ownerOverrides },
  };

  if (event.kind === "reject-driver" && event.target) {
    const current = next.driverWeights[event.target] ?? 1;
    next.driverWeights[event.target] = Math.max(0.25, current * 0.7);
  }
  if (event.kind === "confirm" && event.target) {
    const current = next.driverWeights[event.target] ?? 1;
    next.driverWeights[event.target] = Math.min(1.35, current * 1.12);
  }
  if (event.kind === "wrong-owner" && event.target) {
    const cycle: PersonaId[] = ["cfo", "category", "growth"];
    const current = next.ownerOverrides[event.target];
    const idx = current ? cycle.indexOf(current) : 0;
    next.ownerOverrides[event.target] = cycle[(idx + 1) % cycle.length];
  }

  return next;
}

export function loadFeedback(): FeedbackState {
  if (typeof window === "undefined") return emptyFeedback();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyFeedback();
    return { ...emptyFeedback(), ...JSON.parse(raw) };
  } catch {
    return emptyFeedback();
  }
}

export function saveFeedback(state: FeedbackState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(state));
}

export function describeLearning(state: FeedbackState): string[] {
  const lines: string[] = [];
  for (const [id, w] of Object.entries(state.driverWeights)) {
    if (Math.abs(w - 1) > 0.04) {
      lines.push(`Driver ${id} reweighted to ${w.toFixed(2)}× from analyst feedback.`);
    }
  }
  for (const [id, owner] of Object.entries(state.ownerOverrides)) {
    lines.push(`Action ${id} owner overridden to ${owner}.`);
  }
  if (lines.length === 0) lines.push("No weights have been updated yet. Confirm or reject a driver to teach the ranker.");
  return lines;
}
