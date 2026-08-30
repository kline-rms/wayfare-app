// Shared draft for the create-trip wizard: each step patches it, the generating
// screen reads it to call the API, and the proposals screen reads the result.
import { useSyncExternalStore } from 'react';
import type { GenerateRequest, Itinerary } from './types';
import type { GenerateResult } from './api';

export type Draft = Partial<GenerateRequest>;

/** The proposal the user picked and is now editing before saving (the edit path). */
export interface Chosen {
  itinerary: Itinerary;
  proposalId: string;
}

function defaultDates(): { startDate: string; endDate: string } {
  const start = new Date();
  start.setDate(start.getDate() + 21);
  const end = new Date(start);
  end.setDate(end.getDate() + 3);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { startDate: iso(start), endDate: iso(end) };
}

function fresh(): Draft {
  return { currency: 'PHP', partySize: 2, pace: 'balanced', budget: 'comfortable', ...defaultDates() };
}

let draft: Draft = fresh();
let result: GenerateResult | null = null;
let chosen: Chosen | null = null;
let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

export const wizard = {
  get: () => draft,
  patch: (p: Draft) => {
    draft = { ...draft, ...p };
    emit();
  },
  reset: () => {
    draft = fresh();
    result = null;
    chosen = null;
    emit();
  },
  getResult: () => result,
  setResult: (r: GenerateResult | null) => {
    result = r;
    emit();
  },
  getChosen: () => chosen,
  setChosen: (itinerary: Itinerary, proposalId: string) => {
    chosen = { itinerary, proposalId };
    emit();
  },
  /** Replace the itinerary being edited (keeps the same proposalId). */
  patchChosen: (itinerary: Itinerary) => {
    if (chosen) chosen = { ...chosen, itinerary };
    emit();
  },
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/** Re-renders on any wizard change; read via wizard.get() / wizard.getResult(). */
export function useWizardVersion(): number {
  return useSyncExternalStore(wizard.subscribe, () => version, () => version);
}
