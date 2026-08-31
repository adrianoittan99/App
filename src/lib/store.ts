import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, CategoryId, Envelope, Goal, RemoteHydratePayload, ThemeMode, Transaction } from "./types";
import { generateAccounts, generateEnvelopes, generateGoals, generateTransactions } from "./seedData";
import { supabase } from "./supabaseClient";

interface AppState {
  transactions: Transaction[];
  envelopes: Envelope[];
  goals: Goal[];
  accounts: Account[];
  theme: ThemeMode;
  canceledSubscriptions: string[]; // merchant keys
  hasSeenIntro: boolean;

  // When true, the arrays above are a signed-in user's real data and every
  // mutation below also writes through to Supabase. When false, this is the
  // local-only demo (landing page preview, /app without a session) and
  // nothing ever touches the network.
  remoteMode: boolean;
  remoteUserId: string | null;

  // Transient UI state: lets any component (e.g. an InfoTip's "go add one"
  // action) open the Add Transaction modal without prop-drilling through
  // AppShell. Excluded from persistence — see partialize below.
  addTransactionModalOpen: boolean;

  addTransaction: (t: Omit<Transaction, "id">) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateEnvelopeLimit: (categoryId: CategoryId, limit: number) => Promise<void>;
  updateAccountBalance: (accountId: string, balance: number) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number) => Promise<void>;
  createGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  cancelSubscription: (merchantKey: string) => Promise<void>;
  reinstateSubscription: (merchantKey: string) => Promise<void>;
  markIntroSeen: () => void;
  resetDemoData: () => void;
  hydrateFromRemote: (payload: RemoteHydratePayload, userId: string) => void;
  exitRemoteMode: () => void;
  openAddTransactionModal: () => void;
  closeAddTransactionModal: () => void;
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
    (set, get) => ({
      ...freshDemoData(),
      theme: "dark",
      canceledSubscriptions: [],
      hasSeenIntro: false,
      remoteMode: false,
      remoteUserId: null,
      addTransactionModalOpen: false,

      addTransaction: async (t) => {
        const state = get();
        const account = state.accounts.find((a) => a.name === t.account);

        if (state.remoteMode && state.remoteUserId) {
          const { data, error } = await supabase
            .from("transactions")
            .insert({
              user_id: state.remoteUserId,
              account_id: account?.id ?? null,
              date: t.date,
              merchant: t.merchant,
              category: t.category,
              amount: t.amount,
              note: t.note ?? null,
            })
            .select()
            .single();
          if (error || !data) {
            console.error("Failed to save transaction", error);
            return;
          }
          set((s) => ({
            transactions: [
              {
                id: data.id,
                date: data.date,
                merchant: data.merchant,
                category: data.category as CategoryId,
                amount: Number(data.amount),
                account: t.account,
                note: data.note ?? undefined,
              },
              ...s.transactions,
            ],
            accounts: account ? s.accounts.map((a) => (a.id === account.id ? { ...a, balance: a.balance + t.amount } : a)) : s.accounts,
          }));
          if (account) {
            await supabase.from("accounts").update({ balance: account.balance + t.amount }).eq("id", account.id);
          }
          return;
        }

        set((s) => ({
          transactions: [{ ...t, id: `txn_${Date.now().toString(36)}` }, ...s.transactions],
          accounts: account ? s.accounts.map((a) => (a.id === account.id ? { ...a, balance: a.balance + t.amount } : a)) : s.accounts,
        }));
      },

      deleteTransaction: async (id) => {
        const state = get();
        const txn = state.transactions.find((t) => t.id === id);
        if (!txn) return;
        const account = state.accounts.find((a) => a.name === txn.account);

        set((s) => ({
          transactions: s.transactions.filter((t) => t.id !== id),
          accounts: account ? s.accounts.map((a) => (a.id === account.id ? { ...a, balance: a.balance - txn.amount } : a)) : s.accounts,
        }));

        if (state.remoteMode && state.remoteUserId) {
          await supabase.from("transactions").delete().eq("id", id);
          if (account) {
            await supabase.from("accounts").update({ balance: account.balance - txn.amount }).eq("id", account.id);
          }
        }
      },

      updateEnvelopeLimit: async (categoryId, limit) => {
        const clamped = Math.max(0, limit);
        set((s) => ({
          envelopes: s.envelopes.map((e) => (e.categoryId === categoryId ? { ...e, monthlyLimit: clamped } : e)),
        }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          await supabase
            .from("envelopes")
            .update({ monthly_limit: clamped })
            .eq("user_id", state.remoteUserId)
            .eq("category", categoryId);
        }
      },

      updateAccountBalance: async (accountId, balance) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, balance } : a)),
        }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          await supabase.from("accounts").update({ balance }).eq("id", accountId);
        }
      },

      addGoalContribution: async (goalId, amount) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g)),
        }));
        const state = get();
        if (state.remoteMode) {
          const goal = state.goals.find((g) => g.id === goalId);
          if (goal) await supabase.from("goals").update({ saved: goal.saved }).eq("id", goalId);
        }
      },

      createGoal: async (goal) => {
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const { data, error } = await supabase
            .from("goals")
            .insert({
              user_id: state.remoteUserId,
              name: goal.name,
              icon: goal.icon,
              color: goal.color,
              target: goal.target,
              saved: goal.saved,
              target_date: goal.targetDate || null,
            })
            .select()
            .single();
          if (error || !data) {
            console.error("Failed to create goal", error);
            return;
          }
          set((s) => ({
            goals: [
              ...s.goals,
              {
                id: data.id,
                name: data.name,
                icon: data.icon,
                color: data.color,
                target: Number(data.target),
                saved: Number(data.saved),
                targetDate: data.target_date ?? "",
              },
            ],
          }));
          return;
        }
        set((s) => ({ goals: [...s.goals, { ...goal, id: `goal_${Date.now().toString(36)}` }] }));
      },

      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

      setTheme: (mode) => {
        set({ theme: mode });
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          void supabase.from("profiles").update({ theme: mode }).eq("id", state.remoteUserId);
        }
      },

      cancelSubscription: async (merchantKey) => {
        set((s) => ({ canceledSubscriptions: Array.from(new Set([...s.canceledSubscriptions, merchantKey])) }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          await supabase
            .from("canceled_subscriptions")
            .upsert({ user_id: state.remoteUserId, merchant_key: merchantKey }, { onConflict: "user_id,merchant_key" });
        }
      },

      reinstateSubscription: async (merchantKey) => {
        set((s) => ({ canceledSubscriptions: s.canceledSubscriptions.filter((k) => k !== merchantKey) }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          await supabase
            .from("canceled_subscriptions")
            .delete()
            .eq("user_id", state.remoteUserId)
            .eq("merchant_key", merchantKey);
        }
      },

      markIntroSeen: () => set({ hasSeenIntro: true }),

      resetDemoData: () => set({ ...freshDemoData(), canceledSubscriptions: [] }),

      hydrateFromRemote: (payload, userId) =>
        set({
          transactions: payload.transactions,
          accounts: payload.accounts,
          envelopes: payload.envelopes,
          goals: payload.goals,
          canceledSubscriptions: payload.canceledSubscriptions,
          theme: payload.theme ?? "dark",
          remoteMode: true,
          remoteUserId: userId,
        }),

      exitRemoteMode: () =>
        set((state) =>
          state.remoteMode ? { ...freshDemoData(), canceledSubscriptions: [], remoteMode: false, remoteUserId: null } : {}
        ),

      openAddTransactionModal: () => set({ addTransactionModalOpen: true }),
      closeAddTransactionModal: () => set({ addTransactionModalOpen: false }),
    }),
    {
      name: "aurora-budget-storage",
      version: 4,
      // Transient UI flags shouldn't survive a reload / follow the user
      // between sessions — strip them out of the persisted snapshot.
      partialize: (state) => {
        const { addTransactionModalOpen: _addTransactionModalOpen, ...rest } = state;
        return rest;
      },
    }
  )
);
