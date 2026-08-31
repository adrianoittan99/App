import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Account, CategoryId, Envelope, Goal, RemoteHydratePayload, ThemeMode, Transaction } from "./types";
import { generateAccounts, generateEnvelopes, generateGoals, generateTransactions } from "./seedData";
import { sortTransactions } from "./calculations";
import { supabase } from "./supabaseClient";
import type { Database } from "./database.types";
import { notifyError, notifyUndo } from "./toastStore";

type AccountUpdate = Database["public"]["Tables"]["accounts"]["Update"];
type GoalUpdate = Database["public"]["Tables"]["goals"]["Update"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];

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
  updateTransaction: (id: string, patch: Partial<Omit<Transaction, "id">>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  updateEnvelopeLimit: (categoryId: CategoryId, limit: number) => Promise<void>;
  createAccount: (account: Omit<Account, "id">) => Promise<void>;
  updateAccount: (accountId: string, patch: Partial<Omit<Account, "id">>) => Promise<void>;
  deleteAccount: (accountId: string) => Promise<void>;
  addGoalContribution: (goalId: string, amount: number) => Promise<void>;
  createGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  updateGoal: (goalId: string, patch: Partial<Omit<Goal, "id">>) => Promise<void>;
  deleteGoal: (goalId: string) => Promise<void>;
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
  // Clears every logged transaction AND resets every account balance to $0
  // — a genuine fresh start for the ledger. Envelopes and goals are left
  // alone (use startOverRemoteAccount for those too).
  clearAllTransactions: () => Promise<void>;
  // Full "start over": wipes everything for a signed-in user and drops
  // onboarding_completed back to false, so the next visit re-runs onboarding.
  startOverRemoteAccount: () => Promise<void>;
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
            notifyError("Couldn't save that transaction — try again.");
            return;
          }
          set((s) => ({
            transactions: sortTransactions([
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
            ]),
            accounts: account ? s.accounts.map((a) => (a.id === account.id ? { ...a, balance: a.balance + t.amount } : a)) : s.accounts,
          }));
          if (account) {
            const { error: balErr } = await supabase.from("accounts").update({ balance: account.balance + t.amount }).eq("id", account.id);
            if (balErr) notifyError("Transaction saved, but the account balance didn't sync — check Balances.");
          }
          return;
        }

        set((s) => ({
          transactions: sortTransactions([{ ...t, id: `txn_${Date.now().toString(36)}` }, ...s.transactions]),
          accounts: account ? s.accounts.map((a) => (a.id === account.id ? { ...a, balance: a.balance + t.amount } : a)) : s.accounts,
        }));
      },

      updateTransaction: async (id, patch) => {
        const state = get();
        const old = state.transactions.find((t) => t.id === id);
        if (!old) return;
        const merged = { ...old, ...patch };
        const oldAccount = state.accounts.find((a) => a.name === old.account);
        const newAccount = state.accounts.find((a) => a.name === merged.account);

        const nextAccounts = state.accounts.map((a) => {
          let balance = a.balance;
          if (oldAccount && a.id === oldAccount.id) balance -= old.amount;
          if (newAccount && a.id === newAccount.id) balance += merged.amount;
          return { ...a, balance };
        });

        set({
          transactions: sortTransactions(state.transactions.map((t) => (t.id === id ? merged : t))),
          accounts: nextAccounts,
        });

        if (state.remoteMode && state.remoteUserId) {
          const dbPatch: TransactionUpdate = {
            account_id: newAccount?.id ?? null,
            date: merged.date,
            merchant: merged.merchant,
            category: merged.category,
            amount: merged.amount,
            note: merged.note ?? null,
          };
          const { error } = await supabase.from("transactions").update(dbPatch).eq("id", id);
          if (error) notifyError("Couldn't save your changes to this transaction.");

          const touched = new Set([oldAccount?.id, newAccount?.id].filter((v): v is string => Boolean(v)));
          for (const acctId of touched) {
            const acct = nextAccounts.find((a) => a.id === acctId);
            if (acct) {
              const { error: balErr } = await supabase.from("accounts").update({ balance: acct.balance }).eq("id", acctId);
              if (balErr) notifyError("Couldn't sync the account balance — check Balances.");
            }
          }
        }
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
          const { error } = await supabase.from("transactions").delete().eq("id", id);
          if (error) notifyError("Couldn't delete that transaction — try again.");
          if (account) {
            const { error: balErr } = await supabase.from("accounts").update({ balance: account.balance - txn.amount }).eq("id", account.id);
            if (balErr) notifyError("Deleted, but the account balance didn't sync — check Balances.");
          }
        }

        const { id: _discardId, ...withoutId } = txn;
        void _discardId;
        notifyUndo(`Deleted "${txn.merchant}"`, () => {
          void get().addTransaction(withoutId);
        });
      },

      updateEnvelopeLimit: async (categoryId, limit) => {
        const clamped = Math.max(0, limit);
        set((s) => ({
          envelopes: s.envelopes.map((e) => (e.categoryId === categoryId ? { ...e, monthlyLimit: clamped } : e)),
        }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const { error } = await supabase
            .from("envelopes")
            .update({ monthly_limit: clamped })
            .eq("user_id", state.remoteUserId)
            .eq("category", categoryId);
          if (error) notifyError("Couldn't save that envelope limit.");
        }
      },

      createAccount: async (account) => {
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const { data, error } = await supabase
            .from("accounts")
            .insert({
              user_id: state.remoteUserId,
              name: account.name,
              type: account.type,
              balance: account.balance,
              apr: account.apr ?? null,
              minimum_payment: account.minimumPayment ?? null,
              due_day: account.dueDay ?? null,
            })
            .select()
            .single();
          if (error || !data) {
            notifyError("Couldn't add that account — try again.");
            return;
          }
          set((s) => ({
            accounts: [
              ...s.accounts,
              {
                id: data.id,
                name: data.name,
                type: data.type,
                balance: Number(data.balance),
                apr: data.apr != null ? Number(data.apr) : undefined,
                minimumPayment: data.minimum_payment != null ? Number(data.minimum_payment) : undefined,
                dueDay: data.due_day ?? undefined,
              },
            ],
          }));
          return;
        }
        set((s) => ({ accounts: [...s.accounts, { ...account, id: `acct_${Date.now().toString(36)}` }] }));
      },

      updateAccount: async (accountId, patch) => {
        set((s) => ({
          accounts: s.accounts.map((a) => (a.id === accountId ? { ...a, ...patch } : a)),
        }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const dbPatch: AccountUpdate = {};
          if (patch.name !== undefined) dbPatch.name = patch.name;
          if (patch.type !== undefined) dbPatch.type = patch.type;
          if (patch.balance !== undefined) dbPatch.balance = patch.balance;
          if (patch.apr !== undefined) dbPatch.apr = patch.apr ?? null;
          if (patch.minimumPayment !== undefined) dbPatch.minimum_payment = patch.minimumPayment ?? null;
          if (patch.dueDay !== undefined) dbPatch.due_day = patch.dueDay ?? null;
          const { error } = await supabase.from("accounts").update(dbPatch).eq("id", accountId);
          if (error) notifyError("Couldn't save that account change.");
        }
      },

      deleteAccount: async (accountId) => {
        const state = get();
        const account = state.accounts.find((a) => a.id === accountId);
        if (!account) return;

        set((s) => ({ accounts: s.accounts.filter((a) => a.id !== accountId) }));
        if (state.remoteMode && state.remoteUserId) {
          const { error } = await supabase.from("accounts").delete().eq("id", accountId);
          if (error) notifyError("Couldn't delete that account — try again.");
        }

        const { id: _discardId, ...withoutId } = account;
        void _discardId;
        notifyUndo(`Removed "${account.name}"`, () => {
          void get().createAccount(withoutId);
        });
      },

      addGoalContribution: async (goalId, amount) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g)),
        }));
        const state = get();
        if (state.remoteMode) {
          const goal = state.goals.find((g) => g.id === goalId);
          if (goal) {
            const { error } = await supabase.from("goals").update({ saved: goal.saved }).eq("id", goalId);
            if (error) notifyError("Couldn't save that contribution.");
          }
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
            notifyError("Couldn't create that goal — try again.");
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

      updateGoal: async (goalId, patch) => {
        set((s) => ({
          goals: s.goals.map((g) => (g.id === goalId ? { ...g, ...patch } : g)),
        }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const dbPatch: GoalUpdate = {};
          if (patch.name !== undefined) dbPatch.name = patch.name;
          if (patch.icon !== undefined) dbPatch.icon = patch.icon;
          if (patch.color !== undefined) dbPatch.color = patch.color;
          if (patch.target !== undefined) dbPatch.target = patch.target;
          if (patch.saved !== undefined) dbPatch.saved = patch.saved;
          if (patch.targetDate !== undefined) dbPatch.target_date = patch.targetDate || null;
          const { error } = await supabase.from("goals").update(dbPatch).eq("id", goalId);
          if (error) notifyError("Couldn't save that goal's changes.");
        }
      },

      deleteGoal: async (goalId) => {
        const state = get();
        const goal = state.goals.find((g) => g.id === goalId);
        if (!goal) return;

        set((s) => ({ goals: s.goals.filter((g) => g.id !== goalId) }));
        if (state.remoteMode && state.remoteUserId) {
          const { error } = await supabase.from("goals").delete().eq("id", goalId);
          if (error) notifyError("Couldn't delete that goal — try again.");
        }

        const { id: _discardId, ...withoutId } = goal;
        void _discardId;
        notifyUndo(`Deleted "${goal.name}"`, () => {
          void get().createGoal(withoutId);
        });
      },

      toggleTheme: () => get().setTheme(get().theme === "dark" ? "light" : "dark"),

      setTheme: (mode) => {
        set({ theme: mode });
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          void supabase
            .from("profiles")
            .update({ theme: mode })
            .eq("id", state.remoteUserId)
            .then(({ error }) => {
              if (error) notifyError("Theme didn't sync to your account, but it's applied here.");
            });
        }
      },

      cancelSubscription: async (merchantKey) => {
        set((s) => ({ canceledSubscriptions: Array.from(new Set([...s.canceledSubscriptions, merchantKey])) }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const { error } = await supabase
            .from("canceled_subscriptions")
            .upsert({ user_id: state.remoteUserId, merchant_key: merchantKey }, { onConflict: "user_id,merchant_key" });
          if (error) notifyError("Couldn't save that cancellation.");
        }
      },

      reinstateSubscription: async (merchantKey) => {
        set((s) => ({ canceledSubscriptions: s.canceledSubscriptions.filter((k) => k !== merchantKey) }));
        const state = get();
        if (state.remoteMode && state.remoteUserId) {
          const { error } = await supabase
            .from("canceled_subscriptions")
            .delete()
            .eq("user_id", state.remoteUserId)
            .eq("merchant_key", merchantKey);
          if (error) notifyError("Couldn't undo that cancellation.");
        }
      },

      markIntroSeen: () => set({ hasSeenIntro: true }),

      resetDemoData: () => set({ ...freshDemoData(), canceledSubscriptions: [] }),

      hydrateFromRemote: (payload, userId) =>
        set({
          transactions: sortTransactions(payload.transactions),
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

      clearAllTransactions: async () => {
        const state = get();
        set((s) => ({ transactions: [], accounts: s.accounts.map((a) => ({ ...a, balance: 0 })) }));
        if (state.remoteMode && state.remoteUserId) {
          const [txnRes, acctRes] = await Promise.all([
            supabase.from("transactions").delete().eq("user_id", state.remoteUserId),
            supabase.from("accounts").update({ balance: 0 }).eq("user_id", state.remoteUserId),
          ]);
          if (txnRes.error || acctRes.error) notifyError("Some of that may not have saved — refresh to double-check.");
        }
      },

      startOverRemoteAccount: async () => {
        const state = get();
        if (!state.remoteMode || !state.remoteUserId) return;
        const uid = state.remoteUserId;
        const results = await Promise.all([
          supabase.from("transactions").delete().eq("user_id", uid),
          supabase.from("envelopes").delete().eq("user_id", uid),
          supabase.from("goals").delete().eq("user_id", uid),
          supabase.from("canceled_subscriptions").delete().eq("user_id", uid),
          supabase.from("accounts").delete().eq("user_id", uid),
        ]);
        const profileRes = await supabase.from("profiles").update({ onboarding_completed: false }).eq("id", uid);
        if (results.some((r) => r.error) || profileRes.error) {
          notifyError("Some of that may not have fully cleared — refresh and check before re-onboarding.");
        }
        set({ transactions: [], accounts: [], envelopes: [], goals: [], canceledSubscriptions: [] });
      },
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
