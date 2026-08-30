import { AnimatePresence, motion } from "framer-motion";
import { useAppStore } from "../../lib/store";
import { detectRecurring } from "../../lib/calculations";
import { CATEGORIES } from "../../lib/categories";
import { formatCurrency } from "../../lib/format";
import { formatFullDate } from "../../lib/format";
import { Card, CardHeader } from "../ui/Card";
import { Button } from "../ui/Button";
import { Pill } from "../ui/Pill";

export function SubscriptionXray() {
  const transactions = useAppStore((s) => s.transactions);
  const canceled = useAppStore((s) => s.canceledSubscriptions);
  const cancelSubscription = useAppStore((s) => s.cancelSubscription);
  const reinstateSubscription = useAppStore((s) => s.reinstateSubscription);

  const subs = detectRecurring(transactions).map((s) => ({ ...s, canceled: canceled.includes(s.key) }));
  const active = subs.filter((s) => !s.canceled);
  const canceledOnes = subs.filter((s) => s.canceled);

  const monthlyLeak = active.reduce((sum, s) => sum + s.monthlyCost, 0);
  const annualLeak = monthlyLeak * 12;
  const monthlySaved = canceledOnes.reduce((sum, s) => sum + s.monthlyCost, 0);

  return (
    <Card>
      <CardHeader
        title="Subscription X-ray"
        subtitle={`${subs.length} recurring charges detected automatically from your ledger`}
      />

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl p-4 border border-[var(--red)]/25 bg-[var(--red)]/10">
          <p className="text-xs text-[var(--text-muted)]">Active recurring spend</p>
          <p className="font-display font-bold text-2xl tabular mt-1 text-[var(--red)]">{formatCurrency(monthlyLeak)}<span className="text-sm font-medium text-[var(--text-muted)]">/mo</span></p>
          <p className="text-xs text-[var(--text-faint)] mt-1 tabular">≈ {formatCurrency(annualLeak)} per year</p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--green)]/25 bg-[var(--green)]/10">
          <p className="text-xs text-[var(--text-muted)]">Reclaimed by canceling</p>
          <p className="font-display font-bold text-2xl tabular mt-1 text-[var(--green)]">{formatCurrency(monthlySaved)}<span className="text-sm font-medium text-[var(--text-muted)]">/mo</span></p>
          <p className="text-xs text-[var(--text-faint)] mt-1 tabular">{canceledOnes.length} subscription{canceledOnes.length === 1 ? "" : "s"} patched</p>
        </div>
      </div>

      <div className="space-y-2.5">
        <AnimatePresence initial={false}>
          {subs
            .sort((a, b) => Number(a.canceled) - Number(b.canceled) || b.monthlyCost - a.monthlyCost)
            .map((s) => {
              const cat = CATEGORIES[s.category];
              return (
                <motion.div
                  key={s.key}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 rounded-xl p-3 border border-[var(--border)]"
                >
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-sm shrink-0"
                    style={{ background: `color-mix(in srgb, ${cat.color} 16%, transparent)`, color: cat.color, opacity: s.canceled ? 0.5 : 1 }}
                  >
                    {cat.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${s.canceled ? "line-through text-[var(--text-faint)]" : ""}`}>{s.merchant}</p>
                    <p className="text-xs text-[var(--text-muted)]">Last charged {formatFullDate(s.lastDate)} · {s.occurrences}× seen</p>
                  </div>
                  <div className="text-right shrink-0 mr-1">
                    <p className={`text-sm font-semibold tabular ${s.canceled ? "text-[var(--text-faint)] line-through" : ""}`}>{formatCurrency(s.monthlyCost)}/mo</p>
                    {s.canceled && <Pill tone="green">Canceled</Pill>}
                  </div>
                  <Button
                    size="sm"
                    variant={s.canceled ? "secondary" : "danger"}
                    onClick={() => (s.canceled ? reinstateSubscription(s.key) : cancelSubscription(s.key))}
                  >
                    {s.canceled ? "Reinstate" : "Cancel"}
                  </Button>
                </motion.div>
              );
            })}
        </AnimatePresence>
        {subs.length === 0 && <p className="text-sm text-[var(--text-muted)] text-center py-6">No recurring charges detected yet.</p>}
      </div>
    </Card>
  );
}
