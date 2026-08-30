// Coerces loosely-shaped AI output into a valid Itinerary document, filling any
// missing field with a sane default so a partial response never breaks the app.
import type {
  Activity,
  Day,
  GenerateRequest,
  Itinerary,
  Proposal,
} from "../../../packages/shared/src/index.ts";

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function slug(s: string): string {
  return (s || "trip").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "trip";
}

export function addDays(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function label(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return `${DOW[d.getUTCDay()]}, ${MON[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function num(v: unknown, fallback = 0): number {
  const n = typeof v === "string" ? parseFloat(v.replace(/[^\d.-]/g, "")) : Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function mapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

export function normalizeActivity(raw: any, dayId: string, i: number): Activity {
  const a: Activity = {
    id: str(raw?.id, `${dayId}-a${i + 1}`),
    time: str(raw?.time, "TBD"),
    activity: str(raw?.activity ?? raw?.title, "Activity"),
    where: str(raw?.where ?? raw?.location, "TBD"),
  };
  const reasoning = str(raw?.reasoning ?? raw?.why);
  if (reasoning) a.reasoning = reasoning;
  const participants = str(raw?.participants);
  if (participants) a.participants = participants;
  const category = str(raw?.category);
  if (category) a.category = category;
  const meal = str(raw?.mealSuggestion ?? raw?.meal);
  if (meal) a.mealSuggestion = meal;
  const mom = str(raw?.momStatus);
  if (mom) a.momStatus = mom;
  const dad = str(raw?.dadStatus);
  if (dad) a.dadStatus = dad;
  const rest = str(raw?.restNap);
  if (rest) a.restNap = rest;
  if (raw?.cost != null) a.cost = num(raw.cost);
  if (raw?.lat != null && raw?.lng != null) {
    a.lat = num(raw.lat);
    a.lng = num(raw.lng);
    a.mapsUrl = str(raw?.mapsUrl, mapsUrl(a.lat, a.lng));
  } else if (raw?.mapsUrl) {
    a.mapsUrl = str(raw.mapsUrl);
  }
  a.optional = raw?.optional === true || String(raw?.optional).toLowerCase() === "yes";
  return a;
}

export function normalizeDay(raw: any, propId: string, i: number, req: GenerateRequest): Day {
  const date = str(raw?.date, addDays(req.startDate, i));
  const day: Day = {
    id: str(raw?.id, `${propId}-${date}`),
    date,
    dateLabel: str(raw?.dateLabel, label(date)),
    theme: str(raw?.theme, `Day ${i + 1}`),
    timeWindow: str(raw?.timeWindow, "Flexible"),
    comingFrom: str(raw?.comingFrom, req.homeBase || req.destination),
    destination: str(raw?.destination, req.destination),
    detailedPlan: str(raw?.detailedPlan ?? raw?.plan, ""),
    travelMode: str(raw?.travelMode, "Walk / Grab"),
    cost: {
      travel: num(raw?.cost?.travel),
      foodLow: num(raw?.cost?.foodLow ?? raw?.cost?.food),
      foodHigh: num(raw?.cost?.foodHigh ?? raw?.cost?.food),
    },
    notes: str(raw?.notes, ""),
  };
  const loc = raw?.location;
  if (loc && (loc.lat != null || loc.mapAnchor)) {
    const lat = num(loc.lat);
    const lng = num(loc.lng);
    day.location = {
      mapAnchor: str(loc.mapAnchor, day.destination),
      lat,
      lng,
      googleMapsUrl: str(loc.googleMapsUrl, mapsUrl(lat, lng)),
    };
  }
  if (Array.isArray(raw?.activities) && raw.activities.length) {
    day.activities = raw.activities.map((a: any, j: number) => normalizeActivity(a, day.id, j));
  }
  return day;
}

export function normalizeProposal(raw: any, itinId: string, i: number, req: GenerateRequest): Proposal {
  const id = str(raw?.id, `${itinId}-p${i + 1}`);
  const days = Array.isArray(raw?.days) ? raw.days.map((d: any, j: number) => normalizeDay(d, id, j, req)) : [];
  const sumTravel = days.reduce((n: number, d: Day) => n + d.cost.travel, 0);
  const sumLow = days.reduce((n: number, d: Day) => n + d.cost.foodLow + d.cost.travel, 0);
  const sumHigh = days.reduce((n: number, d: Day) => n + d.cost.foodHigh + d.cost.travel, 0);
  return {
    id,
    name: str(raw?.name, `Plan ${i + 1}`),
    shortName: str(raw?.shortName, `P${i + 1}`),
    style: str(raw?.style, "Balanced"),
    bestFor: str(raw?.bestFor, "A well-rounded trip"),
    fullDayFocus: str(raw?.fullDayFocus, ""),
    weekdayRule: str(raw?.weekdayRule, ""),
    estTotal: {
      low: num(raw?.estTotal?.low, sumLow),
      high: num(raw?.estTotal?.high, sumHigh),
    },
    travelTotal: num(raw?.travelTotal, sumTravel),
    days,
  };
}

export function normalizeItinerary(raw: any, req: GenerateRequest, idHint?: string): Itinerary {
  const root = raw?.itinerary ?? raw;
  const id = idHint ?? str(root?.id, `${slug(req.destination)}-${req.startDate.slice(0, 4)}-${Math.random().toString(36).slice(2, 7)}`);
  const proposals = Array.isArray(root?.proposals)
    ? root.proposals.map((p: any, i: number) => normalizeProposal(p, id, i, req))
    : [];
  const places = Array.isArray(root?.places)
    ? root.places.map((p: any) => ({
        name: str(p?.name, "Place"),
        area: str(p?.area, req.destination),
        lat: num(p?.lat),
        lng: num(p?.lng),
        coordinates: str(p?.coordinates, `${num(p?.lat)}, ${num(p?.lng)}`),
        googleMapsUrl: str(p?.googleMapsUrl, mapsUrl(num(p?.lat), num(p?.lng))),
        why: str(p?.why, "On the itinerary"),
        ...(p?.imageUrl ? { imageUrl: str(p.imageUrl) } : {}),
      }))
    : [];
  const now = new Date().toISOString();
  return {
    id,
    title: str(root?.title, `${req.destination} Itinerary`),
    subtitle: str(root?.subtitle, `${label(req.startDate)} – ${label(req.endDate)}`),
    dateRange: { start: req.startDate, end: req.endDate },
    partySize: req.partySize,
    currency: str(root?.currency ?? req.currency, "PHP"),
    homeBase: str(root?.homeBase ?? req.homeBase, req.destination),
    kind: req.partySize >= 4 ? "family" : "couple",
    assumptions: Array.isArray(root?.assumptions)
      ? root.assumptions.map((x: any) => ({ label: str(x?.label), value: str(x?.value) })).filter((x: any) => x.label)
      : [],
    disclaimer: str(
      root?.disclaimer,
      "All prices are planning estimates, not live quotes. Confirm hours and reservations before each outing.",
    ),
    proposals,
    places,
    ownerId: req.homeBase ? undefined : undefined,
    createdAt: now,
    updatedAt: now,
  };
}
