import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: "⛅",
    title: "Money Weather",
    description: "A living daily forecast — sunny, stormy, or a rainbow after a goal — built from your real cash flow, not a gimmick.",
    accent: "var(--blue)",
  },
  {
    icon: "★",
    title: "Financial Wellness Score",
    description: "A 300–850 score like the one you already understand, but built from savings rate, budget discipline and runway — not debt.",
    accent: "var(--violet)",
  },
  {
    icon: "🔮",
    title: "Future Self Simulator",
    description: "Drag three sliders and watch a 30-year fan chart of your net worth react in real time, milestones and all.",
    accent: "var(--teal)",
  },
  {
    icon: "🫇",
    title: "Subscription X-ray",
    description: "Aurora fingerprints recurring charges automatically and shows exactly what canceling one does to your score.",
    accent: "var(--red)",
  },
  {
    icon: "🧬",
    title: "Spending DNA",
    description: "A unique, shareable fingerprint of how you spend — a radar chart plus a code like HO37-GR18-DI12 that's entirely yours.",
    accent: "var(--pink)",
  },
  {
    icon: "🔥",
    title: "Streaks & badges",
    description: "Real gamification tied to real behavior — on-budget streaks, patched leaks, and milestones worth celebrating.",
    accent: "var(--amber)",
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--violet)] mb-3">What makes Aurora different</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">
          Every budgeting app tracks the past. <span className="aurora-text">Aurora shows you what's next.</span>
        </h2>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map((f, i) => (
          <motion.div
            key={f.title}
            className="card p-6 relative overflow-hidden group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div
              className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500"
              style={{ background: f.accent }}
            />
            <span
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4 relative"
              style={{ background: `color-mix(in srgb, ${f.accent} 16%, transparent)` }}
            >
              {f.icon}
            </span>
            <h3 className="font-display font-semibold text-lg mb-2 relative">{f.title}</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed relative">{f.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
