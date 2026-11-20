export const AUTH_BROADCAST_CHANNEL = "deluxe-veneers-auth";
const AUTH_TAB_ID_KEY = "deluxe-veneers-auth-tab-id";

export type AuthBroadcastMessage =
  | { type: "logout"; tabId: string }
  | { type: "session-restored" };

/** Stable per browser tab (sessionStorage is not shared across tabs). */
export function getAuthTabId(): string {
  if (typeof window === "undefined") {
    return "server";
  }
  let tabId = window.sessionStorage.getItem(AUTH_TAB_ID_KEY);
  if (!tabId) {
    tabId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(AUTH_TAB_ID_KEY, tabId);
  }
  return tabId;
}

export function getAuthBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }
  return new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
}

export function postAuthBroadcast(message: AuthBroadcastMessage) {
  getAuthBroadcastChannel()?.postMessage(message);
}