import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Snackbar,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactoryProductionPipeline } from "../../shared/FactoryProductionPipeline";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { dryingInspectionDefinition } from "../../shared/factoryDefinitions";
import {
  getFactoryIssuedWorkById,
  factoryIssuedWorkToRow,
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
} from "../../shared/factoryIssuedWorkStore";
import {
  formatSQM,
  formatSQF,
  parseNumericValue,
} from "../../../shared/numberFormat";
import { InspectionDecisionDialog } from "../../shared/listing/factoryListingParts";
import { MoveToWarehouseBDialog } from "../../inspection/MoveToWarehouseBDialog";
import { moveFactoryRowToWarehouseB } from "../../../warehouses/shared/warehouseTransferLegacy";

/** Format clean display measurement without floating precision errors. (e.g. 1.70 mm, 2.66 m) */
function formatDisplayDimension(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === "") return "-";
  const str = String(value).trim();
  if (str === "-") return "-";

  const match = str.match(/^([0-9]+(?:\.[0-9]+)?)\s*([a-zA-Z]+)?$/);
  if (match) {
    const num = Number(match[1]);
    if (!Number.isFinite(num)) return "-";
    const formattedNum = Number(num.toFixed(2)).toString();
    const resolvedUnit = match[2] || unit || "";
    return resolvedUnit ? `${formattedNum} ${resolvedUnit}` : formattedNum;
  }

  const parsed = Number(str);
  if (Number.isFinite(parsed)) {
    const formatted = Number(parsed.toFixed(2)).toString();
    return unit ? `${formatted} ${unit}` : formatted;
  }

  return str;
}

/** Format dates into standard British English: DD Mon YYYY */
function formatDisplayDate(value: unknown, withTime = false): string {
  if (!value) return "-";
  let date: Date | null = null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    date = value;
  } else if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      date = parsed;
    }
  }

  if (!date) return String(value);

  if (withTime) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Format leaf quantities cleanly as integers */
function formatLeafInteger(value: unknown): string {
  const parsed = parseNumericValue(value);
  if (parsed === null || !Number.isFinite(parsed)) return "-";
  return Math.round(parsed).toLocaleString("en-US");
}

export const DryingInspectionViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateData = location.state as
    | { record?: Record<string, unknown>; tab?: string }
    | undefined;

  const [recordState, setRecordState] = useState<Record<string, unknown> | undefined>(() => {
    if (stateData?.record) return stateData.record;
    if (!id) return undefined;
    const foundInRows = dryingInspectionDefinition.rows.find(
      (r) => String(r.id) === String(id),
    );
    if (foundInRows) return foundInRows as Record<string, unknown>;
    const workItem = getFactoryIssuedWorkById(id);
    return workItem
      ? (factoryIssuedWorkToRow(workItem) as Record<string, unknown>)
      : undefined;
  });

  const record = recordState;

  // Determine active tab state
  const rawListingState = String(record?.listingState || "");
  const tab =
    stateData?.tab ||
    (rawListingState === "done"
      ? "done"
      : rawListingState === "history" || rawListingState === "failed"
        ? "history"
        : "issued");

  const listPath = `${
    location.pathname.startsWith("/factory/inspection/")
      ? "/factory/inspection"
      : "/factory/drying-inspection"
  }?tab=${tab}`;

  const isDone = tab === "done" || record?.qcStatus === "Done" || rawListingState === "done";
  const isHistory = tab === "history" || rawListingState === "history" || rawListingState === "failed";
  const isPending = !isDone && !isHistory;

  // Warehouse transfer status for passed items
  const isAlreadyTransferred = Boolean(
    record?.transferredToWarehouse ||
      record?.warehouseTransferStatus === "Transferred" ||
      record?.warehouseBStatus === "Transferred to Warehouse B" ||
      record?.status === "Transferred to Warehouse B",
  );

  // Dialog states
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  // ==================== IDENTIFIERS & REFERENCES ====================
  const dryingRef = String(
    record?.dryingNo ||
      record?.dryingSrNo ||
      record?.storageSrNo ||
      record?.processNo ||
      record?.id ||
      "-",
  );

  const slicingRef = String(
    record?.slicingNo ||
      record?.slicingSrNo ||
      record?.sourceSlicingNo ||
      record?.sourceIssueId ||
      record?.sourceStorageId ||
      "-",
  );

  const itemName = String(
    record?.itemName || record?.productName || "Beech Veneer",
  );
  const subCategory = String(record?.subCategory || record?.itemSubCategory || "-");
  const logNo = String(record?.logCode || record?.logNo || record?.batchNo || "-");
  const bundleNo = String(record?.bundleNumber || record?.bundleNo || "-");
  const palletNo = String(record?.palletNo || record?.palletNumber || "-");

  const rawWarehouse =
    record?.storageWarehouseName ||
    record?.warehouseName ||
    record?.sourceWarehouse ||
    record?.storageWarehouse;
  const sourceWarehouse =
    typeof rawWarehouse === "string" && rawWarehouse.trim()
      ? rawWarehouse.trim()
      : "Warehouse B";

  const rawIssuedDate =
    record?.issuedDate || record?.issueDate || record?.date;
  const issuedDate = formatDisplayDate(rawIssuedDate);

  // ==================== MATERIAL DETAILS ====================
  const rawLength = record?.length;
  const rawWidth = record?.width;
  const rawThickness = record?.thickness ?? record?.height;
  const grade = String(record?.grade || record?.itemGrade || "Export");
  const color = String(record?.color || record?.colour || "-");

  const lengthDisplay = formatDisplayDimension(rawLength, "m");
  const widthDisplay = formatDisplayDimension(rawWidth, "m");
  const thicknessDisplay = formatDisplayDimension(rawThickness, "mm");

  const parsedSqm = parseNumericValue(record?.sqm ?? record?.totalSqMeter);
  const parsedSqf = parseNumericValue(record?.sqf);

  const sqmDisplay = parsedSqm !== null && parsedSqm > 0 ? formatSQM(parsedSqm) : "-";
  const sqfDisplay =
    parsedSqf !== null && parsedSqf > 0
      ? formatSQF(parsedSqf)
      : parsedSqm !== null && parsedSqm > 0
        ? formatSQF(parsedSqm * 10.7639)
        : "-";

  // ==================== INSPECTION QUANTITY (LEAF-BASED) ====================
  const rawReceived =
    record?.noOfLeaves ?? record?.totalLeaves ?? record?.noOfSheets ?? 0;
  const receivedLeaves = parseNumericValue(rawReceived) || 0;

  const rawPassed = record?.passQty;
  const rawFailed = record?.failQty;
  const parsedPass = parseNumericValue(rawPassed);
  const parsedFail = parseNumericValue(rawFailed);

  const passedLeaves = parsedPass !== null && parsedPass >= 0 ? parsedPass : 0;
  const failedLeaves = parsedFail !== null && parsedFail >= 0 ? parsedFail : 0;

  const hasInspectionResults =
    (parsedPass !== null && parsedPass > 0) ||
    (parsedFail !== null && parsedFail > 0) ||
    isDone ||
    isHistory;

  const receivedLeavesDisplay = formatLeafInteger(receivedLeaves);
  const passedLeavesDisplay = hasInspectionResults ? formatLeafInteger(passedLeaves) : "-";
  const failedLeavesDisplay = hasInspectionResults ? formatLeafInteger(failedLeaves) : "-";

  // Pass / Fail Visual Breakdown
  const passPercent =
    receivedLeaves > 0
      ? Math.min(100, Math.max(0, (passedLeaves / receivedLeaves) * 100))
      : 0;
  const failPercent =
    receivedLeaves > 0
      ? Math.min(100, Math.max(0, (failedLeaves / receivedLeaves) * 100))
      : 0;

  // Status computation
  const statusLabel = useMemo(() => {
    if (isPending) {
      if (record?.qcStatus === "Recheck" || record?.isRecheck) return "Recheck";
      if (record?.status === "Partially Pending") return "Partially Inspected";
      return "Pending";
    }
    if (isDone) {
      if (failedLeaves > 0 && passedLeaves === 0) return "Failed";
      if (passedLeaves > 0 && failedLeaves > 0) return "Partially Inspected";
      return "Inspection Done";
    }
    if (isHistory) {
      if (failedLeaves > 0 && passedLeaves === 0) return "Failed";
      return String(record?.inspectionEventStatus || "Inspection History");
    }
    return String(record?.status || "Pending");
  }, [isPending, isDone, isHistory, record, passedLeaves, failedLeaves]);

  const statusBadgeColor = useMemo(() => {
    if (statusLabel === "Inspection Done" || statusLabel === "Passed") {
      return "success" as const;
    }
    if (statusLabel === "Pending" || statusLabel === "Partially Inspected") {
      return "warning" as const;
    }
    if (statusLabel === "Failed" || statusLabel === "Recheck") {
      return "error" as const;
    }
    return "info" as const;
  }, [statusLabel]);

  // Inspection Result fields
  const inspectionDateDisplay = formatDisplayDate(record?.inspectionDate);
  const inspectionRemark =
    typeof record?.remark === "string" && record.remark.trim() && record.remark.trim() !== "-"
      ? record.remark.trim()
      : "-";
  const inspectionImage =
    typeof record?.inspectionImage === "string" ? record.inspectionImage.trim() : "";
  const inspectionImageName = String(record?.inspectionImageName || "Attachment");
  const inspectedBy = String(record?.inspectedBy || record?.updatedBy || "-");

  // Warehouse Movement Details
  const destinationWarehouseName = String(
    record?.storageWarehouseName || "Storage Warehouse / Warehouse B",
  );
  const storageSrNo = String(record?.storageSrNo || "-");
  const transferDateDisplay = formatDisplayDate(record?.transferDate || record?.updatedAt);
  const transferredBy = String(record?.transferredBy || record?.updatedBy || "-");

  // Record audit info
  const createdBy = String(record?.createdBy || "-");
  const createdAt = formatDisplayDate(record?.createdAt, true);
  const updatedBy = String(record?.updatedBy || "-");
  const updatedAt = formatDisplayDate(record?.updatedAt, true);

  // ==================== ACTIONS HANDLERS ====================
  const handleSaveInspection = (
    targetRow: any,
    remarkVal?: string,
    inspectionDateVal?: string,
    counts?: { passQty: number; failQty: number },
    attachment?: { name: string; dataUrl: string },
  ) => {
    const pQty = counts?.passQty ?? receivedLeaves;
    const fQty = counts?.failQty ?? 0;
    const inspLeaves = pQty + fQty;
    const inspDate = inspectionDateVal || new Date().toISOString().slice(0, 10);
    const enteredRemark = remarkVal || String(targetRow?.remark || "Inspection completed");

    const patch: Record<string, unknown> = {
      passQty: String(pQty),
      failQty: String(fQty),
      noOfLeaves: String(inspLeaves),
      totalLeaves: String(inspLeaves),
      inspectionDate: inspDate,
      remark: enteredRemark,
      qcStatus: fQty > 0 && pQty === 0 ? "Fail" : "Done",
      listingState: "done",
      status: fQty > 0 && pQty === 0 ? "Failed" : "Inspection Done",
      warehouseBStatus: "Not transferred",
      ...(attachment
        ? {
            inspectionImage: attachment.dataUrl,
            inspectionImageName: attachment.name,
          }
        : {}),
    };

    const workItemId = targetRow.workItemId || (String(targetRow.id).startsWith("factory-work-") ? targetRow.id : null);
    if (workItemId) {
      if (fQty > 0 && pQty === 0) {
        failFactoryIssuedWork(workItemId, patch);
      } else {
        completeFactoryIssuedWork(workItemId, patch);
      }
    }

    setRecordState((prev) => ({
      ...prev,
      ...patch,
    }));

    setInspectionDialogOpen(false);
    setToastNotification({
      message: "Inspection updated successfully.",
      severity: "success",
    });
  };

  const handleConfirmMoveWarehouseB = (warehouse: any) => {
    if (!record) return;

    moveFactoryRowToWarehouseB({
      ...record,
      storageWarehouseId: warehouse.id,
      storageWarehouseName: warehouse.name,
      warehouseName: warehouse.name,
      transferDate: new Date().toISOString().slice(0, 10),
    });

    const updatePatch: Record<string, unknown> = {
      transferredToWarehouse: true,
      warehouseTransferStatus: "Transferred",
      warehouseBStatus: "Transferred to Warehouse B",
      status: "Transferred to Warehouse B",
      storageWarehouseName: warehouse.name,
      transferDate: new Date().toISOString().slice(0, 10),
    };

    setRecordState((prev) => ({
      ...prev,
      ...updatePatch,
    }));

    setMoveDialogOpen(false);
    setToastNotification({
      message: `Passed veneer moved to ${warehouse.name} successfully.`,
      severity: "success",
    });
  };

  return (
    <FactoryPageShell
      title="View Drying Inspection"
      subtitle="Review dried veneer quantity, inspection result and warehouse movement status."
      backNav={{
        label: "Back to Drying Inspection",
        to: listPath,
        onBack: () => navigate(listPath),
      }}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={statusLabel}
            size="small"
            color={statusBadgeColor}
            sx={{ fontWeight: 600, px: 0.5 }}
          />
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        {/* ==================== 1. SOURCE DETAILS ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="SOURCE DETAILS" />
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
                { label: "Drying Reference", value: dryingRef },
                ...(slicingRef !== "-" && slicingRef !== dryingRef
                  ? [{ label: "Slicing Reference", value: slicingRef }]
                  : []),
                { label: "Item Name", value: itemName },
                { label: "Item Sub Category", value: subCategory },
                { label: "Log No", value: logNo },
                { label: "Bundle No", value: bundleNo },
                { label: "Pallet No", value: palletNo },
                { label: "Source Warehouse", value: sourceWarehouse },
                { label: "Issued Date", value: issuedDate },
              ]
                .filter((item) => item.value && item.value !== "-")
                .map((field) => (
                  <Stack key={field.label} spacing={0.5} sx={{ minWidth: 0 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.75rem",
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
                        fontSize: "0.875rem",
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

        {/* ==================== 2. MATERIAL DETAILS ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="MATERIAL DETAILS" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: color !== "-" ? "repeat(7, minmax(0, 1fr))" : "repeat(6, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {[
                { label: "Length", value: lengthDisplay },
                { label: "Width", value: widthDisplay },
                { label: "Thickness", value: thicknessDisplay },
                { label: "Grade", value: grade },
                ...(color !== "-" ? [{ label: "Color", value: color }] : []),
                { label: "SQM", value: sqmDisplay },
                { label: "SQF", value: sqfDisplay },
              ].map((item) => (
                <Paper
                  key={item.label}
                  elevation={0}
                  sx={(t) => ({
                    p: 1.75,
                    borderRadius: "8px",
                    border: `1px solid ${t.customTokens.borders.default}`,
                    backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                  })}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 600,
                      mt: 0.5,
                      fontSize: "1.05rem",
                    }}
                  >
                    {item.value}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Box>

        {/* ==================== 3. INSPECTION QUANTITY ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2.5}>
            <FormSectionHeader title="INSPECTION QUANTITY" />
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
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Received Leaves
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: "text.primary",
                    fontWeight: 700,
                    mt: 0.5,
                    fontSize: "1.35rem",
                  }}
                >
                  {receivedLeavesDisplay}
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
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Passed Leaves
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.palette.success.main,
                    fontWeight: 700,
                    mt: 0.5,
                    fontSize: "1.35rem",
                  }}
                >
                  {passedLeavesDisplay}
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
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Failed Leaves
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: failedLeaves > 0 ? theme.palette.error.main : "text.secondary",
                    fontWeight: 700,
                    mt: 0.5,
                    fontSize: "1.35rem",
                  }}
                >
                  {failedLeavesDisplay}
                </Typography>
              </Paper>
            </Box>

            {/* Subtle Breakdown Indicator */}
            {hasInspectionResults && receivedLeaves > 0 && (
              <Box
                sx={(t) => ({
                  p: 1.5,
                  borderRadius: "6px",
                  backgroundColor: t.customTokens.neutrals[100] || "#f5f5f5",
                  borderLeft: `4px solid ${
                    failedLeaves > 0 ? theme.palette.warning.main : theme.palette.success.main
                  }`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 1,
                })}
              >
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontWeight: 600, fontSize: "0.85rem" }}
                >
                  Passed: {passedLeaves} / {receivedLeaves} ({passPercent.toFixed(1)}%)
                  {failedLeaves > 0 && (
                    <Box component="span" sx={{ ml: 2, color: theme.palette.error.main }}>
                      Failed: {failedLeaves} / {receivedLeaves} ({failPercent.toFixed(1)}%)
                    </Box>
                  )}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  Total accounted: {passedLeaves + failedLeaves} / {receivedLeaves} leaves
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>

        {/* ==================== 4. INSPECTION RESULT ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="INSPECTION RESULT" />
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
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Inspection Status
                </Typography>
                <Box sx={{ mt: 0.25 }}>
                  <Chip
                    label={statusLabel}
                    size="small"
                    color={statusBadgeColor}
                    sx={{ fontWeight: 600, height: 24, fontSize: "0.75rem" }}
                  />
                </Box>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Inspection Date
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {inspectionDateDisplay}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Passed Leaves
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 600 }}
                >
                  {passedLeavesDisplay}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Failed Leaves
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 600 }}
                >
                  {failedLeavesDisplay}
                </Typography>
              </Stack>

              {inspectedBy !== "-" && (
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Inspected By
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {inspectedBy}
                  </Typography>
                </Stack>
              )}

              {inspectionRemark !== "-" && (
                <Stack spacing={0.5} sx={{ gridColumn: { xs: "1fr", sm: "span 2", md: "span 3" } }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Inspection Remark
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {inspectionRemark}
                  </Typography>
                </Stack>
              )}
            </Box>

            {/* Attachment preview if exists */}
            {Boolean(inspectionImage) && (
              <Box sx={{ pt: 1 }}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                    display: "block",
                    mb: 1,
                  }}
                >
                  Attachment
                </Typography>
                <Box
                  component="a"
                  href={inspectionImage}
                  rel="noreferrer"
                  target="_blank"
                  title="Open inspection photo"
                  sx={{
                    display: "inline-block",
                    maxWidth: 240,
                    borderRadius: "8px",
                    overflow: "hidden",
                    border: `1px solid ${theme.customTokens.borders.default}`,
                  }}
                >
                  <Box
                    alt={inspectionImageName}
                    component="img"
                    src={inspectionImage}
                    sx={{
                      display: "block",
                      maxHeight: 160,
                      maxWidth: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
                <Typography variant="caption" sx={{ display: "block", color: "text.secondary", mt: 0.5 }}>
                  {inspectionImageName}
                </Typography>
              </Box>
            )}
            <FactoryProductionPipeline
              currentStage={
                isAlreadyTransferred
                  ? "storage-raw-veneer"
                  : isDone || isHistory
                    ? "drying-inspection-done"
                    : "drying-inspection"
              }
            />
          </Stack>
        </Box>

        {/* ==================== 5. WAREHOUSE MOVEMENT ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="WAREHOUSE MOVEMENT" />
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
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Destination
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {destinationWarehouseName}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Warehouse Type
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  Warehouse B
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Destination Material Type
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 600 }}
                >
                  Raw Veneer
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Transfer Status
                </Typography>
                <Box sx={{ mt: 0.25 }}>
                  <Chip
                    label={isAlreadyTransferred ? "Moved to Warehouse B" : "Pending Transfer"}
                    size="small"
                    color={isAlreadyTransferred ? "success" : "default"}
                    sx={{ fontWeight: 600, height: 24, fontSize: "0.75rem" }}
                  />
                </Box>
              </Stack>

              {isAlreadyTransferred && (
                <>
                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Storage Sr No
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                    >
                      {storageSrNo}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Moved Quantity
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 600 }}
                    >
                      {passedLeavesDisplay} Leaves
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Transfer Date
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                    >
                      {transferDateDisplay}
                    </Typography>
                  </Stack>

                  <Stack spacing={0.5}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.02em",
                      }}
                    >
                      Transferred By
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                    >
                      {transferredBy}
                    </Typography>
                  </Stack>
                </>
              )}
            </Box>
          </Stack>
        </Box>

        {/* ==================== 6. RECORD INFORMATION ==================== */}
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
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Created By
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {createdBy}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Created At
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {createdAt}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Updated By
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {updatedBy}
                </Typography>
              </Stack>

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Updated At
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {updatedAt}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* ==================== 7. REMARK ==================== */}
        {inspectionRemark !== "-" && (
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={1.5}>
              <FormSectionHeader title="REMARK" />
              <Typography
                variant="body2"
                sx={{
                  color: "text.primary",
                  fontSize: "0.875rem",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                }}
              >
                {inspectionRemark}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* ==================== BOTTOM ACTIONS ==================== */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            pt: 1,
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >

          <Stack direction="row" spacing={1.5}>
            {/* If pending: show Update Inspection */}
            {isPending && (
              <Button
                onClick={() => setInspectionDialogOpen(true)}
                variant="contained"
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  textTransform: "none",
                  px: 2.5,
                  height: 38,
                  backgroundColor: theme.customTokens.brand.primary,
                  "&:hover": {
                    backgroundColor: theme.customTokens.brand.primaryScale[700] || theme.customTokens.brand.primary,
                  },
                }}
              >
                Update Inspection
              </Button>
            )}

            {/* If Inspection Done and not moved: show Move to Storage Warehouse */}
            {isDone && passedLeaves > 0 && !isAlreadyTransferred && (
              <Button
                onClick={() => setMoveDialogOpen(true)}
                variant="contained"
                sx={{
                  borderRadius: "8px",
                  fontWeight: 600,
                  textTransform: "none",
                  px: 2.5,
                  height: 38,
                  backgroundColor: theme.customTokens.brand.primary,
                  "&:hover": {
                    backgroundColor: theme.customTokens.brand.primaryScale[700] || theme.customTokens.brand.primary,
                  },
                }}
              >
                Move to Storage Warehouse
              </Button>
            )}
          </Stack>
        </Box>
      </Stack>

      {/* ==================== INSPECTION ACTION DIALOG ==================== */}
      {inspectionDialogOpen && record && (
        <InspectionDecisionDialog
          open={inspectionDialogOpen}
          row={record as any}
          processSlug="drying-inspection"
          passCount={0}
          failCount={0}
          onClose={() => setInspectionDialogOpen(false)}
          onPass={(targetRow, remarkVal, dateVal, counts, attachment) =>
            handleSaveInspection(targetRow, remarkVal, dateVal, counts, attachment)
          }
          onFail={(targetRow, remarkVal, dateVal, counts, attachment) =>
            handleSaveInspection(targetRow, remarkVal, dateVal, counts, attachment)
          }
        />
      )}

      {/* ==================== MOVE TO WAREHOUSE B DIALOG ==================== */}
      {moveDialogOpen && record && (
        <MoveToWarehouseBDialog
          row={record as any}
          itemCount={1}
          onClose={() => setMoveDialogOpen(false)}
          onConfirm={handleConfirmMoveWarehouseB}
        />
      )}

      {/* Notifications Toast */}
      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={4000}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {toastNotification ? (
          <Alert
            severity={toastNotification.severity}
            onClose={() => setToastNotification(null)}
            sx={{ width: "100%", boxShadow: 3 }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </FactoryPageShell>
  );
};

export default DryingInspectionViewPage;
