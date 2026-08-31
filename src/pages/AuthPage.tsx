import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/authContext";
import { Button } from "../components/ui/Button";

export function AuthPage() {
  const { session, loading, signInWithEmail, signUpWithEmail, sendPasswordReset } = useAuth();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"signin" | "signup" | "forgot">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  if (!loading && session) {
    return <Navigate to="/app" replace />;
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = await sendPasswordReset(email);
    setSubmitting(false);
    if (result) {
      setError(result);
      return;
    }
    setResetSent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (mode === "signup") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match.");
        return;
      }
    }

    setSubmitting(true);
    const result =
      mode === "signup" ? await signUpWithEmail(email, password, displayName.trim()) : await signInWithEmail(email, password);
    setSubmitting(false);

    if (result) {
      setError(result);
      return;
    }

    if (mode === "signup") {
      // If email confirmation is enabled in the Supabase project, there's no
      // session yet — tell the user to check their inbox instead of
      // silently doing nothing.
      setConfirmSent(true);
      return;
    }
    navigate("/app");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: "var(--bg)" }}>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 -left-20 w-[420px] h-[420px] rounded-full opacity-30 blur-3xl animate-drift"
          style={{ background: "radial-gradient(circle, var(--teal), transparent 70%)" }}
        />
        <div
          className="absolute bottom-0 right-0 w-[420px] h-[420px] rounded-full opacity-25 blur-3xl animate-drift"
          style={{ background: "radial-gradient(circle, var(--violet), transparent 70%)", animationDelay: "-6s" }}
        />
      </div>

      <motion.div
        className="w-full max-w-sm card p-7"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
      >
        <Link to="/" className="flex items-center gap-2 mb-6">
          <span className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-display font-bold bg-[image:var(--aurora-gradient)]">
            A
          </span>
          <span className="font-display font-bold text-lg">Aurora</span>
        </Link>

        {confirmSent ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-3">📬</p>
            <h1 className="font-display font-semibold text-lg mb-2">Check your inbox</h1>
            <p className="text-sm text-[var(--text-muted)]">
              We sent a confirmation link to <span className="text-[var(--text)]">{email}</span>. Click it, then come back and
              sign in.
            </p>
            <Button variant="secondary" size="sm" className="mt-5" onClick={() => { setConfirmSent(false); setMode("signin"); }}>
              Back to sign in
            </Button>
          </div>
        ) : mode === "forgot" ? (
          resetSent ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-3">📬</p>
              <h1 className="font-display font-semibold text-lg mb-2">Check your inbox</h1>
              <p className="text-sm text-[var(--text-muted)]">
                If <span className="text-[var(--text)]">{email}</span> has an Aurora account, we've sent a link to reset the
                password.
              </p>
              <Button
                variant="secondary"
                size="sm"
                className="mt-5"
                onClick={() => {
                  setResetSent(false);
                  setMode("signin");
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <h1 className="font-display font-bold text-2xl mb-1">Reset your password</h1>
              <p className="text-sm text-[var(--text-muted)] mb-6">We'll email you a link to set a new one.</p>
              <form onSubmit={handleForgotSubmit} className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                    required
                  />
                </div>
                {error && <p className="text-xs text-[var(--red)]">{error}</p>}
                <Button type="submit" size="lg" className="w-full mt-2" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signin");
                    setError(null);
                  }}
                  className="text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text)] block mx-auto pt-1"
                >
                  ← Back to sign in
                </button>
              </form>
            </>
          )
        ) : (
          <>
            <h1 className="font-display font-bold text-2xl mb-1">{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">
              {mode === "signin" ? "Sign in to see your real dashboard." : "A couple minutes to set up your own budget."}
            </p>

            <div className="flex gap-2 mb-5 p-1 rounded-full bg-[var(--surface-2)]">
              {(["signin", "signup"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setMode(m);
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
                    mode === m ? "bg-[var(--surface)] text-[var(--text)] shadow" : "text-[var(--text-muted)]"
                  }`}
                >
                  {m === "signin" ? "Sign in" : "Sign up"}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "signup" && (
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Name</label>
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="What should we call you?"
                    className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                    required
                  />
                </div>
              )}
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                  required
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-[var(--text-muted)]">Password</label>
                  {mode === "signin" && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setError(null);
                      }}
                      className="text-xs font-medium text-[var(--violet)] hover:underline"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
                  className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                  required
                />
              </div>
              {mode === "signup" && (
                <div>
                  <label className="text-xs text-[var(--text-muted)] mb-1 block">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-3.5 py-2.5 text-sm outline-none focus:border-[var(--violet)]"
                    required
                  />
                </div>
              )}

              {error && <p className="text-xs text-[var(--red)]">{error}</p>}

              <Button type="submit" size="lg" className="w-full mt-2" disabled={submitting}>
                {submitting ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <p className="text-xs text-[var(--text-faint)] text-center mt-5">
              Just want to look around first?{" "}
              <Link to="/app" className="text-[var(--violet)] hover:underline">
                Try the demo
              </Link>{" "}
              — no account needed.
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}
