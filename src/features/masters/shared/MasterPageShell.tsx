import type { LucideIcon } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { Box, Stack } from "@mui/material";

import {
  PageHeader,
  type PageHeaderBackNav,
} from "../../../components/navigation/PageHeader";
import type { ErpBreadcrumbItem } from "../../../components/navigation/ErpBreadcrumbs";

interface MasterPageShellProps extends PropsWithChildren {
  actions?: ReactNode | undefined;
  backNav?: PageHeaderBackNav | null | undefined;
  breadcrumbs?: ErpBreadcrumbItem[] | undefined;
  contentGap?: number;
  icon?: LucideIcon | undefined;
  subtitle?: string | undefined;
  title: string;
}

export function MasterPageShell({
  actions,
  backNav,
  breadcrumbs = [],
  children,
  contentGap = 2,
  icon,
  subtitle,
  title,
}: MasterPageShellProps) {
  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        bgcolor: "background.paper",
        px: { xs: theme.spacing(1.75), md: theme.spacing(2.5) },
        py: { xs: theme.spacing(1.5), md: theme.spacing(1.75) },
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(Math.min(contentGap, 1.5)),
        })}
      >
        <PageHeader
          actions={actions}
          backNav={backNav}
          breadcrumbs={breadcrumbs}
          icon={icon}
          subtitle={subtitle}
          title={title}
        />

        {children}
      </Stack>
    </Box>
  );
}
