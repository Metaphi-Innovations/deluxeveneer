import { useEffect, useState } from "react";

import { isAuthenticated, restoreAuthSession } from "./authSession";

export type AuthInitStatus = "initializing" | "authenticated" | "unauthenticated";

export function useAuthInitialization() {
  const [status, setStatus] = useState<AuthInitStatus>(() =>
    isAuthenticated() ? "authenticated" : "initializing",
  );

  useEffect(() => {
    if (isAuthenticated()) {
      setStatus("authenticated");
      return;
    }

    let cancelled = false;

    void (async () => {
      const restored = await restoreAuthSession();
      if (cancelled) {
        return;
      }
      setStatus(restored ? "authenticated" : "unauthenticated");
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}