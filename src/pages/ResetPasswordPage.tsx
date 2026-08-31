import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../lib/authContext";
import { Button } from "../components/ui/Button";
import { PasswordInput } from "../components/ui/PasswordInput";

/**
 * Landing spot for the link Supabase emails from "Forgot password?". Supabase
 * establishes a session from the recovery token in the URL automatically
 * (handled by supabase-js on load) — this page just asks for the new
 * password once that session exists.
 */
export function ResetPasswordPage() {
  const { session, loading, updatePassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (result) {
      setError(result);
      return;
    }
    setDone(true);
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

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--violet)] animate-spin" />
          </div>
        ) : done ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-3">✅</p>
            <h1 className="font-display font-semibold text-lg mb-2">Password updated</h1>
            <p className="text-sm text-[var(--text-muted)] mb-5">You're all set — head back to your dashboard.</p>
            <Button size="sm" onClick={() => navigate("/app")}>
              Go to dashboard
            </Button>
          </div>
        ) : !session ? (
          <div className="text-center py-4">
            <p className="text-3xl mb-3">⚠️</p>
            <h1 className="font-display font-semibold text-lg mb-2">This link has expired</h1>
            <p className="text-sm text-[var(--text-muted)] mb-5">Reset links only work for a little while — request a fresh one.</p>
            <Link to="/login">
              <Button size="sm">Back to sign in</Button>
            </Link>
          </div>
        ) : (
          <>
            <h1 className="font-display font-bold text-2xl mb-1">Set a new password</h1>
            <p className="text-sm text-[var(--text-muted)] mb-6">Make it something you haven't used here before.</p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">New password</label>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
              </div>
              <div>
                <label className="text-xs text-[var(--text-muted)] mb-1 block">Confirm new password</label>
                <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              {error && <p className="text-xs text-[var(--red)]">{error}</p>}
              <Button type="submit" size="lg" className="w-full mt-2" disabled={submitting}>
                {submitting ? "Saving…" : "Update password"}
              </Button>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}
