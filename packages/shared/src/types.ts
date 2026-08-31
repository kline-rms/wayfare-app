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
  /** Google Place ID, filled by the finalize crawl; links to the places cache. */
  placeId?: string;
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

/**
 * An atomic scheduled block within a day (a single row of the source itinerary
 * sheet). Present on itineraries authored at block granularity (e.g. the Family
 * trip). Coarse "one block per day" itineraries omit `Day.activities`.
 */
export interface Activity {
  /** Stable id, e.g. "fam-2026-09-10-01". */
  id: string;
  /** Time range/timestamp text, e.g. "5:35–7:05 PM" or "10:00 PM onward". */
  time: string;
  /** The scheduled block, e.g. "Family breakfast". */
  activity: string;
  /** Venue or "home", e.g. "The Fat Seed Cafe + Roastery BGC". */
  where: string;
  /** Why this block fits work, rest, distance and the children's energy. */
  reasoning?: string;
  /** Ready-to-open Google Maps URL for the destination. */
  mapsUrl?: string;
  /** Google Place ID, filled by the finalize crawl; links to the places cache. */
  placeId?: string;
  /** Destination coordinates (parsed from the maps link when available). */
  lat?: number;
  lng?: number;
  /** Who attends, e.g. "Whole family", "Sister + 3 girls". */
  participants?: string;
  /** Category enum/label, e.g. "Meal", "Rest", "Travel", "Museum". */
  category?: string;
  /** Specific family order or home-meal suggestion (meal blocks). */
  mealSuggestion?: string;
  /** Mom's status, e.g. "FOCUSED WFH", "JOINING FAMILY", "Family". */
  momStatus?: string;
  /** Dad's status, e.g. "Working", "Before work", "OPTIONAL / READY". */
  dadStatus?: string;
  /** Protected recovery requirement, e.g. "Toddler nap". */
  restNap?: string;
  /** Rough block/family cost in the itinerary currency. */
  cost?: number;
  /** Whether the block is optional (Yes/No in the source). */
  optional?: boolean;
  /** User-added stop (not from the original AI plan) — shown as editable/removable. */
  added?: boolean;
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
  /** Block-level schedule for the day, when authored at that granularity. */
  activities?: Activity[];
}

/** A restaurant entry in an itinerary's dining guide. */
export interface DiningEntry {
  restaurant: string;
  /** When / who, e.g. "Sep 12 dinner; all 6". */
  whenWho?: string;
  /** Recommended family order. */
  recommendedOrder?: string;
  /** Rough budget text, e.g. "₱3,000–₱4,500". */
  budget?: string;
  why?: string;
  mapsUrl?: string;
  /** Menu / source link. */
  menuSource?: string;
  notes?: string;
}

/** A planned grocery run. */
export interface GroceryRun {
  /** When, e.g. "Sep 11 morning". */
  when?: string;
  store?: string;
  who?: string;
  purpose?: string;
  /** Suggested basket contents. */
  basket?: string;
  /** Budget text, e.g. "₱5,000–₱8,000". */
  budget?: string;
  why?: string;
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
  /** Trip flavor; drives which detail sections render. Defaults to "couple". */
  kind?: "couple" | "family";
  /** Restaurant guide for the trip, when curated. */
  diningGuide?: DiningEntry[];
  /** Grocery plan for the trip, when curated. */
  groceryPlan?: GroceryRun[];
  /** Expense ledger for reimbursements (receipts, per-payer, paid/unpaid). */
  expenses?: Expense[];
  /** Settled reimbursement batches (proof + signature). */
  reimbursements?: Reimbursement[];
  /** Everyone who should know this trip — a dynamic roster (any relation/role). */
  members?: Member[];
  /** Active share links (tokenised access to this trip). */
  shares?: Share[];
  /** Owner id (for multi-user later; e.g. Firebase uid). Optional for now. */
  ownerId?: string;
  /** ISO timestamps. */
  createdAt?: string;
  updatedAt?: string;
}

/** One line item read from a receipt. */
export interface ExpenseItem {
  name: string;
  qty?: number;
  price?: number;
}

/** A recorded expense (usually from a scanned receipt) awaiting reimbursement. */
export interface Expense {
  id: string;
  /** ISO date the money was spent. */
  date: string;
  /** Optional link to the itinerary day it belongs to. */
  dayId?: string;
  /** Who paid — a member name / relation (e.g. "Sister-in-law", "Nanny"). */
  payer: string;
  merchant?: string;
  category?: string;
  /** Total amount in the itinerary currency. */
  amount: number;
  currency?: string;
  items?: ExpenseItem[];
  /** Stored receipt image (data URL or hosted URL). */
  receiptUrl?: string;
  note?: string;
  status: "unpaid" | "paid";
  /** When it was reimbursed, plus proof of the transfer. */
  paidAt?: string;
  proofUrl?: string;
  /** Links to the Reimbursement batch that settled it. */
  reimbursementId?: string;
}

/** A payee's authorisation signature for a reimbursement. */
export interface Signature {
  by: string;
  at: string;
  /** Data URL of the signed pad. */
  image?: string;
}

/** A settled batch: money moved outside the app; this is the record + proof. */
export interface Reimbursement {
  id: string;
  /** Who was reimbursed. */
  to: string;
  toMemberId?: string;
  amount: number;
  currency?: string;
  expenseIds: string[];
  /** Screenshot of the actual transfer (GCash/bank). */
  proofUrl?: string;
  /** The payee's signed authorisation. */
  signature?: Signature;
  note?: string;
  createdAt: string;
}

/** Anyone who should know a trip — dynamic; relation is free-form. */
export interface Member {
  id: string;
  name: string;
  /** Free-form: "Sister-in-law", "Nanny", "Friend", "Grandma", … */
  relation?: string;
  role: "owner" | "editor" | "viewer";
  email?: string;
  /** Avatar tint. */
  color?: string;
}

/** A tokenised share link granting access to a trip. */
export interface Share {
  /** Token of the form "<itineraryId>~<random>" so it resolves without a scan. */
  token: string;
  /** The member this link is for (optional — a general link has none). */
  memberId?: string;
  role: "editor" | "viewer";
  label?: string;
  createdAt?: string;
}

/** Public user shape returned by the auth endpoints (never includes secrets). */
export interface User {
  id: string;
  email: string;
  displayName?: string;
  createdAt: string;
}

/** What the user asks for; the input to AI itinerary generation. */
export interface GenerateRequest {
  /** Where the traveler is coming from. */
  origin: string;
  /** Where they're going (place-to-place, e.g. "BGC, Taguig"). */
  destination: string;
  /** ISO start/end of the trip. */
  startDate: string;
  endDate: string;
  partySize: number;
  /** What the trip is for, e.g. "Family trip", "Date", "Foodie weekend". */
  purpose?: string;
  pace?: "relaxed" | "balanced" | "packed";
  budget?: "shoestring" | "moderate" | "comfortable" | "luxury";
  /** ISO 4217, defaults to PHP. */
  currency?: string;
  /** Where the traveler stays (defaults to the destination). */
  homeBase?: string;
  /** Free-form interests, e.g. ["museums", "coffee", "playgrounds"]. */
  interests?: string[];
  /** Non-negotiables, e.g. ["The Mind Museum"]. */
  mustDos?: string[];
  /** Constraints in plain language: work blocks, nap windows, mobility, etc. */
  constraints?: string;
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

// ---------------------------------------------------------------------------
// Places enrichment cache — Google Places, one-time crawl on finalize.
// See docs/places-caching-design.md for the compliance + cost rationale.
// ---------------------------------------------------------------------------

/**
 * A cached place record, keyed by Google Place ID and SHARED across every user
 * and itinerary (the first trip to include a place pays for it; all others read
 * this cache for free). Only fields Google's terms permit us to store live here:
 * the Place ID (kept indefinitely), factual fields + the rating aggregate
 * (short-term, refreshed on a TTL), and photo *references* (pointers, not the
 * image bytes). Review text and photo bytes are NEVER stored — they are served
 * live from Google on the detail screen.
 */
export interface CachedPlace {
  /** Google Place ID — the join key; safe to keep indefinitely. */
  placeId: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  googleMapsUrl: string;
  /** Category tags, e.g. ["restaurant", "filipino_restaurant"]. */
  types: string[];
  /** Aggregate rating value (e.g. 4.6). */
  rating?: number;
  /** Number of ratings behind the aggregate. */
  ratingCount?: number;
  /** 0–4 price level. */
  priceLevel?: number;
  phone?: string;
  website?: string;
  /** Google "weekday" opening-hours lines, e.g. "Monday: 9 AM – 6 PM". */
  hours?: string[];
  /** Pointers to Google photos (resource names) — NOT the image bytes. */
  photoRefs?: string[];
  /** Optional owned, permanently-cacheable hero image (e.g. Wikimedia, CC). */
  ownedImageUrl?: string;
  source: "google" | "stub";
  /** ISO timestamp of the last successful fetch; drives the freshness TTL. */
  fetchedAt: string;
  /** Itinerary ids referencing this place (never evict while non-empty). */
  refItineraries: string[];
}

/** Server-shaped card the app renders: cached facts + live photo access. */
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
  /** Server photo-proxy URLs (resolved live from Google; bytes never stored). */
  photoUrls: string[];
  ownedImageUrl?: string;
  /** Whether the cached facts are still within the freshness TTL. */
  fresh: boolean;
}

/** A single live review (fetched on demand; never stored). */
export interface PlaceReview {
  author?: string;
  rating?: number;
  text?: string;
  relativeTime?: string;
}
