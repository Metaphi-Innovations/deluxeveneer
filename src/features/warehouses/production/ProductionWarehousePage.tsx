import { useCallback, useMemo, useState } from "react";
import { FileOutput, Plus } from "lucide-react";
import { Button, Stack } from "@mui/material";
import { useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { getListingToolbarOutlinedButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";
import { useDebouncedValue } from "../../../query/useDebouncedValue";
import {
  getOrderLineItems,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import {
  IssueOrderDialog,
  type IssueOrderValues,
} from "../shared/IssueOrderDialog";

import {
  productionWarehouseTabs,
  rawVeneerColumns,
  plywoodColumns,
  mdfColumns,
  consumablesColumns,
  sawingColumns,
  sampleSheetColumns,
  type ProductionWarehouseTabSlug,
  type SampleSheetTableRow,
  type SawingRow,
} from "../production/types/productionWarehouseTypes";
import { RawVeneerTab } from "../production/tabs/RawVeneerTab";
import { PlywoodTab } from "../production/tabs/PlywoodTab";
import { MdfTab } from "../production/tabs/MdfTab";
import { ConsumablesTab } from "../production/tabs/ConsumablesTab";
import { SawingTab } from "../production/tabs/SawingTab";
import { SampleSheetsTab } from "../production/tabs/SampleSheetsTab";
import { getFactoryIssuedWorkItems } from "../../factory/shared/factoryIssuedWorkStore";
import {
  exportProductionInventoryApi,
  issueOrderToProduction,
  type ProductionInventoryItem,
} from "../production/api/productionWarehouseApi";
import {
  groupingIssuedLeavesBySource,
  withGroupingAvailability,
} from "./rawVeneerGroupingQuantity";
import { invalidateWarehouseProduction } from "../../../query/queryClient";
import {
  EMPTY_PRODUCTION_LIST_QUERY,
  type ProductionListQueryState,
} from "../production/productionListQuery";

export interface ProductionWarehousePageProps {
  warehouseId?: string | undefined;
  warehouseName?: string;
  warehouseRootPath?: string | undefined;
}

export function ProductionWarehousePage({
  warehouseId,
  warehouseName = "Warehouse C",
}: ProductionWarehousePageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 450);
  const [issueOrderDialogOpen, setIssueOrderDialogOpen] = useState(false);
  const [issueOrderValues, setIssueOrderValues] = useState<IssueOrderValues>({
    orderItemNo: "",
    orderNo: "",
  });
  const [listQuery, setListQuery] = useState<ProductionListQueryState>(
    EMPTY_PRODUCTION_LIST_QUERY,
  );
  const [currentSampleRows, setCurrentSampleRows] = useState<
    SampleSheetTableRow[]
  >([]);
  const [currentSawingRows, setCurrentSawingRows] = useState<SawingRow[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const activeInventory = getActiveTab(searchParams.get("inventory"));
  const isSampleSheetsTab = activeInventory === "sample-sheets";
  const isSawingTab = activeInventory === "sawing";

  const warehousePermissionKey = warehouseId
    ? getDynamicWarehousePermissionKey(warehouseId)
    : "warehouseC";
  const canEditWarehouseC = canAccessPermission(warehousePermissionKey, "edit");
  const canViewWarehouseC = canAccessPermission(warehousePermissionKey, "view");

  const orderRecords = useOrderRecords();
  const rawOrderRecords = useMemo(
    () => orderRecords.filter(isRawOrderRecord),
    [orderRecords],
  );

  const issueOrderNoOptions = useMemo(
    () =>
      rawOrderRecords
        .filter((record) => getOrderLineItems(record.id).length > 0)
        .map((record) => record.orderNo),
    [rawOrderRecords],
  );

  const selectedIssueOrder = useMemo(
    () =>
      rawOrderRecords.find(
        (record) => record.orderNo === issueOrderValues.orderNo,
      ) ?? null,
    [issueOrderValues.orderNo, rawOrderRecords],
  );

  const issueOrderItemNoOptions = useMemo(
    () =>
      selectedIssueOrder
        ? getOrderLineItems(selectedIssueOrder.id).map((_, index) =>
            String(index + 1),
          )
        : [],
    [selectedIssueOrder],
  );

  const showIssueOrderButton = !isSampleSheetsTab && canEditWarehouseC;

  const handleOpenIssueOrderDialog = () => {
    setIssueOrderValues({ orderItemNo: "", orderNo: "" });
    setIssueOrderDialogOpen(true);
  };

  const handleSubmitIssueOrder = async () => {
    if (!issueOrderValues.orderNo || !issueOrderValues.orderItemNo) {
      return;
    }

    // Sawing inventory is frontend-only for now — close modal without API.
    if (!isSawingTab) {
      try {
        await issueOrderToProduction({
          orderNo: issueOrderValues.orderNo,
          orderItemNo: issueOrderValues.orderItemNo,
          warehouseId,
          inventoryType: activeInventory,
        });
        void invalidateWarehouseProduction();
      } catch {
        // Issue-order API failed; dialog still closes after attempt.
      }
    }

    setIssueOrderDialogOpen(false);
  };

  const handleListQueryChange = useCallback((query: ProductionListQueryState) => {
    setListQuery(query);
  }, []);

  const handleExport = async () => {
    if (isSampleSheetsTab) {
      exportRowsToCsv(
        currentSampleRows,
        sampleSheetColumns,
        `${warehouseName}-sample-sheets`,
      );
      return;
    }

    if (isSawingTab) {
      exportRowsToCsv(
        currentSawingRows,
        sawingColumns,
        `${warehouseName}-sawing`,
      );
      return;
    }

    if (!warehouseId || isExporting) return;

    const tab =
      activeInventory === "plywood" ||
      activeInventory === "mdf" ||
      activeInventory === "consumables"
        ? activeInventory
        : "raw-veneer";

    setIsExporting(true);
    try {
      const items = await exportProductionInventoryApi({
        warehouseId,
        tab,
        ...(debouncedSearchValue.trim()
          ? { search: debouncedSearchValue.trim() }
          : {}),
        ...(listQuery.sortBy ? { sortBy: listQuery.sortBy } : {}),
        ...(listQuery.sortOrder ? { sortOrder: listQuery.sortOrder } : {}),
        ...(Object.keys(listQuery.filters).length > 0
          ? { filters: listQuery.filters }
          : {}),
      });

      if (items.length === 0) {
        alert("No records to export.");
        return;
      }

      const issuedLeavesByRowId = groupingIssuedLeavesBySource(
        getFactoryIssuedWorkItems(),
        warehouseName,
      );
      const rows = items.map((item) =>
        mapExportItem(item, issuedLeavesByRowId),
      ) as Array<Record<string, string | Date>>;
      if (tab === "plywood") {
        exportRowsToCsv(rows, plywoodColumns, `${warehouseName}-plywood`);
      } else if (tab === "mdf") {
        exportRowsToCsv(rows, mdfColumns, `${warehouseName}-mdf`);
      } else if (tab === "consumables") {
        exportRowsToCsv(
          rows,
          consumablesColumns,
          `${warehouseName}-consumables`,
        );
      } else {
        exportRowsToCsv(rows, rawVeneerColumns, `${warehouseName}-raw-veneer`);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Failed to export production inventory.",
      );
    } finally {
      setIsExporting(false);
    }
  };

  const exportDisabled = useMemo(() => {
    if (isExporting) return true;
    if (isSampleSheetsTab) return currentSampleRows.length === 0;
    if (isSawingTab) return currentSawingRows.length === 0;
    return !warehouseId || listQuery.totalCount === 0;
  }, [
    isExporting,
    isSampleSheetsTab,
    isSawingTab,
    currentSampleRows.length,
    currentSawingRows.length,
    warehouseId,
    listQuery.totalCount,
  ]);

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: warehouseName },
        { label: "Inventory" },
        {
          label:
            productionWarehouseTabs.find((t) => t.value === activeInventory)
              ?.label ?? "Raw Veneer",
        },
      ]}
      subtitle={
        isSampleSheetsTab
          ? " "
          : ""
      }
      title={warehouseName}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <ModuleProcessTabs
          onChange={(value) => {
            setListQuery(EMPTY_PRODUCTION_LIST_QUERY);
            setSearchParams(
              {
                section: "inventory",
                inventory: value,
              },
              { replace: true },
            );
          }}
          tabs={productionWarehouseTabs}
          value={activeInventory}
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
            placeholder={
              isSampleSheetsTab
                ? "Search sample sheets..."
                : "Search inventory..."
            }
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: "100%",
            }}
          />

          <Stack direction="row" spacing={1.25} alignItems="center">
            {showIssueOrderButton ? (
              <Button
                variant="contained"
                startIcon={<Plus size={15} />}
                onClick={handleOpenIssueOrderDialog}
                sx={(theme) => ({
                  ...getListingToolbarOutlinedButtonSx(theme),
                  backgroundColor: theme.palette.primary.main,
                  color: theme.palette.primary.contrastText,
                })}
              >
                Issue Order
              </Button>
            ) : null}

            <Button
              variant="outlined"
              startIcon={<FileOutput size={15} />}
              disabled={exportDisabled}
              onClick={() => void handleExport()}
              sx={(theme) => ({
                ...getListingToolbarOutlinedButtonSx(theme),
                alignSelf: "center",
              })}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </Stack>
        </Stack>

        {activeInventory === "raw-veneer" && (
          <RawVeneerTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onListQueryChange={handleListQueryChange}
            searchValue={debouncedSearchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "plywood" && (
          <PlywoodTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onListQueryChange={handleListQueryChange}
            searchValue={debouncedSearchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "mdf" && (
          <MdfTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onListQueryChange={handleListQueryChange}
            searchValue={debouncedSearchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "consumables" && (
          <ConsumablesTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onListQueryChange={handleListQueryChange}
            searchValue={debouncedSearchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "sawing" && (
          <SawingTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onExportReady={setCurrentSawingRows}
            searchValue={debouncedSearchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "sample-sheets" && (
          <SampleSheetsTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onExportReady={setCurrentSampleRows}
            searchValue={debouncedSearchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}
      </Stack>

      <IssueOrderDialog
        itemNoOptions={issueOrderItemNoOptions}
        onChange={setIssueOrderValues}
        onClose={() => setIssueOrderDialogOpen(false)}
        onSubmit={handleSubmitIssueOrder}
        open={issueOrderDialogOpen}
        orderNoOptions={issueOrderNoOptions}
        values={issueOrderValues}
      />
    </MasterPageShell>
  );
}

function mapExportItem(
  item: ProductionInventoryItem,
  issuedLeavesByRowId: ReadonlyMap<string, number>,
) {
  const row = {
    id: String(item.id),
    productionSrNo: String(item.productionSrNo ?? ""),
    storageSrNo: String(item.storageSrNo ?? ""),
    inwardDate: item.inwardDate,
    inwardItemCode: String(item.inwardItemCode ?? ""),
    itemName: String(item.itemName ?? ""),
    factoryCode: String(item.factoryCode ?? ""),
    subCategory: String(item.subCategory ?? ""),
    color: String(item.color ?? ""),
    mdfType: String(item.mdfType ?? ""),
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? ""),
    noOfLeaves: String(item.noOfLeaves ?? ""),
    noOfSheets: String(item.noOfSheets ?? item.totalNoOfSheets ?? ""),
    receivedQuantity: String(
      item.receivedQuantity ?? item.noOfSheets ?? item.totalNoOfSheets ?? "",
    ),
    availableQuantity: String(
      item.availableQuantity ?? item.noOfSheets ?? item.totalNoOfSheets ?? "",
    ),
    sqm: String(item.sqm ?? item.totalSqm ?? ""),
    sqf: String(item.sqf ?? item.totalSqf ?? ""),
    grade: String(item.grade ?? ""),
    currency: String(item.currency ?? ""),
    amount: String(item.amount ?? ""),
    totalAmount: String(item.totalAmount ?? item.amount ?? ""),
    remark: String(item.remark ?? ""),
    updatedBy: String(item.updatedBy ?? ""),
  };
  return withGroupingAvailability(row, issuedLeavesByRowId);
}

function getActiveTab(value: string | null): ProductionWarehouseTabSlug {
  if (
    value === "plywood" ||
    value === "mdf" ||
    value === "consumables" ||
    value === "sawing" ||
    value === "sample-sheets"
  ) {
    return value;
  }
  return "raw-veneer";
}

function isRawOrderRecord(record: OrderRecord) {
  return record.orderType.trim().toLowerCase().includes("raw");
}
