import { Link, useNavigate } from "react-router-dom";
import type { EnvelopeProgress } from "../../lib/calculations";
import { CATEGORIES } from "../../lib/categories";
import { formatCurrency } from "../../lib/format";
import { Card, CardHeader } from "../ui/Card";
import { InfoTip } from "../ui/InfoTip";
import { ProgressBar } from "../ui/ProgressBar";

export function EnvelopeMiniList({ envelopes, monthLabel }: { envelopes: EnvelopeProgress[]; monthLabel?: string }) {
  const navigate = useNavigate();
  const top = [...envelopes].sort((a, b) => b.pct - a.pct).slice(0, 5);

  return (
    <Card>
      <CardHeader
        title={
          <span className="flex items-center gap-1.5">
            Envelopes {monthLabel ? `in ${monthLabel}` : "this month"}
            <InfoTip title="How envelopes work" action={{ label: "Edit a limit →", to: "/app/budgets" }}>
              Every category gets a monthly spending limit — an "envelope." Green means on track, amber means you've used
              85%+, red means you're over. Tap any limit on the Envelopes page to change it — Budget Adherence (25% of your
              Wellness Score) is just the share of these you stay under.
            </InfoTip>
          </span>
        }
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
            <button
              key={env.id}
              onClick={() => navigate(`/app/transactions?category=${env.categoryId}`)}
              className="block w-full text-left group"
            >
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="flex items-center gap-2 font-medium group-hover:text-[var(--violet)] transition-colors">
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
            </button>
          );
        })}
      </div>
    </Card>
  );
}
