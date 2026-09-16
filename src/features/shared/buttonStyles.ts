import type { SxProps, Theme } from "@mui/material/styles";

import {
  portalControlHeights,
  portalFontFamily,
  portalTypography,
} from "../../theme/typography";
import {
  portalIconGap,
  portalIconSize,
  portalIconStroke,
} from "./portalIconStandards";

/** Shared compact button chrome — fit label, never stretch. */
const portalButtonBase = {
  alignItems: "center",
  appearance: "none",
  boxSizing: "border-box",
  cursor: "pointer",
  display: "inline-flex",
  flex: "0 0 auto",
  fontFamily: portalFontFamily,
  fontSize: portalTypography.button.fontSize,
  fontWeight: portalTypography.button.fontWeight,
  justifyContent: "center",
  letterSpacing: "0.01em",
  lineHeight: portalTypography.button.lineHeight,
  margin: 0,
  maxWidth: "100%",
  minWidth: 0,
  outline: 0,
  position: "relative",
  textTransform: "none" as const,
  userSelect: "none",
  verticalAlign: "middle",
  WebkitTapHighlightColor: "transparent",
  whiteSpace: "nowrap" as const,
  width: "fit-content",
  boxShadow: "none",
  "&:hover": {
    boxShadow: "none",
  },
} as const;

const portalButtonIconSx = {
  "& .MuiButton-endIcon, & .MuiButton-startIcon": {
    alignItems: "center",
    display: "inline-flex",
    lineHeight: 0,
    gap: 0,
    "& svg": {
      height: portalIconSize.md,
      width: portalIconSize.md,
      strokeWidth: portalIconStroke.default,
    },
  },
  "& .MuiButton-startIcon": {
    marginRight: "8px",
    marginLeft: 0,
  },
  "& .MuiButton-endIcon": {
    marginLeft: "8px",
    marginRight: 0,
  },
} as const;

/** Primary / secondary actions on forms, dialogs, and footers. */
export const recordActionButtonSx: SxProps<Theme> = {
  ...portalButtonBase,
  ...portalButtonIconSx,
  minHeight: portalControlHeights.button,
  height: portalControlHeights.button,
  padding: "0 14px",
  borderRadius: "8px",
};

export const recordViewActionButtonSx = recordActionButtonSx;

export const recordFormActionButtonSx = recordActionButtonSx;

/** Page-level toolbar actions (Add User, Create Order, Export, …). */
export function getListingToolbarButtonSx(theme: Theme) {
  return {
    ...portalButtonBase,
    ...portalButtonIconSx,
    alignSelf: "center",
    minHeight: portalControlHeights.button,
    height: portalControlHeights.button,
    px: "14px",
    py: 0,
    borderRadius: "8px",
    backgroundColor: theme.customTokens.brand.primary,
    color: theme.customTokens.text.inverse,
    "&:hover": {
      backgroundColor: theme.customTokens.brand.primaryScale[800],
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      backgroundColor: theme.customTokens.neutrals[200],
      color: theme.customTokens.neutrals[500],
    },
  };
}

export const listingToolbarButtonSx: SxProps<Theme> = getListingToolbarButtonSx;

/** Outlined secondary toolbar twin (Export, Cancel-style). */
export function getListingToolbarOutlinedButtonSx(theme: Theme) {
  return {
    ...getListingToolbarButtonSx(theme),
    backgroundColor: theme.customTokens.surfaces.surface,
    color: theme.customTokens.brand.primary,
    border: `1px solid ${theme.customTokens.brand.primary}`,
    "&:hover": {
      borderColor: theme.customTokens.brand.primaryScale[800],
      backgroundColor: theme.customTokens.navigation.hoverBackground,
      boxShadow: "none",
    },
  };
}

/** Compact actions inside tables / dense toolbars. */
export function getTableActionButtonSx(theme: Theme) {
  return {
    ...portalButtonBase,
    ...portalButtonIconSx,
    minHeight: portalControlHeights.dense,
    height: portalControlHeights.dense,
    px: "12px",
    py: 0,
    borderRadius: "8px",
    fontSize: "12.5px",
    fontWeight: 600,
    backgroundColor: theme.customTokens.brand.primary,
    color: theme.customTokens.text.inverse,
    "& .MuiButton-startIcon": {
      marginRight: "8px",
      marginLeft: 0,
      "& svg": {
        height: portalIconSize.sm,
        width: portalIconSize.sm,
        strokeWidth: portalIconStroke.default,
      },
    },
    "&:hover": {
      backgroundColor: theme.customTokens.brand.primaryScale[800],
      boxShadow: "none",
    },
  };
}

/** Gap between adjacent action buttons (8px). */
export const portalButtonGroupGap = portalIconGap.button;
