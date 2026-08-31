import { Link } from "react-router-dom";
import type { Transaction } from "../../lib/types";
import { CATEGORIES } from "../../lib/categories";
import { formatDate, formatSigned } from "../../lib/format";
import { Card, CardHeader } from "../ui/Card";

export function RecentTransactions({ transactions, title = "Recent activity" }: { transactions: Transaction[]; title?: string }) {
  const recent = transactions.slice(0, 6);
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Link to="/app/transactions" className="text-xs font-medium text-[var(--violet)] hover:underline">
            View all →
          </Link>
        }
      />
      {recent.length === 0 && (
        <p className="text-sm text-[var(--text-muted)] text-center py-6">
          Nothing logged yet — add your first transaction and it'll show up here.
        </p>
      )}
      <div className="divide-y divide-[var(--border)]">
        {recent.map((t) => {
          const cat = CATEGORIES[t.category];
          const positive = t.amount >= 0;
          return (
            <div key={t.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <span className="w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}>
                {cat.icon}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{t.merchant}</p>
                <p className="text-xs text-[var(--text-muted)]">{cat.label} · {formatDate(t.date)}</p>
              </div>
              <span className={`text-sm font-semibold tabular shrink-0 ${positive ? "text-[var(--green)]" : "text-[var(--text)]"}`}>
                {formatSigned(t.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
