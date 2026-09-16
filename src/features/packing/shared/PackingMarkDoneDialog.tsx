import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { ErpDatePickerField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  markPackingDone,
  type PackingRecord,
} from "./packingStore";

export function PackingMarkDoneDialog({
  onClose,
  open,
  record,
}: {
  onClose: () => void;
  open: boolean;
  record: PackingRecord | null;
}) {
  const [packingDate, setPackingDate] = useState<Date | null>(new Date());
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    setPackingDate(new Date());
    setRemark("");
  }, [open, record]);

  if (!record) {
    return null;
  }

  const handleConfirm = () => {
    markPackingDone(record.id, {
      packingDate,
      remark,
    });
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontWeight: 600,
          fontSize: "1rem",
          py: 1.5,
          px: 2,
        })}
      >
        Packing Details
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: 2 }}>
        <Stack spacing={1.5}>
          <ReadOnlyRow label="Order" value={record.orderNo} />
          <ReadOnlyRow label="Item" value={record.orderItemNo} />
          <ReadOnlyRow label="Customer" value={record.customerName} />
          <ReadOnlyRow label="Product" value={record.itemName} />
          <ReadOnlyRow label="Available Qty" value={record.noOfSheets} />
          <ReadOnlyRow
            label="Pack Qty"
            value={record.noOfSheets}
            hint="Full quantity (partial packing is not enabled)."
          />

          <Stack spacing={0.5}>
            <FieldLabel>Packing Date</FieldLabel>
            <ErpDatePickerField
              onChange={setPackingDate}
              size="dense"
              value={packingDate}
            />
          </Stack>

          <Stack spacing={0.5}>
            <FieldLabel>Packing Remark</FieldLabel>
            <TextField
              fullWidth
              multiline
              minRows={2}
              placeholder="Optional"
              size="small"
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              sx={(theme) => getCompactFieldSx(theme)}
            />
          </Stack>

          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 1,
              pt: 0.5,
            }}
          >
            <Button
              onClick={onClose}
              sx={recordFormActionButtonSx}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              disableElevation
              onClick={handleConfirm}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              Mark Packing Done
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ children }: { children: string }) {
  return (
    <Typography
      sx={(theme) => ({
        color: theme.customTokens.text.secondary,
        fontSize: "0.6875rem",
        fontWeight: 600,
      })}
    >
      {children}
    </Typography>
  );
}

function ReadOnlyRow({
  hint,
  label,
  value,
}: {
  hint?: string;
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.25}>
      <FieldLabel>{label}</FieldLabel>
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.primary,
          fontSize: "0.8125rem",
          fontWeight: 600,
        })}
      >
        {value || "—"}
      </Typography>
      {hint ? (
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.text.secondary,
            fontSize: "0.6875rem",
          })}
        >
          {hint}
        </Typography>
      ) : null}
    </Stack>
  );
}
