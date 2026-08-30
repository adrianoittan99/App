import { useAppStore } from "../lib/store";
import { computeEnvelopeProgress, monthKey } from "../lib/calculations";
import { formatCurrency, formatMonthYear } from "../lib/format";
import { EnvelopeCard } from "../components/budgets/EnvelopeCard";
import { ProgressBar } from "../components/ui/ProgressBar";

export function BudgetsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const currentMonth = monthKey(new Date());
  const progress = computeEnvelopeProgress(envelopes, transactions, currentMonth);

  const totalLimit = progress.reduce((s, e) => s + e.monthlyLimit, 0);
  const totalSpent = progress.reduce((s, e) => s + e.spent, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Envelopes</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{formatMonthYear(new Date().toISOString())} · click a limit to edit it inline</p>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Total budgeted spend</span>
          <span className="text-sm tabular">
            <span className="font-semibold">{formatCurrency(totalSpent)}</span>
            <span className="text-[var(--text-muted)]"> / {formatCurrency(totalLimit)}</span>
          </span>
        </div>
        <ProgressBar pct={totalLimit ? totalSpent / totalLimit : 0} height={10} />
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {progress.map((env) => (
          <EnvelopeCard key={env.id} envelope={env} />
        ))}
      </div>
    </div>
  );
}
