import type { Theme } from "@mui/material/styles";

import {
  portalControlHeights,
  portalTypography,
} from "../../theme/typography";

/** Compact white section surface for Order / Factory / Packing create forms. */
export function formSectionCardSx(theme: Theme) {
  return {
    border: `1px solid ${theme.customTokens.borders.default}`,
    borderRadius: "8px",
    backgroundColor: theme.customTokens.surfaces.surface,
    px: 1.75,
    py: 1.5,
    overflow: "hidden",
  } as const;
}

/** @deprecated Prefer FormSectionHeader for titled sections. */
export function formSectionTitleSx(theme: Theme) {
  return {
    color: theme.customTokens.neutrals[900],
    fontSize: portalTypography.sectionTitle.fontSize,
    fontWeight: portalTypography.sectionTitle.fontWeight,
    letterSpacing: portalTypography.sectionTitle.letterSpacing,
    lineHeight: portalTypography.sectionTitle.lineHeight,
    textTransform: "uppercase" as const,
  };
}

export function formFieldLabelSx(theme: Theme) {
  return {
    color: theme.customTokens.neutrals[800],
    fontSize: portalTypography.formLabel.fontSize,
    fontWeight: portalTypography.formLabel.fontWeight,
    lineHeight: portalTypography.formLabel.lineHeight,
    whiteSpace: "nowrap" as const,
  };
}

export function formHelperTextSx(theme: Theme) {
  return {
    color: theme.customTokens.text.secondary,
    fontSize: portalTypography.helper.fontSize,
    fontWeight: portalTypography.helper.fontWeight,
    lineHeight: portalTypography.helper.lineHeight,
  };
}

/** Compact primary action used near form sections (e.g. + Add Item). */
export function formInlineActionButtonSx(theme: Theme) {
  return {
    alignItems: "center",
    display: "inline-flex",
    flex: "0 0 auto",
    minHeight: portalControlHeights.button,
    height: portalControlHeights.button,
    minWidth: 0,
    width: "fit-content",
    maxWidth: "100%",
    px: "14px",
    py: 0,
    borderRadius: "7px",
    fontSize: portalTypography.button.fontSize,
    fontWeight: portalTypography.button.fontWeight,
    lineHeight: portalTypography.button.lineHeight,
    textTransform: "none" as const,
    boxShadow: "none",
    whiteSpace: "nowrap" as const,
    backgroundColor: theme.customTokens.brand.primary,
    color: theme.customTokens.text.inverse,
    "& .MuiButton-startIcon": {
      marginRight: "8px",
      marginLeft: 0,
      "& svg": {
        width: 16,
        height: 16,
        strokeWidth: 2,
      },
    },
    "&:hover": {
      backgroundColor: theme.customTokens.brand.primaryScale[800],
      boxShadow: "none",
    },
  } as const;
}

export {
  FormSectionHeader,
  formSectionHeaderBarSx,
  formSectionHeaderTextSx,
} from "./FormSectionHeader";
