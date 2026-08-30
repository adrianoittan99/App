export type CategoryId =
  | "income"
  | "housing"
  | "groceries"
  | "dining"
  | "transport"
  | "subscriptions"
  | "utilities"
  | "shopping"
  | "health"
  | "entertainment"
  | "travel"
  | "savings"
  | "other";

export interface Category {
  id: CategoryId;
  label: string;
  color: string; // CSS color token
  icon: string; // emoji/glyph kept intentionally simple, no icon font dependency
}

export interface Transaction {
  id: string;
  date: string; // ISO date
  merchant: string;
  category: CategoryId;
  amount: number; // negative = expense, positive = income
  account: string;
  note?: string;
  recurringGroup?: string; // set by detectRecurring, not stored originally
}

export interface Envelope {
  id: string;
  categoryId: CategoryId;
  monthlyLimit: number;
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  color: string;
  target: number;
  saved: number;
  targetDate: string; // ISO date
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
}

export type ThemeMode = "dark" | "light";

export interface Subscription {
  key: string;
  merchant: string;
  category: CategoryId;
  monthlyCost: number;
  annualCost: number;
  occurrences: number;
  lastDate: string;
  canceled: boolean;
}

export interface FutureProjectionPoint {
  year: number;
  age: number;
  conservative: number;
  projected: number;
  optimistic: number;
}

export type WeatherKind = "sunny" | "partly-cloudy" | "cloudy" | "stormy" | "rainbow";

export interface MoneyWeather {
  kind: WeatherKind;
  headline: string;
  detail: string;
  temperature: number; // stylized "financial temperature" -20..40
}
