import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
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
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  DialogFieldLabel,
  getFactoryString,
  inspectionDialogPaperSx,
  isoDateToLocalDate,
  localDateToIso,
  ReadOnlyDialogField,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

function readLeafQuantity(row: FactoryRecord | null) {
  if (!row) return 0;
  const raw = row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets;
  const quantity = Number(raw);
  return Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
}

function readIsoDate(value: unknown) {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/u.test(value)) {
    return value.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
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
  onSave: (
    row: Row,
    entry: {
      passQty: number;
      failQty: number;
      inspectionDate: string;
      remark: string;
      attachment?: { name: string; dataUrl: string };
    },
  ) => void;
}) {
  const [passQty, setPassQty] = useState("");
  const [failQty, setFailQty] = useState("0");
  const [inspectionDate, setInspectionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [remark, setRemark] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentChanged, setAttachmentChanged] = useState(false);
  const leafQuantity = readLeafQuantity(row);

  useEffect(() => {
    if (!open || !row) return;
    const total = readLeafQuantity(row);
    const storedPass = Number(getFactoryString(row.passQty));
    const initialPass =
      Number.isInteger(storedPass) && storedPass >= 0 && storedPass <= total
        ? storedPass
        : total;
    setPassQty(total > 0 ? String(initialPass) : "");
    setFailQty(total > 0 ? String(Math.max(0, total - initialPass)) : "0");
    setInspectionDate(readIsoDate(row.inspectionDate ?? row.issueDate));
    setRemark(getFactoryString(row.remark));
    setAttachmentName(getFactoryString(row.inspectionImageName));
    setAttachmentPreview(getFactoryString(row.inspectionImage) || null);
    setAttachmentChanged(false);
  }, [open, row]);

  if (!row) return null;

  const handlePassChange = (value: string) => {
    setPassQty(value);
    if (leafQuantity <= 0) return;
    if (value === "") {
      setFailQty(String(leafQuantity));
      return;
    }
    const quantity = Number(value);
    if (Number.isNaN(quantity)) return;
    const clampedPass = Math.min(Math.max(0, quantity), leafQuantity);
    setFailQty(String(Math.max(0, leafQuantity - clampedPass)));
  };

  const handleFailChange = (value: string) => {
    setFailQty(value);
    if (leafQuantity <= 0) return;
    if (value === "") {
      setPassQty(String(leafQuantity));
      return;
    }
    const quantity = Number(value);
    if (Number.isNaN(quantity)) return;
    const clampedFail = Math.min(Math.max(0, quantity), leafQuantity);
    setPassQty(String(Math.max(0, leafQuantity - clampedFail)));
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);
    setAttachmentChanged(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setAttachmentPreview(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const currentPass = Number(passQty) || 0;
  const currentFail = Number(failQty) || 0;
  const exceedsTotal = leafQuantity > 0 && currentPass + currentFail > leafQuantity;
  const quantitiesInvalid =
    currentPass < 0 ||
    currentFail < 0 ||
    currentPass + currentFail <= 0 ||
    exceedsTotal;

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
            <ReadOnlyDialogField
              label="Available No of Leaves"
              value={String(leafQuantity || "-")}
            />
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
                  helperText={
                    exceedsTotal
                      ? `Pass + Fail cannot exceed available leaves (${leafQuantity})`
                      : ""
                  }
                  onChange={(event) => handlePassChange(event.target.value)}
                  placeholder="Enter pass count"
                  size="small"
                  type="number"
                  value={passQty}
                  sx={(theme) => getCompactFieldSx(theme, exceedsTotal ? "error" : "default")}
                />
              </Stack>
              <Stack spacing={0.75}>
                <DialogFieldLabel required>Fail Quantity (Leaves)</DialogFieldLabel>
                <TextField
                  error={exceedsTotal}
                  fullWidth
                  helperText={
                    exceedsTotal
                      ? `Pass + Fail cannot exceed available leaves (${leafQuantity})`
                      : ""
                  }
                  onChange={(event) => handleFailChange(event.target.value)}
                  placeholder="Enter fail count"
                  size="small"
                  type="number"
                  value={failQty}
                  sx={(theme) => getCompactFieldSx(theme, exceedsTotal ? "error" : "default")}
                />
              </Stack>
            </Box>
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
                    <input accept="image/*" hidden onChange={handleFileChange} type="file" />
                  </Button>
                  <Typography
                    variant="body2"
                    color={attachmentName ? "text.secondary" : "text.disabled"}
                  >
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
          disabled={quantitiesInvalid}
          onClick={() =>
            onSave(row, {
              passQty: currentPass,
              failQty: currentFail,
              inspectionDate,
              remark,
              ...(attachmentChanged && attachmentPreview
                ? { attachment: { name: attachmentName, dataUrl: attachmentPreview } }
                : {}),
            })
          }
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
}
