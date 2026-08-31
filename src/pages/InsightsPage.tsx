import { FutureSelfSimulator } from "../components/insights/FutureSelfSimulator";
import { SubscriptionXray } from "../components/insights/SubscriptionXray";
import { SpendingDNA } from "../components/insights/SpendingDNA";

export function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl">Insights</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">The tools other budgeting apps skip.</p>
      </div>

      <div className="min-w-0">
        <FutureSelfSimulator />
      </div>
      <div className="grid xl:grid-cols-2 gap-6 items-start">
        <div className="min-w-0">
          <SubscriptionXray />
        </div>
        <div className="min-w-0">
          <SpendingDNA />
        </div>
      </div>
    </div>
  );
}
