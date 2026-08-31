import { monthKey, monthLabelFull, shiftMonthKey } from "../../lib/calculations";

interface Props {
  value: string; // "YYYY-MM"
  onChange: (next: string) => void;
}

/** A ← Month Year → control. Never lets you go past the real current month. */
export function MonthSwitcher({ value, onChange }: Props) {
  const isCurrent = value === monthKey(new Date());

  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => onChange(shiftMonthKey(value, -1))}
        aria-label="Previous month"
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors"
      >
        ‹
      </button>
      <span className="text-sm font-medium tabular w-32 text-center">{monthLabelFull(value)}</span>
      <button
        onClick={() => onChange(shiftMonthKey(value, 1))}
        disabled={isCurrent}
        aria-label="Next month"
        className="w-7 h-7 rounded-full flex items-center justify-center text-sm bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors disabled:opacity-30 disabled:pointer-events-none"
      >
        ›
      </button>
      {!isCurrent && (
        <button
          onClick={() => onChange(monthKey(new Date()))}
          className="text-xs font-medium text-[var(--violet)] hover:underline ml-1"
        >
          Today
        </button>
      )}
    </div>
  );
}
