import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck,
  Boxes,
  Copy,
  Download,
  Eye,
  Factory,
  FileOutput,
  Filter,
  LayoutDashboard,
  MoreHorizontal,
  PackageOpen,
  Pencil,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  SendHorizontal,
  Star,
  Trash2,
  Truck,
  Upload,
  UsersRound,
  Warehouse,
  X,
} from "lucide-react";
import { Box, Button, Divider, Stack, Typography, useTheme } from "@mui/material";

type ActionIcon = {
  icon: LucideIcon;
  name: string;
  token: string;
};

type SidebarModuleIcon = {
  icon: LucideIcon;
  name: string;
  subItems: ReadonlyArray<string>;
  token: string;
};

const actionIcons: ReadonlyArray<ActionIcon> = [
  { icon: Save, name: "Save", token: "theme.icons.save" },
  { icon: SendHorizontal, name: "Submit", token: "theme.icons.submit" },
  { icon: Pencil, name: "Edit", token: "theme.icons.edit" },
  { icon: Trash2, name: "Delete", token: "theme.icons.delete" },
  { icon: Plus, name: "Add", token: "theme.icons.add" },
  { icon: Download, name: "Download", token: "theme.icons.download" },
  { icon: FileOutput, name: "Export", token: "theme.icons.export" },
  { icon: Eye, name: "View", token: "theme.icons.view" },
  { icon: Printer, name: "Print", token: "theme.icons.print" },
  { icon: RefreshCw, name: "Refresh", token: "theme.icons.refresh" },
  { icon: Search, name: "Search", token: "theme.icons.search" },
  { icon: Filter, name: "Filter", token: "theme.icons.filter" },
  { icon: Upload, name: "Upload", token: "theme.icons.upload" },
  { icon: Copy, name: "Copy", token: "theme.icons.copy" },
  { icon: X, name: "Close", token: "theme.icons.close" },
  { icon: MoreHorizontal, name: "More", token: "theme.icons.more" },
] as const;

const toolbarIcons = actionIcons.filter((item) =>
  ["Save", "Edit", "Delete", "Download", "Export", "View"].includes(item.name),
);

const sidebarModuleIcons: ReadonlyArray<SidebarModuleIcon> = [
  {
    icon: LayoutDashboard,
    name: "Dashboard",
    token: "theme.icons.sidebar.dashboard",
    subItems: [],
  },
  {
    icon: UsersRound,
    name: "User Management & Role Permission",
    token: "theme.icons.sidebar.users",
    subItems: [],
  },
  {
    icon: Star,
    name: "Masters",
    token: "theme.icons.sidebar.masters",
    subItems: ["Character", "Currency", "Department", "Item Category", "Item Name"],
  },
  {
    icon: Boxes,
    name: "Inventory",
    token: "theme.icons.sidebar.inventory",
    subItems: ["Inward", "Outward", "Stock"],
  },
  {
    icon: BadgeCheck,
    name: "QC (Quality Control)",
    token: "theme.icons.sidebar.qc",
    subItems: ["Inspection", "Approval"],
  },
  {
    icon: Warehouse,
    name: "Warehouse",
    token: "theme.icons.sidebar.warehouse",
    subItems: ["Bin", "Location"],
  },
  {
    icon: Factory,
    name: "Factory",
    token: "theme.icons.sidebar.factory",
    subItems: ["Production", "Machine"],
  },
  {
    icon: PackageOpen,
    name: "Packing",
    token: "theme.icons.sidebar.packing",
    subItems: ["Packing Entry"],
  },
  {
    icon: Truck,
    name: "Dispatch",
    token: "theme.icons.sidebar.dispatch",
    subItems: ["Dispatch Entry"],
  },
] as const;

const sidebarGuidelines = [
  "Only top-level ERP modules use icons.",
  "Child menu items use bullet points only.",
  "All sidebar icons use Lucide.",
  "Icon size: 20px.",
  "All sidebar icons remain outlined.",
  "Sidebar icons must remain consistent across the ERP.",
] as const;

function TokenText({ token }: { token: string }) {
  const theme = useTheme();

  return (
    <Typography
      component="code"
      sx={{
        fontFamily: "monospace",
        fontSize: "0.6875rem",
        lineHeight: 1.35,
        color: theme.customTokens.neutrals[700],
      }}
    >
      {token}
    </Typography>
  );
}

function SectionHeading({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(0.5),
      })}
    >
      <Typography variant="subtitle1" color="text.primary">
        {title}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>
    </Stack>
  );
}

export function IconGallery() {
  const theme = useTheme();

  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(3),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <SectionHeading
          title="Action Icons"
          description="Frequently used ERP action icons."
        />

        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(1),
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
          })}
        >
          {actionIcons.map((item) => (
            <Box
              key={item.token}
              sx={(theme) => ({
                minHeight: theme.spacing(11),
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
                px: theme.spacing(1.25),
                py: theme.spacing(1.5),
                transition: theme.transitions.create(
                  ["background-color", "border-color"],
                  {
                    duration: theme.transitions.duration.shorter,
                  },
                ),
                "&:hover": {
                  backgroundColor: theme.customTokens.navigation.hoverBackground,
                  borderColor: theme.customTokens.borders.hover,
                },
              })}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={(theme) => ({
                  height: "100%",
                  gap: theme.spacing(0.75),
                  textAlign: "center",
                })}
              >
                <item.icon
                  color={theme.customTokens.brand.primary}
                  size={20}
                />

                <Typography variant="caption" color="text.primary" fontWeight={600}>
                  {item.name}
                </Typography>

                <TokenText token={item.token} />
              </Stack>
            </Box>
          ))}
        </Box>

        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.25),
          })}
        >
          <Typography variant="subtitle2" color="text.primary">
            Example Toolbar
          </Typography>

          <Box
            sx={(theme) => ({
              display: "flex",
              flexWrap: "wrap",
              gap: theme.spacing(1),
            })}
          >
            {toolbarIcons.map((item) => (
              <Button
                key={`toolbar-${item.token}`}
                disableElevation
                startIcon={<item.icon size={16} />}
                variant="outlined"
                sx={(theme) => ({
                  minHeight: theme.spacing(4.5),
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  borderColor: theme.customTokens.borders.default,
                  backgroundColor: theme.customTokens.surfaces.surface,
                  color: theme.customTokens.navigation.activeText,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: theme.customTokens.brand.primary,
                    backgroundColor: theme.customTokens.navigation.hoverBackground,
                  },
                  "&:active": {
                    backgroundColor: theme.customTokens.navigation.activeBackground,
                  },
                })}
              >
                {item.name}
              </Button>
            ))}
          </Box>
        </Stack>
      </Stack>

      <Divider sx={{ borderColor: theme.customTokens.borders.light }} />

      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <SectionHeading
          title="Sidebar Module Icons"
          description="Primary navigation icons used for the Deluxe Veneers ERP sidebar."
        />

        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(1),
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
              xl: "repeat(5, minmax(0, 1fr))",
            },
          })}
        >
          {sidebarModuleIcons.map((item) => (
            <Box
              key={item.token}
              sx={(theme) => ({
                minHeight: theme.spacing(11),
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
                px: theme.spacing(1.25),
                py: theme.spacing(1.5),
                transition: theme.transitions.create(
                  ["background-color", "border-color"],
                  {
                    duration: theme.transitions.duration.shorter,
                  },
                ),
                "&:hover": {
                  backgroundColor: theme.customTokens.navigation.hoverBackground,
                  borderColor: theme.customTokens.borders.hover,
                },
              })}
            >
              <Stack
                alignItems="center"
                justifyContent="center"
                sx={(theme) => ({
                  height: "100%",
                  gap: theme.spacing(0.75),
                  textAlign: "center",
                })}
              >
                <item.icon
                  color={theme.customTokens.brand.primary}
                  size={20}
                />

                <Typography variant="caption" color="text.primary" fontWeight={600}>
                  {item.name}
                </Typography>

                <TokenText token={item.token} />
              </Stack>
            </Box>
          ))}
        </Box>

        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.25),
          })}
        >
          <Typography variant="subtitle2" color="text.primary">
            Sidebar Usage Example
          </Typography>

          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.light}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.alt,
              px: theme.spacing(2),
              py: theme.spacing(1.75),
            })}
          >
            <Stack
              sx={(theme) => ({
                gap: theme.spacing(1.25),
              })}
            >
              {sidebarModuleIcons.map((item) => (
                <Stack
                  key={`example-${item.token}`}
                  sx={(theme) => ({
                    gap: item.subItems.length > 0 ? theme.spacing(0.5) : 0,
                  })}
                >
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <item.icon
                      color={theme.customTokens.brand.primary}
                      size={20}
                    />

                    <Typography variant="body2" color="text.primary" fontWeight={600}>
                      {item.name}
                    </Typography>
                  </Stack>

                  {item.subItems.length > 0 ? (
                    <Stack
                      sx={(theme) => ({
                        pl: theme.spacing(3.5),
                        gap: theme.spacing(0.25),
                      })}
                    >
                      {item.subItems.map((subItem) => (
                        <Typography key={subItem} variant="body2" color="text.secondary">
                          {`\u2022 ${subItem}`}
                        </Typography>
                      ))}
                    </Stack>
                  ) : null}
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>

        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
          })}
        >
          <Typography variant="subtitle2" color="text.primary">
            Sidebar Guidelines
          </Typography>

          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.light}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.alt,
              px: theme.spacing(2),
              py: theme.spacing(1.5),
            })}
          >
            <Stack
              sx={(theme) => ({
                gap: theme.spacing(0.5),
              })}
            >
              {sidebarGuidelines.map((guideline) => (
                <Typography key={guideline} variant="body2" color="text.secondary">
                  {`\u2022 ${guideline}`}
                </Typography>
              ))}
            </Stack>
          </Box>
        </Stack>
      </Stack>
    </Stack>
  );
}
