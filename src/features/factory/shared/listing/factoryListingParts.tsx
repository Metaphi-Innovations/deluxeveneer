import { useEffect, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { AlertCircle, CheckCircle2, Eye, Plus, XCircle } from "lucide-react";
import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import type { EnterpriseTableAction } from "../../../../components/data-display/EnterpriseDataTable";
import { canAccessPermission, getFactoryPermissionKey } from "../../../permissions";
import { getPressingNextProcessActions } from "../../pressing/pressingNextProcessActions";
import {
  getOrderLineItems,
  type OrderLineItem,
  type OrderRecord,
} from "../../../orders/shared/ordersStore";
import { recordFormActionButtonSx } from "../../../shared/buttonStyles";
import { formSectionCardSx, FormSectionHeader } from "../../../shared/formSectionStyles";
import { formatAmount, parseNumericValue, SQM_TO_SQF } from "../../../shared/numberFormat";
import { getAvailableGroupedSheets } from "../groupedStockIssueStore";
import {
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
  issueFactoryWork,
  resolveFactoryProcessLabel,
} from "../factoryIssuedWorkStore";
import {
  createSampleSheetFromGrouping,
  getSampleNoFromRow,
  issueSampleToProcess,
  type SampleNextProcess,
} from "../sampleSheetIdentityStore";
import type { FactoryRecord } from "../types";

export interface DryingInspectionIssueDialogProps<Row extends FactoryRecord> {
  open: boolean;
  row: Row | null;
  onClose: () => void;
  onSubmit: (issueLeaves: string, totalLeaves: string, inspectionDate: string) => void;
}

export function DryingInspectionIssueDialog<Row extends FactoryRecord>({
  open,
  row,
  onClose,
  onSubmit,
}: DryingInspectionIssueDialogProps<Row>) {
  const initialLeaves = row ? String(row.availableLeaves ?? row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "") : "";
  const initialTotalLeaves = row ? String(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "") : "";
  const [issueLeaves, setIssueLeaves] = useState(initialLeaves);
  const [totalLeaves, setTotalLeaves] = useState(initialTotalLeaves);
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (row && open) {
      const availVal = String(row.availableLeaves ?? row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "");
      const totalVal = String(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "");
      setIssueLeaves(availVal);
      setTotalLeaves(totalVal);
      setInspectionDate(new Date().toISOString().slice(0, 10));
      setSubmitted(false);
    }
  }, [row, open]);

  if (!row) return null;

  const currentAvailableNum = Number(row.availableLeaves ?? row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? 0);
  const issueNum = Number(issueLeaves);
  const totalNum = Number(totalLeaves);
  const exceedsAvailable = issueLeaves !== "" && !Number.isNaN(issueNum) && currentAvailableNum > 0 && issueNum > currentAvailableNum;
  const exceedsTotal = issueLeaves !== "" && totalLeaves !== "" && issueNum > totalNum;
  const isInvalidIssue = issueLeaves === "" || Number.isNaN(issueNum) || issueNum <= 0;
  const isInvalidTotal = totalLeaves === "" || Number.isNaN(totalNum) || totalNum <= 0;
  const hasError = exceedsAvailable || exceedsTotal || isInvalidIssue || isInvalidTotal;

  const handleFormSubmit = () => {
    setSubmitted(true);
    if (hasError) return;
    onSubmit(issueLeaves, totalLeaves, inspectionDate);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Issue for Inspection
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1, display: "block" }}>
          Listing Details
        </Typography>
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 1.5,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Storage Sr No.</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.storageSrNo ?? row.id ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Drying Date</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.processDate ?? row.issueDate ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Item Name</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.itemName ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sub Category</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.subCategory ?? row.itemSubCategory ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Log Code</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.logCode ?? row.logNo ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Bundle Number</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.bundleNumber ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Pallet No</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.palletNo ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Dimensions (L × W × T)</Typography>
              <Typography variant="body2" fontWeight={600}>
                {row.length ? `${row.length} × ${row.width} × ${row.thickness ?? row.height ?? "-"}` : "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Available No of Leaves</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.availableLeaves ?? row.noOfLeaves ?? row.noOfSheets ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Sq Meter</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.totalSqMeter ?? row.sqm ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Warehouse</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.warehouseName ?? "-")}</Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5, display: "block" }}>
          Issue Parameters
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}>
              Issue No. of Leaves *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              error={exceedsAvailable || exceedsTotal || (submitted && isInvalidIssue)}
              helperText={
                exceedsAvailable
                  ? `Cannot exceed available leaves (${currentAvailableNum}).`
                  : exceedsTotal
                  ? "Issue leaves cannot exceed total leaves."
                  : submitted && isInvalidIssue
                  ? "Enter a valid positive number."
                  : ""
              }
              value={issueLeaves}
              onChange={(e) => setIssueLeaves(e.target.value)}
              placeholder="Enter issue leaves"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}>
              Total Leaves *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              error={submitted && isInvalidTotal}
              helperText={submitted && isInvalidTotal ? "Enter a valid positive number." : ""}
              value={totalLeaves}
              onChange={(e) => setTotalLeaves(e.target.value)}
              placeholder="Enter total leaves"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}>
              Issue Inspection Date
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="primary"
          onClick={handleFormSubmit}
          disabled={exceedsTotal}
          sx={{ textTransform: "none", fontWeight: 600, minWidth: 120 }}
        >
          Issue for Inspection
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export interface InspectionDecisionDialogProps<Row extends FactoryRecord> {
  open: boolean;
  row: Row | null;
  processSlug?: string;
  onClose: () => void;
  onPass: (row: Row, remark?: string, inspectionDate?: string, counts?: { passQty: number; failQty: number }) => void;
  onFail: (row: Row, remark?: string, inspectionDate?: string, counts?: { passQty: number; failQty: number }) => void;
  passCount: number;
  failCount: number;
}

export function InspectionDecisionDialog<Row extends FactoryRecord>({
  open,
  row,
  processSlug,
  onClose,
  onPass,
  onFail,
  passCount,
  failCount,
}: InspectionDecisionDialogProps<Row>) {
  const [remark, setRemark] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const totalQuantity = row
    ? Number(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? 0)
    : 0;

  const [passQtyStr, setPassQtyStr] = useState<string>("");
  const [failQtyStr, setFailQtyStr] = useState<string>("0");

  useEffect(() => {
    if (open && row) {
      setRemark("");
      setInspectionDate(new Date().toISOString().slice(0, 10));
      setAttachmentName("");
      setAttachmentPreview(null);
      const total = Number(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? 0);
      setPassQtyStr(total > 0 ? String(total) : "");
      setFailQtyStr("0");
    }
  }, [open, row]);

  if (!row) return null;

  const isSawingInspection = processSlug === "sawing-inspection";
  const isDryingInspection =
    !isSawingInspection &&
    (processSlug === "drying-inspection" || processSlug === "drying");
  const detailFields = isSawingInspection
    ? [
        { label: "Storage Sr No.", value: String(row.storageSrNo ?? row.id ?? "-") },
        { label: "Issued Date", value: formatInspectionDialogDate(row.issuedDate ?? row.issueDate) },
        { label: "Sawing Date", value: formatInspectionDialogDate(row.sawingDate ?? row.processDate) },
        { label: "Item Name", value: String(row.itemName ?? "-") },
        { label: "Sub Category", value: String(row.subCategory ?? row.itemSubCategory ?? "-") },
        { label: "Log No.", value: String(row.batchNo ?? row.logNo ?? "-") },
        { label: "Batch No", value: String(row.batchNoCode ?? "-") },
        { label: "Length", value: formatDialogMeasure(row.length) },
        { label: "Width", value: formatDialogMeasure(row.width) },
        { label: "Thickness", value: formatDialogMeasure(row.thickness ?? row.height) },
        { label: "CBM", value: formatDialogMeasure(row.cbm) },
        { label: "CBF", value: formatDialogMeasure(row.cbf) },
      ]
    : [
        { label: "Storage Sr No.", value: String(row.storageSrNo ?? row.id ?? "-") },
        { label: "Issued Inspection Date", value: formatInspectionDialogDate(row.issuedDate ?? row.issueDate) },
        { label: "Item Name", value: String(row.itemName ?? "-") },
        { label: "Sub Category", value: String(row.subCategory ?? row.itemSubCategory ?? "-") },
        { label: "Log Code", value: String(row.logCode ?? row.logNo ?? "-") },
        { label: "Bundle Number", value: String(row.bundleNumber ?? "-") },
        { label: "Pallet No", value: String(row.palletNo ?? "-") },
        { label: "Length", value: formatDialogMeasure(row.length) },
        { label: "Width", value: formatDialogMeasure(row.width) },
        { label: "Thickness", value: formatDialogMeasure(row.thickness ?? row.height) },
        { label: "No of Leaves", value: String(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "-") },
        { label: "Total Sq Meter", value: formatDialogMeasure(row.totalSqMeter ?? row.sqm) },
      ];
  const detailRemark = String(row.remark ?? "-");

  const handlePassChange = (val: string) => {
    setPassQtyStr(val);
    if (totalQuantity > 0) {
      if (val === "") {
        setFailQtyStr(String(totalQuantity));
      } else {
        const num = Number(val);
        if (!Number.isNaN(num)) {
          const clampedPass = Math.min(Math.max(0, num), totalQuantity);
          setFailQtyStr(String(Math.max(0, totalQuantity - clampedPass)));
        }
      }
    }
  };

  const handleFailChange = (val: string) => {
    setFailQtyStr(val);
    if (totalQuantity > 0) {
      if (val === "") {
        setPassQtyStr(String(totalQuantity));
      } else {
        const num = Number(val);
        if (!Number.isNaN(num)) {
          const clampedFail = Math.min(Math.max(0, num), totalQuantity);
          setPassQtyStr(String(Math.max(0, totalQuantity - clampedFail)));
        }
      }
    }
  };

  const currentPass = Number(passQtyStr) || 0;
  const currentFail = Number(failQtyStr) || 0;
  const exceedsTotal = totalQuantity > 0 && currentPass + currentFail > totalQuantity;
  const dryingQuantitiesInvalid =
    currentPass < 0 ||
    currentFail < 0 ||
    currentPass + currentFail <= 0 ||
    exceedsTotal;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: inspectionDialogPaperSx,
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Inspection
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box sx={(theme) => formSectionCardSx(theme)}>
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              <FormSectionHeader title="Item Details" />
              <Box
                sx={(theme) => ({
                  display: "grid",
                  gap: theme.spacing(2),
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                })}
              >
                {detailFields.map((field) => (
                  <ReadOnlyDialogField
                    key={field.label}
                    label={field.label}
                    value={field.value}
                  />
                ))}
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <ReadOnlyDialogField label="Remark" value={detailRemark} />
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={(theme) => formSectionCardSx(theme)}>
            <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
              <FormSectionHeader title="Inspection" />
              {isDryingInspection ? (
                <Box
                  sx={(theme) => ({
                    display: "grid",
                    gap: theme.spacing(2),
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                  })}
                >
                  <Stack spacing={0.75}>
                    <DialogFieldLabel required>Pass Quantity (Leaves)</DialogFieldLabel>
                    <TextField
                      error={exceedsTotal}
                      fullWidth
                      helperText={exceedsTotal ? `Pass + Fail cannot exceed total leaves (${totalQuantity})` : ""}
                      onChange={(event) => handlePassChange(event.target.value)}
                      placeholder="Enter pass count"
                      size="small"
                      type="number"
                      value={passQtyStr}
                      sx={(theme) => getCompactFieldSx(theme, exceedsTotal ? "error" : "default")}
                    />
                  </Stack>
                  <Stack spacing={0.75}>
                    <DialogFieldLabel required>Fail Quantity (Leaves)</DialogFieldLabel>
                    <TextField
                      error={exceedsTotal}
                      fullWidth
                      helperText={exceedsTotal ? `Pass + Fail cannot exceed total leaves (${totalQuantity})` : ""}
                      onChange={(event) => handleFailChange(event.target.value)}
                      placeholder="Enter fail count"
                      size="small"
                      type="number"
                      value={failQtyStr}
                      sx={(theme) => getCompactFieldSx(theme, exceedsTotal ? "error" : "default")}
                    />
                  </Stack>
                </Box>
              ) : null}
              <Box
                sx={(theme) => ({
                  display: "grid",
                  gap: theme.spacing(2),
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                })}
              >
                <Stack spacing={0.75}>
                  <DialogFieldLabel>Inspection Date</DialogFieldLabel>
                  <ErpDatePickerField
                    onChange={(value) => setInspectionDate(localDateToIso(value))}
                    size="dense"
                    value={isoDateToLocalDate(inspectionDate)}
                  />
                </Stack>
                <Stack spacing={0.75}>
                  <DialogFieldLabel>Attachment (Upload Photo)</DialogFieldLabel>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button component="label" sx={recordFormActionButtonSx} variant="outlined">
                      Choose Photo
                      <input
                        accept="image/*"
                        hidden
                        onChange={handleFileChange}
                        type="file"
                      />
                    </Button>
                    <Typography variant="body2" color={attachmentName ? "text.secondary" : "text.disabled"}>
                      {attachmentName || "No file chosen"}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
              {attachmentPreview ? (
                <Box
                  sx={(theme) => ({
                    maxHeight: 140,
                    maxWidth: 220,
                    overflow: "hidden",
                    borderRadius: `${theme.customTokens.radius.sm}px`,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                  })}
                >
                  <img
                    alt="Inspection attachment"
                    src={attachmentPreview}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </Box>
              ) : null}
              <Stack spacing={0.75}>
                <DialogFieldLabel>Inspection Remark</DialogFieldLabel>
                <TextField
                  fullWidth
                  minRows={2}
                  multiline
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Enter inspection remark or reason"
                  size="small"
                  value={remark}
                  sx={(theme) => getCompactFieldSx(theme, "default")}
                />
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          gap: theme.spacing(1),
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        {isDryingInspection ? (
          <Button
            disabled={dryingQuantitiesInvalid}
            onClick={() =>
              onPass(row, remark, inspectionDate, {
                passQty: currentPass,
                failQty: currentFail,
              })
            }
            sx={recordFormActionButtonSx}
            variant="contained"
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              color="error"
              disabled={exceedsTotal}
              onClick={() =>
                onFail(row, remark, inspectionDate, {
                  passQty: isSawingInspection ? 0 : currentPass,
                  failQty: isSawingInspection ? totalQuantity || 1 : currentFail,
                })
              }
              startIcon={<AlertCircle size={16} />}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              Fail Inspection
            </Button>
            <Button
              color="success"
              disabled={exceedsTotal}
              onClick={() =>
                onPass(row, remark, inspectionDate, {
                  passQty: isSawingInspection ? totalQuantity || 1 : currentPass,
                  failQty: isSawingInspection ? 0 : currentFail,
                })
              }
              startIcon={<CheckCircle2 size={16} />}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              Pass Inspection
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}

export interface GroupingSampleIssueState<Row extends FactoryRecord> {
  issueDate: Date | null;
  issueSheets: string;
  nextProcess: "" | SampleNextProcess;
  remark: string;
  row: Row;
  submitted: boolean;
}

export interface GroupingOrderIssueState<Row extends FactoryRecord> {
  issueDate: Date | null;
  issueSheets: string;
  orderItemNo: string;
  orderNo: string;
  orderType: string;
  row: Row;
  submitted: boolean;
}

export interface SplicingOrderIssueState<Row extends FactoryRecord> {
  issueDate: Date | null;
  issueSheets: string;
  orderItemNo: string;
  orderNo: string;
  orderType: string;
  row: Row;
  submitted: boolean;
}

export function formatFactorySearchValue(value: RowValue) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(value)
      .toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).toLowerCase();
}

export type RowValue = RowLike[string];

export interface RowLike {
  [key: string]: unknown;
}

export function normalizeFactorySourceColumns<Row extends FactoryRecord>(
  row: Row,
  processSlug: string,
) {
  const issuedFrom = getFactoryIssuedFromProcess(row, processSlug);
  const warehouseName =
    getFactoryRowWarehouseName(row) || getDefaultFactoryWarehouseName(processSlug);
  const rowSequence = getFactoryRowSequence(row);
  const itemName =
    getFactoryString(row.itemName) || getFactoryString(row.productName);
  const itemSubCategory =
    getFactoryString(row.itemSubCategory) || getFactoryString(row.subCategory);
  const color =
    getFactoryString(row.color) ||
    getFactoryString(row.timberColor) ||
    getFactoryString(row.processColor);
  const logNo = getFactoryString(row.logNo) || getFactoryString(row.logCode);
  const height = getFactoryString(row.height);
  const thickness = getFactoryString(row.thickness);
  const bundleNumber =
    getFactoryString(row.bundleNumber) ||
    getFactoryString(row.noOfBundle) ||
    `BDL-${getFactoryWarehouseCode(warehouseName)}-${rowSequence}`;
  const palletNo =
    getFactoryString(row.palletNo) ||
    getFactoryString(row.palletNumber) ||
    `PAL-${getFactoryWarehouseCode(warehouseName)}-${rowSequence}`;
  const noOfLeaves =
    getFactoryString(row.noOfLeaves) ||
    getFactoryString(row.noOfLeavesSheets) ||
    getFactoryString(row.noOfSheets) ||
    getFactoryString(row.totalNoOfSheets) ||
    getFactoryString(row.availableSheets);
  const sqm =
    getFactoryString(row.sqm) ||
    getFactoryString(row.totalSqm) ||
    getFactoryString(row.availableSqm) ||
    getFactoryString(row.avSqm) ||
    getFactoryString(row.issuedSqm) ||
    getFactoryString(row.outputSqm);
  const sqf =
    getFactoryString(row.sqf) ||
    getFactoryString(row.totalSqf) ||
    getFactoryString(row.availableSqf) ||
    getFactoryString(row.avSqf) ||
    getFactoryString(row.issuedSqf) ||
    getFactoryString(row.outputSqf) ||
    deriveFactorySqf(sqm);
  const ratePerSqf =
    getFactoryString(row.ratePerSqf) ||
    getFactoryString(row.rate) ||
    deriveFactoryRatePerSqf(row.amount, sqf);

  const issueDate =
    getFactoryString(row.issueDate) ||
    getFactoryString(row.issuedDate) ||
    getFactoryString(row.orderDate);
  const storageSrNo =
    getFactoryString(row.storageSrNo) ||
    getFactoryString(row.storageSerialNumber) ||
    "";
  const batchNo =
    getFactoryString(row.batchNo) ||
    getFactoryString(row.logNo) ||
    getFactoryString(row.logCode);
  const receivedCbm =
    getFactoryString(row.receivedCbm) ||
    getFactoryString(row.cbm);
  const availableCbm =
    getFactoryString(row.availableCbm) ||
    getFactoryString(row.receivedCbm) ||
    getFactoryString(row.cbm);

  return {
    ...row,
    ...(bundleNumber ? { bundleNumber } : {}),
    ...(storageSrNo ? { storageSrNo } : {}),
    ...(issueDate ? { issueDate } : {}),
    ...(batchNo ? { batchNo } : {}),
    ...(receivedCbm ? { receivedCbm } : {}),
    ...(availableCbm ? { availableCbm } : {}),
    ...(color ? { color } : {}),
    ...(height || thickness ? { height: height || thickness } : {}),
    issuedFrom,
    ...(itemName ? { itemName } : {}),
    ...(itemSubCategory ? { itemSubCategory } : {}),
    ...(logNo ? { logNo } : {}),
    ...(noOfLeaves ? { noOfLeaves } : {}),
    ...(palletNo ? { palletNo } : {}),
    ...(sqf ? { sqf } : {}),
    ...(sqm ? { sqm } : {}),
    ...(ratePerSqf ? { ratePerSqf } : {}),
    ...(thickness || height ? { thickness: thickness || height } : {}),
    warehouseName,
  } as Row;
}

export function getFactoryIssuedFromProcess<Row extends FactoryRecord>(
  row: Row,
  processSlug: string,
) {
  const explicitProcess = getFactoryString(row.sourceProcess);
  if (explicitProcess) {
    return explicitProcess;
  }

  const issuedFrom = getFactoryString(row.issuedFrom);
  if (issuedFrom && !isFactoryWarehouseLabel(issuedFrom)) {
    return issuedFrom;
  }

  return getDefaultFactoryIssuedFromProcess(processSlug);
}

export function getFactoryRowWarehouseName<Row extends FactoryRecord>(row: Row) {
  const explicitWarehouse =
    getFactoryString(row.warehouseName) ||
    getFactoryString(row.sourceWarehouseName);

  if (explicitWarehouse) {
    return explicitWarehouse;
  }

  const issuedFrom = getFactoryString(row.issuedFrom);
  return isFactoryWarehouseLabel(issuedFrom) ? issuedFrom : "";
}

export function getDefaultFactoryWarehouseName(processSlug: string) {
  return processSlug === "slicing" || processSlug === "drying"
    ? "Warehouse B"
    : "Warehouse C";
}

export function getDefaultFactoryIssuedFromProcess(processSlug: string) {
  const sourceProcessBySlug: Record<string, string> = {
    "cnc-fluting": "Pressing",
    drying: "Slicing",
    "drying-inspection": "Drying",
    embossing: "Pressing",
    finishing: "Pressing",
    grouping: "Inventory",
    marquetry: "Splicing",
    pressing: "Splicing",
    "sample-sheets": "Grouping",
    "sawing-inspection": "Sawing",
    slicing: "Inventory",
    splicing: "Grouping",
  };

  return sourceProcessBySlug[processSlug] ?? "Inventory";
}

export function isFactoryWarehouseLabel(value: string) {
  return /^warehouse\b/i.test(value.trim());
}

export function getFactoryString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function displayFactoryDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) {
    return value.trim().slice(0, 10);
  }
  return "-";
}

export function formatInspectionDialogDate(value: unknown) {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" && value.trim()
        ? new Date(value)
        : null;

  if (date && !Number.isNaN(date.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  if (typeof value === "string" && value.trim()) return value.trim();
  return "-";
}

export function formatDialogMeasure(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return trimDialogNumber(value);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "-";
    if (/^-?\d+(\.\d+)?$/u.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) return trimDialogNumber(numeric);
    }
    return trimmed;
  }

  return "-";
}

export function trimDialogNumber(value: number) {
  return value.toFixed(3).replace(/\.?0+$/u, "");
}

export function isoDateToLocalDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function localDateToIso(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const inspectionDialogPaperSx = (theme: import("@mui/material/styles").Theme) => ({
  border: `1px solid ${theme.customTokens.borders.default}`,
  borderRadius: `${theme.customTokens.radius.md}px`,
  boxShadow: theme.shadows[0],
  outline: "none",
  "&:focus, &:focus-visible": {
    outline: "none",
  },
});

export function deriveFactorySqf(sqm: string) {
  const sqmValue = parseNumericValue(sqm);
  return sqmValue && sqmValue > 0
    ? (sqmValue * SQM_TO_SQF).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
    })
    : "";
}

export function deriveFactoryRatePerSqf(amount: unknown, sqf: string) {
  const amountValue = parseNumericValue(amount);
  const sqfValue = parseNumericValue(sqf);

  if (!amountValue || !sqfValue || sqfValue <= 0) {
    return "";
  }

  return formatAmount(amountValue / sqfValue);
}

export function getFactoryRowSequence<Row extends FactoryRecord>(row: Row) {
  const id = String(row.id ?? "");
  const numericPart = id.match(/\d+/g)?.at(-1);
  const parsed = numericPart ? Number(numericPart) : 1;
  return String(Number.isFinite(parsed) ? parsed : 1).padStart(3, "0");
}

export function getFactoryWarehouseCode(warehouseName: string) {
  const suffix = warehouseName.match(/\bWarehouse\s+([A-Z0-9]+)/i)?.[1];
  return suffix ? `W${suffix.toUpperCase()}` : "WH";
}

export function getFactoryNextProcessActions<Row extends FactoryRecord>(
  row: Row,
  slug: string,
  onOpenSplicingOrderIssue: (row: Row) => void,
): readonly EnterpriseTableAction<Row>[] {
  if (slug === "pressing") {
    return getPressingNextProcessActions(row, slug);
  }

  if (slug === "splicing") {
    const canIssueForOrder =
      canAccessPermission(getFactoryPermissionKey("marquetry"), "create") ||
      canAccessPermission(getFactoryPermissionKey("pressing"), "create");

    return canIssueForOrder
      ? [createSplicingOrderIssueAction<Row>(onOpenSplicingOrderIssue)]
      : [];
  }

  const issuedFor = typeof row.issuedFor === "string" ? row.issuedFor.trim() : "";

  if (
    !issuedFor ||
    issuedFor === "Packing" ||
    !(issuedFor in factoryNextProcessRouteMap)
  ) {
    return [];
  }

  return [createFactoryIssueAction<Row>(issuedFor, slug)].filter(
    (action) => canAccessPermission(action.permissionKey, "create"),
  );
}

export function createSplicingOrderIssueAction<Row extends FactoryRecord>(
  onOpenSplicingOrderIssue: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: "issue-for-order",
    label: "Issue For Order",
    icon: Plus,
    tone: "primary",
    onSelect: onOpenSplicingOrderIssue,
  };
}

export function createGroupingOrderIssueAction<Row extends FactoryRecord>(
  onOpenGroupingOrderIssue: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: "issue-for-order",
    label: "Issue for Order",
    icon: Plus,
    tone: "primary",
    onSelect: onOpenGroupingOrderIssue,
  };
}

export function createGroupingSampleIssueAction<Row extends FactoryRecord>(
  onOpenGroupingSampleIssue: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: "issue-for-sample-sheet",
    label: "Issue for Sample Sheet",
    icon: Plus,
    tone: "primary",
    onSelect: onOpenGroupingSampleIssue,
  };
}

export function createSampleIssueProcessAction<Row extends FactoryRecord>(
  process: string,
  onSelect: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: `issue-for-${process.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `Issue for ${process}`,
    icon: Plus,
    tone: "primary",
    onSelect,
  };
}

export function createRejectFactoryAction<Row extends FactoryRecord>(
  processName: string,
  onReject: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: `reject-${processName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `Reject ${processName}`,
    icon: XCircle,
    tone: "danger",
    onSelect: onReject,
  };
}

export function createFactoryIssueAction<Row extends FactoryRecord>(
  issuedFor: string,
  sourceSlug: string,
): EnterpriseTableAction<Row> & { permissionKey?: string } {
  const route = factoryNextProcessRouteMap[issuedFor]!;
  const permissionKey = getIssueRoutePermissionKey(route);

  return {
    id: `issue-for-${issuedFor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `Issue for ${issuedFor}`,
    icon: Plus,
    tone: "primary",
    onSelect: (row) => {
      if (!route.startsWith("/factory/")) {
        return;
      }

      issueToNextFactoryProcess({
        destinationProcess: issuedFor,
        row,
        sourceSlug,
      });
    },
    ...(permissionKey ? { permissionKey } : {}),
  };
}

export function issueToNextFactoryProcess<Row extends FactoryRecord>({
  destinationProcess,
  row,
  sourceSlug,
}: {
  destinationProcess: string;
  row: Row;
  sourceSlug: string;
}) {
  const sampleNo = getSampleNoFromRow(row);
  if (sampleNo) {
    const normalized = destinationProcess.replace(/^CNC\s*\/\s*/i, "").trim();
    if (
      normalized === "Finishing" ||
      normalized === "Fluting" ||
      normalized === "Embossing" ||
      normalized === "Pressing" ||
      normalized === "Packing"
    ) {
      issueSampleToProcess(sampleNo, normalized);
    }
  }

  const orderNo =
    typeof row.orderNo === "string" && !sampleNo ? row.orderNo : undefined;
  const orderItemNo =
    typeof row.orderItemNo === "string" && !sampleNo
      ? row.orderItemNo
      : undefined;

  issueFactoryWork({
    destinationProcess,
    purpose: sampleNo ? "SAMPLE" : "ORDER",
    sourceRow: row,
    sourceSlug,
    sourceProcess: resolveFactoryProcessLabel(sourceSlug),
    sourceWarehouseName: getFactoryRowWarehouseName(row),
    ...(sampleNo ? { sampleNo } : {}),
    ...(orderNo ? { orderNo } : {}),
    ...(orderItemNo ? { orderItemNo } : {}),
  });
}

export function getIssueRoutePermissionKey(route: string) {
  if (route.startsWith("/factory/")) {
    return getFactoryPermissionKey(route.replace(/^\/factory\//, ""));
  }

  const permissionKeyByRoute: Record<string, string> = {
    "/dispatch": "dispatch",
    "/packing": "packing",
    "/warehouse-b?section=inspection": "warehouseB",
  };

  return permissionKeyByRoute[route];
}

export const factoryNextProcessRouteMap: Record<string, string> = {
  "CNC / Fluting": "/factory/cnc-fluting",
  "CNC/Fluting": "/factory/cnc-fluting",
  Dispatch: "/dispatch",
  Drying: "/factory/drying",
  Embossing: "/factory/embossing",
  Finishing: "/factory/finishing",
  Fluting: "/factory/cnc-fluting",
  Grouping: "/factory/grouping",
  Inspection: "/factory/drying-inspection",
  "Drying Inspection": "/factory/drying-inspection",
  "Sawing Inspection": "/factory/sawing-inspection",
  Marquetry: "/factory/marquetry",
  Packing: "/packing",
  Pressing: "/factory/pressing",
  Splicing: "/factory/splicing",
};

export function GroupingSampleIssueDialog<Row extends FactoryRecord>({
  onChange,
  onClose,
  onSubmit,
  state,
}: {
  onChange: Dispatch<SetStateAction<GroupingSampleIssueState<Row> | null>>;
  onClose: () => void;
  onSubmit: () => void;
  state: GroupingSampleIssueState<Row> | null;
}) {
  const availableSheetsNumber = state
    ? getAvailableGroupedSheets(state.row)
    : 0;
  const availableSheets = String(availableSheetsNumber);
  const itemName = getGroupingSampleField(state?.row, ["itemName", "productName"]);
  const subCategory = getGroupingSampleField(state?.row, [
    "itemSubCategory",
    "subCategory",
  ]);
  const color = getGroupingSampleField(state?.row, [
    "color",
    "colour",
    "processColour",
  ]);
  const length = getGroupingSampleField(state?.row, ["length"]);
  const width = getGroupingSampleField(state?.row, ["width"]);
  const thickness = getGroupingSampleField(state?.row, [
    "height",
    "thickness",
    "thickess",
  ]);
  const groupingRef = state?.row?.id ? String(state.row.id) : "";
  const issueSheetsNumber = Number(state?.issueSheets ?? "");
  const hasIssueSheetsValue = Boolean(state?.issueSheets);
  const exceedsAvailableSheets =
    hasIssueSheetsValue && issueSheetsNumber > availableSheetsNumber;
  const hasIssueSheetsError = Boolean(
    exceedsAvailableSheets ||
    (state?.submitted &&
      (!state.issueSheets ||
        !Number.isInteger(issueSheetsNumber) ||
        issueSheetsNumber <= 0)),
  );
  const hasNextProcessError = Boolean(state?.submitted && !state.nextProcess);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={Boolean(state)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Issue for Sample Sheet
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
            })}
          >
            <ReadOnlyDialogField label="Item Name" value={itemName} />
            <ReadOnlyDialogField label="Sub Category" value={subCategory} />
            <ReadOnlyDialogField label="Color" value={color} />
            <ReadOnlyDialogField label="Length" value={length || "-"} />
            <ReadOnlyDialogField label="Width" value={width || "-"} />
            <ReadOnlyDialogField label="Thickness" value={thickness || "-"} />
            <ReadOnlyDialogField
              label="Available No. of Leaves"
              value={availableSheets}
            />
            <ReadOnlyDialogField label="Grouping Reference" value={groupingRef} />

            <Stack spacing={0.75}>
              <DialogFieldLabel>Issue Date</DialogFieldLabel>
              <ErpDatePickerField
                size="dense"
                value={state?.issueDate ?? null}
                onChange={(value) =>
                  onChange((current) =>
                    current ? { ...current, issueDate: value } : current,
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Issue Quantity / No. of Leaves</DialogFieldLabel>
              <TextField
                autoFocus
                error={hasIssueSheetsError}
                fullWidth
                helperText={
                  hasIssueSheetsError
                    ? exceedsAvailableSheets
                      ? "Issue sheets cannot exceed available sheets."
                      : "Enter a valid whole number."
                    : " "
                }
                value={state?.issueSheets ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "");
                  onChange((current) =>
                    current ? { ...current, issueSheets: nextValue } : current,
                  );
                }}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  },
                }}
                sx={(theme) =>
                  getCompactFieldSx(
                    theme,
                    hasIssueSheetsError ? "error" : "default",
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Next Process *</DialogFieldLabel>
              <ErpSelectField
                helperText={hasNextProcessError ? "Select next process." : " "}
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        nextProcess: value as "" | SampleNextProcess,
                      }
                      : current,
                  )
                }
                options={["Splicing"]}
                size="dense"
                state={hasNextProcessError ? "error" : "default"}
                value={state?.nextProcess ?? ""}
              />
            </Stack>

            <Stack spacing={0.75} sx={{ gridColumn: { xs: "1", lg: "1 / -1" } }}>
              <DialogFieldLabel>Remark</DialogFieldLabel>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={state?.remark ?? ""}
                onChange={(event) =>
                  onChange((current) =>
                    current
                      ? { ...current, remark: event.target.value }
                      : current,
                  )
                }
                sx={(theme) => getCompactFieldSx(theme, "default")}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button
          type="button"
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function ReadOnlyDialogField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.75}>
      <DialogFieldLabel>{label}</DialogFieldLabel>
      <TextField
        fullWidth
        value={value || "-"}
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
        sx={(theme) => getCompactFieldSx(theme, "readOnly")}
      />
    </Stack>
  );
}

export function getGroupingSampleField(
  row: FactoryRecord | undefined,
  keys: readonly string[],
) {
  if (!row) {
    return "";
  }

  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

export function GroupingOrderIssueDialog<Row extends FactoryRecord>({
  onChange,
  onClose,
  onSubmit,
  orderRecords,
  state,
}: {
  onChange: Dispatch<SetStateAction<GroupingOrderIssueState<Row> | null>>;
  onClose: () => void;
  onSubmit: () => void;
  orderRecords: readonly OrderRecord[];
  state: GroupingOrderIssueState<Row> | null;
}) {
  const availableGroupedSheets = state
    ? getAvailableGroupedSheets(state.row)
    : 0;
  const orderNumberOptions = state?.orderType
    ? getSplicingOrderNumberOptions(orderRecords, state.orderType)
    : [];
  const orderItemOptions =
    state?.orderType && state.orderNo
      ? getSplicingOrderItemNumberOptions(
        orderRecords,
        state.orderType,
        state.orderNo,
      )
      : [];
  const selectedOrderItem = state
    ? getSplicingSelectedOrderItem(orderRecords, state)
    : null;
  const orderSheets = selectedOrderItem
    ? getOrderLineItemSheetsNumber(selectedOrderItem)
    : 0;
  const maxIssuable = Math.min(availableGroupedSheets, orderSheets);
  const issueSheetsNumber = Number(state?.issueSheets ?? "");
  const hasIssueSheetsValue = Boolean(state?.issueSheets);
  const exceedsMaxIssuable =
    hasIssueSheetsValue && issueSheetsNumber > maxIssuable;
  const hasIssueSheetsError = Boolean(
    exceedsMaxIssuable ||
    (state?.submitted &&
      (!state.issueSheets ||
        !state.orderType ||
        !state.orderNo ||
        !state.orderItemNo ||
        !Number.isInteger(issueSheetsNumber) ||
        issueSheetsNumber <= 0)),
  );
  const showOrderItemTable = Boolean(
    state?.orderType &&
    state.orderNo &&
    state.orderItemNo &&
    selectedOrderItem,
  );

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={Boolean(state)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Issue for Order
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            })}
          >
            <Stack spacing={0.75}>
              <DialogFieldLabel>Issued Date</DialogFieldLabel>
              <ErpDatePickerField
                size="dense"
                value={state?.issueDate ?? null}
                onChange={(value) =>
                  onChange((current) =>
                    current ? { ...current, issueDate: value } : current,
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Available Grouped Sheets</DialogFieldLabel>
              <TextField
                fullWidth
                value={String(availableGroupedSheets)}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                sx={(theme) => getCompactFieldSx(theme, "readOnly")}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Type</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: "",
                        orderType: value,
                      }
                      : current,
                  )
                }
                options={groupingOrderTypeOptions}
                size="dense"
                state="default"
                value={state?.orderType ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: value,
                      }
                      : current,
                  )
                }
                options={orderNumberOptions}
                size="dense"
                state={!state?.orderType ? "disabled" : "default"}
                value={state?.orderNo ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Item No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: value,
                      }
                      : current,
                  )
                }
                options={orderItemOptions}
                size="dense"
                state={!state?.orderNo ? "disabled" : "default"}
                value={state?.orderItemNo ?? ""}
              />
            </Stack>
          </Box>

          {showOrderItemTable ? (
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              })}
            >
              <Box sx={getDialogScrollableTableSx}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 720,
                    tableLayout: "auto",
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={getDialogHeaderCellSx}>Item Name</TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Order Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Available Grouped Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Max Issuable
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Issue No. of Sheets
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={getDialogBodyCellSx}>
                        {selectedOrderItem?.itemName || "-"}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {String(orderSheets)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {String(availableGroupedSheets)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {String(maxIssuable)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        <TextField
                          autoFocus
                          error={hasIssueSheetsError}
                          fullWidth
                          helperText={
                            hasIssueSheetsError
                              ? exceedsMaxIssuable
                                ? "Issue sheets cannot exceed available grouped stock or order sheets."
                                : "Enter a valid whole number."
                              : " "
                          }
                          value={state?.issueSheets ?? ""}
                          onChange={(event) => {
                            const nextValue = event.target.value.replace(/\D/g, "");
                            onChange((current) =>
                              current
                                ? { ...current, issueSheets: nextValue }
                                : current,
                            );
                          }}
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              pattern: "[0-9]*",
                            },
                          }}
                          sx={(theme) =>
                            getCompactFieldSx(
                              theme,
                              hasIssueSheetsError ? "error" : "default",
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button
          type="button"
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function SplicingOrderIssueDialog<Row extends FactoryRecord>({
  onChange,
  onClose,
  onSubmit,
  orderRecords,
  state,
}: {
  onChange: Dispatch<SetStateAction<SplicingOrderIssueState<Row> | null>>;
  onClose: () => void;
  onSubmit: () => void;
  orderRecords: readonly OrderRecord[];
  state: SplicingOrderIssueState<Row> | null;
}) {
  const orderNumberOptions = state?.orderType
    ? getSplicingOrderNumberOptions(orderRecords, state.orderType)
    : [];
  const orderItemOptions =
    state?.orderType && state.orderNo
      ? getSplicingOrderItemNumberOptions(
        orderRecords,
        state.orderType,
        state.orderNo,
      )
      : [];
  const selectedOrderItem = state
    ? getSplicingSelectedOrderItem(orderRecords, state)
    : null;
  const availableSheets = selectedOrderItem
    ? getOrderLineItemSheetsLabel(selectedOrderItem)
    : "";
  const availableSheetsNumber = selectedOrderItem
    ? getOrderLineItemSheetsNumber(selectedOrderItem)
    : 0;
  const issueSheetsNumber = Number(state?.issueSheets ?? "");
  const hasIssueSheetsValue = Boolean(state?.issueSheets);
  const exceedsAvailableSheets =
    hasIssueSheetsValue && issueSheetsNumber > availableSheetsNumber;
  const hasIssueSheetsError = Boolean(
    exceedsAvailableSheets ||
    (state?.submitted &&
      (!state.issueSheets ||
        !Number.isInteger(issueSheetsNumber) ||
        issueSheetsNumber <= 0)),
  );
  const showOrderItemTable = Boolean(
    state?.orderType &&
    state.orderNo &&
    state.orderItemNo &&
    selectedOrderItem,
  );

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={Boolean(state)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            maxWidth: "calc(100vw - 48px)",
            width: {
              xs: "calc(100vw - 24px)",
              lg: "min(1400px, calc(100vw - 64px))",
            },
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Issue for Order
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(4, minmax(0, 1fr))",
              },
            })}
          >
            <Stack spacing={0.75}>
              <DialogFieldLabel>Issued Date</DialogFieldLabel>
              <ErpDatePickerField
                size="dense"
                value={state?.issueDate ?? null}
                onChange={(value) =>
                  onChange((current) =>
                    current ? { ...current, issueDate: value } : current,
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Type</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: "",
                        orderType: value,
                      }
                      : current,
                  )
                }
                options={splicingOrderTypeOptions}
                size="dense"
                state="default"
                value={state?.orderType ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: value,
                      }
                      : current,
                  )
                }
                options={orderNumberOptions}
                size="dense"
                state={!state?.orderType ? "disabled" : "default"}
                value={state?.orderNo ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Item No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: value,
                      }
                      : current,
                  )
                }
                options={orderItemOptions}
                size="dense"
                state={!state?.orderNo ? "disabled" : "default"}
                value={state?.orderItemNo ?? ""}
              />
            </Stack>
          </Box>

          {showOrderItemTable ? (
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              })}
            >
              <Box sx={getDialogScrollableTableSx}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1040,
                    tableLayout: "auto",
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={getDialogHeaderCellSx}>Item Name</TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        No. of Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Available No. of Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Issue No. of Sheets
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={getDialogBodyCellSx}>
                        {selectedOrderItem?.itemName || "-"}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {getOrderLineItemSheetsLabel(selectedOrderItem)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {availableSheets || "-"}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        <TextField
                          error={hasIssueSheetsError}
                          fullWidth
                          helperText={
                            hasIssueSheetsError
                              ? exceedsAvailableSheets
                                ? "Issue sheets cannot exceed available sheets."
                                : "Enter a valid whole number."
                              : " "
                          }
                          value={state?.issueSheets ?? ""}
                          onChange={(event) => {
                            const nextValue = event.target.value.replace(/\D/g, "");
                            onChange((current) =>
                              current
                                ? { ...current, issueSheets: nextValue }
                                : current,
                            );
                          }}
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              pattern: "[0-9]*",
                            },
                          }}
                          sx={(theme) =>
                            getCompactFieldSx(
                              theme,
                              hasIssueSheetsError ? "error" : "default",
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button
          type="button"
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function DialogFieldLabel({
  children,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Typography
      sx={(theme) => ({
        color: theme.customTokens.text.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 700,
      })}
    >
      {children}
    </Typography>
  );
}

export const splicingOrderTypeOptions = [
  "Marquetry",
  "Decorative",
  "Fluted",
  "Embossed",
] as const;

export const groupingOrderTypeOptions = [
  "Decorative",
  "Fluted",
  "Embossed",
] as const;

export type SplicingOrderType = (typeof splicingOrderTypeOptions)[number];

export type SplicingOrderLineItemOption = {
  lineItem: OrderLineItem;
  orderItemNo: string;
};

export function getSplicingOrderNumberOptions(
  orderRecords: readonly OrderRecord[],
  orderType: string,
) {
  return orderRecords
    .filter(
      (record) =>
        getSplicingOrderLineItemOptions(record, orderType).length > 0,
    )
    .map((record) => record.orderNo);
}

export function getSplicingOrderItemNumberOptions(
  orderRecords: readonly OrderRecord[],
  orderType: string,
  orderNo: string,
) {
  const order = getSplicingSelectedOrder(orderRecords, orderNo);

  if (!order) {
    return [];
  }

  return getSplicingOrderLineItemOptions(order, orderType).map(
    (option) => option.orderItemNo,
  );
}

export function getSplicingSelectedOrder(
  orderRecords: readonly OrderRecord[],
  orderNo: string,
) {
  return orderRecords.find((record) => record.orderNo === orderNo) ?? null;
}

export function getSplicingSelectedOrderItem<Row extends FactoryRecord>(
  orderRecords: readonly OrderRecord[],
  state: SplicingOrderIssueState<Row>,
) {
  const order = getSplicingSelectedOrder(orderRecords, state.orderNo);

  if (!order) {
    return null;
  }

  return (
    getSplicingOrderLineItemOptions(order, state.orderType).find(
      (option) => option.orderItemNo === state.orderItemNo,
    )?.lineItem ?? null
  );
}

export function getSplicingOrderLineItemOptions(
  order: OrderRecord,
  orderType: string,
): SplicingOrderLineItemOption[] {
  const normalizedOrderType = normalizeSplicingOrderType(orderType);

  if (!normalizedOrderType) {
    return [];
  }

  const recordOrderType =
    normalizeSplicingOrderType(order.orderType) ??
    normalizeSplicingOrderType(order.productCategory);

  return getOrderLineItems(order.id)
    .map((lineItem, index) => ({
      lineItem,
      orderItemNo: String(index + 1),
    }))
    .filter((option) => {
      const lineItemOrderType =
        normalizeSplicingOrderType(option.lineItem.finishedType) ??
        normalizeSplicingOrderType(option.lineItem.productCategory);

      if (lineItemOrderType) {
        return lineItemOrderType === normalizedOrderType;
      }

      return recordOrderType === normalizedOrderType;
    });
}

export function normalizeSplicingOrderType(
  value: string | null | undefined,
): SplicingOrderType | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  return (
    splicingOrderTypeOptions.find((option) =>
      normalizedValue.includes(option.toLowerCase()),
    ) ?? null
  );
}

export function getOrderLineItemSheetsLabel(
  lineItem: OrderLineItem | null | undefined,
) {
  return lineItem?.quantitySheets?.trim() || "0";
}

export function getOrderLineItemSheetsNumber(
  lineItem: OrderLineItem | null | undefined,
) {
  const value = getOrderLineItemSheetsLabel(lineItem).replace(/[^\d]/g, "");
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

export function getSplicingOrderIssueRoute(orderType: string) {
  return normalizeSplicingOrderType(orderType) === "Marquetry"
    ? "/factory/marquetry/add"
    : "/factory/pressing/add";
}

export function buildSplicingOrderIssueSourceRow<Row extends FactoryRecord>(
  state: SplicingOrderIssueState<Row>,
  order: OrderRecord | null,
  lineItem: OrderLineItem,
) {
  return {
    ...state.row,
    amount: lineItem.amount || state.row.amount,
    customerName: order?.customerName ?? state.row.customerName,
    issuedDate: state.issueDate ?? new Date(),
    issuedFor: state.orderType,
    itemName:
      lineItem.itemName ||
      lineItem.salesItemName ||
      state.row.itemName ||
      state.row.productName,
    itemSubCategory: lineItem.subCategory || state.row.itemSubCategory,
    length: lineItem.length || state.row.length,
    noOfSheets: state.issueSheets || lineItem.quantitySheets || state.row.noOfSheets,
    orderDate: order?.orderDate ?? state.row.orderDate,
    orderItemNo: state.orderItemNo,
    orderNo: state.orderNo,
    productName:
      lineItem.itemName ||
      lineItem.salesItemName ||
      state.row.itemName ||
      state.row.productName,
    productType: state.orderType,
    remark: lineItem.remark || state.row.remark,
    sqf: lineItem.totalSqm || state.row.sqf,
    sqm: lineItem.sqm || state.row.sqm,
    thickness: lineItem.thickness || state.row.thickness,
    width: lineItem.width || state.row.width,
  } as Row;
}

export function buildGroupingOrderIssueSourceRow<Row extends FactoryRecord>(
  state: GroupingOrderIssueState<Row>,
  order: OrderRecord | null,
  lineItem: OrderLineItem,
) {
  return {
    ...buildSplicingOrderIssueSourceRow(state, order, lineItem),
    issuedFrom: "Grouping",
    groupingRef: state.row.id,
    remark:
      lineItem.remark ||
      `Issued from Grouping ${state.row.id} (${state.issueSheets} sheets)`,
  } as Row;
}

export function getDialogScrollableTableSx(theme: import("@mui/material/styles").Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}

export function getDialogHeaderCellSx(theme: import("@mui/material/styles").Theme) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    backgroundColor: theme.customTokens.neutrals[100],
    color: theme.customTokens.neutrals[700],
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    minWidth: 180,
    py: theme.spacing(1.1),
    px: theme.spacing(1.25),
    whiteSpace: "nowrap",
  } as const;
}

export function getDialogBodyCellSx(theme: import("@mui/material/styles").Theme) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    color: theme.customTokens.text.primary,
    fontSize: "14px",
    fontWeight: 400,
    minWidth: 180,
    py: theme.spacing(1.15),
    px: theme.spacing(1.25),
    verticalAlign: "top",
    whiteSpace: "nowrap",
  } as const;
}
