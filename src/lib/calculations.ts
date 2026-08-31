import type {
  Account,
  CategoryId,
  Envelope,
  FutureProjectionPoint,
  Goal,
  MoneyWeather,
  RecurringTransaction,
  Subscription,
  Transaction,
  WeatherKind,
} from "./types";
import { formatCurrency, formatPercent } from "./format";

// ---------------------------------------------------------------------------
// Month helpers
// ---------------------------------------------------------------------------

export function monthKey(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function lastNMonthKeys(n: number, from = new Date()): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() - i, 1));
    out.push(monthKey(d));
  }
  return out;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "short" });
}

export function monthLabelFull(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/** "2026-08" shifted by `delta` months (negative goes back). */
export function shiftMonthKey(key: string, delta: number): string {
  const [y, m] = key.split("-").map(Number);
  return monthKey(new Date(Date.UTC(y, m - 1 + delta, 1)));
}

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export interface MonthlySummary {
  income: number;
  expenses: number; // positive number
  net: number;
  byCategory: Partial<Record<CategoryId, number>>; // positive spend per category
}

/**
 * Newest first, by date — the order every list of transactions should be
 * displayed in, regardless of the order they were logged in. Stable sort
 * keeps same-day entries in their existing relative order.
 */
export function sortTransactions(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
}

export function summarizeMonth(transactions: Transaction[], key: string): MonthlySummary {
  const inMonth = transactions.filter((t) => monthKey(t.date) === key);
  let income = 0;
  let expenses = 0;
  const byCategory: Partial<Record<CategoryId, number>> = {};

  inMonth.forEach((t) => {
    if (t.amount >= 0) {
      income += t.amount;
    } else {
      expenses += -t.amount;
      byCategory[t.category] = (byCategory[t.category] ?? 0) + -t.amount;
    }
  });

  return { income, expenses, net: income - expenses, byCategory };
}

// ---------------------------------------------------------------------------
// Envelopes / budgets
// ---------------------------------------------------------------------------

export interface EnvelopeProgress extends Envelope {
  spent: number;
  remaining: number;
  pct: number; // 0..1+ (can exceed 1 when over budget)
  status: "on-track" | "watch" | "over";
}

export function computeEnvelopeProgress(envelopes: Envelope[], transactions: Transaction[], key: string): EnvelopeProgress[] {
  const summary = summarizeMonth(transactions, key);
  return envelopes.map((env) => {
    const spent = summary.byCategory[env.categoryId] ?? 0;
    const pct = env.monthlyLimit > 0 ? spent / env.monthlyLimit : 0;
    const status: EnvelopeProgress["status"] = pct >= 1 ? "over" : pct >= 0.85 ? "watch" : "on-track";
    return { ...env, spent, remaining: env.monthlyLimit - spent, pct, status };
  });
}

// ---------------------------------------------------------------------------
// Net worth
// ---------------------------------------------------------------------------

export function computeNetWorth(accounts: Account[]): number {
  return accounts.reduce((sum, a) => sum + a.balance, 0);
}

export function computeLiquidBalance(accounts: Account[]): number {
  return accounts.filter((a) => a.type === "checking" || a.type === "savings").reduce((sum, a) => sum + a.balance, 0);
}

export function computeDebtBalance(accounts: Account[]): number {
  return accounts.filter((a) => (a.type === "credit" || a.type === "loan") && a.balance < 0).reduce((sum, a) => sum + -a.balance, 0);
}

// ---------------------------------------------------------------------------
// Balances — due-date awareness for credit/loan accounts
// ---------------------------------------------------------------------------

/** Days from `from` until the next occurrence of `dueDay` (0 = due today). */
export function daysUntilDue(dueDay: number, from = new Date()): number {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const todayDay = from.getUTCDate();
  const clampedThisMonth = Math.min(dueDay, new Date(Date.UTC(y, m + 1, 0)).getUTCDate());
  let target = new Date(Date.UTC(y, m, clampedThisMonth));
  if (clampedThisMonth < todayDay) {
    const clampedNextMonth = Math.min(dueDay, new Date(Date.UTC(y, m + 2, 0)).getUTCDate());
    target = new Date(Date.UTC(y, m + 1, clampedNextMonth));
  }
  const startOfToday = new Date(Date.UTC(y, m, todayDay));
  return Math.round((target.getTime() - startOfToday.getTime()) / 86400000);
}

export interface UpcomingDue {
  account: Account;
  daysUntil: number;
}

/** Debt accounts with a due day set, soonest first. */
export function computeUpcomingDue(accounts: Account[], from = new Date()): UpcomingDue[] {
  return accounts
    .filter((a) => (a.type === "credit" || a.type === "loan") && a.dueDay)
    .map((account) => ({ account, daysUntil: daysUntilDue(account.dueDay as number, from) }))
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

/**
 * Synthesizes a net-worth history series by working backward from the
 * current balances using each month's realized net cash flow. This keeps
 * the trend line internally consistent with the transaction ledger instead
 * of being randomly generated.
 */
export function computeNetWorthHistory(accounts: Account[], transactions: Transaction[], months: string[]): { key: string; value: number }[] {
  const current = computeNetWorth(accounts);
  const netByMonth = months.map((key) => summarizeMonth(transactions, key).net);
  const values: number[] = new Array(months.length).fill(0);
  values[months.length - 1] = current;
  for (let i = months.length - 2; i >= 0; i -= 1) {
    values[i] = values[i + 1] - netByMonth[i + 1];
  }
  return months.map((key, i) => ({ key, value: values[i] }));
}

// ---------------------------------------------------------------------------
// Subscription X-ray — recurring charge detection
// ---------------------------------------------------------------------------

// Essential fixed bills (rent, utilities) are recurring too, but they aren't
// "leaks" you'd cancel — the X-ray focuses on discretionary recurring charges.
const ESSENTIAL_BILL_CATEGORIES: CategoryId[] = ["housing", "utilities"];

export function detectRecurring(transactions: Transaction[]): Subscription[] {
  const expenseTxns = transactions.filter((t) => t.amount < 0 && !ESSENTIAL_BILL_CATEGORIES.includes(t.category));
  const groups = new Map<string, Transaction[]>();

  expenseTxns.forEach((t) => {
    const key = `${t.merchant}`;
    const list = groups.get(key) ?? [];
    list.push(t);
    groups.set(key, list);
  });

  const subs: Subscription[] = [];

  groups.forEach((list, merchant) => {
    if (list.length < 2) return;
    const sorted = [...list].sort((a, b) => (a.date < b.date ? -1 : 1));

    const amounts = sorted.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const variance = Math.max(...amounts) - Math.min(...amounts);
    const amountIsStable = variance / avgAmount < 0.08;

    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i += 1) {
      const days = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / 86400000;
      gaps.push(days);
    }
    const avgGap = gaps.reduce((s, g) => s + g, 0) / gaps.length;
    const gapIsMonthly = avgGap >= 25 && avgGap <= 35;

    if (amountIsStable && gapIsMonthly) {
      subs.push({
        key: merchant,
        merchant,
        category: sorted[0].category,
        monthlyCost: avgAmount,
        annualCost: avgAmount * 12,
        occurrences: sorted.length,
        lastDate: sorted[sorted.length - 1].date,
        canceled: false,
      });
    }
  });

  return subs.sort((a, b) => b.monthlyCost - a.monthlyCost);
}

// ---------------------------------------------------------------------------
// Financial Health Score — a composite "financial wellness" score, styled
// like a familiar 300-850 credit score band but built from budgeting
// fundamentals rather than borrowing history.
// ---------------------------------------------------------------------------

export interface HealthScoreBreakdown {
  score: number; // 300-850
  band: "Needs attention" | "Fair" | "Good" | "Great" | "Exceptional";
  savingsRate: number; // 0..1 (can be negative)
  budgetAdherence: number; // 0..1
  emergencyFundMonths: number; // raw months, uncapped
  debtToIncome: number; // 0..1+ raw ratio
  components: { label: string; weight: number; score01: number }[];
}

export function computeHealthScore(params: {
  income: number;
  expenses: number;
  envelopeProgress: EnvelopeProgress[];
  liquidBalance: number;
  monthlyExpenseBaseline: number;
  debtBalance: number;
}): HealthScoreBreakdown {
  const { income, expenses, envelopeProgress, liquidBalance, monthlyExpenseBaseline, debtBalance } = params;

  // A brand-new account with no transaction history yet (income = expenses =
  // 0 this month) shouldn't be scored as if it had a bad month — there's
  // simply no data. Treat that case as neutral rather than penalizing it.
  const hasActivityThisMonth = income > 0 || expenses > 0;
  const savingsRate = income > 0 ? (income - expenses) / income : 0;
  const savingsScore01 = hasActivityThisMonth ? clamp01((savingsRate + 0.05) / 0.35) : 0.5; // 0% -> ~0.14, 20% -> ~0.71, 30%+ -> 1

  const relevant = envelopeProgress.filter((e) => e.categoryId !== "income");
  const withinBudgetCount = relevant.filter((e) => e.pct <= 1).length;
  const budgetAdherence = relevant.length ? withinBudgetCount / relevant.length : 1;

  // With no spending history, there's nothing to divide against — that's
  // "not enough data" (liquidBalance / 0), not "no runway." Give any real
  // balance the benefit of the doubt (fully-funded) instead of scoring 0.
  const emergencyFundMonths = monthlyExpenseBaseline > 0 ? liquidBalance / monthlyExpenseBaseline : liquidBalance > 0 ? 6 : 0;
  const emergencyScore01 = clamp01(emergencyFundMonths / 6); // 6 months = fully funded

  const debtToIncome = income > 0 ? debtBalance / income : 0;
  const debtScore01 = clamp01(1 - debtToIncome / 0.5); // 50%+ of monthly income in revolving debt -> 0

  const components = [
    { label: "Savings rate", weight: 0.3, score01: savingsScore01 },
    { label: "Budget adherence", weight: 0.25, score01: budgetAdherence },
    { label: "Emergency fund", weight: 0.3, score01: emergencyScore01 },
    { label: "Debt load", weight: 0.15, score01: debtScore01 },
  ];

  const weighted = components.reduce((sum, c) => sum + c.weight * c.score01, 0);
  const score = Math.round(300 + weighted * 550);

  const band: HealthScoreBreakdown["band"] =
    score >= 800 ? "Exceptional" : score >= 740 ? "Great" : score >= 670 ? "Good" : score >= 580 ? "Fair" : "Needs attention";

  return { score, band, savingsRate, budgetAdherence, emergencyFundMonths, debtToIncome, components };
}

function clamp01(v: number): number {
  return Math.max(0, Math.min(1, v));
}

// ---------------------------------------------------------------------------
// Money Weather — a plain-language, animated forecast of financial health
// ---------------------------------------------------------------------------

export function computeMoneyWeather(params: {
  score: number;
  netThisMonth: number;
  emergencyFundMonths: number;
  streakDays: number;
  goalCompletedRecently: boolean;
}): MoneyWeather {
  const { score, netThisMonth, emergencyFundMonths, streakDays, goalCompletedRecently } = params;

  let kind: WeatherKind;
  if (goalCompletedRecently && score >= 700) {
    kind = "rainbow";
  } else if (score >= 740) {
    kind = "sunny";
  } else if (score >= 670) {
    kind = "partly-cloudy";
  } else if (score >= 580) {
    kind = "cloudy";
  } else {
    kind = "stormy";
  }

  const temperature = Math.round(-10 + ((score - 300) / 550) * 48);

  const runway = emergencyFundMonths.toFixed(1);
  let headline = "";
  let detail = "";

  switch (kind) {
    case "rainbow":
      headline = "Clear skies — you just hit a goal";
      detail = `Momentum is strong: ${runway} months of runway saved and a ${streakDays}-day on-budget streak.`;
      break;
    case "sunny":
      headline = "Sunny with high pressure";
      detail = `Cash flow is healthy this month (${netThisMonth >= 0 ? "+" : ""}${Math.round(netThisMonth)} net) and your safety net covers ${runway} months.`;
      break;
    case "partly-cloudy":
      headline = "Partly cloudy, mild breeze";
      detail = `Things are stable, but a few categories are trending warm. ${runway} months of runway banked so far.`;
      break;
    case "cloudy":
      headline = "Overcast — keep an umbrella close";
      detail = `Spending is drifting past plan this month. Your runway sits at ${runway} months — building it up will clear the sky.`;
      break;
    case "stormy":
    default:
      headline = "Storm warning";
      detail = `This month ran ${netThisMonth < 0 ? "a deficit" : "very tight"}. Only ${runway} months of runway — trimming top categories will help fast.`;
      break;
  }

  return { kind, headline, detail, temperature };
}

// ---------------------------------------------------------------------------
// Future Self simulator — compounding projection with three scenarios
// ---------------------------------------------------------------------------

export function projectFutureNetWorth(params: {
  startingNetWorth: number;
  monthlyContribution: number;
  annualReturnRate: number; // e.g. 0.07
  years: number;
  currentAge?: number;
}): FutureProjectionPoint[] {
  const { startingNetWorth, monthlyContribution, annualReturnRate, years, currentAge = 30 } = params;
  const points: FutureProjectionPoint[] = [];

  const simulate = (rate: number) => {
    let balance = startingNetWorth;
    const monthlyRate = rate / 12;
    const series: number[] = [balance];
    for (let m = 1; m <= years * 12; m += 1) {
      balance = balance * (1 + monthlyRate) + monthlyContribution;
      if (m % 12 === 0) series.push(balance);
    }
    return series;
  };

  const conservativeSeries = simulate(Math.max(annualReturnRate - 0.02, 0));
  const projectedSeries = simulate(annualReturnRate);
  const optimisticSeries = simulate(annualReturnRate + 0.02);

  for (let y = 0; y <= years; y += 1) {
    points.push({
      year: y,
      age: currentAge + y,
      conservative: conservativeSeries[y],
      projected: projectedSeries[y],
      optimistic: optimisticSeries[y],
    });
  }

  return points;
}

export function findMilestoneYear(points: FutureProjectionPoint[], target: number): number | null {
  const hit = points.find((p) => p.projected >= target);
  return hit ? hit.year : null;
}

// ---------------------------------------------------------------------------
// Spending DNA — category fingerprint + shareable code
// ---------------------------------------------------------------------------

export interface DnaSlice {
  category: CategoryId;
  amount: number;
  pct: number;
}

export function computeSpendingDNA(byCategory: Partial<Record<CategoryId, number>>): { slices: DnaSlice[]; code: string } {
  const total = Object.values(byCategory).reduce((s, v) => s + (v ?? 0), 0);
  const entries = Object.entries(byCategory) as [CategoryId, number][];
  const slices = entries
    .map(([category, amount]) => ({ category, amount, pct: total > 0 ? amount / total : 0 }))
    .sort((a, b) => b.amount - a.amount);

  const code = slices
    .slice(0, 4)
    .map((s) => `${s.category.slice(0, 2).toUpperCase()}${Math.round(s.pct * 100)}`)
    .join("-");

  return { slices, code: code || "—" };
}

// ---------------------------------------------------------------------------
// Recurring transactions — predictable stuff (rent, payroll, subscriptions)
// the user defines once instead of re-typing every month. Nothing ever logs
// itself silently: "due" just means "not yet matched to a real transaction
// this month, and its day has arrived" — the user still confirms each one.
// ---------------------------------------------------------------------------

export interface DueRecurring {
  rule: RecurringTransaction;
  daysUntil: number; // negative/0 = due or overdue
}

/**
 * A recurring rule counts as "fulfilled" for a month once any transaction
 * with the same merchant exists in that month — so it also self-reconciles
 * if the user just logs it normally instead of using the confirm flow.
 */
export function computeDueRecurring(recurring: RecurringTransaction[], transactions: Transaction[], from = new Date()): DueRecurring[] {
  const key = monthKey(from);
  const loggedMerchants = new Set(transactions.filter((t) => monthKey(t.date) === key).map((t) => t.merchant));

  // Deliberately does NOT roll forward to next month once the day passes
  // (unlike daysUntilDue for account bills) — an unconfirmed recurring
  // transaction should keep reading "overdue" for the rest of this month
  // rather than quietly jumping to next month's date.
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const todayDay = from.getUTCDate();
  const daysInThisMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();

  return recurring
    .filter((r) => !loggedMerchants.has(r.merchant))
    .map((rule) => ({ rule, daysUntil: Math.min(rule.dayOfMonth, daysInThisMonth) - todayDay }))
    .filter((d) => d.daysUntil <= 3) // surface a few days ahead of due; keeps showing (more overdue) until confirmed
    .sort((a, b) => a.daysUntil - b.daysUntil);
}

// ---------------------------------------------------------------------------
// Streaks & gamification
// ---------------------------------------------------------------------------

export function computeUnderBudgetStreak(transactions: Transaction[], envelopes: Envelope[], today = new Date()): number {
  const dailyBudget = envelopes.filter((e) => e.categoryId !== "savings").reduce((s, e) => s + e.monthlyLimit, 0) / 30;
  let streak = 0;
  for (let i = 0; i < 60; i += 1) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const dayStr = d.toISOString().slice(0, 10);
    const spend = transactions.filter((t) => t.date === dayStr && t.amount < 0).reduce((s, t) => s + -t.amount, 0);
    if (spend <= dailyBudget * 1.2) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

// ---------------------------------------------------------------------------
// Money tips — short, calm, situational advice. Ranked by what's actually
// pressing (a bill due this week beats a general savings-rate tip), and
// always closes with one reassuring note rather than an unbroken wall of
// warnings — the goal is awareness, not anxiety.
// ---------------------------------------------------------------------------

export interface MoneyTip {
  id: string;
  icon: string;
  title: string;
  body: string;
  tone: "alert" | "calm" | "positive";
}

export function computeMoneyTips(params: {
  health: HealthScoreBreakdown;
  accounts: Account[];
  upcomingDue: UpcomingDue[];
  streak: number;
}): MoneyTip[] {
  const { health, accounts, upcomingDue, streak } = params;
  const debts = accounts.filter((a) => (a.type === "credit" || a.type === "loan") && a.balance < 0);
  const issues: MoneyTip[] = [];

  const soonest = upcomingDue[0];
  if (soonest && soonest.daysUntil <= 7) {
    const when = soonest.daysUntil <= 0 ? "due today" : soonest.daysUntil === 1 ? "due tomorrow" : `due in ${soonest.daysUntil} days`;
    issues.push({
      id: "due-soon",
      icon: "📅",
      title: `${soonest.account.name} is ${when}`,
      body: soonest.account.minimumPayment
        ? `A minimum payment of ${formatCurrency(soonest.account.minimumPayment)} keeps you current. A calendar reminder now is cheaper than a late fee later.`
        : "Set a reminder now — a minute today beats a late fee later.",
      tone: "alert",
    });
  }

  const highestApr = [...debts].filter((a) => a.apr).sort((a, b) => (b.apr ?? 0) - (a.apr ?? 0))[0];
  if (highestApr && (highestApr.apr ?? 0) >= 0.15) {
    issues.push({
      id: "high-apr",
      icon: "🔥",
      title: `${highestApr.name} carries a ${formatPercent(highestApr.apr ?? 0, 1)} APR`,
      body: "Interest at that rate compounds faster than most investments grow. Even an extra $20/month above the minimum shortens payoff time more than it looks like it should.",
      tone: "alert",
    });
  }

  if (health.emergencyFundMonths < 3) {
    issues.push({
      id: "emergency-fund",
      icon: "☂",
      title: "Your emergency fund is still building",
      body: `${health.emergencyFundMonths.toFixed(1)} months of runway so far. Even $500 saved prevents most surprise expenses from turning into new debt — no pressure to hit 6 months overnight.`,
      tone: "calm",
    });
  }

  if (debts.length >= 2) {
    issues.push({
      id: "multiple-debts",
      icon: "🎯",
      title: "Juggling more than one balance?",
      body: "Snowball (smallest balance first) builds momentum fast. Avalanche (highest interest first) saves the most money overall. Either beats no plan at all.",
      tone: "calm",
    });
  }

  if (health.savingsRate < 0.1) {
    issues.push({
      id: "savings-rate",
      icon: "🌱",
      title: "Not sure where to start saving?",
      body: "The 50/30/20 rule is a simple floor, not a rule to stress over: roughly 50% needs, 30% wants, 20% savings. Adjust it to fit — it's a starting split, not a verdict.",
      tone: "calm",
    });
  }

  if (health.budgetAdherence < 0.6) {
    issues.push({
      id: "budget-adherence",
      icon: "🧭",
      title: "A few envelopes ran over this month",
      body: "That's information, not a verdict — either the limit was unrealistic or the month was unusual. Adjust whichever one is actually true.",
      tone: "calm",
    });
  }

  // Always close with one reassuring note, so this never reads as a wall of warnings.
  const reassurance: MoneyTip =
    streak >= 7
      ? {
          id: "streak",
          icon: "🔥",
          title: `${streak}-day on-budget streak`,
          body: "That consistency compounds. Momentum, not perfection, is what actually moves your score over time.",
          tone: "positive",
        }
      : {
          id: "doing-well",
          icon: "✨",
          title: health.score >= 670 ? "You're in solid shape" : "Every month of data makes this sharper",
          body:
            health.score >= 670
              ? "The main risk from here is lifestyle creep as income grows — automating extra savings the moment a raise lands keeps that from happening quietly."
              : "The score isn't a grade — it's a snapshot that updates the moment your numbers do. Small, consistent changes move it faster than one big overhaul.",
          tone: "positive",
        };

  return [...issues.slice(0, 2), reassurance];
}

export interface Badge {
  id: string;
  label: string;
  description: string;
  icon: string;
  earned: boolean;
}

export function computeBadges(params: {
  streak: number;
  healthScore: number;
  goals: Goal[];
  subscriptionsCanceled: number;
}): Badge[] {
  const { streak, healthScore, goals, subscriptionsCanceled } = params;
  const completedGoals = goals.filter((g) => g.saved >= g.target).length;

  return [
    { id: "streak-7", label: "Week of Discipline", description: "7-day on-budget streak", icon: "🔥", earned: streak >= 7 },
    { id: "streak-30", label: "Iron Budget", description: "30-day on-budget streak", icon: "🛡", earned: streak >= 30 },
    { id: "score-740", label: "Great Standing", description: "Financial wellness score 740+", icon: "★", earned: healthScore >= 740 },
    { id: "goal-1", label: "Goal Getter", description: "Completed a savings goal", icon: "🏁", earned: completedGoals >= 1 },
    { id: "xray-1", label: "Leak Patched", description: "Canceled a detected subscription", icon: "🩹", earned: subscriptionsCanceled >= 1 },
  ];
}
