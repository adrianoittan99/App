import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

interface InfoTipAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface InfoTipProps {
  title: string;
  children: ReactNode;
  action?: InfoTipAction;
  align?: "left" | "right";
  className?: string;
  /** "light" renders a translucent white bubble for use over photos/gradients instead of surface colors. */
  tone?: "default" | "light";
  /** Which side the popover opens toward — "top" avoids clipping inside a card whose tip sits near the bottom edge. */
  side?: "top" | "bottom";
}

/**
 * A small "?" affordance next to any metric or field. Click to open a short
 * explanation of how that number is calculated — and, where there's a real
 * place to act on it, a button that jumps straight there (or does it right
 * away, like opening the Add Transaction modal).
 */
export function InfoTip({ title, children, action, align = "right", className, tone = "default", side = "bottom" }: InfoTipProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className={`relative inline-flex ${className ?? ""}`} ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label={`About ${title}`}
        aria-expanded={open}
        className={
          tone === "light"
            ? "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none bg-white/25 text-white hover:bg-white/40 transition-colors shrink-0"
            : "w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold leading-none bg-[var(--surface-3)] text-[var(--text-muted)] hover:bg-[var(--violet)] hover:text-white transition-colors shrink-0"
        }
      >
        i
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: side === "top" ? 4 : -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] as const }}
            className={`absolute z-50 w-64 max-w-[80vw] rounded-xl p-3.5 glass shadow-lg text-left ${
              side === "top" ? "bottom-full mb-2" : "top-full mt-2"
            } ${align === "right" ? "right-0" : "left-0"}`}
          >
            <p className="text-xs font-semibold mb-1">{title}</p>
            <div className="text-xs text-[var(--text-muted)] leading-relaxed">{children}</div>
            {action &&
              (action.to ? (
                <Link
                  to={action.to}
                  onClick={() => setOpen(false)}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--violet)] hover:underline"
                >
                  {action.label}
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    action.onClick?.();
                    setOpen(false);
                  }}
                  className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-[var(--violet)] hover:underline"
                >
                  {action.label}
                </button>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
