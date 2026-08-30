import { motion } from "framer-motion";
import clsx from "clsx";

interface ProgressBarProps {
  pct: number; // 0..1+
  color?: string;
  height?: number;
  trackClassName?: string;
}

export function ProgressBar({ pct, color = "var(--teal)", height = 8, trackClassName }: ProgressBarProps) {
  const clamped = Math.min(pct, 1);
  const over = pct > 1;
  return (
    <div
      className={clsx("relative w-full rounded-full overflow-hidden", trackClassName)}
      style={{ height, background: "var(--surface-3)" }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{ background: over ? "var(--red)" : color }}
        initial={{ width: 0 }}
        whileInView={{ width: `${clamped * 100}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as const }}
      />
      {over && (
        <motion.div
          className="absolute inset-y-0 right-0 w-1.5 bg-[var(--red)] animate-pulse-ring rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </div>
  );
}
