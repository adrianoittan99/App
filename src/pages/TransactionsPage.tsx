import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { CATEGORIES, CATEGORY_LIST } from "../lib/categories";
import { formatCurrency, formatFullDate } from "../lib/format";
import type { CategoryId, Transaction } from "../lib/types";
import { AddTransactionModal } from "../components/transactions/AddTransactionModal";
import { Button } from "../components/ui/Button";

export function TransactionsPage() {
  const transactions = useAppStore((s) => s.transactions);
  const deleteTransaction = useAppStore((s) => s.deleteTransaction);
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("merchant") ?? "");
  const [category, setCategory] = useState<CategoryId | "all">((searchParams.get("category") as CategoryId | null) ?? "all");
  const [visibleCount, setVisibleCount] = useState(100);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  // Arriving from "View activity" on an envelope, or a subscription/DNA
  // category, means a new ?category=/?merchant= while this page stays
  // mounted — pick that up too.
  useEffect(() => {
    const fromCategory = searchParams.get("category") as CategoryId | null;
    const fromMerchant = searchParams.get("merchant");
    if (fromCategory && fromCategory !== category) {
      setCategory(fromCategory);
      setVisibleCount(100);
    }
    if (fromMerchant && fromMerchant !== query) {
      setQuery(fromMerchant);
      setVisibleCount(100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    // The store already keeps transactions date-sorted, but this list can be
    // built from filters alone — sort defensively so display order never
    // depends on remembering to sort at every mutation site.
    return [...transactions]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .filter((t) => {
        const matchesQuery = t.merchant.toLowerCase().includes(query.toLowerCase());
        const matchesCategory = category === "all" || t.category === category;
        return matchesQuery && matchesCategory;
      });
  }, [transactions, query, category]);

  const visible = filtered.slice(0, visibleCount);
  const activeCategory = category !== "all" ? CATEGORIES[category] : null;

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setSearchParams({});
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Transactions</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1 flex items-center gap-2 flex-wrap">
          <span>
            {transactions.length} total · {visible.length} of {filtered.length} shown
          </span>
          {activeCategory && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: `color-mix(in srgb, ${activeCategory.color} 16%, transparent)`, color: activeCategory.color }}>
              {activeCategory.icon} {activeCategory.label} only
              <button onClick={() => { setCategory("all"); setSearchParams({}); }} className="hover:opacity-70" aria-label="Clear category filter">
                ✕
              </button>
            </span>
          )}
          {!activeCategory && query && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]">
              "{query}" only
              <button onClick={() => { setQuery(""); setSearchParams({}); }} className="hover:opacity-70" aria-label="Clear search filter">
                ✕
              </button>
            </span>
          )}
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
            setSearchParams({});
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
                  <tr key={t.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--surface-2)]/60 transition-colors">
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button onClick={() => setEditingTxn(t)} className="text-xs font-medium text-[var(--violet)]/80 hover:text-[var(--violet)] hover:underline mr-3">
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTransaction(t.id)}
                        className="text-xs font-medium text-[var(--red)]/70 hover:text-[var(--red)] hover:underline"
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
              <Button size="sm" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          </div>
        )}
      </div>

      <AddTransactionModal open={Boolean(editingTxn)} transaction={editingTxn ?? undefined} onClose={() => setEditingTxn(null)} />
    </div>
  );
}
