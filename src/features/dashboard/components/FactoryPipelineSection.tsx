import { ChevronRight } from "lucide-react";
import { Box, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import {
  portalIconSize,
  portalIconStroke,
} from "../../shared/portalIconStandards";
import { portalTypography } from "../../../theme/typography";
import type { FactoryPipelineStage } from "../shared/dashboardTypes";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { DashboardEmptyState } from "./DashboardStates";

export function FactoryPipelineSection({
  stages,
}: {
  stages: readonly FactoryPipelineStage[];
}) {
  const navigate = useNavigate();
  const hasPending = stages.some((stage) => stage.pendingCount > 0);

  return (
    <DashboardSectionCard title="Factory Pipeline">
      {!hasPending && stages.length === 0 ? (
        <DashboardEmptyState message="No production stages available." />
      ) : (
        <Box
          sx={{
            display: "flex",
            alignItems: "stretch",
            flexWrap: "wrap",
            gap: 0.75,
            rowGap: 1,
          }}
        >
          {stages.map((stage, index) => (
            <Stack
              key={stage.slug}
              direction="row"
              spacing={0.75}
              sx={{ alignItems: "center" }}
            >
              <Box
                component="button"
                type="button"
                onClick={() => navigate(stage.href)}
                sx={(theme) => ({
                  appearance: "none",
                  cursor: "pointer",
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "7px",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  px: 1.15,
                  py: 0.85,
                  minWidth: 108,
                  textAlign: "left",
                  transition:
                    "border-color 120ms ease, background-color 120ms ease",
                  "&:hover": {
                    borderColor: theme.customTokens.brand.primaryScale[300],
                    backgroundColor: theme.customTokens.brand.primaryScale[50],
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.customTokens.brand.primary}`,
                    outlineOffset: 1,
                  },
                })}
              >
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.primary,
                    fontSize: portalTypography.formLabel.fontSize,
                    fontWeight: 600,
                    lineHeight: 1.25,
                    whiteSpace: "nowrap",
                  })}
                >
                  {stage.title}
                </Typography>
                <Typography
                  sx={(theme) => ({
                    mt: 0.35,
                    color: theme.customTokens.brand.primary,
                    fontSize: "12px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                  })}
                >
                  {stage.pendingCount} Pending
                </Typography>
              </Box>
              {index < stages.length - 1 ? (
                <Box
                  sx={(theme) => ({
                    display: { xs: "none", md: "inline-flex" },
                    color: theme.customTokens.neutrals[400],
                    flexShrink: 0,
                  })}
                  aria-hidden
                >
                  <ChevronRight
                    size={portalIconSize.sm}
                    strokeWidth={portalIconStroke.default}
                  />
                </Box>
              ) : null}
            </Stack>
          ))}
        </Box>
      )}
    </DashboardSectionCard>
  );
}
