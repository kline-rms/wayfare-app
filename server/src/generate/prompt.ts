// Prompt builders for the two generation steps.
import type { GenerateRequest, Itinerary, Proposal } from "../../../packages/shared/src/index.ts";

const PLANNER = `You are an expert local travel planner. Design itineraries a real person would \
follow: geographically coherent (no zig-zagging), realistic on timing/cost, respectful of the \
traveler's constraints (work blocks, nap windows, budget, pace). Use real, well-known venues with \
approximate lat/lng. Return STRICT JSON only — no prose, no markdown. BE CONCISE: every text field \
is at most one short sentence; no filler. Minimise tokens.`;

function facts(req: GenerateRequest): string {
  const lines = [
    `Coming from: ${req.origin}`,
    `Destination: ${req.destination}`,
    `Dates: ${req.startDate} to ${req.endDate}`,
    `Party size: ${req.partySize}`,
    req.homeBase ? `Home base / stay: ${req.homeBase}` : "",
    req.purpose ? `Purpose: ${req.purpose}` : "",
    req.pace ? `Pace: ${req.pace}` : "",
    req.budget ? `Budget: ${req.budget}` : "",
    `Currency: ${req.currency ?? "PHP"}`,
    req.interests?.length ? `Interests: ${req.interests.join(", ")}` : "",
    req.mustDos?.length ? `Must-dos: ${req.mustDos.join(", ")}` : "",
    req.constraints ? `Constraints: ${req.constraints}` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Step 1 — three distinct day-level proposals (no per-block activities yet). */
export function proposalsMessages(req: GenerateRequest) {
  const schema = `Return JSON of this exact shape:
{
  "title": string, "subtitle": string,
  "currency": string, "homeBase": string,
  "assumptions": [{"label": string, "value": string}],
  "disclaimer": string,
  "proposals": [
    {
      "name": string, "shortName": string, "style": string, "bestFor": string,
      "fullDayFocus": string, "weekdayRule": string,
      "estTotal": {"low": number, "high": number}, "travelTotal": number,
      "days": [
        {
          "date": "YYYY-MM-DD", "theme": string, "timeWindow": string,
          "comingFrom": string, "destination": string, "detailedPlan": string,
          "travelMode": string,
          "cost": {"travel": number, "foodLow": number, "foodHigh": number},
          "notes": string,
          "location": {"mapAnchor": string, "lat": number, "lng": number}
        }
      ]
    }
  ]
}`;
  return [
    { role: "system" as const, content: PLANNER },
    {
      role: "user" as const,
      content: `Design an itinerary for this request:\n\n${facts(req)}\n\nProduce EXACTLY 3 \
distinct proposals with genuinely different strategies (e.g. balanced, relaxed/staycation, \
explore-more). Cover every date from start to end inclusive. Day-level only for now — do NOT \
include per-activity blocks and do NOT include a places array. Keep at most 3 assumptions. Costs \
in the given currency for the whole party.\n\n${schema}`,
    },
  ];
}

/** Step 2 — expand one chosen proposal into the full, complete itinerary detail
 * (per-block activities + dining guide + grocery plan + place catalog). */
export function timelineMessages(req: GenerateRequest, proposal: Proposal) {
  const schema = `Return JSON of this exact shape:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "activities": [
        {"time": string, "activity": string, "where": string, "reasoning": string,
         "participants": string, "category": string, "mealSuggestion": string,
         "momStatus": string, "dadStatus": string, "restNap": string,
         "cost": number, "optional": boolean, "lat": number, "lng": number}
      ]
    }
  ],
  "diningGuide": [
    {"restaurant": string, "whenWho": string, "recommendedOrder": string,
     "budget": string, "why": string, "notes": string}
  ],
  "groceryPlan": [
    {"when": string, "store": string, "who": string, "purpose": string,
     "basket": string, "budget": string, "why": string}
  ],
  "places": [{"name": string, "area": string, "lat": number, "lng": number, "why": string}]
}
Rules:
- One activity = one atomic block (a meal, a transfer, a nap, an outing). Order blocks by time; cover the whole day from morning to night.
- Include lat/lng ONLY for blocks at a real external venue you travel to. For stay-put blocks (rest, nap, prep, packing, home meals, downtime) omit lat/lng — they need no map.
- mealSuggestion: ONLY for meal blocks, and it must be 2-4 SPECIFIC dishes to order at that exact named restaurant (real signature menu items when the venue is known, e.g. "Sisig, Sinigang na Baka, House Ensaymada"), NOT a generic phrase like "local breakfast".
- momStatus/dadStatus: set ONLY when adults split up and do different things (e.g. one parent working while the rest go out). If everyone is together, leave both blank — do not write "Family/Family".
- diningGuide: the notable restaurants across the trip (≈ one per dinner/notable meal).
- groceryPlan: include ONLY if the party is self-catering / has a home base with a kitchen (e.g. families on longer stays); otherwise return [].
- places: the distinct venues visited, with coordinates.`;
  const outline = proposal.days
    .map((d) => `- ${d.date} · ${d.theme} · ${d.timeWindow} · ${d.destination}: ${d.detailedPlan}`)
    .join("\n");
  return [
    { role: "system" as const, content: PLANNER },
    {
      role: "user" as const,
      content: `Trip facts:\n${facts(req)}\n\nExpand this proposal ("${proposal.name}") into a \
complete, block-by-block itinerary for every day. Keep it coherent and realistic, and produce the \
dining guide, grocery plan and place list so the plan is fully usable.\n\nDay outline:\n${outline}\n\n${schema}`,
    },
  ];
}
