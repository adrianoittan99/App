import { motion } from "framer-motion";

const STEPS = [
  {
    step: "01",
    title: "Connect your accounts",
    description: "Bring in checking, savings, credit and investment balances — or start from Aurora's realistic demo data in one click.",
  },
  {
    step: "02",
    title: "Let Aurora read the patterns",
    description: "Recurring charges, category trends and your wellness score compute automatically — no manual tagging marathon.",
  },
  {
    step: "03",
    title: "Act on the forecast",
    description: "Cancel a leak, nudge a slider, fund a goal — watch your Money Weather and score respond in real time.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="max-w-7xl mx-auto px-5 lg:px-8 py-20 lg:py-28">
      <div className="max-w-2xl mb-14">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--teal)] mb-3">How it works</p>
        <h2 className="font-display font-bold text-3xl sm:text-4xl leading-tight">From ledger to insight in three steps.</h2>
      </div>

      <div className="grid sm:grid-cols-3 gap-6">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] as const }}
            className="relative"
          >
            <span className="font-display font-bold text-5xl aurora-text opacity-70">{s.step}</span>
            <h3 className="font-display font-semibold text-lg mt-3 mb-2">{s.title}</h3>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">{s.description}</p>
            {i < STEPS.length - 1 && (
              <div className="hidden sm:block absolute top-6 left-[calc(100%+0.5rem)] w-[calc(1.5rem-1rem)] h-px bg-[image:var(--aurora-gradient)] opacity-40" />
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}
