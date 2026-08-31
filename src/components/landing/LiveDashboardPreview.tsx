import { motion } from "framer-motion";
import { useAppStore } from "../../lib/store";
import {
  computeDebtBalance,
  computeEnvelopeProgress,
  computeHealthScore,
  computeLiquidBalance,
  computeMoneyWeather,
  computeNetWorth,
  computeUnderBudgetStreak,
  lastNMonthKeys,
  monthKey,
  summarizeMonth,
} from "../../lib/calculations";
import { CATEGORIES } from "../../lib/categories";
import { formatCurrency, formatPercent } from "../../lib/format";
import { ProgressBar } from "../ui/ProgressBar";

export function LiveDashboardPreview() {
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const accounts = useAppStore((s) => s.accounts);

  const months = lastNMonthKeys(6);
  const currentMonth = monthKey(new Date());
  const summary = summarizeMonth(transactions, currentMonth);
  const envelopeProgress = computeEnvelopeProgress(envelopes, transactions, currentMonth);
  const netWorth = computeNetWorth(accounts);
  const liquidBalance = computeLiquidBalance(accounts);
  const debtBalance = computeDebtBalance(accounts);
  const baseline = months.slice(0, -1).reduce((s, m) => s + summarizeMonth(transactions, m).expenses, 0) / Math.max(months.length - 1, 1);

  const health = computeHealthScore({
    income: summary.income,
    expenses: summary.expenses,
    envelopeProgress,
    liquidBalance,
    monthlyExpenseBaseline: baseline,
    debtBalance,
  });
  const streak = computeUnderBudgetStreak(transactions, envelopes);
  const weather = computeMoneyWeather({ score: health.score, netThisMonth: summary.net, emergencyFundMonths: health.emergencyFundMonths, streakDays: streak, goalCompletedRecently: true });

  const topEnvelopes = [...envelopeProgress].sort((a, b) => b.pct - a.pct).slice(0, 3);

  return (
    <div className="relative w-full max-w-md mx-auto lg:mx-0" style={{ perspective: 1200 }}>
      <motion.div
        className="relative card p-5 animate-float"
        initial={{ opacity: 0, y: 30, rotateY: -6 }}
        animate={{ opacity: 1, y: 0, rotateY: -6 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Financial Wellness</p>
            <p className="font-display font-bold text-3xl tabular">{health.score}</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--teal)]/15 text-[var(--teal)]">{health.band}</span>
        </div>

        <div className="rounded-xl p-3 mb-4 bg-[image:var(--aurora-gradient-soft)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-0.5">Money Weather</p>
          <p className="text-sm font-semibold">{weather.headline}</p>
        </div>

        <div className="space-y-2.5">
          {topEnvelopes.map((e) => {
            const cat = CATEGORIES[e.categoryId];
            return (
              <div key={e.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium">{cat.icon} {cat.label}</span>
                  <span className="tabular text-[var(--text-muted)]">{formatPercent(Math.min(e.pct, 1.5))}</span>
                </div>
                <ProgressBar pct={e.pct} color={cat.color} height={6} />
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[var(--border)] text-sm">
          <span className="text-[var(--text-muted)]">Net worth</span>
          <span className="font-semibold tabular">{formatCurrency(netWorth)}</span>
        </div>
      </motion.div>

      <motion.div
        className="absolute -bottom-6 -left-8 card p-3.5 w-44 hidden sm:block"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <p className="text-[10px] text-[var(--text-muted)]">Subscription X-ray</p>
        <p className="font-display font-bold text-lg tabular text-[var(--red)] mt-0.5">$166<span className="text-xs text-[var(--text-muted)]">/mo</span></p>
        <p className="text-[10px] text-[var(--text-faint)] mt-0.5">7 recurring charges found</p>
      </motion.div>

      <motion.div
        className="absolute -top-6 -right-4 card p-3.5 w-40 hidden sm:block"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <p className="text-[10px] text-[var(--text-muted)]">🔥 Streak</p>
        <p className="font-display font-bold text-lg tabular mt-0.5">{streak} days on budget</p>
      </motion.div>
    </div>
  );
}
