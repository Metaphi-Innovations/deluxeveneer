import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Eye,
  FileOutput,
  Plus,
  RotateCcw,
  Truck,
} from "lucide-react";
import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableCellValue,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  InventoryPageShell,
  mdfDefinition,
  plywoodDefinition,
  rawVeneerDefinition,
  veneerBlocksDefinition,
} from "../../inventory/shared";
import {
  getInventoryPaths,
  getInventoryProcessTab,
  getInventoryRowsForTab,
  getWarehouseBRootPath,
  type InventoryProcessTab,
} from "../../inventory/shared/inventoryUtils";
import type {
  InventoryDefinition,
  InventoryRecord,
} from "../../inventory/shared/types";
import {
  canAccessPermission,
  getFactoryPermissionKey,
} from "../../permissions";
import {
  getListingToolbarButtonSx,
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  issueFactoryWork,
  useFactoryIssuedWorkItems,
} from "../../factory/shared/factoryIssuedWorkStore";
import type { FactoryRecord } from "../../factory/shared/types";
import {
  warehouseAInventoryConfigs,
  warehouseBInspectionConfigs,
  warehouseBInventoryConfigs,
  warehouseBRawVeneerTabConfigs,
  warehouseInvoiceListingColumns,
  warehouseRawVeneerTabConfigs,
  type WarehouseBRawVeneerTab,
} from "../shared/warehouseTableData";
import type { WarehouseInventoryRow } from "../shared/warehouseTableData";
import { IssueOrderDialog } from "../shared/IssueOrderDialog";
import {
  getWarehouseAInwardRows,
  subscribeWarehouseAInwardUpdates,
} from "../shared/warehouseAInwardStore";
import {
  getWarehouseQcPassedRows,
  subscribeWarehouseQcStatusUpdates,
} from "../shared/warehouseQcStore";
import {
  getOrderLineItems,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";

type WarehouseBSection = "inspection" | "inventory";
type WarehouseBInventorySlug =
  | "mdf"
  | "plywood"
  | "raw-veneer"
  | "veneer-blocks";
type WarehouseBInspectionTab = "pending" | "done";
type WarehouseBInspectionSlug = "veneer-blocks";

const rawVeneerTabSelectOptions = ["All", "Purchase", "Production"] as const;

const rawVeneerTabValueByLabel = {
  All: "all",
  Production: "production",
  Purchase: "purchase",
} satisfies Record<(typeof rawVeneerTabSelectOptions)[number], WarehouseBRawVeneerTab>;

const rawVeneerTabLabelByValue: Record<WarehouseBRawVeneerTab, string> = {
  all: "All",
  production: "Production",
  purchase: "Purchase",
};

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

const inventoryDefinitions = {
  "veneer-blocks": veneerBlocksDefinition,
  "raw-veneer": rawVeneerDefinition,
  plywood: plywoodDefinition,
  mdf: mdfDefinition,
} satisfies Record<WarehouseBInventorySlug, InventoryDefinition<any>>;

const warehouseBInspectionPendingConfig = warehouseBInspectionConfigs.pending;
const warehouseBInspectionDoneConfig = warehouseBInspectionConfigs.done;
const warehouseBMoveToWarehouseCInventories = new Set<WarehouseBInventorySlug>([
  "raw-veneer",
  "plywood",
  "mdf",
]);

export function WarehouseBInventoryPage() {
  return <WarehouseBInventoryModulePage />;
}

interface WarehouseBInventoryModulePageProps {
  warehouseName?: string;
  warehouseRootPath?: string;
}

export function WarehouseBInventoryModulePage({
  warehouseName = "Warehouse B",
  warehouseRootPath = getWarehouseBRootPath(),
}: WarehouseBInventoryModulePageProps = {}) {
  const theme = useTheme();
  const bulkSecondaryButtonSx = {
    minHeight: 36,
    px: theme.spacing(2),
    borderRadius: `${theme.customTokens.radius.md}px`,
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    textTransform: "none",
    "&:hover": {
      borderColor: theme.palette.primary.dark,
      backgroundColor: theme.customTokens.navigation.hoverBackground,
    },
  };
  const bulkPrimaryButtonSx = {
    minHeight: 36,
    px: theme.spacing(2),
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    textTransform: "none",
    boxShadow: theme.customTokens.elevation.sm,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      boxShadow: theme.customTokens.elevation.sm,
    },
  };
  const navigate = useNavigate();
  const orderRecords = useOrderRecords();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [selectedRows, setSelectedRows] = useState<InventoryRecord[]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [revertedRowIds, setRevertedRowIds] = useState<string[]>([]);
  const [qcStatusRevision, setQcStatusRevision] = useState(0);
  const [inwardRevision, setInwardRevision] = useState(0);
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();

  const activeSection = getActiveWarehouseBSection(searchParams.get("section"));
  const activeInventory = getActiveInventoryTab(searchParams.get("inventory"));
  const activeProcessTab = getInventoryProcessTab(searchParams.get("tab"));
  const activeRawVeneerTab = getActiveRawVeneerTab(searchParams.get("rawTab"));
  const activeInspectionTab = getActiveWarehouseBInspectionTab(
    searchParams.get("inspection"),
  );
  const activeDefinition = inventoryDefinitions[activeInventory];
  const activeRawVeneerConfig =
    activeInventory === "raw-veneer"
      ? warehouseBRawVeneerTabConfigs[activeRawVeneerTab]
      : null;
  const activeWarehouseInventoryConfig =
    warehouseBInventoryConfigs[activeInventory];
  const activeWarehouseBStockRows = useMemo(
    () => {
      void qcStatusRevision;
      void inwardRevision;
      return getWarehouseBStockRows(activeInventory, activeRawVeneerTab);
    },
    [activeInventory, activeRawVeneerTab, inwardRevision, qcStatusRevision],
  );
  const activeRows = (
    activeProcessTab === "issued"
      ? activeWarehouseBStockRows
      : activeRawVeneerConfig?.rows ?? activeWarehouseInventoryConfig.rows
  ) as readonly InventoryRecord[];
  const movedWarehouseRowIds = useMemo(
    () =>
      new Set(
        factoryIssuedWorkItems
          .filter((item) => item.sourceSlug === warehouseName)
          .map((item) => item.sourceRowId),
      ),
    [factoryIssuedWorkItems, warehouseName],
  );
  const activeInventoryColumns = useMemo(() => {
    const columns =
      warehouseInvoiceListingColumns as readonly EnterpriseTableColumn<InventoryRecord>[];

    if (activeInventory !== "raw-veneer" || activeRawVeneerTab !== "production") {
      return columns;
    }

    return columns.filter(
      (column) => column.key !== "invoiceNo" && column.key !== "supplierName",
    );
  }, [activeInventory, activeRawVeneerTab]);
  const inventoryPaths = getInventoryPaths(
    activeDefinition.slug,
    activeProcessTab,
  );

  const canCreateSlicing = canAccessPermission(
    getFactoryPermissionKey("slicing"),
    "create",
  );
  const canCreateSawing = canAccessPermission(
    getFactoryPermissionKey("sawing"),
    "create",
  );
  const canCreateWarehouseC = canAccessPermission("warehouseC", "create");
  const canEditWarehouseB = canAccessPermission("warehouseB", "edit");
  const canViewWarehouseB = canAccessPermission("warehouseB", "view");
  const [inspectionDoneRowIds, setInspectionDoneRowIds] = useState<string[]>(
    [],
  );

  useEffect(
    () =>
      subscribeWarehouseQcStatusUpdates(() =>
        setQcStatusRevision((current) => current + 1),
      ),
    [],
  );

  useEffect(
    () =>
      subscribeWarehouseAInwardUpdates(() =>
        setInwardRevision((current) => current + 1),
      ),
    [],
  );

  const inventoryTabRows = useMemo(() => {
    const rows =
      activeProcessTab === "issued"
        ? activeRows
        : getInventoryRowsForTab(activeRows, activeProcessTab);
    const displayRows =
      activeInventory === "raw-veneer" && activeRawVeneerTab === "all"
        ? rows.map((row) =>
            isWarehouseBRawVeneerProductionRow(row)
              ? {
                  ...row,
                  invoiceNo: "-",
                  supplierName: "-",
                }
              : row,
          )
        : rows;

    return activeProcessTab === "issued"
      ? displayRows.filter(
          (row) =>
            !revertedRowIds.includes(row.id) &&
            !movedWarehouseRowIds.has(String(row.id)),
        )
      : displayRows;
  }, [
    activeInventory,
    activeProcessTab,
    activeRawVeneerTab,
    activeRows,
    movedWarehouseRowIds,
    revertedRowIds,
  ]);

  const filteredInventoryRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return inventoryTabRows;
    }

    return inventoryTabRows.filter((row) =>
      Object.values(row).some((value) =>
        formatSearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [inventoryTabRows, searchValue]);

  const inspectionPendingRows = useMemo(
    () =>
      warehouseBInspectionPendingConfig.rows
        .filter((row) => !inspectionDoneRowIds.includes(row.id))
        .map((row) => ({
          ...row,
          status: "Inspection Pending",
        })),
    [inspectionDoneRowIds],
  );
  const inspectionDoneRows = useMemo(
    () => [
      ...warehouseBInspectionDoneConfig.rows.map((row) => ({
        ...row,
        status: "Inspection Done",
      })),
      ...warehouseBInspectionPendingConfig.rows
        .filter((row) => inspectionDoneRowIds.includes(row.id))
        .map((row) => ({
          ...row,
          status: "Inspection Done",
        })),
    ],
    [inspectionDoneRowIds],
  );
  const activeInspectionRows =
    activeInspectionTab === "pending" ? inspectionPendingRows : inspectionDoneRows;
  const activeInspectionColumns =
    activeInspectionTab === "pending"
      ? warehouseBInspectionPendingConfig.columns
      : warehouseBInspectionDoneConfig.columns;

  const filteredInspectionRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return activeInspectionRows;
    }

    return activeInspectionRows.filter((row) =>
      Object.values(row).some((value) =>
        formatSearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [activeInspectionRows, searchValue]);


  const issueWarehouseBRowsForSlicing = useCallback(
    (rows: readonly InventoryRecord[]) => {
      if (!canEditWarehouseB || !canCreateSlicing || rows.length === 0) {
        return;
      }

      rows.forEach((row) => {
        issueFactoryWork({
          destinationProcess: "slicing",
          sourceSlug: warehouseName,
          sourceProcess: "Inventory",
          sourceWarehouseName: warehouseName,
          sourceRow: {
            ...row,
            warehouseName,
            issuedFrom: "Inventory",
            issuedFor: "Slicing",
            issuedDate: new Date(),
          } as FactoryRecord,
        });
      });

      setRevertedRowIds((current) => {
        const nextIds = new Set(current);
        rows.forEach((row) => nextIds.add(row.id));
        return [...nextIds];
      });
      setSelectedRows([]);
      setSelectionResetKey((current) => current + 1);
    },
    [canCreateSlicing, canEditWarehouseB, warehouseName],
  );

  const issueWarehouseBRowsForSawing = useCallback(
    (rows: readonly InventoryRecord[]) => {
      if (!canEditWarehouseB || !canCreateSawing || rows.length === 0) {
        return;
      }

      rows.forEach((row) => {
        issueFactoryWork({
          destinationProcess: "sawing",
          sourceSlug: warehouseName,
          sourceProcess: "Inventory",
          sourceWarehouseName: warehouseName,
          sourceRow: {
            ...row,
            warehouseName,
            issuedFrom: "Inventory",
            issuedFor: "Sawing",
            issuedDate: new Date(),
          } as FactoryRecord,
        });
      });

      setRevertedRowIds((current) => {
        const nextIds = new Set(current);
        rows.forEach((row) => nextIds.add(row.id));
        return [...nextIds];
      });
      setSelectedRows([]);
      setSelectionResetKey((current) => current + 1);
    },
    [canCreateSawing, canEditWarehouseB, warehouseName],
  );

  const inventoryRowActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<InventoryRecord>>
  >(() => {
    const baseActions: EnterpriseTableAction<InventoryRecord>[] = [
      ...(canViewWarehouseB
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: InventoryRecord) =>
                navigate(inventoryPaths.view(getWarehouseBRecordId(row))),
            },
          ]
        : []),
    ];

    if (activeProcessTab === "history") {
      return baseActions;
    }

    if (activeInventory === "veneer-blocks" && canEditWarehouseB) {
      baseActions.push({
        id: "revert",
        label: "Revert",
        icon: RotateCcw,
        tone: "danger",
        onSelect: (row) =>
          setRevertedRowIds((current) =>
            current.includes(row.id) ? current : [...current, row.id],
          ),
      });
    }

    if (
      warehouseBMoveToWarehouseCInventories.has(activeInventory) &&
      canEditWarehouseB
    ) {
      baseActions.push(
        {
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (row) =>
            setRevertedRowIds((current) =>
              current.includes(row.id) ? current : [...current, row.id],
            ),
        },
        ...(canCreateWarehouseC
          ? [
              {
                id: "move-to-warehouse-c",
                label: "Move to Warehouse C",
                icon: Truck,
                onSelect: () =>
                  navigate(
                    `/warehouse-c?section=inventory&inventory=${activeInventory}`,
                  ),
              },
            ]
          : []),
      );
    }

    if (
      activeInventory === "veneer-blocks" &&
      activeProcessTab === "issued" &&
      canEditWarehouseB &&
      canCreateSlicing
    ) {
      baseActions.push({
        id: "issue-for-slicing",
        label: "Issue for Slicing",
        icon: Plus,
        tone: "primary",
        onSelect: (row) => issueWarehouseBRowsForSlicing([row]),
      });
    }

    if (
      activeInventory === "veneer-blocks" &&
      activeProcessTab === "issued" &&
      canEditWarehouseB &&
      canCreateSawing
    ) {
      baseActions.push({
        id: "issue-for-sawing",
        label: "Issue for Sawing",
        icon: Plus,
        tone: "primary",
        onSelect: (row) => issueWarehouseBRowsForSawing([row]),
      });
    }

    return baseActions;
  }, [
    activeInventory,
    activeProcessTab,
    canCreateSlicing,
    canCreateSawing,
    canCreateWarehouseC,
    canEditWarehouseB,
    canViewWarehouseB,
    inventoryPaths,
    issueWarehouseBRowsForSawing,
    issueWarehouseBRowsForSlicing,
    navigate,
  ]);

  const inspectionRowActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<WarehouseInventoryRow>>
  >(() => {
    if (activeInspectionTab === "pending") {
      return canEditWarehouseB
        ? [
            {
              id: "move-to-inspection-done",
              label: "Move to Inspection Done",
              icon: BadgeCheck,
              onSelect: (row) =>
                setInspectionDoneRowIds((current) =>
                  current.includes(row.id) ? current : [...current, row.id],
                ),
            },
          ]
        : [];
    }

    return [
      ...(canEditWarehouseB
        ? [
            {
              id: "move-to-warehouse-b",
              label: "Move to Warehouse B",
              icon: Truck,
              onSelect: () =>
                navigate("/warehouse-b?section=inventory&inventory=raw-veneer"),
            },
          ]
        : []),
      ...(canEditWarehouseB && canCreateWarehouseC
        ? [
            {
              id: "move-to-warehouse-c",
              label: "Move to Warehouse C",
              icon: Truck,
              onSelect: () =>
                navigate("/warehouse-c?section=inventory&inventory=raw-veneer"),
            },
          ]
        : []),
    ];
  }, [
    activeInspectionTab,
    canCreateWarehouseC,
    canEditWarehouseB,
    navigate,
  ]);

  const showBulkIssueForSlicing =
    activeSection === "inventory" &&
    activeInventory === "veneer-blocks" &&
    activeProcessTab === "issued" &&
    canEditWarehouseB &&
    canCreateSlicing &&
    selectedRows.length > 0;
  const showBulkIssueForSawing =
    activeSection === "inventory" &&
    activeInventory === "veneer-blocks" &&
    activeProcessTab === "issued" &&
    canEditWarehouseB &&
    canCreateSawing &&
    selectedRows.length > 0;
  const showBulkMoveToWarehouseC =
    activeSection === "inventory" &&
    warehouseBMoveToWarehouseCInventories.has(activeInventory) &&
    activeProcessTab === "issued" &&
    canEditWarehouseB &&
    canCreateWarehouseC &&
    selectedRows.length > 0;
  const handleCancelBulkSelection = () => {
    setSelectedRows([]);
    setSelectionResetKey((current) => current + 1);
  };

  const handleMoveSelectionToWarehouseC = () => {
    if (!canEditWarehouseB || !canCreateWarehouseC) {
      return;
    }

    navigate(`/warehouse-c?section=inventory&inventory=${activeInventory}`);
  };

  return (
    <InventoryPageShell
      breadcrumbs={getWarehouseBBreadcrumbs({
        activeDefinitionSlug: activeDefinition.slug,
        activeDefinitionTitle: activeDefinition.title,
        activeProcessTab,
        activeRawVeneerTitle:
          activeRawVeneerConfig?.title === "All"
            ? undefined
            : activeRawVeneerConfig?.title,
        activeSection,
        warehouseName,
        warehouseRootPath,
      })}
      processTabs={renderWarehouseBSectionTabs({
        activeInventory,
        activeInspectionTab,
        activeProcessTab,
        activeRawVeneerTab,
        activeSection,
        setSearchParams,
      })}
      subtitle="Main inventory storage and inspection."
      title={warehouseName}
    >
      <Stack
        sx={(currentTheme) => ({
          gap: currentTheme.spacing(2),
        })}
      >
        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              width: { xs: "100%", lg: "auto" },
            }}
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

            {activeSection === "inventory" && activeInventory === "raw-veneer" ? (
              <Box sx={{ width: { xs: "100%", sm: 140 } }}>
                <ErpSelectField
                  value={rawVeneerTabLabelByValue[activeRawVeneerTab]}
                  onChange={(value) => {
                    const selectedRawTab =
                      rawVeneerTabValueByLabel[
                        value as keyof typeof rawVeneerTabValueByLabel
                      ] ?? "all";

                    setSearchParams(
                      {
                        section: "inventory",
                        inventory: activeInventory,
                        ...(selectedRawTab === "all"
                          ? {}
                          : { rawTab: selectedRawTab }),
                        ...(activeProcessTab === "history"
                          ? { tab: "history" }
                          : {}),
                      },
                      { replace: true },
                    );
                  }}
                  options={rawVeneerTabSelectOptions}
                  size="dense"
                />
              </Box>
            ) : null}
          </Stack>

          {activeSection === "inventory" ? (
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
                disabled={filteredInventoryRows.length === 0}
                onClick={() =>
                  exportRowsToCsv(
                    filteredInventoryRows,
                    activeInventoryColumns,
                    `warehouse-b-${activeInventory}`,
                  )
                }
                sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
              >
                Export
              </Button>
            </Stack>
          ) : null}
        </Stack>

        {showBulkIssueForSlicing || showBulkIssueForSawing ? (
          <Box
            sx={{
              width: "100%",
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.surface,
              boxShadow: theme.customTokens.elevation.sm,
              px: theme.spacing(2),
              py: theme.spacing(1.5),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                {selectedRows.length} veneer block records selected
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancelBulkSelection}
                  sx={bulkSecondaryButtonSx}
                >
                  Cancel
                </Button>

                {showBulkIssueForSlicing ? (
                  <Button
                    variant="contained"
                    onClick={() => issueWarehouseBRowsForSlicing(selectedRows)}
                    sx={bulkPrimaryButtonSx}
                  >
                    Issue for Slicing
                  </Button>
                ) : null}
                {showBulkIssueForSawing ? (
                  <Button
                    variant="contained"
                    onClick={() => issueWarehouseBRowsForSawing(selectedRows)}
                    sx={bulkPrimaryButtonSx}
                  >
                    Issue for Sawing
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Box>
        ) : null}

        {showBulkMoveToWarehouseC ? (
          <Box
            sx={{
              width: "100%",
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.surface,
              boxShadow: theme.customTokens.elevation.sm,
              px: theme.spacing(2),
              py: theme.spacing(1.5),
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", sm: "center" }}
              justifyContent="space-between"
            >
              <Typography variant="body2" color="text.secondary">
                {selectedRows.length} {activeDefinition.title.toLowerCase()} records selected
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancelBulkSelection}
                  sx={bulkSecondaryButtonSx}
                >
                  Cancel
                </Button>

                <Button
                  variant="contained"
                  onClick={handleMoveSelectionToWarehouseC}
                  startIcon={<Truck size={16} />}
                  sx={bulkPrimaryButtonSx}
                >
                  Move to Warehouse C
                </Button>
              </Stack>
            </Stack>
          </Box>
        ) : null}

        {activeSection === "inventory" ? (
          <EnterpriseDataTable
            key={`${activeInventory}-${activeRawVeneerTab}-${activeProcessTab}`}
            actions={inventoryRowActions}
            columns={activeInventoryColumns}
            defaultRowsPerPage={10}
            emptyStateLabel={`No ${activeDefinition.title.toLowerCase()} records are available for this tab.`}
            onSelectionChange={setSelectedRows}
            rows={canViewWarehouseB ? filteredInventoryRows : []}
            selectionResetKey={selectionResetKey}
            selectable={activeProcessTab !== "history" && canEditWarehouseB}
            {...(activeDefinition.initialSort
              ? { initialSort: activeDefinition.initialSort }
              : {})}
          />
        ) : null}

        {activeSection === "inspection" ? (
          <EnterpriseDataTable
            key={`warehouse-b-inspection-${activeInspectionTab}`}
            actions={inspectionRowActions}
            columns={activeInspectionColumns}
            defaultRowsPerPage={10}
            initialSort={{ key: "inwardDate", direction: "desc" }}
            rows={
              activeInspectionTab === "pending"
                ? canViewWarehouseB
                  ? filteredInspectionRows
                  : []
                : canViewWarehouseB
                  ? filteredInspectionRows
                  : []
            }
          />
        ) : null}
      </Stack>

    </InventoryPageShell>
  );
}

function renderWarehouseBSectionTabs({
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
  setSearchParams: ReturnType<typeof useSearchParams>[1];
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

function getWarehouseBBreadcrumbs({
  activeDefinitionSlug,
  activeDefinitionTitle,
  activeProcessTab,
  activeRawVeneerTitle,
  activeSection,
  warehouseName,
  warehouseRootPath,
}: {
  activeDefinitionSlug: string;
  activeDefinitionTitle: string;
  activeProcessTab: InventoryProcessTab;
  activeRawVeneerTitle: string | undefined;
  activeSection: WarehouseBSection;
  warehouseName: string;
  warehouseRootPath: string;
}) {
  if (activeSection === "inspection") {
    return [
      {
        label: warehouseName,
        to: warehouseRootPath,
      },
      { label: "Inspection" },
    ];
  }

  return [
    {
      label: warehouseName,
      to: warehouseRootPath,
    },
    { label: "Inventory" },
    {
      label: activeDefinitionTitle,
      to: `${warehouseRootPath}?section=inventory&inventory=${activeDefinitionSlug}`,
    },
    ...(activeRawVeneerTitle ? [{ label: activeRawVeneerTitle }] : []),
    { label: activeProcessTab === "history" ? "History" : "Inventory" },
  ];
}

function getActiveWarehouseBSection(value: string | null): WarehouseBSection {
  return value === "inspection" ? "inspection" : "inventory";
}

function getActiveWarehouseBInspectionTab(
  value: string | null,
): WarehouseBInspectionTab {
  return value === "done" ? "done" : "pending";
}

function getActiveInventoryTab(value: string | null): WarehouseBInventorySlug {
  return value && value in inventoryDefinitions
    ? (value as WarehouseBInventorySlug)
    : "veneer-blocks";
}

function getActiveRawVeneerTab(value: string | null): WarehouseBRawVeneerTab {
  if (value === "purchase" || value === "production") {
    return value;
  }

  return "all";
}

function getWarehouseBStockRows(
  activeInventory: WarehouseBInventorySlug,
  activeRawVeneerTab: WarehouseBRawVeneerTab,
) {
  const sourceRows =
    activeInventory === "raw-veneer"
      ? getWarehouseARawVeneerRows(activeRawVeneerTab)
      : mergeWarehouseSourceRows(
          warehouseAInventoryConfigs[activeInventory].rows,
          getWarehouseAInwardRows(activeInventory),
        );

  return getWarehouseQcPassedRows(sourceRows).map((row) => ({
    ...row,
    status: "QC Pass",
  }));
}

function mergeWarehouseSourceRows(
  configRows: readonly WarehouseInventoryRow[],
  inwardRows: readonly WarehouseInventoryRow[],
) {
  const seenIds = new Set<string>();
  const merged: WarehouseInventoryRow[] = [];

  [...inwardRows, ...configRows].forEach((row) => {
    if (seenIds.has(row.id)) {
      return;
    }

    seenIds.add(row.id);
    merged.push(row);
  });

  return merged;
}

function getWarehouseARawVeneerRows(activeRawVeneerTab: WarehouseBRawVeneerTab) {
  const configRows =
    activeRawVeneerTab === "all"
      ? [
          ...warehouseRawVeneerTabConfigs.purchase.rows,
          ...warehouseRawVeneerTabConfigs.production.rows,
        ]
      : warehouseRawVeneerTabConfigs[activeRawVeneerTab].rows;

  return mergeWarehouseSourceRows(
    configRows,
    getWarehouseAInwardRows("raw-veneer"),
  );
}

function getWarehouseBRecordId(row: InventoryRecord) {
  return row.id;
}

function isWarehouseBRawVeneerProductionRow(row: InventoryRecord) {
  const inwardType = String(row["inwardType"] ?? "").trim().toLowerCase();
  const rowId = String(row.id ?? "").trim().toLowerCase();
  const inventoryRecordId = String(row["inventoryRecordId"] ?? "")
    .trim()
    .toLowerCase();

  return (
    inwardType === "production" ||
    rowId.includes("production") ||
    inventoryRecordId.includes("production")
  );
}

function formatSearchValue(value: EnterpriseTableCellValue) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(value)
      .toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).toLowerCase();
}
