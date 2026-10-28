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
import { CheckCircle2, Eye, Pencil, Plus, RotateCcw, XCircle } from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { ConfirmationDialog } from "../../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import type { ColumnFilterValue } from "../../../../components/shared/columnFilters";
import { ModuleProcessTabs } from "../../../../components/navigation/ModuleProcessTabs";
import { ClearableSearchField } from "../../../shared/ClearableSearchField";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactoryToolbar } from "../../shared/FactoryToolbar";
import { exportRowsToCsv, type CsvColumn } from "../../../shared/exportToCsv";
import {
  fetchSawingIssued,
  fetchSawingDone,
  fetchSawingHistory,
  fetchSawingRejected,
  revertSawingDoneApi,
  revertSawingIssueApi,
  revertSawingRejectedApi,
  rejectSawingDoneApi,
  issueSawingForInspectionApi,
  fetchSawingDropdownsApi,
} from "../api/sawingApi";
import {
  getSawingDoneEditBlockReason,
  readSawingFlowState,
} from "../sawingFrontendStore";
import { issueFactoryWork } from "../../shared/factoryIssuedWorkStore";
import {
  SAWING_DONE_COLUMNS,
  SAWING_HISTORY_COLUMNS,
  SAWING_ISSUED_COLUMNS,
  SAWING_PROCESS_TABS,
  SAWING_REJECTED_COLUMNS,
  formatSawingCbmDisplay,
  formatSawingStorageSerial,
  type SawingProcessTab,
} from "../sawingColumns";
import { canAccessFactorySawing } from "../../../permissions";

export function SawingListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") || "issued") as SawingProcessTab;
  const activeTab: SawingProcessTab = SAWING_PROCESS_TABS.some((t: { value: string }) => t.value === tabParam)
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

  // Dialog state for Issue for Inspection confirmation
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [inspectionTargetRows, setInspectionTargetRows] = useState<any[]>([]);
  const [isIssuingInspection, setIsIssuingInspection] = useState(false);

  // View modal dialog
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);

  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);

  // Filter & sorting states
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, ColumnFilterValue>>>({});
  const [sortConfig, setSortConfig] = useState<{
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
  }>({ sortBy: null, sortOrder: null });
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});

  // Reset page, filters and selection when tab changes
  useEffect(() => {
    setPage(1);
    setSelectedDoneRows([]);
    setSelectionResetKey((k) => k + 1);
    setColumnFilters({});
    setSortConfig({ sortBy: null, sortOrder: null });
  }, [activeTab]);

  // Handle flash message passed from navigation (e.g. after creating sawing)
  useEffect(() => {
    const flash = (location.state as { sawingFlashMessage?: string } | null)?.sawingFlashMessage;
    if (flash) {
      setToastNotification({
        message: flash,
        severity: "success",
      });
      setRefreshTrigger((c) => c + 1);
      // Clear location state history so it doesn't re-show on next tab clicks
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
    setSearchValue("");
  };

  // ── Load Dropdown Options for Filter Menus ────────────────────────
  const handleColumnFilterOpen = useCallback((columnKey: string) => {
    const tabName = activeTab === "done" || activeTab === "history" || activeTab === "rejected" ? activeTab : "issued";
    void fetchSawingDropdownsApi(tabName).then((data) => {
      if (!data) return;
      const opts: Array<{ value: string; label: string }> = [];
      if (columnKey === "itemName" && data.itemNames) {
        opts.push(...data.itemNames.map((n) => ({ value: n, label: n })));
      } else if ((columnKey === "batchNo" || columnKey === "batchNoCode") && data.batchNos) {
        opts.push(...data.batchNos.map((b) => ({ value: b, label: b })));
      } else if (columnKey === "subCategory" && data.subCategories) {
        opts.push(...data.subCategories.map((s) => ({ value: s, label: s })));
      }
      if (opts.length > 0) {
        setFilterOptionsByColumn((prev) => ({
          ...prev,
          [columnKey]: opts,
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
        filters: Object.keys(columnFilters).length > 0 ? columnFilters : undefined,
      };

      let result: { items: any[]; pagination: { total: number } };
      const flowState = readSawingFlowState();
      if (activeTab === "done") {
        result = await fetchSawingDone(queryParams);
        const backendItems = result.items || [];
        const extraDone = (flowState.extraDone || []).filter(
          (ed: any) => !backendItems.some((bi: any) => bi.id === ed.id)
        );
        result.items = [...extraDone, ...backendItems];
        result.pagination.total = (result.pagination.total || 0) + extraDone.length;
      } else if (activeTab === "history") {
        result = await fetchSawingHistory(queryParams);
      } else if (activeTab === "rejected") {
        result = await fetchSawingRejected(queryParams);
      } else {
        result = await fetchSawingIssued(queryParams);
        // Apply dynamic available CBM overrides if any were tracked locally
        if (result.items && flowState.issuedAvailability) {
          result.items = result.items.map((item: any) => {
            const availOverride =
              flowState.issuedAvailability[item.id] ||
              flowState.issuedAvailability[item.storageSrNo];
            if (availOverride && availOverride.availableCbm !== undefined) {
              return {
                ...item,
                availableCbm: availOverride.availableCbm,
                availableCbf: availOverride.availableCbf ?? item.availableCbf,
              };
            }
            return item;
          });
        }
      }

      setRows(result.items || []);
      setTotalCount(result.pagination?.total || 0);
    } catch (err: any) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(err?.message || "Unable to load sawing records.");
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

  // ── Handlers ──────────────────────────────────────────────────────

  const handleOpenRevert = (row: any) => {
    setRevertTargetRow(row);
    setRevertRemark("");
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = async () => {
    if (!revertTargetRow) return;
    setIsReverting(true);
    try {
      if (activeTab === "issued") {
        await revertSawingIssueApi(revertTargetRow.id, revertRemark);
      } else if (activeTab === "rejected") {
        await revertSawingRejectedApi(revertTargetRow.id, revertRemark);
      } else {
        await revertSawingDoneApi(revertTargetRow.id || revertTargetRow.doneId, revertRemark);
      }
      setRevertDialogOpen(false);
      setRevertTargetRow(null);
      setRefreshTrigger((c) => c + 1);
      setToastNotification({
        message: "Sawing record reverted successfully.",
        severity: "success",
      });
    } catch (err: any) {
      setToastNotification({
        message: err.message || "Failed to revert.",
        severity: "error",
      });
    } finally {
      setIsReverting(false);
    }
  };

  const handleOpenReject = (row: any) => {
    setRejectTargetRow(row);
    setRejectRemark("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!rejectTargetRow) return;
    setIsRejecting(true);
    try {
      await rejectSawingDoneApi(rejectTargetRow.id, rejectRemark);
      setRows((current) => current.filter((r) => r.id !== rejectTargetRow.id));
      setTotalCount((c) => Math.max(0, c - 1));
      setRejectDialogOpen(false);
      setRejectTargetRow(null);
      setToastNotification({
        message: "Sawing item marked as rejected.",
        severity: "success",
      });
    } catch (err: any) {
      setToastNotification({
        message: err.message || "Failed to reject.",
        severity: "error",
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const handleOpenIssueInspection = (row: any) => {
    setInspectionTargetRows([row]);
    setInspectionDialogOpen(true);
  };

  const handleOpenBatchIssueInspection = () => {
    if (selectedDoneRows.length === 0) return;
    setInspectionTargetRows(selectedDoneRows);
    setInspectionDialogOpen(true);
  };

  const handleConfirmIssueForInspection = async () => {
    if (inspectionTargetRows.length === 0) return;
    setIsIssuingInspection(true);
    try {
      const ids = inspectionTargetRows.map((r) => r.id);
      await issueSawingForInspectionApi(ids, "Issued to inspection from Sawing Done");

      // Register into Sawing Inspection pending tab
      for (const row of inspectionTargetRows) {
        issueFactoryWork({
          destinationProcess: "sawing-inspection",
          sourceSlug: "sawing",
          sourceProcess: "Sawing Done",
          sourceWarehouseName: row.storageWarehouseName || "Sawing",
          sourceRow: {
            ...row,
            issuedDate: new Date(),
            qcStatus: "Pending",
          },
        });
      }

      const processedIds = new Set(ids);
      setRows((current) => current.filter((r) => !processedIds.has(r.id)));
      setTotalCount((c) => Math.max(0, c - inspectionTargetRows.length));
      setSelectedDoneRows((current) => current.filter((r) => !processedIds.has(r.id)));
      setSelectionResetKey((k) => k + 1);
      setInspectionDialogOpen(false);
      setInspectionTargetRows([]);
      setToastNotification({
        message: `Issued ${ids.length} item(s) to Sawing Inspection successfully.`,
        severity: "success",
      });
    } catch (err: any) {
      setToastNotification({
        message: err.message || "Failed to issue for inspection.",
        severity: "error",
      });
    } finally {
      setIsIssuingInspection(false);
    }
  };




  const handleOpenView = (row: any) => {
    setViewRecord(row);
    setViewModalOpen(true);
  };

  // ── Actions Definition ────────────────────────────────────────────

  const getRowActions = useCallback(
    (row: any): readonly EnterpriseTableAction<any>[] => {
      const actions: EnterpriseTableAction<any>[] = [];

      if (activeTab === "issued") {
        // Create Sawing, View, Revert
        actions.push({
          id: "create-sawing",
          label: "Create Sawing",
          icon: Plus,
          tone: "primary",
          onSelect: (r: any) => {
            navigate("/factory/sawing/add", {
              state: {
                sourceRow: r,
                sourceItem: r,
                issueItemId: r.id,
                issueId: r.issueId,
                storageWarehouseId: r.storageWarehouseId,
              },
            });
          },
        });
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing/view/${r.id}`, { state: { record: r, tab: "issued" } });
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
        const editBlockReason = getSawingDoneEditBlockReason(row);
        // View, Edit, Reject Sawing, Revert, Issue for Inspection
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing/view/${r.id}`, { state: { record: r, tab: "done" } });
          },
        });
        actions.push({
          id: "edit",
          label: "Edit",
          icon: Pencil,
          disabled: Boolean(editBlockReason),
          ...(editBlockReason ? { disabledReason: editBlockReason } : {}),
          onSelect: (r: any) => {
            if (getSawingDoneEditBlockReason(r)) return;
            navigate(`/factory/sawing/edit/${r.id}`, { state: { record: r } });
          },
        });
        actions.push({
          id: "reject",
          label: "Reject Sawing",
          icon: XCircle,
          tone: "danger",
          onSelect: (r: any) => handleOpenReject(r),
        });
        actions.push({
          id: "revert",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (r: any) => handleOpenRevert(r),
        });
        actions.push({
          id: "issue-inspection",
          label: "Issue for Inspection",
          icon: CheckCircle2,
          tone: "primary",
          onSelect: (r: any) => handleOpenIssueInspection(r),
        });
      } else {
        // History, Rejected, Available: View full layout
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing/view/${r.id}`, { state: { record: r, tab: activeTab } });
          },
        });
        if (activeTab === "rejected") {
          actions.push({
            id: "revert",
            label: "Revert",
            icon: RotateCcw,
            tone: "danger",
            onSelect: (r: any) => handleOpenRevert(r),
          });
        }
      }

      return actions;
    },
    [activeTab, navigate]
  );

  const currentColumns = useMemo(() => {
    switch (activeTab) {
      case "issued":
        return SAWING_ISSUED_COLUMNS;
      case "done":
        return SAWING_DONE_COLUMNS;
      case "history":
        return SAWING_HISTORY_COLUMNS;
      case "rejected":
        return SAWING_REJECTED_COLUMNS;
      default:
        return SAWING_ISSUED_COLUMNS;
    }
  }, [activeTab]);

  const handleExport = () => {
    if (rows.length === 0) {
      setToastNotification({
        message: "No records available to export.",
        severity: "info",
      });
      return;
    }

    const columns: CsvColumn<Record<string, unknown>>[] = currentColumns.map((col) => ({
      key: String(col.key),
      label: col.label,
    }));

    exportRowsToCsv(
      rows.map((row) => {
        const item: Record<string, unknown> = {};
        currentColumns.forEach((col) => {
          const key = String(col.key);
          item[key] = row[key] ?? "";
        });
        return item;
      }),
      columns,
      `sawing-${activeTab}`
    );
  };

  if (!canAccessFactorySawing()) {
    return (
      <FactoryPageShell
        breadcrumbs={[{ label: "Factory" }, { label: "Sawing" }]}
        title="Sawing"
      >
        <Alert severity="error">
          You do not have permission to access Sawing.
        </Alert>
      </FactoryPageShell>
    );
  }

  return (
    <FactoryPageShell
      breadcrumbs={[{ label: "Factory" }, { label: "Sawing" }]}      title="Sawing"
      processTabs={
        <ModuleProcessTabs
          onChange={handleTabChange}
          tabs={SAWING_PROCESS_TABS}
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
            placeholder={`Search ${SAWING_PROCESS_TABS.find((t: { value: string }) => t.value === activeTab)?.label}...`}
            value={searchValue}
            onChange={setSearchValue}
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
                  onClick={handleOpenBatchIssueInspection}
                  sx={{
                    backgroundColor: "primary.main",
                    textTransform: "none",
                    fontWeight: 600,
                  }}
                >
                  Issue for Inspection ({selectedDoneRows.length})
                </Button>
              </>
            ) : null}
            <FactoryToolbar
              disabled={isLoading || totalCount === 0}
              onExport={handleExport}
            />
          </Stack>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <EnterpriseDataTable
          columns={currentColumns}
          rows={rows}
          loading={isLoading}
          loadingLabel={`Loading ${activeTab} sawing items...`}
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
          emptyStateLabel={`No records found in ${SAWING_PROCESS_TABS.find((t: { value: string }) => t.value === activeTab)?.label}.`}
        />
      </Stack>

      {/* ── Revert Confirmation Dialog ── */}
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Revert"
        description={
          activeTab === "issued"
            ? "Are you sure you want to revert this item back to the storage warehouse?"
            : activeTab === "rejected"
              ? "Are you sure you want to revert this rejected item back to Sawing Done?"
              : "Are you sure you want to revert this completed item back to the issued tab?"
        }
        onClose={() => setRevertDialogOpen(false)}
        onConfirm={() => void handleConfirmRevert()}
        open={revertDialogOpen}
        title="Confirm Revert"
        tone="danger"
      />

      {/* ── Issue for Inspection Confirmation Dialog ── */}
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description={
          inspectionTargetRows.length === 1
            ? `Are you sure you want to issue "${inspectionTargetRows[0]?.itemName || "Veneer Block"}" to Sawing Inspection?`
            : `Are you sure you want to issue ${inspectionTargetRows.length} items to Sawing Inspection?`
        }
        onClose={() => setInspectionDialogOpen(false)}
        onConfirm={() => void handleConfirmIssueForInspection()}
        open={inspectionDialogOpen}
        title="Confirm Issue for Inspection"
        tone="default"
      />

      {/* ── Reject Confirmation Dialog ── */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Sawing Item</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to mark this item as Rejected? It will move to the Rejected Sawing tab.
          </Typography>
          <TextField
            label="Reason / Remark"
            fullWidth
            size="small"
            value={rejectRemark}
            onChange={(e) => setRejectRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRejectDialogOpen(false)} disabled={isRejecting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => void handleConfirmReject()}
            disabled={isRejecting}
          >
            {isRejecting ? "Rejecting..." : "Reject"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Modal Dialog ── */}
      <Dialog open={viewModalOpen} onClose={() => setViewModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Record Details</DialogTitle>
        <DialogContent dividers>
          {viewRecord ? (
            <Stack spacing={1.5}>
              {Object.entries(viewRecord).map(([key, val]) => {
                if (typeof val === "object" && val !== null) return null;
                return (
                  <Stack
                    key={key}
                    direction="row"
                    justifyContent="space-between"
                    sx={{ borderBottom: `1px solid ${theme.customTokens.borders.default}`, py: 0.5 }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                      {key.replace(/([A-Z])/g, " $1").toUpperCase()}
                    </Typography>
                    <Typography variant="body2">{val !== null && val !== undefined ? String(val) : "-"}</Typography>
                  </Stack>
                );
              })}
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button onClick={() => setViewModalOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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

function mapSawingExportRow(
  row: Record<string, unknown>,
  columns: readonly { key: string; label: string }[],
): Record<string, unknown> {
  return columns.reduce<Record<string, unknown>>((accumulator, column) => {
    const value = row[column.key];

    if (column.key === "storageSrNo") {
      accumulator[column.key] = formatSawingStorageSerial(value);
      return accumulator;
    }

    if (column.key === "cbm" || column.key === "cbf") {
      accumulator[column.key] = formatSawingCbmDisplay(value) || value || "";
      return accumulator;
    }

    accumulator[column.key] = value ?? "";
    return accumulator;
  }, {});
}
