import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "../../lib/store";
import { Card, CardHeader } from "../ui/Card";
import { formatCompact, formatCurrency } from "../../lib/format";
import { monthLabel } from "../../lib/calculations";

interface Props {
  history: { key: string; value: number }[];
  netWorth: number;
  changePct: number | null;
}

export function NetWorthChart({ history, netWorth, changePct }: Props) {
  const theme = useAppStore((s) => s.theme);
  const stroke = theme === "dark" ? "#3987e5" : "#2a78d6";
  const gridInk = theme === "dark" ? "#2c2c2a" : "#e1e0d9";
  const axisInk = "#898781";

  const data = history.map((h) => ({ month: monthLabel(h.key), value: Math.round(h.value) }));

  return (
    <Card>
      <CardHeader
        title="Net worth"
        subtitle="Checking + savings + investments, minus credit balance"
        action={
          <div className="text-right">
            <p className="font-display font-bold text-xl tabular">{formatCurrency(netWorth)}</p>
            {changePct !== null && (
              <p className={`text-xs font-medium tabular ${changePct >= 0 ? "text-[var(--green)]" : "text-[var(--red)]"}`}>
                {changePct >= 0 ? "▲" : "▼"} {Math.abs(changePct * 100).toFixed(1)}% / 6mo
              </p>
            )}
          </div>
        }
      />
      <div className="h-56 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="netWorthFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fill: axisInk, fontSize: 12 }} tickLine={false} axisLine={{ stroke: gridInk }} />
            <YAxis
              tickFormatter={(v) => formatCompact(v)}
              tick={{ fill: axisInk, fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={48}
            />
            <Tooltip
              cursor={{ stroke: gridInk, strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                return (
                  <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg">
                    <p className="text-[var(--text-muted)] mb-0.5">{label}</p>
                    <p className="font-semibold tabular">{formatCurrency(Number(payload[0].value))}</p>
                  </div>
                );
              }}
            />
            <Area type="monotone" dataKey="value" stroke={stroke} strokeWidth={2} fill="url(#netWorthFill)" activeDot={{ r: 4 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
