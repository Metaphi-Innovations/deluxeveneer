import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { CheckCircle2, Eye, Pencil, RotateCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import { ConfirmationDialog } from "../../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { toApiColumnFilters, type ColumnFilterValue } from "../../../../components/shared/columnFilters";
import { ModuleProcessTabs } from "../../../../components/navigation/ModuleProcessTabs";
import { ClearableSearchField } from "../../../shared/ClearableSearchField";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactoryActionConfirmDialog, type ProductionWarehouseOption } from "../../shared/FactoryActionConfirmDialog";
import {
  fetchSawingInspectionPending,
  fetchSawingInspectionDone,
  fetchSawingInspectionFail,
  fetchSawingInspectionDropdownsApi,
  revertSawingInspectionPendingApi,
  revertSawingInspectionDoneApi,
  revertSawingInspectionFailApi,
  issueSawingInspectionToWarehouseApi,
  editSawingInspectionDoneApi,
} from "../api/sawingInspectionApi";
import {
  SAWING_INSPECTION_PENDING_COLUMNS,
  SAWING_INSPECTION_DONE_COLUMNS,
  SAWING_INSPECTION_FAIL_COLUMNS,
  SAWING_INSPECTION_TABS,
  type SawingInspectionTab,
} from "../sawingInspectionColumns";

export function SawingInspectionListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") || "issued") as SawingInspectionTab;
  const activeTab: SawingInspectionTab = SAWING_INSPECTION_TABS.some((t: { value: string }) => t.value === tabParam)
    ? tabParam
    : "issued";

  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Rows state
  const [rows, setRows] = useState<any[]>([]);

  // Sorting
  const [sortConfig, setSortConfig] = useState<{
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
  }>({ sortBy: null, sortOrder: null });

  // Column Filters
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});

  // Revert Dialog state
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTargetRow, setRevertTargetRow] = useState<any | null>(null);
  const [revertRemark, setRevertRemark] = useState("");
  const [isReverting, setIsReverting] = useState(false);

  // Issue to Warehouse Dialog state (Done tab)
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [transferTargetRow, setTransferTargetRow] = useState<any | null>(null);

  // Edit Done Dialog state (Done tab)
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTargetRow, setEditTargetRow] = useState<any | null>(null);
  const [editRemark, setEditRemark] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Toast
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info";
  } | null>(null);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
    setSearchValue("");
    setPage(1);
    setSortConfig({ sortBy: null, sortOrder: null });
    setColumnFilters({});
  };

  const handleColumnFilterChange = (columnKey: string, filterVal: ColumnFilterValue) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) {
        delete next[columnKey];
      } else {
        next[columnKey] = filterVal;
      }
      return next;
    });
    setPage(1);
  };

  const handleColumnFilterClear = (columnKey: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[columnKey];
      return next;
    });
    setPage(1);
  };

  const handleColumnFilterOpen = useCallback((columnKey: string) => {
    const tabName = activeTab === "done" ? "done" : activeTab === "failed" ? "failed" : "pending";
    fetchSawingInspectionDropdownsApi(tabName).then((dropdowns) => {
      let rawOpts: string[] = [];
      if (columnKey === "storageSrNo") rawOpts = dropdowns.storageSrNos;
      else if (columnKey === "itemName") rawOpts = dropdowns.itemNames;
      else if (columnKey === "subCategory") rawOpts = dropdowns.subCategories;
      else if (columnKey === "batchNo" || columnKey === "logNo") rawOpts = dropdowns.logNos;
      else if (columnKey === "batchNoCode") rawOpts = dropdowns.batchNos;
      else if (columnKey === "remark") rawOpts = dropdowns.remarks;

      if (rawOpts.length > 0) {
        setFilterOptionsByColumn((prev) => ({
          ...prev,
          [columnKey]: rawOpts.map((s) => ({ value: s, label: s })),
        }));
      }
    }).catch(() => {});
  }, [activeTab]);

  // ── Load Data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const queryParams = {
        page,
        limit: rowsPerPage,
        search: searchValue.trim() || undefined,
        sortBy: sortConfig.sortBy || undefined,
        sortOrder: sortConfig.sortOrder || undefined,
        filters: (() => {
          const apiFilters = toApiColumnFilters(columnFilters);
          return Object.keys(apiFilters).length > 0 ? apiFilters : undefined;
        })(),
      };

      let result: { items: any[]; pagination: { total: number } };
      if (activeTab === "done") {
        result = await fetchSawingInspectionDone(queryParams);
      } else if (activeTab === "failed") {
        result = await fetchSawingInspectionFail(queryParams);
      } else {
        result = await fetchSawingInspectionPending(queryParams);
      }

      setRows(result.items || []);
      setTotalCount(result.pagination?.total || 0);
    } catch (err: any) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(err?.message || "Unable to load sawing inspection records.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, rowsPerPage, searchValue, sortConfig.sortBy, sortConfig.sortOrder, columnFilters, refreshTrigger]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 200);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  // ── Actions ───────────────────────────────────────────────────────

  const handleOpenRevert = (row: any) => {
    setRevertTargetRow(row);
    setRevertRemark("");
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!revertTargetRow || isReverting) return;
    setIsReverting(true);

    try {
      const rem = revertRemark.trim() || undefined;
      if (activeTab === "done") {
        await revertSawingInspectionDoneApi(revertTargetRow.id, rem);
      } else if (activeTab === "failed") {
        await revertSawingInspectionFailApi(revertTargetRow.id, rem);
      } else {
        await revertSawingInspectionPendingApi(revertTargetRow.id, rem);
      }

      setToastNotification({
        message: "Record reverted successfully.",
        severity: "success",
      });
      setRevertDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setToastNotification({
        message: err?.message || "Failed to revert record.",
        severity: "error",
      });
    } finally {
      setIsReverting(false);
    }
  };

  const handleOpenIssueWarehouse = (row: any) => {
    setTransferTargetRow(row);
    setTransferDialogOpen(true);
  };

  const handleConfirmIssueWarehouse = async (warehouse: ProductionWarehouseOption | null) => {
    if (!transferTargetRow) return;
    try {
      await issueSawingInspectionToWarehouseApi(transferTargetRow.id, {
        warehouseId: warehouse?.id || undefined,
        remark: "Issued to Production Warehouse from Sawing Inspection",
      });
      setToastNotification({
        message: `Item issued to ${warehouse?.name || "Production Warehouse"} successfully!`,
        severity: "success",
      });
      setTransferDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setToastNotification({
        message: err?.message || "Failed to issue item to warehouse.",
        severity: "error",
      });
    }
  };

  const handleOpenEdit = (row: any) => {
    setEditTargetRow(row);
    setEditRemark(row.remark || "");
    setEditDialogOpen(true);
  };

  const handleConfirmEdit = async () => {
    if (!editTargetRow || isEditing) return;
    setIsEditing(true);
    try {
      await editSawingInspectionDoneApi(editTargetRow.id, {
        remark: editRemark.trim() || undefined,
      });
      setToastNotification({
        message: "Inspection remark updated successfully.",
        severity: "success",
      });
      setEditDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setToastNotification({
        message: err?.message || "Failed to update record.",
        severity: "error",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const getRowActions = useCallback(
    (row: any): readonly EnterpriseTableAction<any>[] => {
      const actions: EnterpriseTableAction<any>[] = [];

      if (activeTab === "issued") {
        // Pending: View, Revert
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing-inspection/view/${r.id}`, { state: { record: r, tab: "issued" } });
          },
        });
        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (r: any) => handleOpenRevert(r),
        });
      } else if (activeTab === "done") {
        // Done: View, Edit, Issue to Warehouse, Revert
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing-inspection/view/${r.id}`, { state: { record: r, tab: "done" } });
          },
        });
        actions.push({
          id: "edit",
          label: "Edit",
          icon: Pencil,
          onSelect: (r: any) => handleOpenEdit(r),
        });
        if (!row.isTransferred) {
          actions.push({
            id: "issue-warehouse",
            label: "Issue to Production Warehouse",
            icon: CheckCircle2,
            tone: "primary",
            onSelect: (r: any) => handleOpenIssueWarehouse(r),
          });
        }
        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          disabled: Boolean(row.isTransferred),
          disabledReason: row.isTransferred ? "Transferred items cannot be reverted" : undefined,
          onSelect: (r: any) => handleOpenRevert(r),
        });
      } else {
        // Failed: View, Revert
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing-inspection/view/${r.id}`, { state: { record: r, tab: "failed" } });
          },
        });
        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (r: any) => handleOpenRevert(r),
        });
      }

      return actions;
    },
    [activeTab, navigate]
  );

  const currentColumns = useMemo(() => {
    switch (activeTab) {
      case "issued":
        return SAWING_INSPECTION_PENDING_COLUMNS;
      case "done":
        return SAWING_INSPECTION_DONE_COLUMNS;
      case "failed":
        return SAWING_INSPECTION_FAIL_COLUMNS;
      default:
        return SAWING_INSPECTION_PENDING_COLUMNS;
    }
  }, [activeTab]);

  return (
    <FactoryPageShell
      breadcrumbs={[{ label: "Factory" }, { label: "Sawing Inspection" }]}
      title="Sawing Inspection"
      processTabs={
        <ModuleProcessTabs
          onChange={handleTabChange}
          tabs={SAWING_INSPECTION_TABS}
          value={activeTab}
        />
      }
    >
      <Stack spacing={2}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <ClearableSearchField
            placeholder={`Search ${SAWING_INSPECTION_TABS.find((t: { value: string }) => t.value === activeTab)?.label}...`}
            value={searchValue}
            onChange={setSearchValue}
            sx={{ width: { xs: "100%", sm: 320 } }}
          />
        </Stack>

        {errorMessage ? (
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        ) : null}

        <EnterpriseDataTable
          columns={currentColumns}
          rows={rows}
          loading={isLoading}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          filterOptionsByColumn={filterOptionsByColumn}
          onColumnFilterOpen={handleColumnFilterOpen}
          sorting={{
            sortBy: sortConfig.sortBy,
            sortOrder: sortConfig.sortOrder,
            onSortChange: (newSortBy, newSortOrder) => {
              setSortConfig({ sortBy: newSortBy, sortOrder: newSortOrder });
            },
            onSortClear: () => {
              setSortConfig({ sortBy: null, sortOrder: null });
            },
          }}
          pagination={{
            page,
            rowsPerPage,
            totalCount,
            onPageChange: setPage,
            onRowsPerPageChange: (newLimit: number) => {
              setRowsPerPage(newLimit);
              setPage(1);
            },
          }}
          selectable={false}
          getRowActions={getRowActions}
          emptyStateLabel={`No records found in ${SAWING_INSPECTION_TABS.find((t: { value: string }) => t.value === activeTab)?.label}.`}
        />
      </Stack>

      {/* ── Revert Confirmation Dialog ── */}
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Revert"
        description={
          activeTab === "issued"
            ? "Are you sure you want to revert this inspection pending item back to Sawing Done?"
            : "Are you sure you want to revert this inspection item back to Inspection Pending?"
        }
        onClose={() => setRevertDialogOpen(false)}
        onConfirm={() => void handleConfirmRevert()}
        open={revertDialogOpen}
        title="Confirm Revert"
        tone="danger"
      />

      {/* ── Edit Done Dialog ── */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 600 }}>Edit Inspection Done</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Remark"
              fullWidth
              size="small"
              value={editRemark}
              onChange={(e) => setEditRemark(e.target.value)}
              placeholder="Enter remark"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleConfirmEdit} variant="contained" disabled={isEditing}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Issue to Production Warehouse Dialog ── */}
      <FactoryActionConfirmDialog
        confirmLabel="Issue"
        description="This passed Sawing item will be moved to Production Warehouse under the Sawing tab."
        onClose={() => setTransferDialogOpen(false)}
        onConfirm={handleConfirmIssueWarehouse}
        open={transferDialogOpen}
        showWarehouse={true}
        title="Issue to Production Warehouse"
      />

      {/* ── Toast Notification ── */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3500}
        onClose={() => setToastNotification(null)}
        open={Boolean(toastNotification)}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            sx={{ width: "100%", boxShadow: 3 }}
            variant="filled"
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </FactoryPageShell>
  );
}

export default SawingInspectionListPage;
