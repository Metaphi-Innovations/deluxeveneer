import { Box, Skeleton, Stack, Typography } from "@mui/material";

import { portalTypography } from "../../../theme/typography";

export function DashboardEmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={(theme) => ({
        py: 1.5,
        px: 0.5,
        color: theme.customTokens.text.secondary,
      })}
    >
      <Typography
        sx={{
          fontSize: portalTypography.helper.fontSize,
          fontWeight: portalTypography.helper.fontWeight,
          lineHeight: portalTypography.helper.lineHeight,
        }}
      >
        {message}
      </Typography>
    </Box>
  );
}

export function DashboardKpiSkeleton() {
  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        },
        gap: 1.25,
      })}
    >
      {Array.from({ length: 5 }, (_, index) => (
        <Box
          key={index}
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            backgroundColor: theme.customTokens.surfaces.surface,
            px: 1.5,
            py: 1.25,
          })}
        >
          <Skeleton height={14} width="40%" />
          <Skeleton height={28} sx={{ mt: 1 }} width="30%" />
        </Box>
      ))}
    </Box>
  );
}

export function DashboardSectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} height={28} variant="rounded" />
      ))}
    </Stack>
  );
}
