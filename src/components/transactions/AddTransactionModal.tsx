import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { CategoryId } from "../../lib/types";
import { CATEGORY_LIST } from "../../lib/categories";
import { useAppStore } from "../../lib/store";
import { Button } from "../ui/Button";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function AddTransactionModal({ open, onClose }: Props) {
  const addTransaction = useAppStore((s) => s.addTransaction);
  const accounts = useAppStore((s) => s.accounts);
  const [merchant, setMerchant] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryId>("dining");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [account, setAccount] = useState(accounts[0]?.name ?? "Everyday Checking");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  function reset() {
    setMerchant("");
    setAmount("");
    setCategory("dining");
    setKind("expense");
    setDate(new Date().toISOString().slice(0, 10));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numeric = parseFloat(amount);
    if (!merchant.trim() || Number.isNaN(numeric) || numeric <= 0) return;
    addTransaction({
      merchant: merchant.trim(),
      amount: kind === "expense" ? -numeric : numeric,
      category: kind === "income" ? "income" : category,
      account,
      date,
    });
    reset();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.form
            onSubmit={handleSubmit}
            className="relative w-full sm:max-w-md card p-6 rounded-b-none sm:rounded-b-[20px]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-semibold text-lg">Add transaction</h3>
              <button type="button" onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--surface-2)]" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="flex gap-2 mb-4 p-1 rounded-full bg-[var(--surface-2)]">
              {(["expense", "income"] as const).map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => setKind(k)}
                  className={`flex-1 py-2 rounded-full text-sm font-medium capitalize transition-colors ${
                    kind === k ? "bg-[var(--surface)] text-[var(--text)] shadow" : "text-[var(--text-muted)]"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Merchant / source</label>
                <input
                  value={merchant}
                  onChange={(e) => setMerchant(e.target.value)}
                  placeholder={kind === "income" ? "e.g. Payroll" : "e.g. Trader Joe's"}
                  className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Amount</label>
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)] tabular"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Date</label>
                  <input
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                  />
                </div>
              </div>

              {kind === "expense" && (
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORY_LIST.filter((c) => c.id !== "income").map((c) => (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCategory(c.id)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          category === c.id ? "border-[var(--violet)] bg-[var(--violet)]/15 text-[var(--text)]" : "border-[var(--border)] text-[var(--text-muted)]"
                        }`}
                      >
                        {c.icon} {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Account</label>
                <select
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.name}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full mt-5" size="lg">
              Save transaction
            </Button>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
