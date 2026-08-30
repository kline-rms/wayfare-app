// App-specific palette layered on top of the template's Colors.
// Per-proposal accent + semantic colors for cost/travel chips.

export const Accents = {
  // keyed by proposal id — the 3 "color worlds" (marigold / grape / mint)
  "p1-balanced": { light: "#FFA828", dark: "#FFB84D" }, // marigold
  "p2-romantic": { light: "#7C5CF6", dark: "#8E76FF" }, // grape
  "p3-explore": { light: "#2FD98A", dark: "#3EE59A" }, // mint
  default: { light: "#7C5CF6", dark: "#8E76FF" }, // grape
} as const;

export function accentFor(proposalId: string, scheme: "light" | "dark"): string {
  const a = (Accents as Record<string, { light: string; dark: string }>)[proposalId] ?? Accents.default;
  return a[scheme];
}

export const Semantic = {
  travel: { light: "#C47800", dark: "#FFB84D" }, // marigold — travel/Grab
  food: { light: "#C47800", dark: "#FFB84D" }, // marigold — food/activities
  border: { light: "#E4DCFB", dark: "#3A2F72" }, // grape hairline
  cardShadow: "rgba(58,38,128,0.12)", // grape-tinted
};
