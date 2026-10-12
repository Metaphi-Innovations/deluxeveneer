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
  sectionGap?: number | undefined;
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
  sectionGap = 2,
  subtitle,
  title,
}: FactoryPageShellProps) {
  return (
    <MasterPageShell
      actions={actions}
      backNav={backNav}
      breadcrumbs={breadcrumbs}
      contentGap={sectionGap}
      icon={icon}
      subtitle={subtitle}
      title={title}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(sectionGap),
          minWidth: 0,
          width: "100%",
        })}
      >
        {processTabs}

        {children}
      </Stack>
    </MasterPageShell>
  );
}
