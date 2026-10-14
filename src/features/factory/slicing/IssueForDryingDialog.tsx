import { useEffect, useMemo, useState } from "react";
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

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  DialogFieldLabel,
  inspectionDialogPaperSx,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export type IssueForDryingEntry<Row extends FactoryRecord> = {
  leaves: number;
  remark: string;
  row: Row;
};

function availableLeafCount(row: FactoryRecord) {
  const value = Number(
    row.availableLeaves ??
      row.receivedLeaves ??
      row.noOfLeaves ??
      row.noOfSheets ??
      0,
  );
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

export function IssueForDryingDialog<Row extends FactoryRecord>({
  onClose,
  onConfirm,
  open,
  rows,
}: {
  onClose: () => void;
  onConfirm: (entries: readonly IssueForDryingEntry<Row>[]) => void;
  open: boolean;
  rows: readonly Row[];
}) {
  const [values, setValues] = useState<
    Record<string, { leaves: string; remark: string }>
  >({});

  useEffect(() => {
    if (!open) return;
    setValues(
      Object.fromEntries(
        rows.map((row) => [
          String(row.id),
          {
            leaves: String(availableLeafCount(row) || ""),
            remark: "",
          },
        ]),
      ),
    );
  }, [open, rows]);

  const entries = useMemo(
    () =>
      rows.map((row) => ({
        available: availableLeafCount(row),
        leaves: Number(values[String(row.id)]?.leaves ?? 0),
        remark: values[String(row.id)]?.remark?.trim() ?? "",
        row,
      })),
    [rows, values],
  );
  const hasInvalidQuantity = entries.some(
    ({ available, leaves }) =>
      !Number.isInteger(leaves) || leaves <= 0 || leaves > available,
  );

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
        Issue for Drying
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack spacing={2}>
          {entries.map(({ available, leaves, row }, index) => {
            const rowId = String(row.id);
            const current = values[rowId] ?? { leaves: "", remark: "" };
            const invalid =
              !Number.isInteger(leaves) || leaves <= 0 || leaves > available;

            return (
              <Box key={rowId} sx={(theme) => formSectionCardSx(theme)}>
                <Stack spacing={1.5}>
                  {entries.length > 1 ? (
                    <Typography color="text.secondary" variant="caption">
                      Selected item {index + 1}
                    </Typography>
                  ) : null}
                  <Box
                    sx={(theme) => ({
                      display: "grid",
                      gap: theme.spacing(1.5),
                      gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                    })}
                  >
                    <Stack spacing={0.75}>
                      <DialogFieldLabel>Available No of Leaves</DialogFieldLabel>
                      <TextField
                        fullWidth
                        onFocus={(event) => event.target.blur()}
                        size="small"
                        slotProps={{
                          htmlInput: { readOnly: true, tabIndex: -1 },
                        }}
                        sx={(theme) => [
                          getCompactFieldSx(theme),
                          {
                            "& .MuiInputBase-root, & .MuiInputBase-input": {
                              cursor: "default",
                              caretColor: "transparent",
                            },
                          },
                        ]}
                        value={available}
                      />
                    </Stack>
                    <Stack spacing={0.75}>
                      <DialogFieldLabel required>No. of Leaves to Issue</DialogFieldLabel>
                      <TextField
                        error={invalid}
                        fullWidth
                        helperText={
                          available <= 0
                            ? "No leaves are available to issue."
                            : invalid
                              ? `Enter a whole number from 1 to ${available}.`
                              : ""
                        }
                        inputProps={{ min: 1, max: available, step: 1 }}
                        onChange={(event) =>
                          setValues((currentValues) => ({
                            ...currentValues,
                            [rowId]: {
                              ...(currentValues[rowId] ?? current),
                              leaves: event.target.value,
                            },
                          }))
                        }
                        size="small"
                        sx={(theme) =>
                          getCompactFieldSx(theme, invalid ? "error" : "default")
                        }
                        type="number"
                        value={current.leaves}
                      />
                    </Stack>
                  </Box>
                  <Stack spacing={0.75}>
                    <DialogFieldLabel>Remark</DialogFieldLabel>
                    <TextField
                      fullWidth
                      minRows={2}
                      multiline
                      onChange={(event) =>
                        setValues((currentValues) => ({
                          ...currentValues,
                          [rowId]: {
                            ...(currentValues[rowId] ?? current),
                            remark: event.target.value,
                          },
                        }))
                      }
                      placeholder="Enter remark"
                      size="small"
                      sx={(theme) => getCompactFieldSx(theme)}
                      value={current.remark}
                    />
                  </Stack>
                </Stack>
              </Box>
            );
          })}
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
        <Button
          disabled={rows.length === 0 || hasInvalidQuantity}
          onClick={() =>
            onConfirm(
              entries.map(({ leaves, remark, row }) => ({ leaves, remark, row })),
            )
          }
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Issue for Drying
        </Button>
      </DialogActions>
    </Dialog>
  );
}
