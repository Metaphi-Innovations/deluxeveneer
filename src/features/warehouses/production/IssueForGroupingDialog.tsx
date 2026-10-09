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

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import type { RawVeneerRow } from "./types/productionWarehouseTypes";

function displayValue(value: unknown) {
  const text = String(value ?? "").trim();
  return text || "-";
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

function ReadOnlyDetailField({ label, value }: { label: string; value: unknown }) {
  return (
    <Stack spacing={0.75}>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        fullWidth
        value={displayValue(value)}
        slotProps={{ input: { readOnly: true } }}
        sx={(theme) => getCompactFieldSx(theme, "readOnly")}
      />
    </Stack>
  );
}

export function IssueForGroupingDialog({
  availableLeaves,
  onClose,
  onConfirm,
  open,
  row,
}: {
  availableLeaves: number;
  onClose: () => void;
  onConfirm: (issuedLeaves: number) => void;
  open: boolean;
  row: RawVeneerRow | null;
}) {
  const [leaves, setLeaves] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLeaves("");
    setSubmitted(false);
  }, [open, row]);

  const issuedLeaves = Number(leaves);
  const invalid =
    leaves.trim() === "" ||
    !Number.isInteger(issuedLeaves) ||
    issuedLeaves < 1 ||
    issuedLeaves > availableLeaves;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
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
        Issue for Grouping
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Box sx={(theme) => formSectionCardSx(theme)}>
          <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
            <FormSectionHeader title="Item Details" />
            <Box
              sx={(theme) => ({
                display: "grid",
                gap: theme.spacing(2),
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              })}
            >
              <ReadOnlyDetailField label="Storage Sr No" value={row?.storageSrNo} />
              <ReadOnlyDetailField label="Item Name" value={row?.itemName} />
              <ReadOnlyDetailField
                label="Available No of Leaves"
                value={availableLeaves || "-"}
              />
              <Stack spacing={0.75}>
                <FieldLabel>No of Leaves *</FieldLabel>
                <TextField
                  autoFocus
                  error={submitted && invalid}
                  fullWidth
                  helperText={
                    submitted && invalid
                      ? `Enter a whole number of leaves from 1 to ${availableLeaves}.`
                      : " "
                  }
                  placeholder="Enter leaves to issue"
                  size="small"
                  value={leaves}
                  onChange={(event) =>
                    setLeaves(event.target.value.replace(/[^\d]/g, ""))
                  }
                  sx={(theme) =>
                    getCompactFieldSx(theme, submitted && invalid ? "error" : "default")
                  }
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
          onClick={() => {
            setSubmitted(true);
            if (invalid) return;
            onConfirm(issuedLeaves);
          }}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Issue for Grouping
        </Button>
      </DialogActions>
    </Dialog>
  );
}
