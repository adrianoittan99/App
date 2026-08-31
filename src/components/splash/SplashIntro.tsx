import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SESSION_KEY = "aurora_splash_shown";

/**
 * A brief brand moment shown once per browser session when entering the
 * app — not on every internal navigation. Mirrors what a native splash
 * screen will do once this ships through Capacitor.
 *
 * Calls onDone the moment it's fully gone (either it never showed because
 * this session already saw it, or its exit animation just finished) — the
 * Aurora Academy tutorial waits for that signal before auto-opening, so the
 * two never compete for the same screen on a brand-new visit.
 */
export function SplashIntro({ onDone }: { onDone?: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) {
      onDone?.();
      return;
    }
    setVisible(true);
    sessionStorage.setItem(SESSION_KEY, "1");
    const timer = setTimeout(() => setVisible(false), 2200);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence onExitComplete={onDone}>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <motion.div
            className="absolute inset-0"
            style={{ background: "var(--aurora-gradient)", backgroundSize: "200% 200%" }}
            animate={{ backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          <div className="absolute inset-0 noise-veil" />

          {Array.from({ length: 10 }).map((_, i) => (
            <motion.span
              key={i}
              className="absolute w-1 h-1 rounded-full bg-white"
              style={{ left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%` }}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.8, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2 }}
            />
          ))}

          <motion.span
            className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-white font-display font-bold text-3xl bg-white/15 backdrop-blur-sm"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] as const }}
          >
            A
          </motion.span>

          <motion.p
            className="relative font-display font-bold text-2xl text-white mt-4 tracking-tight"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            Aurora
          </motion.p>

          <motion.p
            className="relative text-white/85 text-sm mt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            See your money clearly.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
