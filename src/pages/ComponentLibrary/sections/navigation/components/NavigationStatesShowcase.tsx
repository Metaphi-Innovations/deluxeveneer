import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  LayoutGrid,
  Package,
  PanelLeftOpen,
} from "lucide-react";
import { Box, Stack, Typography } from "@mui/material";

import { NavigationShowcaseCard } from "./NavigationShowcaseCard";
import { NavigationStateTile } from "./NavigationStateTile";

function StateTile({
  children,
  note,
  token,
  title,
}: {
  children: React.ReactNode;
  note: string;
  token: string;
  title: string;
}) {
  return (
    <NavigationStateTile title={title} token={token} note={note}>
      <Box
        sx={(theme) => ({
          width: "100%",
          border: `1px solid ${theme.customTokens.borders.light}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          backgroundColor: theme.customTokens.surfaces.alt,
          p: theme.spacing(2),
        })}
      >
        {children}
      </Box>
    </NavigationStateTile>
  );
}

function SidebarStatePreview({
  active = false,
  collapsed = false,
  disabled = false,
  focused = false,
  hover = false,
  icon: Icon,
  label,
  selected = false,
}: {
  active?: boolean;
  collapsed?: boolean;
  disabled?: boolean;
  focused?: boolean;
  hover?: boolean;
  icon: LucideIcon;
  label: string;
  selected?: boolean;
}) {
  return (
    <Box
      component="button"
      type="button"
      sx={(theme) => ({
        width: collapsed ? 44 : "100%",
        minHeight: 40,
        display: "flex",
        alignItems: "center",
        justifyContent: collapsed ? "center" : "space-between",
        gap: theme.spacing(1),
        px: collapsed ? theme.spacing(1) : theme.spacing(1.5),
        py: theme.spacing(0.75),
        border: focused
          ? `2px solid ${theme.customTokens.borders.focus}`
          : "1px solid transparent",
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: active || selected
          ? theme.customTokens.navigation.activeBackground
          : hover
            ? theme.customTokens.navigation.hoverBackground
            : theme.customTokens.surfaces.surface,
        color: disabled
          ? theme.customTokens.text.disabled
          : active || selected
            ? theme.customTokens.navigation.activeText
            : theme.customTokens.navigation.inactiveText,
        opacity: disabled ? 0.64 : 1,
        textAlign: "left",
      })}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Icon size={18} />
        {!collapsed ? (
          <Typography
            variant="body2"
            sx={(theme) => ({
              fontWeight: active || selected ? 600 : 500,
              color: "inherit",
            })}
          >
            {label}
          </Typography>
        ) : null}
      </Stack>

      {!collapsed ? <ChevronDown size={16} /> : null}
    </Box>
  );
}

export function NavigationStatesShowcase() {
  return (
    <NavigationShowcaseCard
      title="Navigation State Reference"
      description="Shared interaction states used across sidebar items, tabs, pagination controls, and workflow navigation."
      token="theme.navigation.states"
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(2),
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
        })}
      >
        <StateTile
          title="Default"
          token="theme.navigation.states.default"
          note="Base resting navigation item."
        >
          <SidebarStatePreview icon={LayoutGrid} label="Component Library" />
        </StateTile>

        <StateTile
          title="Hover"
          token="theme.navigation.states.hover"
          note="Subtle hover tint for pointer states."
        >
          <SidebarStatePreview hover icon={LayoutGrid} label="Component Library" />
        </StateTile>

        <StateTile
          title="Focused"
          token="theme.navigation.states.focused"
          note="Keyboard focus using the brand focus ring."
        >
          <SidebarStatePreview focused icon={LayoutGrid} label="Component Library" />
        </StateTile>

        <StateTile
          title="Active"
          token="theme.navigation.states.active"
          note="Current route or current navigation context."
        >
          <SidebarStatePreview active icon={LayoutGrid} label="Component Library" />
        </StateTile>

        <StateTile
          title="Selected"
          token="theme.navigation.states.selected"
          note="Selected pagination or tab state."
        >
          <Box
            sx={(theme) => ({
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: 36,
              height: 36,
              px: theme.spacing(1),
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.brand.primary,
              color: theme.customTokens.text.inverse,
            })}
          >
            <Typography variant="subtitle2">3</Typography>
          </Box>
        </StateTile>

        <StateTile
          title="Expanded"
          token="theme.navigation.states.expanded"
          note="Parent menu with visible child navigation."
        >
          <Stack sx={(theme) => ({ gap: theme.spacing(1) })}>
            <SidebarStatePreview selected icon={Package} label="Inventory" />
            <Box sx={(theme) => ({ pl: theme.spacing(2.5) })}>
              <SidebarStatePreview active icon={LayoutGrid} label="Stock" />
            </Box>
          </Stack>
        </StateTile>

        <StateTile
          title="Collapsed"
          token="theme.navigation.states.collapsed"
          note="Icon-only navigation for dense workspaces."
        >
          <SidebarStatePreview collapsed icon={PanelLeftOpen} label="Sidebar" />
        </StateTile>

        <StateTile
          title="Disabled"
          token="theme.navigation.states.disabled"
          note="Unavailable routes or restricted actions."
        >
          <SidebarStatePreview disabled icon={LayoutGrid} label="Approvals" />
        </StateTile>
      </Box>
    </NavigationShowcaseCard>
  );
}
