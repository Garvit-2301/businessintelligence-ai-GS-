import { ACTION_CATALOG } from "../semantics";
import type { Driver, FeedbackState, RecommendedAction } from "../types";

export function recommendActions(
  drivers: Driver[],
  feedback: FeedbackState,
  opts?: { includeMarketing?: boolean; sparseLaunch?: boolean },
): RecommendedAction[] {
  const kinds = new Set(drivers.map((d) => d.kind));
  const out: RecommendedAction[] = [];

  for (const item of ACTION_CATALOG) {
    if (!item.driverKinds.some((k) => kinds.has(k as Driver["kind"]))) continue;
    if (item.id === "hold-cac-reallocation" && !opts?.includeMarketing) continue;
    if (item.id === "protect-aurora-media" && !opts?.sparseLaunch) continue;

    const top = drivers.find((d) => item.driverKinds.includes(d.kind));
    const ownerPersona = feedback.ownerOverrides[item.id] ?? item.ownerPersona;
    out.push({
      id: item.id,
      driverId: top?.id ?? item.driverKinds[0],
      lever: item.lever,
      action: item.action,
      expectedImpact: item.expectedImpact,
      owner: item.owner,
      ownerPersona,
      confidence: top ? Math.round(top.support * 100) / 100 : 0.5,
      monitoring: item.monitoring,
      constraints: item.constraints,
      decisionRights: item.decisionRights,
    });
  }

  return out;
}
