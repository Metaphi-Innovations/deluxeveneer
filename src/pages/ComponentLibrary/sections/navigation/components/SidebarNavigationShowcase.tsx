import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Boxes,
  ChevronDown,
  Factory,
  FolderTree,
  GitBranch,
  LayoutDashboard,
  LayoutGrid,
  Package,
  PackageCheck,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ReceiptIndianRupee,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Warehouse,
  Wrench,
} from "lucide-react";
import {
  Box,
  Divider,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import deluxeWordmark from "../../../../../assets/deluxe-veneers.png";
import { NavigationShowcaseCard } from "./NavigationShowcaseCard";

type PreviewNavItem = {
  children?: ReadonlyArray<PreviewNavItem>;
  icon: LucideIcon;
  id: string;
  label: string;
};

const baseItems: ReadonlyArray<PreviewNavItem> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "masters", label: "Masters", icon: FolderTree },
  { id: "inventory", label: "Inventory", icon: Boxes },
  { id: "factory", label: "Factory", icon: Factory },
  { id: "purchase", label: "Purchase", icon: ShoppingCart },
  { id: "sales", label: "Sales", icon: ReceiptIndianRupee },
  { id: "production", label: "Production", icon: PackageOpen },
  { id: "quality", label: "Quality", icon: ShieldCheck },
  { id: "dispatch", label: "Dispatch", icon: Truck },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "administration", label: "Administration", icon: Settings },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    children: [{ id: "component-library", label: "Component Library", icon: LayoutGrid }],
  },
] as const;

const nestedItems: ReadonlyArray<PreviewNavItem> = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    id: "inventory",
    label: "Inventory",
    icon: Boxes,
    children: [
      { id: "inventory-inward", label: "Inward", icon: Package },
      { id: "inventory-outward", label: "Outward", icon: GitBranch },
      { id: "inventory-stock", label: "Stock", icon: Warehouse },
      { id: "inventory-transfer", label: "Transfer", icon: PackageCheck },
    ],
  },
  {
    id: "factory",
    label: "Factory",
    icon: Factory,
    children: [
      { id: "factory-cutting", label: "Cutting", icon: Package },
      { id: "factory-pressing", label: "Pressing", icon: PackageCheck },
      { id: "factory-drying", label: "Drying", icon: Warehouse },
      { id: "factory-packing", label: "Packing", icon: PackageOpen },
    ],
  },
  { id: "reports", label: "Reports", icon: BarChart3 },
] as const;

function SidebarFrame({
  children,
  collapsed = false,
}: {
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  return (
    <Box
      sx={(theme) => ({
        width: collapsed
          ? theme.spacing(11)
          : {
              xs: "100%",
              sm: 280,
            },
        minWidth: 0,
        minHeight: 520,
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: theme.customTokens.navigation.surface,
        overflow: "hidden",
      })}
    >
      {children}
    </Box>
  );
}

function VariantShell({
  children,
  description,
  title,
}: {
  children: React.ReactNode;
  description: string;
  title: string;
}) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(1.5),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(0.5),
        })}
      >
        <Typography variant="subtitle1" color="text.primary">
          {title}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </Stack>

      {children}
    </Stack>
  );
}

function SidebarHeader({ collapsed }: { collapsed?: boolean }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      sx={(theme) => ({
        minHeight: 64,
        px: collapsed ? theme.spacing(1.25) : theme.spacing(2),
        py: theme.spacing(1.5),
      })}
    >
      {!collapsed ? (
        <Box
          component="img"
          src={deluxeWordmark}
          alt="Deluxe Veneers"
          sx={{
            width: "100%",
            maxWidth: 156,
            height: "auto",
            objectFit: "contain",
          }}
        />
      ) : (
        <Box
          sx={(theme) => ({
            width: theme.spacing(4),
            height: theme.spacing(4),
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.navigation.activeBackground,
            color: theme.customTokens.navigation.activeText,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mx: "auto",
          })}
        >
          <Wrench size={16} />
        </Box>
      )}

      <IconButton
        aria-label={collapsed ? "Expand sidebar preview" : "Collapse sidebar preview"}
        disableRipple
        size="small"
        sx={(theme) => ({
          width: 30,
          height: 30,
          border: `1px solid ${theme.customTokens.borders.default}`,
          color: theme.customTokens.navigation.inactiveText,
          backgroundColor: theme.customTokens.surfaces.surface,
          "&:hover": {
            backgroundColor: theme.customTokens.navigation.hoverBackground,
            borderColor: theme.customTokens.borders.default,
          },
        })}
      >
        {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
      </IconButton>
    </Stack>
  );
}

function PreviewRow({
  active = false,
  collapsed = false,
  depth = 0,
  disabled = false,
  icon: Icon,
  label,
  onClick,
  open,
  showChevron = false,
}: {
  active?: boolean;
  collapsed?: boolean;
  depth?: number;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick?: (() => void) | undefined;
  open?: boolean | undefined;
  showChevron?: boolean;
}) {
  return (
    <ListItemButton
      disableRipple
      disabled={disabled}
      onClick={onClick}
      sx={(theme) => ({
        position: "relative",
        minHeight: 40,
        justifyContent: collapsed ? "center" : "flex-start",
        px: collapsed ? theme.spacing(1.25) : theme.spacing(1.5),
        py: theme.spacing(0.5),
        ml: collapsed ? 0 : theme.spacing(depth * 2),
        color: active
          ? theme.customTokens.navigation.activeText
          : theme.customTokens.navigation.inactiveText,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: active
          ? theme.customTokens.navigation.activeBackground
          : "transparent",
        "&::before": active
          ? {
              content: '""',
              position: "absolute",
              left: 0,
              top: 6,
              bottom: 6,
              width: theme.customTokens.navigation.indicatorWidth,
              borderRadius: `${theme.customTokens.radius.pill}px`,
              backgroundColor: theme.customTokens.navigation.activeIndicator,
            }
          : undefined,
        "&:hover": {
          backgroundColor: active
            ? theme.customTokens.navigation.activeBackground
            : theme.customTokens.navigation.hoverBackground,
        },
        "&.Mui-disabled": {
          opacity: 0.56,
        },
      })}
    >
      <ListItemIcon
        sx={(theme) => ({
          minWidth: collapsed ? 0 : 32,
          justifyContent: "center",
          color: active
            ? theme.customTokens.navigation.activeText
            : theme.customTokens.navigation.inactiveText,
        })}
      >
        <Icon size={18} />
      </ListItemIcon>

      {!collapsed ? (
        <>
          <ListItemText
            primary={label}
            primaryTypographyProps={{
              variant: depth > 0 ? "body2" : "subtitle2",
              fontWeight: active ? 600 : depth > 0 ? 500 : 600,
              color: "inherit",
            }}
          />

          {showChevron ? (
            <ChevronDown
              size={18}
              style={{
                transform: open ? "rotate(0deg)" : "rotate(-90deg)",
                transition: "transform 180ms ease",
              }}
            />
          ) : null}
        </>
      ) : null}
    </ListItemButton>
  );
}

export function SidebarNavigationShowcase() {
  const [collapsedActive, setCollapsedActive] = useState("inventory");
  const [nestedOpen, setNestedOpen] = useState({
    inventory: true,
    factory: false,
  });

  return (
    <NavigationShowcaseCard
      title="ERP Sidebar Variants"
      description="Reference implementation of the Deluxe Veneers module sidebar across expanded, collapsed, and nested ERP contexts."
      token="theme.navigation.sidebar"
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(3),
          gridTemplateColumns: {
            xs: "1fr",
            lg: "repeat(3, minmax(0, 1fr))",
          },
          alignItems: "start",
        })}
      >
        <VariantShell
          title="Expanded Sidebar"
          description="Full module navigation with the active Component Library entry."
        >
          <SidebarFrame>
            <SidebarHeader />
            <Divider />

            <List
              disablePadding
              sx={(theme) => ({
                px: theme.spacing(1.5),
                py: theme.spacing(1.5),
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(0.5),
              })}
            >
              {baseItems.map((item) =>
                item.children ? (
                  <Box key={item.id}>
                    <PreviewRow
                      icon={item.icon}
                      label={item.label}
                      open
                      showChevron
                    />

                    <Stack
                      sx={(theme) => ({
                        gap: theme.spacing(0.5),
                        pl: theme.spacing(3),
                        pt: theme.spacing(0.5),
                      })}
                    >
                      {item.children.map((child) => (
                        <PreviewRow
                          key={child.id}
                          active={child.id === "component-library"}
                          depth={1}
                          icon={child.icon}
                          label={child.label}
                        />
                      ))}
                    </Stack>
                  </Box>
                ) : (
                  <PreviewRow key={item.id} icon={item.icon} label={item.label} />
                ),
              )}
            </List>
          </SidebarFrame>
        </VariantShell>

        <VariantShell
          title="Collapsed Sidebar"
          description="Icon-only navigation with hover tooltips for dense ERP screens."
        >
          <SidebarFrame collapsed>
            <SidebarHeader collapsed />
            <Divider />

            <List
              disablePadding
              sx={(theme) => ({
                px: theme.spacing(1),
                py: theme.spacing(1.5),
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(0.5),
                alignItems: "center",
              })}
            >
              {baseItems.map((item) => {
                const active = collapsedActive === item.id;

                return (
                  <Tooltip key={item.id} title={item.label} placement="right" arrow>
                    <Box sx={{ width: "100%" }}>
                      <PreviewRow
                        active={active}
                        collapsed
                        icon={item.icon}
                        label={item.label}
                        onClick={() => setCollapsedActive(item.id)}
                      />
                    </Box>
                  </Tooltip>
                );
              })}
            </List>
          </SidebarFrame>
        </VariantShell>

        <VariantShell
          title="Nested Navigation"
          description="Expandable ERP groups for Inventory and Factory workflows."
        >
          <SidebarFrame>
            <SidebarHeader />
            <Divider />

            <List
              disablePadding
              sx={(theme) => ({
                px: theme.spacing(1.5),
                py: theme.spacing(1.5),
                display: "flex",
                flexDirection: "column",
                gap: theme.spacing(0.5),
              })}
            >
              {nestedItems.map((item) =>
                item.children ? (
                  <Box key={item.id}>
                    <PreviewRow
                      icon={item.icon}
                      label={item.label}
                      onClick={() =>
                        setNestedOpen((current) => ({
                          ...current,
                          [item.id]: !current[item.id as keyof typeof current],
                        }))
                      }
                      open={nestedOpen[item.id as keyof typeof nestedOpen]}
                      showChevron
                    />

                    {nestedOpen[item.id as keyof typeof nestedOpen] ? (
                      <Stack
                        sx={(theme) => ({
                          gap: theme.spacing(0.5),
                          pl: theme.spacing(3),
                          pt: theme.spacing(0.5),
                        })}
                      >
                        {item.children.map((child) => (
                          <PreviewRow
                            key={child.id}
                            active={child.id === "inventory-stock"}
                            depth={1}
                            icon={child.icon}
                            label={child.label}
                          />
                        ))}
                      </Stack>
                    ) : null}
                  </Box>
                ) : (
                  <PreviewRow
                    key={item.id}
                    active={item.id === "dashboard"}
                    icon={item.icon}
                    label={item.label}
                  />
                ),
              )}
            </List>
          </SidebarFrame>
        </VariantShell>
      </Box>
    </NavigationShowcaseCard>
  );
}
