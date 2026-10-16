import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronLeft, Eye, X } from "lucide-react";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { groupingDefinition } from "../../shared/factoryDefinitions";
import {
  getFactoryIssuedWorkById,
  factoryIssuedWorkToRow,
  useFactoryIssuedWorkItems,
} from "../../shared/factoryIssuedWorkStore";
import {
  formatSQM,
  formatSQF,
  parseNumericValue,
} from "../../../shared/numberFormat";
import {
  getAvailableGroupedSheets,
  getReceivedGroupedLeaves,
  getGroupedStockIssuesForRow,
  useGroupedStockSampleIssues,
} from "../../shared/groupedStockIssueStore";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import {
  calculateGroupingAvailableDetails,
} from "../groupingCreateRules";

/** Format clean display measurement without floating precision errors. (e.g. 1.70 mm, 2660 mm, 2.66 m) */
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

export const GroupingViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  // Subscribe to factory issued work store and sample issues store
  useFactoryIssuedWorkItems();
  useGroupedStockSampleIssues();

  const stateData = location.state as
    | { record?: Record<string, unknown>; tab?: string }
    | undefined;
  const passedRecord = stateData?.record;

  const record = useMemo(() => {
    if (passedRecord) return passedRecord;
    if (!id) return undefined;

    // 1. Check in definition rows
    const foundInRows = groupingDefinition.rows.find((r) => String(r.id) === String(id));
    if (foundInRows) return foundInRows as Record<string, unknown>;

    // 2. Check in factoryIssuedWorkStore
    const workItem = getFactoryIssuedWorkById(id);
    if (workItem) return factoryIssuedWorkToRow(workItem) as Record<string, unknown>;

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

  const listPath = `/factory/grouping?tab=${tab}`;

  // Image preview modal state
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // ==================== 1. & 2. HEADER & IDENTIFIERS ====================
  const groupNo = String(
    record?.groupNo ||
      record?.groupNumber ||
      record?.batchNo ||
      record?.id ||
      "-",
  );

  const storageSrNo = String(
    record?.storageSrNo ||
      record?.productionSrNo ||
      record?.rawVeneerSrNo ||
      "-",
  );

  const rawWarehouse =
    record?.sourceWarehouse ||
    record?.storageWarehouseName ||
    record?.warehouseName ||
    record?.storageWarehouse;
  const sourceWarehouse =
    typeof rawWarehouse === "string" && rawWarehouse.trim()
      ? rawWarehouse.trim()
      : "Warehouse C";

  const itemName = String(
    record?.itemName || record?.productName || "Beech Veneer",
  );
  const subCategory = String(record?.subCategory || record?.itemSubCategory || "-");
  const logNo = String(record?.logNo || record?.logCode || record?.batchNo || "-");
  const bundleNo = String(record?.bundleNumber || record?.bundleNo || "-");
  const palletNo = String(record?.palletNo || record?.palletNumber || "-");
  const grade = String(record?.grade || record?.itemGrade || "Export");
  const color = String(record?.color || record?.colour || "-");

  // ==================== 3. MATERIAL DIMENSIONS ====================
  const lengthDisplay = formatDisplayDimension(record?.length, "mm");
  const widthDisplay = formatDisplayDimension(record?.width, "mm");
  const thicknessDisplay = formatDisplayDimension(record?.thickness ?? record?.height, "mm");

  // ==================== 4. SOURCE QUANTITY & GROUPED QUANTITIES ====================
  const receivedLeaves = record ? getReceivedGroupedLeaves(record as any) : 0;
  const availableLeaves = record ? getAvailableGroupedSheets(record as any) : 0;

  // Grouped Leaves: if available is tracked, grouped = received - available (or direct record quantity)
  const explicitGrouped = parseNumericValue(
    record?.groupedLeaves ?? record?.groupedNoOfLeaves ?? record?.totalGroupedLeaves,
  );
  const groupedLeaves =
    explicitGrouped !== null && explicitGrouped > 0
      ? explicitGrouped
      : tab === "done" || tab === "history"
        ? receivedLeaves > 0
          ? Math.max(receivedLeaves - availableLeaves, 0) || receivedLeaves
          : parseNumericValue(record?.noOfLeaves) || 0
        : Math.max(receivedLeaves - availableLeaves, 0);

  const receivedLeavesDisplay = formatLeafInteger(receivedLeaves > 0 ? receivedLeaves : (groupedLeaves + availableLeaves));
  const groupedLeavesDisplay = formatLeafInteger(groupedLeaves);
  const availableLeavesDisplay = formatLeafInteger(availableLeaves);

  // ==================== 5. GROUPING OUTPUTS (Process Details) ====================
  // Check if multiple process outputs exist under this groupNo
  const siblingGroupOutputs = useMemo(() => {
    if (!groupNo || groupNo === "-") return [];

    // Find all definition rows matching this groupNo
    const defMatches = groupingDefinition.rows.filter(
      (r) => String((r as any).groupNo || "") === groupNo,
    );

    if (defMatches.length > 1) {
      return defMatches as Record<string, unknown>[];
    }

    // Also check if record itself has lineItems / processDetails array
    if (Array.isArray(record?.processDetails) && record.processDetails.length > 0) {
      return record.processDetails;
    }
    if (Array.isArray(record?.lineItems) && record.lineItems.length > 0) {
      return record.lineItems.map((item: any) => item.values || item);
    }

    return [record ?? {}];
  }, [groupNo, record]);

  // ==================== 6. AVAILABLE MATERIAL (Remaining details) ====================
  const availableDetails = useMemo(() => {
    if (!record) return { sqm: "-", sqf: "-" };
    const rawSqm = record.availableSqm ?? record.avSqm;
    const rawSqf = record.availableSqf ?? record.avSqf;
    if (rawSqm && rawSqf) {
      const pSqm = parseNumericValue(rawSqm);
      const pSqf = parseNumericValue(rawSqf);
      return {
        sqm: pSqm !== null && pSqm > 0 ? formatSQM(pSqm) : "-",
        sqf: pSqf !== null && pSqf > 0 ? formatSQF(pSqf) : "-",
      };
    }
    const derived = calculateGroupingAvailableDetails({
      sourceAvailableLeaves: receivedLeaves > 0 ? receivedLeaves : availableLeaves + groupedLeaves,
      sourceRow: record,
      totalGroupedLeaves: groupedLeaves,
    });
    const pSqm = parseNumericValue(derived.sqm);
    const pSqf = parseNumericValue(derived.sqf);
    return {
      sqm: pSqm !== null && pSqm > 0 ? formatSQM(pSqm) : "-",
      sqf: pSqf !== null && pSqf > 0 ? formatSQF(pSqf) : "-",
    };
  }, [record, receivedLeaves, availableLeaves, groupedLeaves]);

  // ==================== 7. PROCESS INFORMATION & STATUS ====================
  const groupingDateDisplay = formatDisplayDate(
    record?.groupingDate || record?.processDate || record?.issueDate || record?.issuedDate,
  );

  const currentStage =
    tab === "issued"
      ? "Raw Veneer"
      : tab === "done"
        ? "Grouping Done"
        : tab === "history"
          ? "Issued to Downstream"
          : tab === "rejected"
            ? "Rejected"
            : "Grouping Done";

  const rawStatus = String(record?.status || "");
  const statusLabel = useMemo(() => {
    if (tab === "rejected") return "Rejected";
    if (tab === "history") return "Issued Downstream";
    if (tab === "done") {
      if (availableLeaves === 0 && groupedLeaves > 0) return "Completed";
      if (availableLeaves > 0 && groupedLeaves > 0) return "Partially Grouped";
      return "Grouping Done";
    }
    return rawStatus && rawStatus !== "-" ? rawStatus : "Pending";
  }, [tab, availableLeaves, groupedLeaves, rawStatus]);

  const statusBadgeColor = useMemo(() => {
    if (statusLabel === "Grouping Done" || statusLabel === "Completed") {
      return "success" as const;
    }
    if (statusLabel === "Partially Grouped" || statusLabel === "Pending") {
      return "warning" as const;
    }
    if (statusLabel === "Rejected") {
      return "error" as const;
    }
    return "info" as const;
  }, [statusLabel]);

  // ==================== 8. ORDER ASSIGNMENT & NEXT ROUTE ====================
  const rowIssues = useMemo(() => {
    if (!record?.id) return [];
    return getGroupedStockIssuesForRow(String(record.id));
  }, [record?.id]);

  const latestIssue = rowIssues[0];
  const orderNo = String(
    record?.orderNo || latestIssue?.orderNo || "",
  );
  const orderItemNo = String(
    record?.orderItemNo || latestIssue?.orderItemNo || "",
  );
  const customerName = String(
    record?.customerName || record?.clientName || "-",
  );
  const hasOrderAssignment = Boolean(orderNo);

  const nextRouteDisplay = useMemo(() => {
    const issueTo = String(record?.issueTo || record?.issuedFor || record?.for || "");
    if (issueTo.toLowerCase().includes("sample")) {
      return "Sample Sheet → Pressing";
    }
    if (issueTo.toLowerCase().includes("splicing") || hasOrderAssignment) {
      return "Splicing";
    }
    return "Awaiting Issue (Splicing / Sample Sheet)";
  }, [record?.issueTo, record?.issuedFor, record?.for, hasOrderAssignment]);

  // Audit Info
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
      title="View Grouping Entry"
      subtitle="View source raw veneer, grouped leaves and remaining availability."
      backNav={{
        label: "Back to Grouping",
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
                { label: "Production / Storage Sr No", value: storageSrNo },
                { label: "Source Warehouse", value: sourceWarehouse },
                { label: "Item Name", value: itemName },
                { label: "Item Sub Category", value: subCategory },
                { label: "Log No", value: logNo },
                { label: "Bundle No", value: bundleNo },
                { label: "Pallet No", value: palletNo },
                { label: "Grade", value: grade },
                ...(color !== "-" ? [{ label: "Color", value: color }] : []),
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

        {/* ==================== 2. QUANTITY & MATERIAL DETAILS (One Line) ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="QUANTITY & MATERIAL DETAILS" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                  lg: color !== "-" ? "repeat(8, minmax(0, 1fr))" : "repeat(7, minmax(0, 1fr))",
                },
                gap: 1.5,
              }}
            >
              {[
                { label: "Received Leaves", value: receivedLeavesDisplay, isHighlight: false },
                { label: "Grouped Leaves", value: groupedLeavesDisplay, isHighlight: true },
                { label: "Available Leaves", value: availableLeavesDisplay, isHighlight: false },
                { label: "Length", value: lengthDisplay, isHighlight: false },
                { label: "Width", value: widthDisplay, isHighlight: false },
                { label: "Thickness", value: thicknessDisplay, isHighlight: false },
                { label: "Grade", value: grade, isHighlight: false },
                ...(color !== "-" ? [{ label: "Color", value: color, isHighlight: false }] : []),
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
                      display: "block",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                    title={item.label}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: item.isHighlight
                        ? theme.customTokens.brand.primary
                        : "text.primary",
                      fontWeight: 600,
                      mt: 0.5,
                      fontSize: "1.05rem",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {item.value}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Stack>
        </Box>

        {/* ==================== 3. GROUPING PROCESS DETAILS / OUTPUTS ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="GROUPING OUTPUTS" />
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small" sx={{ minWidth: 800 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 70)}>
                      #
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 160)}>
                      Item Name
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 120)}>
                      Sub Category
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 110)}>
                      Log No
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      Length
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      Width
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      Thickness
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      Color
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      Grade
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 110)}>
                      No. of Leaves
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      SQM
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 90)}>
                      SQF
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 100)}>
                      Photo
                    </TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme, 140)}>
                      Remark
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {siblingGroupOutputs.map((item: any, index: number) => {
                    const rowLeaves = parseNumericValue(
                      item.noOfLeaves ?? item.outputNoOfLeaves ?? item.receivedNoOfLeaves,
                    );
                    const rowLeavesDisplay =
                      rowLeaves !== null && rowLeaves > 0 ? String(rowLeaves) : "-";
                    const rowSqm = parseNumericValue(item.sqm ?? item.totalSqMeter);
                    const rowSqf = parseNumericValue(item.sqf);
                    const rowPhoto = item.groupPhoto || item.photo || item.image || "";

                    return (
                      <TableRow
                        key={item.id || index}
                        sx={{
                          "&:nth-of-type(even)": {
                            backgroundColor: theme.customTokens.surfaces.alt || "#fafafa",
                          },
                        }}
                      >
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {String(item.itemName || itemName)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {String(item.subCategory || item.itemSubCategory || subCategory)}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {String(item.logNo || item.logCode || logNo)}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {formatDisplayDimension(item.length || record?.length, "mm")}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {formatDisplayDimension(item.width || record?.width, "mm")}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {formatDisplayDimension(
                            item.thickness || item.height || record?.thickness,
                            "mm",
                          )}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {String(item.color || item.colour || color)}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {String(item.grade || grade)}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 700,
                              color: theme.customTokens.brand.primary,
                            }}
                          >
                            {rowLeavesDisplay}
                          </Typography>
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {rowSqm !== null && rowSqm > 0 ? formatSQM(rowSqm) : "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {rowSqf !== null && rowSqf > 0 ? formatSQF(rowSqf) : "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {rowPhoto ? (
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                component="img"
                                src={rowPhoto}
                                alt="Group Photo"
                                sx={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: "4px",
                                  objectFit: "cover",
                                  border: `1px solid ${theme.customTokens.borders.default}`,
                                  cursor: "pointer",
                                }}
                                onClick={() => setPreviewPhoto(rowPhoto)}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setPreviewPhoto(rowPhoto)}
                                sx={{ color: "text.secondary" }}
                              >
                                <Eye size={16} />
                              </IconButton>
                            </Box>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {String(item.remark || "-")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </Box>

        {/* ==================== 4. PROCESS INFORMATION ==================== */}
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
                  Group No
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.customTokens.brand.primary,
                    fontWeight: 700,
                    fontSize: "0.875rem",
                  }}
                >
                  {groupNo}
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
                  Grouping Date
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                >
                  {groupingDateDisplay}
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
                    color:
                      statusBadgeColor === "success"
                        ? theme.palette.success.main
                        : statusBadgeColor === "warning"
                          ? theme.palette.warning.main
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

        {/* ==================== 7. ORDER ASSIGNMENT (If applicable) ==================== */}
        {hasOrderAssignment && (
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader title="ORDER ASSIGNMENT" />
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
                    Assignment Status
                  </Typography>
                  <Box sx={{ mt: 0.25 }}>
                    <Chip
                      label="Assigned to Order"
                      size="small"
                      color="success"
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
                    Order No
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 600 }}
                  >
                    {orderNo}
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
                    Order Item No
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {orderItemNo || "-"}
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
                    Customer Name
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.primary", fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {customerName}
                  </Typography>
                </Stack>
              </Box>
            </Stack>
          </Box>
        )}

        {/* ==================== 8. NEXT PROCESS / ROUTING ==================== */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="NEXT PROCESS" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
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
                  Next Route
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.primary",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {nextRouteDisplay}
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
                  Issue Status
                </Typography>
                <Box sx={{ mt: 0.25 }}>
                  <Chip
                    label={rowIssues.length > 0 ? "Issued" : "Awaiting Issue"}
                    size="small"
                    color={rowIssues.length > 0 ? "success" : "default"}
                    sx={{ fontWeight: 600, height: 24, fontSize: "0.75rem" }}
                  />
                </Box>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* ==================== 9. RECORD INFORMATION ==================== */}
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

        {/* ==================== 10. REMARK ==================== */}
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

        {/* ==================== BOTTOM BACK BUTTON ==================== */}
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
              height: 38,
            }}
          >
            Back
          </Button>
        </Box>
      </Stack>

      {/* Group Photo Modal Preview */}
      <Dialog
        open={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        maxWidth="md"
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Group Photo Preview
          </Typography>
          <IconButton onClick={() => setPreviewPhoto(null)} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          {previewPhoto && (
            <Box
              component="img"
              src={previewPhoto}
              alt="Group Photo Preview"
              sx={{
                width: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: "6px",
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </FactoryPageShell>
  );
};

export default GroupingViewPage;
