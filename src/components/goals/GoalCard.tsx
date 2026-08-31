import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { Goal } from "../../lib/types";
import { formatCurrency, formatFullDate } from "../../lib/format";
import { useAppStore } from "../../lib/store";
import { fireGoalConfetti } from "../../lib/confetti";
import { Button } from "../ui/Button";
import { ProgressBar } from "../ui/ProgressBar";

export function GoalCard({ goal, compact = false }: { goal: Goal; compact?: boolean }) {
  const addGoalContribution = useAppStore((s) => s.addGoalContribution);
  const updateGoal = useAppStore((s) => s.updateGoal);
  const deleteGoal = useAppStore((s) => s.deleteGoal);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("50");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftName, setDraftName] = useState(goal.name);
  const [draftTarget, setDraftTarget] = useState(String(goal.target));
  const [draftSaved, setDraftSaved] = useState(String(goal.saved));
  const [draftDate, setDraftDate] = useState(goal.targetDate ? goal.targetDate.slice(0, 10) : "");

  const pct = Math.min(goal.saved / goal.target, 1);
  const complete = goal.saved >= goal.target;
  const daysLeft = useMemo(() => Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000), [goal.targetDate]);

  function handleAdd() {
    const value = parseFloat(amount);
    if (Number.isNaN(value) || value <= 0) return;
    const wasComplete = goal.saved >= goal.target;
    addGoalContribution(goal.id, value);
    if (!wasComplete && goal.saved + value >= goal.target) {
      fireGoalConfetti();
    }
    setAdding(false);
  }

  function openEdit() {
    setDraftName(goal.name);
    setDraftTarget(String(goal.target));
    setDraftSaved(String(goal.saved));
    setDraftDate(goal.targetDate ? goal.targetDate.slice(0, 10) : "");
    setEditing(true);
  }

  const targetInvalid = !(parseFloat(draftTarget) > 0);

  function saveEdit() {
    if (!draftName.trim() || targetInvalid) return;
    updateGoal(goal.id, {
      name: draftName.trim(),
      target: parseFloat(draftTarget),
      saved: Math.max(0, parseFloat(draftSaved) || 0),
      targetDate: draftDate ? new Date(draftDate).toISOString() : goal.targetDate,
    });
    setEditing(false);
  }

  return (
    <motion.div
      className="card p-5"
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `color-mix(in srgb, ${goal.color} 18%, transparent)`, color: goal.color }}
        >
          {goal.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display font-semibold truncate">{goal.name}</p>
          <p className="text-xs text-[var(--text-muted)]">
            {complete ? "Completed 🎉" : daysLeft >= 0 ? `${daysLeft} days left · ${formatFullDate(goal.targetDate)}` : "Past target date"}
          </p>
        </div>
        {complete && <span className="text-xs font-semibold px-2 py-1 rounded-full bg-[var(--green)]/15 text-[var(--green)] shrink-0">Done</span>}
        {!compact && !editing && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={openEdit}
              aria-label="Edit goal"
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--violet)] transition-colors"
            >
              ✎
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              aria-label="Delete goal"
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-[var(--text-muted)] hover:bg-[var(--red)]/15 hover:text-[var(--red)] transition-colors"
            >
              🗑
            </button>
          </div>
        )}
      </div>

      {editing ? (
        <div className="space-y-2.5">
          <input
            value={draftName}
            onChange={(e) => setDraftName(e.target.value)}
            placeholder="Goal name"
            className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--violet)]"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">Saved so far</label>
              <input
                type="number"
                min="0"
                value={draftSaved}
                onChange={(e) => setDraftSaved(e.target.value)}
                className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--violet)] tabular"
              />
            </div>
            <div>
              <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">Target amount</label>
              <input
                type="number"
                min="1"
                value={draftTarget}
                onChange={(e) => setDraftTarget(e.target.value)}
                className={`w-full rounded-lg bg-[var(--surface-2)] border px-2.5 py-1.5 text-sm outline-none focus:border-[var(--violet)] tabular ${
                  targetInvalid ? "border-[var(--red)]" : "border-[var(--border)]"
                }`}
              />
            </div>
          </div>
          {targetInvalid && <p className="text-[11px] text-[var(--red)]">Target must be more than $0.</p>}
          <div>
            <label className="text-[10px] text-[var(--text-muted)] mb-0.5 block">Target date</label>
            <input
              type="date"
              value={draftDate}
              onChange={(e) => setDraftDate(e.target.value)}
              className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--violet)]"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={saveEdit} disabled={targetInvalid || !draftName.trim()}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : confirmDelete ? (
        <div className="flex items-center gap-2">
          <p className="text-xs text-[var(--text-muted)] flex-1">Delete this goal? Can't be undone.</p>
          <Button size="sm" variant="danger" onClick={() => deleteGoal(goal.id)}>
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <>
          <ProgressBar pct={pct} color={goal.color} height={10} />
          <div className="flex items-center justify-between mt-2 mb-1">
            <span className="text-sm tabular font-semibold">{formatCurrency(goal.saved)}</span>
            <span className="text-xs tabular text-[var(--text-muted)]">of {formatCurrency(goal.target)}</span>
          </div>

          {!compact && !complete && (
            <div className="mt-3">
              {adding ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-[var(--text-muted)]">$</span>
                  <input
                    autoFocus
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2.5 py-1.5 text-sm outline-none focus:border-[var(--violet)] tabular"
                  />
                  <Button size="sm" onClick={handleAdd}>
                    Add
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => setAdding(true)} className="w-full">
                  + Add funds
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
