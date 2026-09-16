import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { portalTypography } from "../../../theme/typography";
import type { DashboardActivityItem } from "../shared/dashboardTypes";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { DashboardEmptyState } from "./DashboardStates";

function formatActivityTime(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function formatActivityDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function RecentActivitySection({
  items,
}: {
  items: readonly DashboardActivityItem[];
}) {
  const navigate = useNavigate();

  return (
    <DashboardSectionCard title="Recent Activity">
      {items.length === 0 ? (
        <DashboardEmptyState message="No activity for the selected period." />
      ) : (
        <Stack
          spacing={0}
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "7px",
            overflow: "hidden",
          })}
        >
          {items.map((item, index) => {
            const clickable = Boolean(item.href);
            return (
              <Box
                key={item.id}
                component={clickable ? "button" : "div"}
                type={clickable ? "button" : undefined}
                onClick={
                  clickable && item.href
                    ? () => navigate(item.href!)
                    : undefined
                }
                sx={(theme) => ({
                  appearance: "none",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  px: 1.25,
                  py: 0.95,
                  border: "none",
                  borderBottom:
                    index < items.length - 1
                      ? `1px solid ${theme.customTokens.borders.divider}`
                      : "none",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  cursor: clickable ? "pointer" : "default",
                  textAlign: "left",
                  transition: "background-color 120ms ease",
                  "&:hover": clickable
                    ? { backgroundColor: theme.customTokens.surfaces.alt }
                    : undefined,
                  "&:focus-visible": clickable
                    ? {
                        outline: `2px solid ${theme.customTokens.brand.primary}`,
                        outlineOffset: -2,
                      }
                    : undefined,
                })}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={(theme) => ({
                      color: theme.customTokens.brand.primary,
                      fontSize: portalTypography.emphasis.fontSize,
                      fontWeight: 700,
                      lineHeight: 1.25,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    })}
                  >
                    {item.reference}
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      mt: 0.2,
                      color: theme.customTokens.text.secondary,
                      fontSize: portalTypography.helper.fontSize,
                      fontWeight: 400,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    })}
                  >
                    {item.description}
                  </Typography>
                </Box>
                <Box sx={{ flexShrink: 0, textAlign: "right" }}>
                  <Typography
                    sx={(theme) => ({
                      color: theme.customTokens.text.primary,
                      fontSize: portalTypography.helper.fontSize,
                      fontWeight: 600,
                      lineHeight: 1.25,
                    })}
                  >
                    {formatActivityTime(item.timestamp)}
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      mt: 0.15,
                      color: theme.customTokens.text.disabled,
                      fontSize: "11px",
                      fontWeight: 400,
                      lineHeight: 1.2,
                    })}
                  >
                    {formatActivityDate(item.timestamp)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Stack>
      )}
    </DashboardSectionCard>
  );
}
