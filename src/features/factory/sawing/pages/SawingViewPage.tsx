import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { CheckCircle2, Plus } from "lucide-react";
import { ConfirmationDialog } from "../../../../components/feedback/ConfirmationDialog";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { canAccessFactorySawing } from "../../../permissions";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import { FactoryProductionPipeline } from "../../shared/FactoryProductionPipeline";
import { FactoryContextualStatusMessage } from "../../shared/StandardFactoryRecordView";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  getDialogBodyCellSx,
  getDialogHeaderCellSx,
  getDialogScrollableTableSx,
} from "../../shared/listing/factoryListingParts";
import { formatSawingCbmDisplay } from "../sawingColumns";
import {
  sawingDefinition,
  sawingInspectionDefinition,
} from "../../shared/factoryDefinitions";
import {
  getFactoryIssuedWorkById,
  getFactoryIssuedWorkItems,
  factoryIssuedWorkToRow,
  issueFactoryWork,
} from "../../shared/factoryIssuedWorkStore";
import {
  listSawingFlowRows,
  recordSawingHistory,
  type SawingFlowTab,
} from "../sawingFrontendStore";
import {
  fetchSawingIssuedById,
  fetchSawingDoneById,
  fetchSawingHistoryById,
  fetchSawingRejectedById,
} from "../api/sawingApi";

function formatDate(value: unknown): string {
  if (!value) return "-";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (str.includes("T")) {
    return str.slice(0, 10);
  }
  return str.length >= 10 ? str.slice(0, 10) : str;
}

export const SawingViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateData = location.state as { record?: any; tab?: string } | undefined;
  const passedRecord = stateData?.record;
  const [fetchedRecord, setFetchedRecord] = useState<any | null>(null);

  const tab =
    stateData?.tab ||
    (passedRecord?.listingState === "rejected" ||
    passedRecord?.eventType === "REJECTED" ||
    Boolean(passedRecord?.rejectedId)
      ? "rejected"
      : passedRecord?.listingState === "history" || passedRecord?.eventType === "UPDATED"
      ? "history"
      : passedRecord?.listingState === "issued"
      ? "issued"
      : passedRecord?.listingState === "available"
      ? "available"
      : "done");

  useEffect(() => {
    if (passedRecord || !id) return;

    if (tab === "issued") {
      void fetchSawingIssuedById(id).then(setFetchedRecord).catch(() => {});
    } else if (tab === "history") {
      void fetchSawingHistoryById(id).then(setFetchedRecord).catch(() => {});
    } else if (tab === "rejected") {
      void fetchSawingRejectedById(id).then(setFetchedRecord).catch(() => {});
    } else {
      void fetchSawingDoneById(id).then(setFetchedRecord).catch(() => {});
    }
  }, [id, passedRecord, tab]);

  const record = useMemo(() => {
    if (passedRecord) return passedRecord;
    if (fetchedRecord) return fetchedRecord;
    if (!id) return undefined;

    // Search in local store for fallback
    const tabs: SawingFlowTab[] = ["issued", "done", "history", "rejected"];
    for (const t of tabs) {
      const found = listSawingFlowRows(t, sawingDefinition.rows as any[]).find(
        (r) => String(r.id) === String(id),
      );
      if (found) return found;
    }

    return undefined;
  }, [id, passedRecord, fetchedRecord]);


  const isIssued = tab === "issued";
  const isRejected =
    tab === "rejected" ||
    record?.eventType === "REJECTED" ||
    Boolean(record?.rejectedId);
  const isHistory = tab === "history" || record?.eventType === "UPDATED";
  const canViewSawing = canAccessFactorySawing();

  // Source item info extraction
  const sourceItem = useMemo(() => {
    if (!record) return null;

    const rawWarehouse =
      record.storageWarehouseName ||
      record.warehouseName ||
      record.storageWarehouse?.name ||
      record.done?.storageWarehouse?.name ||
      record.sourceStorageWarehouseName ||
      record.warehouse ||
      "-";

    const warehouseDisplay =
      rawWarehouse && rawWarehouse !== "-" ? rawWarehouse : "Warehouse B";

    return {
      storageSrNo:
        record.storageSrNo ||
        record.storageItem?.storageSrNo ||
        record.sourceIssueItem?.storageItemId ||
        "-",
      sawingSrNo: record.sawingSrNo || record.done?.sawingSrNo || "-",
      itemName: record.itemName || record.item?.name || "Veneer Block",
      subCategory:
        record.subCategory ||
        record.itemSubCategoryName ||
        record.itemSubCategory?.name ||
        record.itemSubCategory ||
        "-",
      batchNo: record.batchNo || record.logNo || "-",
      length:
        record.sourceLength ||
        record.sourceIssueItem?.length ||
        record.length ||
        "-",
      width:
        record.sourceWidth ||
        record.sourceIssueItem?.width ||
        record.width ||
        "-",
      height:
        record.sourceHeight ||
        record.sourceIssueItem?.height ||
        record.height ||
        record.thickness ||
        "-",
      cbm:
        record.sourceCbm ||
        record.sourceIssueItem?.cbm ||
        record.cbm ||
        "-",
      cbf:
        record.sourceCbf ||
        record.sourceIssueItem?.cbf ||
        record.cbf ||
        "-",
      storageWarehouseName: warehouseDisplay,
      supplierName:
        record.supplierName ||
        record.storageItem?.supplierName ||
        record.supplier?.name ||
        "-",
      inwardSrNo:
        record.inwardSrNo ||
        record.storageItem?.inwardSrNo ||
        "-",
      issueDate:
        record.issueDate ||
        record.issuedDate ||
        record.processDate ||
        null,
      createdAt: record.createdAt || null,
      createdBy: record.createdBy || "-",
      updatedAt: record.updatedAt || null,
      updatedBy: record.updatedBy || "-",
      remark: record.remark || "-",
    };
  }, [record]);

  // Inspection resolution for this item (from factoryIssuedWorkStore or sawingInspectionDefinition)
  const inspectionRecord = useMemo(() => {
    if (!record) return null;
    const workItems = getFactoryIssuedWorkItems();
    const matchedWork = workItems.find(
      (item) =>
        (item.destinationSlug === "sawing-inspection" || item.destinationSlug === "inspection") &&
        (String(item.sourceRowId) === String(record.id) ||
          String(item.id) === String(record.id) ||
          String((item.sourceSnapshot as any)?.id) === String(record.id) ||
          (record.batchNo && (item.sourceSnapshot as any)?.batchNo === record.batchNo && (item.sourceSnapshot as any)?.batchNoCode === record.batchNoCode)),
    );
    if (matchedWork) {
      return {
        inspectionNo: matchedWork.id,
        inspectionDate: matchedWork.createdAt,
        qcStatus: (matchedWork.sourceSnapshot as any)?.qcStatus || (matchedWork.listingState === "done" ? "Pass" : matchedWork.listingState === "failed" ? "Fail" : "Pending"),
        remark: (matchedWork.sourceSnapshot as any)?.remark || "-",
        isIssued: true,
        record: matchedWork,
      };
    }

    // Check in sawingInspectionDefinition
    const matchedInspectionRow = (sawingInspectionDefinition.rows as any[]).find(
      (r: any) =>
        String(r.id) === String(record.id) ||
        (record.storageSrNo && r.storageSrNo === record.storageSrNo && record.batchNoCode && r.batchNoCode === record.batchNoCode),
    );
    if (matchedInspectionRow) {
      return {
        inspectionNo: String(matchedInspectionRow.id),
        inspectionDate: matchedInspectionRow.issuedDate || matchedInspectionRow.processDate,
        qcStatus: matchedInspectionRow.qcStatus || (matchedInspectionRow.listingState === "done" ? "Pass" : matchedInspectionRow.listingState === "failed" ? "Fail" : "Pending"),
        remark: matchedInspectionRow.remark || "-",
        isIssued: true,
        record: matchedInspectionRow,
      };
    }

    // Check if record itself is already in history (which means issued to inspection)
    if (tab === "history" || record.listingState === "history" || record.issuedFor === "Sawing Inspection") {
      return {
        inspectionNo: record.inspectionNo || `INSP-${String(record.id).slice(-6)}`,
        inspectionDate: record.inspectionDate || record.processDate || record.issuedDate,
        qcStatus: record.qcStatus || (record.status === "Pass" ? "Pass" : record.status === "Fail" ? "Fail" : "Pending"),
        remark: record.remark || "-",
        isIssued: true,
        record,
      };
    }

    return null;
  }, [record, tab]);

  // Sibling Process Detail items from the same parent Sawing creation
  const siblingSawingItems = useMemo(() => {
    if (!record) return [];
    if (Array.isArray(record.otherOutputs) && record.otherOutputs.length > 0) {
      return record.otherOutputs;
    }
    if (Array.isArray(record.processedItems) && record.processedItems.length > 0) {
      return record.processedItems.filter((i: any) => String(i.id) !== String(record.id));
    }
    if (Array.isArray(record.doneItems) && record.doneItems.length > 0) {
      return record.doneItems.filter((i: any) => String(i.id) !== String(record.id));
    }
    return [];
  }, [record]);

  // Inspection Issue State
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [isIssuingInspection, setIsIssuingInspection] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const handleConfirmIssueForInspection = async () => {
    if (!record) return;
    setIsIssuingInspection(true);
    try {
      const issuedDate = record.issueDate || record.issuedDate || new Date().toISOString();
      const sawingDate = record.sawingDate || record.processDate || new Date().toISOString();
      const subCategory = record.subCategory || record.itemSubCategory || "-";
      issueFactoryWork({
        destinationProcess: "Sawing Inspection",
        sourceRow: {
          ...record,
          issueDate: issuedDate,
          issuedDate,
          sawingDate,
          processDate: sawingDate,
          subCategory,
          itemSubCategory: subCategory,
        } as any,
        sourceSlug: "sawing",
        sourceProcess: "Sawing",
        sourceWarehouseName: record.storageWarehouseName || sourceItem?.storageWarehouseName || "Warehouse B",
      });
      recordSawingHistory([record]);
      setInspectionDialogOpen(false);
      setToastNotification({
        message: `Item "${record.itemName || "Sawing Done Item"}" issued to Sawing Inspection successfully.`,
        severity: "success",
      });
      setTimeout(() => {
        navigate("/factory/sawing?tab=done");
      }, 1000);
    } catch (err: any) {
      setToastNotification({
        message: err.message || "Failed to issue for inspection.",
        severity: "error",
      });
    } finally {
      setIsIssuingInspection(false);
    }
  };

  // Numeric CBM metrics for Issue tab
  const {
    receivedCbm,
    availableCbm,
    consumedCbm,
    utilizationPercent,
    availablePercent,
    availabilityStatus,
    processingStatus,
    availabilityMessage,
  } = useMemo(() => {
    const rawReceived = Number(
      String(
        record?.receivedCbm ??
          record?.sourceCbm ??
          sourceItem?.cbm ??
          record?.cbm ??
          0,
      ).replace(/[^\d.]/g, ""),
    );
    const recVal = Number.isFinite(rawReceived) && rawReceived > 0 ? rawReceived : 0;

    const rawAvailable = Number(
      String(
        record?.availableCbm ??
          record?.receivedCbm ??
          sourceItem?.cbm ??
          record?.cbm ??
          0,
      ).replace(/[^\d.]/g, ""),
    );
    const availVal = Number.isFinite(rawAvailable) ? Math.max(0, rawAvailable) : 0;

    const consumed = Math.max(0, recVal - availVal);
    const utilPct = recVal > 0 ? Math.min(100, Math.max(0, (consumed / recVal) * 100)) : 0;
    const availPct = recVal > 0 ? Math.min(100, Math.max(0, (availVal / recVal) * 100)) : 0;

    let availStatus: "Available" | "Partially Processed" | "Fully Consumed" = "Available";
    let procStatus: "Not Started" | "Partially Processed" | "Completed" = "Not Started";
    let message = "";

    if (availVal <= 0) {
      availStatus = "Fully Consumed";
      procStatus = "Completed";
      message = "This veneer block has been fully consumed for Sawing.";
    } else if (availVal < recVal) {
      availStatus = "Partially Processed";
      procStatus = "Partially Processed";
      message =
        "This veneer block has been partially processed. Remaining material is still available for Sawing.";
    } else {
      availStatus = "Available";
      procStatus = "Not Started";
      message = `This veneer block still has ${formatSawingCbmDisplay(availVal)} CBM available for Sawing.`;
    }

    return {
      receivedCbm: recVal,
      availableCbm: availVal,
      consumedCbm: consumed,
      utilizationPercent: utilPct,
      availablePercent: availPct,
      availabilityStatus: availStatus,
      processingStatus: procStatus,
      availabilityMessage: message,
    };
  }, [record, sourceItem]);

  const handleCreateSawing = () => {
    navigate("/factory/sawing/add", {
      state: {
        sourceRecord: record,
        sourceItem,
      },
    });
  };

  const statusBadgeConfig = useMemo(() => {
    switch (availabilityStatus) {
      case "Available":
        return { color: "success" as const, label: "Available" };
      case "Partially Processed":
        return { color: "warning" as const, label: "Partially Processed" };
      case "Fully Consumed":
      default:
        return { color: "default" as const, label: "Fully Consumed" };
    }
  }, [availabilityStatus]);

  if (!canViewSawing) {
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

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER FOR: ISSUE FOR SAWING VIEW PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  if (isIssued) {
    return (
      <FactoryPageShell
        title="View Issue for Sawing Item"
        subtitle="View source veneer block details and current Sawing availability."
        backNav={{
          label: "Back to Sawing",
          to: "/factory/sawing?tab=issued",
          onBack: () => navigate("/factory/sawing?tab=issued"),
        }}
        actions={
          <Stack direction="row" spacing={1.5} alignItems="center">

            {availableCbm > 0 && (
              <Button
                variant="contained"
                size="small"
                startIcon={<Plus size={15} />}
                onClick={handleCreateSawing}
                sx={{
                  backgroundColor: theme.customTokens.brand.primary,
                  color: theme.customTokens.text.inverse,
                  textTransform: "none",
                  fontWeight: 600,
                  borderRadius: "8px",
                  height: 34,
                  px: 2,
                  "&:hover": {
                    backgroundColor: theme.customTokens.brand.primaryScale[800],
                  },
                }}
              >
                {availabilityStatus === "Partially Processed"
                  ? "Continue Sawing"
                  : "Create Sawing"}
              </Button>
            )}
          </Stack>
        }
      >
        <Stack spacing={2.5}>
          {/* 2. CBM AVAILABILITY CARD */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="SAWING AVAILABILITY" />

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 1.75,
                }}
              >
                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Received CBM
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "22px",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatSawingCbmDisplay(receivedCbm) || "0.000"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Total source block volume
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Available CBM
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.customTokens.brand.primary,
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "22px",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatSawingCbmDisplay(availableCbm) || "0.000"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Ready for cutting
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Consumed CBM
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "22px",
                      lineHeight: 1.2,
                    }}
                  >
                    {formatSawingCbmDisplay(consumedCbm) || "0.000"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Processed in sawing
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Utilization %
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "22px",
                      lineHeight: 1.2,
                    }}
                  >
                    {utilizationPercent.toFixed(2)}%
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    {availablePercent.toFixed(1)}% remaining
                  </Typography>
                </Paper>
              </Box>



              {/* Contextual Availability Message */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "6px",
                  backgroundColor:
                    availableCbm > 0
                      ? theme.customTokens.brand.primaryScale[50] || "#fcf4f5"
                      : theme.customTokens.neutrals[100] || "#f5f5f5",
                  border: `1px solid ${
                    availableCbm > 0
                      ? theme.customTokens.brand.primaryScale[200] || "#f2ced2"
                      : theme.customTokens.borders.default
                  }`,
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      availableCbm > 0
                        ? theme.customTokens.brand.primary
                        : "text.secondary",
                    fontWeight: 500,
                    fontSize: "13.5px",
                  }}
                >
                  {availabilityMessage}
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* 3. SOURCE TRACEABILITY CARD */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="SOURCE TRACEABILITY" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {[
                  { label: "Storage Sr No.", value: sourceItem?.storageSrNo || "-" },
                  { label: "Warehouse", value: sourceItem?.storageWarehouseName || "Warehouse B" },
                  { label: "Item Name", value: sourceItem?.itemName || "-" },
                  { label: "Sub Category", value: sourceItem?.subCategory || "-" },
                  { label: "Log No.", value: sourceItem?.batchNo || "-" },
                  {
                    label: "Storage / Issue Date",
                    value: formatDate(sourceItem?.issueDate || record?.processDate),
                  },
                  { label: "Source Type", value: "Veneer Block" },
                  { label: "Inward Serial No.", value: sourceItem?.inwardSrNo || "-" },
                ].map((field) => (
                  <Stack key={field.label} spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.customTokens.text.primary,
                        fontSize: "14px",
                        fontWeight: 500,
                        wordBreak: "break-word",
                      }}
                    >
                      {field.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Box>

          {/* 4. BLOCK DIMENSIONS CARD */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="BLOCK DIMENSIONS" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Length
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {sourceItem?.length !== "-" ? `${sourceItem?.length} m` : "-"}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Width
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {sourceItem?.width !== "-" ? `${sourceItem?.width} m` : "-"}
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Height
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {sourceItem?.height !== "-" ? `${sourceItem?.height} m` : "-"}
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          </Box>

          {/* 5. PROCESS STATUS CARD */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="PROCESS STATUS" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(6, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Process
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Sawing
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Source
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {sourceItem?.storageWarehouseName || "Storage Warehouse B"}
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Current Stage
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Issue for Sawing
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Received CBM
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {formatSawingCbmDisplay(receivedCbm) || "0.000"}
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Available CBM
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: theme.customTokens.brand.primary }}
                  >
                    {formatSawingCbmDisplay(availableCbm) || "0.000"}
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Processing Status
                  </Typography>
                  <Box>
                    <Chip
                      label={processingStatus}
                      size="small"
                      color={
                        processingStatus === "Completed"
                          ? "default"
                          : processingStatus === "Partially Processed"
                          ? "warning"
                          : "success"
                      }
                      sx={{ fontWeight: 600, fontSize: "12px", height: 24 }}
                    />
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* 6. RECORD INFORMATION (AUDIT META) */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="RECORD INFORMATION" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {[
                  { label: "Created By", value: sourceItem?.createdBy || "-" },
                  { label: "Created At", value: formatDate(sourceItem?.createdAt) },
                  { label: "Updated By", value: sourceItem?.updatedBy || "-" },
                  { label: "Updated At", value: formatDate(sourceItem?.updatedAt) },
                ].map((field) => (
                  <Stack key={field.label} spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.customTokens.text.primary,
                        fontSize: "14px",
                        fontWeight: 400,
                      }}
                    >
                      {field.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Box>

        </Stack>
      </FactoryPageShell>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER FOR: SAWING DONE VIEW PAGE (And History)
  // ─────────────────────────────────────────────────────────────────────────────
  if (!isRejected) {
    const isAlreadyIssued = Boolean(inspectionRecord?.isIssued);
    const inspectionPass = inspectionRecord?.qcStatus === "Pass";
    const inspectionFail = inspectionRecord?.qcStatus === "Fail";

    // Summary strip status display
    const doneStatusDisplay = inspectionPass
      ? "Inspection Passed"
      : inspectionFail
      ? "Inspection Failed"
      : isAlreadyIssued
      ? "Issued to Inspection"
      : "Sawing Done";

    const doneStatusColor: "success" | "error" | "info" | "warning" = inspectionPass
      ? "success"
      : inspectionFail
      ? "error"
      : isAlreadyIssued
      ? "info"
      : "warning";

    // Parent Sawing identifier
    const parentSawingSrNo =
      record?.sawingSrNo ||
      record?.parentSawingNo ||
      record?.sourceSnapshot?.sawingSrNo ||
      (record?.id && String(record.id).startsWith("sawing-")
        ? `SAW-${String(record.id).split("-").slice(-2).join("-")}`
        : "-");

    // Output dimension details
    const outputLength = record?.length ? `${record.length} m` : "-";
    const outputWidth = record?.width ? `${record.width} m` : "-";
    const outputThickness =
      record?.thickness || record?.height
        ? `${record.thickness ?? record.height} m`
        : "-";

    const outputCbmDisplay =
      formatSawingCbmDisplay(record?.cbm) ||
      (record?.cbm !== undefined && record?.cbm !== null ? String(record.cbm) : "-");
    const outputCbfDisplay =
      formatSawingCbmDisplay(record?.cbf) ||
      (record?.cbf !== undefined && record?.cbf !== null ? String(record.cbf) : "-");

    const sourceRecCbmDisplay =
      formatSawingCbmDisplay(sourceItem?.cbm) ||
      (record?.receivedCbm !== undefined && record?.receivedCbm !== null
        ? String(record.receivedCbm)
        : "-");
    const sourceAvailCbmDisplay =
      formatSawingCbmDisplay(record?.availableCbm) ||
      (record?.availableCbm !== undefined && record?.availableCbm !== null
        ? String(record.availableCbm)
        : "-");

    return (
      <FactoryPageShell
        title="Sawing Done Item"
        subtitle="View completed Sawing output details and inspection status."
        backNav={{
          label: "Back to Sawing Done",
          to: `/factory/sawing?tab=${tab}`,
          onBack: () => navigate(`/factory/sawing?tab=${tab}`),
        }}
      >
        <Stack spacing={2.5}>
          {/* 1. SUMMARY STRIP */}
          <Paper
            elevation={0}
            sx={(t) => ({
              border: `1px solid ${t.customTokens.borders.default}`,
              borderRadius: "8px",
              backgroundColor: t.customTokens.surfaces.surface,
              p: 2,
            })}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
                alignItems: "center",
              }}
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Sawing Item / Record No.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontWeight: 700,
                    fontSize: "15px",
                  }}
                >
                  {record?.batchNoCode || record?.sawingSrNo || record?.id || "-"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Item Name
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontWeight: 600,
                    fontSize: "15px",
                  }}
                >
                  {record?.itemName || sourceItem?.itemName || "Veneer Block"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Log No.
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.primary",
                    fontWeight: 600,
                    fontSize: "15px",
                  }}
                >
                  {record?.batchNo || record?.logNo || sourceItem?.batchNo || "-"}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Current Status
                </Typography>
                <Box>
                  <Chip
                    label={doneStatusDisplay}
                    size="small"
                    color={doneStatusColor}
                    sx={{
                      fontWeight: 600,
                      fontSize: "12px",
                      height: 24,
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          </Paper>

          {/* 2. SOURCE TRACEABILITY CARD */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="SOURCE TRACEABILITY" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {[
                  {
                    label: "Storage Sr No.",
                    value: record?.storageSrNo || sourceItem?.storageSrNo || "-",
                  },
                  {
                    label: "Inward Sr No.",
                    value: record?.inwardSrNo || sourceItem?.inwardSrNo || "-",
                  },
                  {
                    label: "Source Warehouse",
                    value: sourceItem?.storageWarehouseName || record?.storageWarehouseName || "Warehouse B",
                  },
                  {
                    label: "Source Item Name",
                    value: sourceItem?.itemName || record?.itemName || "-",
                  },
                  {
                    label: "Source Sub Category",
                    value:
                      record?.subCategory ||
                      record?.itemSubCategory ||
                      sourceItem?.subCategory ||
                      "-",
                  },
                  {
                    label: "Source Log No / Batch No",
                    value:
                      record?.batchNo ||
                      record?.logNo ||
                      sourceItem?.batchNo ||
                      "-",
                  },
                  {
                    label: "Parent Sawing No.",
                    value: parentSawingSrNo,
                  },
                  {
                    label: "Sawing Date",
                    value: formatDate(
                      record?.sawingDate || record?.processDate || record?.issuedDate,
                    ),
                  },
                ].map((field) => (
                  <Stack key={field.label} spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.primary",
                        fontSize: "14px",
                        fontWeight: 500,
                        wordBreak: "break-word",
                      }}
                    >
                      {field.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Box>

          {/* 3. SAWING OUTPUT DETAILS & DIMENSIONS CARD */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="SAWING OUTPUT DETAILS" />

              {/* Major Dimensions Prominently Displayed */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Length
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "20px",
                    }}
                  >
                    {outputLength}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    From source veneer block
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Width
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "20px",
                    }}
                  >
                    {outputWidth}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    From source veneer block
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Thickness
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.customTokens.brand.primary,
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "20px",
                    }}
                  >
                    {outputThickness}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Sawing output thickness
                  </Typography>
                </Paper>
              </Box>

              {/* Output Item Key-Value Fields */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                  pt: 1,
                }}
              >
                {[
                  {
                    label: "Log No.",
                    value: record?.batchNo || record?.logNo || sourceItem?.batchNo || "-",
                  },
                  {
                    label: "Batch No",
                    value: record?.batchNoCode || "-",
                  },
                  {
                    label: "Output CBM",
                    value: outputCbmDisplay,
                  },
                  {
                    label: "Output CBF",
                    value: outputCbfDisplay,
                  },
                  {
                    label: "Remark",
                    value: record?.remark || "-",
                    fullWidth: true,
                  },
                ].map((field) => (
                  <Stack
                    key={field.label}
                    spacing={0.5}
                    sx={{
                      minWidth: 0,
                      gridColumn: field.fullWidth ? { xs: "1fr", sm: "span 2", md: "span 4" } : undefined,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: "text.primary",
                        fontSize: "14px",
                        fontWeight: 500,
                        wordBreak: "break-word",
                      }}
                    >
                      {field.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Box>

          {/* 4. VOLUME DETAILS SECTION */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="VOLUME DETAILS" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    This Output CBM
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.customTokens.brand.primary,
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {outputCbmDisplay}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Output Item Volume
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    This Output CBF
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {outputCbfDisplay}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Output Item Volume
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Source Received CBM
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {sourceRecCbmDisplay}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Source Veneer Block
                  </Typography>
                </Paper>

                <Paper
                  elevation={0}
                  sx={(t) => ({
                    p: 2,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Source Available CBM
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "18px",
                    }}
                  >
                    {sourceAvailCbmDisplay}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                    Remaining in Source Block
                  </Typography>
                </Paper>
              </Box>
            </Stack>
          </Box>

          {/* 5. PROCESS STATUS & FLOW */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2.5}>
              <FormSectionHeader title="PROCESS STATUS" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Process
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Sawing
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Current Stage
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Sawing Done
                  </Typography>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Inspection Status
                  </Typography>
                  <Box>
                    <Chip
                      label={
                        inspectionPass
                          ? "Passed"
                          : inspectionFail
                          ? "Failed"
                          : isAlreadyIssued
                          ? "Issued"
                          : "Not Issued"
                      }
                      size="small"
                      color={
                        inspectionPass
                          ? "success"
                          : inspectionFail
                          ? "error"
                          : isAlreadyIssued
                          ? "info"
                          : "default"
                      }
                      sx={{ fontWeight: 600, height: 24, fontSize: "12px" }}
                    />
                  </Box>
                </Stack>

                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Next Process
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Sawing Inspection
                  </Typography>
                </Stack>
              </Box>

              <FactoryProductionPipeline
                currentStage={
                  inspectionPass || inspectionFail
                    ? "sawing-inspection-done"
                    : isAlreadyIssued
                      ? "sawing-inspection"
                      : "sawing-done"
                }
              />

              {/* Inspection contextual message or details */}
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: "6px",
                  backgroundColor: !isAlreadyIssued
                    ? theme.customTokens.neutrals[50] || "#f9f9f9"
                    : theme.customTokens.brand.primaryScale[50] || "#fcf4f5",
                  border: `1px solid ${
                    !isAlreadyIssued
                      ? theme.customTokens.borders.default
                      : theme.customTokens.brand.primaryScale[200] || "#f2ced2"
                  }`,
                }}
              >
                {!isAlreadyIssued ? (
                  <Typography variant="body2" sx={{ color: "text.secondary", fontSize: "13px" }}>
                    ℹ️ This Sawing Done item will be issued individually for inspection.
                  </Typography>
                ) : (
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "flex-start", sm: "center" }} spacing={1}>
                    <Typography variant="body2" sx={{ color: theme.customTokens.brand.primary, fontWeight: 600, fontSize: "13px" }}>
                      ✓ This item has been issued to Sawing Inspection.
                      {inspectionRecord?.inspectionNo ? ` (Inspection ID: ${inspectionRecord.inspectionNo})` : ""}
                    </Typography>
                    <Button
                      variant="text"
                      size="small"
                      onClick={() => navigate("/factory/sawing-inspection")}
                      sx={{
                        textTransform: "none",
                        fontWeight: 600,
                        color: theme.customTokens.brand.primary,
                        p: 0,
                        minWidth: "auto",
                      }}
                    >
                      View in Inspection →
                    </Button>
                  </Stack>
                )}
              </Box>
            </Stack>
          </Box>

          {/* 6. INSPECTION RESULT SECTION (If inspection data exists) */}
          {inspectionRecord && (
            <Box sx={(t) => formSectionCardSx(t)}>
              <Stack spacing={2}>
                <FormSectionHeader title="INSPECTION" />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "repeat(2, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Inspection No.
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {inspectionRecord.inspectionNo || "-"}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Inspection Date
                    </Typography>
                    <Typography variant="body2">
                      {formatDate(inspectionRecord.inspectionDate)}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Result
                    </Typography>
                    <Box>
                      <Chip
                        label={
                          inspectionRecord.qcStatus === "Pass"
                            ? "PASS"
                            : inspectionRecord.qcStatus === "Fail"
                            ? "FAIL"
                            : "PENDING"
                        }
                        size="small"
                        color={
                          inspectionRecord.qcStatus === "Pass"
                            ? "success"
                            : inspectionRecord.qcStatus === "Fail"
                            ? "error"
                            : "warning"
                        }
                        sx={{ fontWeight: 700, height: 24, fontSize: "12px" }}
                      />
                    </Box>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Remark
                    </Typography>
                    <Typography variant="body2">
                      {inspectionRecord.remark || "-"}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </Box>
          )}

          {/* 7. OTHER OUTPUTS FROM SAME SAWING (Optional / Conditional) */}
          {siblingSawingItems.length > 0 && (
            <Box sx={(t) => formSectionCardSx(t)}>
              <Stack spacing={2}>
                <FormSectionHeader title="OTHER OUTPUTS FROM THIS SAWING" />
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Other Process Detail outputs generated from parent Sawing #{parentSawingSrNo}
                </Typography>
                <Box sx={getDialogScrollableTableSx(theme)}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={getDialogHeaderCellSx(theme)}>Sawing Done No.</TableCell>
                        <TableCell sx={getDialogHeaderCellSx(theme)}>Log No.</TableCell>
                        <TableCell sx={getDialogHeaderCellSx(theme)}>Thickness</TableCell>
                        <TableCell sx={getDialogHeaderCellSx(theme)}>CBM</TableCell>
                        <TableCell sx={getDialogHeaderCellSx(theme)}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {siblingSawingItems.map((item: any, idx: number) => (
                        <TableRow key={item.id || idx}>
                          <TableCell sx={getDialogBodyCellSx(theme)}>
                            {item.batchNoCode || item.sawingSrNo || item.id || `Item ${idx + 1}`}
                          </TableCell>
                          <TableCell sx={getDialogBodyCellSx(theme)}>
                            {item.batchNo || item.logNo || "-"}
                          </TableCell>
                          <TableCell sx={getDialogBodyCellSx(theme)}>
                            {item.thickness ? `${item.thickness} m` : "-"}
                          </TableCell>
                          <TableCell sx={getDialogBodyCellSx(theme)}>
                            {formatSawingCbmDisplay(item.cbm) || item.cbm || "-"}
                          </TableCell>
                          <TableCell sx={getDialogBodyCellSx(theme)}>
                            <Chip
                              label={item.status || "Completed"}
                              size="small"
                              color="default"
                              sx={{ fontSize: "11px", height: 22 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Stack>
            </Box>
          )}

          {/* 8. RECORD INFORMATION (AUDIT META) */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="RECORD INFORMATION" />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {[
                  { label: "Created By", value: record?.createdBy || "-" },
                  { label: "Created At", value: formatDate(record?.createdAt) },
                  { label: "Updated By", value: record?.updatedBy || "-" },
                  { label: "Updated At", value: formatDate(record?.updatedAt) },
                ].map((field) => (
                  <Stack key={field.label} spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "12px",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.customTokens.text.primary,
                        fontSize: "14px",
                        fontWeight: 400,
                      }}
                    >
                      {field.value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Box>

        </Stack>

        {/* ── Issue to Inspection Confirmation Dialog ── */}
        <ConfirmationDialog
          cancelLabel="Cancel"
          confirmLabel="Issue"
          description={`Are you sure you want to issue "${record?.itemName || "Sawing Done Item"}" individually to Sawing Inspection?`}
          onClose={() => setInspectionDialogOpen(false)}
          onConfirm={() => void handleConfirmIssueForInspection()}
          open={inspectionDialogOpen}
          title="Confirm Issue for Inspection"
          tone="default"
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

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER FOR: REJECTED SAWING VIEW PAGE
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <FactoryPageShell
      title="View Rejected Sawing Item"
      subtitle="View details for this rejected sawing record"
      backNav={{
        label: "Back to Sawing",
        to: `/factory/sawing?tab=${tab}`,
        onBack: () => navigate(`/factory/sawing?tab=${tab}`),
      }}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label="Rejected"
            size="small"
            color="error"
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        {/* Source overview */}
        <FactorySourceOverviewPanel
          title="Source Item Overview"
          items={[
            { label: "Storage Sr No.", value: sourceItem?.storageSrNo || "-" },
            { label: "Item Name", value: sourceItem?.itemName || "-" },
            { label: "Log No.", value: sourceItem?.batchNo || "-" },
            {
              label: "Source Length",
              value: sourceItem?.length !== "-" ? String(sourceItem?.length).replace(/\s*(m|mm|mtr)$/i, "") : "-",
            },
            {
              label: "Source Width",
              value: sourceItem?.width !== "-" ? String(sourceItem?.width).replace(/\s*(m|mm|mtr)$/i, "") : "-",
            },
            {
              label: "Source Height",
              value: sourceItem?.height !== "-" ? String(sourceItem?.height).replace(/\s*(m|mm|mtr)$/i, "") : "-",
            },
            {
              label: "Source CBM",
              value: record?.receivedCbm ?? (sourceItem?.cbm ? String(sourceItem.cbm).replace(/\s*(m³|cbm)$/i, "") : "-"),
            },
            { label: "Warehouse", value: sourceItem?.storageWarehouseName || "Warehouse B" },
          ]}
        />

        {/* Output details */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2.5}>
            <FormSectionHeader title="Rejected Item Details" />

            {record ? (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                  gap: 2,
                }}
              >
                {[
                  { label: "Storage Sr No.", value: record.storageSrNo || sourceItem?.storageSrNo || "-" },
                  {
                    label: "Sawing Date",
                    value: record.processDate
                      ? typeof record.processDate === "string" && record.processDate.includes("T")
                        ? record.processDate.slice(0, 10)
                        : String(record.processDate).slice(0, 10)
                      : record.sawingDate
                      ? String(record.sawingDate).slice(0, 10)
                      : record.issuedDate
                      ? String(record.issuedDate).slice(0, 10)
                      : "-",
                  },
                  { label: "Item Name", value: record.itemName || sourceItem?.itemName || "-" },
                  { label: "Sub Category", value: record.subCategory || record.itemSubCategory || sourceItem?.subCategory || "-" },
                  { label: "Log No.", value: record.batchNo || "-" },
                  { label: "Batch No", value: record.batchNoCode || "-" },
                  { label: "Length (mm)", value: record.length ?? "-" },
                  { label: "Width (mm)", value: record.width ?? "-" },
                  { label: "Thickness (mm)", value: record.thickness ?? record.height ?? "-" },
                  { label: "CBM", value: record.cbm ?? "-" },
                  { label: "CBF", value: record.cbf ?? "-" },
                  { label: "Status", value: "Rejected" },
                  { label: "Created By", value: record.createdBy || "-" },
                  { label: "Updated By", value: record.updatedBy || "-" },
                  { label: "Remark", value: record.remark || "Rejected", fullWidth: true },
                ].map((field) => (
                  <Stack
                    key={field.label}
                    spacing={0.5}
                    sx={{
                      minWidth: 0,
                      gridColumn: field.fullWidth ? { xs: "1fr", sm: "span 2", md: "span 4" } : undefined,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "13px",
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: theme.customTokens.text.primary,
                        fontSize: "14px",
                        fontWeight: 400,
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {String(field.value)}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No details available for ID {id}.
              </Typography>
            )}
          </Stack>
        </Box>

        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2.5}>
            <FormSectionHeader title="PROCESS STATUS" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {[
                { label: "Process", value: "Sawing" },
                { label: "Current Stage", value: "Rejected at Sawing" },
                { label: "Status", value: "Rejected" },
                { label: "Next Process", value: "Not Available" },
              ].map((field) => (
                <Stack key={field.label} spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{ color: "text.secondary", fontSize: "12px", fontWeight: 600, textTransform: "uppercase" }}
                  >
                    {field.label}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: "14px", fontWeight: 600 }}>
                    {field.value}
                  </Typography>
                </Stack>
              ))}
            </Box>

            <FactoryProductionPipeline currentStage="sawing" rejected />

            <FactoryContextualStatusMessage
              isRejected
              message="This item was rejected during Sawing and cannot continue to the next production stage."
            />
          </Stack>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
};

  export default SawingViewPage;
