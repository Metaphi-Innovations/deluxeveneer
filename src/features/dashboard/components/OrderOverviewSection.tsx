import { Box, Stack, Typography } from "@mui/material";

import { portalTypography } from "../../../theme/typography";
import type {
  OrderStatusSlice,
  OrderTypeSlice,
} from "../shared/dashboardTypes";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { DashboardEmptyState } from "./DashboardStates";

function DonutChart({ slices }: { slices: readonly OrderStatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0);
  const size = 132;
  const stroke = 18;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const arcs =
    total === 0
      ? []
      : slices
          .filter((slice) => slice.count > 0)
          .map((slice) => {
            const length = (slice.count / total) * circumference;
            const arc = {
              ...slice,
              dasharray: `${length} ${circumference - length}`,
              dashoffset: -offset,
            };
            offset += length;
            return arc;
          });

  return (
    <Box
      sx={{
        position: "relative",
        width: size,
        height: size,
        flexShrink: 0,
      }}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#EFE7E7"
          strokeWidth={stroke}
        />
        {arcs.map((arc) => (
          <circle
            key={arc.key}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={arc.color}
            strokeWidth={stroke}
            strokeDasharray={arc.dasharray}
            strokeDashoffset={arc.dashoffset}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        ))}
      </svg>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.text.primary,
            fontSize: "18px",
            fontWeight: 700,
            lineHeight: 1.1,
          })}
        >
          {total}
        </Typography>
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.text.secondary,
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          })}
        >
          Orders
        </Typography>
      </Box>
    </Box>
  );
}

export function OrderOverviewSection({
  statusSlices,
  typeSlices,
}: {
  statusSlices: readonly OrderStatusSlice[];
  typeSlices: readonly OrderTypeSlice[];
}) {
  const total = statusSlices.reduce((sum, slice) => sum + slice.count, 0);
  const maxType = Math.max(...typeSlices.map((slice) => slice.count), 1);

  return (
    <DashboardSectionCard title="Order Status">
      {total === 0 ? (
        <DashboardEmptyState message="No order data available." />
      ) : (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <DonutChart slices={statusSlices} />
          <Stack spacing={0.65} sx={{ flex: 1, minWidth: 0 }}>
            {statusSlices.map((slice) => (
              <Stack
                key={slice.key}
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between" }}
              >
                <Stack direction="row" spacing={0.85} sx={{ alignItems: "center", minWidth: 0 }}>
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "2px",
                      backgroundColor: slice.color,
                      flexShrink: 0,
                    }}
                  />
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
                    {slice.label}
                  </Typography>
                </Stack>
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.primary,
                    fontSize: portalTypography.emphasis.fontSize,
                    fontWeight: 700,
                    lineHeight: 1.25,
                  })}
                >
                  {slice.count}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      )}

      <Box
        sx={(theme) => ({
          mt: 1.75,
          pt: 1.25,
          borderTop: `1px solid ${theme.customTokens.borders.divider}`,
        })}
      >
        <Typography
          sx={(theme) => ({
            mb: 1,
            color: theme.customTokens.neutrals[800],
            fontSize: portalTypography.formLabel.fontSize,
            fontWeight: 700,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          })}
        >
          Order Type
        </Typography>
        <Stack spacing={1}>
          {typeSlices.map((slice) => (
            <Box key={slice.key}>
              <Stack
                direction="row"
                sx={{
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 0.4,
                }}
              >
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.secondary,
                    fontSize: portalTypography.helper.fontSize,
                    fontWeight: 500,
                  })}
                >
                  {slice.label}
                </Typography>
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.primary,
                    fontSize: portalTypography.emphasis.fontSize,
                    fontWeight: 700,
                  })}
                >
                  {slice.count}
                </Typography>
              </Stack>
              <Box
                sx={(theme) => ({
                  height: 6,
                  borderRadius: "3px",
                  backgroundColor: theme.customTokens.surfaces.paper,
                  overflow: "hidden",
                })}
              >
                <Box
                  sx={(theme) => ({
                    height: "100%",
                    width: `${Math.max((slice.count / maxType) * 100, slice.count > 0 ? 8 : 0)}%`,
                    borderRadius: "3px",
                    backgroundColor:
                      slice.key === "raw"
                        ? theme.customTokens.brand.primary
                        : theme.customTokens.brand.secondary,
                  })}
                />
              </Box>
            </Box>
          ))}
        </Stack>
      </Box>
    </DashboardSectionCard>
  );
}
