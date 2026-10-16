import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronLeft } from "lucide-react";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { dryingDefinition } from "../../shared/factoryDefinitions";
import {
  getFactoryIssuedWorkById,
  factoryIssuedWorkToRow,
} from "../../shared/factoryIssuedWorkStore";
import {
  formatSQM,
  formatSQF,
  parseNumericValue,
} from "../../../shared/numberFormat";
import {
  useDryingFlowState,
  applyDryingListingRows,
  dryingReceivedLeafCount,
  dryingLeafCount,
  dryingLeafArea,
} from "../dryingFrontendStore";

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

export const DryingViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Subscribe to live drying flow state
  useDryingFlowState();

  const stateData = location.state as
    | { record?: Record<string, unknown>; tab?: string }
    | undefined;
  const passedRecord = stateData?.record;

  const record = useMemo(() => {
    if (passedRecord) return passedRecord;
    if (!id) return undefined;

    // 1. Check in definition rows
    const foundInRows = dryingDefinition.rows.find((r) => String(r.id) === String(id));
    if (foundInRows) return foundInRows as Record<string, unknown>;

    // 2. Check in factoryIssuedWorkStore
    const workItem = getFactoryIssuedWorkById(id);
    if (workItem) return factoryIssuedWorkToRow(workItem) as Record<string, unknown>;

    // 3. Check in drying applied flow rows across tabs
    for (const t of ["issued", "done", "history", "rejected"]) {
      const applied = applyDryingListingRows(
        dryingDefinition.rows as unknown as readonly Record<string, unknown>[],
        t,
      );
      const matched = applied.find((r) => String(r.id) === String(id));
      if (matched) return matched;
    }

    return undefined;
  }, [id, passedRecord]);

  const rawListingState = String(record?.listingState || "");
  const tab =
    stateData?.tab ||
    (rawListingState === "done"
      ? "done"
      : rawListingState === "history"
        ? "history"
        : rawListingState === "rejected"
          ? "rejected"
          : "issued");

  const listPath = `/factory/drying?tab=${tab}`;

  // ==================== 1. & 2. HEADER & COMPACT SUMMARY VALUES ====================
  const dryingNo = String(
    record?.dryingNo ||
      record?.processNo ||
      record?.dryingSrNo ||
      record?.batchNo ||
      record?.id ||
      "-",
  );

  const itemName = String(
    record?.itemName || record?.productName || "Beech Veneer",
  );
  const subCategory = String(record?.subCategory || record?.itemSubCategory || "-");
  const logNo = String(record?.logNo || record?.batchNo || record?.logCode || "-");
  const bundleNo = String(record?.bundleNumber || record?.bundleNo || "-");
  const palletNo = String(record?.palletNo || record?.palletNumber || "-");

  const rawWarehouse =
    record?.storageWarehouseName ||
    record?.warehouseName ||
    record?.sourceWarehouse ||
    record?.storageWarehouse ||
    record?.destinationWarehouse;
  const warehouse =
    typeof rawWarehouse === "string" && rawWarehouse.trim()
      ? rawWarehouse.trim()
      : "-";

  const rawIssueDate = record?.issueDate || record?.issuedDate || record?.date;
  const issueDate = formatDisplayDate(rawIssueDate);

  const slicingRef = String(
    record?.slicingNo ||
      record?.slicingSrNo ||
      record?.sourceSlicingNo ||
      record?.sourceIssueId ||
      record?.sourceStorageId ||
      record?.storageSrNo ||
      "-",
  );

  // Storage / Production Reference
  const storageProductionRef = String(
    record?.storageSrNo ||
      record?.productionNo ||
      record?.processRunId ||
      record?.sourceIssuedId ||
      "-",
  );

  // Material Dimensions
  const rawLength = record?.length;
  const rawWidth = record?.width;
  const rawThickness = record?.thickness || record?.height;
  const grade = String(record?.grade || record?.itemGrade || "-");
  const color = String(record?.color || "-");

  const lengthDisplay = formatDisplayDimension(rawLength, "m");
  const widthDisplay = formatDisplayDimension(rawWidth, "m");
  const thicknessDisplay = formatDisplayDimension(rawThickness, "mm");

  // ==================== 5. DRYING QUANTITIES (LEAF-BASED) ====================
  const receivedLeaves = dryingReceivedLeafCount(record);
  const availableLeaves = dryingLeafCount(record);

  // Leaves dried
  const explicitDried = parseNumericValue(
    record?.leavesDried ?? record?.driedLeaves ?? record?.dryingQuantity,
  );
  const leavesDried =
    explicitDried !== null && explicitDried > 0
      ? explicitDried
      : tab === "done"
        ? receivedLeaves > 0 && availableLeaves >= 0
          ? Math.max(receivedLeaves - availableLeaves, 0) || receivedLeaves
          : 0
        : Math.max(receivedLeaves - availableLeaves, 0);

  const leavesDriedDisplay = formatLeafInteger(leavesDried);
  const receivedLeavesDisplay = formatLeafInteger(receivedLeaves);
  const availableLeavesDisplay = formatLeafInteger(availableLeaves);

  // Quantities Progress
  const processedPercent =
    receivedLeaves > 0
      ? Math.min(100, Math.max(0, (leavesDried / receivedLeaves) * 100))
      : 0;
  const availablePercent =
    receivedLeaves > 0
      ? Math.min(100, Math.max(0, (availableLeaves / receivedLeaves) * 100))
      : 0;

  // Process Status & Info
  const rawDryingDate =
    record?.dryingDate ||
    (tab === "done" ? record?.issueDate || record?.processDate : null);
  const dryingDateDisplay = formatDisplayDate(rawDryingDate);

  const currentStage =
    tab === "issued"
      ? "Drying"
      : tab === "done"
        ? "Drying Done"
        : tab === "history"
          ? "Drying Inspection"
          : tab === "rejected"
            ? "Rejected"
            : "Drying";

  const statusLabel = useMemo(() => {
    if (tab === "rejected") return "Rejected";
    if (tab === "history") return "Issued to Inspection";
    if (tab === "done") {
      if (availableLeaves === 0 && receivedLeaves > 0) return "Completed";
      if (leavesDried > 0 && availableLeaves > 0) return "Partially Processed";
      return "Drying Done";
    }
    // Issued tab
    if (receivedLeaves > 0) {
      if (availableLeaves === 0) return "Completed";
      if (leavesDried > 0) return "Partially Processed";
      return "Pending Drying";
    }
    const rawStatus = String(record?.status || "");
    return rawStatus && rawStatus !== "-" ? rawStatus : "Pending";
  }, [tab, availableLeaves, receivedLeaves, leavesDried, record?.status]);

  const statusBadgeColor = useMemo(() => {
    if (
      statusLabel === "Completed" ||
      statusLabel === "Drying Done" ||
      statusLabel === "Issued to Inspection"
    ) {
      return "success" as const;
    }
    if (
      statusLabel === "Partially Processed" ||
      statusLabel === "Pending Drying" ||
      statusLabel === "Pending"
    ) {
      return "warning" as const;
    }
    if (statusLabel === "Rejected") {
      return "error" as const;
    }
    return "default" as const;
  }, [statusLabel]);

  // Operational Availability Message
  const availabilityMessage = useMemo(() => {
    if (availableLeaves > 0 && leavesDried > 0) {
      return `${formatLeafInteger(
        availableLeaves,
      )} leaves remain available for another Drying process. This source has been partially dried.`;
    }
    if (availableLeaves > 0) {
      return `${formatLeafInteger(
        availableLeaves,
      )} leaves remain available for another Drying process.`;
    }
    if (availableLeaves === 0 && receivedLeaves > 0) {
      return "All received leaves have been processed through Drying.";
    }
    return "-";
  }, [availableLeaves, leavesDried, receivedLeaves]);

  // ==================== 8. AREA DETAILS (SQM / SQF) ====================
  const derivedArea = useMemo(() => {
    if (record?.sqm && record?.sqf) {
      const parsedSqm = parseNumericValue(record.sqm);
      const parsedSqf = parseNumericValue(record.sqf);
      return {
        sqm: parsedSqm !== null && parsedSqm > 0 ? formatSQM(parsedSqm) : "-",
        sqf: parsedSqf !== null && parsedSqf > 0 ? formatSQF(parsedSqf) : "-",
      };
    }
    const leavesForArea = leavesDried > 0 ? leavesDried : receivedLeaves;
    if (rawLength && rawWidth && leavesForArea > 0) {
      const { sqm, sqf } = dryingLeafArea(rawLength, rawWidth, leavesForArea);
      const numSqm = parseNumericValue(sqm);
      const numSqf = parseNumericValue(sqf);
      return {
        sqm: numSqm !== null && numSqm > 0 ? formatSQM(numSqm) : "-",
        sqf: numSqf !== null && numSqf > 0 ? formatSQF(numSqf) : "-",
      };
    }
    return { sqm: "-", sqf: "-" };
  }, [record?.sqm, record?.sqf, leavesDried, receivedLeaves, rawLength, rawWidth]);

  // Next Process Status
  const inspectionRef = String(
    record?.inspectionNo ||
      record?.dryingInspectionNo ||
      record?.inspectionId ||
      record?.issueForInspection ||
      "",
  );
  const isIssuedToInspection =
    tab === "history" ||
    Boolean(inspectionRef) ||
    String(record?.status || "").toLowerCase().includes("inspection");

  // Record Information
  const createdBy = String(record?.createdBy || "-");
  const createdAt = formatDisplayDate(record?.createdAt, true);
  const updatedBy = String(record?.updatedBy || "-");
  const updatedAt = formatDisplayDate(record?.updatedAt, true);

  // Remark
  const remark =
    typeof record?.remark === "string" &&
    record.remark.trim() &&
    record.remark.trim() !== "-"
      ? record.remark.trim()
      : typeof record?.issueRemark === "string" &&
        record.issueRemark.trim() &&
        record.issueRemark.trim() !== "-"
        ? record.issueRemark.trim()
        : "";

  return (
    <FactoryPageShell
      title="View Drying Entry"
      subtitle="View drying source, processed leaves and remaining availability."
      backNav={{
        label: "Back to Drying",
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
        {/* ==================== SOURCE DETAILS ==================== */}
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
                { label: "Slicing Reference", value: slicingRef },
                ...(storageProductionRef !== "-" &&
                storageProductionRef !== slicingRef
                  ? [
                      {
                        label: "Storage Reference",
                        value: storageProductionRef,
                      },
                    ]
                  : []),
                { label: "Item Name", value: itemName },
                { label: "Item Sub Category", value: subCategory },
                { label: "Log No", value: logNo },
                { label: "Bundle No", value: bundleNo },
                { label: "Pallet No", value: palletNo },
                ...(warehouse !== "-"
                  ? [{ label: "Source Warehouse", value: warehouse }]
                  : []),
                { label: "Issued Date", value: issueDate },
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

        {/* ==================== 4. MATERIAL DETAILS ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="MATERIAL DETAILS" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(5, minmax(0, 1fr))",
                },
                gap: 1.75,
              }}
            >
              {[
                { label: "Length", value: lengthDisplay },
                { label: "Width", value: widthDisplay },
                { label: "Thickness", value: thicknessDisplay },
                { label: "Grade", value: grade },
                ...(color !== "-" ? [{ label: "Color", value: color }] : []),
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

        {/* ==================== 5. & 6. & 9. DRYING QUANTITY ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2.5}>
            <FormSectionHeader title="DRYING QUANTITY" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: derivedArea.sqm !== "-" || derivedArea.sqf !== "-"
                    ? "repeat(5, minmax(0, 1fr))"
                    : "repeat(3, minmax(0, 1fr))",
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
                  Leaves Dried
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.customTokens.brand.primary,
                    fontWeight: 700,
                    mt: 0.5,
                    fontSize: "1.35rem",
                  }}
                >
                  {leavesDriedDisplay}
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
                  Available Leaves
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color:
                      availableLeaves > 0
                        ? "text.primary"
                        : "text.secondary",
                    fontWeight: 700,
                    mt: 0.5,
                    fontSize: "1.35rem",
                  }}
                >
                  {availableLeavesDisplay}
                </Typography>
              </Paper>

              {(derivedArea.sqm !== "-" || derivedArea.sqf !== "-") && (
                <>
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
                      SQM
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
                      {derivedArea.sqm}
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
                      SQF
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
                      {derivedArea.sqf}
                    </Typography>
                  </Paper>
                </>
              )}
            </Box>



            {/* 9. Operational Availability Message */}
            {availabilityMessage !== "-" && (
              <Box
                sx={(t) => ({
                  p: 1.5,
                  borderRadius: "6px",
                  backgroundColor:
                    availableLeaves > 0
                      ? t.customTokens.neutrals[100] || "#f5f5f5"
                      : "#edf7ed",
                  borderLeft: `4px solid ${
                    availableLeaves > 0
                      ? theme.customTokens.brand.primary
                      : theme.palette.success.main
                  }`,
                })}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontWeight: 500,
                    fontSize: "0.85rem",
                  }}
                >
                  {availabilityMessage}
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>



        {/* ==================== 7. PROCESS INFORMATION ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="PROCESS INFORMATION" />
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
                  Drying Date
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {dryingDateDisplay}
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
                  Drying Quantity
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {leavesDriedDisplay} Leaves
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
                  Current Stage
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {currentStage}
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
                  Status
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color:
                      statusBadgeColor === "success"
                        ? theme.palette.success.main
                        : statusBadgeColor === "warning"
                          ? theme.palette.warning.main
                          : statusBadgeColor === "error"
                            ? theme.palette.error.main
                            : "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {statusLabel}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>



        {/* ==================== 12. RECORD INFORMATION ==================== */}
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
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
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
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
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
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
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
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                  }}
                >
                  {updatedAt}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* ==================== 13. REMARK ==================== */}
        {Boolean(remark) && (
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
                {remark}
              </Typography>
            </Stack>
          </Box>
        )}

        {/* Bottom Back Button */}
        <Box sx={{ display: "flex", justifyContent: "flex-end", pt: 1 }}>
          <Button
            onClick={() => navigate(listPath)}
            startIcon={<ChevronLeft size={16} />}
            variant="outlined"
            sx={{
              borderRadius: "8px",
              fontWeight: 600,
              textTransform: "none",
              px: 2.5,
              height: 36,
            }}
          >
            Back
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
};
