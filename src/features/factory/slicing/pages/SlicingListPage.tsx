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

import { ConfirmationDialog } from "../../../../components/feedback/ConfirmationDialog";
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
  fetchSlicingIssued,
  fetchSlicingDone,
  fetchSlicingHistory,
  fetchSlicingRejected,
  revertSlicingDoneApi,
  revertSlicingIssueApi,
  revertSlicingRejectedApi,
  rejectSlicingDoneApi,
  issueSlicingForDryingApi,
  fetchSlicingDropdownsApi,
  exportSlicingDataApi,
} from "../api/slicingApi";
import {
  SLICING_DONE_COLUMNS,
  SLICING_HISTORY_COLUMNS,
  SLICING_ISSUED_COLUMNS,
  SLICING_PROCESS_TABS,
  SLICING_REJECTED_COLUMNS,
  type SlicingProcessTab,
} from "../slicingColumns";
import { issueFactoryWork } from "../../shared/factoryIssuedWorkStore";

export function SlicingListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") || "issued") as SlicingProcessTab;
  const activeTab: SlicingProcessTab = SLICING_PROCESS_TABS.some((t) => t.value === tabParam)
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

  // Dialog states for Revert / Reject
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTargetRow, setRevertTargetRow] = useState<any | null>(null);
  const [revertRemark, setRevertRemark] = useState("");
  const [isReverting, setIsReverting] = useState(false);

  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectTargetRow, setRejectTargetRow] = useState<any | null>(null);
  const [rejectRemark, setRejectRemark] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Dialog state for Issue for Drying confirmation
  const [dryingDialogOpen, setDryingDialogOpen] = useState(false);
  const [dryingTargetRows, setDryingTargetRows] = useState<any[]>([]);
  const [dryingRemark, setDryingRemark] = useState("");
  const [isIssuingForDrying, setIsIssuingForDrying] = useState(false);
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
    (newTab: SlicingProcessTab) => {
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
        const res = await fetchSlicingDropdownsApi(activeTab, columnKey);
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
        ? fetchSlicingIssued
        : activeTab === "done"
        ? fetchSlicingDone
        : activeTab === "history"
        ? fetchSlicingHistory
        : fetchSlicingRejected;

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
      let data = await exportSlicingDataApi(activeTab, {
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
          ? SLICING_ISSUED_COLUMNS
          : activeTab === "done"
          ? SLICING_DONE_COLUMNS
          : activeTab === "history"
          ? SLICING_HISTORY_COLUMNS
          : SLICING_REJECTED_COLUMNS;

      const csvCols: CsvColumn<Record<string, unknown>>[] = currentColumns.map((col) => ({
        key: String(col.key),
        label: col.label,
      }));

      exportRowsToCsv(data, csvCols, `slicing-${activeTab}`);
      setSnackbarMessage(`Successfully exported ${data.length} slicing record(s).`);
      setSnackbarOpen(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  }, [activeTab, columnFilters, searchValue, sortConfig, rows]);

  // Actions for table rows
  const getRowActions = useCallback(
    (row: any): EnterpriseTableAction[] => {
      const actions: EnterpriseTableAction[] = [];

      // View is always available
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: () => {
          navigate(`/factory/slicing/view/${row.id}?tab=${activeTab}`);
        },
      });

      if (activeTab === "issued") {
        actions.push({
          id: "create-process",
          label: "Process Slicing",
          icon: Plus,
          onSelect: () => {
            navigate("/factory/slicing/add", {
              state: {
                sourceItem: row,
                sourceRow: row,
                issueId: row.id,
                storageWarehouseId: row.storageWarehouseId,
              },
            });
          },
        });

        const recCbm = Number(row.receivedCbm ?? row.cbm);
        const availCbm = Number(row.availableCbm);
        const isFullyUnprocessed =
          !isNaN(recCbm) &&
          !isNaN(availCbm) &&
          recCbm > 0 &&
          Math.abs(recCbm - availCbm) < 0.0001;

        if (isFullyUnprocessed) {
          actions.push({
            id: "revert",
            label: "Revert Issue",
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
            navigate(`/factory/slicing/edit/${row.doneId || row.id}`);
          },
        });

        actions.push({
          id: "issue-for-drying",
          label: "Issue for Drying",
          icon: CheckCircle2,
          tone: "primary",
          onSelect: () => {
            setDryingTargetRows([row]);
            setDryingRemark("");
            setDryingDialogOpen(true);
          },
        });

        actions.push({
          id: "reject",
          label: "Reject Output",
          icon: XCircle,
          tone: "danger",
          onSelect: () => {
            setRejectTargetRow(row);
            setRejectRemark("");
            setRejectDialogOpen(true);
          },
        });

        actions.push({
          id: "revert",
          label: "Revert Done",
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
          label: "Revert Reject",
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

  // Submit Revert Dialog
  const handleConfirmRevert = async () => {
    if (!revertTargetRow) return;
    setIsReverting(true);
    try {
      if (activeTab === "issued") {
        await revertSlicingIssueApi(revertTargetRow.id, revertRemark);
        setSnackbarMessage("Issued Slicing record reverted successfully");
      } else if (activeTab === "done") {
        const doneId = revertTargetRow.doneId || revertTargetRow.id;
        await revertSlicingDoneApi(doneId, revertRemark);
        setSnackbarMessage("Slicing Done record reverted successfully");
      } else if (activeTab === "rejected") {
        await revertSlicingRejectedApi(revertTargetRow.id, revertRemark);
        setSnackbarMessage("Rejected Slicing record reverted successfully");
      }
      setSnackbarOpen(true);
      setRevertDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to revert record");
    } finally {
      setIsReverting(false);
    }
  };

  // Submit Reject Dialog
  const handleConfirmReject = async () => {
    if (!rejectTargetRow) return;
    setIsRejecting(true);
    try {
      await rejectSlicingDoneApi(rejectTargetRow.id, rejectRemark);
      setSnackbarMessage("Slicing output rejected successfully");
      setSnackbarOpen(true);
      setRejectDialogOpen(false);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reject output");
    } finally {
      setIsRejecting(false);
    }
  };

  // Submit Issue for Drying Dialog
  const handleConfirmIssueForDrying = async () => {
    if (dryingTargetRows.length === 0) return;
    setIsIssuingForDrying(true);
    try {
      const ids = dryingTargetRows.map((r) => r.id);
      await issueSlicingForDryingApi({
        outputDetailIds: ids,
        remark: dryingRemark,
      });

      // Synchronize with Factory Listing for Drying
      for (const row of dryingTargetRows) {
        issueFactoryWork({
          destinationProcess: "Drying",
          sourceSlug: "slicing",
          sourceProcess: "Slicing",
          sourceWarehouseName: row.storageWarehouseName || row.warehouseName || "Warehouse B",
          sourceRow: {
            ...row,
            issueDate: new Date().toISOString().slice(0, 10),
            issuedDate: new Date(),
            remark: dryingRemark || row.remark || "",
            noOfLeaves: String(row.noOfLeaves ?? row.availableLeaves ?? row.receivedLeaves ?? "0"),
            availableLeaves: String(row.availableLeaves ?? row.noOfLeaves ?? "0"),
            receivedLeaves: String(row.receivedLeaves ?? row.noOfLeaves ?? "0"),
            totalLeaves: String(row.noOfLeaves ?? row.availableLeaves ?? "0"),
            totalSqMeter: row.totalSqMeter ?? row.sqm ?? "0",
          },
        });
      }

      setSnackbarMessage(
        `${ids.length} output item${ids.length > 1 ? "s" : ""} issued to Drying successfully`
      );
      setSnackbarOpen(true);
      setDryingDialogOpen(false);
      setSelectedDoneRows([]);
      setSelectionResetKey((prev) => prev + 1);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to issue outputs for drying");
    } finally {
      setIsIssuingForDrying(false);
    }
  };

  const currentColumns = useMemo(() => {
    switch (activeTab) {
      case "issued":
        return SLICING_ISSUED_COLUMNS;
      case "done":
        return SLICING_DONE_COLUMNS;
      case "history":
        return SLICING_HISTORY_COLUMNS;
      case "rejected":
        return SLICING_REJECTED_COLUMNS;
      default:
        return SLICING_ISSUED_COLUMNS;
    }
  }, [activeTab]);

  return (
    <FactoryPageShell
      breadcrumbs={[{ label: "Factory" }, { label: "Slicing" }]}
      title="Slicing"
      processTabs={
        <ModuleProcessTabs
          onChange={handleTabChange}
          tabs={SLICING_PROCESS_TABS}
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
            placeholder={`Search ${SLICING_PROCESS_TABS.find((t) => t.value === activeTab)?.label}...`}
            value={searchValue}
            onChange={(val) => {
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
                    setDryingTargetRows(selectedDoneRows);
                    setDryingRemark("");
                    setDryingDialogOpen(true);
                  }}
                  sx={{
                    backgroundColor: "primary.main",
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Issue for Drying ({selectedDoneRows.length})
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
          loadingLabel={`Loading ${activeTab} slicing items...`}
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
          selectable={activeTab === "done"}
          selectOnRowClick={false}
          selectionResetKey={selectionResetKey}
          onSelectionChange={(selected: any) => setSelectedDoneRows(selected)}
          getRowActions={getRowActions}
          emptyStateLabel={`No records found in ${SLICING_PROCESS_TABS.find((t) => t.value === activeTab)?.label}.`}
        />
      </Stack>

      {/* Revert Confirmation Dialog */}
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Revert"
        description={
          activeTab === "issued"
            ? "Are you sure you want to revert this item back to the storage warehouse?"
            : activeTab === "rejected"
              ? "Are you sure you want to revert this rejected item back to Slicing Done?"
              : "Are you sure you want to revert this completed item back to the issued tab?"
        }
        onClose={() => setRevertDialogOpen(false)}
        onConfirm={() => void handleConfirmRevert()}
        open={revertDialogOpen}
        title="Confirm Revert"
      />

      {/* Reject Dialog */}
      <Dialog
        maxWidth="xs"
        onClose={() => setRejectDialogOpen(false)}
        open={rejectDialogOpen}
      >
        <DialogTitle>Reject Slicing Output</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Are you sure you want to reject this slicing output? It will be moved to Rejected Slicing.
            </Typography>
            <TextField
              fullWidth
              label="Rejection Remark"
              multiline
              onChange={(e) => setRejectRemark(e.target.value)}
              rows={2}
              value={rejectRemark}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isRejecting} onClick={() => setRejectDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={isRejecting}
            onClick={handleConfirmReject}
            variant="contained"
          >
            {isRejecting ? "Rejecting..." : "Confirm Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Issue for Drying Dialog */}
      <Dialog
        maxWidth="xs"
        onClose={() => setDryingDialogOpen(false)}
        open={dryingDialogOpen}
      >
        <DialogTitle>Issue for Drying</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Issue {dryingTargetRows.length} output item{dryingTargetRows.length > 1 ? "s" : ""} to the Drying department?
            </Typography>
            <TextField
              fullWidth
              label="Remark (optional)"
              multiline
              onChange={(e) => setDryingRemark(e.target.value)}
              rows={2}
              value={dryingRemark}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={isIssuingForDrying} onClick={() => setDryingDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            color="primary"
            disabled={isIssuingForDrying}
            onClick={handleConfirmIssueForDrying}
            variant="contained"
          >
            {isIssuingForDrying ? "Issuing..." : "Confirm Issue"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        autoHideDuration={4000}
        message={snackbarMessage}
        onClose={() => setSnackbarOpen(false)}
        open={snackbarOpen}
      />
    </FactoryPageShell>
  );
}
