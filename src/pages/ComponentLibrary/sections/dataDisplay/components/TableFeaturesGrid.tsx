import type { LucideIcon } from "lucide-react";
import {
  ArrowUpDown,
  CheckSquare2,
  Columns3,
  ListFilter,
  MoveHorizontal,
  PanelTop,
  Rows3,
  Scroll,
} from "lucide-react";
import { Box, Stack, Typography, useTheme } from "@mui/material";

type Feature = {
  description: string;
  icon: LucideIcon;
  title: string;
};

const features: ReadonlyArray<Feature> = [
  {
    title: "Dynamic Column Width",
    description: "Columns expand naturally with ERP content instead of truncating values.",
    icon: Columns3,
  },
  {
    title: "Column Filters",
    description: "Each header exposes filter actions without adding inline search fields.",
    icon: ListFilter,
  },
  {
    title: "Sortable Columns",
    description: "Sorting states are available directly from the table header.",
    icon: ArrowUpDown,
  },
  {
    title: "Horizontal Scroll",
    description: "Wide 20+ column datasets remain usable on desktop and touch devices.",
    icon: MoveHorizontal,
  },
  {
    title: "Subtle Scrollbar",
    description: "Scrollable overflow uses a restrained maroon scrollbar treatment.",
    icon: Scroll,
  },
  {
    title: "Pagination",
    description: "Enterprise footer includes record count, page controls, and go-to-page.",
    icon: Rows3,
  },
  {
    title: "Row Selection",
    description: "Selectable tables support header checkbox, multi-select, and clear state.",
    icon: CheckSquare2,
  },
  {
    title: "Sticky Header",
    description: "Column headers stay fixed during vertical scroll for dense datasets.",
    icon: PanelTop,
  },
] as const;

export function TableFeaturesGrid() {
  const theme = useTheme();

  return (
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
      {features.map((feature) => (
        <Box
          key={feature.title}
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.light}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.surfaces.alt,
            p: theme.spacing(2),
          })}
        >
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(1.25),
            })}
          >
            <Box
              sx={(theme) => ({
                width: theme.spacing(5),
                height: theme.spacing(5),
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.navigation.activeBackground,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <feature.icon
                color={theme.customTokens.navigation.activeText}
                size={theme.customTokens.iconSizes.md}
              />
            </Box>

            <Typography variant="subtitle1" color="text.primary">
              {feature.title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {feature.description}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
