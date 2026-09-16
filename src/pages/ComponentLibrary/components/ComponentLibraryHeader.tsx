import { Stack, Typography } from "@mui/material";

export function ComponentLibraryHeader() {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(1),
      })}
    >
      <Typography variant="h2" color="text.primary">
        Component Library
      </Typography>

      <Typography variant="body1" color="text.secondary">
        Enterprise Design System for Deluxe Veneers ERP
      </Typography>
    </Stack>
  );
}
