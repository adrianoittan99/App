import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppStore } from "../lib/store";
import { useAuth } from "../lib/authContext";
import { formatCurrency } from "../lib/format";
import { Button } from "../components/ui/Button";
import { Card, CardHeader } from "../components/ui/Card";
import { InfoTip } from "../components/ui/InfoTip";

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
  const updateAccountBalance = useAppStore((s) => s.updateAccountBalance);
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
        <CardHeader
          title={
            <span className="flex items-center gap-1.5">
              Accounts
              <InfoTip title="Why edit this here" side="top">
                These balances are what your Net worth, Emergency runway, and Debt load score all read from. Adding a
                transaction adjusts them automatically — but if a balance is just out of date, click it and type the real
                number.
              </InfoTip>
            </span>
          }
          subtitle="Click a balance to correct it — this feeds net worth and your runway directly"
        />
        <div className="divide-y divide-[var(--border)]">
          {accounts.map((a) => (
            <AccountRow key={a.id} name={a.name} type={a.type} balance={a.balance} onSave={(v) => updateAccountBalance(a.id, v)} />
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

      <p className="text-xs text-[var(--text-faint)] text-center pt-2">
        Aurora — built by <span className="font-medium text-[var(--text-muted)]">Adrian Ibarra</span>
      </p>
    </div>
  );
}

function AccountRow({
  name,
  type,
  balance,
  onSave,
}: {
  name: string;
  type: string;
  balance: number;
  onSave: (value: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(balance));

  function commit() {
    const val = parseFloat(draft);
    if (!Number.isNaN(val)) onSave(val);
    else setDraft(String(balance));
    setEditing(false);
  }

  return (
    <div className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{name}</p>
        <p className="text-xs text-[var(--text-muted)]">{ACCOUNT_LABEL[type] ?? type}</p>
      </div>
      {editing ? (
        <div className="flex items-center gap-1">
          <span className="text-xs text-[var(--text-muted)]">$</span>
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") {
                setDraft(String(balance));
                setEditing(false);
              }
            }}
            type="number"
            step="0.01"
            className="w-28 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] px-2 py-1 text-sm tabular text-right outline-none focus:border-[var(--violet)]"
          />
        </div>
      ) : (
        <button
          onClick={() => {
            setDraft(String(balance));
            setEditing(true);
          }}
          className={`text-sm font-semibold tabular underline decoration-dotted decoration-[var(--text-faint)] hover:decoration-[var(--violet)] ${
            balance < 0 ? "text-[var(--red)]" : ""
          }`}
        >
          {formatCurrency(balance, true)}
        </button>
      )}
    </div>
  );
}
