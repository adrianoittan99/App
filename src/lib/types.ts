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
  type: "checking" | "savings" | "credit" | "investment" | "loan";
  balance: number;
  // Debt-only fields (credit / loan accounts) — all optional, all set from
  // the Balances page after the fact, never required at onboarding.
  apr?: number; // annual interest rate, e.g. 0.2299 for 22.99%
  minimumPayment?: number;
  dueDay?: number; // day of month, 1-31, the payment is due
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

// Payload used to replace the store's local/demo data with a signed-in
// user's real data fetched from Supabase.
export interface RemoteHydratePayload {
  transactions: Transaction[];
  accounts: Account[];
  envelopes: Envelope[];
  goals: Goal[];
  canceledSubscriptions: string[];
  theme?: ThemeMode;
}
