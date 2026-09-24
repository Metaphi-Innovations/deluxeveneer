import { useMemo, useState } from "react";
import { FileOutput } from "lucide-react";
import { Button, Stack } from "@mui/material";
import { useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";
import {
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { StorageMdfInventory } from "../storage/StorageMdfInventory";
import { StoragePlywoodInventory } from "../storage/StoragePlywoodInventory";
import { StorageRawVeneerInventory } from "../storage/StorageRawVeneerInventory";
import { StorageVeneerBlocksInventory } from "../storage/StorageVeneerBlocksInventory";
import {
  STORAGE_INVENTORY_TABS,
  STORAGE_SECTION_TABS,
  getActiveStorageInventoryTab,
  getActiveStorageSectionTab,
  type StorageInventoryTab,
  type StorageSectionTab,
} from "../storage/types";

interface StorageWarehousePageProps {
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
}

export function StorageWarehousePage({
  warehouseId,
  warehouseName,
  warehouseRootPath,
}: StorageWarehousePageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");

  const activeInventory = getActiveStorageInventoryTab(
    searchParams.get("inventory"),
  );
  const activeSection = getActiveStorageSectionTab(searchParams.get("section"));

  const warehousePermissionKey = getDynamicWarehousePermissionKey(warehouseId);
  const canView = canAccessPermission(warehousePermissionKey, "view");

  const panelProps = useMemo(
    () => ({
      warehouseId,
      warehouseName,
      warehouseRootPath,
      section: activeSection,
    }),
    [activeSection, warehouseId, warehouseName, warehouseRootPath],
  );

  const updateParams = (next: {
    inventory?: StorageInventoryTab;
    section?: StorageSectionTab;
  }) => {
    const params: Record<string, string> = {
      inventory: next.inventory ?? activeInventory,
      section: next.section ?? activeSection,
    };
    setSearchParams(params, { replace: true });
  };

  if (!canView) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: warehouseName },
        ]}
        subtitle="Storage warehouse"
        title={warehouseName}
      >
        <Stack sx={{ py: 2 }}>
          You do not have permission to view this warehouse.
        </Stack>
      </MasterPageShell>
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Warehouses" },
        { label: warehouseName },
      ]}
      subtitle="Main inventory storage and inspection."
      title={warehouseName}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <ModuleProcessTabs
          onChange={(value) => {
            updateParams({ inventory: value });
            setSearchValue("");
          }}
          tabs={STORAGE_INVENTORY_TABS}
          value={activeInventory}
        />

        <ModuleProcessTabs
          onChange={(value) => {
            updateParams({ section: value });
            setSearchValue("");
          }}
          tabs={STORAGE_SECTION_TABS}
          value={activeSection}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <ClearableSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search inventory..."
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: "100%",
            }}
          />

          <Stack
            direction="row"
            spacing={portalButtonGroupGap}
            useFlexGap
            sx={{
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              startIcon={<FileOutput size={15} />}
              disabled
              sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {activeInventory === "veneer-blocks" ? (
          <StorageVeneerBlocksInventory {...panelProps} />
        ) : null}
        {activeInventory === "raw-veneer" ? (
          <StorageRawVeneerInventory {...panelProps} />
        ) : null}
        {activeInventory === "plywood" ? (
          <StoragePlywoodInventory {...panelProps} />
        ) : null}
        {activeInventory === "mdf" ? (
          <StorageMdfInventory {...panelProps} />
        ) : null}
      </Stack>
    </MasterPageShell>
  );
}
