import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AlertTriangle } from "lucide-react";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { parseNumericValue } from "../../shared/numberFormat";
import { DialogFieldLabel } from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export type PressingIssueEntry = {
  issueDate: string;
  issueSheets: number;
  issueSqf: number;
  issueSqm: number;
  remark: string;
};

function quantity(value: unknown) {
  const parsed = parseNumericValue(value);
  return parsed !== null && parsed > 0 ? parsed : 0;
}

export function getPressingIssueBalances(row: FactoryRecord | null) {
  const receivedSheets = quantity(
    row?.receivedSheets ?? row?.outputNoOfSheets ?? row?.noOfSheets,
  );
  const availableSheets = quantity(row?.availableSheets ?? receivedSheets);
  const receivedSqm = quantity(row?.receivedSqm ?? row?.sqm);
  const receivedSqf = quantity(row?.receivedSqf ?? row?.sqf);
  const ratio = receivedSheets > 0 ? availableSheets / receivedSheets : 0;

  return {
    availableSheets,
    availableSqf: quantity(row?.availableSqf) || receivedSqf * ratio,
    availableSqm: quantity(row?.availableSqm) || receivedSqm * ratio,
    receivedSheets,
    receivedSqf,
    receivedSqm,
  };
}

export function PressingIssueDialog<Row extends FactoryRecord>({
  destination,
  onClose,
  onSubmit,
  open,
  row,
}: {
  destination: string;
  onClose: () => void;
  onSubmit: (row: Row, entry: PressingIssueEntry) => void;
  open: boolean;
  row: Row | null;
}) {
  const [issueSheets, setIssueSheets] = useState("");
  const [remark, setRemark] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const balances = useMemo(() => getPressingIssueBalances(row), [row]);
  const numericSheets = Number(issueSheets);
  const issueRatio =
    balances.availableSheets > 0 && Number.isFinite(numericSheets)
      ? numericSheets / balances.availableSheets
      : 0;
  const issueSqm = balances.availableSqm * issueRatio;
  const issueSqf = balances.availableSqf * issueRatio;
  const sheetError = submitted
    ? !Number.isInteger(numericSheets) || numericSheets <= 0
      ? "Enter sheets greater than 0."
      : numericSheets > balances.availableSheets
        ? `Sheets to issue cannot exceed ${balances.availableSheets}.`
        : ""
    : "";

  useEffect(() => {
    if (!open || !row) return;
    setIssueSheets("");
    setRemark("");
    setSubmitted(false);
  }, [open, row]);

  if (!row) return null;

  const handleSubmit = () => {
    setSubmitted(true);
    if (
      !Number.isInteger(numericSheets) ||
      numericSheets <= 0 ||
      numericSheets > balances.availableSheets
    ) {
      return;
    }

    onSubmit(row, {
      issueDate: new Date().toISOString().slice(0, 10),
      issueSheets: numericSheets,
      issueSqf,
      issueSqm,
      remark: remark.trim(),
    });
  };

  return (
    <Dialog
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.sm}px`,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.22)",
            outline: "none",
            width: "min(420px, calc(100vw - 32px))",
            "&:focus, &:focus-visible": { outline: "none" },
          }),
        },
      }}
    >
      <DialogContent
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(2.5),
          px: theme.spacing(3),
          py: theme.spacing(3),
        })}
      >
        <Stack alignItems="center" spacing={1.25} sx={{ textAlign: "center" }}>
          <Box
            sx={(theme) => ({
              alignItems: "center",
              backgroundColor: theme.customTokens.brand.primaryScale[100],
              borderRadius: "50%",
              color: theme.customTokens.brand.primary,
              display: "flex",
              height: 48,
              justifyContent: "center",
              width: 48,
            })}
          >
            <AlertTriangle size={22} />
          </Box>
          <Typography color="text.primary" variant="h3">
            Issue to {destination}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Enter the number of sheets to issue and confirm this action.
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns:
              destination === "Packing"
                ? { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }
                : "1fr",
          }}
        >
          {destination === "Packing" ? (
            <Stack spacing={0.75}>
              <DialogFieldLabel>Available Sheets</DialogFieldLabel>
              <TextField
                disabled
                fullWidth
                size="small"
                value={balances.availableSheets}
                sx={(theme) => getCompactFieldSx(theme)}
              />
            </Stack>
          ) : null}
          <Stack spacing={0.75}>
            <DialogFieldLabel required>Sheets to Issue</DialogFieldLabel>
            <TextField
              autoFocus
              error={Boolean(sheetError)}
              fullWidth
              helperText={sheetError || " "}
              onChange={(event) =>
                setIssueSheets(event.target.value.replace(/\D/gu, ""))
              }
              placeholder="Enter sheets"
              size="small"
              value={issueSheets}
              sx={(theme) =>
                getCompactFieldSx(theme, sheetError ? "error" : "default")
              }
            />
          </Stack>
          <Stack
            spacing={0.75}
            sx={{ gridColumn: destination === "Packing" ? "1 / -1" : "auto" }}
          >
            <DialogFieldLabel>Remark</DialogFieldLabel>
            <TextField
              fullWidth
              minRows={2}
              multiline
              onChange={(event) => setRemark(event.target.value)}
              placeholder="Enter remark"
              size="small"
              value={remark}
              sx={(theme) => getCompactFieldSx(theme)}
            />
          </Stack>
        </Box>

        <Box
          sx={(theme) => ({
            display: "flex",
            gap: theme.spacing(1.5),
            justifyContent: "center",
          })}
        >
          <Button
            onClick={onClose}
            sx={recordFormActionButtonSx}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            sx={recordFormActionButtonSx}
            variant="contained"
          >
            Issue to {destination}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
