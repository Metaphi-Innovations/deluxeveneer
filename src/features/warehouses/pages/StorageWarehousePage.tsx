import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileOutput, Plus, RotateCcw, Truck } from "lucide-react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import type {
  EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";
import {
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import {
  listingTableBodyCellSx,
  listingTableContainerSx,
  listingTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import { useDebouncedValue } from "../../shared/useDebouncedValue";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import { type WarehouseInventoryRow } from "../shared/warehouseTableData";
import {
  exportStorageInventoryApi,
  fetchStorageProductionWarehouses,
  issueVeneerBlocksToSlicingApi,
  moveStorageItemToProductionApi,
  revertStorageItemApi,
  type StorageProductionWarehouseOption,
} from "../storage/api/storageApi";
import {
  invalidateWarehouseProduction,
  invalidateWarehouseStorage,
} from "../../../query/queryClient";
import { issueSawingFromStorageRows } from "../../factory/sawing/sawingFrontendStore";
import { fetchGradesApi } from "../../masters/grade-master/gradeMasterApi";
import type { MasterRecord } from "../../masters/shared/types";
import { StorageMdfInventory } from "../storage/StorageMdfInventory";
import { StoragePlywoodInventory } from "../storage/StoragePlywoodInventory";
import { StorageRawVeneerInventory } from "../storage/StorageRawVeneerInventory";
import { StorageVeneerBlocksInventory } from "../storage/StorageVeneerBlocksInventory";
import { StorageConsumablesInventory } from "../storage/StorageConsumablesInventory";
import {
  STORAGE_EXPORT_COLUMNS,
  STORAGE_INVENTORY_TABS,
  STORAGE_SECTION_TABS,
  getActiveStorageInventoryTab,
  getActiveStorageSectionTab,
  type StorageInventoryTab,
  type StorageRawVeneerSourceTab,
  type StorageSectionTab,
} from "../storage/types";

const rawVeneerSourceSelectOptions = ["All", "Purchase", "Production"] as const;

const rawVeneerTabValueByLabel: Record<
  (typeof rawVeneerSourceSelectOptions)[number],
  StorageRawVeneerSourceTab
> = {
  All: "all",
  Purchase: "purchase",
  Production: "production",
};

const rawVeneerTabLabelByValue: Record<StorageRawVeneerSourceTab, string> = {
  all: "All",
  purchase: "Purchase",
  production: "Production",
};

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
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 450);

  const activeInventory = getActiveStorageInventoryTab(
    searchParams.get("inventory")
  );
  const activeSection = getActiveStorageSectionTab(searchParams.get("section"));
  const rawTabParam = searchParams.get("rawTab")?.toLowerCase();
  const activeRawTab: StorageRawVeneerSourceTab =
    rawTabParam === "purchase" || rawTabParam === "production"
      ? rawTabParam
      : "all";

  // Bulk selection state
  const [selectedRows, setSelectedRows] = useState<WarehouseInventoryRow[]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refreshStorageLists = () => {
    setRefreshTrigger((current) => current + 1);
    void invalidateWarehouseStorage();
    void invalidateWarehouseProduction();
  };

  // Dialog state for Revert and Move to Production
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTargetRow, setRevertTargetRow] = useState<WarehouseInventoryRow | null>(null);
  const [revertRemark, setRevertRemark] = useState("");
  const [isReverting, setIsReverting] = useState(false);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetRows, setMoveTargetRows] = useState<WarehouseInventoryRow[]>([]);
  const [productionWarehouses, setProductionWarehouses] = useState<StorageProductionWarehouseOption[]>([]);
  const [selectedProductionWarehouseId, setSelectedProductionWarehouseId] = useState("");
  const [gradeOptions, setGradeOptions] = useState<MasterRecord[]>([]);
  /** Per-row move qty / grade keyed by storage item id (raw veneer / plywood / MDF). */
  const [moveQuantities, setMoveQuantities] = useState<Record<string, string>>({});
  const [moveGrades, setMoveGrades] = useState<Record<string, string>>({});
  const [moveRemark, setMoveRemark] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);
  const [moveDialogError, setMoveDialogError] = useState<string | null>(null);
  const [revertDialogError, setRevertDialogError] = useState<string | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);

  const formatErrorMessage = (error: unknown, fallback: string): string => {
    if (!error) return fallback;
    const msg = error instanceof Error ? error.message : String(error);
    if (!msg || msg.trim().length === 0) return fallback;

    const lower = msg.toLowerCase();
    if (lower.includes("already_moved") || lower.includes("already been moved")) {
      return "This item has already been transferred to a production warehouse.";
    }
    if (lower.includes("invalid_quantity") || lower.includes("quantity must be greater")) {
      return "Please enter a valid quantity greater than 0 that does not exceed available stock.";
    }
    if (lower.includes("destination must be a production")) {
      return "The destination warehouse must be an active Production warehouse.";
    }
    if (lower.includes("warehouse is inactive") || lower.includes("inactive")) {
      return "The selected destination warehouse or grade is currently inactive.";
    }
    if (lower.includes("network") || lower.includes("failed to fetch")) {
      return "Network connection issue. Please check your connection and try again.";
    }
    if (lower.includes("status 403") || lower.includes("forbidden") || lower.includes("permission")) {
      return "You do not have permission to perform this warehouse transfer.";
    }

    return msg.replace(/^Error:\s*/i, "");
  };

  const warehousePermissionKey = getDynamicWarehousePermissionKey(warehouseId);
  const canView = canAccessPermission(warehousePermissionKey, "view");
  const canEdit = canAccessPermission(warehousePermissionKey, "edit");

  const panelProps = useMemo(
    () => ({
      warehouseId,
      warehouseName,
      warehouseRootPath,
      section: activeSection,
      rawTab: activeRawTab,
      onSelectionChange: setSelectedRows,
      selectionResetKey,
      onRefreshTrigger: refreshTrigger,
    }),
    [activeSection, activeRawTab, warehouseId, warehouseName, warehouseRootPath, selectionResetKey, refreshTrigger]
  );

  const updateParams = (next: {
    inventory?: StorageInventoryTab;
    section?: StorageSectionTab;
    rawTab?: StorageRawVeneerSourceTab;
  }) => {
    const params: Record<string, string> = {
      inventory: next.inventory ?? activeInventory,
      section: next.section ?? activeSection,
    };
    const nextRawTab = next.rawTab ?? activeRawTab;
    if (nextRawTab !== "all") {
      params.rawTab = nextRawTab;
    }
    setSearchParams(params, { replace: true });
    setSelectedRows([]);
    setSelectionResetKey((c) => c + 1);
  };

  const handleCancelBulkSelection = () => {
    setSelectedRows([]);
    setSelectionResetKey((current) => current + 1);
  };

  const getMoveRowAvailable = (row: WarehouseInventoryRow) => {
    // Transfer qty unit: raw veneer = leaves; plywood / mdf = sheets; consumables = qty.
    if (activeInventory === "raw-veneer") {
      return Number(
        row.availableUnits || row.noOfLeaves || row.totalUnits || 0,
      );
    }
    if (activeInventory === "consumables") {
      return Number(row.availableUnits || row.totalUnits || 0);
    }
    return Number(
      row.availableUnits ||
      row.avSheets ||
      row.totalNoOfSheets ||
      row.totalUnits ||
      0,
    );
  };

  const moveUnitLabel =
    activeInventory === "raw-veneer"
      ? "Leaves"
      : activeInventory === "consumables"
        ? "Qty"
        : "Sheets";

  const updateMoveQuantity = (rowId: string, value: string) => {
    setMoveQuantities((prev) => ({ ...prev, [rowId]: value }));
  };

  const updateMoveGrade = (rowId: string, value: string) => {
    setMoveGrades((prev) => ({ ...prev, [rowId]: value }));
  };

  const isMoveQtyInvalid = (row: WarehouseInventoryRow, rawQty: string) => {
    const qty = Number(rawQty);
    const available = getMoveRowAvailable(row);
    if (!rawQty.trim() || !Number.isFinite(qty) || !Number.isInteger(qty) || qty <= 0) {
      return true;
    }
    return available > 0 && qty > available;
  };

  const hasInvalidMoveQuantities = moveTargetRows.some((row) =>
    isMoveQtyInvalid(row, moveQuantities[row.id] ?? ""),
  );

  const hasMissingMoveGrades = moveTargetRows.some(
    (row) => !(moveGrades[row.id] ?? "").trim(),
  );

  // Move to production logic
  const handleOpenMoveDialog = useCallback(
    async (rowsToMove: WarehouseInventoryRow[]) => {
      setMoveTargetRows(rowsToMove);
      setMoveRemark("");
      setSelectedProductionWarehouseId("");
      setMoveGrades({});
      setMoveDialogError(null);
      setIsLoadingWarehouses(true);
      setIsLoadingGrades(true);

      const initialQuantities: Record<string, string> = {};
      for (const row of rowsToMove) {
        const available = row.availableUnits || row.totalUnits || "";
        initialQuantities[row.id] = available ? String(available) : "";
      }
      setMoveQuantities(initialQuantities);

      setMoveDialogOpen(true);

      try {
        const [warehouseResult, gradeRecords] = await Promise.all([
          fetchStorageProductionWarehouses(warehouseId),
          fetchGradesApi({ status: true, limit: 1000 }),
        ]);

        const items = warehouseResult?.items ?? [];
        setProductionWarehouses(items);
        if (
          warehouseResult?.suggestedWarehouseId &&
          items.some((i) => i.id === warehouseResult.suggestedWarehouseId)
        ) {
          setSelectedProductionWarehouseId(warehouseResult.suggestedWarehouseId);
        } else if (items.length > 0 && items[0]) {
          setSelectedProductionWarehouseId(items[0].id);
        }

        const activeGrades = gradeRecords.filter(
          (record) =>
            String(record.status ?? "Active").toLowerCase() !== "inactive",
        );
        setGradeOptions(activeGrades);
        const defaultGradeId =
          activeGrades.length > 0 && activeGrades[0]?.id
            ? String(activeGrades[0].id)
            : "";
        if (defaultGradeId) {
          const initialGrades: Record<string, string> = {};
          for (const row of rowsToMove) {
            initialGrades[row.id] = defaultGradeId;
          }
          setMoveGrades(initialGrades);
        }
      } catch (err) {
        console.error("Failed to load move-to-production options", err);
        setMoveDialogError(
          formatErrorMessage(err, "Failed to load production warehouses or grades. Please try again.")
        );
        setProductionWarehouses([]);
        setGradeOptions([]);
      } finally {
        setIsLoadingWarehouses(false);
        setIsLoadingGrades(false);
      }
    },
    [warehouseId],
  );

  const handleConfirmMove = async () => {
    if (
      !selectedProductionWarehouseId ||
      moveTargetRows.length === 0 ||
      isMoving
    ) {
      return;
    }

    setMoveDialogError(null);

    const missingGradeRow = moveTargetRows.find(
      (row) => !(moveGrades[row.id] ?? "").trim(),
    );
    if (missingGradeRow) {
      const label =
        missingGradeRow.storageSrNo ||
        missingGradeRow.inwardSrNo ||
        missingGradeRow.itemName ||
        "item";
      setMoveDialogError(`Please select a grade for ${label}.`);
      return;
    }

    const invalidRow = moveTargetRows.find((row) =>
      isMoveQtyInvalid(row, moveQuantities[row.id] ?? ""),
    );
    if (invalidRow) {
      const available = getMoveRowAvailable(invalidRow);
      const label =
        invalidRow.storageSrNo ||
        invalidRow.inwardSrNo ||
        invalidRow.itemName ||
        "item";
      const qty = Number(moveQuantities[invalidRow.id] || 0);
      if (!Number.isInteger(qty) || qty <= 0) {
        setMoveDialogError(
          `Please enter a valid quantity greater than 0 for ${label}.`,
        );
      } else {
        setMoveDialogError(
          `Cannot move ${qty} for ${label}. Maximum available is ${available} ${moveUnitLabel}.`,
        );
      }
      return;
    }

    setIsMoving(true);
    try {
      for (const row of moveTargetRows) {
        const quantityToMove = Number(moveQuantities[row.id]);
        const gradeId = moveGrades[row.id];
        if (!gradeId) continue;
        await moveStorageItemToProductionApi(activeInventory, row.id, {
          productionWarehouseId: selectedProductionWarehouseId,
          gradeId,
          remark: moveRemark || null,
          quantity: quantityToMove,
        });
      }
      setMoveDialogOpen(false);
      setSelectedRows([]);
      setSelectionResetKey((c) => c + 1);
      refreshStorageLists();

      const isAllStockMoved = moveTargetRows.every((row) => {
        const available = getMoveRowAvailable(row);
        const qty = Number(moveQuantities[row.id] || 0);
        return available <= 0 || qty >= available;
      });

      setToastNotification({
        message: `${moveTargetRows.length} item(s) successfully moved to production warehouse!`,
        severity: "success",
      });

      if (isAllStockMoved) {
        updateParams({ section: "history" });
      }
    } catch (err) {
      setMoveDialogError(
        formatErrorMessage(err, "Failed to move stock to production warehouse. Please try again.")
      );
    } finally {
      setIsMoving(false);
    }
  };

  // Revert logic
  const handleOpenRevertDialog = (row: WarehouseInventoryRow) => {
    setRevertTargetRow(row);
    setRevertRemark("");
    setRevertDialogError(null);
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!revertTargetRow || isReverting) return;
    setRevertDialogError(null);
    setIsReverting(true);
    try {
      await revertStorageItemApi(activeInventory, revertTargetRow.id, revertRemark || null);
      setRevertDialogOpen(false);
      setRevertTargetRow(null);
      setSelectedRows([]);
      setSelectionResetKey((c) => c + 1);
      refreshStorageLists();
      setToastNotification({
        message: "Item successfully reverted back to Inward Warehouse.",
        severity: "success",
      });
    } catch (err) {
      setRevertDialogError(
        formatErrorMessage(err, "Failed to revert item back to inward warehouse. Please try again.")
      );
    } finally {
      setIsReverting(false);
    }
  };

  const handleIssueForSawing = useCallback(
    async (targetRows: WarehouseInventoryRow[]) => {
      if (!targetRows.length) return;
      try {
        issueSawingFromStorageRows(targetRows as unknown as Record<string, unknown>[]);
        setToastNotification({
          message: `${targetRows.length} item(s) issued for Sawing successfully!`,
          severity: "success",
        });
        setSelectedRows([]);
        setSelectionResetKey((c) => c + 1);
        refreshStorageLists();
      } catch (err: any) {
        setToastNotification({
          message: err.message || "Failed to issue for Sawing.",
          severity: "error",
        });
      }
    },
    []
  );

  const handleIssueForSlicing = useCallback(
    async (targetRows: WarehouseInventoryRow[]) => {
      if (!targetRows.length) return;
      try {
        await issueVeneerBlocksToSlicingApi(targetRows.map((r) => r.id));
        setToastNotification({
          message: `${targetRows.length} item(s) issued for Slicing successfully!`,
          severity: "success",
        });
        setSelectedRows([]);
        setSelectionResetKey((c) => c + 1);
        refreshStorageLists();
      } catch (err: any) {
        setToastNotification({
          message: err.message || "Failed to issue for Slicing.",
          severity: "error",
        });
      }
    },
    []
  );

  // Row actions for raw-veneer, plywood, mdf, veneer-blocks
  const getRowActions = useCallback(
    (row: WarehouseInventoryRow): readonly EnterpriseTableAction<WarehouseInventoryRow>[] => {
      const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [];

      // View
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (r) => {
          const targetInwardId = r.referenceSrNo || r.id;
          const targetSlug =
            activeInventory === "consumables" ? "consumables" : activeInventory;
          navigate(`/inventory/${targetSlug}/view/${targetInwardId}?warehouse=warehouse-b&warehouseId=${warehouseId}&warehouseName=${encodeURIComponent(warehouseName)}`);
        },
      });

      // In inventory mode, also show Revert and Move to Warehouse
      if (activeSection === "inventory" && canEdit) {
        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (r) => handleOpenRevertDialog(r),
        });

        if (activeInventory === "veneer-blocks") {
          actions.push({
            id: "issue-for-sawing",
            label: "Issue for Sawing",
            icon: Plus,
            tone: "primary",
            onSelect: (r) => void handleIssueForSawing([r]),
          });
          actions.push({
            id: "issue-for-slicing",
            label: "Issue for Slicing",
            icon: Plus,
            tone: "primary",
            onSelect: (r) => void handleIssueForSlicing([r]),
          });
        }

        if (
          activeInventory === "raw-veneer" ||
          activeInventory === "plywood" ||
          activeInventory === "mdf" ||
          activeInventory === "consumables"
        ) {
          actions.push({
            id: "move-to-production",
            label: "Move to Warehouse",
            icon: Truck,
            onSelect: (r) => void handleOpenMoveDialog([r]),
          });
        }
      }

      return actions;
    },
    [activeInventory, activeSection, canEdit, navigate, warehouseId, warehouseName, handleOpenMoveDialog, handleIssueForSawing, handleIssueForSlicing]
  );

  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!warehouseId || isExporting) return;

    setIsExporting(true);
    try {
      const items = await exportStorageInventoryApi(activeInventory, {
        warehouseId,
        section: activeSection,
        ...(debouncedSearchValue.trim()
          ? { search: debouncedSearchValue.trim() }
          : {}),
      });

      if (items.length === 0) {
        alert("No records to export.");
        return;
      }

      exportRowsToCsv(
        items as any,
        [...STORAGE_EXPORT_COLUMNS],
        `storage-${activeInventory}`
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsExporting(false);
    }
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

  const showBulkBanner =
    activeSection === "inventory" &&
    selectedRows.length > 0 &&
    (activeInventory === "veneer-blocks" ||
      activeInventory === "raw-veneer" ||
      activeInventory === "plywood" ||
      activeInventory === "mdf" ||
      activeInventory === "consumables");

  const inventorySingularLabel =
    activeInventory === "raw-veneer"
      ? "raw veneer"
      : activeInventory === "plywood"
      ? "plywood"
      : activeInventory === "mdf"
      ? "MDF"
      : activeInventory === "consumables"
        ? "consumable"
        : "veneer block";

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

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Warehouses" },
        { label: warehouseName },
      ]}
      subtitle=" "
      title={warehouseName}
    >
      <Stack
        sx={(t) => ({
          gap: t.spacing(2),
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
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexWrap: "wrap", gap: 1.5 }}>
            <ClearableSearchField
              value={searchValue}
              onChange={setSearchValue}
              placeholder="Search inventory..."
              sx={{
                width: { xs: "100%", sm: 300 },
                maxWidth: "100%",
              }}
            />

            {activeInventory === "raw-veneer" ? (
              <Box sx={{ width: { xs: "100%", sm: 140 } }}>
                <ErpSelectField
                  value={rawVeneerTabLabelByValue[activeRawTab]}
                  onChange={(val) => {
                    const selectedRawTab =
                      rawVeneerTabValueByLabel[
                      val as keyof typeof rawVeneerTabValueByLabel
                      ] ?? "all";
                    updateParams({ rawTab: selectedRawTab });
                  }}
                  options={rawVeneerSourceSelectOptions}
                  size="dense"
                />
              </Box>
            ) : null}
          </Stack>

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
              disabled={isExporting}
              onClick={handleExport}
              sx={(t) => getListingToolbarOutlinedButtonSx(t)}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </Stack>
        </Stack>

        {showBulkBanner ? (
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
                {selectedRows.length} {inventorySingularLabel} records selected
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

                {activeInventory === "veneer-blocks" ? (
                  <>
                    <Button
                      variant="contained"
                      onClick={() => void handleIssueForSawing(selectedRows)}
                      startIcon={<Plus size={16} />}
                      sx={bulkPrimaryButtonSx}
                    >
                      Issue for Sawing
                    </Button>
                    <Button
                      variant="contained"
                      onClick={() => void handleIssueForSlicing(selectedRows)}
                      startIcon={<Plus size={16} />}
                      sx={bulkPrimaryButtonSx}
                    >
                      Issue for Slicing
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="contained"
                    onClick={() => void handleOpenMoveDialog(selectedRows)}
                    startIcon={<Truck size={16} />}
                    sx={bulkPrimaryButtonSx}
                  >
                    Move to Warehouse
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        ) : null}

        {activeInventory === "veneer-blocks" ? (
          <StorageVeneerBlocksInventory
            {...panelProps}
            searchValue={debouncedSearchValue}
            getRowActions={getRowActions}
          />
        ) : null}
        {activeInventory === "raw-veneer" ? (
          <StorageRawVeneerInventory
            {...panelProps}
            searchValue={debouncedSearchValue}
            getRowActions={getRowActions}
          />
        ) : null}
        {activeInventory === "plywood" ? (
          <StoragePlywoodInventory
            {...panelProps}
            searchValue={debouncedSearchValue}
            getRowActions={getRowActions}
          />
        ) : null}
        {activeInventory === "mdf" ? (
          <StorageMdfInventory
            {...panelProps}
            searchValue={debouncedSearchValue}
            getRowActions={getRowActions}
          />
        ) : null}
        {activeInventory === "consumables" ? (
          <StorageConsumablesInventory
            {...panelProps}
            searchValue={debouncedSearchValue}
            getRowActions={getRowActions}
          />
        ) : null}
      </Stack>

      {/* Move to Production Warehouse Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={isMoving ? undefined : () => setMoveDialogOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: (t) => ({
            borderRadius: `${t.customTokens.radius.lg}px`,
            overflow: "hidden",
            maxHeight: "90vh",
            height: { xs: "90vh", md: "84vh" },
            display: "flex",
            flexDirection: "column",
          }),
        }}
      >
        <DialogTitle
          sx={(t) => ({
            borderBottom: `1px solid ${t.customTokens.borders.default}`,
            px: 2.5,
            py: 1.75,
            flexShrink: 0,
          })}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={(t) => ({
                width: 36,
                height: 36,
                borderRadius: `${t.customTokens.radius.md}px`,
                display: "grid",
                placeItems: "center",
                backgroundColor: t.customTokens.brand.primaryScale[50],
                color: t.customTokens.brand.primary,
                flexShrink: 0,
              })}
            >
              <Truck size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>
                Move to Warehouse of Production
              </Typography>
              <Typography
                sx={(t) => ({
                  color: t.customTokens.text.secondary,
                  fontSize: "0.8125rem",
                })}
              >
                Moving {moveTargetRows.length} {inventorySingularLabel} record(s).
                Set quantity ({moveUnitLabel}) for each row.
              </Typography>
            </Box>
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={(t) => ({
            px: 2.5,
            pt: `${t.spacing(2.5)} !important`,
            pb: 2,
            backgroundColor: t.customTokens.surfaces.alt,
            overflowX: "hidden",
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            gap: 2,
          })}
        >
          {moveDialogError ? (
            <Alert
              severity="error"
              onClose={() => setMoveDialogError(null)}
              sx={(t) => ({
                borderRadius: `${t.customTokens.radius.md}px`,
                fontSize: "0.8125rem",
                flexShrink: 0,
                "& .MuiAlert-message": { fontWeight: 500 },
              })}
            >
              {moveDialogError}
            </Alert>
          ) : null}

          <Box
            sx={(t) => ({
              backgroundColor: t.customTokens.surfaces.surface,
              border: `1px solid ${t.customTokens.borders.default}`,
              borderRadius: `${t.customTokens.radius.md}px`,
              p: 2,
              flexShrink: 0,
            })}
          >
            <Stack spacing={0.75} sx={{ minWidth: 0 }}>
              <Typography
                variant="caption"
                sx={(t) => ({
                  fontWeight: 600,
                  color: t.customTokens.text.secondary,
                })}
              >
                Destination Production Warehouse
              </Typography>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={selectedProductionWarehouseId}
                onChange={(e) =>
                  setSelectedProductionWarehouseId(e.target.value)
                }
                disabled={
                  isLoadingWarehouses || productionWarehouses.length === 0
                }
              >
                {isLoadingWarehouses ? (
                  <MenuItem value="" disabled>
                    Loading production warehouses...
                  </MenuItem>
                ) : productionWarehouses.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active production warehouses available
                  </MenuItem>
                ) : (
                  productionWarehouses.map((wh) => (
                    <MenuItem key={wh.id} value={wh.id}>
                      {wh.name} ({wh.code})
                    </MenuItem>
                  ))
                )}
              </Select>
            </Stack>
          </Box>

          <Box
            sx={{
              flex: 1,
              minHeight: 220,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Typography
              sx={(t) => ({
                fontSize: "0.875rem",
                fontWeight: 700,
                color: t.customTokens.text.primary,
                flexShrink: 0,
              })}
            >
              Items to Transfer ({moveTargetRows.length})
            </Typography>

            <TableContainer
              sx={(t) => ({
                ...listingTableContainerSx(t),
                flex: 1,
                minHeight: 0,
                maxHeight: "min(48vh, 460px)",
                overflow: "auto",
              })}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      { label: "#", align: "left" as const, width: 48 },
                      { label: "Storage Sr No", align: "left" as const },
                      { label: "Item Name", align: "left" as const },
                      { label: "Invoice", align: "left" as const },
                      {
                        label: `Available (${moveUnitLabel})`,
                        align: "right" as const,
                      },
                      {
                        label: `Qty to Move (${moveUnitLabel}) *`,
                        align: "right" as const,
                      },
                      {
                        label: `Remaining (${moveUnitLabel})`,
                        align: "right" as const,
                      },
                      { label: "Grade *", align: "left" as const },
                    ].map((col) => (
                      <TableCell
                        key={col.label}
                        sx={(t) => ({
                          ...listingTableHeaderCellSx(t),
                          textAlign: col.align,
                          ...(col.width ? { width: col.width } : null),
                          whiteSpace: "nowrap",
                        })}
                      >
                        {col.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {moveTargetRows.map((row, index) => {
                    const available = getMoveRowAvailable(row);
                    const rawQty = moveQuantities[row.id] ?? "";
                    const selectedGrade = moveGrades[row.id] ?? "";
                    const enteredQty = Number(rawQty || 0);
                    const remaining = Math.max(
                      0,
                      available - (Number.isFinite(enteredQty) ? enteredQty : 0),
                    );
                    const invalid =
                      Boolean(rawQty) && isMoveQtyInvalid(row, rawQty);

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell sx={(t) => listingTableBodyCellSx(t)}>
                          {index + 1}
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            fontWeight: 600,
                            minWidth: 120,
                            whiteSpace: "nowrap",
                          })}
                        >
                          {row.storageSrNo || row.inwardSrNo || "—"}
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            minWidth: 160,
                            maxWidth: 260,
                            whiteSpace: "normal",
                          })}
                        >
                          {row.itemName || "—"}
                        </TableCell>
                        <TableCell sx={(t) => listingTableBodyCellSx(t)}>
                          {row.invoiceNo || "—"}
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            textAlign: "right",
                            fontWeight: 600,
                            color: t.customTokens.brand.primary,
                            whiteSpace: "nowrap",
                          })}
                        >
                          {available}
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            textAlign: "right",
                            minWidth: 130,
                          })}
                        >
                          <TextField
                            size="small"
                            type="number"
                            value={rawQty}
                            disabled={isMoving}
                            onChange={(e) =>
                              updateMoveQuantity(row.id, e.target.value)
                            }
                            error={invalid}
                            inputProps={{
                              min: 1,
                              max: available || undefined,
                              style: { textAlign: "right" },
                            }}
                            sx={(t) => ({
                              width: 112,
                              "& .MuiOutlinedInput-root": {
                                borderRadius: `${t.customTokens.radius.sm}px`,
                                backgroundColor: t.customTokens.surfaces.surface,
                                fontSize: t.typography.caption.fontSize,
                              },
                              "& .MuiInputBase-input": {
                                py: 0.75,
                                px: 1,
                              },
                            })}
                          />
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            textAlign: "right",
                            fontWeight: 600,
                            color:
                              remaining === 0
                                ? t.customTokens.text.secondary
                                : t.customTokens.text.primary,
                            whiteSpace: "nowrap",
                          })}
                        >
                          {remaining}
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            minWidth: 160,
                          })}
                        >
                          <Select
                            size="small"
                            fullWidth
                            displayEmpty
                            value={selectedGrade}
                            disabled={
                              isMoving ||
                              isLoadingGrades ||
                              gradeOptions.length === 0
                            }
                            onChange={(e) =>
                              updateMoveGrade(row.id, e.target.value)
                            }
                            error={!selectedGrade}
                            sx={(t) => ({
                              borderRadius: `${t.customTokens.radius.sm}px`,
                              backgroundColor: t.customTokens.surfaces.surface,
                              fontSize: t.typography.caption.fontSize,
                              "& .MuiSelect-select": {
                                py: 0.75,
                              },
                            })}
                          >
                            {isLoadingGrades ? (
                              <MenuItem value="" disabled>
                                Loading...
                              </MenuItem>
                            ) : gradeOptions.length === 0 ? (
                              <MenuItem value="" disabled>
                                No grades
                              </MenuItem>
                            ) : (
                              gradeOptions.map((grade) => {
                                const label = String(
                                  grade.gradeName || grade.name || "Grade",
                                );
                                return (
                                  <MenuItem
                                    key={String(grade.id)}
                                    value={String(grade.id)}
                                  >
                                    {label}
                                  </MenuItem>
                                );
                              })
                            )}
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box
            sx={(t) => ({
              backgroundColor: t.customTokens.surfaces.surface,
              border: `1px solid ${t.customTokens.borders.default}`,
              borderRadius: `${t.customTokens.radius.md}px`,
              p: 2,
              flexShrink: 0,
            })}
          >
            <Stack spacing={0.75}>
              <Typography
                variant="caption"
                sx={(t) => ({
                  fontWeight: 600,
                  color: t.customTokens.text.secondary,
                })}
              >
                Remark (Optional)
              </Typography>
              <TextField
                size="small"
                fullWidth
                multiline
                rows={2}
                placeholder="Enter remark..."
                value={moveRemark}
                onChange={(e) => setMoveRemark(e.target.value)}
                disabled={isMoving}
                sx={(t) => ({
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${t.customTokens.radius.sm}px`,
                    backgroundColor: t.customTokens.surfaces.surface,
                  },
                })}
              />
            </Stack>
          </Box>
        </DialogContent>

        <DialogActions
          sx={(t) => ({
            borderTop: `1px solid ${t.customTokens.borders.default}`,
            px: 2.5,
            py: 1.5,
            backgroundColor: t.customTokens.surfaces.surface,
            flexShrink: 0,
            gap: 1.25,
          })}
        >
          <Button
            variant="outlined"
            onClick={() => setMoveDialogOpen(false)}
            disabled={isMoving}
            sx={(t) => getListingToolbarOutlinedButtonSx(t)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleConfirmMove()}
            disabled={
              isMoving ||
              !selectedProductionWarehouseId ||
              moveTargetRows.length === 0 ||
              hasInvalidMoveQuantities ||
              hasMissingMoveGrades ||
              isLoadingGrades
            }
            sx={recordFormActionButtonSx}
          >
            {isMoving
              ? "Moving..."
              : `Confirm Move (${moveTargetRows.length})`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revert Dialog */}
      <Dialog
        open={revertDialogOpen}
        onClose={isReverting ? undefined : () => setRevertDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Revert to Inward Warehouse</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to revert item{" "}
              <strong>{revertTargetRow?.storageSrNo || revertTargetRow?.inwardSrNo || revertTargetRow?.itemName}</strong> back to inward?
            </Typography>

            {revertDialogError && (
              <Alert
                severity="error"
                onClose={() => setRevertDialogError(null)}
                sx={{
                  borderRadius: 1.5,
                  fontSize: "0.8125rem",
                  "& .MuiAlert-message": { fontWeight: 500 },
                }}
              >
                {revertDialogError}
              </Alert>
            )}

            <TextField
              size="small"
              fullWidth
              multiline
              rows={2}
              placeholder="Revert remark (optional)..."
              value={revertRemark}
              onChange={(e) => setRevertRemark(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={() => setRevertDialogOpen(false)}
            disabled={isReverting}
            sx={bulkSecondaryButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleConfirmRevert()}
            disabled={isReverting}
            sx={{
              minHeight: 36,
              px: theme.spacing(2),
              borderRadius: `${theme.customTokens.radius.md}px`,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            {isReverting ? "Reverting..." : "Confirm Revert"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global readable toast notification */}
      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={4000}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            variant="filled"
            sx={{
              width: "100%",
              fontWeight: 600,
              boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
              borderRadius: 1.5,
            }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </MasterPageShell>
  );
}
