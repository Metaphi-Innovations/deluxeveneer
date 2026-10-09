import type { Theme } from "@mui/material/styles";
import type { ModifierArguments } from "@popperjs/core";

import {
  portalControlHeights,
  portalFontFamily,
  portalTypography,
} from "../../theme/typography";

export const DROPDOWN_MENU_MAX_WIDTH = 480;
export const DROPDOWN_MENU_FALLBACK_MIN_WIDTH = 180;
export const DROPDOWN_CONTROL_MIN_WIDTHS = {
  short: 140,
  status: 160,
  category: 200,
  name: 260,
  long: 320,
} as const;

/**
 * Popper/paper sizing for ErpSelectField and similar custom menus.
 * At least as wide as the trigger; grows with content up to max.
 */
export function getSelectDropdownPaperSx(
  theme: Theme,
  triggerWidth?: number,
  options?: {
    maxWidth?: number;
    preferredMinWidth?: number;
  },
) {
  const maxWidth = options?.maxWidth ?? DROPDOWN_MENU_MAX_WIDTH;
  const preferred = options?.preferredMinWidth ?? 0;
  const minWidth = Math.max(
    triggerWidth ?? 0,
    preferred,
    DROPDOWN_MENU_FALLBACK_MIN_WIDTH,
  );

  return {
    mt: theme.spacing(0.75),
    minWidth,
    width: "max-content",
    maxWidth,
    maxHeight: theme.spacing(30),
    border: `1px solid ${theme.customTokens.borders.default}`,
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.customTokens.surfaces.surface,
    boxShadow: "none",
    overflow: "hidden",
  } as const;
}

export function getSelectDropdownListboxSx(theme: Theme) {
  return {
    maxHeight: theme.spacing(30),
    overflowY: "auto",
    overflowX: "hidden",
    py: 0,
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    scrollbarWidth: "thin" as const,
    "&::-webkit-scrollbar": {
      width: 6,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
      borderRadius: 999,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.customTokens.brand.primary,
      borderRadius: 999,
    },
    "&::-webkit-scrollbar-thumb:hover": {
      backgroundColor: theme.customTokens.brand.primaryScale[800],
    },
  } as const;
}

export function getSelectDropdownOptionSx(theme: Theme, _dense = false) {
  return {
    display: "block",
    whiteSpace: "normal" as const,
    overflowWrap: "anywhere" as const,
    wordBreak: "break-word" as const,
    fontFamily: portalFontFamily,
    fontSize: portalTypography.control.fontSize,
    fontWeight: portalTypography.control.fontWeight,
    lineHeight: portalTypography.control.lineHeight,
    py: theme.spacing(1.1),
    px: theme.spacing(1.5),
    maxWidth: "100%",
  } as const;
}

/**
 * MUI Autocomplete popper that stays >= trigger width and grows for long labels.
 * Uses a Popper modifier so Autocomplete's equal-width style does not win.
 */
export function getAutocompletePopperSlotProps(
  theme: Theme,
  maxWidth: number = DROPDOWN_MENU_MAX_WIDTH,
) {
  return {
    sx: {
      zIndex: theme.zIndex.modal,
      maxWidth,
    },
    modifiers: [
      {
        name: "sameWidthOrGrow",
        enabled: true,
        phase: "beforeWrite" as const,
        requires: ["computeStyles"],
        fn({ state }: ModifierArguments<Record<string, never>>) {
          const referenceWidth = state.rects.reference.width;
          const popperStyles = state.styles.popper as Record<string, string>;

          popperStyles.width = "auto";
          popperStyles.minWidth = `${Math.max(referenceWidth, DROPDOWN_MENU_FALLBACK_MIN_WIDTH)}px`;
          popperStyles.maxWidth = `${maxWidth}px`;
        },
      },
    ],
  };
}

/** @deprecated Prefer getAutocompletePopperSlotProps for modifier-based sizing. */
export function getAutocompletePopperSx(
  theme: Theme,
  maxWidth: number = DROPDOWN_MENU_MAX_WIDTH,
) {
  return getAutocompletePopperSlotProps(theme, maxWidth).sx;
}

export function getAutocompletePaperSx(theme: Theme) {
  return {
    mt: theme.spacing(0.75),
    width: "max-content",
    minWidth: "100%",
    maxWidth: "100%",
    border: `1px solid ${theme.customTokens.borders.default}`,
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.customTokens.surfaces.surface,
    boxShadow: "none",
    overflow: "hidden",
  } as const;
}

export function getAutocompleteListboxSx(theme: Theme, dense = false) {
  return {
    ...getSelectDropdownListboxSx(theme),
    "& .MuiAutocomplete-option": {
      ...getSelectDropdownOptionSx(theme, dense),
      minHeight: dense
        ? portalControlHeights.compact
        : portalControlHeights.standard,
      '&.Mui-focused, &[aria-selected="true"]': {
        backgroundColor: theme.customTokens.navigation.hoverBackground,
      },
      '&[aria-selected="true"].Mui-focused': {
        backgroundColor: theme.customTokens.brand.primary,
        color: theme.customTokens.text.inverse,
      },
    },
  } as const;
}

/** Closed-field selected value: use full available width, ellipsis only at the edge. */
export function getSelectClosedValueSx(theme: Theme, _dense = false) {
  return {
    fontFamily: portalFontFamily,
    fontSize: portalTypography.control.fontSize,
    fontWeight: portalTypography.control.fontWeight,
    lineHeight: portalTypography.control.lineHeight,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
    pr: theme.spacing(0.5),
  } as const;
}
