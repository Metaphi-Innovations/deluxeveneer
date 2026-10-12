import type { Theme } from "@mui/material/styles";

import { portalFontFamily } from "../../theme/typography";
import {
  portalIconSize,
  portalIconStroke,
} from "./portalIconStandards";

export type ActionMenuTone = "primary" | "default" | "danger";

export const ACTION_MENU_MIN_WIDTH = 168;
export const ACTION_MENU_MAX_WIDTH = 200;

/** Infer visual hierarchy from label/tone without changing business logic. */
export function resolveActionMenuTone(
  label: string,
  tone?: "danger" | "default" | "primary" | null,
): ActionMenuTone {
  if (tone === "danger" || tone === "primary" || tone === "default") {
    return tone;
  }

  const normalized = label.trim().toLowerCase();

  if (
    /^(create|continue|issue|process|allocate|mark as|move to|add)\b/.test(
      normalized,
    ) ||
    /\b(create|issue for|continue)\b/.test(normalized)
  ) {
    return "primary";
  }

  if (
    /^(revert|reject|delete|remove|cancel)\b/.test(normalized) ||
    /\b(revert|reject)\b/.test(normalized)
  ) {
    return "danger";
  }

  return "default";
}

export function getActionMenuToneRank(tone: ActionMenuTone) {
  if (tone === "primary") {
    return 0;
  }

  if (tone === "danger") {
    return 2;
  }

  return 1;
}

export function actionMenuPaperSx(theme: Theme) {
  return {
    mt: 0.5,
    minWidth: ACTION_MENU_MIN_WIDTH,
    maxWidth: ACTION_MENU_MAX_WIDTH,
    width: "max-content",
    borderRadius: "8px",
    border: `1px solid ${theme.customTokens.borders.default}`,
    backgroundColor: theme.customTokens.surfaces.surface,
    boxShadow: theme.customTokens.elevation.xs,
    overflow: "hidden",
    p: 0.25,
  };
}

export function actionMenuListSx() {
  return {
    py: 0,
  };
}

export function actionMenuItemSx(
  theme: Theme,
  tone: ActionMenuTone = "default",
) {
  const isPrimary = tone === "primary";
  const isDanger = tone === "danger";

  const color = isPrimary
    ? theme.customTokens.brand.primary
    : isDanger
      ? theme.customTokens.semanticScale.error[600]
      : theme.customTokens.neutrals[900];

  return {
    minHeight: 32,
    height: 32,
    py: 0,
    px: "8px",
    mx: 0,
    my: 0,
    gap: theme.spacing(1),
    borderRadius: "4px",
    justifyContent: "flex-start",
    textAlign: "left",
    color,
    fontFamily: portalFontFamily,
    fontSize: "13px",
    fontWeight: isPrimary || isDanger ? 600 : 500,
    lineHeight: 1.2,
    alignItems: "center",
    "&:hover": {
      backgroundColor: isDanger
        ? theme.customTokens.semanticScale.error[50]
        : theme.customTokens.neutrals[100],
      color,
    },
    "&.Mui-disabled": {
      opacity: 0.45,
    },
  };
}

export function actionMenuIconSlotSx(_theme: Theme) {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: portalIconSize.md,
    minWidth: portalIconSize.md,
    height: portalIconSize.md,
    flexShrink: 0,
    color: "inherit",
    lineHeight: 0,
    "& svg": {
      width: portalIconSize.md,
      height: portalIconSize.md,
      strokeWidth: portalIconStroke.default,
    },
  };
}

export function actionMenuTriggerSx(theme: Theme) {
  return {
    width: 30,
    height: 30,
    minWidth: 30,
    p: 0,
    borderRadius: "6px",
    color: theme.customTokens.neutrals[700],
    "&:hover": {
      backgroundColor: theme.customTokens.neutrals[100],
      color: theme.customTokens.brand.primary,
    },
    "& svg": {
      width: portalIconSize.md,
      height: portalIconSize.md,
      strokeWidth: portalIconStroke.default,
    },
  };
}

export function actionMenuDividerSx(theme: Theme) {
  return {
    my: 0.25,
    mx: 0.5,
    borderColor: theme.customTokens.borders.divider,
  };
}

export const actionMenuIconProps = {
  size: portalIconSize.md,
  strokeWidth: portalIconStroke.default,
} as const;

export const tableHeaderIconProps = {
  size: portalIconSize.tableHeader,
  strokeWidth: portalIconStroke.default,
} as const;
