import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { useAppStore } from "../../lib/store";
import { useAuth } from "../../lib/authContext";
import { computeUnderBudgetStreak } from "../../lib/calculations";
import { AddTransactionModal } from "../transactions/AddTransactionModal";
import { AuroraAcademy } from "../academy/AuroraAcademy";
import { ToastHost } from "../ui/ToastHost";
import { Button } from "../ui/Button";

const NAV_ITEMS = [
  { to: "/app", label: "Dashboard", icon: "◧", end: true },
  { to: "/app/transactions", label: "Transactions", icon: "☰", end: false },
  { to: "/app/balances", label: "Balances", icon: "◈", end: false },
  { to: "/app/budgets", label: "Envelopes", icon: "▤", end: false },
  { to: "/app/goals", label: "Goals", icon: "◎", end: false },
  { to: "/app/insights", label: "Insights", icon: "✦", end: false },
  { to: "/app/settings", label: "Settings", icon: "⚙", end: false },
];

export function AppShell() {
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const transactions = useAppStore((s) => s.transactions);
  const envelopes = useAppStore((s) => s.envelopes);
  const remoteMode = useAppStore((s) => s.remoteMode);
  const addOpen = useAppStore((s) => s.addTransactionModalOpen);
  const openAdd = useAppStore((s) => s.openAddTransactionModal);
  const closeAdd = useAppStore((s) => s.closeAddTransactionModal);
  const hasSeenIntro = useAppStore((s) => s.hasSeenIntro);
  const markIntroSeen = useAppStore((s) => s.markIntroSeen);
  const { session, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [academyOpen, setAcademyOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenIntro) setAcademyOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function closeAcademy() {
    setAcademyOpen(false);
    markIntroSeen();
  }

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const streak = computeUnderBudgetStreak(transactions, envelopes);

  return (
    <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
      {/* Sidebar (desktop) */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-[var(--border)] px-4 py-6 sticky top-0 h-screen">
        <Link to="/" className="flex items-center gap-2 px-2 mb-8">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-display font-bold bg-[image:var(--aurora-gradient)]">A</span>
          <span className="font-display font-bold text-lg">Aurora</span>
        </Link>

        <nav className="flex-1 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
                )
              }
            >
              <span className="w-5 text-center opacity-80">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
          <button
            onClick={() => setAcademyOpen(true)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] transition-colors"
          >
            <span className="w-5 text-center opacity-80">?</span>
            How Aurora works
          </button>
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--border)] flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <span className="text-base">🔥</span>
              <span className="tabular">{streak}-day streak</span>
            </div>
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--surface-2)] hover:bg-[var(--surface-3)] transition-colors text-sm"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          </div>

          {remoteMode && session ? (
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs text-[var(--text-muted)] truncate" title={session.user.email ?? undefined}>
                {session.user.email}
              </span>
              <button onClick={handleSignOut} className="text-xs font-medium text-[var(--red)] hover:underline shrink-0">
                Sign out
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
            >
              <span>Demo mode — data isn't saved</span>
              <span className="text-[var(--violet)]">Sign up →</span>
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 glass border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-display font-bold text-sm bg-[image:var(--aurora-gradient)]">A</span>
            <span className="font-display font-bold">Aurora</span>
          </Link>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-2)] text-sm" aria-label="Toggle theme">
              {theme === "dark" ? "☀" : "☾"}
            </button>
            <button onClick={() => setMobileNavOpen((v) => !v)} className="w-8 h-8 rounded-full flex items-center justify-center bg-[var(--surface-2)] text-sm" aria-label="Menu">
              {mobileNavOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
        {mobileNavOpen && (
          <nav className="flex flex-col gap-1 px-3 pb-3">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileNavOpen(false)}
                className={({ isActive }) =>
                  clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium",
                    isActive ? "bg-[var(--surface-2)] text-[var(--text)]" : "text-[var(--text-muted)]"
                  )
                }
              >
                <span className="w-5 text-center opacity-80">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setMobileNavOpen(false);
                setAcademyOpen(true);
              }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)]"
            >
              <span className="w-5 text-center opacity-80">?</span>
              How Aurora works
            </button>
          </nav>
        )}
      </div>

      {/* Main */}
      <div className="flex-1 min-w-0">
        <header className="hidden lg:flex items-center justify-between px-8 py-5 border-b border-[var(--border)] sticky top-0 z-30 glass">
          <div>
            <p className="text-xs text-[var(--text-muted)]">Welcome back</p>
            <p className="font-display font-semibold text-lg">Let's see where your money stands.</p>
          </div>
          <Button size="md" onClick={() => openAdd()} icon={<span className="text-base leading-none">+</span>}>
            Add transaction
          </Button>
        </header>

        <main className="px-4 py-4 lg:px-8 lg:py-8 pt-20 lg:pt-8 max-w-7xl mx-auto w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile floating add button */}
      <button
        onClick={() => openAdd()}
        className="lg:hidden fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full text-white text-2xl flex items-center justify-center shadow-[var(--shadow-glow)] bg-[image:var(--aurora-gradient)]"
        aria-label="Add transaction"
      >
        +
      </button>

      <AddTransactionModal open={addOpen} onClose={closeAdd} />
      <AuroraAcademy open={academyOpen} onClose={closeAcademy} />
      <ToastHost />
    </div>
  );
}
