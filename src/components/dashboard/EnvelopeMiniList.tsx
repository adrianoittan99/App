import { Link } from "react-router-dom";
import type { EnvelopeProgress } from "../../lib/calculations";
import { CATEGORIES } from "../../lib/categories";
import { formatCurrency } from "../../lib/format";
import { Card, CardHeader } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";

export function EnvelopeMiniList({ envelopes }: { envelopes: EnvelopeProgress[] }) {
  const top = [...envelopes].sort((a, b) => b.pct - a.pct).slice(0, 5);

  return (
    <Card>
      <CardHeader
        title="Envelopes this month"
        subtitle="Highest utilization first"
        action={
          <Link to="/app/budgets" className="text-xs font-medium text-[var(--violet)] hover:underline">
            View all →
          </Link>
        }
      />
      <div className="space-y-4">
        {top.map((env) => {
          const cat = CATEGORIES[env.categoryId];
          return (
            <div key={env.id}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="flex items-center gap-2 font-medium">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs" style={{ background: `color-mix(in srgb, ${cat.color} 18%, transparent)`, color: cat.color }}>
                    {cat.icon}
                  </span>
                  {cat.label}
                </span>
                <span className="tabular text-[var(--text-muted)]">
                  {formatCurrency(env.spent)} / {formatCurrency(env.monthlyLimit)}
                </span>
              </div>
              <ProgressBar pct={env.pct} color={cat.color} />
            </div>
          );
        })}
      </div>
    </Card>
  );
}
