import { useMemo, useState } from "react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppStore } from "../../lib/store";
import { computeNetWorth, findMilestoneYear, projectFutureNetWorth } from "../../lib/calculations";
import { formatCompact, formatCurrency } from "../../lib/format";
import { Card, CardHeader } from "../ui/Card";
import { InfoTip } from "../ui/InfoTip";

const MILESTONES = [100_000, 500_000, 1_000_000];

export function FutureSelfSimulator() {
  const accounts = useAppStore((s) => s.accounts);
  const theme = useAppStore((s) => s.theme);
  const startingNetWorth = computeNetWorth(accounts);

  const [monthlyContribution, setMonthlyContribution] = useState(650);
  const [annualReturnRate, setAnnualReturnRate] = useState(0.07);
  const [years, setYears] = useState(30);
  const [currentAge, setCurrentAge] = useState(30);

  const points = useMemo(
    () => projectFutureNetWorth({ startingNetWorth, monthlyContribution, annualReturnRate, years, currentAge }),
    [startingNetWorth, monthlyContribution, annualReturnRate, years, currentAge]
  );

  const ending = points[points.length - 1];
  const milestoneYears = MILESTONES.map((m) => ({ target: m, year: findMilestoneYear(points, m) }));

  const stroke = theme === "dark" ? "#3987e5" : "#2a78d6";
  const bandFill = theme === "dark" ? "#3987e522" : "#2a78d61a";
  const axisInk = "#898781";
  const gridInk = theme === "dark" ? "#2c2c2a" : "#e1e0d9";

  const data = points.map((p) => ({ ...p, band: [Math.round(p.conservative), Math.round(p.optimistic)] as [number, number] }));

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            Future Self simulator
            <InfoTip title="How the projection works">
              Starting from your current net worth, this compounds a monthly contribution at an expected annual return —
              basic time-value-of-money math, run three ways. The shaded band is a ±2 percentage-point range around your
              chosen return, so "conservative" and "optimistic" bracket the solid projected line.
            </InfoTip>
          </span>
        }
        subtitle="Drag the levers — this is the you of tomorrow, compounding today's choices"
      />

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <SliderField
          label="Monthly contribution"
          value={monthlyContribution}
          min={0}
          max={3000}
          step={25}
          format={(v) => formatCurrency(v)}
          onChange={setMonthlyContribution}
        />
        <SliderField
          label="Expected annual return"
          value={annualReturnRate}
          min={0}
          max={0.14}
          step={0.005}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          onChange={setAnnualReturnRate}
        />
        <SliderField label="Years from now" value={years} min={5} max={40} step={1} format={(v) => `${v} yrs (age ${currentAge + v})`} onChange={setYears} />
      </div>

      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="text-[var(--text-muted)]">Current age</span>
        <input
          type="number"
          value={currentAge}
          onChange={(e) => setCurrentAge(Number(e.target.value) || 0)}
          className="w-16 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 tabular"
        />
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <XAxis dataKey="year" tickFormatter={(v) => `+${v}y`} tick={{ fill: axisInk, fontSize: 11 }} tickLine={false} axisLine={{ stroke: gridInk }} interval={Math.ceil(years / 6)} />
            <YAxis tickFormatter={(v) => formatCompact(v)} tick={{ fill: axisInk, fontSize: 11 }} tickLine={false} axisLine={false} width={48} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0]?.payload;
                return (
                  <div className="glass rounded-lg px-3 py-2 text-xs shadow-lg space-y-0.5">
                    <p className="text-[var(--text-muted)]">Year +{label} (age {p?.age})</p>
                    <p className="font-semibold tabular">{formatCurrency(p?.projected ?? 0)} projected</p>
                    <p className="text-[var(--text-faint)] tabular">{formatCurrency(p?.conservative ?? 0)} – {formatCurrency(p?.optimistic ?? 0)} range</p>
                  </div>
                );
              }}
            />
            <Area dataKey="band" fill={bandFill} stroke="none" isAnimationActive={false} />
            <Line type="monotone" dataKey="projected" stroke={stroke} strokeWidth={2.5} dot={false} isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mt-5">
        <div className="rounded-xl p-4 bg-[image:var(--aurora-gradient-soft)] border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">Projected net worth in {years} years</p>
          <p className="font-display font-bold text-2xl tabular mt-1">{formatCurrency(ending.projected)}</p>
          <p className="text-xs text-[var(--text-faint)] mt-1 tabular">
            range {formatCurrency(ending.conservative)} – {formatCurrency(ending.optimistic)}
          </p>
        </div>
        <div className="rounded-xl p-4 border border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)] mb-2">Milestones on this path</p>
          <div className="space-y-1.5">
            {milestoneYears.map((m) => (
              <div key={m.target} className="flex items-center justify-between text-sm">
                <span className="tabular">{formatCompact(m.target)}</span>
                <span className="text-[var(--text-muted)] tabular">{m.year !== null ? `age ${currentAge + m.year}` : "beyond range"}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[var(--text-muted)]">{label}</span>
        <span className="text-xs font-semibold tabular">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="aurora-slider w-full"
      />
    </div>
  );
}
