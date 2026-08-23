// Small display helpers.

const currencySymbols: Record<string, string> = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
};

export function money(amount: number, currency = "PHP"): string {
  const symbol = currencySymbols[currency] ?? "";
  return `${symbol}${amount.toLocaleString("en-US")}`;
}

export function moneyRange(low: number, high: number, currency = "PHP"): string {
  return `${money(low, currency)} – ${money(high, currency)}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-08-26" -> "Aug 26"  (parses the date parts directly to avoid TZ shifts)
export function shortDate(iso: string): string {
  const [, m, d] = iso.split('-').map(Number);
  if (!m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}`;
}

export function shortRange(start: string, end: string): string {
  return `${shortDate(start)} – ${shortDate(end)}`;
}

// Inclusive day count between two ISO dates.
export function dayCount(start: string, end: string): number {
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  return Math.round((b - a) / 86_400_000) + 1;
}

// Sum helpers for a proposal's days.
export function sumTravel(days: { cost: { travel: number } }[]): number {
  return days.reduce((s, d) => s + d.cost.travel, 0);
}
export function sumFoodLow(days: { cost: { foodLow: number } }[]): number {
  return days.reduce((s, d) => s + d.cost.foodLow, 0);
}
export function sumFoodHigh(days: { cost: { foodHigh: number } }[]): number {
  return days.reduce((s, d) => s + d.cost.foodHigh, 0);
}
