import { useEffect, useState } from "react";
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  DialogFieldLabel,
  ReadOnlyDialogField,
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
    return String(value);
  }

  if (typeof value === "string" && value.trim()) {
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

export function buildFinishingDoneSnapshot(
  row: FactoryRecord,
  entry: { finishingType: FinishingType; noOfSheets: number },
) {
  const availableSheets = availableSheetCount(row);
  const sheets = String(entry.noOfSheets);

  return {
    ...row,
    finishedSheets: sheets,
    finishingType: entry.finishingType,
    listingState: "done",
    noOfSheets: sheets,
    outputNoOfSheets: sheets,
    sqf: scaleMeasure(row.sqf, availableSheets, entry.noOfSheets),
    sqm: scaleMeasure(row.sqm, availableSheets, entry.noOfSheets),
  };
}

export function FinishingCreateDialog({
  onClose,
  onSave,
  open,
  row,
}: {
  onClose: () => void;
  onSave: (entry: { finishingType: FinishingType; noOfSheets: number }) => void;
  open: boolean;
  row: FactoryRecord | null;
}) {
  const [sheets, setSheets] = useState("");
  const [finishingType, setFinishingType] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const availableSheets = availableSheetCount(row);

  useEffect(() => {
    if (!open) return;
    setSheets("");
    setFinishingType("");
    setSubmitted(false);
  }, [open, row]);

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

  const details: Array<[string, unknown]> = [
    ["Issued From", row?.issuedFrom],
    ["Group No.", row?.groupNo],
    ["Order Date", row?.orderDate],
    ["Issued Date", row?.issuedDate],
    ["Customer Name", row?.customerName],
    ["Order No", row?.orderNo],
    ["Order Item No", row?.orderItemNo],
    ["Item Name", row?.itemName],
    ["Item Sub Category", row?.itemSubCategory],
    ["Design Code", row?.designCode],
    ["Structure Code", row?.structureCode],
    ["Length", row?.length],
    ["Width", row?.width],
    ["Thickness", row?.thickness || row?.height],
    ["No of Sheets", availableSheets || row?.noOfSheets],
    ["SQM", row?.sqm],
    ["SQF", row?.sqf],
    ["Remark", row?.remark],
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
        Create Finishing
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
                  display: "grid",
                  gap: theme.spacing(2),
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                })}
              >
                {details.map(([label, value]) => (
                  <ReadOnlyDialogField
                    key={label}
                    label={label}
                    value={displayDetail(value)}
                  />
                ))}
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
              noOfSheets: parsedSheets,
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
