import type { CategoryId } from "./types";

// Validated categorical palette (see dataviz skill: worst-case adjacent CVD
// Delta E 8.4 dark / 9.1 light, normal-vision floor 19.3 dark / 19.6 light).
// Order is fixed — it is the safety mechanism, not cosmetic — and slots are
// assigned to categories by fixed priority, never by value/rank. Categories
// past slot 8 fold into the neutral "Other" bucket in chart contexts.
export const CHART_SLOTS: { id: CategoryId; light: string; dark: string; label: string; short: string }[] = [
  { id: "transport", light: "#2a78d6", dark: "#3987e5", label: "Transport", short: "Transport" },
  { id: "dining", light: "#eb6834", dark: "#d95926", label: "Dining Out", short: "Dining" },
  { id: "groceries", light: "#1baf7a", dark: "#199e70", label: "Groceries", short: "Grocery" },
  { id: "utilities", light: "#eda100", dark: "#c98500", label: "Utilities", short: "Utilities" },
  { id: "shopping", light: "#e87ba4", dark: "#d55181", label: "Shopping", short: "Shopping" },
  { id: "savings", light: "#008300", dark: "#008300", label: "Savings", short: "Savings" },
  { id: "housing", light: "#4a3aa7", dark: "#9085e9", label: "Housing", short: "Housing" },
  { id: "subscriptions", light: "#e34948", dark: "#e66767", label: "Subscriptions", short: "Subs" },
];

export const CHART_OTHER = { light: "#a5a3ab", dark: "#6b6f80", label: "Other" };

const SLOT_MAP = new Map(CHART_SLOTS.map((s) => [s.id, s]));

export function chartColorFor(category: CategoryId, theme: "light" | "dark"): string {
  const slot = SLOT_MAP.get(category);
  if (!slot) return theme === "dark" ? CHART_OTHER.dark : CHART_OTHER.light;
  return theme === "dark" ? slot.dark : slot.light;
}

export function chartLabelFor(category: CategoryId): string {
  return SLOT_MAP.get(category)?.label ?? "Other";
}
