import { useMemo } from "react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { useAppStore } from "../../lib/store";
import { lastNMonthKeys, summarizeMonth } from "../../lib/calculations";
import { CHART_OTHER, CHART_SLOTS, chartColorFor } from "../../lib/chartPalette";
import { formatCurrency, formatPercent } from "../../lib/format";
import { Card, CardHeader } from "../ui/Card";
import { InfoTip } from "../ui/InfoTip";

export function SpendingDNA() {
  const transactions = useAppStore((s) => s.transactions);
  const theme = useAppStore((s) => s.theme);

  const { radarData, code, total } = useMemo(() => {
    const months = lastNMonthKeys(3);
    const byCategory: Record<string, number> = {};
    months.forEach((m) => {
      const summary = summarizeMonth(transactions, m);
      Object.entries(summary.byCategory).forEach(([cat, amt]) => {
        byCategory[cat] = (byCategory[cat] ?? 0) + (amt ?? 0);
      });
    });

    const totalSpend = Object.values(byCategory).reduce((s, v) => s + v, 0);
    let otherAmt = 0;
    const rows = CHART_SLOTS.map((slot) => {
      const amt = byCategory[slot.id] ?? 0;
      return { category: slot.id, label: slot.label, short: slot.short, amount: amt };
    });
    Object.entries(byCategory).forEach(([cat, amt]) => {
      if (!CHART_SLOTS.find((s) => s.id === cat)) otherAmt += amt;
    });
    if (otherAmt > 0) rows.push({ category: "other" as never, label: CHART_OTHER.label, short: CHART_OTHER.label, amount: otherAmt });

    const data = rows
      .filter((r) => r.amount > 0)
      .map((r) => ({ ...r, pct: totalSpend > 0 ? r.amount / totalSpend : 0 }));

    const code = data
      .slice()
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)
      .map((r) => `${r.label.slice(0, 2).toUpperCase()}${Math.round(r.pct * 100)}`)
      .join("-");

    return { radarData: data, code: code || "—", total: totalSpend };
  }, [transactions]);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            Spending DNA
            <InfoTip title="Reading the code">
              Your top 4 categories from the last 3 months, encoded as two letters + the share of spend they take up — e.g.{" "}
              <code className="px-1 rounded bg-[var(--surface-3)]">DI37</code> means Dining was 37% of tracked spend. It's a
              fun snapshot, and a fast way to notice a category creeping up without you realizing.
            </InfoTip>
          </span>
        }
        subtitle="Your category fingerprint over the last 3 months"
      />

      <div className="grid sm:grid-cols-[1.1fr_0.9fr] gap-6 items-center">
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData} outerRadius="62%" margin={{ top: 18, right: 28, bottom: 18, left: 28 }}>
              <PolarGrid stroke={theme === "dark" ? "#2c2c2a" : "#e1e0d9"} />
              <PolarAngleAxis dataKey="short" tick={{ fill: "var(--text-muted)", fontSize: 11 }} />
              <Radar dataKey="pct" stroke="var(--violet)" fill="var(--violet)" fillOpacity={0.35} strokeWidth={2} isAnimationActive />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const p = payload[0]?.payload;
                  return (
                    <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg">
                      <p className="font-semibold">{p?.label}</p>
                      <p className="tabular text-[var(--text-muted)]">{formatCurrency(p?.amount ?? 0)} · {formatPercent(p?.pct ?? 0)}</p>
                    </div>
                  );
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="text-xs text-[var(--text-muted)] mb-1">Your shareable DNA code</p>
          <p className="font-mono font-bold text-lg tracking-wide aurora-text break-all mb-4">{code}</p>

          <div className="space-y-2">
            {radarData
              .slice()
              .sort((a, b) => b.amount - a.amount)
              .slice(0, 6)
              .map((r) => (
                <div key={r.category} className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.category === "other" ? (theme === "dark" ? CHART_OTHER.dark : CHART_OTHER.light) : chartColorFor(r.category, theme) }} />
                  <span className="flex-1 text-[var(--text-muted)] truncate">{r.label}</span>
                  <span className="tabular font-medium">{formatPercent(r.pct)}</span>
                </div>
              ))}
          </div>
          <p className="text-[11px] text-[var(--text-faint)] mt-3">Based on {formatCurrency(total)} in tracked spend</p>
        </div>
      </div>
    </Card>
  );
}
