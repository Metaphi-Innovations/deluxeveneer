import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleX,
  Eye,
  FileOutput,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { getInventoryPaths } from "../../inventory/shared";
import { canAccessPermission } from "../../permissions";
import {
  getListingToolbarButtonSx,
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  deleteInwardApi,
  fetchInwardColumnDropdown,
  fetchInwardsPaginated,
  getInwardInventoryTypeFromSlug,
  mapInwardListItemToRow,
  updateInwardQcStatusApi,
  type InwardQcStatus,
} from "../api/inwardApi";
import { type WarehouseInventoryRow } from "../shared/warehouseTableData";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "../../shared/columnFilters";

type InwardInventoryTab =
  | "veneer-blocks"
  | "raw-veneer"
  | "plywood"
  | "mdf";

type QcDialogState = {
  mode: "PASS" | "FAIL";
  row: WarehouseInventoryRow;
} | null;

const INWARD_SORT_FIELD_MAP: Record<string, string> = {
  inwardSrNo: "inwardSrNo",
  inwardDate: "inwardDate",
  invoiceNo: "invoiceNo",
  supplierName: "supplierName",
  currency: "currency",
  amount: "amount",
  totalAmount: "totalAmount",
  qcStatus: "qcStatus",
  qcRemark: "qcRemark",
  remark: "remark",
  itemName: "itemName",
};

function mapInwardSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return INWARD_SORT_FIELD_MAP[columnKey];
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) continue;
    filters[key] = filter.values;
  }

  return filters;
}

const inwardInventoryTabs = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
] as const satisfies readonly {
  label: string;
  value: InwardInventoryTab;
}[];

const inwardInventoryTitles: Record<InwardInventoryTab, string> = {
  "veneer-blocks": "Veneer Blocks",
  "raw-veneer": "Raw Veneer",
  plywood: "Plywood",
  mdf: "MDF",
};

const inwardListingColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "expenseAmount", label: "Expense Amount" },
    { key: "qcStatus", label: "QC Status" },
    { key: "qcRemark", label: "QC Remark" },
    { key: "remark", label: "Remark" },
  ];

interface InwardWarehousePageProps {
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
}

export function InwardWarehousePage({
  warehouseId,
  warehouseName,
  warehouseRootPath,
}: InwardWarehousePageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>("inwardDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [rows, setRows] = useState<WarehouseInventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [qcDialog, setQcDialog] = useState<QcDialogState>(null);
  const [isSubmittingQc, setIsSubmittingQc] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const activeInventory = getActiveInwardInventoryTab(
    searchParams.get("inventory"),
  );
  const activeTitle = inwardInventoryTitles[activeInventory];
  const canCreate = canAccessPermission("warehouseA", "create");
  const canEdit = canAccessPermission("warehouseA", "edit");
  const canView = canAccessPermission("warehouseA", "view");
  const isVeneerBlocks = activeInventory === "veneer-blocks";
  const activeInventoryListPath = `${warehouseRootPath}?inventory=${activeInventory}`;

  const loadInwards = useCallback(async () => {
    const inventoryType = getInwardInventoryTypeFromSlug(activeInventory);
    if (!inventoryType || !warehouseId) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const apiSortBy = mapInwardSortField(sortBy);
      const apiFilters = toApiColumnFilters(columnFilters);
      const result = await fetchInwardsPaginated({
        warehouseId,
        inventoryType,
        page,
        limit: rowsPerPage,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
        ...(apiSortBy ? { sortBy: apiSortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0
          ? { filters: apiFilters }
          : {}),
      });

      setRows(
        result.items.map((item) =>
          mapInwardListItemToRow(item, activeInventory),
        ),
      );
      setTotalCount(result.pagination.total);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load inward stock.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    activeInventory,
    columnFilters,
    isVeneerBlocks,
    page,
    rowsPerPage,
    searchValue,
    sortBy,
    sortOrder,
    warehouseId,
    reloadKey,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInwards();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadInwards]);

  const loadColumnDropdown = useCallback(
    async (columnKey: string) => {
      const inventoryType = getInwardInventoryTypeFromSlug(activeInventory);
      if (!inventoryType || !warehouseId) {
        return;
      }

      try {
        const result = await fetchInwardColumnDropdown({
          warehouseId,
          inventoryType,
          column: columnKey,
        });
        setFilterOptionsByColumn((current) => ({
          ...current,
          [columnKey]: result.options,
        }));
      } catch {
        setFilterOptionsByColumn((current) => ({
          ...current,
          [columnKey]: [],
        }));
      }
    },
    [activeInventory, warehouseId],
  );

  const addStockPath = useMemo(
    () =>
      buildInwardInventoryPath({
        mode: "add",
        inventorySlug: activeInventory,
        warehouseId,
        warehouseName,
        returnTo: activeInventoryListPath,
      }),
    [activeInventory, activeInventoryListPath, warehouseId, warehouseName],
  );

  const handleQcSubmit = useCallback(
    async (details: {
      remark: string;
      attachmentUrl: string | null;
    }) => {
      if (!qcDialog || isSubmittingQc) {
        return;
      }

      setActionError("");
      setIsSubmittingQc(true);

      try {
        await updateInwardQcStatusApi(qcDialog.row.id, {
          qcStatus: qcDialog.mode as InwardQcStatus,
          qcRemark: details.remark.trim() || null,
          qcAttachmentUrl: details.attachmentUrl,
        });
        setQcDialog(null);
        setReloadKey((current) => current + 1);
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Failed to update QC status.",
        );
      } finally {
        setIsSubmittingQc(false);
      }
    },
    [isSubmittingQc, qcDialog],
  );

  const [deleteTarget, setDeleteTarget] = useState<WarehouseInventoryRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    setActionError("");
    try {
      await deleteInwardApi(deleteTarget.id);
      setDeleteTarget(null);
      setReloadKey((current) => current + 1);
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Failed to delete inward record.",
      );
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, isDeleting]);

  const getRowActions = useMemo(
    () =>
      (_row: WarehouseInventoryRow): EnterpriseTableAction<WarehouseInventoryRow>[] => {
        const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [];

        if (canView) {
          actions.push({
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: (selectedRow) => {
              navigate(
                buildInwardInventoryPath({
                  mode: "view",
                  inventorySlug: selectedRow.inventorySlug,
                  recordId: selectedRow.inventoryRecordId,
                  warehouseId,
                  warehouseName,
                  returnTo: activeInventoryListPath,
                }),
              );
            },
          });
        }

        if (canEdit) {
          actions.push({
            id: "edit",
            label: "Edit",
            icon: Pencil,
            onSelect: (selectedRow) => {
              navigate(
                buildInwardInventoryPath({
                  mode: "edit",
                  inventorySlug: selectedRow.inventorySlug,
                  recordId: selectedRow.inventoryRecordId,
                  warehouseId,
                  warehouseName,
                  returnTo: activeInventoryListPath,
                }),
              );
            },
          });
        }

        if (canEdit) {
          actions.push({
            id: "qc-pass",
            label: "QC Pass",
            icon: BadgeCheck,
            onSelect: (selectedRow) => {
              setActionError("");
              setQcDialog({ mode: "PASS", row: selectedRow });
            },
          });

          actions.push({
            id: "qc-fail",
            label: "QC Fail",
            icon: CircleX,
            tone: "danger",
            onSelect: (selectedRow) => {
              setActionError("");
              setQcDialog({ mode: "FAIL", row: selectedRow });
            },
          });
        }

        return actions;
      },
    [
      activeInventoryListPath,
      canEdit,
      canView,
      navigate,
      warehouseId,
      warehouseName,
    ],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: warehouseName }, { label: activeTitle }]}
      subtitle="Incoming material and warehouse inventory."
      title={warehouseName}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <ModuleProcessTabs
          onChange={(value) => {
            setSearchParams({ inventory: value }, { replace: true });
            setPage(1);
            setColumnFilters({});
            setFilterOptionsByColumn({});
            setSearchValue("");
          }}
          tabs={inwardInventoryTabs}
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
            onChange={(value) => {
              setSearchValue(value);
              setPage(1);
            }}
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
            {canCreate ? (
              <Button
                component={RouterLink}
                to={addStockPath}
                startIcon={<Plus size={15} />}
                variant="contained"
                sx={(theme) => getListingToolbarButtonSx(theme)}
              >
                Add Stock
              </Button>
            ) : null}

            <Button
              variant="outlined"
              startIcon={<FileOutput size={15} />}
              disabled={rows.length === 0}
              onClick={() =>
                exportRowsToCsv(
                  rows,
                  inwardListingColumns,
                  `inward-${activeInventory}`,
                )
              }
              sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {actionError ? <Alert severity="error">{actionError}</Alert> : null}

        <EnterpriseDataTable
          key={`${warehouseRootPath}-${activeInventory}`}
          columns={inwardListingColumns}
          columnFilters={columnFilters}
          defaultRowsPerPage={10}
          emptyStateLabel={
            isLoading
              ? "Loading inward records..."
              : `No ${activeTitle.toLowerCase()} records are available.`
          }
          filterOptionsByColumn={filterOptionsByColumn}
          getRowActions={getRowActions}
          onColumnFilterOpen={(columnKey) => {
            void loadColumnDropdown(columnKey);
          }}
          onColumnFiltersChange={(next) => {
            setColumnFilters(next);
            setPage(1);
          }}
          pagination={{
            page,
            rowsPerPage,
            totalCount,
            onPageChange: setPage,
            onRowsPerPageChange: (next) => {
              setRowsPerPage(next);
              setPage(1);
            },
          }}
          rows={isLoading ? [] : rows}
          sorting={{
            sortBy,
            sortOrder,
            onSortChange: (nextSortBy, nextSortOrder) => {
              setSortBy(nextSortBy);
              setSortOrder(nextSortOrder);
              setPage(1);
            },
          }}
        />
      </Stack>

      <InwardQcDialog
        mode={qcDialog?.mode ?? "PASS"}
        open={Boolean(qcDialog)}
        submitting={isSubmittingQc}
        onClose={() => {
          if (!isSubmittingQc) {
            setQcDialog(null);
          }
        }}
        onSubmit={handleQcSubmit}
      />

      <Dialog
        open={Boolean(deleteTarget)}
        onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete inward record{" "}
            <strong>{deleteTarget?.invoiceNo || deleteTarget?.inwardSrNo || "selected record"}</strong>?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            disabled={isDeleting}
            onClick={() => setDeleteTarget(null)}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isDeleting}
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>
    </MasterPageShell>
  );
}

function InwardQcDialog({
  mode,
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  mode: "PASS" | "FAIL";
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (details: {
    remark: string;
    attachmentUrl: string | null;
  }) => void;
}) {
  const [remark, setRemark] = useState("");
  const [fileName, setFileName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (open) {
      setRemark("");
      setFileName("");
      setAttachmentUrl(null);
      setFileError("");
    }
  }, [open]);

  const title = mode === "PASS" ? "Mark QC Pass" : "Mark QC Fail";

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Remark"
            multiline
            minRows={3}
            onChange={(event) => setRemark(event.target.value)}
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
          disabled={submitting || Boolean(fileError)}
          onClick={() =>
            onSubmit({
              remark,
              attachmentUrl,
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

function getActiveInwardInventoryTab(
  value: string | null,
): InwardInventoryTab {
  if (
    value === "veneer-blocks" ||
    value === "raw-veneer" ||
    value === "plywood" ||
    value === "mdf"
  ) {
    return value;
  }

  return "veneer-blocks";
}

function buildInwardInventoryPath(input: {
  mode: "add" | "view" | "edit";
  inventorySlug: string;
  recordId?: string;
  warehouseId: string;
  warehouseName: string;
  returnTo: string;
}) {
  const paths = getInventoryPaths(
    input.inventorySlug,
    "issued",
    "warehouse-a",
  );
  const basePath =
    input.mode === "add"
      ? paths.add
      : input.mode === "view"
        ? paths.view(input.recordId ?? "")
        : paths.edit(input.recordId ?? "");

  const url = new URL(basePath, window.location.origin);
  url.searchParams.set("warehouse", "warehouse-a");
  url.searchParams.set("warehouseId", input.warehouseId);
  url.searchParams.set("warehouseName", input.warehouseName);
  url.searchParams.set("returnTo", input.returnTo);
  return `${url.pathname}?${url.searchParams.toString()}`;
}
