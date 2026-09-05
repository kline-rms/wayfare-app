// Expo push delivery. Sends through Expo's push service, which fans out to APNs
// (iOS) + FCM (Android) once the app has a real token from a custom dev build.
// Best-effort and no-op-safe: no tokens, invalid tokens or a network error never
// throw into the request that triggered the notification.
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface PushMessage {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export async function sendPush(tokens: string[], msg: PushMessage): Promise<number> {
  const valid = [...new Set(tokens)].filter((t) => typeof t === "string" && t.startsWith("ExponentPushToken"));
  if (!valid.length) return 0;
  const messages = valid.map((to) => ({ to, sound: "default", title: msg.title, body: msg.body, data: msg.data ?? {} }));
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(messages),
    });
  } catch {
    /* delivery is best-effort — never block the caller */
  }
  return valid.length;
}
