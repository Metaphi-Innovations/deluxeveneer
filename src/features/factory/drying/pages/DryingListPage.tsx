import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { CheckCircle2, Eye, Pencil, Plus, RotateCcw, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { toApiColumnFilters, type ColumnFilterValue } from "../../../../components/shared/columnFilters";
import { ModuleProcessTabs } from "../../../../components/navigation/ModuleProcessTabs";
import { ClearableSearchField } from "../../../shared/ClearableSearchField";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactoryToolbar } from "../../shared/FactoryToolbar";
import { exportRowsToCsv, type CsvColumn } from "../../../shared/exportToCsv";
import { useDebouncedValue } from "../../../../query/useDebouncedValue";
import {
  createDryingProcessApi,
  editDryingDoneApi,
  exportDryingDataApi,
  fetchDryingDone,
  fetchDryingDropdowns,
  fetchDryingHistory,
  fetchDryingIssued,
  fetchDryingRejected,
  issueDryingForInspectionApi,
  rejectDryingDoneApi,
  revertDryingDoneApi,
  revertDryingIssueApi,
  revertDryingRejectedApi,
} from "../api/dryingApi";
import {
  DRYING_DONE_COLUMNS,
  DRYING_HISTORY_COLUMNS,
  DRYING_ISSUED_COLUMNS,
  DRYING_PROCESS_TABS,
  DRYING_REJECTED_COLUMNS,
  type DryingProcessTab,
} from "../dryingColumns";
import { DryingCreateDialog } from "../DryingCreateDialog";
import { DryingRejectDialog } from "../DryingRejectDialog";

export function DryingListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") || "issued") as DryingProcessTab;
  const activeTab: DryingProcessTab = DRYING_PROCESS_TABS.some((t) => t.value === tabParam)
    ? tabParam
    : "issued";

  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 350);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Rows state
  const [rows, setRows] = useState<any[]>([]);
  // Multiple selection for Done tab
  const [selectedDoneRows, setSelectedDoneRows] = useState<any[]>([]);
  const [selectionResetKey, setSelectionResetKey] = useState(0);

  // Create Drying Dialog state (from Issued tab)
  const [createDryingTargetRow, setCreateDryingTargetRow] = useState<any | null>(null);

  // Edit Drying Done Dialog state
  const [editDryingTargetRow, setEditDryingTargetRow] = useState<any | null>(null);

  // Revert Dialog state
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTargetRow, setRevertTargetRow] = useState<any | null>(null);
  const [revertRemark, setRevertRemark] = useState("");
  const [isReverting, setIsReverting] = useState(false);

  // Reject Dialog state (for Done tab)
  const [rejectDryingTargetRow, setRejectDryingTargetRow] = useState<any | null>(null);

  // Issue for Inspection Dialog state
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [inspectionTargetRows, setInspectionTargetRows] = useState<any[]>([]);
  const [inspectionRemark, setInspectionRemark] = useState("");
  const [isIssuingForInspection, setIsIssuingForInspection] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // Column Sorting & Filtering
  const [sortConfig, setSortConfig] = useState<{
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
  }>({ sortBy: null, sortOrder: null });

  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<Record<string, Array<{ value: string; label: string }>>>({});

  // Success Snackbar
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const handleTabChange = useCallback(
    (newTab: DryingProcessTab) => {
      setSearchParams({ tab: newTab });
      setPage(1);
      setSearchValue("");
      setColumnFilters({});
      setSelectedDoneRows([]);
      setSelectionResetKey((prev) => prev + 1);
    },
    [setSearchParams]
  );

  // Load dropdown options for column filter
  const handleColumnFilterOpen = useCallback(
    async (columnKey: string) => {
      try {
        const res = await fetchDryingDropdowns(activeTab, columnKey);
        const optionsList: string[] = Array.isArray(res) ? res : res?.options || [];

        // Dynamic filtering: keep options dynamic to what is present in this listing
        const presentInListing = new Set(
          rows
            .map((r: any) => {
              if (columnKey === "subCategory") return String(r.subCategory ?? r.itemSubCategoryName ?? "").trim();
              if (columnKey === "logCode" || columnKey === "logNo") return String(r.logCode ?? r.logNo ?? r.batchNo ?? "").trim();
              if (columnKey === "storageSrNo") return String(r.storageSrNo ?? "").trim();
              return String(r[columnKey] ?? "").trim();
            })
            .filter(Boolean)
        );

        const filteredList =
          presentInListing.size > 0
            ? optionsList.filter((opt) => presentInListing.has(String(opt).trim()))
            : optionsList;

        const finalSet = new Set([...filteredList]);
        if (presentInListing.size > 0 && finalSet.size === 0) {
          presentInListing.forEach((v) => finalSet.add(v));
        }

        const opts = Array.from(finalSet).map((opt) => ({ value: opt, label: opt }));
        setFilterOptionsByColumn((prev) => ({
          ...prev,
          [columnKey]: opts,
        }));
      } catch (err) {
        console.error("Failed to load filter dropdowns", err);
      }
    },
    [activeTab, rows]
  );

  // Fetch data from backend API
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setErrorMessage("");

    const apiFilters = toApiColumnFilters(columnFilters);
    const params = {
      page,
      limit: rowsPerPage,
      search: debouncedSearchValue.trim() || undefined,
      sortBy: sortConfig.sortBy || undefined,
      sortOrder: sortConfig.sortOrder || undefined,
      filters: apiFilters,
    };

    const fetcher =
      activeTab === "issued"
        ? fetchDryingIssued
        : activeTab === "done"
        ? fetchDryingDone
        : activeTab === "history"
        ? fetchDryingHistory
        : fetchDryingRejected;

    fetcher(params)
      .then((res) => {
        if (!isMounted) return;
        setRows(res.items || []);
        setTotalCount(res.pagination?.total || 0);
      })
      .catch((err) => {
        if (!isMounted) return;
        setErrorMessage(err.message || "Failed to load records from server");
        setRows([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeTab, page, rowsPerPage, debouncedSearchValue, sortConfig, columnFilters, refreshTrigger]);

  // Handle Export CSV
  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const apiFilters = toApiColumnFilters(columnFilters);
      let data = await exportDryingDataApi(activeTab, {
        search: (debouncedSearchValue || searchValue).trim() || undefined,
        sortBy: sortConfig.sortBy || undefined,
        sortOrder: sortConfig.sortOrder || undefined,
        filters: apiFilters,
      });

      if ((!data || data.length === 0) && rows.length > 0) {
        data = rows;
      }

      if (!data || data.length === 0) {
        setSnackbarMessage("No records available to export.");
        setSnackbarOpen(true);
        return;
      }

      const currentColumns =
        activeTab === "issued"
          ? DRYING_ISSUED_COLUMNS
          : activeTab === "done"
          ? DRYING_DONE_COLUMNS
          : activeTab === "history"
          ? DRYING_HISTORY_COLUMNS
          : DRYING_REJECTED_COLUMNS;

      const csvCols: CsvColumn<Record<string, unknown>>[] = currentColumns.map((col) => ({
        key: String(col.key),
        label: col.label,
      }));

      exportRowsToCsv(data, csvCols, `drying-${activeTab}`);
      setSnackbarMessage(`Successfully exported ${data.length} drying record(s).`);
      setSnackbarOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, columnFilters, debouncedSearchValue, searchValue, sortConfig, rows]);

  // Actions for table rows
  const getRowActions = useCallback(
    (row: any): EnterpriseTableAction[] => {
      const actions: EnterpriseTableAction[] = [];

      // View is available for all tabs
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: () => {
          navigate(`/factory/drying/view/${row.id}?tab=${activeTab}`);
        },
      });

      if (activeTab === "issued") {
        actions.push({
          id: "create-drying",
          label: "Create Drying",
          icon: Plus,
          onSelect: () => {
            setCreateDryingTargetRow(row);
          },
        });

        // Revert is only permitted if receivedLeaves === availableLeaves (unprocessed)
        const recLeaves = Number(row.receivedLeaves ?? row.noOfLeaves ?? 0);
        const availLeaves = Number(row.availableLeaves ?? 0);
        const isFullyUnprocessed = recLeaves > 0 && recLeaves === availLeaves;

        if (isFullyUnprocessed) {
          actions.push({
            id: "revert",
            label: "Revert",
            icon: RotateCcw,
            tone: "danger",
            onSelect: () => {
              setRevertTargetRow(row);
              setRevertRemark("");
              setRevertDialogOpen(true);
            },
          });
        }
      } else if (activeTab === "done") {
        actions.push({
          id: "edit",
          label: "Edit",
          icon: Pencil,
          onSelect: () => {
            setEditDryingTargetRow(row);
          },
        });

        actions.push({
          id: "issue-for-inspection",
          label: "Issue to Inspection",
          icon: CheckCircle2,
          tone: "primary",
          onSelect: () => {
            setInspectionTargetRows([row]);
            setInspectionRemark("");
            setInspectionDialogOpen(true);
          },
        });

        actions.push({
          id: "reject",
          label: "Reject",
          icon: XCircle,
          tone: "danger",
          onSelect: () => {
            setRejectDryingTargetRow(row);
          },
        });

        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: () => {
            setRevertTargetRow(row);
            setRevertRemark("");
            setRevertDialogOpen(true);
          },
        });
      } else if (activeTab === "rejected") {
        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: () => {
            setRevertTargetRow(row);
            setRevertRemark("");
            setRevertDialogOpen(true);
          },
        });
      }

      return actions;
    },
    [activeTab, navigate]
  );

  // Execute Revert
  const handleExecuteRevert = useCallback(async () => {
    if (!revertTargetRow) return;
    setIsReverting(true);
    try {
      if (activeTab === "issued") {
        await revertDryingIssueApi(revertTargetRow.id, revertRemark.trim() || undefined);
        setSnackbarMessage("Issued Drying record reverted successfully.");
      } else if (activeTab === "done") {
        await revertDryingDoneApi(revertTargetRow.id, revertRemark.trim() || undefined);
        setSnackbarMessage("Drying Done record reverted to Issued successfully.");
      } else if (activeTab === "rejected") {
        await revertDryingRejectedApi(revertTargetRow.id, revertRemark.trim() || undefined);
        setSnackbarMessage("Drying Rejected record reverted to Done successfully.");
      }
      setRevertDialogOpen(false);
      setRevertTargetRow(null);
      setSnackbarOpen(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to revert record");
    } finally {
      setIsReverting(false);
    }
  }, [activeTab, revertTargetRow, revertRemark]);

  // Execute Create Drying Dialog Save
  const handleSaveCreateDrying = useCallback(
    async ({
      driedLeaves,
      dryingDate,
      remark,
    }: {
      driedLeaves: number;
      dryingDate: string;
      remark: string;
    }) => {
      if (!createDryingTargetRow) return;
      try {
        const payload: { issueId: string; dryingDate: string; leavesToIssue: number; remark?: string } = {
          issueId: createDryingTargetRow.id,
          dryingDate,
          leavesToIssue: driedLeaves,
        };
        if (remark.trim()) payload.remark = remark.trim();
        await createDryingProcessApi(payload);

        setCreateDryingTargetRow(null);
        setSnackbarMessage(`Successfully processed ${driedLeaves} leaf/leaves for Drying.`);
        setSnackbarOpen(true);
        setRefreshTrigger((prev) => prev + 1);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to create drying run");
      }
    },
    [createDryingTargetRow]
  );

  // Execute Edit Drying Done Save
  const handleSaveEditDrying = useCallback(
    async ({
      driedLeaves,
      dryingDate,
      remark,
    }: {
      driedLeaves: number;
      dryingDate: string;
      remark: string;
    }) => {
      if (!editDryingTargetRow) return;
      try {
        const payload: { dryingDate?: string; noOfLeaves?: number; remark?: string } = {
          dryingDate,
          noOfLeaves: driedLeaves,
        };
        if (remark.trim()) payload.remark = remark.trim();
        await editDryingDoneApi(editDryingTargetRow.id, payload);

        setEditDryingTargetRow(null);
        setSnackbarMessage("Drying Done record updated successfully.");
        setSnackbarOpen(true);
        setRefreshTrigger((prev) => prev + 1);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to update drying record");
      }
    },
    [editDryingTargetRow]
  );

  // Execute Reject Drying Done
  const handleSaveRejectDrying = useCallback(
    async (rejectedLeaves: number) => {
      if (!rejectDryingTargetRow) return;
      try {
        await rejectDryingDoneApi(rejectDryingTargetRow.id, {
          rejectedLeaves,
          rejectionReason: "Drying quality defect",
          remark: "Rejected from Drying Done",
        });
        setRejectDryingTargetRow(null);
        setSnackbarMessage(`Successfully rejected ${rejectedLeaves} leaf/leaves.`);
        setSnackbarOpen(true);
        setRefreshTrigger((prev) => prev + 1);
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to reject drying leaves");
      }
    },
    [rejectDryingTargetRow]
  );

  // Execute Issue for Inspection
  const handleExecuteIssueForInspection = useCallback(async () => {
    if (inspectionTargetRows.length === 0) return;
    setIsIssuingForInspection(true);
    try {
      const doneIds = inspectionTargetRows.map((r) => r.id);
      const payload: { doneIds: string[]; inspectionDate?: string; remark?: string } = {
        doneIds,
        inspectionDate: new Date().toISOString().slice(0, 10),
      };
      if (inspectionRemark.trim()) payload.remark = inspectionRemark.trim();
      await issueDryingForInspectionApi(payload);

      setInspectionDialogOpen(false);
      setInspectionTargetRows([]);
      setSelectedDoneRows([]);
      setSelectionResetKey((prev) => prev + 1);
      setSnackbarMessage(`Issued ${doneIds.length} item(s) to Inspection successfully.`);
      setSnackbarOpen(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to issue items to inspection");
    } finally {
      setIsIssuingForInspection(false);
    }
  }, [inspectionTargetRows, inspectionRemark]);

  // Current columns based on active tab
  const currentColumns = useMemo(() => {
    switch (activeTab) {
      case "issued":
        return DRYING_ISSUED_COLUMNS;
      case "done":
        return DRYING_DONE_COLUMNS;
      case "history":
        return DRYING_HISTORY_COLUMNS;
      case "rejected":
        return DRYING_REJECTED_COLUMNS;
      default:
        return DRYING_ISSUED_COLUMNS;
    }
  }, [activeTab]);

  return (
    <FactoryPageShell
      breadcrumbs={[{ label: "Factory", to: "/factory" }, { label: "Drying" }]}
      title="Drying"
    >
      <Stack spacing={2}>
        <ModuleProcessTabs
          onChange={handleTabChange}
          tabs={DRYING_PROCESS_TABS}
          value={activeTab}
        />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <ClearableSearchField
            placeholder={`Search ${DRYING_PROCESS_TABS.find((t) => t.value === activeTab)?.label}...`}
            value={searchValue}
            onChange={(val: string) => {
              setSearchValue(val);
              setPage(1);
            }}
            sx={{ width: { xs: "100%", sm: 320 } }}
          />

          <Stack direction="row" spacing={1.25} alignItems="center" flexWrap="wrap" useFlexGap>
            {activeTab === "done" && selectedDoneRows.length > 0 ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  {selectedDoneRows.length} item(s) selected
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<CheckCircle2 size={16} />}
                  onClick={() => {
                    setInspectionTargetRows(selectedDoneRows);
                    setInspectionRemark("");
                    setInspectionDialogOpen(true);
                  }}
                  sx={{
                    backgroundColor: "primary.main",
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Issue to Inspection ({selectedDoneRows.length})
                </Button>
              </>
            ) : null}
            <FactoryToolbar
              disabled={isLoading || isExporting}
              onExport={handleExport}
            />
          </Stack>
        </Stack>

        {errorMessage && (
          <Alert severity="error" onClose={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <EnterpriseDataTable
          columns={currentColumns}
          rows={rows}
          loading={isLoading}
          loadingLabel={`Loading ${activeTab} drying items...`}
          columnFilters={columnFilters}
          onColumnFiltersChange={setColumnFilters}
          filterOptionsByColumn={filterOptionsByColumn}
          onColumnFilterOpen={handleColumnFilterOpen}
          sorting={{
            sortBy: sortConfig.sortBy,
            sortOrder: sortConfig.sortOrder,
            onSortChange: (newSortBy: string | null, newSortOrder: "asc" | "desc" | null) => {
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
          selectable={activeTab === "done"}
          selectOnRowClick={false}
          selectionResetKey={selectionResetKey}
          onSelectionChange={(selected: any) => setSelectedDoneRows(selected)}
          getRowActions={getRowActions}
          emptyStateLabel={`No records found in ${DRYING_PROCESS_TABS.find((t) => t.value === activeTab)?.label}.`}
        />
      </Stack>

      {/* Create Drying Dialog (from Issued tab) */}
      <DryingCreateDialog
        open={Boolean(createDryingTargetRow)}
        row={createDryingTargetRow}
        maximumLeaves={createDryingTargetRow?.availableLeaves}
        minimumLeaves={1}
        onClose={() => setCreateDryingTargetRow(null)}
        onSave={handleSaveCreateDrying}
      />

      {/* Edit Drying Dialog (from Done tab) */}
      <DryingCreateDialog
        mode="edit"
        open={Boolean(editDryingTargetRow)}
        row={editDryingTargetRow}
        maximumLeaves={
          (editDryingTargetRow?.noOfLeaves || 0) +
          (editDryingTargetRow?.dryingIssue?.availableLeaves || 0)
        }
        minimumLeaves={1}
        onClose={() => setEditDryingTargetRow(null)}
        onSave={handleSaveEditDrying}
      />

      {/* Reject Drying Dialog (from Done tab) */}
      <DryingRejectDialog
        open={Boolean(rejectDryingTargetRow)}
        row={rejectDryingTargetRow}
        onClose={() => setRejectDryingTargetRow(null)}
        onSave={handleSaveRejectDrying}
      />

      {/* Revert Confirmation Dialog */}
      <Dialog
        open={revertDialogOpen}
        onClose={() => {
          if (!isReverting) {
            setRevertDialogOpen(false);
            setRevertTargetRow(null);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Revert</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              {activeTab === "issued"
                ? `Are you sure you want to revert item ${revertTargetRow?.storageSrNo || ""} back to the storage warehouse?`
                : activeTab === "rejected"
                  ? `Are you sure you want to revert this rejected item back to Drying Done?`
                  : `Are you sure you want to revert this completed item back to the issued tab?`}
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Revert Remark (optional)"
              placeholder="Enter reason for reverting..."
              multiline
              rows={2}
              value={revertRemark}
              onChange={(e) => setRevertRemark(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => {
              setRevertDialogOpen(false);
              setRevertTargetRow(null);
            }}
            disabled={isReverting}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleExecuteRevert}
            disabled={isReverting}
            sx={{ textTransform: "none" }}
          >
            {isReverting ? "Reverting..." : "Revert"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue for Inspection Confirmation Dialog */}
      <Dialog
        open={inspectionDialogOpen}
        onClose={() => {
          if (!isIssuingForInspection) setInspectionDialogOpen(false);
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 600 }}>Confirm Issue for Inspection</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Do you want to issue <strong>{inspectionTargetRows.length}</strong> selected
              item(s) to Inspection?
            </Typography>
            <TextField
              fullWidth
              size="small"
              label="Remark (optional)"
              placeholder="Enter inspection remark..."
              value={inspectionRemark}
              onChange={(e) => setInspectionRemark(e.target.value)}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setInspectionDialogOpen(false)}
            disabled={isIssuingForInspection}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleExecuteIssueForInspection}
            disabled={isIssuingForInspection}
            sx={{ textTransform: "none" }}
          >
            {isIssuingForInspection ? "Issuing..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Notification Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%", boxShadow: 3 }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </FactoryPageShell>
  );
}
