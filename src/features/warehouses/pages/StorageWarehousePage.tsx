import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, FileOutput, RotateCcw, Truck } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Stack,
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
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { useDebouncedValue } from "../../shared/useDebouncedValue";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import { type WarehouseInventoryRow } from "../shared/warehouseTableData";
import {
  exportStorageInventoryApi,
  fetchStorageProductionWarehouses,
  moveStorageItemToProductionApi,
  revertStorageItemApi,
  type StorageProductionWarehouseOption,
} from "../storage/api/storageApi";
import { fetchGradesApi } from "../../masters/grade-master/gradeMasterApi";
import type { MasterRecord } from "../../masters/shared/types";
import { StorageMdfInventory } from "../storage/StorageMdfInventory";
import { StoragePlywoodInventory } from "../storage/StoragePlywoodInventory";
import { StorageRawVeneerInventory } from "../storage/StorageRawVeneerInventory";
import { StorageVeneerBlocksInventory } from "../storage/StorageVeneerBlocksInventory";
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
  const [selectedGradeId, setSelectedGradeId] = useState("");
  const [moveRemark, setMoveRemark] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [isLoadingGrades, setIsLoadingGrades] = useState(false);

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

  // Move to production logic
  const handleOpenMoveDialog = useCallback(
    async (rowsToMove: WarehouseInventoryRow[]) => {
      setMoveTargetRows(rowsToMove);
      setMoveRemark("");
      setSelectedProductionWarehouseId("");
      setSelectedGradeId("");
      setIsLoadingWarehouses(true);
      setIsLoadingGrades(true);
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
        if (activeGrades.length > 0 && activeGrades[0]?.id) {
          setSelectedGradeId(String(activeGrades[0].id));
        }
      } catch (err) {
        console.error("Failed to load move-to-production options", err);
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
      !selectedGradeId ||
      moveTargetRows.length === 0 ||
      isMoving
    ) {
      return;
    }
    setIsMoving(true);
    try {
      for (const row of moveTargetRows) {
        await moveStorageItemToProductionApi(activeInventory, row.id, {
          productionWarehouseId: selectedProductionWarehouseId,
          gradeId: selectedGradeId,
          remark: moveRemark || null,
        });
      }
      setMoveDialogOpen(false);
      setSelectedRows([]);
      setSelectionResetKey((c) => c + 1);
      setRefreshTrigger((c) => c + 1);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Failed to move to production warehouse",
      );
    } finally {
      setIsMoving(false);
    }
  };

  // Revert logic
  const handleOpenRevertDialog = (row: WarehouseInventoryRow) => {
    setRevertTargetRow(row);
    setRevertRemark("");
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!revertTargetRow || isReverting) return;
    setIsReverting(true);
    try {
      await revertStorageItemApi(activeInventory, revertTargetRow.id, revertRemark || null);
      setRevertDialogOpen(false);
      setRevertTargetRow(null);
      setSelectedRows([]);
      setSelectionResetKey((c) => c + 1);
      setRefreshTrigger((c) => c + 1);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to revert item");
    } finally {
      setIsReverting(false);
    }
  };

  // Row actions for raw-veneer, plywood, mdf
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
          navigate(`/inventory/${activeInventory}/view/${targetInwardId}?warehouse=warehouse-b&warehouseId=${warehouseId}&warehouseName=${encodeURIComponent(warehouseName)}`);
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

        if (activeInventory === "raw-veneer" || activeInventory === "plywood" || activeInventory === "mdf") {
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
    [activeInventory, activeSection, canEdit, navigate, warehouseId, warehouseName, handleOpenMoveDialog]
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
    (activeInventory === "raw-veneer" || activeInventory === "plywood" || activeInventory === "mdf");

  const inventorySingularLabel =
    activeInventory === "raw-veneer"
      ? "raw veneer"
      : activeInventory === "plywood"
      ? "plywood"
      : activeInventory === "mdf"
      ? "MDF"
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
      subtitle="Main inventory storage and inspection."
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

                <Button
                  variant="contained"
                  onClick={() => void handleOpenMoveDialog(selectedRows)}
                  startIcon={<Truck size={16} />}
                  sx={bulkPrimaryButtonSx}
                >
                  Move to Warehouse
                </Button>
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
      </Stack>

      {/* Move to Production Warehouse Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={isMoving ? undefined : () => setMoveDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Move to Warehouse of Production</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Moving {moveTargetRows.length} {inventorySingularLabel} record(s) to production warehouse.
            </Typography>

            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Destination Production Warehouse
              </Typography>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={selectedProductionWarehouseId}
                onChange={(e) => setSelectedProductionWarehouseId(e.target.value)}
                disabled={isLoadingWarehouses || productionWarehouses.length === 0}
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

            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
                Grade
              </Typography>
              <Select
                size="small"
                fullWidth
                displayEmpty
                value={selectedGradeId}
                onChange={(e) => setSelectedGradeId(e.target.value)}
                disabled={isLoadingGrades || gradeOptions.length === 0}
              >
                {isLoadingGrades ? (
                  <MenuItem value="" disabled>
                    Loading grades...
                  </MenuItem>
                ) : gradeOptions.length === 0 ? (
                  <MenuItem value="" disabled>
                    No active grades in Grade Master
                  </MenuItem>
                ) : (
                  gradeOptions.map((grade) => {
                    const label = String(
                      grade.gradeName || grade.name || "Grade",
                    );
                    return (
                      <MenuItem key={String(grade.id)} value={String(grade.id)}>
                        {label}
                      </MenuItem>
                    );
                  })
                )}
              </Select>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="caption" sx={{ fontWeight: 600 }}>
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
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={() => setMoveDialogOpen(false)}
            disabled={isMoving}
            sx={bulkSecondaryButtonSx}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleConfirmMove()}
            disabled={
              isMoving ||
              !selectedProductionWarehouseId ||
              !selectedGradeId
            }
            sx={bulkPrimaryButtonSx}
          >
            {isMoving ? "Moving..." : "Confirm Move"}
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
    </MasterPageShell>
  );
}
