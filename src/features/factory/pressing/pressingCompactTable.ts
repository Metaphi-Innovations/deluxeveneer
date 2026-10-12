import type { Theme } from "@mui/material/styles";

import {
  listingTableBodyCellSx,
  listingTableHeaderCellSx,
} from "../../shared/listingTableStyles";

export function pressingCompactHeaderCellSx(theme: Theme, minWidth?: number) {
  return {
    ...listingTableHeaderCellSx(theme),
    fontSize: "11px",
    lineHeight: 1.2,
    minWidth,
    px: 0.75,
    py: 0.35,
  };
}

export function pressingCompactBodyCellSx(theme: Theme, minWidth?: number) {
  return {
    ...listingTableBodyCellSx(theme),
    fontSize: "12px",
    lineHeight: 1.25,
    minWidth,
    px: 0.75,
    py: 0.3,
  };
}

export function pressingCompactInputSx(width?: number) {
  return {
    ...(width ? { width } : {}),
    "& .MuiInputBase-root": {
      fontSize: "12px",
      minHeight: 28,
    },
    "& .MuiInputBase-input": {
      py: "4px",
    },
  };
}

/** Width that fits the current value so compacted cells do not clip it. */
export function pressingValueInputWidth(value: string, minimum = 96, maximum = 260) {
  const fitted = value.trim().length * 8.2 + 28;
  return Math.round(Math.min(maximum, Math.max(minimum, fitted)));
}

/** Cell width includes the input plus the compact horizontal padding. */
export function pressingCellWidth(inputWidth: number) {
  return inputWidth + 16;
}

export const pressingDetailsTableSx = {
  width: "max-content",
  minWidth: "100%",
  tableLayout: "auto" as const,
  "& .MuiTableCell-root": {
    whiteSpace: "nowrap",
  },
};

export function pressingTableScrollSx(theme: Theme) {
  return {
    overflowX: "auto" as const,
    overflowY: "hidden" as const,
    scrollbarWidth: "thin" as const,
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": { height: 8 },
    "&::-webkit-scrollbar-track": { backgroundColor: theme.customTokens.surfaces.alt },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.customTokens.brand.primary,
      borderRadius: theme.customTokens.radius.pill,
      border: `1px solid ${theme.customTokens.surfaces.alt}`,
    },
  };
}
