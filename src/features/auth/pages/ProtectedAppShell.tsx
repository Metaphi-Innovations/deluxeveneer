import { Navigate } from "react-router";
import { useEffect } from "react";

import { AppShell } from "../../../layouts/AppShell";
import { isAuthenticated, refreshCurrentUserPermissions } from "../authSession";

export function ProtectedAppShell() {
  const authenticated = isAuthenticated();

  useEffect(() => {
    if (authenticated) {
      void refreshCurrentUserPermissions();
    }
  }, [authenticated]);

  if (!authenticated) {
    return <Navigate to="/" replace />;
  }

  return <AppShell />;
}
