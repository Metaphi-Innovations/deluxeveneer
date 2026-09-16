import { Box, Stack } from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { portalControlHeights } from "../../../theme/typography";
import {
  DASHBOARD_DATE_OPTIONS,
  DASHBOARD_WAREHOUSE_OPTIONS,
} from "../shared/dashboardData";
import type {
  DashboardDatePeriod,
  DashboardWarehouseFilter,
} from "../shared/dashboardTypes";

type DashboardFiltersProps = {
  period: DashboardDatePeriod;
  warehouse: DashboardWarehouseFilter;
  onPeriodChange: (value: DashboardDatePeriod) => void;
  onWarehouseChange: (value: DashboardWarehouseFilter) => void;
  disabled?: boolean;
};

export function DashboardFilters({
  period,
  warehouse,
  onPeriodChange,
  onWarehouseChange,
  disabled = false,
}: DashboardFiltersProps) {
  const periodLabel =
    DASHBOARD_DATE_OPTIONS.find((option) => option.value === period)?.label ??
    "Today";
  const warehouseLabel =
    DASHBOARD_WAREHOUSE_OPTIONS.find((option) => option.value === warehouse)
      ?.label ?? "All Warehouses";

  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: "center",
        flexWrap: "wrap",
        justifyContent: "flex-end",
      }}
    >
      <Box sx={{ width: { xs: "100%", sm: 148 } }}>
        <ErpSelectField
          controlHeight={portalControlHeights.dense}
          controlRadius={7}
          options={DASHBOARD_DATE_OPTIONS.map((option) => option.label)}
          searchable={false}
          size="dense"
          state={disabled ? "disabled" : "default"}
          value={periodLabel}
          onChange={(next) => {
            const matched = DASHBOARD_DATE_OPTIONS.find(
              (option) => option.label === next,
            );
            if (matched) {
              onPeriodChange(matched.value);
            }
          }}
        />
      </Box>
      <Box sx={{ width: { xs: "100%", sm: 168 } }}>
        <ErpSelectField
          controlHeight={portalControlHeights.dense}
          controlRadius={7}
          options={DASHBOARD_WAREHOUSE_OPTIONS.map((option) => option.label)}
          searchable={false}
          size="dense"
          state={disabled ? "disabled" : "default"}
          value={warehouseLabel}
          onChange={(next) => {
            const matched = DASHBOARD_WAREHOUSE_OPTIONS.find(
              (option) => option.label === next,
            );
            if (matched) {
              onWarehouseChange(matched.value);
            }
          }}
        />
      </Box>
    </Stack>
  );
}
