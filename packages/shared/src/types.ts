// Shared domain types for the Itinerary app.
// Used by both the server (API) and the Expo app so the shape never drifts.
// Modeled as documents so a later swap to Firebase/Firestore is 1:1.

export interface CostEstimate {
  /** Estimated travel cost (Grab/taxi) for the day, in the itinerary currency. */
  travel: number;
  /** Low end of food + listed activities for the day. */
  foodLow: number;
  /** High end of food + listed activities for the day. */
  foodHigh: number;
}

/** Map location anchor for a day (present for non-travel days). */
export interface DayLocation {
  /** Named anchor, e.g. "Bonifacio High Street". */
  mapAnchor: string;
  lat: number;
  lng: number;
  /** Ready-to-open Google Maps URL for the coordinates. */
  googleMapsUrl: string;
}

/** An entry in the itinerary's Places & Maps catalog. */
export interface Place {
  name: string;
  area: string;
  lat: number;
  lng: number;
  /** "14.55056, 121.05139" display form. */
  coordinates: string;
  googleMapsUrl: string;
  /** Why this place is part of the trip. */
  why: string;
  /** Preview image URL, if one was curated. */
  imageUrl?: string;
  /** Source link for the coordinates (wiki/mapcarta/etc.). */
  coordinateSource?: string;
}

export interface Day {
  /** Stable id, e.g. "p1-2026-08-26". */
  id: string;
  /** ISO date, e.g. "2026-08-26". */
  date: string;
  /** Human label as written in the source, e.g. "Wed, Aug 26". */
  dateLabel: string;
  /** Short theme/title for the day. */
  theme: string;
  /** Time window text, e.g. "8:00 PM–10:00 PM" or "TBD". */
  timeWindow: string;
  /** Starting point for the day. */
  comingFrom: string;
  /** Destination / area for the day. */
  destination: string;
  /** Full narrative plan for the day. */
  detailedPlan: string;
  /** Travel mode, e.g. "Walk / short Grab". */
  travelMode: string;
  /** Per-day cost estimate. */
  cost: CostEstimate;
  /** Free-form planning notes. */
  notes: string;
  /** Map anchor for the day; absent for travel/flexible days. */
  location?: DayLocation;
}

export interface MoneyRange {
  low: number;
  high: number;
}

export interface Proposal {
  /** Stable id, e.g. "p1-balanced". */
  id: string;
  /** Full name, e.g. "Balanced Couple Week". */
  name: string;
  /** Short label from the source, e.g. "P1 Balanced". */
  shortName: string;
  /** One-line style descriptor. */
  style: string;
  /** Who / what this proposal is best for. */
  bestFor: string;
  /** Focus of the full (weekend/holiday) days. */
  fullDayFocus: string;
  /** Rule constraining weekday outings. */
  weekdayRule: string;
  /** Estimated grand total range for 2 people. */
  estTotal: MoneyRange;
  /** Sum of daily travel estimates. */
  travelTotal: number;
  /** Ordered days of the trip under this proposal. */
  days: Day[];
}

export interface Itinerary {
  /** Stable id, e.g. "bgc-manila-2026". */
  id: string;
  title: string;
  subtitle: string;
  dateRange: { start: string; end: string };
  partySize: number;
  /** ISO 4217 currency code, e.g. "PHP". */
  currency: string;
  homeBase: string;
  /** Planning assumptions (label + value pairs). */
  assumptions: { label: string; value: string }[];
  /** Global disclaimer text. */
  disclaimer: string;
  proposals: Proposal[];
  /** Places & Maps catalog for the whole trip. */
  places: Place[];
  /** Owner id (for multi-user later; e.g. Firebase uid). Optional for now. */
  ownerId?: string;
  /** ISO timestamps. */
  createdAt?: string;
  updatedAt?: string;
}

/** Summary shape returned by list endpoints (no heavy day data). */
export interface ItinerarySummary {
  id: string;
  title: string;
  subtitle: string;
  dateRange: { start: string; end: string };
  partySize: number;
  currency: string;
  proposalCount: number;
}
