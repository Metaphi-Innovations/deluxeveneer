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
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  DialogFieldLabel,
  getFactoryString,
  inspectionDialogPaperSx,
  ReadOnlyDialogField,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

function readLeafQuantity(row: FactoryRecord | null) {
  if (!row) return 0;
  const raw = row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets;
  const quantity = Number(raw);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function isWholeQuantity(value: string) {
  if (value.trim() === "") return false;
  const quantity = Number(value);
  return Number.isInteger(quantity) && quantity >= 0;
}

export function EditDryingInspectionQtyDialog<Row extends FactoryRecord>({
  open,
  row,
  onClose,
  onSave,
}: {
  open: boolean;
  row: Row | null;
  onClose: () => void;
  onSave: (row: Row, quantities: { passQty: number; failQty: number }) => void;
}) {
  const [passQty, setPassQty] = useState("");
  const [failQty, setFailQty] = useState("");
  const leafQuantity = readLeafQuantity(row);

  useEffect(() => {
    if (!open || !row) return;
    const pass = getFactoryString(row.passQty);
    const fail = getFactoryString(row.failQty);
    setPassQty(pass === "-" ? "" : pass);
    setFailQty(fail === "-" ? "" : fail);
  }, [open, row]);

  if (!row) return null;

  const passValue = Number(passQty);
  const failValue = Number(failQty);
  const quantitiesAreWhole = isWholeQuantity(passQty) && isWholeQuantity(failQty);
  const exceedsLeafQuantity =
    quantitiesAreWhole && passValue + failValue > leafQuantity;
  const saveDisabled = !quantitiesAreWhole || exceedsLeafQuantity;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
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
        Edit Inspection
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Box sx={(theme) => formSectionCardSx(theme)}>
          <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
            <FormSectionHeader title="Leaf Quantities" />
            <ReadOnlyDialogField label="No of Leaves" value={String(leafQuantity)} />
            <Box
              sx={(theme) => ({
                display: "grid",
                gap: theme.spacing(2),
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
              })}
            >
              <Stack spacing={0.75}>
                <DialogFieldLabel required>Pass Qty (Leaves)</DialogFieldLabel>
                <TextField
                  error={exceedsLeafQuantity}
                  fullWidth
                  helperText={
                    exceedsLeafQuantity
                      ? `Pass and failed quantity together cannot exceed ${leafQuantity} leaves.`
                      : ""
                  }
                  onChange={(event) => setPassQty(event.target.value)}
                  placeholder="Enter pass quantity"
                  size="small"
                  type="number"
                  value={passQty}
                  sx={(theme) => getCompactFieldSx(theme, exceedsLeafQuantity ? "error" : "default")}
                />
              </Stack>
              <Stack spacing={0.75}>
                <DialogFieldLabel required>Failed Qty (Leaves)</DialogFieldLabel>
                <TextField
                  error={exceedsLeafQuantity}
                  fullWidth
                  helperText={
                    exceedsLeafQuantity
                      ? `Pass and failed quantity together cannot exceed ${leafQuantity} leaves.`
                      : ""
                  }
                  onChange={(event) => setFailQty(event.target.value)}
                  placeholder="Enter failed quantity"
                  size="small"
                  type="number"
                  value={failQty}
                  sx={(theme) => getCompactFieldSx(theme, exceedsLeafQuantity ? "error" : "default")}
                />
              </Stack>
            </Box>
          </Stack>
        </Box>
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
          disabled={saveDisabled}
          onClick={() => onSave(row, { passQty: passValue, failQty: failValue })}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
