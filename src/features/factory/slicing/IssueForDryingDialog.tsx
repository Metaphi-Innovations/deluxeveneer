import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";

import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { formSectionCardSx, FormSectionHeader } from "../../shared/formSectionStyles";
import {
  formatDialogMeasure,
  formatInspectionDialogDate,
  inspectionDialogPaperSx,
  ReadOnlyDialogField,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export function IssueForDryingDialog<Row extends FactoryRecord>({
  onClose,
  onConfirm,
  open,
  rows,
}: {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  rows: readonly Row[];
}) {
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
        Issue for Drying
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.secondary,
              fontSize: theme.typography.body2.fontSize,
            })}
          >
            Confirm issuing {rows.length} item
            {rows.length === 1 ? "" : "s"} for drying.
          </Typography>
          {rows.map((selectedRow, index) => {
            const detailFields = [
              { label: "Storage Sr No.", value: String(selectedRow.storageSrNo ?? selectedRow.id ?? "-") },
              { label: "Slicing Date", value: formatInspectionDialogDate(selectedRow.issueDate ?? selectedRow.processDate) },
              { label: "Item Name", value: String(selectedRow.itemName ?? "-") },
              { label: "Sub Category", value: String(selectedRow.subCategory ?? selectedRow.itemSubCategory ?? "-") },
              { label: "Log Code", value: String(selectedRow.logCode ?? selectedRow.logNo ?? "-") },
              { label: "Bundle Number", value: String(selectedRow.bundleNumber ?? "-") },
              { label: "Pallet No", value: String(selectedRow.palletNo ?? "-") },
              { label: "Length", value: formatDialogMeasure(selectedRow.length) },
              { label: "Width", value: formatDialogMeasure(selectedRow.width) },
              { label: "Thickness", value: formatDialogMeasure(selectedRow.thickness ?? selectedRow.height) },
              { label: "No of Leaves", value: String(selectedRow.noOfLeaves ?? selectedRow.noOfSheets ?? "-") },
              { label: "SQM", value: formatDialogMeasure(selectedRow.sqm ?? selectedRow.totalSqMeter) },
              { label: "SQF", value: formatDialogMeasure(selectedRow.sqf) },
            ];
            return (
              <Box key={selectedRow.id} sx={(theme) => formSectionCardSx(theme)}>
                <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
                  <FormSectionHeader
                    title={rows.length > 1 ? `Item Details ${index + 1}` : "Item Details"}
                  />
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
                    {detailFields.map((field) => (
                      <ReadOnlyDialogField
                        key={field.label}
                        label={field.label}
                        value={field.value}
                      />
                    ))}
                    <Box sx={{ gridColumn: "1 / -1" }}>
                      <ReadOnlyDialogField
                        label="Remark"
                        value={String(selectedRow.remark ?? "-")}
                      />
                    </Box>
                  </Box>
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
        <Button onClick={onConfirm} sx={recordFormActionButtonSx} variant="contained">
          Issue for Drying
        </Button>
      </DialogActions>
    </Dialog>
  );
}
