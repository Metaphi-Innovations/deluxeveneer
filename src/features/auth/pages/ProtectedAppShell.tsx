import { Navigate } from "react-router";
import { useEffect } from "react";

import { AppShell } from "../../../layouts/AppShell";
import { ContentLoader } from "../../../components/feedback/ContentLoader";
import { RemoteLogoutDialog } from "../RemoteLogoutDialog";
import { refreshCurrentUserPermissions } from "../authSession";
import { useAuthInitialization } from "../useAuthInitialization";

export function ProtectedAppShell() {
  const status = useAuthInitialization();

  useEffect(() => {
    if (status === "authenticated") {
      void refreshCurrentUserPermissions();
    }
  }, [status]);

  if (status === "initializing") {
    return <ContentLoader />;
  }

  if (status === "unauthenticated") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <AppShell />
      <RemoteLogoutDialog />
    </>
  );
}