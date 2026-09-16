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

import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { transporterMasterOptions } from "../../masters/shared/masterDefinitions";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  markDispatchDone,
  type PackingRecord,
} from "../../packing/shared/packingStore";

const transportModeOptions = ["Road", "Air", "Rail", "Ship"] as const;

export function DispatchMarkDoneDialog({
  onClose,
  open,
  record,
}: {
  onClose: () => void;
  open: boolean;
  record: PackingRecord | null;
}) {
  const [dispatchDate, setDispatchDate] = useState<Date | null>(new Date());
  const [transporter, setTransporter] = useState(
    transporterMasterOptions[0] ?? "",
  );
  const [transportMode, setTransportMode] = useState<string>("Road");
  const [remark, setRemark] = useState("");

  useEffect(() => {
    if (!open || !record) {
      return;
    }

    setDispatchDate(new Date());
    setTransporter(
      record.dispatchTransporter || transporterMasterOptions[0] || "",
    );
    setTransportMode(record.dispatchTransportMode || "Road");
    setRemark("");
  }, [open, record]);

  if (!record) {
    return null;
  }

  const handleConfirm = () => {
    markDispatchDone(record.id, {
      dispatchDate,
      dispatchTransporter: transporter,
      dispatchTransportMode: transportMode,
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
        Dispatch Details
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: 2 }}>
        <Stack spacing={1.5}>
          <ReadOnlyRow label="Packing Ref" value={record.packingId} />
          <ReadOnlyRow label="Order" value={record.orderNo} />
          <ReadOnlyRow label="Item" value={record.orderItemNo} />
          <ReadOnlyRow label="Customer" value={record.customerName} />
          <ReadOnlyRow label="Packed Qty" value={record.noOfSheets} />

          <Stack spacing={0.5}>
            <FieldLabel>Dispatch Date</FieldLabel>
            <ErpDatePickerField
              onChange={setDispatchDate}
              size="dense"
              value={dispatchDate}
            />
          </Stack>

          <Stack spacing={0.5}>
            <FieldLabel>Transporter</FieldLabel>
            <ErpSelectField
              onChange={setTransporter}
              options={[...transporterMasterOptions]}
              size="dense"
              value={transporter}
            />
          </Stack>

          <Stack spacing={0.5}>
            <FieldLabel>Transport Mode</FieldLabel>
            <ErpSelectField
              onChange={setTransportMode}
              options={[...transportModeOptions]}
              size="dense"
              value={transportMode}
            />
          </Stack>

          <Stack spacing={0.5}>
            <FieldLabel>Remark</FieldLabel>
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
              Mark Dispatch Done
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

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
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
    </Stack>
  );
}
