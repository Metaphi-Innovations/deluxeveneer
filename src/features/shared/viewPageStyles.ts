import type { Theme } from "@mui/material/styles";

/**
 * Standard compact surface for View and Create pages across the ERP portal.
 * Height is tightened with py: 1.15 to ensure screens fit cleanly without
 * excessive vertical scrolling while retaining full responsive width.
 */
export function formSectionCardSx(theme: Theme) {
  return {
    border: `1px solid ${theme.customTokens.borders.default}`,
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.customTokens.surfaces.surface,
    px: 1.75,
    py: 1.15,
    overflow: "hidden",
  } as const;
}

/**
 * Header identity summary card styling for all View pages.
 * Compact height (py: 1) with full width, slim borders, and balanced gaps.
 */
export function viewHeaderIdentityCardSx(theme: Theme) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1.5,
    flexWrap: "wrap",
    px: 1.75,
    py: 1,
    borderRadius: "8px",
    border: `1px solid ${theme.customTokens.borders.default}`,
    backgroundColor: theme.customTokens.surfaces.surface,
  } as const;
}

/**
 * Standard avatar styling in view pages' identity banner (compact 40x40).
 */
export function viewHeaderAvatarSx(theme: Theme) {
  return {
    width: 40,
    height: 40,
    bgcolor: theme.customTokens.brand.primaryScale[100],
    color: theme.customTokens.brand.primary,
    fontSize: "0.9375rem",
    fontWeight: 700,
    borderRadius: "8px",
    flexShrink: 0,
  } as const;
}
