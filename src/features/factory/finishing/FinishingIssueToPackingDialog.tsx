import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  DialogFieldLabel,
  inspectionDialogPaperSx,
  ReadOnlyDialogField,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

function sheetCount(value: unknown) {
  const numeric = Number(String(value ?? "").replace(/[^\d.]/gu, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function getAvailableSheets(row: FactoryRecord | null) {
  if (!row) return 0;
  const candidates = [
    row.availableSheets,
    row.finishedSheets,
    row.outputNoOfSheets,
    row.noOfSheets,
    row.totalNoOfSheets,
  ];
  for (const candidate of candidates) {
    const quantity = sheetCount(candidate);
    if (quantity > 0) return quantity;
  }
  return 0;
}

export function FinishingIssueToPackingDialog<Row extends FactoryRecord>({
  onClose,
  onSubmit,
  open,
  row,
}: {
  onClose: () => void;
  onSubmit: (
    row: Row,
    entry: { issueSheets: number; packingDate: string; remark: string },
  ) => void;
  open: boolean;
  row: Row | null;
}) {
  const [issueSheets, setIssueSheets] = useState("");
  const [packingDate, setPackingDate] = useState("");
  const [remark, setRemark] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const availableSheets = getAvailableSheets(row);
  const numericSheets = Number(issueSheets);
  const sheetError = submitted
    ? !Number.isInteger(numericSheets) || numericSheets <= 0
      ? "Enter sheets greater than 0."
      : numericSheets > availableSheets
        ? `Sheets to issue cannot exceed ${availableSheets}.`
        : ""
    : "";

  useEffect(() => {
    if (!open || !row) return;
    const available = getAvailableSheets(row);
    setIssueSheets(available > 0 ? String(available) : "");
    setPackingDate(new Date().toISOString().slice(0, 10));
    setRemark("");
    setSubmitted(false);
  }, [open, row]);

  if (!row) return null;

  const handleSubmit = () => {
    setSubmitted(true);
    if (
      !Number.isInteger(numericSheets) ||
      numericSheets <= 0 ||
      numericSheets > availableSheets ||
      !packingDate
    ) {
      return;
    }
    onSubmit(row, {
      issueSheets: numericSheets,
      packingDate,
      remark: remark.trim(),
    });
  };

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: inspectionDialogPaperSx } }}
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
        Issue to Packing
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: "16px !important" }}>
        <Box sx={(theme) => formSectionCardSx(theme)}>
          <Stack spacing={2}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              }}
            >
              <ReadOnlyDialogField label="Available Sheets" value={String(availableSheets)} />
              <Box>
                <DialogFieldLabel required>Sheets to Issue</DialogFieldLabel>
                <TextField
                  error={Boolean(sheetError)}
                  fullWidth
                  helperText={sheetError}
                  inputProps={{ min: 1, step: 1 }}
                  onChange={(event) => setIssueSheets(event.target.value.replace(/\D/gu, ""))}
                  placeholder="Enter sheets"
                  size="small"
                  sx={(theme) => getCompactFieldSx(theme, sheetError ? "error" : "default")}
                  type="number"
                  value={issueSheets}
                />
              </Box>
              <Box>
                <DialogFieldLabel required>Packing Date</DialogFieldLabel>
                <TextField
                  error={submitted && !packingDate}
                  fullWidth
                  helperText={submitted && !packingDate ? "Select a packing date." : ""}
                  onChange={(event) => setPackingDate(event.target.value)}
                  size="small"
                  sx={(theme) => getCompactFieldSx(theme, submitted && !packingDate ? "error" : "default")}
                  type="date"
                  value={packingDate}
                />
              </Box>
              <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                <DialogFieldLabel>Remark</DialogFieldLabel>
                <TextField
                  fullWidth
                  minRows={2}
                  multiline
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Enter remark"
                  size="small"
                  sx={(theme) => getCompactFieldSx(theme)}
                  value={remark}
                />
              </Box>
            </Box>
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Cancel
        </Button>
        <Button disableElevation onClick={handleSubmit} sx={recordFormActionButtonSx} variant="contained">
          Issue to Packing
        </Button>
      </DialogActions>
    </Dialog>
  );
}
