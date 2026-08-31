import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";
import type { HealthScoreBreakdown } from "../../lib/calculations";
import { Card, CardHeader } from "../ui/Card";
import { InfoTip } from "../ui/InfoTip";
import { LivePill } from "../ui/LivePill";
import { formatPercent } from "../../lib/format";

const MIN = 300;
const MAX = 850;

const BAND_COLOR: Record<HealthScoreBreakdown["band"], string> = {
  "Needs attention": "var(--red)",
  Fair: "var(--amber)",
  Good: "var(--blue)",
  Great: "var(--teal)",
  Exceptional: "var(--violet)",
};

export function HealthScoreGauge({ breakdown, pinnedToToday = false }: { breakdown: HealthScoreBreakdown; pinnedToToday?: boolean }) {
  const [display, setDisplay] = useState(MIN);
  const mv = useMotionValue(MIN);

  useEffect(() => {
    const controls = animate(mv, breakdown.score, { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const });
    const unsub = mv.on("change", (v) => setDisplay(Math.round(v)));
    return () => {
      controls.stop();
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdown.score]);

  // half-circle arc geometry
  const r = 84;
  const circumference = Math.PI * r; // half circle length
  const dash = useTransform(mv, [MIN, MAX], [0, circumference]);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            Financial Wellness Score
            <InfoTip
              title="How your score is calculated"
              action={{ label: "Improve budget adherence →", to: "/app/budgets" }}
            >
              A 300–850 blend of four weighted habits: <strong>savings rate</strong> (30%), <strong>emergency fund</strong>{" "}
              (30%), <strong>budget adherence</strong> (25%), and <strong>debt load</strong> (15%). Move any bar below and
              the score moves with it — instantly, not once a month.
            </InfoTip>
            {pinnedToToday && <LivePill />}
          </span>
        }
        subtitle="Like a credit score, but for your budgeting habits"
      />
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 110" className="w-full max-w-[260px]">
          <path d="M 16 100 A 84 84 0 0 1 184 100" fill="none" stroke="var(--surface-3)" strokeWidth="14" strokeLinecap="round" />
          <motion.path
            d="M 16 100 A 84 84 0 0 1 184 100"
            fill="none"
            stroke={BAND_COLOR[breakdown.band]}
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circumference}
            style={{ strokeDashoffset: useTransform(dash, (d) => circumference - d) }}
          />
          <text x="100" y="88" textAnchor="middle" className="tabular" fontSize="34" fontWeight="700" fill="var(--text)" fontFamily="var(--font-display)">
            {display}
          </text>
        </svg>
        <div className="-mt-2 mb-1 px-3 py-1 rounded-full text-xs font-semibold" style={{ background: `color-mix(in srgb, ${BAND_COLOR[breakdown.band]} 18%, transparent)`, color: BAND_COLOR[breakdown.band] }}>
          {breakdown.band}
        </div>
        <p className="text-xs text-[var(--text-muted)] mb-4">300 - 850 scale</p>

        <div className="w-full space-y-2.5 mt-1">
          {breakdown.components.map((c) => (
            <div key={c.label} className="flex items-center gap-3 text-xs">
              <span className="w-28 text-[var(--text-muted)] shrink-0">
                {c.label} <span className="text-[var(--text-faint)]">· {Math.round(c.weight * 100)}%</span>
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-[var(--surface-3)] overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-[image:var(--aurora-gradient)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.round(c.score01 * 100)}%` }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
                />
              </div>
              <span className="w-9 text-right tabular text-[var(--text-faint)]">{formatPercent(c.score01)}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
