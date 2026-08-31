import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { EnvelopeProgress } from "../../lib/calculations";
import { CATEGORIES } from "../../lib/categories";
import { formatCurrency } from "../../lib/format";
import { useAppStore } from "../../lib/store";
import { Card } from "../ui/Card";
import { ProgressBar } from "../ui/ProgressBar";
import { Pill } from "../ui/Pill";

const STATUS_TONE = { "on-track": "green", watch: "amber", over: "red" } as const;
const STATUS_LABEL = { "on-track": "On track", watch: "Watch", over: "Over budget" } as const;

export function EnvelopeCard({ envelope, readOnly = false }: { envelope: EnvelopeProgress; readOnly?: boolean }) {
  const updateEnvelopeLimit = useAppStore((s) => s.updateEnvelopeLimit);
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(envelope.monthlyLimit));
  const cat = CATEGORIES[envelope.categoryId];

  function commit() {
    const val = parseFloat(draft);
    if (!Number.isNaN(val)) updateEnvelopeLimit(envelope.categoryId, val);
    setEditing(false);
  }

  return (
    <Card
      className="!p-4 cursor-pointer hover:border-[var(--border-strong)] transition-colors"
      onClick={() => navigate(`/app/transactions?category=${envelope.categoryId}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter") navigate(`/app/transactions?category=${envelope.categoryId}`);
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `color-mix(in srgb, ${cat.color} 18%, transparent)`, color: cat.color }}>
          {cat.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold text-sm">{cat.label}</p>
          <Pill tone={STATUS_TONE[envelope.status]}>{STATUS_LABEL[envelope.status]}</Pill>
        </div>
      </div>

      <ProgressBar pct={envelope.pct} color={cat.color} height={9} />

      <div className="flex items-center justify-between mt-2.5 text-sm">
        <span className="tabular font-semibold">{formatCurrency(envelope.spent)}</span>
        {readOnly ? (
          <span className="text-xs tabular text-[var(--text-faint)]">of {formatCurrency(envelope.monthlyLimit)}</span>
        ) : editing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <span className="text-xs text-[var(--text-muted)]">/ $</span>
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => e.key === "Enter" && commit()}
              className="w-16 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-1.5 py-0.5 text-xs tabular outline-none focus:border-[var(--violet)]"
            />
          </div>
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEditing(true);
            }}
            className="text-xs tabular text-[var(--text-muted)] hover:text-[var(--violet)] underline decoration-dotted"
          >
            of {formatCurrency(envelope.monthlyLimit)}
          </button>
        )}
      </div>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-[var(--text-faint)]">
          {envelope.remaining >= 0 ? `${formatCurrency(envelope.remaining)} remaining` : `${formatCurrency(-envelope.remaining)} over limit`}
        </p>
        <span className="text-xs font-medium text-[var(--violet)]">View activity →</span>
      </div>
    </Card>
  );
}
