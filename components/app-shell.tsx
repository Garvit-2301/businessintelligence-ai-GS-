"use client";

import { Badge } from "@/components/ui/badge";
import { PERSONA_LIST, useBrief } from "@/components/persona-provider";
import { cn, formatUsd } from "@/lib/utils";
import { PERSONAS } from "@/lib/personas";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Briefing" },
  { href: "/semantics", label: "Semantics" },
  { href: "/architecture", label: "Methods" },
  { href: "/telemetry", label: "Telemetry" },
  { href: "/feedback", label: "Learning" },
  { href: "/proposal", label: "Proposal" },
  { href: "/pitch", label: "Pitch" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const { persona, setPersona, briefAsOf, telemetry, window } = useBrief();
  const meta = PERSONAS[persona];
  const pitch = path.startsWith("/pitch");

  if (pitch) return <>{children}</>;

  return (
    <div className="min-h-screen bg-ink text-paper">
      <header className="sticky top-0 z-30 border-b border-white/8 bg-ink/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-6">
            <Link href="/" className="flex items-baseline gap-2">
              <span className="serif text-2xl tracking-tight">Lithub</span>
              <span className="hidden text-[10px] uppercase tracking-[0.22em] text-brass sm:inline">
                Intelligence to action
              </span>
            </Link>
            <nav className="flex flex-wrap gap-1 text-xs uppercase tracking-[0.14em] text-paper/70">
              {NAV.map((item) => {
                const active = item.href === "/" ? path === "/" : path.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "rounded-full px-2.5 py-1 hover:text-paper",
                      active && "bg-white/8 text-brass-2",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-[10px] uppercase tracking-[0.16em] text-muted lg:inline">
              Reading as
            </span>
            {PERSONA_LIST.map((p) => (
              <button
                key={p.id}
                onClick={() => setPersona(p.id)}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs transition",
                  persona === p.id
                    ? "border-brass bg-brass text-ink"
                    : "border-white/12 text-paper/80 hover:bg-white/6",
                )}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>
        <div className="border-t border-white/6 bg-ink-2/80">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[11px] text-paper/65 sm:px-6">
            <p>
              {meta.name} · {meta.role} · Northline close {window.currentWeek} vs {window.priorWeek} · as of{" "}
              {new Date(briefAsOf).toLocaleString("en-GB", { timeZone: "UTC" })} UTC
            </p>
            <p className="tabular">
              Engine {telemetry.totalLatencyMs}ms · {telemetry.modelCalls} model calls ·{" "}
              {formatUsd(telemetry.costUsd, 4)} est.
            </p>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-white/8 px-4 py-6 text-center text-[11px] uppercase tracking-[0.16em] text-muted">
        Lithub · Team Lithub · Accenture Innovation Challenge 2026 · IIT Patna
      </footer>
    </div>
  );
}

export function EntitlementNote() {
  const { persona } = useBrief();
  const meta = PERSONAS[persona];
  if (meta.deniedFields.length === 0) {
    return (
      <Badge className="border-signal/30 bg-signal/10 text-signal">Full financial entitlement</Badge>
    );
  }
  return (
    <Badge className="border-amber/30 bg-amber/10 text-amber">
      Masked: {meta.deniedFields.join(" · ")}
    </Badge>
  );
}
