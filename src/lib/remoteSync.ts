import { supabase } from "./supabaseClient";
import { useAppStore } from "./store";
import type { Account, CategoryId, Envelope, Goal, ThemeMode, Transaction } from "./types";
import { EXPENSE_CATEGORIES } from "./categories";

export async function fetchOnboardingStatus(userId: string): Promise<boolean> {
  const { data, error } = await supabase.from("profiles").select("onboarding_completed").eq("id", userId).single();
  if (error) {
    console.error("Failed to load profile", error);
    return false;
  }
  return Boolean(data?.onboarding_completed);
}

/** Fetches everything for a signed-in user and replaces the store's data with it. */
export async function hydrateStoreFromSupabase(userId: string): Promise<void> {
  const [accountsRes, envelopesRes, goalsRes, transactionsRes, canceledRes, profileRes] = await Promise.all([
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("envelopes").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId).order("date", { ascending: false }),
    supabase.from("canceled_subscriptions").select("merchant_key").eq("user_id", userId),
    supabase.from("profiles").select("theme").eq("id", userId).single(),
  ]);

  const accounts: Account[] = (accountsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    balance: Number(r.balance),
    apr: r.apr != null ? Number(r.apr) : undefined,
    minimumPayment: r.minimum_payment != null ? Number(r.minimum_payment) : undefined,
    dueDay: r.due_day ?? undefined,
  }));
  const accountNameById = new Map(accounts.map((a) => [a.id, a.name]));

  const envelopes: Envelope[] = (envelopesRes.data ?? []).map((r) => ({
    id: r.id,
    categoryId: r.category as CategoryId,
    monthlyLimit: Number(r.monthly_limit),
  }));

  const goals: Goal[] = (goalsRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    color: r.color,
    target: Number(r.target),
    saved: Number(r.saved),
    targetDate: r.target_date ?? "",
  }));

  const transactions: Transaction[] = (transactionsRes.data ?? []).map((r) => ({
    id: r.id,
    date: r.date,
    merchant: r.merchant,
    category: r.category as CategoryId,
    amount: Number(r.amount),
    account: (r.account_id && accountNameById.get(r.account_id)) || "Unassigned",
    note: r.note ?? undefined,
  }));

  const canceledSubscriptions = (canceledRes.data ?? []).map((r) => r.merchant_key);
  const theme = (profileRes.data?.theme as ThemeMode | undefined) ?? "dark";

  useAppStore.getState().hydrateFromRemote({ transactions, accounts, envelopes, goals, canceledSubscriptions, theme }, userId);
}

export interface OnboardingAnswers {
  displayName: string;
  currentAge: number | null;
  checkingBalance: number;
  savingsBalance: number;
  creditCardDebt: number; // positive number = amount owed
  monthlyIncome: number;
  savingsRateTarget: number; // 0..1
  focusCategories: CategoryId[];
  firstGoal: { name: string; target: number; months: number } | null;
}

/**
 * Turns onboarding answers into real starting rows: accounts, one envelope
 * per category (focus categories get pulled ~20% tighter), an optional
 * first goal, and marks the profile as onboarded.
 */
export async function completeOnboarding(userId: string, input: OnboardingAnswers): Promise<void> {
  const accountRows: { name: string; type: "checking" | "savings" | "credit"; balance: number }[] = [
    { name: "Checking", type: "checking", balance: input.checkingBalance },
  ];
  if (input.savingsBalance > 0) accountRows.push({ name: "Savings", type: "savings", balance: input.savingsBalance });
  if (input.creditCardDebt > 0) accountRows.push({ name: "Credit Card", type: "credit", balance: -Math.abs(input.creditCardDebt) });

  const { error: accountsError } = await supabase.from("accounts").insert(accountRows.map((a) => ({ ...a, user_id: userId })));
  if (accountsError) throw accountsError;

  const envelopeLimits = computeStarterEnvelopeLimits(input.monthlyIncome, input.savingsRateTarget, input.focusCategories);
  const { error: envelopesError } = await supabase
    .from("envelopes")
    .insert(Object.entries(envelopeLimits).map(([category, monthly_limit]) => ({ user_id: userId, category, monthly_limit })));
  if (envelopesError) throw envelopesError;

  if (input.firstGoal) {
    const targetDate = new Date(Date.now() + input.firstGoal.months * 30 * 86400000).toISOString().slice(0, 10);
    const { error: goalError } = await supabase.from("goals").insert({
      user_id: userId,
      name: input.firstGoal.name,
      icon: "◎",
      color: "#8b5cf6",
      target: input.firstGoal.target,
      saved: 0,
      target_date: targetDate,
    });
    if (goalError) throw goalError;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName || null,
      current_age: input.currentAge,
      onboarding_completed: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);
  if (profileError) throw profileError;
}

// A simple, opinionated starting budget split. Not financial advice — just
// a sane default the user reshapes from day one on the Envelopes page.
const BASE_SHARE: Record<string, number> = {
  housing: 0.33,
  groceries: 0.1,
  dining: 0.06,
  transport: 0.06,
  subscriptions: 0.03,
  utilities: 0.05,
  shopping: 0.06,
  health: 0.04,
  entertainment: 0.04,
  travel: 0.03,
  savings: 0.15,
  other: 0.05,
};

function computeStarterEnvelopeLimits(
  monthlyIncome: number,
  savingsRateTarget: number,
  focusCategories: CategoryId[]
): Record<string, number> {
  const focusSet = new Set(focusCategories);
  const limits: Record<string, number> = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    const share = cat.id === "savings" ? Math.max(BASE_SHARE.savings, savingsRateTarget) : BASE_SHARE[cat.id] ?? 0.04;
    const adjusted = focusSet.has(cat.id) ? share * 0.8 : share;
    limits[cat.id] = Math.max(0, Math.round(monthlyIncome * adjusted));
  });
  return limits;
}
