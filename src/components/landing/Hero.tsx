import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "../ui/Button";
import { LiveDashboardPreview } from "./LiveDashboardPreview";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full opacity-40 blur-3xl animate-drift" style={{ background: "radial-gradient(circle, var(--teal), transparent 70%)" }} />
        <div className="absolute top-10 right-0 w-[460px] h-[460px] rounded-full opacity-30 blur-3xl animate-drift" style={{ background: "radial-gradient(circle, var(--violet), transparent 70%)", animationDelay: "-4s" }} />
        <div className="absolute bottom-0 left-1/3 w-[380px] h-[380px] rounded-full opacity-25 blur-3xl animate-drift" style={{ background: "radial-gradient(circle, var(--pink), transparent 70%)", animationDelay: "-8s" }} />
      </div>

      <div className="max-w-7xl mx-auto px-5 lg:px-8 pt-16 pb-24 lg:pt-24 lg:pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-xs font-medium mb-6"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse-ring" />
            Now with Future Self projections
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-bold text-4xl sm:text-5xl lg:text-[56px] leading-[1.05] tracking-tight"
          >
            Budgeting that
            <br />
            <span className="aurora-text">forecasts your future.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-6 text-lg text-[var(--text-muted)] max-w-lg leading-relaxed"
          >
            Aurora reads your spending like a meteorologist reads the sky — turning transactions
            into a daily forecast, a wellness score, and a simulation of the person you're
            becoming financially. No spreadsheets. No guesswork.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link to="/app">
              <Button size="lg">Launch the live demo →</Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="secondary">
                Explore features
              </Button>
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-10 flex items-center gap-6 text-xs text-[var(--text-muted)]"
          >
            <span>No signup required</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
            <span>Runs entirely in your browser</span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-faint)]" />
            <span>Seeded with real-looking demo data</span>
          </motion.div>
        </div>

        <LiveDashboardPreview />
      </div>
    </section>
  );
}
