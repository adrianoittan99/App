import { useState } from "react";
import { useAppStore } from "../lib/store";
import { GoalCard } from "../components/goals/GoalCard";
import { Button } from "../components/ui/Button";
import { InfoTip } from "../components/ui/InfoTip";

const ICON_CHOICES = ["◎", "☂", "✈", "⌂", "◧", "♥", "★", "◈"];
const COLOR_CHOICES = ["#2dd4bf", "#8b5cf6", "#ec4899", "#f59e0b", "#60a5fa", "#34d399"];

export function GoalsPage() {
  const goals = useAppStore((s) => s.goals);
  const createGoal = useAppStore((s) => s.createGoal);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("1000");
  const [months, setMonths] = useState("6");
  const [icon, setIcon] = useState(ICON_CHOICES[0]);
  const [color, setColor] = useState(COLOR_CHOICES[0]);

  const targetInvalid = !(Number(target) > 0);

  function handleCreate() {
    if (!name.trim() || targetInvalid) return;
    const targetDate = new Date(Date.now() + Number(months) * 30 * 86400000).toISOString();
    createGoal({ name: name.trim(), icon, color, target: Number(target), saved: 0, targetDate });
    setName("");
    setTarget("1000");
    setMonths("6");
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl flex items-center gap-2">
            Goals
            <InfoTip title="How goals work">
              Set a target amount and a date, then add funds whenever you like — "Add funds" just moves the needle, it
              doesn't touch a real account. Cross the finish line and Aurora celebrates: your next Money Weather check can
              turn into a rainbow, and it counts toward the "Goal Getter" badge.
            </InfoTip>
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{goals.filter((g) => g.saved >= g.target).length} of {goals.length} completed</p>
        </div>
        <Button onClick={() => setOpen((v) => !v)} icon={<span>+</span>}>
          New goal
        </Button>
      </div>

      {open && (
        <div className="card p-5 space-y-3">
          <div className="grid sm:grid-cols-3 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Goal name" className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]" />
            <input value={target} onChange={(e) => setTarget(e.target.value)} type="number" min="1" placeholder="Target amount" className={`rounded-xl bg-[var(--surface-2)] border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)] tabular ${targetInvalid ? "border-[var(--red)]" : "border-[var(--border)]"}`} />
            <input value={months} onChange={(e) => setMonths(e.target.value)} type="number" min="1" placeholder="Months to reach it" className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)] tabular" />
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5">
              {ICON_CHOICES.map((i) => (
                <button key={i} onClick={() => setIcon(i)} className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${icon === i ? "border-[var(--violet)] bg-[var(--violet)]/15" : "border-[var(--border)]"}`}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {COLOR_CHOICES.map((c) => (
                <button key={c} onClick={() => setColor(c)} className="w-6 h-6 rounded-full border-2" style={{ background: c, borderColor: color === c ? "var(--text)" : "transparent" }} />
              ))}
            </div>
            <Button size="sm" onClick={handleCreate} className="ml-auto" disabled={targetInvalid || !name.trim()}>
              Create goal
            </Button>
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} />
        ))}
      </div>
    </div>
  );
}
