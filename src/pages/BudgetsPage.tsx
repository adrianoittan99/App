import { useState } from "react";
import { useAppStore } from "../lib/store";
import { computeEnvelopeProgress, monthKey } from "../lib/calculations";
import { formatCurrency } from "../lib/format";
import { EnvelopeCard } from "../components/budgets/EnvelopeCard";
import { MonthSwitcher } from "../components/ui/MonthSwitcher";
import { ProgressBar } from "../components/ui/ProgressBar";
import { InfoTip } from "../components/ui/InfoTip";

export function BudgetsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const [selectedMonth, setSelectedMonth] = useState(monthKey(new Date()));
  const isCurrent = selectedMonth === monthKey(new Date());

  const progress = computeEnvelopeProgress(envelopes, transactions, selectedMonth);

  const totalLimit = progress.reduce((s, e) => s + e.monthlyLimit, 0);
  const totalSpent = progress.reduce((s, e) => s + e.spent, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            Envelopes
            <InfoTip title="What's an envelope?">
              A monthly spending cap per category, set from your onboarding answers. Every expense you log counts against
              the matching envelope automatically — no manual sorting. Limits apply to every month (past and future) —
              that's why you can only edit them while viewing the current month.
            </InfoTip>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {isCurrent ? "Click a limit to edit it inline" : "Looking back — limits can only be edited from the current month"}
          </p>
        </div>
        <MonthSwitcher value={selectedMonth} onChange={setSelectedMonth} />
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
          <EnvelopeCard key={env.id} envelope={env} readOnly={!isCurrent} />
        ))}
      </div>
    </div>
  );
}
