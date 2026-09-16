import type { Theme } from "@mui/material/styles";

import {
  getCompactFieldSx,
  type FieldVisualState,
} from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  portalControlHeights,
  portalFontFamily,
  portalTypography,
} from "../../../theme/typography";

/** Brand maroon #741616 RGB for subtle focus rings. */
const BRAND_MAROON_RGB = "116, 22, 22";

const MASTERS_FIELD_HEIGHT = 36;
const MASTERS_FIELD_RADIUS = "6px";

/**
 * Masters Add/Edit form surface — scoped; do not reuse on other modules.
 */
export function mastersFormSectionCardSx(theme: Theme) {
  return {
    border: `1px solid ${theme.customTokens.borders.default}`,
    borderRadius: "8px",
    backgroundColor: theme.customTokens.surfaces.surface,
    boxShadow: "none",
    px: 2,
    py: 1.75,
    overflow: "hidden",
  } as const;
}

/** Compact section header band for multi-section Master forms. */
export function mastersFormSectionHeaderSx(theme: Theme) {
  return {
    display: "flex",
    alignItems: "center",
    height: 32,
    minHeight: 32,
    maxHeight: 32,
    px: "10px",
    mx: -2,
    mt: -1.75,
    mb: 0,
    backgroundColor: `rgba(${BRAND_MAROON_RGB}, 0.06)`,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    borderTopLeftRadius: "7px",
    borderTopRightRadius: "7px",
    color: theme.customTokens.neutrals[900],
  } as const;
}

export function mastersFormLabelSx() {
  return {
    fontSize: "12.5px",
    fontWeight: 600,
    lineHeight: 1.3,
    whiteSpace: "nowrap" as const,
  };
}

/**
 * Masters form field chrome: 36px, 6px radius, border-led (minimal shadow).
 */
export function getMastersCompactFieldSx(
  theme: Theme,
  state: FieldVisualState = "default",
) {
  const base = getCompactFieldSx(theme, state, { dense: false });
  const isError = state === "error";
  const isReadOnly = state === "readOnly";
  const isDisabled = state === "disabled";

  return {
    ...base,
    "& .MuiOutlinedInput-root": {
      ...(typeof base["& .MuiOutlinedInput-root"] === "object"
        ? base["& .MuiOutlinedInput-root"]
        : {}),
      borderRadius: MASTERS_FIELD_RADIUS,
      height: MASTERS_FIELD_HEIGHT,
      minHeight: MASTERS_FIELD_HEIGHT,
      boxShadow: "none",
      backgroundColor:
        isDisabled || isReadOnly
          ? theme.customTokens.surfaces.alt
          : theme.customTokens.surfaces.surface,
      "& fieldset": {
        borderColor: isError
          ? theme.palette.error.main
          : theme.customTokens.borders.default,
        borderWidth: 1,
      },
      "&:hover fieldset": {
        borderColor:
          isDisabled || isReadOnly
            ? theme.customTokens.borders.default
            : isError
              ? theme.palette.error.main
              : theme.customTokens.borders.hover,
        borderWidth: 1,
      },
      "&.Mui-focused": {
        boxShadow: isError
          ? "none"
          : `0 0 0 1px rgba(${BRAND_MAROON_RGB}, 0.08)`,
      },
      "&.Mui-focused fieldset": {
        borderColor: isError
          ? theme.palette.error.main
          : theme.customTokens.brand.primary,
        borderWidth: 1,
      },
    },
  };
}

export function mastersFormActionButtonSx(theme: Theme) {
  return {
    alignItems: "center",
    display: "inline-flex",
    flex: "0 0 auto",
    fontFamily: portalFontFamily,
    fontSize: portalTypography.button.fontSize,
    fontWeight: portalTypography.button.fontWeight,
    lineHeight: portalTypography.button.lineHeight,
    minHeight: portalControlHeights.button,
    height: portalControlHeights.button,
    minWidth: 0,
    width: "fit-content",
    maxWidth: "100%",
    px: "14px",
    py: 0,
    borderRadius: "6px",
    textTransform: "none",
    boxShadow: "none",
    whiteSpace: "nowrap",
    "&:hover": {
      boxShadow: "none",
    },
    "& .MuiButton-startIcon": {
      marginRight: "8px",
      marginLeft: 0,
      "& svg": {
        width: 16,
        height: 16,
        strokeWidth: 2,
      },
    },
  };
}

export function mastersFormPrimaryButtonSx(theme: Theme) {
  return {
    ...mastersFormActionButtonSx(theme),
    backgroundColor: theme.customTokens.brand.primary,
    color: theme.customTokens.text.inverse,
    "&:hover": {
      backgroundColor: theme.customTokens.brand.primaryScale[800],
      boxShadow: "none",
    },
  };
}

export function mastersFormOutlinedButtonSx(theme: Theme) {
  return {
    ...mastersFormActionButtonSx(theme),
    backgroundColor: theme.customTokens.surfaces.surface,
    color: theme.customTokens.brand.primary,
    border: `1px solid ${theme.customTokens.brand.primary}`,
    "&:hover": {
      borderColor: theme.customTokens.brand.primaryScale[800],
      backgroundColor: `rgba(${BRAND_MAROON_RGB}, 0.04)`,
      boxShadow: "none",
    },
  };
}

export const mastersFormGridGap = {
  row: 1.5, // 12px
  column: 1.5, // 12px
  labelToField: 0.5, // 4px
} as const;

export const mastersErpControlHeight = MASTERS_FIELD_HEIGHT;
export const mastersErpFocusRing = `0 0 0 1px rgba(${BRAND_MAROON_RGB}, 0.08)`;
