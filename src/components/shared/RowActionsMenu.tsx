import type { LucideIcon } from "lucide-react";
import { Plus } from "lucide-react";
import { Box, Menu, MenuItem } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  ACTION_MENU_MAX_WIDTH,
  ACTION_MENU_MIN_WIDTH,
  actionMenuIconProps,
  actionMenuIconSlotSx,
  actionMenuItemSx,
  actionMenuListSx,
  actionMenuPaperSx,
  resolveActionMenuTone,
} from "./actionMenuStyles";

export type RowActionsMenuItem = {
  id: string;
  label: string;
  icon?: LucideIcon | undefined;
  tone?: "primary" | "default" | "danger" | undefined;
  disabled?: boolean | undefined;
  onSelect: () => void;
};

type RowActionsMenuProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  actions: readonly RowActionsMenuItem[];
  /** Override default menu min width (useful for short labels like Pass/Fail). */
  minWidth?: number;
  maxWidth?: number;
  anchorOrigin?: {
    vertical: "top" | "bottom" | "center";
    horizontal: "left" | "right" | "center";
  };
  transformOrigin?: {
    vertical: "top" | "bottom" | "center";
    horizontal: "left" | "right" | "center";
  };
};

function resolveActionMenuIcon(action: RowActionsMenuItem): LucideIcon | undefined {
  const normalized = action.label.trim().toLowerCase();
  const isIssueAction =
    /^issue(\s|\/|-)/.test(normalized) || /\bissue for\b/.test(normalized);

  if (isIssueAction) {
    return Plus;
  }

  return action.icon;
}

export function RowActionsMenu({
  anchorEl,
  open,
  onClose,
  actions,
  minWidth = ACTION_MENU_MIN_WIDTH,
  maxWidth = ACTION_MENU_MAX_WIDTH,
  anchorOrigin = { vertical: "bottom", horizontal: "right" },
  transformOrigin = { vertical: "top", horizontal: "right" },
}: RowActionsMenuProps) {
  const resolved = actions.map((action) => ({
    ...action,
    icon: resolveActionMenuIcon(action),
    resolvedTone: resolveActionMenuTone(action.label, action.tone),
  }));
  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      MenuListProps={{
        dense: true,
        sx: actionMenuListSx(),
      }}
      slotProps={{
        paper: {
          sx: (theme: Theme) => ({
            ...actionMenuPaperSx(theme),
            minWidth,
            maxWidth,
          }),
        },
      }}
    >
      {resolved.map((action) => {
        const Icon = action.icon;
        return (
          <MenuItem
            key={action.id}
            disabled={action.disabled}
            onClick={() => {
              action.onSelect();
              onClose();
            }}
            sx={(theme) => actionMenuItemSx(theme, action.resolvedTone)}
          >
            <Box
              component="span"
              sx={(theme) => actionMenuIconSlotSx(theme)}
              aria-hidden
            >
              {Icon ? <Icon {...actionMenuIconProps} /> : null}
            </Box>
            {action.label}
          </MenuItem>
        );
      })}
    </Menu>
  );
}
