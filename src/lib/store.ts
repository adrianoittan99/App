import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, CategoryId, Envelope, Goal, ThemeMode, Transaction } from "./types";
import { generateAccounts, generateEnvelopes, generateGoals, generateTransactions } from "./seedData";

interface AppState {
  transactions: Transaction[];
  envelopes: Envelope[];
  goals: Goal[];
  accounts: Account[];
  theme: ThemeMode;
  canceledSubscriptions: string[]; // merchant keys
  hasSeenIntro: boolean;

  addTransaction: (t: Omit<Transaction, "id">) => void;
  deleteTransaction: (id: string) => void;
  updateEnvelopeLimit: (categoryId: CategoryId, limit: number) => void;
  addGoalContribution: (goalId: string, amount: number) => void;
  createGoal: (goal: Omit<Goal, "id">) => void;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  cancelSubscription: (merchantKey: string) => void;
  reinstateSubscription: (merchantKey: string) => void;
  markIntroSeen: () => void;
  resetDemoData: () => void;
}

function freshDemoData() {
  return {
    transactions: generateTransactions(6),
    accounts: generateAccounts(),
    goals: generateGoals(),
    envelopes: generateEnvelopes(),
  };
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...freshDemoData(),
      theme: "dark",
      canceledSubscriptions: [],
      hasSeenIntro: false,

      addTransaction: (t) =>
        set((state) => ({
          transactions: [{ ...t, id: `txn_${Date.now().toString(36)}` }, ...state.transactions],
        })),

      deleteTransaction: (id) =>
        set((state) => ({ transactions: state.transactions.filter((t) => t.id !== id) })),

      updateEnvelopeLimit: (categoryId, limit) =>
        set((state) => ({
          envelopes: state.envelopes.map((e) => (e.categoryId === categoryId ? { ...e, monthlyLimit: Math.max(0, limit) } : e)),
        })),

      addGoalContribution: (goalId, amount) =>
        set((state) => ({
          goals: state.goals.map((g) => (g.id === goalId ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g)),
        })),

      createGoal: (goal) =>
        set((state) => ({ goals: [...state.goals, { ...goal, id: `goal_${Date.now().toString(36)}` }] })),

      toggleTheme: () => set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (mode) => set({ theme: mode }),

      cancelSubscription: (merchantKey) =>
        set((state) => ({ canceledSubscriptions: Array.from(new Set([...state.canceledSubscriptions, merchantKey])) })),

      reinstateSubscription: (merchantKey) =>
        set((state) => ({ canceledSubscriptions: state.canceledSubscriptions.filter((k) => k !== merchantKey) })),

      markIntroSeen: () => set({ hasSeenIntro: true }),

      resetDemoData: () => set({ ...freshDemoData(), canceledSubscriptions: [] }),
    }),
    {
      name: "aurora-budget-storage",
      version: 3,
    }
  )
);
