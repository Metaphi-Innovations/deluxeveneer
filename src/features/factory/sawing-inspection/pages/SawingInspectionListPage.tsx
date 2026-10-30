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
import { CheckCircle2, Eye, Pencil, RotateCcw, AlertCircle, Upload } from "lucide-react";
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
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { recordFormActionButtonSx } from "../../../shared/buttonStyles";
import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  isoDateToLocalDate,
  localDateToIso,
} from "../../shared/listing/factoryListingParts";
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
  recordSawingInspectionDecisionApi,
} from "../api/sawingInspectionApi";
import {
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
} from "../../shared/factoryIssuedWorkStore";
import { sawingInspectionDefinition } from "../../shared/factoryDefinitions";
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

  // Inspect Decision Dialog state
  const [inspectDialogOpen, setInspectDialogOpen] = useState(false);
  const [inspectTargetRow, setInspectTargetRow] = useState<any | null>(null);
  const [inspectDate, setInspectDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [inspectRemark, setInspectRemark] = useState("");
  const [inspectAttachmentName, setInspectAttachmentName] = useState("");
  const [inspectAttachmentPreview, setInspectAttachmentPreview] = useState<string | null>(null);
  const [isSubmittingInspect, setIsSubmittingInspect] = useState(false);

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

  const handleOpenInspect = (r: any) => {
    setInspectTargetRow(r);
    setInspectDate(new Date().toISOString().slice(0, 10));
    setInspectRemark("");
    setInspectAttachmentName("");
    setInspectAttachmentPreview(null);
    setInspectDialogOpen(true);
  };

  const handleCloseInspect = () => {
    if (isSubmittingInspect) return;
    setInspectDialogOpen(false);
    setInspectTargetRow(null);
    setInspectAttachmentName("");
    setInspectAttachmentPreview(null);
    setInspectRemark("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInspectAttachmentName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setInspectAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmInspectDecision = async (decision: "pass" | "fail") => {
    if (!inspectTargetRow) return;
    setIsSubmittingInspect(true);

    try {
      const mode = decision;
      const workItemId =
        inspectTargetRow.workItemId ||
        (String(inspectTargetRow.id).startsWith("factory-work-") ? inspectTargetRow.id : null);

      const patch = {
        inspectionDate: inspectDate,
        remark: inspectRemark.trim() || (mode === "pass" ? "Passed inspection" : "Failed inspection"),
        qcStatus: mode === "pass" ? "Pass" : "Fail",
        listingState: mode === "pass" ? "done" : "failed",
        status: mode === "pass" ? "Pass" : "Fail",
        passQty: mode === "pass" ? 1 : 0,
        failQty: mode === "pass" ? 0 : 1,
        ...(inspectAttachmentPreview
          ? {
              inspectionImage: inspectAttachmentPreview,
              inspectionImageName: inspectAttachmentName,
            }
          : {}),
      };

      // Call backend API if real ID exists
      if (inspectTargetRow.id && !String(inspectTargetRow.id).startsWith("factory-work-")) {
        try {
          await recordSawingInspectionDecisionApi(inspectTargetRow.id, mode === "pass" ? "PASS" : "FAIL", {
            inspectionDate: inspectDate,
            remark: inspectRemark.trim() || (mode === "pass" ? "Passed inspection" : "Failed inspection"),
            attachmentUrl: inspectAttachmentPreview || undefined,
            attachmentName: inspectAttachmentName || undefined,
          });
        } catch (apiErr) {
          console.error("Failed to submit inspection decision to backend:", apiErr);
        }
      }

      if (workItemId) {
        if (mode === "pass") {
          completeFactoryIssuedWork(workItemId, patch);
        } else {
          failFactoryIssuedWork(workItemId, patch);
        }
      }

      // Update in-memory sawingInspectionDefinition rows
      const matchIndex = (sawingInspectionDefinition.rows as any[]).findIndex(
        (r) => String(r.id) === String(inspectTargetRow.id),
      );
      if (matchIndex >= 0) {
        (sawingInspectionDefinition.rows as any)[matchIndex] = {
          ...sawingInspectionDefinition.rows[matchIndex],
          ...patch,
        };
      }

      if (inspectTargetRow.id && inspectAttachmentPreview) {
        try {
          localStorage.setItem(`sawing_inspection_photo_${inspectTargetRow.id}`, inspectAttachmentPreview);
          if (inspectAttachmentName) {
            localStorage.setItem(`sawing_inspection_photo_name_${inspectTargetRow.id}`, inspectAttachmentName);
          }
        } catch (e) {
          // ignore localStorage limits
        }
      }

      setToastNotification({
        message: `Sawing Inspection marked as ${mode === "pass" ? "PASS" : "FAIL"} successfully.`,
        severity: "success",
      });
      setInspectDialogOpen(false);
      setInspectTargetRow(null);
      setRefreshTrigger((prev) => prev + 1);
    } catch (err: any) {
      setToastNotification({
        message: err.message || "Failed to record inspection decision",
        severity: "error",
      });
    } finally {
      setIsSubmittingInspect(false);
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
        // Pending: Inspect Item, View, Revert
        actions.push({
          id: "inspect-item",
          label: "Inspect Item",
          icon: CheckCircle2,
          tone: "primary",
          onSelect: (r: any) => handleOpenInspect(r),
        });
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
        // Done: View, Issue to Warehouse, Revert
        actions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: (r: any) => {
            navigate(`/factory/sawing-inspection/view/${r.id}`, { state: { record: r, tab: "done" } });
          },
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

      {/* ── Record Inspection Decision Dialog ── */}
      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={handleCloseInspect}
        open={inspectDialogOpen}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${theme.customTokens.borders.default}`,
            fontSize: "18px",
            fontWeight: 700,
            px: 2.5,
            py: 2,
          }}
        >
          Record Inspection Decision
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, py: `${theme.spacing(2.5)} !important` }}>
          <Stack spacing={2.5}>
            {/* Read-only Source details */}
            {inspectTargetRow && (
              <Box sx={(t) => formSectionCardSx(t)}>
                <Stack spacing={1.5}>
                  <FormSectionHeader title="Output Item Details" />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                      gap: 1.5,
                    }}
                  >
                    {[
                      {
                        label: "Item Name",
                        value:
                          inspectTargetRow.itemName ||
                          inspectTargetRow.item_name ||
                          inspectTargetRow.item ||
                          "-",
                      },
                      {
                        label: "Log No.",
                        value:
                          inspectTargetRow.logNo ||
                          inspectTargetRow.log_no ||
                          inspectTargetRow.logNumber ||
                          "-",
                      },
                      {
                        label: "Batch No",
                        value:
                          inspectTargetRow.batchNo ||
                          inspectTargetRow.batch_no ||
                          inspectTargetRow.batchNumber ||
                          "-",
                      },
                      {
                        label: "Length",
                        value:
                          inspectTargetRow.length != null
                            ? `${Number(inspectTargetRow.length).toFixed(3)} m`
                            : "-",
                      },
                      {
                        label: "Width",
                        value:
                          inspectTargetRow.width != null
                            ? `${Number(inspectTargetRow.width).toFixed(3)} m`
                            : "-",
                      },
                      {
                        label: "Thickness",
                        value:
                          inspectTargetRow.thickness != null
                            ? `${Number(inspectTargetRow.thickness).toFixed(3)} m`
                            : "-",
                      },
                      {
                        label: "CBM",
                        value:
                          inspectTargetRow.cbm != null
                            ? Number(inspectTargetRow.cbm).toFixed(3)
                            : "-",
                      },
                    ].map((field) => (
                      <Stack key={field.label} spacing={0.25}>
                        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                          {field.label}
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {field.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Box>
                </Stack>
              </Box>
            )}

            {/* Editable fields */}
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Inspection Date
                </Typography>
                <ErpDatePickerField
                  onChange={(val) => setInspectDate(localDateToIso(val))}
                  size="dense"
                  value={isoDateToLocalDate(inspectDate)}
                />
              </Stack>

              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Attachment (Upload Photo)
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    component="label"
                    startIcon={<Upload size={15} />}
                    sx={{
                      ...recordFormActionButtonSx,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                    variant="outlined"
                  >
                    Choose Photo
                    <input accept="image/*" hidden onChange={handleFileChange} type="file" />
                  </Button>
                  <Typography
                    variant="body2"
                    color={inspectAttachmentName ? "text.primary" : "text.secondary"}
                    sx={{ fontSize: "13px" }}
                  >
                    {inspectAttachmentName || "No file chosen"}
                  </Typography>
                </Stack>
                {inspectAttachmentPreview ? (
                  <Box
                    sx={{
                      mt: 1,
                      maxHeight: 140,
                      maxWidth: 220,
                      overflow: "hidden",
                      borderRadius: "6px",
                      border: `1px solid ${theme.customTokens.borders.default}`,
                    }}
                  >
                    <img
                      alt="Preview"
                      src={inspectAttachmentPreview}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ) : null}
              </Stack>

              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Inspection Remark
                </Typography>
                <TextField
                  fullWidth
                  minRows={2}
                  multiline
                  onChange={(e) => setInspectRemark(e.target.value)}
                  placeholder="Enter inspection remark or reason"
                  size="small"
                  value={inspectRemark}
                  sx={getCompactFieldSx(theme, "default")}
                />
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            gap: 1,
            px: 2.5,
            py: 1.75,
          }}
        >
          <Button
            disabled={isSubmittingInspect}
            onClick={handleCloseInspect}
            sx={{
              ...recordFormActionButtonSx,
              textTransform: "none",
              fontWeight: 600,
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            color="error"
            disabled={isSubmittingInspect}
            onClick={() => handleConfirmInspectDecision("fail")}
            startIcon={<AlertCircle size={16} />}
            sx={{
              ...recordFormActionButtonSx,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
            variant="outlined"
          >
            Confirm Fail
          </Button>
          <Button
            color="success"
            disabled={isSubmittingInspect}
            onClick={() => handleConfirmInspectDecision("pass")}
            startIcon={<CheckCircle2 size={16} />}
            sx={{
              ...recordFormActionButtonSx,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
            variant="contained"
          >
            Confirm Pass
          </Button>
        </DialogActions>
      </Dialog>

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
