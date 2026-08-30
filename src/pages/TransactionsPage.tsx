import { useMemo, useState } from "react";
import { useAppStore } from "../lib/store";
import { CATEGORIES, CATEGORY_LIST } from "../lib/categories";
import { formatCurrency, formatFullDate } from "../lib/format";
import type { CategoryId } from "../lib/types";
import { Button } from "../components/ui/Button";

export function TransactionsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryId | "all">("all");
  const [visibleCount, setVisibleCount] = useState(100);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesQuery = t.merchant.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = category === "all" || t.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [transactions, query, category]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Transactions</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          {transactions.length} total · {visible.length} of {filtered.length} shown
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setVisibleCount(100);
          }}
          placeholder="Search merchant…"
          className="flex-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
        />
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value as CategoryId | "all");
            setVisibleCount(100);
          }}
          className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
        >
          <option value="all">All categories</option>
          {CATEGORY_LIST.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="card !p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[var(--text-muted)] border-b border-[var(--border)]">
                <th className="px-4 py-3 font-medium">Merchant</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Account</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((t) => {
                const cat = CATEGORIES[t.category];
                const positive = t.amount >= 0;
                return (
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60 transition-colors group">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{t.merchant}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full" style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color }}>
                        {cat.icon} {cat.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap">{t.account}</td>
                    <td className="px-4 py-3 text-[var(--text-muted)] whitespace-nowrap tabular">{formatFullDate(t.date)}</td>
                    <td className={`px-4 py-3 text-right tabular font-semibold whitespace-nowrap ${positive ? "text-[var(--green)]" : ""}`}>
                      {positive ? "+" : "−"}
                      {formatCurrency(Math.abs(t.amount), true)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-[var(--red)] hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visible.length < filtered.length && (
          <div className="p-4 text-center border-t border-[var(--border)]">
            <Button size="sm" variant="secondary" onClick={() => setVisibleCount((v) => v + 100)}>
              Load {Math.min(100, filtered.length - visible.length)} more
            </Button>
          </div>
        )}
        {filtered.length === 0 && (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">
            No transactions match your filters.
            <div className="mt-3">
              <Button size="sm" variant="secondary" onClick={() => { setQuery(""); setCategory("all"); }}>
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
