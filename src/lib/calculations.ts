import type {
  Account,
  CategoryId,
  Envelope,
  FutureProjectionPoint,
  Goal,
  MoneyWeather,
  Subscription,
  Transaction,
  WeatherKind,
} from "./types";

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

// ---------------------------------------------------------------------------
// Summaries
// ---------------------------------------------------------------------------

export interface MonthlySummary {
  income: number;
  expenses: number; // positive number
  net: number;
  byCategory: Partial<Record<CategoryId, number>>; // positive spend per category
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
  return accounts.filter((a) => a.type === "credit" && a.balance < 0).reduce((sum, a) => sum + -a.balance, 0);
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

  const savingsRate = income > 0 ? (income - expenses) / income : 0;
  const savingsScore01 = clamp01((savingsRate + 0.05) / 0.35); // 0% -> ~0.14, 20% -> ~0.71, 30%+ -> 1

  const relevant = envelopeProgress.filter((e) => e.categoryId !== "income");
  const withinBudgetCount = relevant.filter((e) => e.pct <= 1).length;
  const budgetAdherence = relevant.length ? withinBudgetCount / relevant.length : 1;

  const emergencyFundMonths = monthlyExpenseBaseline > 0 ? liquidBalance / monthlyExpenseBaseline : 0;
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
