import { useState } from "react";
import { useAppStore } from "../lib/store";
import { computeDueRecurring } from "../lib/calculations";
import { CATEGORIES, CATEGORY_LIST } from "../lib/categories";
import { formatCurrency } from "../lib/format";
import type { CategoryId, RecurringTransaction } from "../lib/types";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { InfoTip } from "../components/ui/InfoTip";

export function RecurringPage() {
  const recurring = useAppStore((s) => s.recurringTransactions);
  const transactions = useAppStore((s) => s.transactions);
  const accounts = useAppStore((s) => s.accounts);
  const createRecurring = useAppStore((s) => s.createRecurring);
  const updateRecurring = useAppStore((s) => s.updateRecurring);
  const deleteRecurring = useAppStore((s) => s.deleteRecurring);
  const confirmRecurring = useAppStore((s) => s.confirmRecurring);

  const [addOpen, setAddOpen] = useState(false);
  const due = computeDueRecurring(recurring, transactions);
  const dueIds = new Set(due.map((d) => d.rule.id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          Recurring
          <InfoTip title="Why this exists">
            The predictable stuff — rent, payroll, subscriptions — doesn't need re-typing every month. Set it up once here.
            Aurora never logs it for you automatically: it surfaces what's due and you confirm with one tap, so your ledger
            only ever has things you actually approved.
          </InfoTip>
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Set it once — confirm it each month in seconds.</p>
      </div>

      {due.length > 0 && (
        <Card>
          <CardHeader title="Due this month" subtitle="Confirm to log it, or skip if it didn't happen" />
          <div className="space-y-2.5">
            {due.map(({ rule, daysUntil }) => (
              <DueRow key={rule.id} rule={rule} daysUntil={daysUntil} onConfirm={() => confirmRecurring(rule.id)} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="All recurring" subtitle={`${recurring.length} rule${recurring.length === 1 ? "" : "s"}`} />
        <div className="space-y-3">
          {recurring.map((rule) => (
            <RecurringRow
              key={rule.id}
              rule={rule}
              due={dueIds.has(rule.id)}
              accountNames={accounts.map((a) => a.name)}
              onSave={(patch) => updateRecurring(rule.id, patch)}
              onDelete={() => deleteRecurring(rule.id)}
            />
          ))}
          {recurring.length === 0 && <p className="text-sm text-[var(--text-muted)] py-2">Nothing recurring set up yet.</p>}
        </div>
      </Card>

      <Card>
        {addOpen ? (
          <AddRecurringForm
            accountNames={accounts.map((a) => a.name)}
            onCancel={() => setAddOpen(false)}
            onCreate={async (rule) => {
              await createRecurring(rule);
              setAddOpen(false);
            }}
          />
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Missing something predictable?</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Rent, a paycheck, a subscription — set it up once.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(true)} icon={<span>+</span>}>
              Add recurring
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function DueRow({ rule, daysUntil, onConfirm }: { rule: RecurringTransaction; daysUntil: number; onConfirm: () => void }) {
  const cat = CATEGORIES[rule.category];
  const when = daysUntil > 0 ? `due in ${daysUntil} day${daysUntil === 1 ? "" : "s"}` : daysUntil === 0 ? "due today" : `${-daysUntil} day${daysUntil === -1 ? "" : "s"} overdue`;

  return (
    <div className="flex items-center gap-3 rounded-xl p-3 border border-[var(--border)]">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}>
        {cat.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{rule.merchant}</p>
        <p className={`text-xs ${daysUntil < 0 ? "text-[var(--red)]" : "text-[var(--text-muted)]"}`}>{when} · {formatCurrency(Math.abs(rule.amount))}</p>
      </div>
      <Button size="sm" onClick={onConfirm}>
        Confirm
      </Button>
    </div>
  );
}

function RecurringRow({
  rule,
  due,
  accountNames,
  onSave,
  onDelete,
}: {
  rule: RecurringTransaction;
  due: boolean;
  accountNames: string[];
  onSave: (patch: Partial<Omit<RecurringTransaction, "id">>) => void;
  onDelete: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [merchant, setMerchant] = useState(rule.merchant);
  const [amount, setAmount] = useState(String(Math.abs(rule.amount)));
  const [kind, setKind] = useState<"expense" | "income">(rule.amount >= 0 ? "income" : "expense");
  const [category, setCategory] = useState<CategoryId>(rule.category);
  const [account, setAccount] = useState(rule.account);
  const [dayOfMonth, setDayOfMonth] = useState(String(rule.dayOfMonth));
  const cat = CATEGORIES[rule.category];

  function commit() {
    const numeric = parseFloat(amount);
    if (!merchant.trim() || Number.isNaN(numeric) || numeric <= 0) return;
    onSave({
      merchant: merchant.trim(),
      amount: kind === "expense" ? -numeric : numeric,
      category: kind === "income" ? "income" : category,
      account,
      dayOfMonth: Math.min(31, Math.max(1, Math.round(parseFloat(dayOfMonth)) || rule.dayOfMonth)),
    });
    setEditing(false);
  }

  if (confirmDelete) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-3 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-[var(--text-muted)]">Remove "{rule.merchant}" from recurring? Can't be undone.</p>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="danger" onClick={onDelete}>Remove</Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>Cancel</Button>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="rounded-xl border border-[var(--border)] p-3.5 space-y-2.5">
        <div className="grid sm:grid-cols-2 gap-2.5">
          <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder="Merchant / source" className={inputClass} />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Amount" className={inputClass} />
        </div>
        <div className="flex gap-1.5">
          {(["expense", "income"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border capitalize ${kind === k ? "border-[var(--violet)] bg-[var(--violet)]/15" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
              {k}
            </button>
          ))}
        </div>
        {kind === "expense" && (
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_LIST.filter((c) => c.id !== "income").map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(c.id)} className={`px-2 py-1 rounded-lg text-xs font-medium border ${category === c.id ? "border-[var(--violet)] bg-[var(--violet)]/15" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
                {c.icon} {c.label}
              </button>
            ))}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-2.5">
          <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputClass}>
            {accountNames.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} type="number" min="1" max="31" placeholder="Day of month (1-31)" className={inputClass} />
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={commit}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
          <button onClick={() => setConfirmDelete(true)} className="text-xs text-[var(--text-faint)] hover:text-[var(--red)] ml-auto">Remove</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl p-3 border border-[var(--border)]">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-sm shrink-0" style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}>
        {cat.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{rule.merchant}</p>
        <p className="text-xs text-[var(--text-muted)]">{ordinal(rule.dayOfMonth)} of each month · {rule.account}</p>
      </div>
      <div className="text-right shrink-0 mr-1">
        <p className={`text-sm font-semibold tabular ${rule.amount >= 0 ? "text-[var(--green)]" : ""}`}>{rule.amount >= 0 ? "+" : ""}{formatCurrency(rule.amount, true)}</p>
        {due && <p className="text-[10px] font-semibold text-[var(--amber)]">Due</p>}
      </div>
      <button onClick={() => setEditing(true)} className="text-xs font-medium text-[var(--violet)] hover:underline shrink-0">
        Edit
      </button>
    </div>
  );
}

function AddRecurringForm({
  accountNames,
  onCancel,
  onCreate,
}: {
  accountNames: string[];
  onCancel: () => void;
  onCreate: (rule: Omit<RecurringTransaction, "id">) => void;
}) {
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState<CategoryId>("subscriptions");
  const [account, setAccount] = useState(accountNames[0] ?? "");
  const [dayOfMonth, setDayOfMonth] = useState("1");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numeric = parseFloat(amount);
    if (!merchant.trim() || Number.isNaN(numeric) || numeric <= 0) return;
    onCreate({
      merchant: merchant.trim(),
      amount: kind === "expense" ? -numeric : numeric,
      category: kind === "income" ? "income" : category,
      account,
      dayOfMonth: Math.min(31, Math.max(1, Math.round(parseFloat(dayOfMonth)) || 1)),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2 p-1 rounded-full bg-[var(--surface-2)] w-fit">
        {(["expense", "income"] as const).map((k) => (
          <button type="button" key={k} onClick={() => setKind(k)} className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${kind === k ? "bg-[var(--surface)] text-[var(--text)] shadow" : "text-[var(--text-muted)]"}`}>
            {k}
          </button>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <input value={merchant} onChange={(e) => setMerchant(e.target.value)} placeholder={kind === "income" ? "e.g. Payroll" : "e.g. Rent"} className={inputClass} required />
        <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" min="0" step="0.01" placeholder="Amount" className={inputClass} required />
      </div>
      {kind === "expense" && (
        <div className="flex flex-wrap gap-1.5">
          {CATEGORY_LIST.filter((c) => c.id !== "income").map((c) => (
            <button type="button" key={c.id} onClick={() => setCategory(c.id)} className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${category === c.id ? "border-[var(--violet)] bg-[var(--violet)]/15" : "border-[var(--border)] text-[var(--text-muted)]"}`}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        <select value={account} onChange={(e) => setAccount(e.target.value)} className={inputClass}>
          {accountNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <input value={dayOfMonth} onChange={(e) => setDayOfMonth(e.target.value)} type="number" min="1" max="31" placeholder="Day of month (1-31)" className={inputClass} required />
      </div>
      <div className="flex items-center gap-2 pt-1">
        <Button type="submit" size="sm">Add recurring</Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)] tabular";

function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
