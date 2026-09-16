import type { Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/material/styles";

/**
 * Masters-only sidebar child navigation treatment.
 * Other modules must continue using the shared Sidebar defaults.
 */
export const MASTERS_SIDEBAR_ENTRY_ID = "masters";

/** Brand maroon #741616 as RGB for opacity tints. */
const BRAND_MAROON_RGB = "116, 22, 22";

export function mastersSidebarParentSx(
  theme: Theme,
  options: { collapsed: boolean; isActive: boolean; collapsedButtonSize: number },
): SxProps<Theme> {
  const { collapsed, isActive, collapsedButtonSize } = options;

  return {
    position: "relative",
    overflow: "hidden",
    minHeight: 39,
    height: 39,
    width: collapsed ? collapsedButtonSize : "100%",
    minWidth: collapsed ? collapsedButtonSize : undefined,
    mx: collapsed ? "auto" : 0,
    px: collapsed ? 0 : 1.5,
    py: 0,
    gap: collapsed ? 0 : 1.25,
    justifyContent: collapsed ? "center" : "flex-start",
    color: isActive
      ? theme.customTokens.navigation.activeText
      : theme.customTokens.navigation.inactiveText,
    bgcolor: isActive
      ? theme.customTokens.navigation.activeBackground
      : "transparent",
    borderRadius: "6px",
    transition: "background-color 140ms ease",
    "&::before": isActive
      ? {
          content: '""',
          position: "absolute",
          left: collapsed ? 3 : 0,
          top: 8,
          bottom: 8,
          width: 2.5,
          borderRadius: "2px",
          bgcolor: theme.customTokens.brand.primary,
        }
      : {},
    "&:hover": {
      bgcolor: isActive
        ? theme.customTokens.navigation.activeBackground
        : theme.customTokens.navigation.hoverBackground,
    },
    "&.Mui-selected": {
      bgcolor: theme.customTokens.navigation.activeBackground,
    },
    "&.Mui-selected:hover": {
      bgcolor: theme.customTokens.navigation.activeBackground,
    },
  };
}

export function mastersSidebarChildListSx(): SxProps<Theme> {
  return {
    display: "flex",
    flexDirection: "column",
    gap: 0.15,
    pt: 0.25,
    pb: 0.25,
    backgroundColor: "transparent",
  };
}

export function mastersSidebarChildSx(
  theme: Theme,
  isItemActive: boolean,
): SxProps<Theme> {
  const hoverBg = `rgba(${BRAND_MAROON_RGB}, 0.05)`;
  const activeBg = `rgba(${BRAND_MAROON_RGB}, 0.1)`;
  const activeHoverBg = `rgba(${BRAND_MAROON_RGB}, 0.12)`;

  return {
    position: "relative",
    overflow: "hidden",
    cursor: "pointer",
    minHeight: 33,
    height: 33,
    mx: 1,
    pl: "34px",
    pr: 1.25,
    py: 0,
    justifyContent: "flex-start",
    color: isItemActive
      ? theme.customTokens.brand.primary
      : theme.customTokens.navigation.inactiveText,
    bgcolor: isItemActive ? activeBg : "transparent",
    borderRadius: "6px",
    border: "none",
    boxShadow: "none",
    transition: "background-color 140ms ease",
    "&::before": isItemActive
      ? {
          content: '""',
          position: "absolute",
          left: 8,
          top: "50%",
          transform: "translateY(-50%)",
          width: 2,
          height: 19,
          borderRadius: "2px",
          bgcolor: theme.customTokens.brand.primary,
        }
      : {},
    "&:hover": {
      bgcolor: isItemActive ? activeHoverBg : hoverBg,
    },
    "&.Mui-selected": {
      bgcolor: activeBg,
    },
    "&.Mui-selected:hover": {
      bgcolor: activeHoverBg,
    },
  };
}

export function mastersSidebarChildTextProps(isItemActive: boolean) {
  return {
    fontSize: "13px",
    fontWeight: isItemActive ? 600 : 500,
    lineHeight: 1.3,
  } as const;
}
