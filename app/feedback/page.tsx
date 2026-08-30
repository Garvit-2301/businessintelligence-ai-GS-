"use client";

import { Button } from "@/components/ui/button";
import { useBrief } from "@/components/persona-provider";
import { describeLearning } from "@/lib/feedback";

export default function FeedbackPage() {
  const { feedback, resetFeedback, insights } = useBrief();
  const learned = describeLearning(feedback);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-[11px] uppercase tracking-[0.2em] text-brass">Human learning loop</p>
        <h1 className="serif mt-2 text-4xl sm:text-5xl">Analyst corrections change next week&apos;s ranking</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-paper/65">
          Confirm a driver and its weight rises. Reject it and contribution is downweighted. Mark an
          action as the wrong owner and routing cycles to the next decision-right seat. Nothing here
          retrains a foundation model — it updates a governed scorecard.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-ink-2 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="serif text-2xl">Active weights</h2>
          <Button variant="ghost" size="sm" onClick={resetFeedback}>
            Reset learning
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm text-paper/75">
          {learned.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="serif text-2xl">Event log</h2>
        {feedback.events.length === 0 ? (
          <p className="mt-3 text-sm text-paper/55">
            No corrections yet. Open any insight and confirm or reject a driver, or cycle an action owner.
          </p>
        ) : (
          <ol className="mt-4 space-y-2">
            {feedback.events.map((e) => (
              <li key={e.id} className="rounded-xl border border-white/10 bg-ink-2 px-4 py-3 text-sm">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">
                  {e.kind} · {e.persona} · {new Date(e.at).toLocaleString()}
                </p>
                <p className="mt-1">
                  {e.insightId}
                  {e.target ? ` · ${e.target}` : ""} — {e.note}
                </p>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="rounded-2xl border border-white/10 bg-ink-2 p-5 text-sm leading-6 text-paper/70">
        <h2 className="serif text-2xl text-paper">What this is not</h2>
        <p className="mt-2">
          It is not RLHF on the narrative model. It is not an unsupervised drift job pretending to be
          judgement. Production would add expert validation queues, promotion of weights behind a
          change-management ticket, and offline evaluation against labeled weeks. This prototype
          shows the loop on the four live insights: {insights.map((i) => i.title).join(", ")}.
        </p>
      </section>
    </div>
  );
}
