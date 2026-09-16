import { useMemo, useState } from "react";
import { Alert, Box, Stack } from "@mui/material";
import { LayoutDashboard } from "lucide-react";

import { MasterPageShell } from "../../masters/shared";
import { AttentionRequiredSection } from "../components/AttentionRequiredSection";
import { DashboardFilters } from "../components/DashboardFilters";
import { DashboardKpiRow } from "../components/DashboardKpiRow";
import { FactoryPipelineSection } from "../components/FactoryPipelineSection";
import { OrderOverviewSection } from "../components/OrderOverviewSection";
import { RecentActivitySection } from "../components/RecentActivitySection";
import { WarehouseSnapshotSection } from "../components/WarehouseSnapshotSection";
import {
  buildDashboardMetrics,
  useDashboardSourceRecords,
} from "../shared/dashboardData";
import type {
  DashboardDatePeriod,
  DashboardWarehouseFilter,
} from "../shared/dashboardTypes";

export function DashboardPage() {
  const [period, setPeriod] = useState<DashboardDatePeriod>("today");
  const [warehouse, setWarehouse] =
    useState<DashboardWarehouseFilter>("all");

  const { orders, packing } = useDashboardSourceRecords();

  const { metrics, error } = useMemo(() => {
    try {
      return {
        metrics: buildDashboardMetrics(orders, packing, { period, warehouse }),
        error: null as string | null,
      };
    } catch (cause) {
      return {
        metrics: null,
        error:
          cause instanceof Error
            ? cause.message
            : "Unable to load dashboard metrics.",
      };
    }
  }, [orders, packing, period, warehouse]);

  return (
    <MasterPageShell
      actions={
        <DashboardFilters
          period={period}
          warehouse={warehouse}
          onPeriodChange={setPeriod}
          onWarehouseChange={setWarehouse}
        />
      }
      contentGap={1.5}
      icon={LayoutDashboard}
      subtitle="Operational overview of orders, production, packing and dispatch."
      title="Dashboard"
    >
      <Stack spacing={1.5}>
        {error ? (
          <Alert
            severity="error"
            sx={(theme) => ({
              borderRadius: "8px",
              border: `1px solid ${theme.customTokens.borders.default}`,
              py: 0.5,
            })}
          >
            {error}
          </Alert>
        ) : null}

        {metrics ? (
          <>
            <DashboardKpiRow kpis={metrics.kpis} />
            <FactoryPipelineSection stages={metrics.pipeline} />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(0, 1.15fr) minmax(0, 0.85fr)",
                },
                gap: 1.5,
                alignItems: "stretch",
              }}
            >
              <OrderOverviewSection
                statusSlices={metrics.orderStatus}
                typeSlices={metrics.orderTypes}
              />
              <AttentionRequiredSection items={metrics.attention} />
            </Box>
            <WarehouseSnapshotSection rows={metrics.warehouses} />
            <RecentActivitySection items={metrics.activity} />
          </>
        ) : null}
      </Stack>
    </MasterPageShell>
  );
}
