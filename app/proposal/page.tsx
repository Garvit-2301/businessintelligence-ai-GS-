import Link from "next/link";

export default function ProposalPage() {
  return (
    <article className="mx-auto max-w-3xl space-y-10">
      <header className="paper rounded-3xl p-8 sm:p-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-[#7a5340]">
          Accenture Innovation Challenge 2026 · Round 2
        </p>
        <h1 className="serif mt-3 text-4xl leading-tight text-ink sm:text-5xl">
          Lithub business proposal
        </h1>
        <p className="mt-3 text-sm text-ink/70">
          Team Lithub · IIT Patna · Garvit Sahni, Pranav Gupta, Jatin Aggarwal
        </p>
        <p className="mt-6 text-lg leading-8 text-ink/85">
          Northline, and every operator like it, already has dashboards. What they lack is a governed
          path from a material KPI movement to an owned action — with the honesty to abstain when the
          sources disagree.
        </p>
        <p className="mt-4 text-sm">
          <Link href="/pitch" className="underline">
            Open the pitch deck
          </Link>{" "}
          ·{" "}
          <Link href="/" className="underline">
            Open the working prototype
          </Link>
        </p>
      </header>

      <Section k="01" t="Problem framing">
        <p>
          KPI movement is explained in Slack threads, weekend spreadsheets, and vendor-specific
          attribution screens that do not share a calendar. Finance, category, and growth each see a
          different grain, a different refresh, and a different definition of “customer.” The costly
          failure mode is not a missing chart. It is a confident story built on the wrong close.
        </p>
        <p>
          Round 1 named the gap: businesses need business reasoning. Round 2 adds the constraints
          that make reasoning real — mismatched cadences, sparse launches, contradictory evidence,
          decision rights, and the bill for every model call.
        </p>
      </Section>

      <Section k="02" t="Solution design">
        <p>
          Lithub is the Round 1 pipeline running as a weekly close. Holt forecasting detects a miss
          against the expected path. KAHAN attributes it down region → category → SKU and boosts
          graph-linked nodes. Difference-in-differences isolates West hoodie from a control that
          shared the national price test. The knowledge graph walks event → lever → owner.
          Round 2 adds grain reconciliation, entitlements, abstention, and telemetry around that
          loop. A language layer writes persona briefs over a frozen evidence pack. It cannot invent
          a quantity.
        </p>
        <p>
          The prototype runs entirely in this repository: a TypeScript engine on illustrative Northline
          data, a briefing UI, a semantic contract, role-based masking, a feedback loop, and runtime
          telemetry. No warehouse login is required to judge the mechanism.
        </p>
      </Section>

      <Section k="03" t="Target users">
        <ul>
          <li>
            <strong>CFO / FP&A</strong> — materiality, cash gates, board language, what we will not claim.
          </li>
          <li>
            <strong>Category leads</strong> — SKU-region levers, promo depth, replenishment, launch quality.
          </li>
          <li>
            <strong>Growth</strong> — paid allocation only after definitions agree; suppress ads we cannot fill.
          </li>
        </ul>
        <p>
          Secondary users: data platform owners who maintain the contract, and auditors who need
          lineage on every sentence.
        </p>
      </Section>

      <Section k="04" t="Business case and impact">
        <p>
          A single wrong weekly reallocation on contested CAC at Northline’s scale is $80–120k of
          media. A hero-SKU stockout that paid continues to advertise is cancelled orders plus wasted
          CAC. A launch judged on 18 days is a strategy error. Lithub’s job is to make those three
          mistakes more expensive to commit than to catch.
        </p>
        <p>
          Narrative tokens on this brief cost well under a cent. The return is hours of analyst time
          and one avoided bad meeting. We do not claim enterprise-wide EBITDA in a prototype. We
          claim a repeatable close: detect, explain, act or abstain, learn.
        </p>
      </Section>

      <Section k="05" t="Phased roadmap">
        <ol>
          <li>
            <strong>Pilot close</strong> — 5 KPIs, 3 sources, 2–3 personas, one category. What this
            prototype already demonstrates.
          </li>
          <li>
            <strong>Governed production</strong> — warehouse-native jobs (Databricks / Fabric / Snowflake),
            contract in git, row-level security from the identity provider, evaluation set of labeled weeks.
          </li>
          <li>
            <strong>Causal and forecast layer</strong> — difference-in-differences on regional tests,
            hierarchical forecasts as the prior, not as the storyteller.
          </li>
          <li>
            <strong>Action fabric</strong> — tickets in the systems owners already use; monitoring plans
            that close themselves when the KPI mean-reverts.
          </li>
        </ol>
      </Section>

      <Section k="06" t="Risks and mitigations">
        <ul>
          <li>
            <strong>Hallucinated numbers</strong> — numbers never originate in the LLM. Evidence JSON is
            the only quantitative input. Grounded Q&A refuses out-of-pack and out-of-entitlement asks.
          </li>
          <li>
            <strong>Definition drift</strong> — official vs proxy fill is a first-class object. CAC
            contradiction triggers abstention, not a blended compromise.
          </li>
          <li>
            <strong>Sparse history</strong> — confidence is capped; launches are not annualized.
          </li>
          <li>
            <strong>Security</strong> — column denial happens before narrative and before Q&A.
          </li>
          <li>
            <strong>Cost and latency</strong> — small model, cached evidence, no frontier arithmetic.
          </li>
          <li>
            <strong>Feedback poisoning</strong> — weights are visible, resettable, and in production would
            sit behind change control.
          </li>
        </ul>
      </Section>

      <Section k="07" t="What we built versus what is native">
        <p>
          This prototype is custom-built on Next.js. The methods (PVM, hierarchical contribution,
          materiality, abstention, action catalog, RBAC, telemetry) are application code, not a BI
          vendor feature. In an enterprise landing we would <em>configure</em> warehouse jobs and
          semantic models, <em>integrate</em> identity and ticket systems, and keep the reasoning
          plane custom — because no dashboard product currently owns abstention plus decision rights.
        </p>
      </Section>
    </article>
  );
}

function Section({ k, t, children }: { k: string; t: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 text-sm leading-7 text-paper/75">
      <p className="text-[11px] uppercase tracking-[0.2em] text-brass">
        {k} · {t}
      </p>
      <div className="space-y-3 [&_li]:ml-4 [&_li]:list-disc [&_ol]:space-y-2 [&_ol_li]:list-decimal [&_strong]:text-paper">
        {children}
      </div>
    </section>
  );
}
