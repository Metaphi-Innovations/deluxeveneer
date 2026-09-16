import { Stack, Typography } from "@mui/material";

import { BreadcrumbsShowcase } from "./components/BreadcrumbsShowcase";
import { NavigationStatesShowcase } from "./components/NavigationStatesShowcase";
import { PageHeaderShowcase } from "./components/PageHeaderShowcase";
import { PaginationShowcase } from "./components/PaginationShowcase";
import { TabsShowcase } from "./components/TabsShowcase";

const sections = [
  {
    title: "Tabs",
    description:
      "Internal page tabs used to switch between sections, records, and supporting workflows.",
    Component: TabsShowcase,
  },
  {
    title: "Breadcrumbs",
    description:
      "Hierarchical path indicators for deep ERP pages such as inward entries and production logs.",
    Component: BreadcrumbsShowcase,
  },
  {
    title: "Page Header",
    description:
      "Standard page framing with title, subtitle, breadcrumbs, and action placement.",
    Component: PageHeaderShowcase,
  },
  {
    title: "Pagination",
    description:
      "Production pagination pattern for master lists, transaction logs, and approval queues.",
    Component: PaginationShowcase,
  },
  {
    title: "Navigation States",
    description:
      "Compact state reference for sidebar items, tabs, and other navigation touchpoints.",
    Component: NavigationStatesShowcase,
  },
] as const;

export function NavigationSection() {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(5),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1),
        })}
      >
        <Typography variant="h2" color="text.primary">
          Navigation
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Documentation for navigation components used throughout the Deluxe Veneers ERP.
        </Typography>
      </Stack>

      {sections.map(({ Component, description, title }) => (
        <Stack
          key={title}
          sx={(theme) => ({
            gap: theme.spacing(3),
          })}
        >
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(1),
            })}
          >
            <Typography variant="h3" color="text.primary">
              {title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>

          <Component />
        </Stack>
      ))}
    </Stack>
  );
}
