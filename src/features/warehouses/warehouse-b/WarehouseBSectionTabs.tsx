import { Stack } from "@mui/material";
import type { SetURLSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import type { InventoryProcessTab } from "../../inventory/shared/inventoryUtils";
import type { WarehouseBRawVeneerTab } from "../shared/warehouseTableData";

export type WarehouseBSection = "inspection" | "inventory";
export type WarehouseBInventorySlug =
  | "mdf"
  | "plywood"
  | "raw-veneer"
  | "veneer-blocks";
export type WarehouseBInspectionTab = "pending" | "done";

const warehouseBInventoryTabs = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
] as const satisfies readonly {
  label: string;
  value: WarehouseBInventorySlug;
}[];

const warehouseBProcessTabs = [
  { label: "Inventory", value: "issued" },
  { label: "History", value: "history" },
] as const satisfies readonly {
  label: string;
  value: InventoryProcessTab;
}[];

const warehouseBInspectionTabs = [
  { label: "Inspection Pending", value: "pending" },
  { label: "Inspection Done", value: "done" },
] as const satisfies readonly {
  label: string;
  value: WarehouseBInspectionTab;
}[];

export function WarehouseBSectionTabs({
  activeInventory,
  activeInspectionTab,
  activeProcessTab,
  activeRawVeneerTab,
  activeSection,
  setSearchParams,
}: {
  activeInventory: WarehouseBInventorySlug;
  activeInspectionTab: WarehouseBInspectionTab;
  activeProcessTab: InventoryProcessTab;
  activeRawVeneerTab: WarehouseBRawVeneerTab;
  activeSection: WarehouseBSection;
  setSearchParams: SetURLSearchParams;
}) {
  if (activeSection === "inspection") {
    return (
      <ModuleProcessTabs
        onChange={(value) => {
          setSearchParams(
            {
              section: "inspection",
              ...(value === "pending" ? {} : { inspection: value }),
            },
            { replace: true },
          );
        }}
        tabs={warehouseBInspectionTabs}
        value={activeInspectionTab}
      />
    );
  }

  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(0),
      })}
    >
      <ModuleProcessTabs
        onChange={(value) => {
          setSearchParams(
            value === "raw-veneer"
              ? {
                  section: "inventory",
                  inventory: value,
                  ...(activeProcessTab === "history" ? { tab: "history" } : {}),
                }
              : {
                  section: "inventory",
                  inventory: value,
                  ...(activeProcessTab === "history" ? { tab: "history" } : {}),
                },
            { replace: true },
          );
        }}
        tabs={warehouseBInventoryTabs}
        value={activeInventory}
      />

      <ModuleProcessTabs
        onChange={(value) => {
          setSearchParams(
            activeInventory === "raw-veneer"
              ? {
                  section: "inventory",
                  inventory: activeInventory,
                  ...(activeRawVeneerTab === "all"
                    ? {}
                    : { rawTab: activeRawVeneerTab }),
                  ...(value === "history" ? { tab: value } : {}),
                }
              : {
                  section: "inventory",
                  inventory: activeInventory,
                  ...(value === "history" ? { tab: value } : {}),
                },
            { replace: true },
          );
        }}
        tabs={warehouseBProcessTabs}
        value={activeProcessTab}
      />
    </Stack>
  );
}
