import { useCallback, useEffect, useMemo, useState } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  BadgeCheck,
  CircleX,
  ClipboardCheck,
  MoreHorizontal,
  Upload,
} from "lucide-react";

import { fetchWarehouseMasterPaginated } from "../../masters/warehouse-location-master/api/warehouseMasterApi";
import { actionMenuTriggerSx } from "../../shared/actionMenuStyles";
import { getListingToolbarOutlinedButtonSx } from "../../shared/buttonStyles";
import { AttachmentPreview } from "./AttachmentPreview";
import {
  getAutocompleteListboxSx,
  getAutocompletePaperSx,
  getAutocompletePopperSlotProps,
} from "../../shared/dropdownMenuStyles";
import {
  listingTableBodyCellSx,
  listingTableContainerSx,
  listingTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";
import {
  portalIconSize,
  portalIconStroke,
} from "../../shared/portalIconStandards";
import { RowActionsMenu } from "../../shared/RowActionsMenu";
import {
  fetchInwardById,
  updateInwardQcStatusApi,
  type InwardDetail,
  type InwardItemDetail,
  type InwardQcStatus,
} from "../api/inwardApi";
import { slugFromInventoryTypeLabel } from "../inward/supportedInwardTypes";

type QcConfirmState = {
  item: InwardItemDetail;
  mode: "PASS" | "FAIL";
} | null;

const QC_REMARK_MAX_LENGTH = 150;

type StorageWarehouseOption = {
  id: string;
  name: string;
  city: string;
  state: string;
};

type InwardQcUpdateDialogProps = {
  inwardId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

function normalizeLocation(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function formatWarehouseLocationLabel(
  name: string,
  city?: string | null,
  state?: string | null,
): string {
  const cityLabel = city?.trim() || "—";
  const stateLabel = state?.trim() || "—";
  return `${name} (${cityLabel}, ${stateLabel})`;
}

function pickDefaultStorageWarehouseId(
  warehouses: readonly StorageWarehouseOption[],
  inwardCity: string | null | undefined,
  inwardState: string | null | undefined,
  preferredId?: string | null,
): string | null {
  if (!warehouses.length) return null;

  if (preferredId && warehouses.some((warehouse) => warehouse.id === preferredId)) {
    return preferredId;
  }

  const sorted = [...warehouses].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
  const city = normalizeLocation(inwardCity);
  const state = normalizeLocation(inwardState);

  if (city) {
    const cityMatch = sorted.find(
      (warehouse) => normalizeLocation(warehouse.city) === city,
    );
    if (cityMatch) return cityMatch.id;
  }

  if (state) {
    const stateMatch = sorted.find(
      (warehouse) => normalizeLocation(warehouse.state) === state,
    );
    if (stateMatch) return stateMatch.id;
  }

  return sorted[0]?.id ?? null;
}

function formatDateDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | null | undefined): string {
  return formatAmountShared(value ?? 0);
}

function formatMeasure(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function normalizeQcLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pass") return "Pass";
  if (normalized === "fail") return "Fail";
  return "Pending";
}

function qcChipColor(
  label: string,
): "default" | "success" | "error" | "warning" {
  if (label === "Pass") return "success";
  if (label === "Fail") return "error";
  return "warning";
}

export function InwardQcUpdateDialog({
  inwardId,
  open,
  onClose,
  onUpdated,
}: InwardQcUpdateDialogProps) {
  const theme = useTheme();
  const [detail, setDetail] = useState<InwardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmState, setConfirmState] = useState<QcConfirmState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storageWarehouses, setStorageWarehouses] = useState<
    StorageWarehouseOption[]
  >([]);
  const [storageWarehousesLoading, setStorageWarehousesLoading] =
    useState(false);
  const [selectedStorageWarehouseId, setSelectedStorageWarehouseId] = useState<
    string | null
  >(null);
  const [hasUserPickedStorageWarehouse, setHasUserPickedStorageWarehouse] =
    useState(false);

  const loadDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetchInwardById(id);
      setDetail(result);
    } catch (error) {
      setDetail(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load inward items for QC.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStorageWarehouses = useCallback(async () => {
    setStorageWarehousesLoading(true);
    try {
      const result = await fetchWarehouseMasterPaginated({
        type: "Storage",
        status: true,
        limit: 200,
        sortBy: "name",
        sortOrder: "asc",
      });
      const options: StorageWarehouseOption[] = result.items
        .map((record) => ({
          id: String(record.id ?? ""),
          name: String(record.warehouseName ?? "").trim(),
          city: String(record.city ?? "").trim(),
          state: String(record.state ?? "").trim(),
        }))
        .filter((option) => option.id && option.name);
      setStorageWarehouses(options);
    } catch (error) {
      setStorageWarehouses([]);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load storage warehouses.",
      );
    } finally {
      setStorageWarehousesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !inwardId) {
      return;
    }

    setConfirmState(null);
    setIsSubmitting(false);
    setHasUserPickedStorageWarehouse(false);
    setSelectedStorageWarehouseId(null);
    void loadDetail(inwardId);
    void loadStorageWarehouses();
  }, [inwardId, loadDetail, loadStorageWarehouses, open]);

  useEffect(() => {
    if (!open || hasUserPickedStorageWarehouse || !storageWarehouses.length) {
      return;
    }

    setSelectedStorageWarehouseId(
      pickDefaultStorageWarehouseId(
        storageWarehouses,
        detail?.warehouseCity,
        detail?.warehouseState,
        detail?.storageWarehouseId ?? null,
      ),
    );
  }, [
    detail?.storageWarehouseId,
    detail?.warehouseCity,
    detail?.warehouseState,
    hasUserPickedStorageWarehouse,
    open,
    storageWarehouses,
  ]);

  const items = useMemo(() => detail?.items ?? [], [detail]);

  const selectedStorageWarehouse = useMemo(
    () =>
      storageWarehouses.find(
        (warehouse) => warehouse.id === selectedStorageWarehouseId,
      ) ?? null,
    [selectedStorageWarehouseId, storageWarehouses],
  );

  const qcCounts = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;

    for (const item of items) {
      const status = (item.qcStatus ?? "").trim().toUpperCase();
      if (status === "PASS") {
        passCount++;
      } else if (status === "FAIL") {
        failCount++;
      } else {
        pendingCount++;
      }
    }

    return { passCount, failCount, pendingCount };
  }, [items]);

  const handleConfirmSubmit = async (details: {
    remark: string;
    attachmentUrl: string | null;
    passQuantity?: number | null | undefined;
  }) => {
    if (!confirmState || isSubmitting) {
      return;
    }

    if (confirmState.mode === "PASS" && !selectedStorageWarehouseId) {
      setErrorMessage(
        "Select a storage warehouse before marking an item as Pass.",
      );
      setConfirmState(null);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await updateInwardQcStatusApi(confirmState.item.id, {
        qcStatus: confirmState.mode as InwardQcStatus,
        passQuantity: details.passQuantity ?? null,
        qcRemark: details.remark.trim() || null,
        qcAttachmentUrl: details.attachmentUrl,
        storageWarehouseId:
          confirmState.mode === "PASS" ? selectedStorageWarehouseId : null,
      });
      setConfirmState(null);
      if (inwardId) {
        await loadDetail(inwardId);
      }
      onUpdated();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update QC status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const overallQc = normalizeQcLabel(detail?.qcStatus);

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="lg"
        onClose={handleClose}
        open={open}
        PaperProps={{
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.lg}px`,
            overflow: "hidden",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }),
        }}
      >
        <DialogTitle
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.customTokens.borders.default}`,
            px: 2.5,
            py: 1.75,
            flexShrink: 0,
          })}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={(theme) => ({
                width: 36,
                height: 36,
                borderRadius: `${theme.customTokens.radius.md}px`,
                display: "grid",
                placeItems: "center",
                backgroundColor: theme.customTokens.brand.primaryScale[50],
                color: theme.customTokens.brand.primary,
                flexShrink: 0,
              })}
            >
              <ClipboardCheck size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>
                QC Update
              </Typography>
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: "0.8125rem",
                })}
              >
                Review and update quality status for every line on this inward.
              </Typography>
            </Box>
            {detail ? (
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Chip
                  label={`${qcCounts.passCount} Pass`}
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    "& .MuiChip-label": { px: 0.85 },
                  }}
                />
                <Chip
                  label={`${qcCounts.failCount} Fail`}
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{
                    height: 24,
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    "& .MuiChip-label": { px: 0.85 },
                  }}
                />
              </Stack>
            ) : null}
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={(theme) => ({
            px: 2.5,
            pt: `${theme.spacing(2.5)} !important`,
            pb: 2,
            backgroundColor: theme.customTokens.surfaces.alt,
            overflowX: "hidden",
            overflowY: "auto",
            flex: "1 1 auto",
            minHeight: 0,
          })}
        >
          <Stack spacing={2}>
            {detail ? (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.customTokens.surfaces.surface,
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  px: 2,
                  pt: 2,
                  pb: 1.75,
                })}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1.25, sm: 0 }}
                  divider={
                    <Divider
                      flexItem
                      orientation="vertical"
                      sx={{ display: { xs: "none", sm: "block" }, mx: 2 }}
                    />
                  }
                  useFlexGap
                  sx={{ flexWrap: "wrap", rowGap: 1.25 }}
                >
                  <SummaryField
                    label="Invoice"
                    value={detail.invoiceNo || "—"}
                  />
                  <SummaryField
                    label="Supplier"
                    value={detail.supplierName || "—"}
                  />
                  <SummaryField
                    label="Inward Sr No"
                    value={detail.inwardSrNo || "—"}
                  />
                  <SummaryField
                    label="Inward Date"
                    value={formatDateDisplay(detail.inwardDate)}
                  />
                  <SummaryField
                    label="Items"
                    value={`${items.length} total · ${qcCounts.passCount} pass · ${qcCounts.failCount} fail · ${qcCounts.pendingCount} pending`}
                  />
                </Stack>
              </Box>
            ) : null}

            <Box
              sx={(theme) => ({
                backgroundColor: theme.customTokens.surfaces.surface,
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                px: 2,
                py: 1.75,
              })}
            >
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                alignItems={{ xs: "stretch", sm: "flex-end" }}
              >
                <Autocomplete
                  disabled={isSubmitting || storageWarehousesLoading}
                  getOptionLabel={(option) =>
                    formatWarehouseLocationLabel(
                      option.name,
                      option.city,
                      option.state,
                    )
                  }
                  isOptionEqualToValue={(option, value) =>
                    option.id === value.id
                  }
                  loading={storageWarehousesLoading}
                  onChange={(_event, value) => {
                    setHasUserPickedStorageWarehouse(true);
                    setSelectedStorageWarehouseId(value?.id ?? null);
                    setErrorMessage("");
                  }}
                  options={storageWarehouses}
                  size="small"
                  sx={{
                    width: { xs: "100%", sm: 420 },
                    maxWidth: "100%",
                    flexShrink: 0,
                    "& .MuiInputBase-root": {
                      minHeight: 32,
                      height: 32,
                      py: 0,
                    },
                    "& .MuiInputBase-input": {
                      py: "4px !important",
                      fontSize: "0.8125rem",
                    },
                    "& .MuiInputLabel-root": {
                      fontSize: "0.8125rem",
                    },
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Storage warehouse"
                      placeholder="Select storage"
                      required
                      size="small"
                    />
                  )}
                  renderOption={(props, option) => (
                    <Box component="li" {...props} key={option.id}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
                        >
                          {option.name}
                        </Typography>
                        <Typography
                          sx={{
                            color: theme.customTokens.text.secondary,
                            fontSize: "0.6875rem",
                          }}
                        >
                          {[option.city || "—", option.state || "—"].join(", ")}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  slotProps={{
                    popper: getAutocompletePopperSlotProps(theme, 460),
                    paper: {
                      sx: getAutocompletePaperSx(theme),
                    },
                    listbox: {
                      sx: getAutocompleteListboxSx(theme, true),
                    },
                  }}
                  value={selectedStorageWarehouse}
                />

                <Box
                  sx={{
                    minWidth: 0,
                    pb: { xs: 0, sm: 0.35 },
                    flex: 1,
                  }}
                >
                  <Typography
                    sx={(currentTheme) => ({
                      color: currentTheme.customTokens.text.secondary,
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      mb: 0.25,
                    })}
                  >
                    Inward location
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      wordBreak: "break-word",
                    }}
                  >
                    {[
                      detail?.warehouseCity?.trim() || "—",
                      detail?.warehouseState?.trim() || "—",
                    ].join(", ")}
                  </Typography>
                </Box>
              </Stack>
            </Box>

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" py={6}>
                <CircularProgress size={28} />
                <Typography
                  sx={(theme) => ({
                    mt: 1.5,
                    color: theme.customTokens.text.secondary,
                    fontSize: "0.8125rem",
                  })}
                >
                  Loading line items…
                </Typography>
              </Stack>
            ) : items.length === 0 ? (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.customTokens.surfaces.surface,
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  px: 2,
                  py: 4,
                  textAlign: "center",
                })}
              >
                <Typography color="text.secondary">
                  No line items found for this inward.
                </Typography>
              </Box>
            ) : (
              <ItemQcTable
                disabled={isSubmitting}
                inventoryType={detail?.inventoryType}
                items={items}
                onFail={(item) => {
                  setErrorMessage("");
                  setConfirmState({ item, mode: "FAIL" });
                }}
                onPass={(item) => {
                  if (!selectedStorageWarehouseId) {
                    setErrorMessage(
                      "Select a storage warehouse before marking an item as Pass.",
                    );
                    return;
                  }
                  setErrorMessage("");
                  setConfirmState({ item, mode: "PASS" });
                }}
              />
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={(theme) => ({
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            px: 2.5,
            py: 1.5,
            backgroundColor: theme.customTokens.surfaces.surface,
            flexShrink: 0,
          })}
        >
          <Button
            disabled={isSubmitting}
            onClick={handleClose}
            variant="outlined"
            sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <InwardQcConfirmDialog
        itemName={confirmState?.item.itemName ?? ""}
        initialRemark={confirmState?.item.qcRemark ?? ""}
        initialAttachmentUrl={confirmState?.item.qcAttachmentUrl ?? null}
        initialPassQuantity={
          confirmState?.item.qcPassQuantity ??
          confirmState?.item.availableStock ??
          null
        }
        mode={confirmState?.mode ?? "PASS"}
        totalQuantity={
          confirmState?.item
            ? Number(getLineQty(confirmState.item, detail?.inventoryType) ?? 0) ||
              null
            : null
        }
        quantityUnit={getQtyUnitLabel(detail?.inventoryType)}
        allowPartialQuantity={
          !(detail?.inventoryType ?? "")
            .toUpperCase()
            .includes("VENEER_BLOCK") &&
          !(detail?.inventoryType ?? "")
            .toUpperCase()
            .includes("VENEER BLOCK")
        }
        open={Boolean(confirmState)}
        submitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setConfirmState(null);
          }
        }}
        onSubmit={handleConfirmSubmit}
      />
    </>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 120, flex: "1 1 120px" }}>
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.secondary,
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          mb: 0.35,
        })}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 600,
          lineHeight: 1.3,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function getQtyUnitLabel(inventoryType: string | undefined): string {
  const type = (inventoryType ?? "").toUpperCase();
  if (type.includes("RAW")) return "Leaves";
  if (type.includes("PLYWOOD") || type.includes("MDF")) return "Sheets";
  if (type.includes("VENEER_BLOCK") || type.includes("VENEER BLOCK")) {
    return "CBM";
  }
  return "Qty";
}

function getLineQty(item: InwardItemDetail, inventoryType: string | undefined) {
  const type = (inventoryType ?? "").toUpperCase();
  if (type.includes("RAW")) return item.noOfLeaves;
  if (type.includes("PLYWOOD") || type.includes("MDF")) return item.sheets;
  if (type.includes("VENEER_BLOCK") || type.includes("VENEER BLOCK")) {
    return item.cbm;
  }
  return item.sheets ?? item.noOfLeaves ?? item.cbm;
}

function getQcTableHeaders(inventoryType: string | undefined): string[] {
  const slug = slugFromInventoryTypeLabel(inventoryType);
  const qtyLabel = getQtyUnitLabel(inventoryType);
  const showPassFailQty = slug !== "veneer-blocks";

  const identityHeaders =
    slug === "raw-veneer"
      ? ([
          "Log Code",
          "Bundle",
          "Pallet No",
          "L",
          "W",
          "Thk",
          qtyLabel,
        ] as const)
      : slug === "plywood" || slug === "mdf"
        ? (["Pallet No", "L", "W", "Thk", qtyLabel] as const)
        : (["Batch No", "L", "W", "H", qtyLabel] as const);

  return [
    "#",
    "Item Name",
    "Sub Category",
    "HSN",
    ...identityHeaders,
    ...(showPassFailQty ? (["Passed", "Failed"] as const) : []),
    "Amount",
    "QC",
    "Remark",
    "Attachment",
    "Actions",
  ];
}

function ItemQcTable({
  items,
  inventoryType,
  disabled,
  onPass,
  onFail,
}: {
  items: readonly InwardItemDetail[];
  inventoryType?: string | undefined;
  disabled: boolean;
  onPass: (item: InwardItemDetail) => void;
  onFail: (item: InwardItemDetail) => void;
}) {
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const inventorySlug = slugFromInventoryTypeLabel(inventoryType);
  const isRawVeneer = inventorySlug === "raw-veneer";
  const isSheetBased =
    inventorySlug === "plywood" || inventorySlug === "mdf";
  /** Veneer blocks are whole units — no Passed/Failed qty columns. */
  const showPassFailQtyColumns = inventorySlug !== "veneer-blocks";
  const headers = getQcTableHeaders(inventoryType);

  const activeItem =
    items.find((item) => item.id === activeItemId) ?? null;

  const handleOpenActionMenu = (
    itemId: string,
    event: ReactMouseEvent<HTMLElement>,
  ) => {
    event.stopPropagation();
    setActiveItemId(itemId);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActiveItemId(null);
  };

  return (
    <>
      <TableContainer
        sx={(theme) => ({
          ...listingTableContainerSx(theme),
          borderRadius: `${theme.customTokens.radius.md}px`,
          maxHeight: "min(52vh, 420px)",
          overflow: "auto",
        })}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              {headers.map((label) => (
                <TableCell
                  key={label}
                  sx={(theme) => ({
                    ...listingTableHeaderCellSx(theme),
                    whiteSpace: "nowrap",
                    ...(label === "Actions"
                      ? { textAlign: "center", width: 56 }
                      : null),
                  })}
                >
                  {label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item, index) => {
              const qcLabel = normalizeQcLabel(item.qcStatus);
              const remark = item.qcRemark?.trim() || "";
              const attachmentUrl = item.qcAttachmentUrl?.trim() || "";

              return (
                <TableRow key={item.id} hover>
                  <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                    {index + 1}
                  </TableCell>
                  <TableCell
                    sx={(theme) => ({
                      ...listingTableBodyCellSx(theme),
                      fontWeight: 600,
                      minWidth: 140,
                      maxWidth: 220,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                    })}
                  >
                    {item.itemName || "Untitled item"}
                  </TableCell>
                  <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                    {item.itemSubCategoryName || "—"}
                  </TableCell>
                  <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                    {item.hsnCode || "—"}
                  </TableCell>

                  {isRawVeneer ? (
                    <>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {item.logCode || "—"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {item.bundleNumber || "—"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {item.palletNo || "—"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.length)}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.width)}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.thickness)}
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...listingTableBodyCellSx(theme),
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        })}
                      >
                        {formatMeasure(item.noOfLeaves)}
                      </TableCell>
                    </>
                  ) : isSheetBased ? (
                    <>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {item.palletNo || "—"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.length)}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.width)}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.thickness)}
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...listingTableBodyCellSx(theme),
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        })}
                      >
                        {formatMeasure(item.sheets)}
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {item.batchNo || "—"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.length)}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.width)}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {formatMeasure(item.height)}
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...listingTableBodyCellSx(theme),
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                        })}
                      >
                        {formatMeasure(item.cbm)}
                      </TableCell>
                    </>
                  )}

                  {showPassFailQtyColumns ? (
                    <>
                      <TableCell
                        sx={(theme) => ({
                          ...listingTableBodyCellSx(theme),
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                          color: "success.main",
                        })}
                      >
                        {qcLabel === "Pass"
                          ? formatMeasure(
                              item.qcPassQuantity ??
                                item.availableStock ??
                                getLineQty(item, inventoryType),
                            )
                          : qcLabel === "Fail"
                          ? "0"
                          : "—"}
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...listingTableBodyCellSx(theme),
                          whiteSpace: "nowrap",
                          fontWeight: 600,
                          color:
                            qcLabel === "Fail" ||
                            (item.rejectedStock != null && item.rejectedStock > 0)
                              ? "error.main"
                              : theme.customTokens.text.secondary,
                        })}
                      >
                        {qcLabel === "Fail"
                          ? formatMeasure(
                              item.qcFailQuantity ??
                                item.rejectedStock ??
                                getLineQty(item, inventoryType),
                            )
                          : qcLabel === "Pass"
                          ? formatMeasure(
                              item.qcFailQuantity ?? item.rejectedStock ?? 0,
                            )
                          : "—"}
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell
                    sx={(theme) => ({
                      ...listingTableBodyCellSx(theme),
                      whiteSpace: "nowrap",
                    })}
                  >
                    {formatMoney(item.amount)}
                  </TableCell>
                  <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                    <Chip
                      label={qcLabel}
                      color={qcChipColor(qcLabel)}
                      size="small"
                      sx={{ fontWeight: 700, height: 22 }}
                    />
                  </TableCell>
                  <TableCell
                    sx={(theme) => ({
                      ...listingTableBodyCellSx(theme),
                      minWidth: 140,
                      maxWidth: 240,
                      overflowWrap: "anywhere",
                      wordBreak: "break-word",
                      whiteSpace: "pre-wrap",
                      color: theme.customTokens.text.secondary,
                      fontSize: "0.75rem",
                    })}
                  >
                    {remark || "—"}
                  </TableCell>
                  <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                    {attachmentUrl ? (
                      <AttachmentPreview
                        url={attachmentUrl}
                        compact
                        title="QC Attachment"
                      />
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell
                    sx={(theme) => ({
                      ...listingTableBodyCellSx(theme),
                      width: 56,
                      textAlign: "center",
                    })}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <IconButton
                        size="small"
                        aria-label="Open row actions"
                        disabled={disabled}
                        onClick={(event) =>
                          handleOpenActionMenu(item.id, event)
                        }
                        sx={(theme) => actionMenuTriggerSx(theme)}
                      >
                        <MoreHorizontal
                          size={portalIconSize.md}
                          strokeWidth={portalIconStroke.default}
                        />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <RowActionsMenu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor && activeItem)}
        onClose={handleCloseActionMenu}
        minWidth={112}
        maxWidth={140}
        actions={
          activeItem
            ? [
                {
                  id: "pass",
                  label: "Pass",
                  icon: BadgeCheck,
                  tone: "primary",
                  disabled,
                  onSelect: () => onPass(activeItem),
                },
                {
                  id: "fail",
                  label: "Fail",
                  icon: CircleX,
                  tone: "danger",
                  disabled,
                  onSelect: () => onFail(activeItem),
                },
              ]
            : []
        }
      />
    </>
  );
}

export function InwardQcConfirmDialog({
  mode,
  open,
  submitting,
  itemName,
  totalQuantity,
  quantityUnit = "Qty",
  allowPartialQuantity = true,
  initialRemark,
  initialAttachmentUrl,
  initialPassQuantity,
  onClose,
  onSubmit,
}: {
  mode: "PASS" | "FAIL";
  open: boolean;
  submitting: boolean;
  itemName: string;
  totalQuantity?: number | null;
  quantityUnit?: string;
  /** When false (e.g. veneer blocks), pass/fail applies to the whole line — no qty picker. */
  allowPartialQuantity?: boolean;
  initialRemark?: string | null;
  initialAttachmentUrl?: string | null;
  initialPassQuantity?: number | null;
  onClose: () => void;
  onSubmit: (details: {
    remark: string;
    attachmentUrl: string | null;
    passQuantity?: number | null | undefined;
  }) => void;
}) {
  const [remark, setRemark] = useState("");
  const [fileName, setFileName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");
  const [passQtyInput, setPassQtyInput] = useState<string>("");

  useEffect(() => {
    if (open) {
      setRemark((initialRemark?.trim() ?? "").slice(0, QC_REMARK_MAX_LENGTH));
      setFileName("");
      setAttachmentUrl(initialAttachmentUrl ?? null);
      setFileError("");
      const defaultPass =
        initialPassQuantity != null
          ? initialPassQuantity
          : totalQuantity != null
            ? totalQuantity
            : null;
      setPassQtyInput(
        mode === "PASS" && defaultPass != null ? String(defaultPass) : ""
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const title = mode === "PASS" ? "Mark QC Pass" : "Mark QC Fail";

  const numTotal = totalQuantity != null ? Number(totalQuantity) : null;
  const numPass = passQtyInput !== "" ? Number(passQtyInput) : null;
  const calculatedFail =
    numTotal != null && numPass != null && !Number.isNaN(numPass)
      ? Math.max(0, numTotal - numPass)
      : 0;

  const isQtyValid =
    !allowPartialQuantity ||
    mode !== "PASS" ||
    numTotal == null ||
    (numPass != null && !Number.isNaN(numPass) && numPass >= 0 && numPass <= numTotal);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Stack spacing={2}>
          {itemName ? (
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.secondary,
                fontSize: "0.8125rem",
              })}
            >
              Item:{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                {itemName}
              </Box>
            </Typography>
          ) : null}

          {mode === "PASS" && !allowPartialQuantity ? (
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.secondary,
                fontSize: "0.8125rem",
              })}
            >
              Veneer blocks are QC’d as a whole block — no quantity selection.
            </Typography>
          ) : null}

          {mode === "PASS" && allowPartialQuantity && numTotal != null ? (
            <Box
              sx={(theme) => ({
                p: 2,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: "transparent",
                border: `1px solid ${theme.customTokens.borders.default}`,
              })}
            >
              <Typography
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  mb: 1.5,
                }}
              >
                Stock Quantity Breakdown ({quantityUnit})
              </Typography>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center">
                <Box
                  sx={{
                    width: { xs: "100%", sm: "33%" },
                    p: "8.5px 14px",
                    borderRadius: "4px",
                    border: (theme) => `1px solid ${theme.customTokens.borders.default}`,
                    backgroundColor: "transparent",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    boxSizing: "border-box",
                  }}
                >
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                      lineHeight: 1.2,
                    })}
                  >
                    Total {quantityUnit}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      mt: 0.25,
                    }}
                  >
                    {numTotal}
                  </Typography>
                </Box>
                <TextField
                  label={`Passed ${quantityUnit}`}
                  type="number"
                  size="small"
                  value={passQtyInput}
                  error={!isQtyValid}
                  helperText={!isQtyValid ? `Max ${numTotal}` : undefined}
                  onChange={(e) => setPassQtyInput(e.target.value)}
                  sx={{ width: { xs: "100%", sm: "33%" } }}
                />
                <TextField
                  label={`Failed ${quantityUnit}`}
                  value={calculatedFail}
                  size="small"
                  slotProps={{ input: { readOnly: true } }}
                  sx={{ width: { xs: "100%", sm: "33%" } }}
                />
              </Stack>
            </Box>
          ) : null}

          <TextField
            fullWidth
            label="Remark"
            multiline
            minRows={3}
            inputProps={{ maxLength: QC_REMARK_MAX_LENGTH }}
            helperText={`${remark.length}/${QC_REMARK_MAX_LENGTH}`}
            FormHelperTextProps={{
              sx: { textAlign: "right", mx: 0 },
            }}
            onChange={(event) =>
              setRemark(event.target.value.slice(0, QC_REMARK_MAX_LENGTH))
            }
            value={remark}
          />

          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              File Upload
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                component="label"
                disabled={submitting}
                startIcon={<Upload size={15} />}
                variant="outlined"
              >
                Choose File
                <input
                  accept="image/*,.pdf"
                  hidden
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setFileError("");

                    if (!file) {
                      setFileName("");
                      setAttachmentUrl(null);
                      return;
                    }

                    setFileName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setAttachmentUrl(
                        typeof reader.result === "string" ? reader.result : null,
                      );
                    };
                    reader.onerror = () => {
                      setFileError("Failed to read selected file.");
                      setAttachmentUrl(null);
                    };
                    reader.readAsDataURL(file);
                  }}
                />
              </Button>
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.8125rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName || "No file selected"}
              </Typography>
            </Stack>
            {fileError ? (
              <Typography color="error" sx={{ fontSize: "0.75rem" }}>
                {fileError}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={submitting} onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          disabled={submitting || Boolean(fileError) || !isQtyValid}
          color={mode === "FAIL" ? "error" : "primary"}
          onClick={() =>
            onSubmit({
              remark,
              attachmentUrl,
              passQuantity:
                allowPartialQuantity &&
                mode === "PASS" &&
                numPass != null &&
                !Number.isNaN(numPass)
                  ? numPass
                  : undefined,
            })
          }
          variant="contained"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
