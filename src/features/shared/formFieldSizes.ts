import type { SxProps, Theme } from "@mui/material/styles";

/**
 * Shared ERP form field width tokens.
 * Widths are slot-based — never shrink to current input content.
 */
export type FormFieldSize = "xs" | "sm" | "md" | "lg" | "full";

export const formFieldSizeTokens = {
  /** Priority and other genuinely small selectors */
  xs: {
    width: 120,
    minWidth: 110,
    maxWidth: 130,
    flex: "0 0 120px",
  },
  /** Order No, dates, numeric dimensions, rates */
  sm: {
    width: 170,
    minWidth: 160,
    maxWidth: 180,
    flex: "0 0 170px",
  },
  /** Customer, prepared/checked by, mid-length selects */
  md: {
    width: 230,
    minWidth: 210,
    maxWidth: 260,
    flex: "1 1 230px",
  },
  /** Item name and longer searchable dropdowns */
  lg: {
    width: 300,
    minWidth: 280,
    maxWidth: 360,
    flex: "1 1 300px",
  },
  /** Remarks / descriptions */
  full: {
    width: "100%",
    minWidth: 280,
    maxWidth: "100%",
    flex: "1 1 320px",
  },
} as const;

export function getFormFieldSlotSx(
  size: FormFieldSize,
  options?: { grow?: boolean },
): SxProps<Theme> {
  const token = formFieldSizeTokens[size];
  const grow = options?.grow ?? (size === "full" || size === "lg");

  return {
    width: {
      xs: "100%",
      md: size === "full" ? "100%" : token.width,
    },
    minWidth: {
      xs: "100%",
      md: token.minWidth,
    },
    maxWidth: {
      xs: "100%",
      md: token.maxWidth,
    },
    flex: {
      xs: "1 1 100%",
      md: grow && size !== "full" ? token.flex : token.flex,
    },
  };
}

/** Compact form row gap / column gap (10–12px). */
export const formFieldRowGap = 1.25;
export const formFieldColumnGap = 1.5;
export const formLabelControlGap = 0.65;
export const formSectionStackGap = 1.5;
