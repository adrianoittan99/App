import { motion } from "framer-motion";
import { useAppStore } from "../../lib/store";
import {
  computeHealthScore,
  computeLiquidBalance,
  computeMoneyTips,
  computeUnderBudgetStreak,
  computeUpcomingDue,
  lastNMonthKeys,
  monthKey,
  summarizeMonth,
} from "../../lib/calculations";
import { Card, CardHeader } from "../ui/Card";

const TONE_STYLE: Record<string, string> = {
  alert: "border-[var(--red)]/25 bg-[var(--red)]/8",
  calm: "border-[var(--amber)]/25 bg-[var(--amber)]/8",
  positive: "border-[var(--teal)]/25 bg-[var(--teal)]/8",
};

export function MoneyTips() {
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const accounts = useAppStore((s) => s.accounts);

  const months = lastNMonthKeys(6);
  const currentMonth = monthKey(new Date());
  const summary = summarizeMonth(transactions, currentMonth);
  const liquidBalance = computeLiquidBalance(accounts);
  const monthlyExpenseBaseline = months.slice(0, -1).reduce((s, m) => s + summarizeMonth(transactions, m).expenses, 0) / Math.max(months.length - 1, 1);
  const debtBalance = accounts.filter((a) => (a.type === "credit" || a.type === "loan") && a.balance < 0).reduce((s, a) => s + -a.balance, 0);

  const envelopeProgress = envelopes.map((env) => {
    const spent = summary.byCategory[env.categoryId] ?? 0;
    const pct = env.monthlyLimit > 0 ? spent / env.monthlyLimit : 0;
    const status: "on-track" | "watch" | "over" = pct >= 1 ? "over" : pct >= 0.85 ? "watch" : "on-track";
    return { ...env, spent, remaining: env.monthlyLimit - spent, pct, status };
  });

  const health = computeHealthScore({
    income: summary.income,
    expenses: summary.expenses,
    envelopeProgress,
    liquidBalance,
    monthlyExpenseBaseline,
    debtBalance,
  });
  const streak = computeUnderBudgetStreak(transactions, envelopes);
  const upcomingDue = computeUpcomingDue(accounts);
  const tips = computeMoneyTips({ health, accounts, upcomingDue, streak });

  return (
    <Card>
      <CardHeader title="Tips for you" subtitle="Situational, not generic — based on your actual numbers" />
      <div className="space-y-3">
        {tips.map((tip, i) => (
          <motion.div
            key={tip.id}
            className={`rounded-xl p-3.5 border flex gap-3 ${TONE_STYLE[tip.tone]}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <span className="text-lg shrink-0 leading-none mt-0.5">{tip.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold">{tip.title}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1 leading-relaxed">{tip.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
