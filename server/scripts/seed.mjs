// Seed script: emits server/data/itineraries.json from structured trip data.
// Source of truth extracted from docs/BGC_Manila_Couple_Itinerary_With_Maps_Images.xlsx
// (adds per-day map coordinates and the Places & Maps catalog).
// Zero dependencies. Run: node server/scripts/seed.mjs
//
// The JSON it writes is shaped as documents (one itinerary doc containing
// proposals + days) so migrating to Firebase/Firestore later is a direct map.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "data");
const OUT_FILE = join(OUT_DIR, "itineraries.json");
// The app bundles an identical copy (used before the server is reachable).
const APP_FILE = join(__dirname, "..", "..", "app", "src", "lib", "data", "itineraries.json");
// Family trip is extracted from the xlsx by extract-family.py (run that first).
const FAMILY_FILE = join(__dirname, "family.itinerary.json");

const HOME = "Avida Towers Verte, BGC, Taguig";
const ILOILO = "Iloilo";

// Coordinates keyed by map anchor (from the "Places & Maps" sheet).
const COORDS = {
  "Avida Towers Verte": [14.5555, 121.0528],
  "Bonifacio High Street": [14.55056, 121.05139],
  "National Museum of Fine Arts": [14.58689, 120.98131],
  "Ayala Museum": [14.55358, 121.02325],
  "Venice Grand Canal Mall": [14.53443, 121.05079],
  "Binondo Church / Ongpin": [14.6002, 120.9747],
};

function mapsUrl(lat, lng) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

// Build a DayLocation from an anchor name, or undefined for travel days.
function loc(anchor) {
  if (!anchor) return undefined;
  const [lat, lng] = COORDS[anchor];
  return { mapAnchor: anchor, lat, lng, googleMapsUrl: mapsUrl(lat, lng) };
}

// Per-proposal day anchors (index-aligned with the day arrays below).
const p1Anchors = ["Avida Towers Verte", "Bonifacio High Street", "Bonifacio High Street", "National Museum of Fine Arts", "Ayala Museum", "Bonifacio High Street", "Bonifacio High Street", "Venice Grand Canal Mall", "Bonifacio High Street", null, null, null];
const p2Anchors = ["Avida Towers Verte", "Bonifacio High Street", "Bonifacio High Street", "Ayala Museum", "Bonifacio High Street", "Bonifacio High Street", "Bonifacio High Street", "Venice Grand Canal Mall", "Bonifacio High Street", null, null, null];
const p3Anchors = ["Avida Towers Verte", "Bonifacio High Street", "Bonifacio High Street", "National Museum of Fine Arts", "Binondo Church / Ongpin", "Ayala Museum", "Bonifacio High Street", "Venice Grand Canal Mall", "Bonifacio High Street", null, null, null];

// Helper: build a Day. `from` defaults to HOME.
function day(date, dateLabel, theme, timeWindow, destination, detailedPlan, travelMode, travel, foodLow, foodHigh, notes, from = HOME) {
  return {
    id: `${date}`, // prefixed with proposal id below
    date,
    dateLabel,
    theme,
    timeWindow,
    comingFrom: from,
    destination,
    detailedPlan,
    travelMode,
    cost: { travel, foodLow, foodHigh },
    notes,
  };
}

// ---- Proposal 1: Balanced Couple Week ----
const p1Days = [
  day("2026-08-26", "Wed, Aug 26", "Arrival Night", "8:00 PM–10:00 PM", "BGC / Home", "Wife arrives; settle in; late dinner/order food; short walk if desired; rest early for Thursday work.", "Walk / short Grab", 0, 500, 900, "Low-key arrival night"),
  day("2026-08-27", "Thu, Aug 27", "Workday – Welcome to BGC", "5:30 PM–9:30 PM", "Bonifacio High Street, BGC", "After 7AM–4PM work: change/rest, High Street walk, casual dinner, dessert/coffee, leisurely walk, home early.", "Walk / short Grab", 0, 1200, 2200, "Keep close because of work"),
  day("2026-08-28", "Fri, Aug 28", "Workday – Proper Date Night", "6:30 PM–10:30 PM", "BGC", "Nice dinner (Italian/Spanish/French style), dessert or drinks, High Street/Burgos Circle/Forbes Town walk.", "Walk / short Grab", 0, 1800, 3500, "Can stay later; Saturday is free"),
  day("2026-08-29", "Sat, Aug 29", "Old Manila Day", "9:00 AM–9:00 PM", "National Museum + Intramuros + Manila", "National Museum of Fine Arts; lunch; Manila Cathedral/Plaza Roma; Casa Manila; San Agustin area; Fort Santiago; sunset; dinner; return to BGC.", "Grab / taxi", 700, 1800, 3200, "Museum is generally free; allow small entrance fees in Intramuros"),
  day("2026-08-30", "Sun, Aug 30", "Makati + Relaxation", "10:00 AM–9:00 PM", "Makati", "Sleep in; brunch; Ayala Museum; Ayala Triangle; return toward BGC; couples massage; dinner.", "Grab / taxi", 450, 3000, 5500, "Relaxed after Saturday"),
  day("2026-08-31", "Mon, Aug 31", "Holiday Couple Day", "10:00 AM–10:30 PM", "BGC / nearby", "No alarm; brunch; couples spa/massage; coffee; home/nap; dress up; special dinner; optional drinks.", "Walk / short Grab", 250, 3500, 6500, "National Heroes Day; deliberately relaxed"),
  day("2026-09-01", "Tue, Sep 1", "Workday – Movie Date", "5:30 PM–9:30 PM", "BGC", "Dinner, movie, dessert, home early.", "Walk / short Grab", 0, 1400, 2500, "Close and easy after work"),
  day("2026-09-02", "Wed, Sep 2", "Workday – McKinley Evening", "6:00 PM–9:30 PM", "Venice Grand Canal, McKinley Hill", "Short Grab; dinner; canal walk/photos; dessert/coffee; return home.", "Grab / taxi", 350, 1200, 2400, "One of the farther weekday options, but still nearby"),
  day("2026-09-03", "Thu, Sep 3", "Workday – Final BGC Date", "7:00 PM–10:30 PM", "BGC", "Rest/change after work; nicer final dinner; High Street/5th Ave/Burgos Circle walk; dessert/coffee; pack afterward.", "Walk / short Grab", 0, 2200, 4200, "Final date before Iloilo"),
  day("2026-09-04", "Fri, Sep 4", "Travel", "TBD", ILOILO, "Travel to Iloilo.", "Airport transfer + flight", 500, 0, 0, "Flight cost excluded"),
  day("2026-09-05", "Sat, Sep 5", "Iloilo", "Flexible", ILOILO, "Personal/family time.", "Varies", 0, 0, 0, "Not costed", ILOILO),
  day("2026-09-06", "Sun, Sep 6", "Return", "TBD", HOME, "Return to BGC.", "Flight + airport transfer", 500, 0, 0, "Flight cost excluded", ILOILO),
];

// ---- Proposal 2: Romantic / Staycation ----
const p2Days = [
  day("2026-08-26", "Wed, Aug 26", "Arrival + Stay Home", "8:00 PM–10:00 PM", "BGC / Home", "Arrival, food, settle in, talk, rest.", "Walk / short Grab", 0, 500, 900, "No packed schedule"),
  day("2026-08-27", "Thu, Aug 27", "Workday – High Street", "6:00 PM–9:30 PM", "Bonifacio High Street", "Dinner + walk + coffee/dessert.", "Walk / short Grab", 0, 1200, 2200, "Close to home"),
  day("2026-08-28", "Fri, Aug 28", "Fancy Dinner Date", "6:30 PM–10:30 PM", "BGC", "Dress up; nicer restaurant; dessert/drinks; evening walk.", "Walk / short Grab", 0, 2500, 4500, "Romantic focus"),
  day("2026-08-29", "Sat, Aug 29", "Romantic Staycation-Style Day", "10:00 AM–10:00 PM", "BGC + Makati", "Late breakfast/brunch; couples massage; coffee; Makati stroll; Ayala area; rooftop/nice dinner.", "Grab / taxi", 500, 4200, 7500, "Less sightseeing, more time together"),
  day("2026-08-30", "Sun, Aug 30", "Lazy Couple Sunday", "10:30 AM–9:00 PM", "BGC / nearby", "Sleep in; brunch; movie/shopping; coffee; optional groceries; cook/order dinner together.", "Walk / short Grab", 150, 1800, 3200, "Very low-pressure day"),
  day("2026-08-31", "Mon, Aug 31", "Holiday Romantic Day", "10:00 AM–10:30 PM", "BGC / nearby", "Sleep in; brunch; spa; coffee; nap; dress up; special dinner; optional wine/drinks.", "Walk / short Grab", 250, 3800, 7000, "Holiday centerpiece"),
  day("2026-09-01", "Tue, Sep 1", "Workday – Dinner + Movie", "5:30 PM–9:30 PM", "BGC", "Easy dinner and movie.", "Walk / short Grab", 0, 1400, 2500, "Home early"),
  day("2026-09-02", "Wed, Sep 2", "Workday – Venice Date", "6:00 PM–9:30 PM", "Venice Grand Canal, McKinley Hill", "Dinner, canal walk, photos, dessert.", "Grab / taxi", 350, 1300, 2500, "Scenic but still close"),
  day("2026-09-03", "Thu, Sep 3", "Final Romantic Dinner", "7:00 PM–10:30 PM", "BGC", "Final special dinner; walk; dessert; pack.", "Walk / short Grab", 0, 2500, 5000, "End the visit on a date"),
  day("2026-09-04", "Fri, Sep 4", "Travel", "TBD", ILOILO, "Travel to Iloilo.", "Airport transfer + flight", 500, 0, 0, "Flight excluded"),
  day("2026-09-05", "Sat, Sep 5", "Iloilo", "Flexible", ILOILO, "Personal/family time.", "Varies", 0, 0, 0, "Not costed", ILOILO),
  day("2026-09-06", "Sun, Sep 6", "Return", "TBD", HOME, "Return to BGC.", "Flight + airport transfer", 500, 0, 0, "Flight excluded", ILOILO),
];

// ---- Proposal 3: Explore Manila ----
const p3Days = [
  day("2026-08-26", "Wed, Aug 26", "Arrival", "8:00 PM–10:00 PM", "BGC / Home", "Settle in and rest.", "Walk / short Grab", 0, 500, 900, "Keep arrival simple"),
  day("2026-08-27", "Thu, Aug 27", "Workday – BGC High Street", "6:00 PM–9:30 PM", "Bonifacio High Street", "Dinner, High Street walk, dessert/coffee.", "Walk / short Grab", 0, 1200, 2200, "Close to home"),
  day("2026-08-28", "Fri, Aug 28", "Workday – BGC Date Night", "6:30 PM–10:30 PM", "BGC", "Nice dinner; optional rooftop/drinks; walk.", "Walk / short Grab", 0, 2000, 4000, "No cross-Manila trip after work"),
  day("2026-08-29", "Sat, Aug 29", "Manila Mega Day", "8:30 AM–9:30 PM", "National Museum + Intramuros + Manila Bay", "National Museum; Intramuros; Casa Manila; Fort Santiago; Manila Bay/sunset; dinner.", "Grab / taxi", 800, 2000, 3600, "Full sightseeing day"),
  day("2026-08-30", "Sun, Aug 30", "Binondo Food Adventure", "9:30 AM–8:30 PM", "Binondo + Manila", "Ongpin/Chinatown food crawl; share dumplings/noodles/lumpia/hopia/pastries; optional Rizal Park, Manila Bay, Ocean Park, mall or early return.", "Grab / taxi", 800, 1800, 3800, "Ocean Park admission, if chosen, is extra"),
  day("2026-08-31", "Mon, Aug 31", "Holiday – Manila/BGC Flex Day", "10:00 AM–10:00 PM", "Makati + BGC", "Brunch; Ayala/Makati exploration; coffee; return BGC; spa or rest; special dinner.", "Grab / taxi", 500, 3000, 6000, "Use holiday as flexible third full day"),
  day("2026-09-01", "Tue, Sep 1", "Workday – Movie", "5:30 PM–9:30 PM", "BGC", "Dinner + movie + dessert.", "Walk / short Grab", 0, 1400, 2500, "Close only"),
  day("2026-09-02", "Wed, Sep 2", "Workday – McKinley", "6:00 PM–9:30 PM", "Venice Grand Canal, McKinley Hill", "Dinner + canal walk + photos + dessert.", "Grab / taxi", 350, 1300, 2500, "Nearby weekday excursion"),
  day("2026-09-03", "Thu, Sep 3", "Workday – Final BGC Night", "7:00 PM–10:30 PM", "BGC", "Nice dinner; evening walk; dessert; pack.", "Walk / short Grab", 0, 2300, 4500, "Final night"),
  day("2026-09-04", "Fri, Sep 4", "Travel", "TBD", ILOILO, "Travel to Iloilo.", "Airport transfer + flight", 500, 0, 0, "Flight excluded"),
  day("2026-09-05", "Sat, Sep 5", "Iloilo", "Flexible", ILOILO, "Personal/family time.", "Varies", 0, 0, 0, "Not costed", ILOILO),
  day("2026-09-06", "Sun, Sep 6", "Return", "TBD", HOME, "Return to BGC.", "Flight + airport transfer", 500, 0, 0, "Flight excluded", ILOILO),
];

function proposal(id, name, shortName, style, bestFor, fullDayFocus, weekdayRule, low, high, travelTotal, days, anchors) {
  return {
    id,
    name,
    shortName,
    style,
    bestFor,
    fullDayFocus,
    weekdayRule,
    estTotal: { low, high },
    travelTotal,
    // prefix each day id with the proposal id for global uniqueness; attach location
    days: days.map((d, i) => ({ ...d, id: `${id}-${d.id}`, location: loc(anchors[i]) })),
  };
}

// Places & Maps catalog (from the "Places & Maps" sheet). imageUrl omitted where
// the sheet had no curated image ("Open image search / Maps").
function place(name, area, lat, lng, why, imageUrl, coordinateSource) {
  return {
    name,
    area,
    lat,
    lng,
    coordinates: `${lat}, ${lng}`,
    googleMapsUrl: mapsUrl(lat, lng),
    why,
    ...(imageUrl ? { imageUrl } : {}),
    ...(coordinateSource ? { coordinateSource } : {}),
  };
}

const PLACES = [
  place("Avida Towers Verte (Home Base)", "BGC, Taguig", 14.5555, 121.0528, "Home base / starting point for most trips", null, "https://www.google.com/maps/search/?api=1&query=Avida+Towers+Verte+BGC"),
  place("Bonifacio High Street", "BGC, Taguig", 14.55056, 121.05139, "Weekday walks, dining, shopping", "https://blog.kakaocdn.net/dna/sSaDz/btsuPPBxMdT/AAAAAAAAAAAAAAAAAAAAAFvmqJCnfYhEStoEd9eYjBPQMgJlYTebTaCINBEjewNE/img.jpg?allow_ip=&allow_referer=", "https://www.wikidata.org/wiki/Q17064247"),
  place("Venice Grand Canal Mall", "McKinley Hill, Taguig", 14.53443, 121.05079, "Wednesday evening option", "https://ak-d.tripcdn.com/images/1mi2z224x98t5ehvoD356_R_600_400_R5_Q90.jpg?proc=source%2Ftrip", "https://mapcarta.com/Venice_Grand_Canal_Mall_R6320197"),
  place("Ayala Museum", "Makati", 14.55358, 121.02325, "Museum / Makati day", "https://www.ayalafoundation.org/wp-content/uploads/2021/05/59-scaled.jpg", "https://mapcarta.com/N21717872"),
  place("Ayala Triangle Gardens", "Makati", 14.55612, 121.02325, "Relaxed Makati walk", "https://insiderph.com/uploads/articles/ej-obiena-atletang-ayala-bring-historic-pole-vault-event-to-ph-2-1200x674.webp", "https://mapcarta.com/W777918857"),
  place("National Museum of Fine Arts", "Ermita, Manila", 14.58689, 120.98131, "Main museum stop on Old Manila day", null, "https://www.wikidata.org/wiki/Q123815605"),
  place("Manila Cathedral", "Intramuros, Manila", 14.59151, 120.97361, "Intramuros walking route", null, "https://mapcarta.com/36499366"),
  place("Casa Manila", "Intramuros, Manila", 14.58966, 120.97517, "Spanish-colonial house museum", null, "https://www.wikidata.org/wiki/Q2110598"),
  place("Fort Santiago", "Intramuros, Manila", 14.59447, 120.97006, "Historic fort / Intramuros highlight", "https://cdn.sanity.io/images/nxpteyfv/goguides/02a9cc2ff464e5fee518642d0a787f94e0da4798-1600x1066.jpg", "https://mapcarta.com/15721266"),
  place("Binondo Church", "Binondo, Manila", 14.6002, 120.9747, "Good anchor point for Binondo food crawl", "https://upload.wikimedia.org/wikipedia/commons/5/50/Binondo_Church_in_front_of_Plaza_San_Lorenzo_Ruiz%2C_Binondo%2C_Manila_%282%29.jpg", "https://www.wikidata.org/wiki/Q864029"),
  place("Ongpin Street / Chinatown", "Binondo, Manila", 14.60083, 120.97528, "Food crawl area", null, "https://commons.wikimedia.org/wiki/File:1594Philtrust_Ongpin_Street_01.jpg"),
  place("Rizal Park", "Ermita, Manila", 14.58263, 120.97857, "Optional Sunday/Manila stop", null, "https://fr.wikipedia.org/wiki/Rizal_Park"),
  place("Manila Ocean Park", "Ermita, Manila", 14.57936, 120.97263, "Optional Sunday activity", null, null),
  place("Manila Baywalk", "Roxas Blvd, Manila", 14.56914, 120.98247, "Sunset / evening option", null, "https://mapcarta.com/W755100264"),
];

const itinerary = {
  id: "bgc-manila-2026",
  title: "Couple's BGC + Manila Itinerary",
  subtitle: "August 26 – September 6, 2026",
  dateRange: { start: "2026-08-26", end: "2026-09-06" },
  partySize: 2,
  currency: "PHP",
  homeBase: HOME,
  assumptions: [
    { label: "Home Base", value: "Avida Towers Verte, BGC, Taguig" },
    { label: "Work Schedule", value: "7:00 AM–4:00 PM weekdays; weekday plans stay close to home" },
    { label: "Holiday", value: "Monday, Aug 31, 2026 – National Heroes Day" },
    { label: "Travel estimates", value: "Rough Grab/taxi estimates for the couple; actual fares depend on traffic/surge" },
    { label: "Price estimates", value: "Rough couple totals for food + listed activities; shopping, flights, and optional premium upgrades excluded" },
  ],
  disclaimer:
    "All prices are planning estimates, not live quotes. Grab fares, restaurant bills, spa rates, attraction schedules, and holiday operating hours can vary. Confirm reservations/hours before each outing.",
  proposals: [
    proposal("p1-balanced", "Balanced Couple Week", "P1 Balanced", "Best overall mix", "Best overall mix", "Sat Manila, Sun Makati, Mon relaxed BGC", "BGC/McKinley only", 19350, 33650, 2750, p1Days, p1Anchors),
    proposal("p2-romantic", "Romantic / Staycation", "P2 Romantic", "More couple time, less touring", "More couple time, less touring", "Sat BGC+Makati, Sun lazy, Mon romantic", "BGC/McKinley only", 21450, 37550, 2250, p2Days, p2Anchors),
    proposal("p3-explore", "Explore Manila", "P3 Explore Manila", "Maximize sightseeing", "Maximize sightseeing", "Sat Old Manila, Sun Binondo, Mon Makati/BGC", "BGC/McKinley only", 18950, 33450, 3450, p3Days, p3Anchors),
  ],
  places: PLACES,
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
};

const itineraries = [itinerary];

// Merge in the Family trip (block-level schema) if it has been extracted.
if (existsSync(FAMILY_FILE)) {
  const family = JSON.parse(readFileSync(FAMILY_FILE, "utf8"));
  itineraries.push(family);
  const acts = family.proposals[0].days.reduce((n, d) => n + (d.activities?.length ?? 0), 0);
  console.log(`  + Family trip: ${family.proposals[0].days.length} days, ${acts} activity blocks`);
} else {
  console.warn(`  ! ${FAMILY_FILE} not found — run: python3 server/scripts/extract-family.py`);
}

// The bundled trips are shared samples visible to every signed-in user.
for (const it of itineraries) it.ownerId = "sample";

const db = { itineraries };
const payload = JSON.stringify(db, null, 2) + "\n";

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, payload, "utf8");
writeFileSync(APP_FILE, payload, "utf8"); // keep the app bundle in lockstep
console.log(`Seeded ${db.itineraries.length} itineraries → ${OUT_FILE}`);
console.log(`  also wrote app bundle → ${APP_FILE}`);
console.log(`  itineraries: ${db.itineraries.map((it) => it.id).join(", ")}`);
