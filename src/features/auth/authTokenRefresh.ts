import { postAuthBroadcast } from "./authBroadcast";
import {
  AUTH_STORAGE_KEY,
  AUTH_TOKEN_STORAGE_KEY,
  hasAccessTokenInSessionStorage,
} from "./authStorageKeys";

export { hasAccessTokenInSessionStorage } from "./authStorageKeys";
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

let refreshAccessTokenInFlight: Promise<boolean> | null = null;
let peerRestoreWaiters: Array<(success: boolean) => void> = [];

export function notifyPeerSessionRestored() {
  peerRestoreWaiters.forEach((resolve) =>
    resolve(hasAccessTokenInSessionStorage()),
  );
  peerRestoreWaiters = [];
}

function waitForPeerSessionRestore(timeoutMs: number): Promise<boolean> {
  if (hasAccessTokenInSessionStorage()) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      peerRestoreWaiters = peerRestoreWaiters.filter((fn) => fn !== done);
      resolve(hasAccessTokenInSessionStorage());
    }, timeoutMs);
    const done = (success: boolean) => {
      window.clearTimeout(timer);
      peerRestoreWaiters = peerRestoreWaiters.filter((fn) => fn !== done);
      resolve(success || hasAccessTokenInSessionStorage());
    };
    peerRestoreWaiters.push(done);
  });
}

export type LoadRefreshedProfile = (user: unknown) => void;

async function requestRefreshToken(
  loadProfile: LoadRefreshedProfile | null,
): Promise<boolean> {
  const attempt = async (): Promise<boolean> => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      return false;
    }

    const body = await response.json().catch(() => null);
    const accessToken = body?.data?.accessToken as string | undefined;
    if (!accessToken) {
      return false;
    }

    window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
    window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, accessToken);

    if (loadProfile) {
      const meResponse = await fetch(`${API_BASE_URL}/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (meResponse.ok) {
        const meBody = await meResponse.json().catch(() => null);
        if (meBody?.data?.user) {
          loadProfile(meBody.data.user);
        }
      }
    }

    postAuthBroadcast({ type: "session-restored" });
    notifyPeerSessionRestored();
    return true;
  };

  if (await attempt()) {
    return true;
  }

  await new Promise((resolve) => window.setTimeout(resolve, 150));
  return attempt();
}

export async function refreshAccessToken(
  loadProfile: LoadRefreshedProfile | null = null,
): Promise<boolean> {
  if (refreshAccessTokenInFlight) {
    return refreshAccessTokenInFlight;
  }

  refreshAccessTokenInFlight = (async () => {
    try {
      if (hasAccessTokenInSessionStorage() && !loadProfile) {
        return true;
      }
      const refreshed = await requestRefreshToken(loadProfile);
      if (refreshed) {
        return true;
      }
      return waitForPeerSessionRestore(2500);
    } finally {
      refreshAccessTokenInFlight = null;
    }
  })();

  return refreshAccessTokenInFlight;
}