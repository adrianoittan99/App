import type { Account, Envelope, Goal, RecurringTransaction, Transaction } from "./types";
import { mulberry32, randInt, randRange, pick } from "./rng";

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}_${idCounter.toString(36)}`;
}

function iso(y: number, m: number, d: number): string {
  // month is 1-indexed for readability at call sites
  const date = new Date(Date.UTC(y, m - 1, Math.min(d, daysInMonth(y, m))));
  return date.toISOString().slice(0, 10);
}

function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

interface MonthCursor {
  year: number;
  month: number; // 1-12
}

function monthsBack(count: number, from = new Date()): MonthCursor[] {
  const out: MonthCursor[] = [];
  let y = from.getUTCFullYear();
  let m = from.getUTCMonth() + 1;
  for (let i = count - 1; i >= 0; i -= 1) {
    let yy = y;
    let mm = m - i;
    while (mm <= 0) {
      mm += 12;
      yy -= 1;
    }
    out.push({ year: yy, month: mm });
  }
  return out;
}

const DINING_SPOTS = ["Ramen House", "Tacos El Sol", "Sushi Nova", "Corner Bistro", "Blue Bottle Coffee", "Pizzeria Luna", "The Green Bowl"];
const GROCERY_SPOTS = ["Trader Joe's", "Whole Foods", "Local Market Co-op", "Fresh Grocer"];
const TRANSPORT_SPOTS = ["Uber", "Lyft", "Shell Gas Station", "Metro Transit Card"];
const SHOPPING_SPOTS = ["Amazon", "Target", "Zara", "Best Buy", "IKEA"];
const HEALTH_SPOTS = ["CVS Pharmacy", "Dr. Ha Dental", "Fit Supplements Co", "Riverside Clinic"];
const ENTERTAINMENT_SPOTS = ["AMC Theatres", "Steam", "Concert Tickets Co", "Bowling Alley"];

const SUBSCRIPTIONS: { merchant: string; amount: number; day: number }[] = [
  { merchant: "Netflix", amount: 15.49, day: 15 },
  { merchant: "Spotify Premium", amount: 11.99, day: 18 },
  { merchant: "iCloud+ 200GB", amount: 2.99, day: 20 },
  { merchant: "Gym Pulse Fitness", amount: 49.99, day: 1 },
  { merchant: "Adobe Creative Cloud", amount: 54.99, day: 22 },
  { merchant: "NYT Digital", amount: 17.0, day: 25 },
  { merchant: "Amazon Prime", amount: 14.99, day: 8 },
];

export function generateTransactions(monthsOfHistory = 6, today = new Date()): Transaction[] {
  const rand = mulberry32(20260830);
  const txns: Transaction[] = [];
  const months = monthsBack(monthsOfHistory, today);
  const todayCutoff = today.toISOString().slice(0, 10);

  const push = (date: string, merchant: string, category: Transaction["category"], amount: number, account: string, note?: string) => {
    if (date > todayCutoff) return; // never generate future-dated transactions
    txns.push({ id: nextId("txn"), date, merchant, category, amount, account, note });
  };

  months.forEach(({ year, month }, idx) => {
    const isCurrentMonth = idx === months.length - 1;

    // --- Income: biweekly payroll ---
    push(iso(year, month, 1), "Northwind Labs Payroll", "income", randRange(rand, 3020, 3210), "Everyday Checking");
    push(iso(year, month, 15), "Northwind Labs Payroll", "income", randRange(rand, 3020, 3210), "Everyday Checking");
    if (rand() < 0.35) {
      push(iso(year, month, randInt(rand, 3, 26)), "Freelance — Halcyon Design Co", "income", randRange(rand, 220, 940), "Everyday Checking");
    }

    // --- Housing ---
    push(iso(year, month, 3), "Skyline Apartments", "housing", -1850, "Everyday Checking", "Rent");

    // --- Utilities ---
    push(iso(year, month, 10), "City Power & Light", "utilities", -randRange(rand, 78, 138), "Everyday Checking");
    push(iso(year, month, 12), "AquaFlow Water", "utilities", -randRange(rand, 32, 58), "Everyday Checking");
    push(iso(year, month, 5), "Comcast Internet", "utilities", -79.99, "Everyday Checking");

    // --- Subscriptions (fixed day + amount so the X-ray can detect them cleanly) ---
    SUBSCRIPTIONS.forEach((sub) => {
      push(iso(year, month, sub.day), sub.merchant, "subscriptions", -sub.amount, "Aurora Credit Card");
    });

    // --- Groceries ---
    const groceryTrips = randInt(rand, 7, 10);
    for (let i = 0; i < groceryTrips; i += 1) {
      push(iso(year, month, randInt(rand, 1, 28)), pick(rand, GROCERY_SPOTS), "groceries", -randRange(rand, 18, 96), "Aurora Credit Card");
    }

    // --- Dining ---
    const diningTrips = randInt(rand, 9, 15);
    for (let i = 0; i < diningTrips; i += 1) {
      push(iso(year, month, randInt(rand, 1, 28)), pick(rand, DINING_SPOTS), "dining", -randRange(rand, 6, 58), "Aurora Credit Card");
    }

    // --- Transport ---
    const transportTrips = randInt(rand, 6, 11);
    for (let i = 0; i < transportTrips; i += 1) {
      push(iso(year, month, randInt(rand, 1, 28)), pick(rand, TRANSPORT_SPOTS), "transport", -randRange(rand, 8, 62), "Aurora Credit Card");
    }

    // --- Shopping ---
    const shoppingTrips = randInt(rand, 3, 6);
    for (let i = 0; i < shoppingTrips; i += 1) {
      push(iso(year, month, randInt(rand, 1, 28)), pick(rand, SHOPPING_SPOTS), "shopping", -randRange(rand, 16, 224), "Aurora Credit Card");
    }

    // --- Health ---
    const healthTrips = randInt(rand, 1, 3);
    for (let i = 0; i < healthTrips; i += 1) {
      push(iso(year, month, randInt(rand, 1, 28)), pick(rand, HEALTH_SPOTS), "health", -randRange(rand, 12, 156), "Everyday Checking");
    }

    // --- Entertainment ---
    const funTrips = randInt(rand, 2, 5);
    for (let i = 0; i < funTrips; i += 1) {
      push(iso(year, month, randInt(rand, 1, 28)), pick(rand, ENTERTAINMENT_SPOTS), "entertainment", -randRange(rand, 11, 88), "Aurora Credit Card");
    }

    // --- Travel (occasional) ---
    if (rand() < 0.3) {
      push(iso(year, month, randInt(rand, 4, 24)), pick(rand, ["Delta Airlines", "Airbnb", "Marriott Hotels"]), "travel", -randRange(rand, 320, 1180), "Everyday Checking");
    }

    // --- Auto-transfer to savings goal ---
    if (!isCurrentMonth || today.getUTCDate() >= 27) {
      push(iso(year, month, 27), "Auto-Transfer — Emergency Fund", "savings", -randRange(rand, 320, 480), "Everyday Checking");
    }
  });

  txns.sort((a, b) => (a.date < b.date ? 1 : -1));
  return txns;
}

export function generateAccounts(): Account[] {
  return [
    { id: nextId("acct"), name: "Everyday Checking", type: "checking", balance: 4186.42 },
    { id: nextId("acct"), name: "High-Yield Savings", type: "savings", balance: 15840.0 },
    { id: nextId("acct"), name: "Aurora Credit Card", type: "credit", balance: -1243.18, apr: 0.2299, minimumPayment: 45, dueDay: 12 },
    { id: nextId("acct"), name: "Brokerage — Index Mix", type: "investment", balance: 22310.55 },
    { id: nextId("acct"), name: "Federal Student Loan", type: "loan", balance: -18400, apr: 0.0549, minimumPayment: 210, dueDay: 28 },
  ];
}

export function generateRecurringTransactions(): RecurringTransaction[] {
  return [
    { id: nextId("rec"), merchant: "Northwind Labs Payroll", category: "income", amount: 3100, account: "Everyday Checking", dayOfMonth: 1 },
    { id: nextId("rec"), merchant: "Skyline Apartments", category: "housing", amount: -1850, account: "Everyday Checking", dayOfMonth: 3 },
    { id: nextId("rec"), merchant: "Netflix", category: "subscriptions", amount: -15.49, account: "Aurora Credit Card", dayOfMonth: 15 },
    { id: nextId("rec"), merchant: "Spotify Premium", category: "subscriptions", amount: -11.99, account: "Aurora Credit Card", dayOfMonth: 18 },
    { id: nextId("rec"), merchant: "Gym Pulse Fitness", category: "subscriptions", amount: -49.99, account: "Aurora Credit Card", dayOfMonth: 1 },
  ];
}

export function generateGoals(today = new Date()): Goal[] {
  const add = (d: Date, days: number) => new Date(d.getTime() + days * 86400000).toISOString().slice(0, 10);
  return [
    {
      id: nextId("goal"),
      name: "Emergency Fund",
      icon: "☂",
      color: "#2dd4bf",
      target: 15000,
      saved: 9200,
      targetDate: add(today, 245),
    },
    {
      id: nextId("goal"),
      name: "Dream Trip — Japan",
      icon: "✈",
      color: "#60a5fa",
      target: 4200,
      saved: 2650,
      targetDate: add(today, 120),
    },
    {
      id: nextId("goal"),
      name: "New MacBook",
      icon: "◧",
      color: "#f59e0b",
      target: 2200,
      saved: 2200,
      targetDate: add(today, -6),
    },
    {
      id: nextId("goal"),
      name: "House Down Payment",
      icon: "⌂",
      color: "#a78bfa",
      target: 60000,
      saved: 18400,
      targetDate: add(today, 1050),
    },
  ];
}

export function generateEnvelopes(): Envelope[] {
  // Limits are tuned against the ranges above so a typical month lands
  // mostly "on track"/"watch", with shopping as the one standout leak —
  // a realistic budget, not a wall of red.
  return [
    { id: nextId("env"), categoryId: "housing", monthlyLimit: 2000 },
    { id: nextId("env"), categoryId: "groceries", monthlyLimit: 600 },
    { id: nextId("env"), categoryId: "dining", monthlyLimit: 400 },
    { id: nextId("env"), categoryId: "transport", monthlyLimit: 320 },
    { id: nextId("env"), categoryId: "subscriptions", monthlyLimit: 175 },
    { id: nextId("env"), categoryId: "utilities", monthlyLimit: 280 },
    { id: nextId("env"), categoryId: "shopping", monthlyLimit: 450 },
    { id: nextId("env"), categoryId: "health", monthlyLimit: 190 },
    { id: nextId("env"), categoryId: "entertainment", monthlyLimit: 210 },
    { id: nextId("env"), categoryId: "travel", monthlyLimit: 200 },
    { id: nextId("env"), categoryId: "savings", monthlyLimit: 420 },
    { id: nextId("env"), categoryId: "other", monthlyLimit: 100 },
  ];
}
