import type { ReactNode } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { InfoTip } from "../ui/InfoTip";

interface Props {
  label: string;
  value: string;
  trend?: { value: string; positive: boolean } | null;
  icon: ReactNode;
  accent: string;
  delay?: number;
  tip?: { title: string; body: ReactNode; action?: { label: string; to?: string; onClick?: () => void } };
}

export function StatTile({ label, value, trend, icon, accent, delay = 0, tip }: Props) {
  return (
    <motion.div
      className="card p-5 flex flex-col gap-3"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
          {label}
          {tip && (
            <InfoTip title={tip.title} action={tip.action}>
              {tip.body}
            </InfoTip>
          )}
        </span>
        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `color-mix(in srgb, ${accent} 16%, transparent)`, color: accent }}>
          {icon}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <span className="font-display font-bold text-2xl tabular">{value}</span>
        {trend && (
          <span className={clsx("text-xs font-semibold tabular mb-1", trend.positive ? "text-[var(--green)]" : "text-[var(--red)]")}>
            {trend.positive ? "▲" : "▼"} {trend.value}
          </span>
        )}
      </div>
    </motion.div>
  );
}
