import type { Theme } from "@mui/material/styles";

import { portalTableDensity, portalTypography } from "../../theme/typography";

/** Content-based min-widths so more columns fit before horizontal scroll. */
export function getListingColumnMinWidth(columnKey: string, columnLabel = "") {
  const key = columnKey.toLowerCase();
  const label = columnLabel.toLowerCase();
  const haystack = `${key} ${label}`;

  if (key === "actions" || label === "actions" || label === "action") {
    return 56;
  }

  if (
    key.includes("orderno") ||
    key === "orderno" ||
    label === "order no" ||
    label.includes("order no")
  ) {
    return 120;
  }

  if (
    key.includes("orderitem") ||
    label.includes("order item") ||
    label === "oi no"
  ) {
    return 110;
  }

  if (key.includes("customer") || label.includes("customer")) {
    return 150;
  }

  if (key.includes("supplier") || label.includes("supplier")) {
    return 150;
  }

  if (
    /(issued.?from|issuedfrom)/.test(haystack) ||
    label === "issued from"
  ) {
    return 120;
  }

  if (
    key.includes("product") ||
    label.includes("product") ||
    key === "itemname" ||
    label === "item name" ||
    /(^|[^a-z])item.?name([^a-z]|$)/.test(haystack)
  ) {
    return 145;
  }

  if (
    /(sub.?categor|itemsub)/.test(haystack) ||
    label.includes("sub category")
  ) {
    return 150;
  }

  if (/(^|[^a-z])color([^a-z]|$)/.test(haystack)) {
    return 130;
  }

  if (/(^|[^a-z])length([^a-z]|$)/.test(haystack)) {
    return 100;
  }

  if (/(^|[^a-z])width([^a-z]|$)/.test(haystack)) {
    return 100;
  }

  if (
    /(thickness|height)/.test(haystack) &&
    !label.includes("highlight")
  ) {
    return 90;
  }

  if (/(^|[^a-z])sqm([^a-z]|$)/.test(haystack)) {
    return 90;
  }

  if (/(^|[^a-z])sqf([^a-z]|$)/.test(haystack)) {
    return 95;
  }

  if (/(amount|total|rate|price)/.test(haystack)) {
    return 110;
  }

  if (key.includes("date") || label.includes("date") || key.endsWith("at")) {
    return 108;
  }

  if (key.includes("sheets") || label.includes("sheets")) {
    return 90;
  }

  if (/(status|stage|priority)/.test(haystack)) {
    return 110;
  }

  return undefined;
}

const tableHeaderBackground = "#F7F4F3";

export function listingTableHeaderCellSx(theme: Theme) {
  return {
    position: "sticky" as const,
    top: 0,
    zIndex: 2,
    py: portalTableDensity.headerPy,
    px: portalTableDensity.headerPx,
    backgroundColor: tableHeaderBackground,
    color: theme.customTokens.neutrals[900],
    fontSize: portalTypography.tableHeader.fontSize,
    fontWeight: portalTypography.tableHeader.fontWeight,
    lineHeight: portalTypography.tableHeader.lineHeight,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
  };
}

export function listingTableBodyCellSx(theme: Theme) {
  return {
    py: portalTableDensity.bodyPy,
    px: portalTableDensity.bodyPx,
    verticalAlign: "middle" as const,
    color: theme.customTokens.text.primary,
    fontSize: portalTypography.tableBody.fontSize,
    fontWeight: portalTypography.tableBody.fontWeight,
    lineHeight: portalTypography.tableBody.lineHeight,
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
  };
}

/** Light compact headers for editable / transaction tables (not listing EDT). */
export function transactionTableHeaderCellSx(
  theme: Theme,
  minWidth?: number,
  textAlign: "left" | "center" | "right" = "left",
) {
  return {
    ...(minWidth !== undefined
      ? {
          minWidth,
          width: minWidth,
        }
      : {}),
    backgroundColor: tableHeaderBackground,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    color: theme.customTokens.neutrals[900],
    fontSize: portalTypography.tableHeader.fontSize,
    fontWeight: portalTypography.tableHeader.fontWeight,
    lineHeight: portalTypography.tableHeader.lineHeight,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    py: theme.spacing(portalTableDensity.headerPy),
    px: textAlign === "center" ? theme.spacing(1) : theme.spacing(1.25),
    textAlign,
    whiteSpace: "nowrap" as const,
  } as const;
}

export function transactionTableBodyCellSx(
  theme: Theme,
  textAlign: "left" | "center" | "right" = "left",
) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
    py: theme.spacing(portalTableDensity.bodyPy),
    px: textAlign === "center" ? theme.spacing(1) : theme.spacing(1.25),
    textAlign,
    verticalAlign: "top" as const,
    whiteSpace: "nowrap" as const,
    fontSize: portalTypography.tableBody.fontSize,
    fontWeight: portalTypography.tableBody.fontWeight,
    lineHeight: portalTypography.tableBody.lineHeight,
    color: theme.customTokens.text.primary,
  } as const;
}

export function listingTableHeaderIconButtonSx(theme: Theme) {
  return {
    width: 20,
    height: 20,
    p: 0,
    color: theme.customTokens.neutrals[700],
    "&:hover": {
      backgroundColor: theme.customTokens.surfaces.alt,
      color: theme.customTokens.brand.primary,
    },
    "& svg": {
      width: 14,
      height: 14,
      strokeWidth: 2,
    },
  };
}

export function listingTableContainerSx(theme: Theme) {
  return {
    border: `1px solid ${theme.customTokens.borders.default}`,
    borderRadius: `${theme.customTokens.radius.md}px`,
    overflow: "hidden",
    backgroundColor: theme.customTokens.surfaces.surface,
  };
}

export function listingPaginationIconButtonSx(theme: Theme) {
  return {
    width: 30,
    height: 30,
    minWidth: 30,
    p: 0,
    borderRadius: `${theme.customTokens.radius.sm}px`,
    border: `1px solid ${theme.customTokens.borders.default}`,
    color: theme.customTokens.text.secondary,
    "&.Mui-disabled": {
      opacity: 0.4,
    },
    "&:hover": {
      backgroundColor: theme.customTokens.surfaces.alt,
      color: theme.customTokens.brand.primary,
    },
  };
}

export function listingPageNumberButtonSx(theme: Theme, isActive: boolean) {
  return {
    minWidth: 30,
    width: 30,
    height: 30,
    p: 0,
    borderRadius: `${theme.customTokens.radius.sm}px`,
    border: `1px solid ${
      isActive
        ? theme.customTokens.brand.primary
        : theme.customTokens.borders.default
    }`,
    backgroundColor: isActive
      ? theme.customTokens.brand.primary
      : "transparent",
    color: isActive
      ? theme.customTokens.text.inverse
      : theme.customTokens.text.secondary,
    fontSize: portalTypography.helper.fontSize,
    fontWeight: 600,
    textTransform: "none" as const,
    boxShadow: "none",
    "&:hover": {
      boxShadow: "none",
      backgroundColor: isActive
        ? theme.customTokens.brand.primaryScale[800]
        : theme.customTokens.surfaces.alt,
      borderColor: isActive
        ? theme.customTokens.brand.primaryScale[800]
        : theme.customTokens.borders.hover,
    },
  };
}

