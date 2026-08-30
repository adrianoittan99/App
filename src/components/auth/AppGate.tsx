import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../lib/authContext";
import { useAppStore } from "../../lib/store";
import { fetchOnboardingStatus, hydrateStoreFromSupabase } from "../../lib/remoteSync";
import { AppShell } from "../layout/AppShell";

type GateState = "checking" | "ready" | "needs-onboarding";

/**
 * Sits at the /app route. With no session, it's exactly the local demo,
 * unchanged. With a session, it checks onboarding, loads the user's real
 * data from Supabase into the store, then renders the same AppShell —
 * every page underneath is unaware of which mode it's in.
 */
export function AppGate() {
  const { session, loading: authLoading } = useAuth();
  const [state, setState] = useState<GateState>(session ? "checking" : "ready");

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!session) {
        useAppStore.getState().exitRemoteMode();
        if (!cancelled) setState("ready");
        return;
      }
      setState("checking");
      const onboarded = await fetchOnboardingStatus(session.user.id);
      if (cancelled) return;
      if (!onboarded) {
        setState("needs-onboarding");
        return;
      }
      await hydrateStoreFromSupabase(session.user.id);
      if (!cancelled) setState("ready");
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (authLoading || state === "checking") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="w-8 h-8 rounded-full border-2 border-[var(--border-strong)] border-t-[var(--violet)] animate-spin" />
      </div>
    );
  }

  if (state === "needs-onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <AppShell />;
}
