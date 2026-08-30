// Deterministic fallback generator used when no OPENAI_API_KEY is set.
// It is intentionally simple — it proves the end-to-end flow (and lets E2E run
// with no spend); a real key produces far richer, grounded itineraries.
import type { GenerateRequest, Proposal } from "../../../packages/shared/src/index.ts";
import { addDays } from "./schema.ts";

function dayCount(req: GenerateRequest): number {
  const a = new Date(`${req.startDate}T00:00:00Z`).getTime();
  const b = new Date(`${req.endDate}T00:00:00Z`).getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

const BUDGET_FOOD: Record<string, [number, number]> = {
  shoestring: [300, 800],
  moderate: [800, 2000],
  comfortable: [1800, 4000],
  luxury: [4000, 9000],
};

const STRATEGIES = [
  { style: "Balanced", name: "Balanced Week", bestFor: "The best overall mix", themes: ["Arrival & settle in", "Local highlights", "Half-day outing", "Relaxed day", "Big day out", "Easy day", "Final day"] },
  { style: "Relaxed", name: "Relaxed / Staycation", bestFor: "More downtime, less rushing", themes: ["Gentle arrival", "Slow morning", "Neighborhood day", "Spa & stroll", "One nice outing", "Lazy day", "Wind down"] },
  { style: "Explore", name: "Explore More", bestFor: "Maximize what you see", themes: ["Arrival", "City core", "Museums & culture", "Food crawl", "Landmark day", "Markets", "Last look"] },
];

export function stubProposalsRaw(req: GenerateRequest) {
  const n = dayCount(req);
  const [foodLow, foodHigh] = BUDGET_FOOD[req.budget ?? "moderate"] ?? BUDGET_FOOD.moderate;
  const proposals = STRATEGIES.map((s) => ({
    name: s.name,
    shortName: s.style,
    style: s.style,
    bestFor: s.bestFor,
    fullDayFocus: `${s.style} full days around ${req.destination}`,
    weekdayRule: req.constraints ? "Weekdays stay close to home base" : "",
    days: Array.from({ length: n }, (_, i) => {
      const first = i === 0;
      const last = i === n - 1;
      const theme = s.themes[Math.min(i, s.themes.length - 1)];
      return {
        date: addDays(req.startDate, i),
        theme,
        timeWindow: first ? "Afternoon–evening" : last ? "Morning–departure" : "Morning–evening",
        comingFrom: req.homeBase || req.destination,
        destination: req.destination,
        detailedPlan: `${theme} in ${req.destination}${req.interests?.length ? ` — leaning into ${req.interests[0]}` : ""}.`,
        travelMode: "Walk / Grab",
        cost: { travel: first || last ? 700 : 150, foodLow, foodHigh },
        notes: first ? "Keep arrival light." : last ? "Pack and head out." : "",
      };
    }),
  }));
  return {
    title: `${req.purpose ? req.purpose + " — " : ""}${req.destination}`,
    subtitle: `${req.startDate} – ${req.endDate}`,
    currency: req.currency ?? "PHP",
    homeBase: req.homeBase || req.destination,
    assumptions: [
      { label: "Coming from", value: req.origin },
      { label: "Party", value: `${req.partySize} traveler${req.partySize === 1 ? "" : "s"}` },
      ...(req.constraints ? [{ label: "Constraints", value: req.constraints }] : []),
    ],
    disclaimer: "Draft generated without AI (no API key set). Prices are rough estimates.",
    places: [],
    proposals,
  };
}

export function stubTimelineRaw(proposal: Proposal, req: GenerateRequest) {
  const [foodLow] = BUDGET_FOOD[req.budget ?? "moderate"] ?? BUDGET_FOOD.moderate;
  const meal = Math.round(foodLow / 2);
  const selfCatering = (req.partySize ?? 2) >= 4 && !!req.homeBase;
  return {
    days: proposal.days.map((d) => ({
      date: d.date,
      activities: [
        { time: "8:00–9:00 AM", activity: "Breakfast", where: req.homeBase || req.destination, category: "Meal", mealSuggestion: "Easy breakfast to start the day.", cost: meal, participants: "Whole party", optional: false },
        { time: "9:30–11:30 AM", activity: `${d.theme} — morning`, where: d.destination, category: "Activity", reasoning: d.detailedPlan, cost: 0, participants: "Whole party", optional: false },
        { time: "12:00–1:00 PM", activity: "Lunch", where: d.destination, category: "Meal", mealSuggestion: "Sit-down lunch nearby.", cost: meal, participants: "Whole party", optional: false },
        { time: "1:30–4:00 PM", activity: `${d.theme} — afternoon`, where: d.destination, category: "Activity", reasoning: "Continue the day's plan.", cost: 0, participants: "Whole party", optional: false },
        { time: "6:00–7:30 PM", activity: "Dinner", where: d.destination, category: "Meal", mealSuggestion: "Relaxed dinner.", cost: meal, participants: "Whole party", optional: false },
      ],
    })),
    // Trip-wide guides so even the no-key draft shows the complete format.
    diningGuide: proposal.days.slice(0, 3).map((d, i) => ({
      restaurant: `${["Dinner", "Lunch", "Brunch"][i % 3]} spot · ${d.theme}`,
      whenWho: `${d.dateLabel} · whole party`,
      recommendedOrder: "Share a few local dishes + a dessert.",
      budget: `₱${meal.toLocaleString()}–${(meal * 2).toLocaleString()}`,
      why: "Convenient to the day's route.",
    })),
    groceryPlan: selfCatering
      ? [{ when: proposal.days[0]?.dateLabel ?? "Day 1", store: `Supermarket near ${req.homeBase}`, who: "One adult", purpose: "Initial stock-up", basket: "Breakfast items, fruit, water, snacks, staples.", budget: "₱3,000–5,000", why: "Self-catering keeps costs down over a longer stay." }]
      : [],
    places: [
      { name: req.destination, area: req.destination, lat: 0, lng: 0, why: "Main area for the trip." },
      ...(req.mustDos ?? []).map((m) => ({ name: m, area: req.destination, lat: 0, lng: 0, why: "A must-do you asked for." })),
    ],
  };
}
