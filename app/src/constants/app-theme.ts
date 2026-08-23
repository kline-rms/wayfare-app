// App-specific palette layered on top of the template's Colors.
// Per-proposal accent + semantic colors for cost/travel chips.

export const Accents = {
  // keyed by proposal id
  "p1-balanced": { light: "#2563EB", dark: "#60A5FA" }, // blue
  "p2-romantic": { light: "#DB2777", dark: "#F472B6" }, // pink
  "p3-explore": { light: "#059669", dark: "#34D399" }, // green
  default: { light: "#6366F1", dark: "#818CF8" }, // indigo
} as const;

export function accentFor(proposalId: string, scheme: "light" | "dark"): string {
  const a = (Accents as Record<string, { light: string; dark: string }>)[proposalId] ?? Accents.default;
  return a[scheme];
}

export const Semantic = {
  travel: { light: "#B45309", dark: "#FBBF24" }, // amber — travel/Grab
  food: { light: "#0E7490", dark: "#22D3EE" }, // cyan — food/activities
  border: { light: "#E4E4E7", dark: "#2A2C31" },
  cardShadow: "rgba(0,0,0,0.08)",
};
