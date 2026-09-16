import { useMemo, useState } from "react";
import { Eye, FileOutput, Pencil, Plus } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
  type EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import {
  getSampleSheetByNo,
  isSampleEligibleForOrder,
  resolveSampleFinishedType,
  useSampleSheetRecords,
  type SampleSheetRecord,
} from "../../factory/shared/sampleSheetIdentityStore";
import {
  issueFactoryWork,
  useFactoryIssuedWorkItems,
} from "../../factory/shared/factoryIssuedWorkStore";
import type { FactoryRecord } from "../../factory/shared/types";
import { useWarehouseCMovedRows } from "../shared/warehouseCTransferStore";
import { getInventoryPaths } from "../../inventory/shared";
import {
  getOrderLineItems,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import {
  getListingToolbarOutlinedButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  warehouseCInventoryConfigs,
  type WarehouseCInventorySlug,
  type WarehouseInventoryRow,
} from "../shared/warehouseTableData";
import {
  IssueOrderDialog,
  type IssueOrderValues,
} from "../shared/IssueOrderDialog";

type WarehouseCTabSlug = WarehouseCInventorySlug | "sample-sheets";

type SampleSheetTableRow = EnterpriseTableRow & {
  availableQuantity: string;
  color: string;
  currentStage: string;
  currentStatus: string;
  issueDate: Date;
  itemName: string;
  length: string;
  processRoute: string;
  sampleNo: string;
  subCategory: string;
  thickness: string;
  width: string;
};

const warehouseCInventoryTabs = [
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
  { label: "Sample Sheets", value: "sample-sheets" },
] as const satisfies readonly {
  label: string;
  value: WarehouseCTabSlug;
}[];

const sampleSheetColumns: readonly EnterpriseTableColumn<SampleSheetTableRow>[] = [
  { key: "sampleNo", label: "Sample No." },
  { key: "issueDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "availableQuantity", label: "No. of Leaves / Quantity" },
  { key: "processRoute", label: "Process Route / Type" },
  { key: "currentStage", label: "Current Stage" },
  { key: "currentStatus", label: "Current Status" },
];

export function WarehouseCInventoryPage() {
  return <WarehouseCInventoryModulePage />;
}

interface WarehouseCInventoryModulePageProps {
  warehouseName?: string;
}

export function WarehouseCInventoryModulePage({
  warehouseName = "Warehouse C",
}: WarehouseCInventoryModulePageProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [issueOrderDialogOpen, setIssueOrderDialogOpen] = useState(false);
  const [marquetryIssuedRowIds, setMarquetryIssuedRowIds] = useState<string[]>(
    [],
  );
  const [issueOrderValues, setIssueOrderValues] = useState<IssueOrderValues>({
    orderItemNo: "",
    orderNo: "",
  });
  const [journeySample, setJourneySample] = useState<SampleSheetRecord | null>(
    null,
  );
  const sampleRecords = useSampleSheetRecords();
  const movedWarehouseCRows = useWarehouseCMovedRows();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const activeInventory = getActiveWarehouseCInventory(
    searchParams.get("inventory"),
  );
  const isSampleSheetsTab = activeInventory === "sample-sheets";
  const activeInventoryConfig = isSampleSheetsTab
    ? null
    : warehouseCInventoryConfigs[activeInventory];
  const activeInventoryRows = useMemo(
    () =>
      activeInventory === "raw-veneer"
        ? [...(activeInventoryConfig?.rows ?? []), ...movedWarehouseCRows]
        : activeInventoryConfig?.rows ?? [],
    [activeInventory, activeInventoryConfig, movedWarehouseCRows],
  );
  const movedWarehouseRowIds = useMemo(
    () =>
      new Set(
        factoryIssuedWorkItems
          .filter((item) => item.sourceSlug === warehouseName)
          .map((item) => item.sourceRowId),
      ),
    [factoryIssuedWorkItems, warehouseName],
  );
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
  const showIssueOrderButton =
    !isSampleSheetsTab &&
    Boolean(activeInventoryConfig) &&
    canEditWarehouseC;

  const handleOpenIssueOrderDialog = () => {
    setIssueOrderValues({ orderItemNo: "", orderNo: "" });
    setIssueOrderDialogOpen(true);
  };

  const handleSubmitIssueOrder = () => {
    if (!issueOrderValues.orderNo || !issueOrderValues.orderItemNo) {
      return;
    }

    setIssueOrderDialogOpen(false);
  };

  const sampleRows = useMemo<readonly SampleSheetTableRow[]>(
    () =>
      sampleRecords.map((sample) => ({
        id: sample.sampleNo,
        sampleNo: sample.sampleNo,
        issueDate: new Date(sample.issueDate),
        itemName: sample.itemName,
        subCategory: sample.subCategory,
        color: sample.color,
        length: sample.length,
        width: sample.width,
        thickness: sample.thickness,
        availableQuantity: String(sample.availableSheets),
        processRoute: sample.processRoute,
        currentStage: sample.currentStage,
        currentStatus: sample.currentStatus,
      })),
    [sampleRecords],
  );

  const filteredInventoryRows = useMemo(() => {
    if (isSampleSheetsTab || !activeInventoryConfig) {
      return [];
    }

    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return activeInventoryRows.filter(
        (row) =>
          !marquetryIssuedRowIds.includes(row.id) &&
          !movedWarehouseRowIds.has(String(row.id)),
      );
    }

    return activeInventoryRows
      .filter(
        (row) =>
          !marquetryIssuedRowIds.includes(row.id) &&
          !movedWarehouseRowIds.has(String(row.id)),
      )
      .filter((row) =>
        Object.values(row).some((value) =>
          String(value ?? "").toLowerCase().includes(normalizedSearch),
        ),
      );
  }, [
    activeInventoryRows,
    activeInventoryConfig,
    isSampleSheetsTab,
    marquetryIssuedRowIds,
    movedWarehouseRowIds,
    searchValue,
  ]);

  const filteredSampleRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return sampleRows;
    }

    return sampleRows.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [sampleRows, searchValue]);

  const inventoryRowActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<WarehouseInventoryRow>>
  >(() => {
    const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [
      ...(canViewWarehouseC
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: WarehouseInventoryRow) =>
                navigate(
                  getInventoryPaths(row.inventorySlug, "issued", "warehouse-c").view(
                    row.inventoryRecordId,
                  ),
                ),
            },
          ]
        : []),
      ...(canEditWarehouseC
        ? [
            {
              id: "edit",
              label: "Edit",
              icon: Pencil,
              onSelect: (row: WarehouseInventoryRow) =>
                navigate(
                  getInventoryPaths(row.inventorySlug, "issued", "warehouse-c").edit(
                    row.inventoryRecordId,
                  ),
                ),
            },
          ]
        : []),
    ];

    if (activeInventory === "raw-veneer" && canEditWarehouseC) {
      actions.push({
        id: "issue-for-marquetry",
        label: "Issue for Marquetry",
        icon: Plus,
        tone: "primary",
        onSelect: (row) => {
          issueFactoryWork({
            destinationProcess: "Marquetry",
            sourceSlug: warehouseName,
            sourceProcess: "Inventory",
            sourceWarehouseName: warehouseName,
            sourceRow: {
              ...row,
              issuedFrom: "Inventory",
              issuedFor: "Marquetry",
              issuedDate: new Date(),
              warehouseName,
            } as FactoryRecord,
          });
          setMarquetryIssuedRowIds((current) =>
            current.includes(row.id) ? current : [...current, row.id],
          );
        },
      });
    }

    return actions;
  }, [
    activeInventory,
    canEditWarehouseC,
    canViewWarehouseC,
    navigate,
    warehouseName,
  ]);

  const sampleRowActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<SampleSheetTableRow>>
  >(() => {
    const actions: EnterpriseTableAction<SampleSheetTableRow>[] = [];

    if (canViewWarehouseC) {
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (row) => {
          const sample = getSampleSheetByNo(row.sampleNo);
          if (sample) {
            setJourneySample(sample);
          }
        },
      });
    }

    if (canEditWarehouseC) {
      actions.push({
        id: "issue-for-order",
        label: "Issue for Order",
        icon: Plus,
        tone: "primary",
        onSelect: (row) => {
          const sample = getSampleSheetByNo(row.sampleNo);
          if (!sample || !isSampleEligibleForOrder(sample)) {
            return;
          }

          navigate("/orders/add?type=finished", {
            state: {
              fromSampleSheet: true,
              sampleNo: sample.sampleNo,
              finishedType: resolveSampleFinishedType(sample),
              lineItemDraft: {
                itemName: sample.itemName,
                subCategory: sample.subCategory,
                color: sample.color,
                length: sample.length,
                width: sample.width,
                thickness: sample.thickness,
                quantitySheets: String(sample.availableSheets),
                finishedType: resolveSampleFinishedType(sample),
                remark: `From Sample ${sample.sampleNo}`,
              },
            },
          });
        },
      });
    }

    return actions;
  }, [canEditWarehouseC, canViewWarehouseC, navigate]);

  const title = isSampleSheetsTab
    ? "Sample Sheets"
    : activeInventoryConfig?.title ?? "Inventory";

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: warehouseName },
        { label: "Inventory" },
        { label: title },
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
          tabs={warehouseCInventoryTabs}
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
              disabled={
                isSampleSheetsTab
                  ? filteredSampleRows.length === 0
                  : filteredInventoryRows.length === 0
              }
              onClick={() => {
                if (isSampleSheetsTab) {
                  exportRowsToCsv(
                    filteredSampleRows,
                    sampleSheetColumns,
                    `warehouse-c-${activeInventory}`,
                  );
                  return;
                }

                if (!activeInventoryConfig) {
                  return;
                }

                exportRowsToCsv(
                  filteredInventoryRows,
                  activeInventoryConfig.columns,
                  `warehouse-c-${activeInventory}`,
                );
              }}
              sx={(theme) => ({
                ...getListingToolbarOutlinedButtonSx(theme),
                alignSelf: "center",
              })}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {isSampleSheetsTab ? (
          <EnterpriseDataTable
            key="sample-sheets"
            actions={sampleRowActions}
            columns={sampleSheetColumns}
            defaultRowsPerPage={10}
            emptyStateLabel="No sample sheets have been issued from Grouping yet."
            getRowActions={(row) =>
              sampleRowActions.filter((action) => {
                if (action.id !== "issue-for-order") {
                  return true;
                }
                const sample = getSampleSheetByNo(row.sampleNo);
                return Boolean(sample && isSampleEligibleForOrder(sample));
              })
            }
            initialSort={{ key: "issueDate", direction: "desc" }}
            rows={canViewWarehouseC ? filteredSampleRows : []}
          />
        ) : (
          <EnterpriseDataTable
            key={activeInventory}
            actions={inventoryRowActions}
            columns={activeInventoryConfig!.columns}
            defaultRowsPerPage={10}
            initialSort={{ key: "inwardDate", direction: "desc" }}
            rows={canViewWarehouseC ? filteredInventoryRows : []}
          />
        )}
      </Stack>

      <SampleJourneyDialog
        onClose={() => setJourneySample(null)}
        sample={journeySample}
      />
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

function SampleJourneyDialog({
  onClose,
  sample,
}: {
  onClose: () => void;
  sample: SampleSheetRecord | null;
}) {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={Boolean(sample)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontWeight: 700,
          px: 2,
          py: 1.5,
        })}
      >
        Sample Journey {sample ? `· ${sample.sampleNo}` : ""}
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: "16px !important" }}>
        <Stack spacing={1.25}>
          {sample?.journey.map((event, index) => (
            <Box
              key={`${event.status}-${event.at}-${index}`}
              sx={(theme) => ({
                borderLeft: `3px solid ${theme.customTokens.brand.primary}`,
                pl: 1.5,
              })}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {event.status}
              </Typography>
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: 12,
                })}
              >
                {event.stage} ·{" "}
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(event.at))}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function getActiveWarehouseCInventory(value: string | null): WarehouseCTabSlug {
  if (value === "sample-sheets") {
    return "sample-sheets";
  }

  return value && value in warehouseCInventoryConfigs
    ? (value as WarehouseCInventorySlug)
    : "raw-veneer";
}

function isRawOrderRecord(record: OrderRecord) {
  return record.orderType.trim().toLowerCase().includes("raw");
}
