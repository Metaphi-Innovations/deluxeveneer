import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import { portalTypography } from "../../theme/typography";

export interface ContentLoaderProps {
  label?: string;
  /** Spinner diameter in px. */
  size?: number;
  /** Minimum vertical space reserved for the loader. */
  minHeight?: number | string;
}

/**
 * Compact branded loading state for listings, forms, and page shells.
 */
export function ContentLoader({
  label = "Loading...",
  size = 36,
  minHeight = 180,
}: ContentLoaderProps) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{
        minHeight,
        width: "100%",
        py: 2,
        px: 1.5,
      }}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: size + 20,
          height: size + 20,
          borderRadius: "50%",
          backgroundColor: theme.customTokens.navigation.activeBackground,
        })}
      >
        <CircularProgress
          size={size}
          thickness={3.6}
          sx={(theme) => ({
            color: theme.customTokens.brand.primary,
          })}
        />
      </Box>
      <Typography
        sx={(theme) => ({
          fontSize: portalTypography.helper.fontSize,
          fontWeight: portalTypography.helper.fontWeight,
          lineHeight: portalTypography.helper.lineHeight,
          color: theme.customTokens.text.secondary,
          textAlign: "center",
        })}
      >
        {label}
      </Typography>
    </Stack>
  );
}
