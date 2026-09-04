// Row-level spreadsheet import: turn an exported plan (our own column layout)
// back into a real Itinerary — days, activities, coordinates and all — WITHOUT
// re-generating with AI. Saving it triggers the normal finalize crawl, which
// links Place IDs + resolves any venue that only carried a text Maps link.
//
// Expected columns (header row, order-independent, case/space-insensitive):
//   Date · Time · Activity · Where · Reasoning · Google Maps Link ·
//   Participants · Category · Meal / Menu Suggestion · Mom Status · Dad Status ·
//   Rest / Nap · Est. Cost (₱) · Optional?
import type { Activity, CostEstimate, Day, Itinerary, Place, Proposal } from '@/lib/types';

export type Row = Record<string, string>;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// Column lookup that tolerates header spelling/spacing differences.
function col(row: Row, ...names: string[]): string {
  const keys = Object.keys(row);
  for (const n of names) {
    const want = n.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hit = keys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === want);
    if (hit && row[hit] != null && String(row[hit]).trim()) return String(row[hit]).trim();
  }
  return '';
}

function toISO(s: string): string | null {
  const m = s.match(/([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) {
    const mon = MONTHS[m[1].slice(0, 3).toLowerCase()];
    if (mon) return `${m[3]}-${String(mon).padStart(2, '0')}-${String(+m[2]).padStart(2, '0')}`;
  }
  const iso = s.match(/(\d{4})-(\d{2})-(\d{2})/); // already ISO-ish
  return iso ? `${iso[1]}-${iso[2]}-${iso[3]}` : null;
}

function labelFor(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const mon = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1];
  return `${wd}, ${mon} ${d}`;
}

function coordsFromUrl(url: string): { lat: number; lng: number } | null {
  const m = url.match(/query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function num(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
const yes = (s: string) => /^\s*(y|yes|true|1)/i.test(s);
const STAY = /rest|sleep|nap|home|prep|pack|admin|routine|transition|wake|bedtime|downtime|shower|cook|off\s*work|travel|transfer|flight/i;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48);

function shortHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36).slice(0, 5);
}

// First clock token of a range ("5:35–7:05 PM" -> "5:35 PM" is ambiguous, so we
// just keep the whole first side / last side for the window label).
function startOf(t: string): string {
  return t.split(/[–—-]/)[0].trim() || t;
}
function endOf(t: string): string {
  const parts = t.split(/[–—-]/);
  return (parts[1] ?? parts[0] ?? t).replace(/onward/i, '').trim() || t;
}

export interface BuildOpts {
  title?: string;
  homeBase?: string;
  partySize?: number;
}

/** Build a complete, saveable Itinerary from parsed spreadsheet rows. */
export function buildItineraryFromRows(rows: Row[], opts: BuildOpts = {}): Itinerary {
  // Group rows into days by carried-forward Date.
  type Group = { iso: string; rows: Row[] };
  const groups: Group[] = [];
  let curIso: string | null = null;
  for (const r of rows) {
    const dateCell = col(r, 'Date');
    const iso = dateCell ? toISO(dateCell) : null;
    if (iso) curIso = iso;
    if (!curIso) continue; // skip anything before the first dated row
    const activity = col(r, 'Activity');
    const where = col(r, 'Where');
    if (!activity && !where) continue; // skip blank rows
    const last = groups[groups.length - 1];
    if (last && last.iso === curIso) last.rows.push(r);
    else groups.push({ iso: curIso, rows: [r] });
  }
  if (!groups.length) throw new Error('No dated rows found — is this an itinerary export?');

  const baseId = slug(opts.title || 'imported trip');
  const start = groups[0].iso;
  const end = groups[groups.length - 1].iso;
  const id = `${baseId || 'imported'}-${start}-${shortHash(JSON.stringify(rows).slice(0, 4000))}`;

  // Detect the home base: the venue that most rows "stay put" at.
  const homeCount = new Map<string, number>();
  for (const r of rows) {
    const cat = col(r, 'Category');
    const where = col(r, 'Where');
    if (where && STAY.test(cat)) homeCount.set(where, (homeCount.get(where) ?? 0) + 1);
  }
  const detectedHome = [...homeCount.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
  const homeBase = opts.homeBase || detectedHome || '';
  const homeFirst = homeBase.split(',')[0].trim().toLowerCase();
  const isHome = (w: string) => !!homeFirst && w.toLowerCase().includes(homeFirst);

  const places = new Map<string, Place>();
  const days: Day[] = groups.map((g, di) => {
    const dayId = `${id}-d${di + 1}`;
    const activities: Activity[] = g.rows.map((r, ai) => {
      const mapsUrl = col(r, 'Google Maps Link', 'Maps Link', 'Map');
      const c = coordsFromUrl(mapsUrl);
      const where = col(r, 'Where');
      const a: Activity = {
        id: `${dayId}-a${ai + 1}`,
        time: col(r, 'Time'),
        activity: col(r, 'Activity'),
        where,
        reasoning: col(r, 'Reasoning') || undefined,
        mapsUrl: mapsUrl || undefined,
        lat: c?.lat,
        lng: c?.lng,
        participants: col(r, 'Participants') || undefined,
        category: col(r, 'Category') || undefined,
        mealSuggestion: col(r, 'Meal / Menu Suggestion', 'Meal', 'Menu') || undefined,
        momStatus: col(r, 'Mom Status') || undefined,
        dadStatus: col(r, 'Dad Status') || undefined,
        restNap: col(r, 'Rest / Nap') || undefined,
        cost: num(col(r, 'Est. Cost (₱)', 'Cost', 'Est Cost')) || undefined,
        optional: yes(col(r, 'Optional?', 'Optional')),
      };
      // Real, coordinate-bearing destinations become catalog places (for the map,
      // collages and the finalize crawl). Home / travel rows are skipped.
      if (c && where && !isHome(where) && !STAY.test(a.category ?? '') && !places.has(where.toLowerCase())) {
        places.set(where.toLowerCase(), {
          name: where,
          area: homeBase.split(',').slice(1).join(', ').trim() || 'Imported',
          lat: c.lat,
          lng: c.lng,
          coordinates: `${c.lat}, ${c.lng}`,
          googleMapsUrl: mapsUrl,
          why: col(r, 'Reasoning') || '',
          coordinateSource: 'Imported',
        });
      }
      return a;
    });

    // Theme: prefer the day's first real, non-optional destination (a proper
    // place name reads better than "Optional Dad walk"); else the first non-stay
    // activity's label; else a numbered fallback.
    const destRow = g.rows.find((r) => {
      const cc = coordsFromUrl(col(r, 'Google Maps Link', 'Maps Link', 'Map'));
      const w = col(r, 'Where');
      return cc && w && !isHome(w) && !STAY.test(col(r, 'Category')) && !yes(col(r, 'Optional?', 'Optional'));
    });
    const headline =
      g.rows.find((r) => !STAY.test(col(r, 'Category')) && !yes(col(r, 'Optional?', 'Optional'))) ??
      g.rows.find((r) => !STAY.test(col(r, 'Category'))) ??
      g.rows[0];
    const theme = (destRow ? col(destRow, 'Where') : col(headline, 'Activity') || `Day ${di + 1}`).slice(0, 60);
    const destAct = activities.find((a) => a.lat != null && !isHome(a.where) && !STAY.test(a.category ?? ''));
    const anchor = destAct ?? activities.find((a) => a.lat != null);
    const cost: CostEstimate = {
      travel: activities.filter((a) => /travel|transfer|grab|flight/i.test(a.category ?? '')).reduce((s, a) => s + (a.cost ?? 0), 0),
      foodLow: activities.filter((a) => /meal|food|dining/i.test(a.category ?? '')).reduce((s, a) => s + (a.cost ?? 0), 0),
      foodHigh: 0,
    };
    cost.foodHigh = Math.round(cost.foodLow * 1.2);

    return {
      id: dayId,
      date: g.iso,
      dateLabel: labelFor(g.iso),
      theme,
      timeWindow: activities.length ? `${startOf(activities[0].time)}–${endOf(activities[activities.length - 1].time)}` : '',
      comingFrom: '',
      destination: (destAct?.where || homeBase.split(',')[0] || 'Manila').trim(),
      detailedPlan: g.rows.map((r) => col(r, 'Activity')).filter(Boolean).slice(0, 6).join(' · '),
      travelMode: '',
      cost,
      notes: '',
      location: anchor?.lat != null
        ? { mapAnchor: anchor.where || 'Anchor', lat: anchor.lat, lng: anchor.lng as number, googleMapsUrl: anchor.mapsUrl ?? '' }
        : undefined,
      activities,
    };
  });

  const grandTotal = days.reduce((s, d) => s + d.activities!.reduce((t, a) => t + (a.cost ?? 0), 0), 0);
  const proposal: Proposal = {
    id: 'imported',
    name: opts.title || 'Imported plan',
    shortName: 'Imported',
    style: 'Imported',
    bestFor: 'Your exact plan, as imported',
    fullDayFocus: '',
    weekdayRule: '',
    estTotal: { low: Math.round(grandTotal * 0.9), high: Math.round(grandTotal * 1.1) },
    travelTotal: days.reduce((s, d) => s + d.cost.travel, 0),
    days,
  };

  const familyish = rows.some((r) => /mom|dad/i.test(col(r, 'Mom Status') + col(r, 'Dad Status') + col(r, 'Participants')));
  return {
    id,
    title: opts.title || 'Imported Trip',
    subtitle: `${days.length} days · imported`,
    dateRange: { start, end },
    partySize: opts.partySize ?? (familyish ? 4 : 2),
    currency: 'PHP',
    homeBase,
    assumptions: [
      { label: 'Source', value: 'Imported spreadsheet' },
      { label: 'Days', value: String(days.length) },
      { label: 'Stops', value: String(days.reduce((s, d) => s + (d.activities?.length ?? 0), 0)) },
    ],
    disclaimer: 'Imported from a spreadsheet; times and places are exactly as provided.',
    proposals: [proposal],
    places: [...places.values()],
    kind: familyish ? 'family' : 'couple',
  };
}
