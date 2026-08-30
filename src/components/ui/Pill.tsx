import type { ReactNode } from "react";
import clsx from "clsx";

interface PillProps {
  children: ReactNode;
  tone?: "neutral" | "green" | "red" | "amber" | "violet";
  className?: string;
}

const TONES: Record<string, string> = {
  neutral: "bg-[var(--surface-3)] text-[var(--text-muted)]",
  green: "bg-[var(--green)]/15 text-[var(--green)]",
  red: "bg-[var(--red)]/15 text-[var(--red)]",
  amber: "bg-[var(--amber)]/15 text-[var(--amber)]",
  violet: "bg-[var(--violet)]/15 text-[var(--violet)]",
};

export function Pill({ children, tone = "neutral", className }: PillProps) {
  return (
    <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}
