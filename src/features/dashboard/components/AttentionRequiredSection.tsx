import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { portalTypography } from "../../../theme/typography";
import type { AttentionItem } from "../shared/dashboardTypes";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { DashboardEmptyState } from "./DashboardStates";

function toneColor(tone: AttentionItem["tone"]) {
  if (tone === "error") {
    return "#AD655A";
  }
  if (tone === "warning") {
    return "#B98A45";
  }
  return "#6F84A0";
}

export function AttentionRequiredSection({
  items,
}: {
  items: readonly AttentionItem[];
}) {
  const navigate = useNavigate();
  const hasAny = items.some((item) => item.count > 0);

  return (
    <DashboardSectionCard title="Attention Required">
      {!hasAny ? (
        <DashboardEmptyState message="No items require attention." />
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
            const clickable = Boolean(item.href) && item.count > 0;
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
                    ? {
                        backgroundColor: theme.customTokens.surfaces.alt,
                      }
                    : undefined,
                  "&:focus-visible": clickable
                    ? {
                        outline: `2px solid ${theme.customTokens.brand.primary}`,
                        outlineOffset: -2,
                      }
                    : undefined,
                })}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: toneColor(item.tone),
                      flexShrink: 0,
                      opacity: item.count > 0 ? 1 : 0.35,
                    }}
                  />
                  <Typography
                    sx={(theme) => ({
                      color: theme.customTokens.text.primary,
                      fontSize: portalTypography.body.fontSize,
                      fontWeight: 500,
                      lineHeight: 1.3,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    })}
                  >
                    {item.label}
                  </Typography>
                </Stack>
                <Typography
                  sx={(theme) => ({
                    color:
                      item.count > 0
                        ? theme.customTokens.text.primary
                        : theme.customTokens.text.disabled,
                    fontSize: "14px",
                    fontWeight: 700,
                    lineHeight: 1.2,
                    flexShrink: 0,
                  })}
                >
                  {item.count}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      )}
    </DashboardSectionCard>
  );
}
