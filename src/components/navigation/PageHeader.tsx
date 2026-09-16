import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Box, Link, Stack, Typography, useTheme } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router";

import {
  portalIconSize,
  portalIconStroke,
} from "../../features/shared/portalIconStandards";
import { portalTypography } from "../../theme/typography";
import type { ErpBreadcrumbItem } from "./ErpBreadcrumbs";
import { resolvePortalPageIcon } from "./portalPageIcons";

export type PageHeaderBackNav = {
  label: string;
  to: string;
};

export interface PageHeaderProps {
  actions?: ReactNode | undefined;
  /** Optional back link for Create / Edit / View screens. */
  backNav?: PageHeaderBackNav | null | undefined;
  /**
   * Legacy breadcrumbs — used only to derive a back link when `backNav`
   * is not provided. Never rendered as a breadcrumb trail.
   */
  breadcrumbs?: readonly ErpBreadcrumbItem[] | undefined;
  icon?: LucideIcon | undefined;
  subtitle?: string | undefined;
  title: string;
}

export function resolvePageBackNav(
  breadcrumbs: readonly ErpBreadcrumbItem[] | undefined,
  title: string,
): PageHeaderBackNav | null {
  if (!breadcrumbs?.length) {
    return null;
  }

  const parentsWithTo = breadcrumbs.filter(
    (item): item is ErpBreadcrumbItem & { to: string } => Boolean(item.to),
  );

  if (parentsWithTo.length === 0) {
    return null;
  }

  const parent = parentsWithTo[parentsWithTo.length - 1]!;
  const normalizedTitle = title.trim().toLowerCase();
  const isTransactional =
    /^(create|edit|view|add|issue)\b/.test(normalizedTitle) ||
    /\b(create|edit|view|add|issue)\b/.test(normalizedTitle);

  if (!isTransactional) {
    return null;
  }

  return {
    label: `Back to ${parent.label}`,
    to: parent.to,
  };
}

export function PageHeader({
  actions,
  backNav,
  breadcrumbs,
  icon: iconProp,
  subtitle,
  title,
}: PageHeaderProps) {
  const theme = useTheme();
  const location = useLocation();
  const resolvedBackNav = backNav ?? resolvePageBackNav(breadcrumbs, title);
  const Icon = iconProp ?? resolvePortalPageIcon(location.pathname);

  return (
    <Stack
      sx={{
        gap: 0.5,
        pt: 0,
        pb: 1.25,
        borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
      }}
    >
      {resolvedBackNav ? (
        <Link
          component={RouterLink}
          to={resolvedBackNav.to}
          underline="none"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            alignSelf: "flex-start",
            color: theme.customTokens.brand.primary,
            fontSize: portalTypography.breadcrumb.fontSize,
            fontWeight: portalTypography.breadcrumb.fontWeight,
            lineHeight: portalTypography.breadcrumb.lineHeight,
            mb: 0.25,
            "&:hover": {
              color: theme.customTokens.brand.primaryScale[800],
            },
          }}
        >
          <ArrowLeft
            size={portalIconSize.md}
            strokeWidth={portalIconStroke.default}
          />
          {resolvedBackNav.label}
        </Link>
      ) : null}

      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", md: "center" }}
        spacing={1}
      >
        <Stack spacing={0.15} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              minWidth: 0,
            }}
          >
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                m: 0,
                lineHeight: 0,
                color: theme.customTokens.navigation.activeText,
              }}
            >
              <Icon
                size={portalIconSize.lg}
                strokeWidth={portalIconStroke.default}
                aria-hidden
              />
            </Box>

            <Typography
              component="h1"
              sx={{
                m: 0,
                color: theme.customTokens.text.primary,
                fontSize: portalTypography.pageTitle.fontSize,
                fontWeight: portalTypography.pageTitle.fontWeight,
                lineHeight: 1.2,
              }}
            >
              {title}
            </Typography>
          </Box>

          {subtitle ? (
            <Typography
              sx={{
                m: 0,
                pl: "26px",
                color: theme.customTokens.text.secondary,
                maxWidth: 720,
                fontSize: portalTypography.pageDescription.fontSize,
                fontWeight: portalTypography.pageDescription.fontWeight,
                lineHeight: portalTypography.pageDescription.lineHeight,
              }}
            >
              {subtitle}
            </Typography>
          ) : null}
        </Stack>

        {actions ? (
          <Box
            sx={{
              flexShrink: 0,
              display: "flex",
              justifyContent: { xs: "flex-start", md: "flex-end" },
              alignItems: "center",
              width: "auto",
              maxWidth: "100%",
            }}
          >
            {actions}
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}
