import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { useAuth } from "../lib/authContext";
import { formatCurrency } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";

const ACCOUNT_LABEL: Record<string, string> = {
  checking: "Checking",
  savings: "Savings",
  credit: "Credit card",
  investment: "Investment",
};

export function SettingsPage() {
  const theme = useAppStore((s) => s.theme);
  const setTheme = useAppStore((s) => s.setTheme);
  const accounts = useAppStore((s) => s.accounts);
  const remoteMode = useAppStore((s) => s.remoteMode);
  const resetDemoData = useAppStore((s) => s.resetDemoData);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);

  function handleExport() {
    const state = useAppStore.getState();
    const payload = JSON.stringify(
      { transactions: state.transactions, envelopes: state.envelopes, goals: state.goals, accounts: state.accounts },
      null,
      2
    );
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "aurora-budget-export.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Settings</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Appearance, accounts, and your data.</p>
      </div>

      {remoteMode && session && (
        <Card>
          <CardHeader title="Account" subtitle="Signed in — your data syncs to your Aurora account" />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{session.user.email}</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Synced across devices, saved in the cloud</p>
            </div>
            <Button variant="danger" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Appearance" subtitle="Aurora adapts to how you like to work" />
        <div className="flex gap-3">
          {(["dark", "light"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setTheme(mode)}
              className={`flex-1 rounded-xl border p-4 text-left transition-colors ${
                theme === mode ? "border-[var(--violet)] bg-[var(--violet)]/10" : "border-[var(--border)]"
              }`}
            >
              <p className="font-medium capitalize text-sm">{mode} mode</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">{mode === "dark" ? "Aurora at night — the default." : "Clean and bright for daytime use."}</p>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Accounts" subtitle="Linked balances feeding your dashboard" />
        <div className="divide-y divide-[var(--border)]">
          {accounts.map((a) => (
            <div key={a.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{a.name}</p>
                <p className="text-xs text-[var(--text-muted)]">{ACCOUNT_LABEL[a.type]}</p>
              </div>
              <span className={`text-sm font-semibold tabular ${a.balance < 0 ? "text-[var(--red)]" : ""}`}>{formatCurrency(a.balance, true)}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Your data"
          subtitle={remoteMode ? "Saved to your Aurora account — nothing here is a demo anymore" : "This is demo data, stored only in this browser — nothing leaves your device"}
        />
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={handleExport}>
            Export as JSON
          </Button>
          {!remoteMode &&
            (confirmReset ? (
              <div className="flex items-center gap-2">
                <Button variant="danger" onClick={() => { resetDemoData(); setConfirmReset(false); }}>
                  Confirm reset
                </Button>
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={() => setConfirmReset(true)}>
                Reset demo data
              </Button>
            ))}
        </div>
      </Card>
    </div>
  );
}
