import { useState } from "react";
import { useAppStore } from "../lib/store";
import { computeDebtBalance, computeLiquidBalance, computeNetWorth, computeUpcomingDue } from "../lib/calculations";
import { formatCurrency, formatPercent } from "../lib/format";
import type { Account } from "../lib/types";
import { StatTile } from "../components/dashboard/StatTile";
import { MoneyTips } from "../components/balances/MoneyTips";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { InfoTip } from "../components/ui/InfoTip";
import { Pill } from "../components/ui/Pill";

const CASH_TYPES: Account["type"][] = ["checking", "savings", "investment"];
const DEBT_TYPES: Account["type"][] = ["credit", "loan"];

const TYPE_LABEL: Record<Account["type"], string> = {
  checking: "Checking",
  savings: "Savings",
  investment: "Investment",
  credit: "Credit card",
  loan: "Loan",
};

export function BalancesPage() {
  const accounts = useAppStore((s) => s.accounts);
  const transactions = useAppStore((s) => s.transactions);
  const createAccount = useAppStore((s) => s.createAccount);
  const updateAccount = useAppStore((s) => s.updateAccount);
  const deleteAccount = useAppStore((s) => s.deleteAccount);

  const [addOpen, setAddOpen] = useState(false);
  const linkedCount = (name: string) => transactions.filter((t) => t.account === name).length;

  const cashAccounts = accounts.filter((a) => CASH_TYPES.includes(a.type));
  const debtAccounts = accounts.filter((a) => DEBT_TYPES.includes(a.type));
  const totalAssets = cashAccounts.reduce((s, a) => s + a.balance, 0);
  const totalDebt = computeDebtBalance(accounts);
  const netWorth = computeNetWorth(accounts);
  const liquidBalance = computeLiquidBalance(accounts);
  const upcomingDue = computeUpcomingDue(accounts);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          Balances
          <InfoTip title="Assets vs. debt">
            Everything you own (checking, savings, investments) minus everything you owe (credit cards, loans) is your net
            worth. Debt accounts here can carry an interest rate, a minimum payment, and a due date — so a bill due soon or
            a high-interest balance is something you actually see, not something that quietly compounds in the background.
          </InfoTip>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Everything you own and owe, in one place.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatTile label="Total assets" value={formatCurrency(totalAssets)} icon="↑" accent="var(--green)" delay={0} />
        <StatTile label="Total debt" value={formatCurrency(totalDebt)} icon="↓" accent="var(--red)" delay={0.05} />
        <StatTile label="Net worth" value={formatCurrency(netWorth)} icon="●" accent="var(--violet)" delay={0.1} />
      </div>

      <MoneyTips />

      {upcomingDue.length > 0 && upcomingDue[0].daysUntil <= 14 && (
        <Card>
          <CardHeader title="Coming up" subtitle="Debt payments due soonest" />
          <div className="space-y-2">
            {upcomingDue.slice(0, 4).map(({ account, daysUntil }) => (
              <div key={account.id} className="flex items-center justify-between text-sm">
                <span className="font-medium">{account.name}</span>
                <span className={`tabular ${daysUntil <= 3 ? "text-[var(--red)] font-semibold" : "text-[var(--text-muted)]"}`}>
                  {daysUntil <= 0 ? "Due today" : daysUntil === 1 ? "Due tomorrow" : `Due in ${daysUntil} days`}
                  {account.minimumPayment ? ` · ${formatCurrency(account.minimumPayment)} min` : ""}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Cash & investments" subtitle="Click a balance to correct it" />
        <div className="divide-y divide-[var(--border)]">
          {cashAccounts.map((a) => (
            <CashRow key={a.id} account={a} linkedCount={linkedCount(a.name)} onSave={(patch) => updateAccount(a.id, patch)} onDelete={() => deleteAccount(a.id)} />
          ))}
          {cashAccounts.length === 0 && <p className="text-sm text-[var(--text-muted)] py-4">No cash accounts yet.</p>}
        </div>
      </Card>

      <Card>
        <CardHeader title="Debts & bills" subtitle="Credit cards and loans — rate, minimum, and due date" />
        <div className="space-y-3">
          {debtAccounts.map((a) => (
            <DebtCard key={a.id} account={a} linkedCount={linkedCount(a.name)} onSave={(patch) => updateAccount(a.id, patch)} onDelete={() => deleteAccount(a.id)} />
          ))}
          {debtAccounts.length === 0 && <p className="text-sm text-[var(--text-muted)] py-2">No debts tracked — nice.</p>}
        </div>
      </Card>

      <Card>
        {addOpen ? (
          <AddAccountForm onCancel={() => setAddOpen(false)} onCreate={async (a) => { await createAccount(a); setAddOpen(false); }} />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Missing an account?</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Add another card, loan, or cash account.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)} icon={<span>+</span>}>
              Add account
            </Button>
          </div>
        )}
      </Card>

      <p className="text-xs text-[var(--text-faint)]">
        Liquid balance (checking + savings): <span className="tabular font-medium text-[var(--text-muted)]">{formatCurrency(liquidBalance)}</span> — this
        is what your Emergency runway is measured against.
      </p>
    </div>
  );
}

function CashRow({
  account,
  linkedCount,
  onSave,
  onDelete,
}: {
  account: Account;
  linkedCount: number;
  onSave: (patch: Partial<Account>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draft, setDraft] = useState(String(account.balance));

  function commit() {
    const val = parseFloat(draft);
    if (!Number.isNaN(val)) onSave({ balance: val });
    else setDraft(String(account.balance));
    setEditing(false);
  }

  if (confirmDelete) {
    return (
      <div className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-[var(--text-muted)]">
          Remove <strong>{account.name}</strong>?
          {linkedCount > 0 ? ` ${linkedCount} transaction${linkedCount === 1 ? "" : "s"} reference it — they'll show as "Unassigned."` : ""} Can't be undone.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="danger" onClick={onDelete}>
            Remove
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{account.name}</p>
        <p className="text-xs text-[var(--text-muted)]">{TYPE_LABEL[account.type]}</p>
      </div>
      <div className="flex items-center gap-3">
        {editing ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-[var(--text-muted)]">$</span>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === "Enter") commit();
                if (e.key === "Escape") { setDraft(String(account.balance)); setEditing(false); }
              }}
              type="number"
              step="0.01"
              className="w-28 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 text-sm tabular text-right outline-none focus:border-[var(--violet)]"
            />
          </div>
        ) : (
          <button
            onClick={() => { setDraft(String(account.balance)); setEditing(true); }}
            className={`text-sm font-semibold tabular underline decoration-dotted decoration-[var(--text-faint)] hover:decoration-[var(--violet)] ${account.balance < 0 ? "text-[var(--red)]" : ""}`}
          >
            {formatCurrency(account.balance, true)}
          </button>
        )}
        <button onClick={() => setConfirmDelete(true)} className="text-xs text-[var(--text-faint)] hover:text-[var(--red)]">
          Remove
        </button>
      </div>
    </div>
  );
}

function DebtCard({
  account,
  linkedCount,
  onSave,
  onDelete,
}: {
  account: Account;
  linkedCount: number;
  onSave: (patch: Partial<Account>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [balance, setBalance] = useState(String(Math.abs(account.balance)));
  const [apr, setApr] = useState(account.apr ? String(Math.round(account.apr * 10000) / 100) : "");
  const [minPayment, setMinPayment] = useState(account.minimumPayment ? String(account.minimumPayment) : "");
  const [dueDay, setDueDay] = useState(account.dueDay ? String(account.dueDay) : "");

  function commit() {
    const owed = parseFloat(balance);
    const patch: Partial<Account> = {};
    if (!Number.isNaN(owed)) patch.balance = -Math.abs(owed);
    patch.apr = apr ? Math.abs(parseFloat(apr)) / 100 : undefined;
    patch.minimumPayment = minPayment ? Math.abs(parseFloat(minPayment)) : undefined;
    patch.dueDay = dueDay ? Math.min(31, Math.max(1, Math.round(parseFloat(dueDay)))) : undefined;
    onSave(patch);
    setEditing(false);
  }

  return (
    <div className="rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <p className="text-sm font-semibold">{account.name}</p>
          <p className="text-xs text-[var(--text-muted)]">{TYPE_LABEL[account.type]}</p>
        </div>
        <span className="text-base font-semibold tabular text-[var(--red)]">{formatCurrency(account.balance, true)}</span>
      </div>

      {editing ? (
        <div className="grid sm:grid-cols-3 gap-3 mt-3">
          <Field label="Amount owed">
            <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" min="0" step="0.01" className={inputClass} />
          </Field>
          <Field label="APR %">
            <input value={apr} onChange={(e) => setApr(e.target.value)} type="number" min="0" step="0.01" placeholder="e.g. 22.99" className={inputClass} />
          </Field>
          <Field label="Minimum payment">
            <input value={minPayment} onChange={(e) => setMinPayment(e.target.value)} type="number" min="0" step="1" className={inputClass} />
          </Field>
          <Field label="Due day of month">
            <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} type="number" min="1" max="31" placeholder="1-31" className={inputClass} />
          </Field>
          <div className="flex items-end gap-2 sm:col-span-2">
            <Button size="sm" onClick={commit}>Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
            <button onClick={() => setConfirmDelete(true)} className="text-xs text-[var(--text-faint)] hover:text-[var(--red)] ml-auto">Remove account</button>
          </div>
        </div>
      ) : confirmDelete ? (
        <div className="mt-2">
          <p className="text-xs text-[var(--text-muted)] mb-2">
            Remove <strong>{account.name}</strong>?
            {linkedCount > 0 ? ` ${linkedCount} transaction${linkedCount === 1 ? "" : "s"} reference it — they'll show as "Unassigned."` : ""} Can't be undone.
          </p>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="danger" onClick={onDelete}>
              Remove
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap mt-2">
          {account.apr !== undefined && <Pill tone={account.apr >= 0.15 ? "red" : "neutral"}>{formatPercent(account.apr, 2)} APR</Pill>}
          {account.minimumPayment !== undefined && <Pill>{formatCurrency(account.minimumPayment)} min/mo</Pill>}
          {account.dueDay !== undefined && <Pill tone="amber">Due the {ordinal(account.dueDay)}</Pill>}
          <button onClick={() => setEditing(true)} className="text-xs font-medium text-[var(--violet)] hover:underline ml-auto">
            {account.apr === undefined && account.dueDay === undefined ? "Add rate & due date →" : "Edit →"}
          </button>
        </div>
      )}
    </div>
  );
}

function AddAccountForm({ onCancel, onCreate }: { onCancel: () => void; onCreate: (account: Omit<Account, "id">) => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<Account["type"]>("checking");
  const [balance, setBalance] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [dueDay, setDueDay] = useState("");
  const isDebt = type === "credit" || type === "loan";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const raw = Math.abs(parseFloat(balance) || 0);
    onCreate({
      name: name.trim(),
      type,
      balance: isDebt ? -raw : raw,
      apr: isDebt && apr ? Math.abs(parseFloat(apr)) / 100 : undefined,
      minimumPayment: isDebt && minPayment ? Math.abs(parseFloat(minPayment)) : undefined,
      dueDay: isDebt && dueDay ? Math.min(31, Math.max(1, Math.round(parseFloat(dueDay)))) : undefined,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Chase Sapphire" className={inputClass} required />
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value as Account["type"])} className={inputClass}>
            <option value="checking">Checking</option>
            <option value="savings">Savings</option>
            <option value="investment">Investment</option>
            <option value="credit">Credit card</option>
            <option value="loan">Loan</option>
          </select>
        </Field>
      </div>
      <Field label={isDebt ? "Amount owed" : "Current balance"}>
        <input value={balance} onChange={(e) => setBalance(e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" className={inputClass} />
      </Field>
      {isDebt && (
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="APR % (optional)">
            <input value={apr} onChange={(e) => setApr(e.target.value)} type="number" min="0" step="0.01" placeholder="e.g. 22.99" className={inputClass} />
          </Field>
          <Field label="Minimum payment (optional)">
            <input value={minPayment} onChange={(e) => setMinPayment(e.target.value)} type="number" min="0" step="1" className={inputClass} />
          </Field>
          <Field label="Due day (optional)">
            <input value={dueDay} onChange={(e) => setDueDay(e.target.value)} type="number" min="1" max="31" placeholder="1-31" className={inputClass} />
          </Field>
        </div>
      )}
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm">Add account</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)] tabular";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-[var(--text-muted)] mb-1 block">{label}</label>
      {children}
    </div>
  );
}

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
