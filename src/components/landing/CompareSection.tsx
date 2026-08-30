import { motion } from "framer-motion";

const ROWS = [
  { feature: "Track transactions & envelopes", typical: true, aurora: true },
  { feature: "Forward-looking forecast, not just history", typical: false, aurora: true },
  { feature: "Composite financial wellness score", typical: false, aurora: true },
  { feature: "Automatic recurring-charge detection", typical: "partial", aurora: true },
  { feature: "Interactive multi-decade net worth simulator", typical: false, aurora: true },
  { feature: "Shareable spending fingerprint", typical: false, aurora: true },
  { feature: "Habit-based streaks & badges", typical: "partial", aurora: true },
];

function Mark({ value }: { value: boolean | "partial" }) {
  if (value === true) return <span className="text-[var(--green)] text-lg">✓</span>;
  if (value === "partial") return <span className="text-[var(--amber)] text-lg">~</span>;
  return <span className="text-[var(--text-faint)] text-lg">–</span>;
}

export function CompareSection() {
  return (
    <section id="compare" className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--pink)] mb-3">Why Aurora</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          The gap in most budgeting apps: <span className="aurora-text">they only look backward.</span>
        </h2>
        <p className="text-[var(--text-muted)] mt-4">Here's what's typically missing — and what Aurora ships with, by default.</p>
      </div>

      <motion.div
        className="card !p-0 overflow-hidden max-w-3xl"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="grid grid-cols-[1fr_auto_auto] text-sm">
          <div className="px-5 py-4 font-medium text-[var(--text-muted)] border-b border-[var(--border)]">Capability</div>
          <div className="px-5 py-4 font-medium text-[var(--text-muted)] border-b border-[var(--border)] text-center w-32">Typical apps</div>
          <div className="px-5 py-4 font-semibold border-b border-[var(--border)] text-center w-32 bg-[image:var(--aurora-gradient-soft)]">Aurora</div>

          {ROWS.map((row) => (
            <motion.div key={row.feature} className="contents" initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="px-5 py-3.5 border-b border-[var(--border)] last:border-0">{row.feature}</div>
              <div className="px-5 py-3.5 border-b border-[var(--border)] last:border-0 text-center">
                <Mark value={row.typical as boolean | "partial"} />
              </div>
              <div className="px-5 py-3.5 border-b border-[var(--border)] last:border-0 text-center bg-[image:var(--aurora-gradient-soft)]">
                <Mark value={row.aurora as boolean | "partial"} />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
