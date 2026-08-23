// Navigation helpers. typedRoutes only regenerates its route union when Metro
// runs, so under plain tsc new routes aren't known yet. These helpers centralize
// the one cast needed so screens stay clean and tsc stays green.
import { router } from 'expo-router';

type AnyRoute = string | { pathname: string; params?: Record<string, string> };

export function go(path: AnyRoute) {
  router.push(path as any);
}

export function replaceTo(path: AnyRoute) {
  router.replace(path as any);
}

export function back() {
  if (router.canGoBack()) router.back();
}
