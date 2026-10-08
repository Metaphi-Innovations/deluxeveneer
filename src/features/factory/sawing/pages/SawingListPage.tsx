import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { CheckCircle2, Eye, Pencil, Plus, RotateCcw, XCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../../components/navigation/ModuleProcessTabs";
import { ClearableSearchField } from "../../../shared/ClearableSearchField";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { issueFactoryWork } from "../../shared/factoryIssuedWorkStore";
import {
  fetchSawingAvailable,
  fetchSawingDone,
  fetchSawingHistory,
  fetchSawingIssued,
  fetchSawingRejected,
  issueSawingForInspectionApi,
  rejectSawingDoneApi,
  revertSawingDoneApi,
  revertSawingIssueApi,
  type SawingAvailableItem,
  type SawingDoneItem,
  type SawingHistoryItem,
  type SawingIssueItem,
  type SawingRejectedItem,
} from "../api/sawingApi";
import {
  SAWING_AVAILABLE_COLUMNS,
  SAWING_DONE_COLUMNS,
  SAWING_HISTORY_COLUMNS,
  SAWING_ISSUED_COLUMNS,
  SAWING_PROCESS_TABS,
  SAWING_REJECTED_COLUMNS,
  type SawingProcessTab,
} from "../sawingColumns";

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
  const [selectedDoneRows, setSelectedDoneRows] = useState<SawingDoneItem[]>([]);
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

  // Inspection dialog / action
  const [isInspecting, setIsInspecting] = useState(false);

  // View modal dialog
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState<any | null>(null);

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
      const query = {
        page,
        limit: rowsPerPage,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
      };

      if (activeTab === "issued") {
        const res = await fetchSawingIssued(query);
        setRows(res.items);
        setTotalCount(res.pagination.total);
      } else if (activeTab === "done") {
        const res = await fetchSawingDone(query);
        setRows(res.items);
        setTotalCount(res.pagination.total);
      } else if (activeTab === "history") {
        const res = await fetchSawingHistory(query);
        setRows(res.items);
        setTotalCount(res.pagination.total);
      } else if (activeTab === "rejected") {
        const res = await fetchSawingRejected(query);
        setRows(res.items);
        setTotalCount(res.pagination.total);
      }
    } catch (err: any) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(err.message || "Failed to load sawing data.");
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
      if (activeTab === "issued") {
        await revertSawingIssueApi(revertTargetRow.id, revertRemark);
      } else if (activeTab === "done") {
        await revertSawingDoneApi(revertTargetRow.id, revertRemark);
      }
      setRevertDialogOpen(false);
      setRevertTargetRow(null);
      setRefreshTrigger((c) => c + 1);
    } catch (err: any) {
      alert(err.message || "Failed to revert.");
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
      setRejectDialogOpen(false);
      setRejectTargetRow(null);
      setRefreshTrigger((c) => c + 1);
    } catch (err: any) {
      alert(err.message || "Failed to reject.");
    } finally {
      setIsRejecting(false);
    }
  };

  const handleIssueForInspection = async (items: SawingDoneItem[]) => {
    if (!items.length) return;
    setIsInspecting(true);
    try {
      await issueSawingForInspectionApi(items.map((i) => i.id));
      for (const item of items) {
        issueFactoryWork({
          destinationProcess: "Sawing Inspection",
          sourceRow: item as any,
          sourceSlug: "sawing",
          sourceProcess: "Sawing",
          sourceWarehouseName: item.storageWarehouseName || "Warehouse B",
        });
      }
      setSelectedDoneRows([]);
      setSelectionResetKey((k) => k + 1);
      setRefreshTrigger((c) => c + 1);
    } catch (err: any) {
      alert(err.message || "Failed to issue for inspection.");
    } finally {
      setIsInspecting(false);
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
            navigate(`/factory/sawing/view/${r.id}`, { state: { record: r } });
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
            navigate(`/factory/sawing/view/${r.id}`, { state: { record: r } });
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
          onSelect: (r: any) => void handleIssueForInspection([r]),
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
      subtitle="Veneer Block Sawing operations and disposition tracking."
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
                disabled={isInspecting}
                onClick={() => void handleIssueForInspection(selectedDoneRows)}
                sx={{
                  backgroundColor: theme.palette.primary.main,
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {isInspecting ? "Issuing..." : "Issue for Inspection"}
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
          onSelectionChange={(selected: any) => setSelectedDoneRows(selected as SawingDoneItem[])}
          getRowActions={getRowActions}
          emptyStateLabel={`No records found in ${SAWING_PROCESS_TABS.find((t: { value: string }) => t.value === activeTab)?.label}.`}
        />
      </Stack>

      {/* ── Revert Confirmation Dialog ── */}
      <Dialog open={revertDialogOpen} onClose={() => setRevertDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm Revert</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {activeTab === "issued"
              ? "Are you sure you want to revert this item back to the storage warehouse?"
              : "Are you sure you want to revert this completed item back to the issued tab?"}
          </Typography>
          <TextField
            label="Remark (Optional)"
            fullWidth
            size="small"
            value={revertRemark}
            onChange={(e) => setRevertRemark(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRevertDialogOpen(false)} disabled={isReverting}>
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
    </FactoryPageShell>
  );
}
