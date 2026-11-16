import { useCallback, useState } from "react";
import { Eye, FileOutput, Package, Plus, RotateCcw, Truck } from "lucide-react";
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
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { MasterPageShell } from "../../masters/shared";
import {
  getListingToolbarButtonSx,
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
import { useDebouncedValue } from "../../../query/useDebouncedValue";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import { type WarehouseInventoryRow } from "../shared/warehouseTableData";
import {
  exportStorageInventoryApi,
  fetchStorageProductionWarehouses,
  batchMoveStorageItemsToProductionApi,
  revertStorageItemApi,
  type StorageProductionWarehouseOption,
} from "../storage/api/storageApi";
import {
  invalidateWarehouseProduction,
  invalidateWarehouseStorage,
} from "../../../query/queryClient";
import { StorageConsumablesInventory } from "../storage/StorageConsumablesInventory";
import {
  STORAGE_CONSUMABLES_COLUMNS,
  STORAGE_CONSUMABLES_HISTORY_COLUMNS,
  type StorageSectionTab,
} from "../storage/types";
import { WarehouseKpiCards } from "../components/WarehouseKpiCards";
import { useWarehouseDynamicKpis } from "../shared/useWarehouseDynamicKpis";
import { useSidebarWarehousesQuery } from "../../../query/useSidebarWarehousesQuery";

const CONSUMABLES_SECTION_TABS = [
  { label: "Inventory", value: "inventory" },
  { label: "History", value: "history" },
] as const satisfies readonly {
  label: string;
  value: StorageSectionTab;
}[];

export interface ConsumablesWarehousePageProps {
  warehouseId?: string;
  warehouseName?: string;
  warehouseRootPath?: string;
}

export function ConsumablesWarehousePage({
  warehouseName = "Consumables Warehouse",
}: ConsumablesWarehousePageProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: sidebarWarehouses } = useSidebarWarehousesQuery();
  const storageWarehouse = sidebarWarehouses?.find(
    (w) => w.warehouseType === "Storage",
  );
  const inwardWarehouse = sidebarWarehouses?.find(
    (w) => w.warehouseType === "Inward",
  );

  const storageWarehouseId =
    storageWarehouse?.id || "e28a08c8-6c74-47f4-87f4-ad7939ab9f9f";
  const inwardWarehouseId =
    inwardWarehouse?.id || "d5c832f8-11d6-408d-a5fa-e3b185b52d7e";
  const inwardWarehouseName = inwardWarehouse?.label || "Main Inward Warehouse";

  const rawSection = searchParams.get("section");
  const activeSection: StorageSectionTab =
    rawSection === "history" ? "history" : "inventory";

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 250);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRows, setSelectedRows] = useState<WarehouseInventoryRow[]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);
  const [isExporting, setIsExporting] = useState(false);

  // Dialog state for Revert and Move to Production
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertRow, setRevertRow] = useState<WarehouseInventoryRow | null>(null);
  const [revertReason, setRevertReason] = useState("");
  const [isReverting, setIsReverting] = useState(false);

  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [moveTargetRows, setMoveTargetRows] = useState<WarehouseInventoryRow[]>(
    [],
  );
  const [productionWarehouses, setProductionWarehouses] = useState<
    StorageProductionWarehouseOption[]
  >([]);
  const [selectedProductionWarehouseId, setSelectedProductionWarehouseId] =
    useState("");
  const [moveQuantities, setMoveQuantities] = useState<Record<string, string>>(
    {},
  );
  const [moveRemark, setMoveRemark] = useState("");
  const [isMoving, setIsMoving] = useState(false);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(false);
  const [moveDialogError, setMoveDialogError] = useState<string | null>(null);
  const [revertDialogError, setRevertDialogError] = useState<string | null>(
    null,
  );

  const kpis = useWarehouseDynamicKpis({
    warehouseType: "storage",
    warehouseId: storageWarehouseId,
    tab: "consumables",
  });

  const handleSectionChange = (value: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value === "inventory") {
          next.delete("section");
        } else {
          next.set("section", value);
        }
        return next;
      },
      { replace: true },
    );
    setSelectedRows([]);
    setSelectionResetKey((k) => k + 1);
  };

  const getMoveRowAvailable = (row: WarehouseInventoryRow) => {
    return Number(row.availableUnits || row.totalUnits || 0);
  };

  const isMoveQtyInvalid = (
    row: WarehouseInventoryRow,
    value: string,
  ): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    if (!Number.isFinite(num) || num <= 0) {
      return "Must be greater than 0";
    }
    const available = getMoveRowAvailable(row);
    if (num > available) {
      return `Exceeds available (${available})`;
    }
    return null;
  };

  const handleOpenMoveDialog = useCallback(
    async (rowsToMove: WarehouseInventoryRow[]) => {
      setMoveTargetRows(rowsToMove);
      setMoveRemark("");
      setSelectedProductionWarehouseId("");
      setMoveDialogError(null);
      setIsLoadingWarehouses(true);

      const initialQuantities: Record<string, string> = {};
      for (const row of rowsToMove) {
        const available = row.availableUnits || row.totalUnits || "";
        initialQuantities[row.id] = available ? String(available) : "";
      }
      setMoveQuantities(initialQuantities);

      setMoveDialogOpen(true);

      try {
        const warehouseResult = await fetchStorageProductionWarehouses(
          storageWarehouseId,
        );
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
      } catch (err) {
        setMoveDialogError(
          err instanceof Error
            ? err.message
            : "Failed to load production warehouses",
        );
      } finally {
        setIsLoadingWarehouses(false);
      }
    },
    [storageWarehouseId],
  );

  const handleSubmitMove = async () => {
    if (!selectedProductionWarehouseId) {
      setMoveDialogError("Please select a target production warehouse.");
      return;
    }
    if (moveTargetRows.length === 0) {
      setMoveDialogError("No items selected to move.");
      return;
    }

    for (const row of moveTargetRows) {
      const rawQty = moveQuantities[row.id] ?? "";
      const err = isMoveQtyInvalid(row, rawQty);
      if (err) {
        const label = row.itemName || row.storageSrNo || row.id;
        setMoveDialogError(`Invalid quantity for ${label}: ${err}`);
        return;
      }
    }

    setMoveDialogError(null);
    setIsMoving(true);

    try {
      const itemsPayload = moveTargetRows.map((row) => ({
        storageItemId: row.id,
        quantity: Number(moveQuantities[row.id] || 0),
      }));

      await batchMoveStorageItemsToProductionApi("consumables", {
        productionWarehouseId: selectedProductionWarehouseId,
        remark: moveRemark.trim() || null,
        items: itemsPayload,
      });

      setMoveDialogOpen(false);
      setSelectedRows([]);
      setSelectionResetKey((k) => k + 1);
      setRefreshTrigger((prev) => prev + 1);
      invalidateWarehouseStorage();
      invalidateWarehouseProduction();
    } catch (err) {
      setMoveDialogError(
        err instanceof Error
          ? err.message
          : "Failed to move items to production warehouse",
      );
    } finally {
      setIsMoving(false);
    }
  };

  const handleOpenRevertDialog = (row: WarehouseInventoryRow) => {
    setRevertRow(row);
    setRevertReason("");
    setRevertDialogError(null);
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!revertRow) return;
    setRevertDialogError(null);
    setIsReverting(true);
    try {
      await revertStorageItemApi(
        "consumables",
        revertRow.id,
        revertReason.trim() || null,
      );
      setRevertDialogOpen(false);
      setRevertRow(null);
      setRevertReason("");
      setSelectedRows([]);
      setSelectionResetKey((k) => k + 1);
      setRefreshTrigger((prev) => prev + 1);
      invalidateWarehouseStorage();
    } catch (err) {
      setRevertDialogError(
        err instanceof Error ? err.message : "Failed to revert item",
      );
    } finally {
      setIsReverting(false);
    }
  };

  const getRowActions = useCallback(
    (row: WarehouseInventoryRow): readonly EnterpriseTableAction<WarehouseInventoryRow>[] => {
      const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [];

      // View Form
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (r) => {
          const targetInwardId = r.referenceSrNo || r.id;
          navigate(
            `/inventory/consumables/view/${targetInwardId}?warehouseId=${inwardWarehouseId}&warehouseName=${encodeURIComponent(inwardWarehouseName)}&returnTo=/warehouses/consumables`,
          );
        },
      });

      // Edit Form (only in inventory tab)
      if (activeSection === "inventory") {
        actions.push({
          id: "edit",
          label: "Edit",
          icon: Package,
          onSelect: (r) => {
            const targetInwardId = r.referenceSrNo || r.id;
            navigate(
              `/inventory/consumables/edit/${targetInwardId}?warehouseId=${inwardWarehouseId}&warehouseName=${encodeURIComponent(inwardWarehouseName)}&returnTo=/warehouses/consumables`,
            );
          },
        });

        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (r) => handleOpenRevertDialog(r),
        });

        actions.push({
          id: "move-to-production",
          label: "Move to Warehouse",
          icon: Truck,
          onSelect: (r) => void handleOpenMoveDialog([r]),
        });
      }

      return actions;
    },
    [activeSection, inwardWarehouseId, inwardWarehouseName, navigate, handleOpenMoveDialog],
  );

  const handleExport = useCallback(async () => {
    if (isExporting || !storageWarehouseId) return;
    setIsExporting(true);
    try {
      const items = await exportStorageInventoryApi("consumables", {
        warehouseId: storageWarehouseId,
        section: activeSection,
        ...(debouncedSearchValue.trim()
          ? { search: debouncedSearchValue.trim() }
          : {}),
      });

      if (items.length === 0) {
        alert("No records to export.");
        return;
      }

      const columns =
        activeSection === "history"
          ? [...STORAGE_CONSUMABLES_HISTORY_COLUMNS]
          : [...STORAGE_CONSUMABLES_COLUMNS];

      exportRowsToCsv(
        items as any,
        columns,
        activeSection === "history"
          ? "Consumables-Warehouse-History"
          : "Consumables-Warehouse-Inventory",
      );
    } catch {
      alert("Failed to export consumables.");
    } finally {
      setIsExporting(false);
    }
  }, [activeSection, debouncedSearchValue, isExporting, storageWarehouseId]);

  const addStockPath = `/inventory/consumables/add?warehouse=warehouse-a&warehouseId=${inwardWarehouseId}&warehouseName=${encodeURIComponent(inwardWarehouseName)}&returnTo=/warehouses/consumables`;

  const showBulkBanner = activeSection === "inventory" && selectedRows.length > 0;

  const bulkPrimaryButtonSx = {
    ...recordFormActionButtonSx,
    borderColor: theme.palette.primary.main,
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      borderColor: theme.palette.primary.dark,
    },
  };

  const bulkSecondaryButtonSx = {
    minHeight: 36,
    px: theme.spacing(2),
    borderRadius: `${theme.customTokens.radius.md}px`,
    borderColor: theme.palette.primary.main,
    backgroundColor: "transparent",
    color: theme.palette.primary.main,
    "&:hover": {
      borderColor: theme.palette.primary.dark,
      backgroundColor: theme.palette.action.hover,
    },
  };

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Warehouses" },
        { label: "Consumables Warehouse" },
      ]}
      title={warehouseName}
      subtitle="Consumables warehouse inventory workspace"
    >
      <Stack spacing={3}>
        <ModuleProcessTabs
          tabs={CONSUMABLES_SECTION_TABS}
          value={activeSection}
          onChange={handleSectionChange}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "stretch", lg: "center" },
          }}
        >
          <ClearableSearchField
            placeholder="Search consumables..."
            value={searchValue}
            onChange={setSearchValue}
            sx={{
              width: { xs: "100%", sm: 320, lg: 420 },
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
              component={RouterLink}
              to={addStockPath}
              startIcon={<Plus size={15} />}
              variant="contained"
              sx={(t) => getListingToolbarButtonSx(t)}
            >
              Add Stock
            </Button>

            <Button
              variant="outlined"
              startIcon={<FileOutput size={15} />}
              disabled={isExporting}
              onClick={() => void handleExport()}
              sx={(t) => getListingToolbarOutlinedButtonSx(t)}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </Stack>
        </Stack>

        <WarehouseKpiCards cards={kpis.cards} isLoading={kpis.isLoading} />

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
                {selectedRows.length} consumables records selected
              </Typography>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.25}
                sx={{ width: { xs: "100%", sm: "auto" } }}
              >
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => {
                    setSelectedRows([]);
                    setSelectionResetKey((k) => k + 1);
                  }}
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

        <StorageConsumablesInventory
          warehouseId={storageWarehouseId}
          warehouseName={warehouseName}
          warehouseRootPath="/warehouses/consumables"
          section={activeSection}
          searchValue={debouncedSearchValue}
          onRefreshTrigger={refreshTrigger}
          onSelectionChange={setSelectedRows}
          selectionResetKey={selectionResetKey}
          getRowActions={getRowActions}
        />
      </Stack>

      {/* Move to Production Warehouse Dialog */}
      <Dialog
        open={moveDialogOpen}
        onClose={isMoving ? undefined : () => setMoveDialogOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${theme.customTokens.radius.lg}px`,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pb: 1.5,
          }}
        >
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Move Consumables to Production Warehouse
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select destination production warehouse and quantity to move.
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent
          dividers
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
            py: 2.5,
          }}
        >
          {moveDialogError ? (
            <Alert
              severity="error"
              onClose={() => setMoveDialogError(null)}
              sx={{
                borderRadius: `${theme.customTokens.radius.md}px`,
                "& .MuiAlert-message": { fontSize: "0.875rem" },
              }}
            >
              {moveDialogError}
            </Alert>
          ) : null}

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Destination Production Warehouse *
            </Typography>
            <Select
              size="small"
              value={selectedProductionWarehouseId}
              onChange={(e) => setSelectedProductionWarehouseId(e.target.value)}
              disabled={isLoadingWarehouses || isMoving}
              displayEmpty
              fullWidth
              sx={{
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
              }}
            >
              <MenuItem value="" disabled>
                {isLoadingWarehouses
                  ? "Loading production warehouses..."
                  : "Select production warehouse"}
              </MenuItem>
              {productionWarehouses.map((wh) => (
                <MenuItem key={wh.id} value={wh.id}>
                  {wh.name} {wh.code ? `(${wh.code})` : ""}
                </MenuItem>
              ))}
            </Select>
          </Stack>

          <Stack spacing={1} sx={{ flex: 1, minHeight: 0 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Items to Move ({moveTargetRows.length})
            </Typography>
            <TableContainer
              sx={{
                ...listingTableContainerSx(theme),
                maxHeight: 260,
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
              }}
            >
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    {[
                      { label: "#", align: "left" as const, width: 48 },
                      { label: "Storage Sr No", align: "left" as const },
                      { label: "Item Name", align: "left" as const },
                      { label: "Invoice", align: "left" as const },
                      { label: "Available (Qty)", align: "right" as const },
                      { label: "Qty to Move *", align: "right" as const },
                      { label: "Remaining", align: "right" as const },
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
                          })}
                        >
                          {available}
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            textAlign: "right",
                            width: 140,
                          })}
                        >
                          <TextField
                            size="small"
                            type="number"
                            value={rawQty}
                            onChange={(e) =>
                              setMoveQuantities((prev) => ({
                                ...prev,
                                [row.id]: e.target.value,
                              }))
                            }
                            error={Boolean(invalid)}
                            helperText={invalid ?? undefined}
                            disabled={isMoving}
                            inputProps={{
                              min: 1,
                              max: available,
                              step: 1,
                              style: { textAlign: "right", padding: "4px 8px" },
                            }}
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell
                          sx={(t) => ({
                            ...listingTableBodyCellSx(t),
                            textAlign: "right",
                            color:
                              remaining === 0
                                ? t.palette.text.disabled
                                : t.palette.text.primary,
                          })}
                        >
                          {remaining}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Remark (Optional)
            </Typography>
            <TextField
              size="small"
              multiline
              rows={2}
              value={moveRemark}
              onChange={(e) => setMoveRemark(e.target.value)}
              placeholder="Enter transfer remark..."
              disabled={isMoving}
              fullWidth
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${theme.customTokens.radius.md}px`,
                },
              }}
            />
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            justifyContent: "flex-end",
            gap: 1.5,
          }}
        >
          <Button
            variant="outlined"
            onClick={() => setMoveDialogOpen(false)}
            disabled={isMoving}
            sx={{
              minHeight: 36,
              borderRadius: `${theme.customTokens.radius.md}px`,
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmitMove()}
            disabled={isMoving || isLoadingWarehouses}
            startIcon={<Truck size={16} />}
            sx={{
              minHeight: 36,
              borderRadius: `${theme.customTokens.radius.md}px`,
            }}
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
        <DialogTitle sx={{ fontWeight: 600 }}>
          Revert to Inward Warehouse
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {revertDialogError && (
              <Alert
                severity="error"
                onClose={() => setRevertDialogError(null)}
              >
                {revertDialogError}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to revert item{" "}
              <strong>
                {revertRow?.itemName || revertRow?.storageSrNo || "this item"}
              </strong>{" "}
              back to the inward warehouse?
            </Typography>
            <TextField
              label="Reason (optional)"
              multiline
              rows={2}
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              fullWidth
              size="small"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button
            variant="outlined"
            onClick={() => setRevertDialogOpen(false)}
            disabled={isReverting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleConfirmRevert()}
            disabled={isReverting}
          >
            {isReverting ? "Reverting..." : "Revert"}
          </Button>
        </DialogActions>
      </Dialog>
    </MasterPageShell>
  );
}
