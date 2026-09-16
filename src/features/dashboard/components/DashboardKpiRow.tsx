import type { LucideIcon } from "lucide-react";
import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import {
  portalIconSize,
  portalIconStroke,
} from "../../shared/portalIconStandards";
import { portalTypography } from "../../../theme/typography";
import type { DashboardKpi } from "../shared/dashboardTypes";

function KpiCard({ kpi }: { kpi: DashboardKpi }) {
  const navigate = useNavigate();
  const Icon = kpi.icon as LucideIcon;

  return (
    <Box
      component="button"
      type="button"
      onClick={() => navigate(kpi.href)}
      sx={(theme) => ({
        appearance: "none",
        textAlign: "left",
        cursor: "pointer",
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: "8px",
        backgroundColor: theme.customTokens.surfaces.surface,
        boxShadow: "none",
        px: 1.5,
        py: 1.15,
        minWidth: 0,
        transition: "border-color 120ms ease, background-color 120ms ease",
        "&:hover": {
          borderColor: theme.customTokens.brand.primaryScale[300],
          backgroundColor: theme.customTokens.surfaces.alt,
        },
        "&:focus-visible": {
          outline: `2px solid ${theme.customTokens.brand.primary}`,
          outlineOffset: 1,
        },
      })}
    >
      <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
        <Box
          sx={(theme) => ({
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            flexShrink: 0,
            borderRadius: "6px",
            backgroundColor: theme.customTokens.brand.primaryScale[50],
            color: theme.customTokens.brand.primary,
          })}
        >
          <Icon
            size={portalIconSize.sm}
            strokeWidth={portalIconStroke.default}
          />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.secondary,
              fontSize: portalTypography.helper.fontSize,
              fontWeight: 500,
              lineHeight: 1.25,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            })}
          >
            {kpi.label}
          </Typography>
          <Typography
            sx={(theme) => ({
              mt: 0.35,
              color: theme.customTokens.text.primary,
              fontSize: "22px",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
            })}
          >
            {kpi.value}
          </Typography>
          {kpi.hint ? (
            <Typography
              sx={(theme) => ({
                mt: 0.25,
                color: theme.customTokens.text.disabled,
                fontSize: "11px",
                fontWeight: 400,
                lineHeight: 1.2,
              })}
            >
              {kpi.hint}
            </Typography>
          ) : null}
        </Box>
      </Stack>
    </Box>
  );
}

export function DashboardKpiRow({ kpis }: { kpis: readonly DashboardKpi[] }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        },
        gap: 1.25,
      }}
    >
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </Box>
  );
}
