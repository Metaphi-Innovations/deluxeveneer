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
import { useNavigate, useSearchParams } from "react-router";

import { ConfirmationDialog } from "../../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../../components/navigation/ModuleProcessTabs";
import { ClearableSearchField } from "../../../shared/ClearableSearchField";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { issueFactoryWork } from "../../shared/factoryIssuedWorkStore";
import {
  listSawingFlowRows,
  recordSawingHistory,
  recordSawingRejection,
  revertSawingFlowRow,
  searchSawingFlowRows,
  type SawingFlowTab,
} from "../sawingFrontendStore";
import {
  SAWING_AVAILABLE_COLUMNS,
  SAWING_DONE_COLUMNS,
  SAWING_HISTORY_COLUMNS,
  SAWING_ISSUED_COLUMNS,
  SAWING_PROCESS_TABS,
  SAWING_REJECTED_COLUMNS,
  type SawingProcessTab,
} from "../sawingColumns";
import { sawingDefinition } from "../../shared";

export function SawingListPage() {
  const theme = useTheme();
  const navigate = useNavigate();
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

  // Reset page and selection when tab or search changes
  useEffect(() => {
    setPage(1);
    setSelectedDoneRows([]);
    setSelectionResetKey((k) => k + 1);
  }, [activeTab, searchValue]);

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
    setSearchValue("");
  };

  // ── Load Data ─────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const flowTab: SawingFlowTab =
        activeTab === "done" || activeTab === "history" || activeTab === "rejected"
          ? activeTab
          : "issued";
      const matched = searchSawingFlowRows(
        listSawingFlowRows(flowTab, sawingDefinition.rows as any[]),
        searchValue,
      );
      const start = (page - 1) * rowsPerPage;
      setRows(matched.slice(start, start + rowsPerPage));
      setTotalCount(matched.length);
    } catch (_err: any) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage("Unable to load sawing records.");
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, page, rowsPerPage, searchValue, refreshTrigger]);

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
      const flowTab: SawingFlowTab =
        activeTab === "done" || activeTab === "rejected" ? activeTab : "issued";
      revertSawingFlowRow(flowTab, revertTargetRow);
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
      recordSawingRejection(rejectTargetRow, rejectRemark);
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
      const count = inspectionTargetRows.length;
      inspectionTargetRows.forEach((row) => {
        const issuedDate = row.issueDate || row.issuedDate;
        const sawingDate = row.sawingDate || row.processDate;
        const subCategory = row.subCategory || row.itemSubCategory || "-";
        issueFactoryWork({
          destinationProcess: "Sawing Inspection",
          sourceRow: {
            ...row,
            issueDate: issuedDate,
            issuedDate,
            sawingDate,
            processDate: sawingDate,
            subCategory,
            itemSubCategory: subCategory,
          } as any,
          sourceSlug: "sawing",
          sourceProcess: "Sawing",
          sourceWarehouseName: (row as any).storageWarehouseName || "Warehouse B",
        });
      });
      recordSawingHistory(inspectionTargetRows);

      const processedIds = new Set(inspectionTargetRows.map((r) => r.id));
      setRows((current) => current.filter((r) => !processedIds.has(r.id)));
      setTotalCount((c) => Math.max(0, c - inspectionTargetRows.length));
      setSelectedDoneRows((current) => current.filter((r) => !processedIds.has(r.id)));
      setSelectionResetKey((k) => k + 1);
      setInspectionDialogOpen(false);
      setInspectionTargetRows([]);
      setToastNotification({
        message: `Issued ${count} item(s) to Sawing Inspection successfully.`,
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
          onSelect: (r: any) => {
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

  return (
    <FactoryPageShell
      breadcrumbs={[{ label: "Factory" }, { label: "Sawing" }]}
      subtitle=""
      title="Sawing"
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

          {activeTab === "done" && selectedDoneRows.length > 0 ? (
            <Stack direction="row" spacing={1.5} alignItems="center">
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
            </Stack>
          ) : null}
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <EnterpriseDataTable
          columns={currentColumns}
          rows={rows}
          loading={isLoading}
          loadingLabel={`Loading ${activeTab} sawing items...`}
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
