import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import {
  fetchSlicingIssuedById,
  fetchSlicingDoneById,
  fetchSlicingHistoryById,
  fetchSlicingRejectedById,
} from "../api/slicingApi";
import {
  Box,
  Chip,
  LinearProgress,
  Paper,
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
import { slicingDefinition } from "../../shared/factoryDefinitions";
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
  useSlicingFlowState,
  applySlicingListingRows,
} from "../slicingFrontendStore";

/** Format clean display measurement without floating precision errors. */
function formatDisplayDimension(value: unknown, unit?: string): string {
  if (value === null || value === undefined || value === "") return "-";
  const str = String(value).trim();
  if (str === "-") return "-";

  // Check if suffix already in string (e.g. "2.44 m" or "1.7 mm")
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

/** Format 3 decimal places for CBM volumes */
function formatVolumeCbm(value: unknown): string {
  const parsed = parseNumericValue(value);
  if (parsed === null || !Number.isFinite(parsed)) return "-";
  return parsed.toFixed(3);
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

export const SlicingViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Subscribe to live slicing flow state
  useSlicingFlowState();

  const [searchParams] = useSearchParams();
  const queryTab = searchParams.get("tab");

  const [apiRecord, setApiRecord] = useState<Record<string, unknown> | null>(null);

  const stateData = location.state as { record?: Record<string, unknown>; tab?: string } | undefined;
  const passedRecord = stateData?.record;

  const tab =
    stateData?.tab ||
    queryTab ||
    "issued";

  useEffect(() => {
    if (passedRecord || !id) return;
    const fetcher =
      tab === "done"
        ? fetchSlicingDoneById
        : tab === "history"
        ? fetchSlicingHistoryById
        : tab === "rejected"
        ? fetchSlicingRejectedById
        : fetchSlicingIssuedById;

    fetcher(id)
      .then((data) => {
        if (data) setApiRecord(data as unknown as Record<string, unknown>);
      })
      .catch((err) => {
        console.error("Failed to fetch slicing record for view", err);
      });
  }, [id, tab, passedRecord]);

  const record = useMemo(() => {
    if (passedRecord) return passedRecord;
    if (apiRecord) return apiRecord;
    if (!id) return undefined;

    // 1. Check in definition rows
    const foundInRows = slicingDefinition.rows.find((r) => String(r.id) === String(id));
    if (foundInRows) return foundInRows as Record<string, unknown>;

    // 2. Check in factoryIssuedWorkStore
    const workItem = getFactoryIssuedWorkById(id);
    if (workItem) return factoryIssuedWorkToRow(workItem) as Record<string, unknown>;

    // 3. Check in slicing applied flow rows (issued, done, history, rejected)
    for (const t of ["issued", "done", "history", "rejected"]) {
      const applied = applySlicingListingRows(slicingDefinition.rows as unknown as readonly Record<string, unknown>[], t);
      const matched = applied.find((r) => String(r.id) === String(id));
      if (matched) return matched;
    }

    return undefined;
  }, [id, passedRecord, apiRecord]);

  const listPath = `/factory/slicing?tab=${tab}`;

  // Read fields strictly and gracefully
  const storageSrNo = String(
    record?.storageSrNo ||
    record?.storageSerialNumber ||
    record?.issueSrNo ||
    "-"
  );

  const rawWarehouse =
    record?.storageWarehouseName ||
    record?.warehouseName ||
    record?.sourceWarehouse ||
    record?.storageWarehouse ||
    record?.destinationWarehouse;
  const warehouse = typeof rawWarehouse === "string" && rawWarehouse.trim()
    ? rawWarehouse.trim()
    : "Central Storage Warehouse";

  const rawIssueDate = record?.issueDate || record?.issuedDate || record?.date;
  const issueDate = formatDisplayDate(rawIssueDate);

  const itemName = String(record?.itemName || record?.productName || "Beech Veneer");
  const subCategory = String(record?.subCategory || record?.itemSubCategory || "-");
  const logNo = String(record?.logNo || record?.batchNo || record?.logCode || "-");
  const bundleNo = String(record?.bundleNumber || record?.bundleNo || "-");
  const palletNo = String(record?.palletNo || record?.palletNumber || "-");

  // Material Dimensions
  const rawLength = record?.length;
  const rawWidth = record?.width;
  const rawThickness = record?.thickness || record?.height;

  const lengthDisplay = formatDisplayDimension(rawLength, "m");
  const widthDisplay = formatDisplayDimension(rawWidth, "m");
  // For thickness: if value is > 10 it's likely bare mm, or if < 10 in meters/mm.
  // Standard display per spec: "1.70 mm"
  const thicknessDisplay = formatDisplayDimension(rawThickness, "mm");

  // Slicing Output Quantities
  const rawLeaves =
    record?.noOfLeaves ||
    record?.receivedLeaves ||
    record?.availableLeaves ||
    record?.noOfSheets ||
    "";
  const leavesCount = parseNumericValue(rawLeaves);
  const leavesDisplay = leavesCount !== null && leavesCount >= 0 ? String(leavesCount) : "-";

  const rawSqm = record?.sqm || record?.totalSqMeter || record?.receivedSqm || record?.outputSqm;
  const rawSqf = record?.sqf || record?.receivedSqf || record?.outputSqf;
  const parsedSqm = parseNumericValue(rawSqm);
  const parsedSqf = parseNumericValue(rawSqf);

  const sqmDisplay = parsedSqm !== null && parsedSqm > 0 ? formatSQM(parsedSqm) : "-";
  const sqfDisplay =
    parsedSqf !== null && parsedSqf > 0
      ? formatSQF(parsedSqf)
      : parsedSqm !== null && parsedSqm > 0
        ? formatSQF(parsedSqm * 10.7639)
        : "-";

  // Availability / CBM
  const rawReceivedCbm = parseNumericValue(record?.receivedCbm || record?.sourceCbm);
  const rawAvailableCbm = parseNumericValue(record?.availableCbm);
  const hasCbmInfo = rawReceivedCbm !== null || rawAvailableCbm !== null;

  const receivedCbm = rawReceivedCbm !== null && rawReceivedCbm >= 0 ? rawReceivedCbm : 0;
  const availableCbm =
    rawAvailableCbm !== null && rawAvailableCbm >= 0
      ? rawAvailableCbm
      : rawReceivedCbm !== null
        ? rawReceivedCbm
        : 0;
  const consumedCbm = Math.max(receivedCbm - availableCbm, 0);

  const receivedCbmDisplay = rawReceivedCbm !== null ? formatVolumeCbm(receivedCbm) : "-";
  const availableCbmDisplay = rawAvailableCbm !== null ? formatVolumeCbm(availableCbm) : "-";
  const consumedCbmDisplay = hasCbmInfo ? formatVolumeCbm(consumedCbm) : "-";

  const consumptionPercent =
    receivedCbm > 0 ? Math.min(100, Math.max(0, (consumedCbm / receivedCbm) * 100)) : 0;

  // Process Status & Information
  const rawSlicingDate =
    record?.slicingDate ||
    (tab === "done" ? record?.issueDate || record?.processDate : null);
  const slicingDateDisplay = formatDisplayDate(rawSlicingDate);

  const currentStage =
    tab === "issued"
      ? "Issue for Slicing"
      : tab === "done"
        ? "Slicing"
        : tab === "history"
          ? "Forwarded to Drying"
          : tab === "rejected"
            ? "Rejected"
            : "Slicing";

  const statusLabel = useMemo(() => {
    if (tab === "rejected") return "Rejected";
    if (tab === "history") return "Forwarded";
    if (tab === "done") {
      if (rawAvailableCbm !== null && rawAvailableCbm <= 0.0001) return "Fully Sliced";
      return "Completed";
    }
    // Issued tab
    if (hasCbmInfo) {
      if (availableCbm <= 0.0001) return "Fully Consumed";
      if (consumedCbm > 0.0001) return "Partially Processed";
      return "Available";
    }
    const rawStatus = String(record?.status || "");
    return rawStatus && rawStatus !== "-" ? rawStatus : "Available";
  }, [tab, hasCbmInfo, availableCbm, consumedCbm, record?.status, rawAvailableCbm]);

  const statusBadgeColor = useMemo(() => {
    if (statusLabel === "Completed" || statusLabel === "Available" || statusLabel === "Fully Sliced") {
      return "success" as const;
    }
    if (statusLabel === "Partially Processed" || statusLabel === "Pending" || statusLabel === "Partial Done") {
      return "warning" as const;
    }
    if (statusLabel === "Rejected") {
      return "error" as const;
    }
    return "default" as const;
  }, [statusLabel]);

  // Record Information
  const createdBy = String(record?.createdBy || "-");
  const createdAt = formatDisplayDate(record?.createdAt, true);
  const updatedBy = String(record?.updatedBy || "-");
  const updatedAt = formatDisplayDate(record?.updatedAt, true);

  // Remark
  const remark =
    typeof record?.remark === "string" && record.remark.trim() && record.remark.trim() !== "-"
      ? record.remark.trim()
      : typeof record?.issueRemark === "string" && record.issueRemark.trim() && record.issueRemark.trim() !== "-"
        ? record.issueRemark.trim()
        : "";

  return (
    <FactoryPageShell
      title="View Slicing Entry"
      subtitle="View source material, slicing quantity and current availability."
      backNav={{
        label: "Back to Slicing",
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
        {/* SOURCE DETAILS */}
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
                { label: "Storage Sr No", value: storageSrNo },
                { label: "Source Warehouse", value: warehouse },
                { label: "Issue Date", value: issueDate },
                { label: "Item Name", value: itemName },
                { label: "Item Sub Category", value: subCategory },
                { label: "Log No", value: logNo },
                { label: "Bundle No", value: bundleNo },
                { label: "Pallet No", value: palletNo },
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

        {/* MATERIAL SPECIFICATIONS & OUTPUT */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="MATERIAL SPECIFICATIONS & OUTPUT" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(6, minmax(0, 1fr))",
                },
                gap: 1.75,
              }}
            >
              {[
                { label: "Length", value: lengthDisplay, highlight: false },
                { label: "Width", value: widthDisplay, highlight: false },
                { label: "Thickness", value: thicknessDisplay, highlight: false },
                { label: "No. of Leaves", value: leavesDisplay, highlight: true },
                { label: "SQM", value: sqmDisplay, highlight: false },
                { label: "SQF", value: sqfDisplay, highlight: false },
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
                      color: item.highlight
                        ? theme.customTokens.brand.primary
                        : "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "1.125rem",
                    }}
                  >
                    {item.value}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Box>

        {/* 6. AVAILABILITY (CBM) */}
        {hasCbmInfo && (
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="SOURCE AVAILABILITY" />
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
                    Received CBM
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "1.125rem",
                    }}
                  >
                    {receivedCbmDisplay}
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
                    Available CBM
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.customTokens.brand.primary,
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "1.125rem",
                    }}
                  >
                    {availableCbmDisplay}
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
                    Consumed CBM
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: "text.primary",
                      fontWeight: 700,
                      mt: 0.5,
                      fontSize: "1.125rem",
                    }}
                  >
                    {consumedCbmDisplay}
                  </Typography>
                </Paper>
              </Box>

            </Stack>
          </Box>
        )}

        {/* 7. PROCESS INFORMATION */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="PROCESS INFORMATION" />
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
                  Slicing Date
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {slicingDateDisplay}
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
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
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
                    color: statusBadgeColor === "success"
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
            <FactoryProductionPipeline
              currentStage={tab === "issued" || tab === "rejected" ? "slicing" : "slicing-done"}
              rejected={tab === "rejected"}
            />
          </Stack>
        </Box>

        {/* 8. RECORD INFORMATION */}
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

        {/* 9. REMARK */}
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

      </Stack>
    </FactoryPageShell>
  );
};
