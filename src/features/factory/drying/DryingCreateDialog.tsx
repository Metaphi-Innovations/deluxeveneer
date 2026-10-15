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
  Typography,
} from "@mui/material";

import { ErpDatePickerField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import type { FactoryRecord } from "../shared/types";
import {
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

export function DryingCreateDialog({
  minimumLeaves = 1,
  mode = "create",
  maximumLeaves,
  onClose,
  onSave,
  open,
  row,
}: {
  minimumLeaves?: number;
  mode?: "create" | "edit";
  maximumLeaves?: number;
  onClose: () => void;
  onSave: (entry: { driedLeaves: number; dryingDate: string; remark: string }) => void;
  open: boolean;
  row: FactoryRecord | null;
}) {
  const [leaves, setLeaves] = useState("");
  const [dryingDate, setDryingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [remark, setRemark] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const availableLeaves = maximumLeaves ?? dryingLeafCount(row);

  useEffect(() => {
    if (!open) return;
    setLeaves(
      mode === "edit"
        ? String(dryingReceivedLeafCount(row) || "")
        : "",
    );
    setDryingDate(
      mode === "edit"
        ? String(row?.dryingDate || row?.issueDate || new Date().toISOString().slice(0, 10)).slice(0, 10)
        : new Date().toISOString().slice(0, 10),
    );
    setRemark(mode === "edit" ? String(row?.remark || "") : "");
    setSubmitted(false);
  }, [maximumLeaves, mode, open, row]);

  const driedLeaves = Number(leaves);
  const invalid =
    leaves.trim() === "" ||
    !Number.isInteger(driedLeaves) ||
    driedLeaves < minimumLeaves ||
    driedLeaves > availableLeaves;
  const dateMissing = dryingDate.trim() === "";

  return (
    <Dialog
      fullWidth
      maxWidth="md"
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
        {mode === "edit" ? "Edit Drying" : "Create Drying"}
      </DialogTitle>
      <DialogContent
        sx={(dialogTheme) => ({
          px: dialogTheme.spacing(2),
          py: `${dialogTheme.spacing(2)} !important`,
        })}
      >
        <Stack spacing={2}>
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
              <FormSectionHeader title="Drying Details" />
              <Box
                sx={(dialogTheme) => ({
                  display: "grid",
                  gap: dialogTheme.spacing(2),
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                  alignItems: "flex-start",
                })}
              >
                <Stack spacing={0.75}>
                  <FieldLabel>Available No. of Leaves</FieldLabel>
                  <TextField
                    fullWidth
                    onFocus={(event) => event.target.blur()}
                    size="small"
                    slotProps={{ htmlInput: { readOnly: true, tabIndex: -1 } }}
                    value={availableLeaves}
                    sx={(fieldTheme) => ({
                      ...getCompactFieldSx(fieldTheme, "readOnly"),
                      "& .MuiInputBase-root, & .MuiInputBase-input": {
                        cursor: "default",
                        caretColor: "transparent",
                      },
                    })}
                  />
                </Stack>

                <Stack spacing={0.75}>
                  <FieldLabel>Leaves to Issue for Drying *</FieldLabel>
                  <TextField
                    autoFocus={mode === "create"}
                    error={submitted && invalid}
                    fullWidth
                    helperText={
                      submitted && invalid
                        ? `Enter a whole number${
                            minimumLeaves > 1 ? ` from ${minimumLeaves}` : " greater than 0"
                          } up to ${availableLeaves}.`
                        : " "
                    }
                    onChange={(event) =>
                      setLeaves(event.target.value.replace(/[^\d]/gu, ""))
                    }
                    placeholder="Enter leaves to issue"
                    size="small"
                    slotProps={{
                      htmlInput: {
                        inputMode: "numeric",
                        min: minimumLeaves,
                        max: availableLeaves,
                      },
                    }}
                    value={leaves}
                    sx={(fieldTheme) =>
                      getCompactFieldSx(
                        fieldTheme,
                        submitted && invalid ? "error" : "default",
                      )
                    }
                  />
                </Stack>

                <Stack spacing={0.75}>
                  <FieldLabel>Remark</FieldLabel>
                  <TextField
                    fullWidth
                    onChange={(event) => setRemark(event.target.value)}
                    placeholder="Enter drying remark"
                    size="small"
                    value={remark}
                    sx={(fieldTheme) => getCompactFieldSx(fieldTheme, "default")}
                  />
                </Stack>
              </Box>
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
          {mode === "edit" ? "Update" : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
