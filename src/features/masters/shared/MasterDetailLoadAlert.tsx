import { Alert } from "@mui/material";

import { getMasterApiErrorMessage } from "./getMasterApiErrorMessage";

export function MasterDetailLoadAlert({
  error,
  notFoundLabel,
}: {
  error: unknown;
  notFoundLabel: string;
}) {
  return (
    <Alert severity="error">
      {getMasterApiErrorMessage(error, notFoundLabel)}
    </Alert>
  );
}
