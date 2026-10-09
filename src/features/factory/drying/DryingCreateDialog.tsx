import { useEffect, useState } from "react";
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
import { useTheme } from "@mui/material/styles";

import { ErpDatePickerField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import type { FactoryRecord } from "../shared/types";
import {
  dryingLeafArea,
  dryingLeafCount,
  dryingReceivedLeafCount,
} from "./dryingFrontendStore";

function isoToDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/u.exec(value);
  if (!match) return null;
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

function dateToIso(value: Date | null) {
  if (!value || Number.isNaN(value.getTime())) return "";
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toFixed(3).replace(/\.?0+$/u, "");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "-";
    if (/^-?\d+(\.\d+)?$/u.test(trimmed)) {
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric)) return numeric.toFixed(3).replace(/\.?0+$/u, "");
    }
    const parsed = new Date(trimmed);
    if (!Number.isNaN(parsed.getTime()) && /^\d{4}-\d{2}-\d{2}/u.test(trimmed)) {
      return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(parsed);
    }
    return trimmed;
  }

  return "-";
}

function FieldLabel({ children }: { children: string }) {
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

function ReadOnlyDetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <Stack spacing={0.75}>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        fullWidth
        value={displayValue(value)}
        slotProps={{ input: { readOnly: true } }}
        sx={(theme) => getCompactFieldSx(theme, "readOnly")}
      />
    </Stack>
  );
}

export function DryingCreateDialog({
  onClose,
  onSave,
  open,
  row,
}: {
  onClose: () => void;
  onSave: (entry: { driedLeaves: number; dryingDate: string; remark: string }) => void;
  open: boolean;
  row: FactoryRecord | null;
}) {
  const theme = useTheme();
  const [leaves, setLeaves] = useState("");
  const [dryingDate, setDryingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const availableLeaves = dryingLeafCount(row);

  useEffect(() => {
    if (!open) return;
    setLeaves("");
    setDryingDate(new Date().toISOString().slice(0, 10));
    setRemark("");
    setSubmitted(false);
  }, [open, row]);

  const driedLeaves = Number(leaves);
  const invalid =
    leaves.trim() === "" ||
    !Number.isInteger(driedLeaves) ||
    driedLeaves <= 0 ||
    driedLeaves > availableLeaves;
  const dateMissing = dryingDate.trim() === "";
  const previewArea = dryingLeafArea(row?.length, row?.width, !invalid ? driedLeaves : 0);

  const slicingFields: Array<[string, unknown]> = [
    ["Storage Sr No.", row?.storageSrNo ?? row?.id],
    ["Issue Date", row?.issueDate],
    ["Item Name", row?.itemName],
    ["Sub Category", row?.subCategory ?? row?.itemSubCategory],
    ["Log Code", row?.logCode || row?.logNo || row?.batchNo],
    ["Bundle Number", row?.bundleNumber],
    ["Pallet No", row?.palletNo],
    ["Length", row?.length],
    ["Width", row?.width],
    ["Thickness", row?.thickness || row?.height],
    ["Received No of Leaves", dryingReceivedLeafCount(row) || "-"],
    ["Available No of Leaves", availableLeaves || "-"],
    ["Total Sq Meter", row?.totalSqMeter ?? row?.sqm],
  ];

  const itemColumns: Array<{ key: string; label: string; minWidth: number; value?: string }> = [
    { key: "itemName", label: "Item Name", minWidth: 170, value: displayValue(row?.itemName) },
    {
      key: "subCategory",
      label: "Sub Category",
      minWidth: 160,
      value: displayValue(row?.subCategory ?? row?.itemSubCategory),
    },
    {
      key: "logCode",
      label: "Log Code",
      minWidth: 140,
      value: displayValue(row?.logCode || row?.logNo || row?.batchNo),
    },
    { key: "bundleNumber", label: "Bundle Number", minWidth: 140, value: displayValue(row?.bundleNumber) },
    { key: "palletNo", label: "Pallet No", minWidth: 120, value: displayValue(row?.palletNo) },
    { key: "color", label: "Color", minWidth: 110, value: displayValue(row?.color) },
    { key: "grade", label: "Grade", minWidth: 110, value: displayValue(row?.grade) },
    { key: "length", label: "Length", minWidth: 110, value: displayValue(row?.length) },
    { key: "width", label: "Width", minWidth: 110, value: displayValue(row?.width) },
    {
      key: "thickness",
      label: "Thickness",
      minWidth: 120,
      value: displayValue(row?.thickness || row?.height),
    },
    { key: "noOfLeaves", label: "No of Leaves", minWidth: 150 },
    { key: "sqm", label: "SQM", minWidth: 120, value: !invalid ? previewArea.sqm : "-" },
    { key: "sqf", label: "SQF", minWidth: 120, value: !invalid ? previewArea.sqf : "-" },
    { key: "remark", label: "Remark", minWidth: 180, value: displayValue(row?.remark) },
  ];

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (dialogTheme) => ({
            border: `1px solid ${dialogTheme.customTokens.borders.default}`,
            borderRadius: `${dialogTheme.customTokens.radius.md}px`,
            boxShadow: dialogTheme.shadows[0],
            outline: "none",
          }),
        },
      }}
    >
      <DialogTitle
        sx={(dialogTheme) => ({
          borderBottom: `1px solid ${dialogTheme.customTokens.borders.default}`,
          fontSize: dialogTheme.typography.h3.fontSize,
          fontWeight: 700,
          px: dialogTheme.spacing(2),
          py: dialogTheme.spacing(1.5),
        })}
      >
        Create Drying
      </DialogTitle>
      <DialogContent
        sx={(dialogTheme) => ({
          px: dialogTheme.spacing(2),
          py: `${dialogTheme.spacing(2)} !important`,
        })}
      >
        <Stack spacing={2}>
          <Box sx={(dialogTheme) => formSectionCardSx(dialogTheme)}>
            <Stack sx={(dialogTheme) => ({ gap: dialogTheme.spacing(1.5) })}>
              <FormSectionHeader title="Slicing Details" />
              <Box
                sx={(dialogTheme) => ({
                  display: "grid",
                  gap: dialogTheme.spacing(2),
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                })}
              >
                {slicingFields.map(([label, value]) => (
                  <ReadOnlyDetailField key={label} label={label} value={value} />
                ))}
                <Box sx={{ gridColumn: "1 / -1" }}>
                  <ReadOnlyDetailField label="Remark" value={row?.remark} />
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ maxWidth: 280 }}>
            <Stack spacing={0.75}>
              <FieldLabel>Drying Date *</FieldLabel>
              <ErpDatePickerField
                onChange={(value) => setDryingDate(dateToIso(value))}
                size="dense"
                state={submitted && dateMissing ? "error" : "default"}
                helperText={submitted && dateMissing ? "Drying date is required." : " "}
                value={isoToDate(dryingDate)}
              />
            </Stack>
          </Box>

          <Box sx={(dialogTheme) => formSectionCardSx(dialogTheme)}>
            <Stack spacing={1.5}>
              <FormSectionHeader title="Item Details" />
              <Box
                sx={{
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  overflow: "hidden",
                }}
              >
                <Box
                  sx={{
                    overflowX: "auto",
                    overflowY: "hidden",
                    scrollbarWidth: "thin",
                    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
                  }}
                >
                  <Table size="medium" sx={{ minWidth: 1900, tableLayout: "auto" }}>
                    <TableHead>
                      <TableRow>
                        {itemColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            sx={{
                              ...transactionTableHeaderCellSx(theme, column.minWidth),
                              borderRight: `1px solid ${theme.customTokens.borders.divider}`,
                            }}
                          >
                            {column.label}
                            {column.key === "noOfLeaves" ? " *" : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {itemColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            sx={{
                              ...transactionTableBodyCellSx(theme),
                              borderRight: `1px solid ${theme.customTokens.borders.divider}`,
                            }}
                          >
                            {column.key === "noOfLeaves" ? (
                              <TextField
                                autoFocus
                                error={submitted && invalid}
                                fullWidth
                                placeholder="Leaves"
                                size="small"
                                value={leaves}
                                onChange={(event) =>
                                  setLeaves(event.target.value.replace(/[^\d]/g, ""))
                                }
                                sx={getCompactFieldSx(theme, submitted && invalid ? "error" : "default")}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                sx={{
                                  minHeight: theme.spacing(4.5),
                                  display: "flex",
                                  alignItems: "center",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {column.value}
                              </Typography>
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>
              {submitted && invalid ? (
                <Typography
                  sx={(dialogTheme) => ({
                    color: dialogTheme.palette.error.main,
                    fontSize: dialogTheme.typography.caption.fontSize,
                  })}
                >
                  Enter a whole number of leaves up to {availableLeaves}.
                </Typography>
              ) : null}
            </Stack>
          </Box>

          <Box sx={(dialogTheme) => formSectionCardSx(dialogTheme)}>
            <Stack sx={(dialogTheme) => ({ gap: dialogTheme.spacing(1.5) })}>
              <FormSectionHeader title="Remark" />
              <TextField
                  fullWidth
                  minRows={2}
                  multiline
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Enter drying remark"
                  size="small"
                  value={remark}
                  sx={(fieldTheme) => getCompactFieldSx(fieldTheme, "default")}
                />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={(dialogTheme) => ({
          borderTop: `1px solid ${dialogTheme.customTokens.borders.default}`,
          px: dialogTheme.spacing(2),
          py: dialogTheme.spacing(1.5),
        })}
      >
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={() => {
            setSubmitted(true);
            if (invalid || dateMissing) return;
            onSave({ driedLeaves, dryingDate, remark: remark.trim() });
          }}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
