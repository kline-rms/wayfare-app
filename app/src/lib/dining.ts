// Time-and-place-aware dining guide helpers.
//
// The dining guide is a set of SUGGESTIONS (never mandatory) that surface when
// you're at a dining stop at its time: which meal it is, and what to order.
import type { Activity, Day } from './types';

/**
 * Parse a clock label to a 0–24 hour float, using the FIRST time and the
 * meridiem from anywhere in the string — so a range like "1:30–2:00 PM" reads
 * as 13:30 (PM applies to the whole range), not 1:30 AM.
 */
export function parseClock(t?: string): number | null {
  if (!t) return null;
  const m = /(\d{1,2})(?::(\d{2}))?/.exec(t);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] ?? 0);
  const ap = (/(AM|PM)/i.exec(t)?.[1] ?? '').toUpperCase();
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  if (!Number.isFinite(h)) return null;
  return h + min / 60;
}

/** Which meal a time-of-day reads as. */
export function mealFor(time?: string): { label: string; emoji: string } {
  const h = parseClock(time) ?? 12;
  if (h < 10.5) return { label: 'Breakfast', emoji: '🍳' };
  if (h < 11.5) return { label: 'Brunch', emoji: '🥞' };
  if (h < 15) return { label: 'Lunch', emoji: '🍽' };
  if (h < 17.5) return { label: 'Merienda', emoji: '🧋' };
  if (h < 21.5) return { label: 'Dinner', emoji: '🍜' };
  return { label: 'Late bite', emoji: '🌙' };
}

/** A block counts as a dining stop if it has order notes or a food-ish category. */
export function isMeal(a: Pick<Activity, 'category' | 'mealSuggestion'>): boolean {
  if (a.mealSuggestion && a.mealSuggestion.trim()) return true;
  return /(meal|food|breakfast|lunch|dinner|brunch|snack|grocery|caf[eé]|dining|restaurant|eat)/i.test(a.category ?? '');
}

/** Split a mealSuggestion string into individual suggested items. */
export function dishesOf(meal?: string): string[] {
  if (!meal) return [];
  return meal
    .split(/[;•]|(?:,(?=\s*[A-Z0-9]))/)
    .map((d) => d.replace(/\.$/, '').trim())
    .filter(Boolean);
}

// ── "are we here now?" — no manual check-in ──────────────────────────────────
// Uses the real clock (app runtime). The demo trips include today's date, so a
// current meal actually resolves; on other days nothing is flagged "now".

export function isToday(dateISO?: string): boolean {
  if (!dateISO) return false;
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return dateISO.slice(0, 10) === `${y}-${m}-${d}`;
}

/**
 * The activity happening right now on a day: the last block whose start time is
 * at or before the current hour (and it's that day's date). Null otherwise.
 */
export function currentActivity(day: Day): Activity | null {
  if (!isToday(day.date) || !day.activities?.length) return null;
  const now = new Date().getHours() + new Date().getMinutes() / 60;
  const timed = day.activities
    .map((a) => ({ a, h: parseClock(a.time) }))
    .filter((x) => x.h != null)
    .sort((x, y) => (x.h as number) - (y.h as number));
  let cur: Activity | null = null;
  for (const { a, h } of timed) if ((h as number) <= now) cur = a;
  return cur;
}
