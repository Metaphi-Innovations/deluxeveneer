import { Box, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import { portalTypography } from "../../../theme/typography";
import type { WarehouseSnapshotRow } from "../shared/dashboardTypes";
import { DashboardSectionCard } from "./DashboardSectionCard";
import { DashboardEmptyState } from "./DashboardStates";

export function WarehouseSnapshotSection({
  rows,
}: {
  rows: readonly WarehouseSnapshotRow[];
}) {
  const navigate = useNavigate();

  return (
    <DashboardSectionCard title="Warehouse Snapshot">
      {rows.length === 0 ? (
        <DashboardEmptyState message="No warehouse data available." />
      ) : (
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "7px",
            overflow: "hidden",
          })}
        >
          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))",
              gap: 1,
              px: 1.25,
              py: 0.75,
              backgroundColor: theme.customTokens.surfaces.paper,
              borderBottom: `1px solid ${theme.customTokens.borders.default}`,
            })}
          >
            {["Warehouse", "Stock Items", "Available", "QC Pending"].map(
              (label) => (
                <Typography
                  key={label}
                  sx={(theme) => ({
                    color: theme.customTokens.text.secondary,
                    fontSize: "11px",
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    textTransform: "uppercase",
                    textAlign: label === "Warehouse" ? "left" : "right",
                  })}
                >
                  {label}
                </Typography>
              ),
            )}
          </Box>

          {rows.map((row, index) => (
            <Box
              key={row.id}
              component="button"
              type="button"
              onClick={() => navigate(row.href)}
              sx={(theme) => ({
                appearance: "none",
                width: "100%",
                display: "grid",
                gridTemplateColumns:
                  "minmax(0, 1.4fr) repeat(3, minmax(0, 1fr))",
                gap: 1,
                alignItems: "center",
                px: 1.25,
                py: 0.95,
                border: "none",
                borderBottom:
                  index < rows.length - 1
                    ? `1px solid ${theme.customTokens.borders.divider}`
                    : "none",
                backgroundColor: theme.customTokens.surfaces.surface,
                cursor: "pointer",
                textAlign: "left",
                transition: "background-color 120ms ease",
                "&:hover": {
                  backgroundColor: theme.customTokens.surfaces.alt,
                },
                "&:focus-visible": {
                  outline: `2px solid ${theme.customTokens.brand.primary}`,
                  outlineOffset: -2,
                },
              })}
            >
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.primary,
                  fontSize: portalTypography.body.fontSize,
                  fontWeight: 600,
                  lineHeight: 1.3,
                })}
              >
                {row.name}
              </Typography>
              {[row.stockItems, row.available, row.qcPending].map(
                (value, valueIndex) => (
                  <Typography
                    key={`${row.id}-${valueIndex}`}
                    sx={(theme) => ({
                      color: theme.customTokens.text.primary,
                      fontSize: portalTypography.emphasis.fontSize,
                      fontWeight: 700,
                      lineHeight: 1.3,
                      textAlign: "right",
                    })}
                  >
                    {value}
                  </Typography>
                ),
              )}
            </Box>
          ))}
        </Box>
      )}
    </DashboardSectionCard>
  );
}
