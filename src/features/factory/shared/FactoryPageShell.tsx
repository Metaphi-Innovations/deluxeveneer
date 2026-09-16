import type { LucideIcon } from "lucide-react";
import { Factory } from "lucide-react";
import type { PropsWithChildren, ReactNode } from "react";
import { Stack } from "@mui/material";

import type { ErpBreadcrumbItem } from "../../../components/navigation/ErpBreadcrumbs";
import type { PageHeaderBackNav } from "../../../components/navigation/PageHeader";
import { MasterPageShell } from "../../masters/shared";

interface FactoryPageShellProps extends PropsWithChildren {
  actions?: ReactNode | undefined;
  backNav?: PageHeaderBackNav | null | undefined;
  breadcrumbs?: ErpBreadcrumbItem[] | undefined;
  icon?: LucideIcon | undefined;
  processTabs?: ReactNode | undefined;
  subtitle?: string | undefined;
  title: string;
}

export function FactoryPageShell({
  actions,
  backNav,
  breadcrumbs = [],
  children,
  icon = Factory,
  processTabs,
  subtitle,
  title,
}: FactoryPageShellProps) {
  return (
    <MasterPageShell
      actions={actions}
      backNav={backNav}
      breadcrumbs={breadcrumbs}
      contentGap={2}
      icon={icon}
      subtitle={subtitle}
      title={title}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        {processTabs}

        {children}
      </Stack>
    </MasterPageShell>
  );
}
