// Small helpers that make the itinerary render "smartly" — only showing what a
// block actually needs (a map only when you travel somewhere, a per-person
// breakdown only when people are doing different things).
import type { Activity } from './types';

// Categories / activities that happen where you already are (no travel).
const STAY_PUT = /rest|sleep|nap|home|prep|pack|admin|routine|transition|wake|bedtime|downtime|shower|cook/i;

/** True when the block is at a real external venue you travel to (so a map helps). */
export function isDestination(a: Activity, homeBase?: string): boolean {
  if (a.lat == null || a.lng == null) return false; // no location → nowhere to map
  const where = (a.where || '').toLowerCase();
  const homeFirst = (homeBase || '').split(',')[0].trim().toLowerCase();
  const atHome = !!homeFirst && (where.includes(homeFirst) || homeFirst.includes(where));
  if (atHome) return false;
  if (STAY_PUT.test(`${a.category ?? ''} ${a.activity ?? ''}`)) return false;
  return true;
}

/** True when Mom/Dad (or any subset) are genuinely doing DIFFERENT things.
 * "Whole family / everyone / Family·Family" is not a differentiated split. */
export function hasSplitRoles(a: Activity): boolean {
  const norm = (s?: string) => (s ?? '').trim().toLowerCase();
  const mom = norm(a.momStatus);
  const dad = norm(a.dadStatus);
  if (!mom && !dad) return false;
  const generic = (s: string) => !s || s === 'family' || s === 'off work' || s === 'family time';
  if (generic(mom) && generic(dad)) return false; // everyone's just "family"
  return mom !== dad; // only meaningful when they differ
}
