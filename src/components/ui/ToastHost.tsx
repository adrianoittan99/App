import { AnimatePresence, motion } from "framer-motion";
import { useToastStore } from "../../lib/toastStore";

const TONE_STYLE: Record<string, string> = {
  error: "border-[var(--red)]/30 bg-[var(--red)]/10",
  success: "border-[var(--green)]/30 bg-[var(--green)]/10",
  info: "glass",
};

const TONE_ICON: Record<string, string> = {
  error: "⚠",
  success: "✓",
  info: "•",
};

/** Mounted once in AppShell — a fixed stack of transient notifications. */
export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 lg:left-auto lg:right-5 lg:translate-x-0 z-[70] flex flex-col gap-2 w-[calc(100%-2.5rem)] max-w-sm">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
            className={`rounded-xl border p-3.5 shadow-lg flex items-center gap-3 ${TONE_STYLE[t.tone]}`}
          >
            <span className="text-sm shrink-0">{TONE_ICON[t.tone]}</span>
            <p className="text-xs flex-1 leading-relaxed">{t.message}</p>
            {t.action && (
              <button
                onClick={() => {
                  t.action?.onClick();
                  dismiss(t.id);
                }}
                className="text-xs font-semibold text-[var(--violet)] hover:underline shrink-0"
              >
                {t.action.label}
              </button>
            )}
            <button onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-xs text-[var(--text-faint)] hover:text-[var(--text-muted)] shrink-0">
              ✕
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
