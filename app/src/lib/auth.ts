// Client auth state: the session token + current user, persisted on web so a
// reload stays signed in. Screens call api.register/login then setSession here.
import { useSyncExternalStore } from 'react';
import type { User } from './types';

const TOKEN_KEY = 'wayfare.token';
const USER_KEY = 'wayfare.user';

// localStorage on web; a safe no-op elsewhere (native persistence comes later).
const storage = {
  get(k: string): string | null {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(k) : null;
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage?.setItem(k, v);
    } catch {
      /* ignore */
    }
  },
  del(k: string) {
    try {
      localStorage?.removeItem(k);
    } catch {
      /* ignore */
    }
  },
};

let token: string | null = storage.get(TOKEN_KEY);
let user: User | null = (() => {
  const raw = storage.get(USER_KEY);
  try {
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
})();

let version = 0;
const listeners = new Set<() => void>();
const emit = () => {
  version++;
  listeners.forEach((l) => l());
};

export const authStore = {
  getToken: () => token,
  getUser: () => user,
  isAuthed: () => !!token,
  setSession(t: string, u: User) {
    token = t;
    user = u;
    storage.set(TOKEN_KEY, t);
    storage.set(USER_KEY, JSON.stringify(u));
    emit();
  },
  clear() {
    token = null;
    user = null;
    storage.del(TOKEN_KEY);
    storage.del(USER_KEY);
    emit();
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};

/** Reactive auth snapshot for components. */
export function useAuth(): { token: string | null; user: User | null; isAuthed: boolean } {
  useSyncExternalStore(authStore.subscribe, () => version, () => version);
  return { token, user, isAuthed: !!token };
}
