import { Link } from "react-router-dom";
import { useAppStore } from "../lib/store";
import {
  computeBadges,
  computeEnvelopeProgress,
  computeHealthScore,
  computeLiquidBalance,
  computeMoneyWeather,
  computeNetWorth,
  computeNetWorthHistory,
  computeUnderBudgetStreak,
  lastNMonthKeys,
  monthKey,
  summarizeMonth,
} from "../lib/calculations";
import { formatCurrency, formatPercent } from "../lib/format";
import { MoneyWeatherCard } from "../components/dashboard/MoneyWeatherCard";
import { HealthScoreGauge } from "../components/dashboard/HealthScoreGauge";
import { NetWorthChart } from "../components/dashboard/NetWorthChart";
import { EnvelopeMiniList } from "../components/dashboard/EnvelopeMiniList";
import { RecentTransactions } from "../components/dashboard/RecentTransactions";
import { StatTile } from "../components/dashboard/StatTile";
import { BadgeStrip } from "../components/dashboard/BadgeStrip";
import { GoalCard } from "../components/goals/GoalCard";
import { Button } from "../components/ui/Button";

export function DashboardPage() {
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const accounts = useAppStore((s) => s.accounts);
  const goals = useAppStore((s) => s.goals);
  const canceledSubscriptions = useAppStore((s) => s.canceledSubscriptions);
  const openAddTransactionModal = useAppStore((s) => s.openAddTransactionModal);

  const months = lastNMonthKeys(6);
  const currentMonth = monthKey(new Date());
  const prevMonth = months[months.length - 2] ?? currentMonth;

  const summary = summarizeMonth(transactions, currentMonth);
  const prevSummary = summarizeMonth(transactions, prevMonth);
  const envelopeProgress = computeEnvelopeProgress(envelopes, transactions, currentMonth);
  const netWorth = computeNetWorth(accounts);
  const liquidBalance = computeLiquidBalance(accounts);
  const history = computeNetWorthHistory(accounts, transactions, months);
  const changePct = history[0]?.value ? (netWorth - history[0].value) / Math.abs(history[0].value) : null;

  const monthlyExpenseBaseline = months.slice(0, -1).reduce((s, m) => s + summarizeMonth(transactions, m).expenses, 0) / Math.max(months.length - 1, 1);
  const debtBalance = accounts.filter((a) => a.type === "credit" && a.balance < 0).reduce((s, a) => s + -a.balance, 0);

  const health = computeHealthScore({
    income: summary.income,
    expenses: summary.expenses,
    envelopeProgress,
    liquidBalance,
    monthlyExpenseBaseline,
    debtBalance,
  });

  const streak = computeUnderBudgetStreak(transactions, envelopes);
  const recentGoalComplete = goals.some((g) => g.saved >= g.target);
  const weather = computeMoneyWeather({
    score: health.score,
    netThisMonth: summary.net,
    emergencyFundMonths: health.emergencyFundMonths,
    streakDays: streak,
    goalCompletedRecently: recentGoalComplete,
  });

  const badges = computeBadges({ streak, healthScore: health.score, goals, subscriptionsCanceled: canceledSubscriptions.length });

  const incomeTrend = prevSummary.income > 0 ? (summary.income - prevSummary.income) / prevSummary.income : 0;
  const expenseTrend = prevSummary.expenses > 0 ? (summary.expenses - prevSummary.expenses) / prevSummary.expenses : 0;

  return (
    <div className="space-y-6">
      {transactions.length === 0 && (
        <div
          className="relative overflow-hidden rounded-[20px] p-6 sm:p-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: "var(--aurora-gradient)" }}
        >
          <div className="absolute inset-0 noise-veil" />
          <div className="relative">
            <p className="text-white/80 text-xs font-medium uppercase tracking-wide">Getting started</p>
            <h2 className="font-display font-bold text-xl text-white mt-1">Your dashboard is ready — it just needs data.</h2>
            <p className="text-white/85 text-sm mt-1.5 max-w-md">
              Everything below fills in the moment you log a real transaction. Add a paycheck or a purchase to see your
              actual score, weather, and net worth take shape.
            </p>
          </div>
          <Button
            variant="secondary"
            className="relative shrink-0 !bg-white !text-[var(--violet)] !border-transparent hover:!brightness-95"
            onClick={openAddTransactionModal}
          >
            + Add your first transaction
          </Button>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label="Income this month"
          value={formatCurrency(summary.income)}
          icon="↓"
          accent="var(--green)"
          trend={{ value: formatPercent(Math.abs(incomeTrend)), positive: incomeTrend >= 0 }}
          delay={0}
          tip={{
            title: "Income this month",
            body: "The sum of every transaction you've logged this month with a positive amount — paychecks, refunds, side income. It resets automatically at the start of each month.",
            action: { label: "+ Log a paycheck or income →", onClick: openAddTransactionModal },
          }}
        />
        <StatTile
          label="Spent this month"
          value={formatCurrency(summary.expenses)}
          icon="↑"
          accent="var(--red)"
          trend={{ value: formatPercent(Math.abs(expenseTrend)), positive: expenseTrend <= 0 }}
          delay={0.05}
          tip={{
            title: "Spent this month",
            body: "The sum of every expense logged this month, split across your envelopes by category. Add or remove a transaction and this — and every envelope bar below — updates instantly.",
            action: { label: "+ Log an expense →", onClick: openAddTransactionModal },
          }}
        />
        <StatTile
          label="Savings rate"
          value={formatPercent(health.savingsRate)}
          icon="●"
          accent="var(--violet)"
          trend={null}
          delay={0.1}
          tip={{
            title: "Savings rate",
            body: "(Income − expenses) ÷ income for this month. It's the single biggest lever on your Wellness Score — 30% of the score. Tightening an envelope you're overspending in is the fastest way to move it.",
            action: { label: "Adjust your envelope limits →", to: "/app/budgets" },
          }}
        />
        <StatTile
          label="Emergency runway"
          value={`${health.emergencyFundMonths.toFixed(1)} mo`}
          icon="☂"
          accent="var(--teal)"
          trend={null}
          delay={0.15}
          tip={{
            title: "Emergency runway",
            body: "Your checking + savings balance, divided by your average monthly spend. It answers: \"if income stopped today, how many months could I cover?\" 6 months is considered fully funded.",
            action: { label: "Edit your account balances →", to: "/app/settings" },
          }}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <MoneyWeatherCard weather={weather} />
          <NetWorthChart history={history} netWorth={netWorth} changePct={changePct} />
          <RecentTransactions transactions={transactions} />
        </div>
        <div className="space-y-6 min-w-0">
          <HealthScoreGauge breakdown={health} />
          <EnvelopeMiniList envelopes={envelopeProgress} />
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BadgeStrip badges={badges} />
        </div>
        <div className="card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-semibold text-[15px]">Goals in motion</h3>
            <Link to="/app/goals" className="text-xs font-medium text-[var(--violet)] hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {goals.slice(0, 2).map((g) => (
              <GoalCard key={g.id} goal={g} compact />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
