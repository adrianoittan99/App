import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "../ui/Button";

interface Lesson {
  id: string;
  eyebrow: string;
  title: string;
  body: ReactNode;
  illustration: ReactNode;
  action?: { label: string; to: string };
}

const LESSONS: Lesson[] = [
  {
    id: "welcome",
    eyebrow: "Welcome",
    title: "Aurora, in about 60 seconds",
    body: (
      <>
        Every number on your dashboard traces back to something simple: your transactions, your envelopes, your account
        balances. Nothing is hidden math — this quick tour shows what drives each one, and exactly where to go to change
        it.
      </>
    ),
    illustration: <WelcomeArt />,
  },
  {
    id: "recurring",
    eyebrow: "Recurring",
    title: "Stop re-typing your rent every month",
    body: (
      <>
        Set up anything predictable — rent, payroll, a subscription — once. Aurora never logs it for you automatically;
        instead it surfaces what's due each month and you confirm with one tap. The rest of your effort goes where it
        actually matters: the spending you didn't plan for.
      </>
    ),
    illustration: <RecurringArt />,
    action: { label: "Try it — open Recurring →", to: "/app/recurring" },
  },
  {
    id: "score",
    eyebrow: "Financial Wellness Score",
    title: "A credit score for your habits",
    body: (
      <>
        A 300–850 number blended from four things: <strong>savings rate</strong> (30%), <strong>emergency fund</strong>{" "}
        (30%), <strong>budget adherence</strong> (25%), and <strong>debt load</strong> (15%). Improve any one and the
        score reacts instantly — it's never waiting on a monthly report.
      </>
    ),
    illustration: <ScoreArt />,
  },
  {
    id: "weather",
    eyebrow: "Money Weather",
    title: "A forecast, not just a number",
    body: (
      <>
        Sunny, cloudy, or storm warning — Money Weather turns your score, this month's cash flow, your runway, and your
        streak into one plain-language read. Watching the sky clear is the fastest way to feel progress, not just see it.
      </>
    ),
    illustration: <WeatherArt />,
  },
  {
    id: "envelopes",
    eyebrow: "Envelopes",
    title: "Budgets that fill up as you spend",
    body: (
      <>
        Every category gets a monthly limit. Log a transaction and the matching envelope fills in automatically — no
        manual sorting. Tap any limit to change it, and staying under it is exactly what "budget adherence" measures.
      </>
    ),
    illustration: <EnvelopeArt />,
    action: { label: "Try it — open Envelopes →", to: "/app/budgets" },
  },
  {
    id: "balances",
    eyebrow: "Balances",
    title: "Every account and every due date, one place",
    body: (
      <>
        Cash, credit cards, and loans — with a rate, a minimum payment, and a due date on anything you owe. Aurora
        surfaces what's due soon and what's costing you the most in interest, plus a few situational tips based on your
        actual numbers, not generic advice.
      </>
    ),
    illustration: <BalancesArt />,
    action: { label: "Try it — open Balances →", to: "/app/balances" },
  },
  {
    id: "networth",
    eyebrow: "Net worth & Future Self",
    title: "Where you stand, and where you're headed",
    body: (
      <>
        Net worth is every balance you own, minus what you owe. The Future Self simulator takes that number and
        compounds it forward — drag any slider and watch decades of growth react in real time.
      </>
    ),
    illustration: <NetWorthArt />,
    action: { label: "Try it — open Insights →", to: "/app/insights" },
  },
  {
    id: "xray",
    eyebrow: "Subscription X-ray",
    title: "Leaks, found automatically",
    body: (
      <>
        No bank connection needed. Aurora spots the same merchant charging a similar amount about once a month and flags
        it as recurring — so you see exactly what canceling one actually saves, per month and per year.
      </>
    ),
    illustration: <XrayArt />,
  },
  {
    id: "dna",
    eyebrow: "Spending DNA",
    title: "Your spending, as a fingerprint",
    body: (
      <>
        A radar chart of your top categories over 3 months, boiled into a shareable code like{" "}
        <code className="px-1 rounded bg-white/10">HO37-GR18</code>. It's a fast way to notice a category creeping up
        before it becomes a habit.
      </>
    ),
    illustration: <DnaArt />,
  },
  {
    id: "goals",
    eyebrow: "Goals & streaks",
    title: "Progress you can see and feel",
    body: (
      <>
        Set a target and a date, add funds whenever you like, and Aurora celebrates when you cross the line. Stay under
        budget day after day and your streak — and your badge case — keeps growing.
      </>
    ),
    illustration: <GoalsArt />,
    action: { label: "Try it — open Goals →", to: "/app/goals" },
  },
  {
    id: "done",
    eyebrow: "You're set",
    title: "Look for the little (i)",
    body: (
      <>
        Almost every number on your dashboard has a small (i) next to it — tap one anytime for a plain-language reminder
        of how it's calculated, and a shortcut straight to where you'd change it. Reopen this whole tour anytime from
        Settings.
      </>
    ),
    illustration: <DoneArt />,
  },
];

export function AuroraAcademy({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const lesson = LESSONS[step];
  const isLast = step === LESSONS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="relative w-full max-w-md rounded-[28px] overflow-hidden"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", boxShadow: "var(--shadow-glow)" }}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <button
              onClick={onClose}
              aria-label="Close tutorial"
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center bg-black/25 text-white hover:bg-black/40 transition-colors"
            >
              ✕
            </button>

            <div className="relative h-40 flex items-center justify-center overflow-hidden" style={{ background: "var(--aurora-gradient)" }}>
              <div className="absolute inset-0 noise-veil" />
              <AnimatePresence mode="wait">
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.85 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] as const }}
                >
                  {lesson.illustration}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="p-6">
              <div className="flex items-center gap-1.5 mb-5">
                {LESSONS.map((l, i) => (
                  <button
                    key={l.id}
                    onClick={() => setStep(i)}
                    aria-label={`Go to lesson ${i + 1}: ${l.title}`}
                    className="h-1.5 flex-1 rounded-full transition-colors"
                    style={{ background: i <= step ? "var(--violet)" : "var(--surface-3)" }}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={lesson.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--violet)] mb-1.5">{lesson.eyebrow}</p>
                  <h2 className="font-display font-bold text-xl mb-2.5 leading-tight">{lesson.title}</h2>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">{lesson.body}</p>
                  {lesson.action && (
                    <Link
                      to={lesson.action.to}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--violet)] hover:underline mt-3"
                    >
                      {lesson.action.label}
                    </Link>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex items-center justify-between mt-6">
                {step > 0 ? (
                  <Button variant="ghost" size="sm" onClick={() => setStep((s) => Math.max(0, s - 1))}>
                    Back
                  </Button>
                ) : (
                  <button onClick={onClose} className="text-xs font-medium text-[var(--text-faint)] hover:text-[var(--text-muted)]">
                    Skip tour
                  </button>
                )}
                {isLast ? (
                  <Button size="sm" onClick={onClose}>
                    Let's go
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setStep((s) => Math.min(LESSONS.length - 1, s + 1))}>
                    Next
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ---------------------------------------------------------------------------
// Illustrations — small, code-only animated visuals, no external assets.
// ---------------------------------------------------------------------------

function RecurringArt() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <motion.svg
        width="56"
        height="56"
        viewBox="0 0 56 56"
        animate={{ rotate: 360 }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="28" cy="28" r="20" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeDasharray="80 46" opacity="0.9" />
      </motion.svg>
      <motion.span
        className="absolute text-lg"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
      >
        ✓
      </motion.span>
    </div>
  );
}

function WelcomeArt() {
  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full bg-white/20"
        animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.15, 0.5] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative w-14 h-14 rounded-2xl flex items-center justify-center text-white font-display font-bold text-2xl bg-white/25 backdrop-blur-sm">
        A
      </span>
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white"
          style={{ left: `${20 + i * 30}%`, top: `${10 + i * 8}%` }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1, 0.5] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.4 }}
        />
      ))}
    </div>
  );
}

function ScoreArt() {
  const r = 34;
  const circumference = Math.PI * r;
  return (
    <svg viewBox="0 0 90 55" width="130" height="80">
      <path d="M 8 48 A 34 34 0 0 1 82 48" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="8" strokeLinecap="round" />
      <motion.path
        d="M 8 48 A 34 34 0 0 1 82 48"
        fill="none"
        stroke="white"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference * 0.22 }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] as const }}
      />
      <text x="45" y="42" textAnchor="middle" fontSize="18" fontWeight="700" fill="white" fontFamily="var(--font-display)">
        740
      </text>
    </svg>
  );
}

function WeatherArt() {
  return (
    <div className="relative w-20 h-16">
      <motion.div
        className="absolute rounded-full"
        style={{ width: 44, height: 44, left: 8, top: 4, background: "radial-gradient(circle, #fff2c4 0%, #ffcf5c 60%, transparent 75%)" }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.svg
        className="absolute left-6 top-8"
        width="60"
        height="32"
        viewBox="0 0 90 44"
        animate={{ x: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <ellipse cx="30" cy="26" rx="26" ry="16" fill="white" opacity="0.9" />
        <ellipse cx="55" cy="20" rx="22" ry="18" fill="white" />
        <ellipse cx="70" cy="28" rx="18" ry="13" fill="white" opacity="0.9" />
      </motion.svg>
    </div>
  );
}

function EnvelopeArt() {
  const bars = [0.9, 0.55, 0.3];
  return (
    <div className="w-28 space-y-2.5">
      {bars.map((pct, i) => (
        <div key={i} className="h-2.5 rounded-full bg-white/20 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${pct * 100}%` }}
            transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] as const }}
          />
        </div>
      ))}
    </div>
  );
}

function BalancesArt() {
  return (
    <div className="relative w-24 h-16">
      <motion.div
        className="absolute left-0 top-1 w-20 h-12 rounded-lg bg-white/25"
        initial={{ opacity: 0, y: 8, rotate: -4 }}
        animate={{ opacity: 1, y: 0, rotate: -4 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <div className="w-full h-3 rounded-t-lg bg-white/40 mt-2.5" />
        <div className="w-8 h-1.5 rounded-full bg-white/50 mt-2 ml-2.5" />
      </motion.div>
      <motion.div
        className="absolute right-0 bottom-0 w-9 h-9 rounded-full bg-white flex items-center justify-center text-sm font-bold"
        style={{ color: "var(--violet)" }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] as const }}
      >
        !
      </motion.div>
    </div>
  );
}

function NetWorthArt() {
  const points = "0,40 15,32 30,34 45,20 60,24 75,8 90,4";
  return (
    <svg viewBox="0 0 90 44" width="130" height="64">
      <motion.polyline
        points={points}
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] as const }}
      />
      <motion.circle
        cx="90"
        cy="4"
        r="4"
        fill="white"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.3, 1] }}
        transition={{ duration: 0.5, delay: 1 }}
      />
    </svg>
  );
}

function XrayArt() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-white/40"
        animate={{ scale: [1, 1.35], opacity: [0.6, 0] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
      />
      <svg width="48" height="48" viewBox="0 0 48 48">
        <circle cx="20" cy="20" r="13" fill="none" stroke="white" strokeWidth="3.5" />
        <line x1="29" y1="29" x2="40" y2="40" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <text x="20" y="25" textAnchor="middle" fontSize="13" fontWeight="700" fill="white">$</text>
      </svg>
    </div>
  );
}

function DnaArt() {
  return (
    <motion.svg
      width="70"
      height="70"
      viewBox="0 0 70 70"
      animate={{ rotate: 360 }}
      transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
    >
      <polygon
        points="35,6 60,20 60,50 35,64 10,50 10,20"
        fill="none"
        stroke="white"
        strokeWidth="2.5"
        opacity="0.85"
      />
      <polygon points="35,20 48,27 48,43 35,50 22,43 22,27" fill="white" opacity="0.3" />
    </motion.svg>
  );
}

function GoalsArt() {
  return (
    <motion.div
      className="text-5xl"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    >
      🏆
    </motion.div>
  );
}

function DoneArt() {
  return (
    <div className="relative w-16 h-16 flex items-center justify-center">
      <motion.div
        className="w-16 h-16 rounded-full bg-white/25 flex items-center justify-center text-3xl"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] as const }}
      >
        ✓
      </motion.div>
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full bg-white"
          style={{ left: "50%", top: "50%" }}
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos((i / 8) * Math.PI * 2) * 42,
            y: Math.sin((i / 8) * Math.PI * 2) * 42,
            opacity: 0,
          }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
