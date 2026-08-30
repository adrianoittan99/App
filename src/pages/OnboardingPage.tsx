import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../lib/authContext";
import { fetchOnboardingStatus, hydrateStoreFromSupabase, completeOnboarding } from "../lib/remoteSync";
import { EXPENSE_CATEGORIES } from "../lib/categories";
import type { CategoryId } from "../lib/types";
import { formatCurrency, formatPercent } from "../lib/format";
import { Button } from "../components/ui/Button";

const TOTAL_STEPS = 6;

export function OnboardingPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  const [checkingStatus, setCheckingStatus] = useState(true);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [currentAge, setCurrentAge] = useState("");
  const [monthlyIncome, setMonthlyIncome] = useState("4000");
  const [checkingBalance, setCheckingBalance] = useState("1000");
  const [savingsBalance, setSavingsBalance] = useState("0");
  const [creditCardDebt, setCreditCardDebt] = useState("0");
  const [savingsRateTarget, setSavingsRateTarget] = useState(0.15);
  const [focusCategories, setFocusCategories] = useState<CategoryId[]>([]);
  const [wantsGoal, setWantsGoal] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalTarget, setGoalTarget] = useState("1000");
  const [goalMonths, setGoalMonths] = useState("6");

  useEffect(() => {
    if (!session) return;
    fetchOnboardingStatus(session.user.id).then((done) => {
      if (done) {
        navigate("/app", { replace: true });
      } else {
        setCheckingStatus(false);
      }
    });
  }, [session, navigate]);

  if (!loading && !session) return <Navigate to="/login" replace />;
  if (loading || checkingStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--violet)] animate-spin" />
      </div>
    );
  }

  function toggleFocus(id: CategoryId) {
    setFocusCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  }

  async function handleFinish() {
    if (!session) return;
    setSubmitting(true);
    setError(null);
    try {
      await completeOnboarding(session.user.id, {
        displayName: displayName.trim(),
        currentAge: currentAge ? Number(currentAge) : null,
        checkingBalance: Number(checkingBalance) || 0,
        savingsBalance: Number(savingsBalance) || 0,
        creditCardDebt: Number(creditCardDebt) || 0,
        monthlyIncome: Number(monthlyIncome) || 0,
        savingsRateTarget,
        focusCategories,
        firstGoal: wantsGoal && goalName.trim() ? { name: goalName.trim(), target: Number(goalTarget) || 0, months: Number(goalMonths) || 6 } : null,
      });
      await hydrateStoreFromSupabase(session.user.id);
      navigate("/app");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong saving your setup — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const canAdvance = (() => {
    if (step === 0) return true;
    if (step === 1) return Number(monthlyIncome) > 0;
    if (step === 2) return checkingBalance !== "";
    return true;
  })();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl animate-drift"
          style={{ background: "radial-gradient(circle, var(--teal), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full opacity-20 blur-3xl animate-drift"
          style={{ background: "radial-gradient(circle, var(--pink), transparent 70%)", animationDelay: "-5s" }}
        />
      </div>

      <div className="w-full max-w-lg card p-7">
        <div className="flex items-center gap-1.5 mb-6">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 flex-1 rounded-full"
              style={{ background: i <= step ? "var(--violet)" : "var(--surface-3)" }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25 }}
          >
            {step === 0 && (
              <StepShell title="Let's set up your Aurora" subtitle="A couple minutes, then your dashboard is real.">
                <Field label="Your name">
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Optional" className={inputClass} />
                </Field>
                <Field label="Your age">
                  <input
                    type="number"
                    value={currentAge}
                    onChange={(e) => setCurrentAge(e.target.value)}
                    placeholder="Optional — used by the Future Self simulator"
                    className={inputClass}
                  />
                </Field>
              </StepShell>
            )}

            {step === 1 && (
              <StepShell title="What's your income?" subtitle="A rough monthly average is fine — you can refine this anytime.">
                <Field label="Average monthly income (after tax)">
                  <input
                    type="number"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className={inputClass}
                    min="0"
                  />
                </Field>
              </StepShell>
            )}

            {step === 2 && (
              <StepShell title="Where's your money right now?" subtitle="Your real starting balances — nothing is verified or connected to a bank.">
                <Field label="Checking account balance">
                  <input type="number" value={checkingBalance} onChange={(e) => setCheckingBalance(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Savings balance">
                  <input type="number" value={savingsBalance} onChange={(e) => setSavingsBalance(e.target.value)} className={inputClass} />
                </Field>
                <Field label="Credit card debt (if any)">
                  <input type="number" value={creditCardDebt} onChange={(e) => setCreditCardDebt(e.target.value)} className={inputClass} min="0" />
                </Field>
              </StepShell>
            )}

            {step === 3 && (
              <StepShell title="How much do you want to save?" subtitle="A target share of each paycheck. This shapes your starting envelope limits.">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[var(--text-muted)]">Target savings rate</span>
                  <span className="text-sm font-semibold tabular">{formatPercent(savingsRateTarget)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={0.5}
                  step={0.01}
                  value={savingsRateTarget}
                  onChange={(e) => setSavingsRateTarget(Number(e.target.value))}
                  className="aurora-slider w-full"
                />
                <p className="text-xs text-[var(--text-faint)] mt-3">
                  ≈ {formatCurrency(Number(monthlyIncome) * savingsRateTarget || 0)} / month toward savings
                </p>
              </StepShell>
            )}

            {step === 4 && (
              <StepShell title="Where do you want to watch spending?" subtitle="Pick any categories that tend to run away from you — we'll set tighter starting limits there.">
                <div className="flex flex-wrap gap-1.5">
                  {EXPENSE_CATEGORIES.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleFocus(c.id)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        focusCategories.includes(c.id)
                          ? "border-[var(--violet)] bg-[var(--violet)]/15 text-[var(--text)]"
                          : "border-[var(--border)] text-[var(--text-muted)]"
                      }`}
                    >
                      {c.icon} {c.label}
                    </button>
                  ))}
                </div>
              </StepShell>
            )}

            {step === 5 && (
              <StepShell title="A first goal? (optional)" subtitle="Something you're saving toward — skip if you're not sure yet.">
                <label className="flex items-center gap-2 text-sm mb-3">
                  <input type="checkbox" checked={wantsGoal} onChange={(e) => setWantsGoal(e.target.checked)} />
                  I have something in mind
                </label>
                {wantsGoal && (
                  <>
                    <Field label="Goal name">
                      <input value={goalName} onChange={(e) => setGoalName(e.target.value)} placeholder="e.g. Emergency fund" className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Target amount">
                        <input type="number" value={goalTarget} onChange={(e) => setGoalTarget(e.target.value)} className={inputClass} min="0" />
                      </Field>
                      <Field label="Months to reach it">
                        <input type="number" value={goalMonths} onChange={(e) => setGoalMonths(e.target.value)} className={inputClass} min="1" />
                      </Field>
                    </div>
                  </>
                )}
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="text-xs text-[var(--red)] mt-4">{error}</p>}

        <div className="flex items-center justify-between mt-7">
          <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || submitting}>
            Back
          </Button>
          {step < TOTAL_STEPS - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1))} disabled={!canAdvance}>
              Continue
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={submitting}>
              {submitting ? "Setting up…" : "Finish setup"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)] tabular";

function StepShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div>
      <h1 className="font-display font-bold text-xl mb-1">{title}</h1>
      <p className="text-sm text-[var(--text-muted)] mb-5">{subtitle}</p>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
      {children}
    </div>
  );
}
