import { useMemo, useState } from "react";
import { FileOutput, Plus } from "lucide-react";
import { Button, Stack } from "@mui/material";
import { useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { getListingToolbarOutlinedButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
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
  sampleSheetColumns,
  type ProductionWarehouseTabSlug,
  type RawVeneerRow,
  type PlywoodRow,
  type MdfRow,
  type SampleSheetTableRow,
} from "../production/types/productionWarehouseTypes";
import { RawVeneerTab } from "../production/tabs/RawVeneerTab";
import { PlywoodTab } from "../production/tabs/PlywoodTab";
import { MdfTab } from "../production/tabs/MdfTab";
import { SampleSheetsTab } from "../production/tabs/SampleSheetsTab";
import { issueOrderToProduction } from "../production/api/productionWarehouseApi";

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
  const [issueOrderDialogOpen, setIssueOrderDialogOpen] = useState(false);
  const [issueOrderValues, setIssueOrderValues] = useState<IssueOrderValues>({
    orderItemNo: "",
    orderNo: "",
  });

  const [currentRawRows, setCurrentRawRows] = useState<RawVeneerRow[]>([]);
  const [currentPlywoodRows, setCurrentPlywoodRows] = useState<PlywoodRow[]>([]);
  const [currentMdfRows, setCurrentMdfRows] = useState<MdfRow[]>([]);
  const [currentSampleRows, setCurrentSampleRows] = useState<SampleSheetTableRow[]>([]);

  const activeInventory = getActiveTab(searchParams.get("inventory"));
  const isSampleSheetsTab = activeInventory === "sample-sheets";

  const canEditWarehouseC = canAccessPermission("warehouseC", "edit");
  const canViewWarehouseC = canAccessPermission("warehouseC", "view");

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

    try {
      await issueOrderToProduction({
        orderNo: issueOrderValues.orderNo,
        orderItemNo: issueOrderValues.orderItemNo,
        warehouseId,
        inventoryType: activeInventory,
      });
    } catch {
      // Issue-order API failed; dialog still closes after attempt.
    }

    setIssueOrderDialogOpen(false);
  };

  const handleExport = () => {
    if (activeInventory === "raw-veneer") {
      exportRowsToCsv(currentRawRows, rawVeneerColumns, `${warehouseName}-raw-veneer`);
    } else if (activeInventory === "plywood") {
      exportRowsToCsv(currentPlywoodRows, plywoodColumns, `${warehouseName}-plywood`);
    } else if (activeInventory === "mdf") {
      exportRowsToCsv(currentMdfRows, mdfColumns, `${warehouseName}-mdf`);
    } else if (activeInventory === "sample-sheets") {
      exportRowsToCsv(currentSampleRows, sampleSheetColumns, `${warehouseName}-sample-sheets`);
    }
  };

  const exportDisabled = useMemo(() => {
    if (activeInventory === "raw-veneer") return currentRawRows.length === 0;
    if (activeInventory === "plywood") return currentPlywoodRows.length === 0;
    if (activeInventory === "mdf") return currentMdfRows.length === 0;
    if (activeInventory === "sample-sheets") return currentSampleRows.length === 0;
    return true;
  }, [activeInventory, currentRawRows, currentPlywoodRows, currentMdfRows, currentSampleRows]);

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: warehouseName },
        { label: "Inventory" },
        {
          label:
            productionWarehouseTabs.find((t) => t.value === activeInventory)?.label ??
            "Raw Veneer",
        },
      ]}
      subtitle={
        isSampleSheetsTab
          ? "Master tracking for sample material moving through Factory processes."
          : "Processed stock ready for Factory and fulfilment."
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
              isSampleSheetsTab ? "Search sample sheets..." : "Search inventory..."
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
              onClick={handleExport}
              sx={(theme) => ({
                ...getListingToolbarOutlinedButtonSx(theme),
                alignSelf: "center",
              })}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {activeInventory === "raw-veneer" && (
          <RawVeneerTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onExportReady={setCurrentRawRows}
            searchValue={searchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "plywood" && (
          <PlywoodTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onExportReady={setCurrentPlywoodRows}
            searchValue={searchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "mdf" && (
          <MdfTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onExportReady={setCurrentMdfRows}
            searchValue={searchValue}
            warehouseId={warehouseId}
            warehouseName={warehouseName}
          />
        )}

        {activeInventory === "sample-sheets" && (
          <SampleSheetsTab
            canEdit={canEditWarehouseC}
            canView={canViewWarehouseC}
            onExportReady={setCurrentSampleRows}
            searchValue={searchValue}
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

function getActiveTab(value: string | null): ProductionWarehouseTabSlug {
  if (value === "plywood" || value === "mdf" || value === "sample-sheets") {
    return value;
  }
  return "raw-veneer";
}

function isRawOrderRecord(record: OrderRecord) {
  return record.orderType.trim().toLowerCase().includes("raw");
}
