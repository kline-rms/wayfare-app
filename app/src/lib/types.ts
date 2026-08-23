// App-side mirror of @itinerary/shared types.
// Kept in sync with packages/shared/src/types.ts (single source of truth lives
// there for the server; duplicated here to avoid Metro monorepo config).

export interface CostEstimate {
  travel: number;
  foodLow: number;
  foodHigh: number;
}

export interface DayLocation {
  mapAnchor: string;
  lat: number;
  lng: number;
  googleMapsUrl: string;
}

export interface Place {
  name: string;
  area: string;
  lat: number;
  lng: number;
  coordinates: string;
  googleMapsUrl: string;
  why: string;
  imageUrl?: string;
  coordinateSource?: string;
}

export interface Day {
  id: string;
  date: string;
  dateLabel: string;
  theme: string;
  timeWindow: string;
  comingFrom: string;
  destination: string;
  detailedPlan: string;
  travelMode: string;
  cost: CostEstimate;
  notes: string;
  location?: DayLocation;
}

export interface MoneyRange {
  low: number;
  high: number;
}

export interface Proposal {
  id: string;
  name: string;
  shortName: string;
  style: string;
  bestFor: string;
  fullDayFocus: string;
  weekdayRule: string;
  estTotal: MoneyRange;
  travelTotal: number;
  days: Day[];
}

export interface Itinerary {
  id: string;
  title: string;
  subtitle: string;
  dateRange: { start: string; end: string };
  partySize: number;
  currency: string;
  homeBase: string;
  assumptions: { label: string; value: string }[];
  disclaimer: string;
  proposals: Proposal[];
  places: Place[];
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ItinerarySummary {
  id: string;
  title: string;
  subtitle: string;
  dateRange: { start: string; end: string };
  partySize: number;
  currency: string;
  proposalCount: number;
}
