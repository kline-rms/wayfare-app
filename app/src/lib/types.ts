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
  placeId?: string;
  lat: number;
  lng: number;
  coordinates: string;
  googleMapsUrl: string;
  why: string;
  imageUrl?: string;
  coordinateSource?: string;
}

export interface Activity {
  id: string;
  time: string;
  activity: string;
  where: string;
  reasoning?: string;
  mapsUrl?: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  participants?: string;
  category?: string;
  mealSuggestion?: string;
  momStatus?: string;
  dadStatus?: string;
  restNap?: string;
  cost?: number;
  optional?: boolean;
  /** User-added stop (not from the original AI plan) — shown as editable/removable. */
  added?: boolean;
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
  activities?: Activity[];
}

export interface DiningEntry {
  restaurant: string;
  whenWho?: string;
  recommendedOrder?: string;
  budget?: string;
  why?: string;
  mapsUrl?: string;
  menuSource?: string;
  notes?: string;
}

export interface GroceryRun {
  when?: string;
  store?: string;
  who?: string;
  purpose?: string;
  basket?: string;
  budget?: string;
  why?: string;
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
  kind?: "couple" | "family";
  diningGuide?: DiningEntry[];
  groceryPlan?: GroceryRun[];
  expenses?: Expense[];
  ownerId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExpenseItem {
  name: string;
  qty?: number;
  price?: number;
}

export interface Expense {
  id: string;
  date: string;
  dayId?: string;
  payer: string;
  merchant?: string;
  category?: string;
  amount: number;
  currency?: string;
  items?: ExpenseItem[];
  receiptUrl?: string;
  note?: string;
  status: "unpaid" | "paid";
  paidAt?: string;
  proofUrl?: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

export interface GenerateRequest {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  partySize: number;
  purpose?: string;
  pace?: "relaxed" | "balanced" | "packed";
  budget?: "shoestring" | "moderate" | "comfortable" | "luxury";
  currency?: string;
  homeBase?: string;
  interests?: string[];
  mustDos?: string[];
  constraints?: string;
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

// Places enrichment (see docs/places-caching-design.md). Cards carry cached
// facts + live photo URLs; reviews are fetched on demand and never stored.
export interface PlaceCard {
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  googleMapsUrl: string;
  types: string[];
  rating?: number;
  ratingCount?: number;
  priceLevel?: number;
  hours?: string[];
  phone?: string;
  website?: string;
  photoUrls: string[];
  ownedImageUrl?: string;
  fresh: boolean;
}

export interface PlaceReview {
  author?: string;
  rating?: number;
  text?: string;
  relativeTime?: string;
}
