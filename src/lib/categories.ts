import type { Category, CategoryId } from "./types";

export const CATEGORIES: Record<CategoryId, Category> = {
  income: { id: "income", label: "Income", color: "var(--green)", icon: "↓" },
  housing: { id: "housing", label: "Housing", color: "#8b5cf6", icon: "⌂" },
  groceries: { id: "groceries", label: "Groceries", color: "#2dd4bf", icon: "◆" },
  dining: { id: "dining", label: "Dining Out", color: "#f59e0b", icon: "◈" },
  transport: { id: "transport", label: "Transport", color: "#60a5fa", icon: "▲" },
  subscriptions: { id: "subscriptions", label: "Subscriptions", color: "#ec4899", icon: "◐" },
  utilities: { id: "utilities", label: "Utilities", color: "#fb7185", icon: "⚡" },
  shopping: { id: "shopping", label: "Shopping", color: "#f472b6", icon: "◇" },
  health: { id: "health", label: "Health", color: "#34d399", icon: "✚" },
  entertainment: { id: "entertainment", label: "Entertainment", color: "#a78bfa", icon: "♫" },
  travel: { id: "travel", label: "Travel", color: "#38bdf8", icon: "✈" },
  savings: { id: "savings", label: "Savings", color: "#22d3ee", icon: "●" },
  other: { id: "other", label: "Other", color: "#94a3b8", icon: "○" },
};

export const CATEGORY_LIST = Object.values(CATEGORIES);

export const EXPENSE_CATEGORIES = CATEGORY_LIST.filter((c) => c.id !== "income");
