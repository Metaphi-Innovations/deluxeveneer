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
} from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  DialogFieldLabel,
  getDialogBodyCellSx,
  getDialogHeaderCellSx,
  getDialogScrollableTableSx,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export const finishingTypeOptions = ["Glossy", "Rough"] as const;

export type FinishingType = (typeof finishingTypeOptions)[number];

function displayDetail(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return Number.isInteger(value) ? String(value) : Number(value.toFixed(3)).toString();
  }

  if (typeof value === "string" && value.trim()) {
    const numeric = Number(value.trim());
    if (!Number.isNaN(numeric) && !value.includes("-") && !value.includes("/")) {
      return Number.isInteger(numeric) ? value.trim() : Number(numeric.toFixed(3)).toString();
    }
    return value.trim();
  }

  return "-";
}

function sheetCount(value: unknown) {
  const numeric = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function availableSheetCount(row: FactoryRecord | null) {
  const candidates = [
    row?.noOfSheets,
    row?.issuedNoOfSheets,
    row?.availableSheets,
    row?.outputNoOfSheets,
    row?.finishedSheets,
    row?.totalNoOfSheets,
  ];

  for (const candidate of candidates) {
    const count = sheetCount(candidate);
    if (count > 0) {
      return count;
    }
  }

  return 0;
}

function scaleMeasure(value: unknown, fromSheets: number, toSheets: number) {
  const numeric = Number(String(value ?? "").replace(/,/g, ""));
  if (!Number.isFinite(numeric) || fromSheets <= 0 || toSheets <= 0) {
    return value;
  }

  return (numeric * (toSheets / fromSheets)).toLocaleString("en-IN", {
    maximumFractionDigits: 3,
    minimumFractionDigits: 3,
  });
}

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

export function buildFinishingDoneSnapshot(
  row: FactoryRecord,
  entry: {
    finishingDate?: string;
    finishingType: FinishingType;
    flutingDate?: string;
    noOfSheets: number;
    remark: string;
  },
) {
  const availableSheets = availableSheetCount(row);
  const sheets = String(entry.noOfSheets);
  const remark = entry.remark.trim();
  const flutingDate = entry.flutingDate?.trim() || "";

  return {
    ...row,
    finishedSheets: sheets,
    finishingType: entry.finishingType,
    listingState: "done",
    noOfSheets: sheets,
    outputNoOfSheets: sheets,
    sqf: scaleMeasure(row.sqf, availableSheets, entry.noOfSheets),
    sqm: scaleMeasure(row.sqm, availableSheets, entry.noOfSheets),
    ...(flutingDate ? { flutingDate, cncDate: flutingDate } : {}),
    ...(remark ? { remark } : {}),
  };
}

export function FinishingCreateDialog({
  mode = "create",
  onClose,
  onSave,
  open,
  row,
}: {
  mode?: "create" | "edit";
  onClose: () => void;
  onSave: (entry: {
    finishingDate?: string;
    finishingType: FinishingType;
    flutingDate?: string;
    noOfSheets: number;
    remark: string;
  }) => void;
  open: boolean;
  row: FactoryRecord | null;
}) {
  const [sheets, setSheets] = useState("");
  const [finishingType, setFinishingType] = useState("");
  const [flutingDate, setFlutingDate] = useState("");
  const [remark, setRemark] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const availableSheets = availableSheetCount(row);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && row) {
      setSheets(String(row.noOfSheets ?? row.finishedSheets ?? row.outputNoOfSheets ?? ""));
      setFinishingType(
        row.finishingType === "Glossy" || row.finishingType === "Rough"
          ? (row.finishingType as FinishingType)
          : "",
      );
      setFlutingDate(String(row.flutingDate ?? row.cncDate ?? row.finishingDate ?? todayInputValue()));
      setRemark(String(row.remark ?? ""));
    } else {
      setSheets("");
      setFinishingType("");
      setFlutingDate(todayInputValue());
      setRemark("");
    }
    setSubmitted(false);
  }, [mode, open, row]);

  const parsedSheets = sheets === "" ? Number.NaN : Number(sheets);
  const exceedsAvailable =
    availableSheets > 0 &&
    Number.isInteger(parsedSheets) &&
    parsedSheets > availableSheets;
  const sheetsMissing = submitted && sheets.trim() === "";
  const sheetsNotPositive =
    submitted &&
    sheets.trim() !== "" &&
    (!Number.isInteger(parsedSheets) || parsedSheets <= 0);
  const sheetsInvalid = sheetsMissing || sheetsNotPositive || exceedsAvailable;
  const sheetsError = exceedsAvailable
    ? `Number of sheets cannot exceed ${availableSheets}.`
    : sheetsNotPositive
      ? "Enter a whole number greater than 0."
      : sheetsMissing
        ? "Number of sheets is required."
        : "";
  const typeInvalid = finishingType !== "Glossy" && finishingType !== "Rough";

  const details: Array<{ label: string; minWidth?: number; value: unknown }> = [
    { label: "Issued From", minWidth: 140, value: row?.issuedFrom },
    { label: "Group No.", minWidth: 140, value: row?.groupNo },
    { label: "Order Date", minWidth: 130, value: row?.orderDate },
    { label: "Issued Date", minWidth: 130, value: row?.issuedDate },
    { label: "Customer Name", minWidth: 170, value: row?.customerName },
    { label: "Order No", minWidth: 140, value: row?.orderNo },
    { label: "Order Item No", minWidth: 140, value: row?.orderItemNo },
    { label: "Item Name", minWidth: 170, value: row?.itemName },
    { label: "Item Sub Category", minWidth: 160, value: row?.itemSubCategory },
    { label: "Design Code", minWidth: 140, value: row?.designCode },
    { label: "Structure Code", minWidth: 140, value: row?.structureCode },
    { label: "Length", minWidth: 110, value: row?.length },
    { label: "Width", minWidth: 110, value: row?.width },
    { label: "Thickness", minWidth: 110, value: row?.thickness || row?.height },
    { label: "No of Sheets", minWidth: 140, value: availableSheets || row?.noOfSheets },
    { label: "SQM", minWidth: 120, value: row?.sqm },
    { label: "SQF", minWidth: 120, value: row?.sqf },
    { label: "Remark", minWidth: 180, value: row?.remark },
  ];

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            outline: "none",
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
        {mode === "edit" ? "Edit Finishing" : "Create Finishing"}
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack spacing={2}>
          <Box sx={(theme) => formSectionCardSx(theme)}>
            <Stack spacing={1.5}>
              <FormSectionHeader title="Issued Details" />
              <Box
                sx={(theme) => ({
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  overflow: "hidden",
                })}
              >
                <Box sx={(theme) => getDialogScrollableTableSx(theme)}>
                  <Table size="small" sx={{ minWidth: 2200, tableLayout: "auto" }}>
                    <TableHead>
                      <TableRow>
                        {details.map((item) => (
                          <TableCell
                            key={item.label}
                            sx={(theme) => ({
                              ...getDialogHeaderCellSx(theme),
                              ...(item.minWidth ? { minWidth: item.minWidth } : {}),
                            })}
                          >
                            {item.label}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {details.map((item) => (
                          <TableCell
                            key={item.label}
                            sx={(theme) => ({
                              ...getDialogBodyCellSx(theme),
                              ...(item.minWidth ? { minWidth: item.minWidth } : {}),
                            })}
                          >
                            {displayDetail(item.value)}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Stack>
          </Box>

          <Box sx={(theme) => formSectionCardSx(theme)}>
            <Stack spacing={1.5}>
              <FormSectionHeader title="Finishing" />
              <Box
                sx={(theme) => ({
                  display: "grid",
                  gap: theme.spacing(2),
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(4, minmax(0, 1fr))",
                  },
                })}
              >
                <Stack spacing={0.75}>
                  <DialogFieldLabel>Number of Sheets *</DialogFieldLabel>
                  <TextField
                    autoFocus
                    error={sheetsInvalid}
                    fullWidth
                    helperText={sheetsError || " "}
                    placeholder="Enter number of sheets"
                    size="small"
                    value={sheets}
                    onChange={(event) =>
                      setSheets(event.target.value.replace(/\D/g, ""))
                    }
                    slotProps={{
                      htmlInput: {
                        inputMode: "numeric",
                        pattern: "[0-9]*",
                      },
                    }}
                    sx={(theme) =>
                      getCompactFieldSx(theme, sheetsInvalid ? "error" : "default")
                    }
                  />
                </Stack>
                <Stack spacing={0.75}>
                  <DialogFieldLabel>Finishing Type</DialogFieldLabel>
                  <ErpSelectField
                    helperText={
                      submitted && typeInvalid ? "Select Glossy or Rough." : " "
                    }
                    onChange={setFinishingType}
                    options={finishingTypeOptions}
                    placeholder="Select finishing type"
                    size="dense"
                    state={submitted && typeInvalid ? "error" : "default"}
                    value={finishingType}
                  />
                </Stack>
                <Stack spacing={0.75}>
                  <DialogFieldLabel>Fluting Date</DialogFieldLabel>
                  <TextField
                    fullWidth
                    onChange={(event) => setFlutingDate(event.target.value)}
                    size="small"
                    type="date"
                    value={flutingDate}
                    sx={(theme) => getCompactFieldSx(theme, "default")}
                  />
                </Stack>
                <Stack spacing={0.75}>
                  <DialogFieldLabel>Remark</DialogFieldLabel>
                  <TextField
                    fullWidth
                    onChange={(event) => setRemark(event.target.value)}
                    placeholder="Enter remark"
                    size="small"
                    value={remark}
                    sx={(theme) => getCompactFieldSx(theme, "default")}
                  />
                </Stack>
              </Box>
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
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          onClick={() => {
            setSubmitted(true);
            if (sheetsInvalid || typeInvalid) return;
            onSave({
              finishingType: finishingType as FinishingType,
              flutingDate: flutingDate.trim(),
              noOfSheets: parsedSheets,
              remark: remark.trim(),
            });
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
