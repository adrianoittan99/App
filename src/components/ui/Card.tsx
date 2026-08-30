import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";

type SafeDivProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart" | "onAnimationEnd" | "onAnimationIteration"
>;

interface CardProps extends SafeDivProps {
  children: ReactNode;
  animate?: boolean;
  delay?: number;
}

export function Card({ children, className, animate = true, delay = 0, ...rest }: CardProps) {
  const Comp = animate ? motion.div : "div";
  const motionProps = animate
    ? {
        initial: { opacity: 0, y: 16 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, margin: "-40px" },
        transition: { duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] as const },
      }
    : {};
  return (
    <Comp className={clsx("card p-5", className)} {...motionProps} {...rest}>
      {children}
    </Comp>
  );
}

export function CardHeader({ title, subtitle, action }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        <h3 className="font-display font-semibold text-[15px] text-[var(--text)]">{title}</h3>
        {subtitle && <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
