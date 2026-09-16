import type { LucideIcon } from "lucide-react";
import {
  CheckSquare2,
  Columns3,
  Keyboard,
  PanelTop,
  ShieldCheck,
  SquareAsterisk,
  TableProperties,
  Waypoints,
} from "lucide-react";
import { Box, Stack, Typography, useTheme } from "@mui/material";

type Guideline = {
  description: string;
  icon: LucideIcon;
  title: string;
};

const guidelines: ReadonlyArray<Guideline> = [
  {
    title: "Required Fields",
    description: "Mark mandatory ERP fields clearly before users reach submit actions.",
    icon: SquareAsterisk,
  },
  {
    title: "Field Grouping",
    description: "Group commercial, operational, and measurement fields by task context.",
    icon: Columns3,
  },
  {
    title: "Label Placement",
    description: "Keep labels above or inside controls consistently across the same form pattern.",
    icon: PanelTop,
  },
  {
    title: "Validation",
    description: "Surface inline validation close to the field without disrupting the full layout.",
    icon: ShieldCheck,
  },
  {
    title: "Button Placement",
    description: "Keep primary and secondary actions centered and visually stable below the form.",
    icon: CheckSquare2,
  },
  {
    title: "Responsive Layouts",
    description: "Collapse from 5 to 4 to 3 to 1 columns as available workspace narrows.",
    icon: Waypoints,
  },
  {
    title: "Keyboard Navigation",
    description: "Ensure tab order flows row-by-row and all controls remain operable by keyboard.",
    icon: Keyboard,
  },
  {
    title: "Inline Table Editing",
    description: "Use editable rows for line items while preserving sticky headers and clear actions.",
    icon: TableProperties,
  },
] as const;

export function FormGuidelinesGrid() {
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
      {guidelines.map((guideline) => (
        <Box
          key={guideline.title}
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
              <guideline.icon
                color={theme.customTokens.navigation.activeText}
                size={theme.customTokens.iconSizes.md}
              />
            </Box>

            <Typography variant="subtitle1" color="text.primary">
              {guideline.title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {guideline.description}
            </Typography>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
