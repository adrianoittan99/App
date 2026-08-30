import clsx from "clsx";
import type { Badge } from "../../lib/calculations";
import { Card, CardHeader } from "../ui/Card";

export function BadgeStrip({ badges }: { badges: Badge[] }) {
  return (
    <Card>
      <CardHeader title="Badges" subtitle="Earned through real habits, not logins" />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {badges.map((b) => (
          <div
            key={b.id}
            className={clsx(
              "rounded-xl p-3 flex flex-col items-center text-center gap-1.5 border",
              b.earned ? "border-[var(--border-strong)] bg-[var(--surface-2)]" : "border-[var(--border)] opacity-40"
            )}
          >
            <span className="text-2xl leading-none">{b.icon}</span>
            <p className="text-[11px] font-semibold leading-tight">{b.label}</p>
            <p className="text-[10px] text-[var(--text-faint)] leading-tight">{b.description}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
