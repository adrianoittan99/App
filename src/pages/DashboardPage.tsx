import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppStore } from "../lib/store";
import {
  computeBadges,
  computeDebtBalance,
  computeDueRecurring,
  computeEnvelopeProgress,
  computeHealthScore,
  computeLiquidBalance,
  computeMoneyWeather,
  computeNetWorth,
  computeNetWorthHistory,
  computeUnderBudgetStreak,
  lastNMonthKeys,
  monthKey,
  monthLabelFull,
  shiftMonthKey,
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
import { MonthSwitcher } from "../components/ui/MonthSwitcher";

export function DashboardPage() {
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const accounts = useAppStore((s) => s.accounts);
  const goals = useAppStore((s) => s.goals);
  const canceledSubscriptions = useAppStore((s) => s.canceledSubscriptions);
  const recurringTransactions = useAppStore((s) => s.recurringTransactions);
  const confirmRecurring = useAppStore((s) => s.confirmRecurring);
  const openAddTransactionModal = useAppStore((s) => s.openAddTransactionModal);

  const realCurrentMonth = monthKey(new Date());
  const [selectedMonth, setSelectedMonth] = useState(realCurrentMonth);
  const isCurrent = selectedMonth === realCurrentMonth;

  const months = lastNMonthKeys(6);
  const prevMonth = shiftMonthKey(selectedMonth, -1);

  // Income/spend/envelopes/recent-activity below follow whichever month is
  // selected. Score, weather, net worth, runway, and badges always reflect
  // right now — they're a snapshot of current standing, not something that
  // can be honestly reconstructed for an arbitrary past month from today's
  // account balances.
  const summary = summarizeMonth(transactions, selectedMonth);
  const prevSummary = summarizeMonth(transactions, prevMonth);
  const envelopeProgress = computeEnvelopeProgress(envelopes, transactions, selectedMonth);
  const monthTransactions = transactions.filter((t) => monthKey(t.date) === selectedMonth);

  const currentMonthSummary = summarizeMonth(transactions, realCurrentMonth);
  const netWorth = computeNetWorth(accounts);
  const liquidBalance = computeLiquidBalance(accounts);
  const history = computeNetWorthHistory(accounts, transactions, months);
  const changePct = history[0]?.value ? (netWorth - history[0].value) / Math.abs(history[0].value) : null;

  const monthlyExpenseBaseline = months.slice(0, -1).reduce((s, m) => s + summarizeMonth(transactions, m).expenses, 0) / Math.max(months.length - 1, 1);
  const debtBalance = computeDebtBalance(accounts);

  const health = computeHealthScore({
    income: currentMonthSummary.income,
    expenses: currentMonthSummary.expenses,
    envelopeProgress: computeEnvelopeProgress(envelopes, transactions, realCurrentMonth),
    liquidBalance,
    monthlyExpenseBaseline,
    debtBalance,
  });

  const streak = computeUnderBudgetStreak(transactions, envelopes);
  const recentGoalComplete = goals.some((g) => g.saved >= g.target);
  const weather = computeMoneyWeather({
    score: health.score,
    netThisMonth: currentMonthSummary.net,
    emergencyFundMonths: health.emergencyFundMonths,
    streakDays: streak,
    goalCompletedRecently: recentGoalComplete,
  });

  const badges = computeBadges({ streak, healthScore: health.score, goals, subscriptionsCanceled: canceledSubscriptions.length });

  const incomeTrend = prevSummary.income > 0 ? (summary.income - prevSummary.income) / prevSummary.income : 0;
  const expenseTrend = prevSummary.expenses > 0 ? (summary.expenses - prevSummary.expenses) / prevSummary.expenses : 0;
  // Savings rate shown in the stat tile follows the selected month — distinct
  // from health.savingsRate, which is pinned to the real current month above.
  const selectedSavingsRate = summary.income > 0 ? (summary.income - summary.expenses) / summary.income : 0;
  const dueRecurring = computeDueRecurring(recurringTransactions, transactions);

  return (
    <div className="space-y-6">
      {isCurrent && dueRecurring.length > 0 && (
        <div className="rounded-2xl p-4 border border-[var(--amber)]/30 bg-[var(--amber)]/10 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm">
            <span className="font-semibold">{dueRecurring.length} recurring transaction{dueRecurring.length === 1 ? "" : "s"}</span>{" "}
            <span className="text-[var(--text-muted)]">due this month — confirm in a couple taps.</span>
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {dueRecurring.slice(0, 3).map(({ rule }) => (
              <Button key={rule.id} size="sm" variant="secondary" onClick={() => confirmRecurring(rule.id)}>
                Confirm {rule.merchant}
              </Button>
            ))}
            <Link to="/app/recurring" className="text-xs font-medium text-[var(--violet)] hover:underline">
              View all →
            </Link>
          </div>
        </div>
      )}

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

      <div className="flex items-center justify-between gap-4 flex-wrap">
        {isCurrent ? (
          <span />
        ) : (
          <p className="text-xs text-[var(--amber)] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--amber)] shrink-0" />
            Viewing {monthLabelFull(selectedMonth)} — income, spending, and envelopes below are from that month. Cards
            marked "Always today" haven't moved.
          </p>
        )}
        <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatTile
          label={isCurrent ? "Income this month" : "Income"}
          value={formatCurrency(summary.income)}
          icon="↓"
          accent="var(--green)"
          trend={{ value: formatPercent(Math.abs(incomeTrend)), positive: incomeTrend >= 0 }}
          delay={0}
          tip={{
            title: "Income",
            body: "The sum of every transaction logged in the selected month with a positive amount — paychecks, refunds, side income. Switch months above to see any month's totals.",
            action: { label: "+ Log a paycheck or income →", onClick: openAddTransactionModal },
          }}
        />
        <StatTile
          label={isCurrent ? "Spent this month" : "Spent"}
          value={formatCurrency(summary.expenses)}
          icon="↑"
          accent="var(--red)"
          trend={{ value: formatPercent(Math.abs(expenseTrend)), positive: expenseTrend <= 0 }}
          delay={0.05}
          tip={{
            title: "Spent",
            body: "The sum of every expense logged in the selected month, split across your envelopes by category. Add or remove a transaction and this — and every envelope bar below — updates instantly.",
            action: { label: "+ Log an expense →", onClick: openAddTransactionModal },
          }}
        />
        <StatTile
          label="Savings rate"
          value={formatPercent(selectedSavingsRate)}
          icon="●"
          accent="var(--violet)"
          trend={null}
          delay={0.1}
          tip={{
            title: "Savings rate",
            body: "(Income − expenses) ÷ income for the selected month. Your Wellness Score always uses the current month's rate — 30% of the score — so browsing history here won't move it.",
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
            body: "Your current checking + savings balance, divided by your average monthly spend. It answers: \"if income stopped today, how many months could I cover?\" Always your real balance right now — it doesn't change when you browse a past month above. 6 months is considered fully funded.",
            action: { label: "Edit your account balances →", to: "/app/balances" },
          }}
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          <MoneyWeatherCard weather={weather} pinnedToToday={!isCurrent} />
          <NetWorthChart history={history} netWorth={netWorth} changePct={changePct} pinnedToToday={!isCurrent} />
          <RecentTransactions transactions={monthTransactions} title={isCurrent ? "Recent activity" : `Activity in ${monthLabelFull(selectedMonth)}`} />
        </div>
        <div className="space-y-6 min-w-0">
          <HealthScoreGauge breakdown={health} pinnedToToday={!isCurrent} />
          <EnvelopeMiniList envelopes={envelopeProgress} monthLabel={isCurrent ? undefined : monthLabelFull(selectedMonth)} />
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
