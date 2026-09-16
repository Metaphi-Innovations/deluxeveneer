import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { portalTypography } from "../../theme/typography";

type FormSectionHeaderVariant = "cardTop" | "nested";

/** Compact light strip for form section titles (32–36px). */
export function formSectionHeaderBarSx(
  theme: Theme,
  variant: FormSectionHeaderVariant = "cardTop",
) {
  const isCardTop = variant === "cardTop";

  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    boxSizing: "border-box" as const,
    height: 34,
    minHeight: 34,
    maxHeight: 34,
    px: 1.5,
    // Bleed to section card edges (matches formSectionCardSx padding 1.75 / 1.5)
    mx: -1.75,
    mt: isCardTop ? -1.5 : 0,
    mb: 0,
    width: "auto",
    alignSelf: "stretch",
    backgroundColor: theme.customTokens.surfaces.paper,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    borderTopLeftRadius: isCardTop ? "7px" : 0,
    borderTopRightRadius: isCardTop ? "7px" : 0,
    color: theme.customTokens.neutrals[900],
  } as const;
}

export function formSectionHeaderTextSx(theme: Theme) {
  return {
    m: 0,
    color: theme.customTokens.neutrals[900],
    fontSize: portalTypography.sectionTitle.fontSize,
    fontWeight: portalTypography.sectionTitle.fontWeight,
    letterSpacing: portalTypography.sectionTitle.letterSpacing,
    lineHeight: 1.2,
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

/** Replaces plain section title lines with a compact header strip. */
export function FormSectionHeader({
  title,
  endAdornment,
  variant = "cardTop",
}: {
  title: string;
  endAdornment?: ReactNode;
  variant?: FormSectionHeaderVariant;
}) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionHeaderBarSx(theme, variant),
      })}
    >
      <Typography
        component="h3"
        sx={(theme) => ({
          ...formSectionHeaderTextSx(theme),
        })}
      >
        {title}
      </Typography>
      {endAdornment ? (
        <Box sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          {endAdornment}
        </Box>
      ) : null}
    </Box>
  );
}
