import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  getDialogBodyCellSx,
  getDialogHeaderCellSx,
  getDialogScrollableTableSx,
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

function formatDimensionNumber(val: unknown): string {
  if (val === null || val === undefined || val === "") return "-";
  const num = Number(val);
  if (!Number.isFinite(num)) return String(val);
  return Number(num.toFixed(3)).toString();
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
      maxWidth="lg"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            ...inspectionDialogPaperSx(theme),
            maxWidth: { xs: "96%", sm: 900, md: 1040 },
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2.5),
          py: theme.spacing(1.5),
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        })}
      >
        <Typography
          sx={(theme) => ({
            fontSize: theme.typography.h3.fontSize,
            fontWeight: 700,
            color: theme.customTokens.text.primary,
          })}
        >
          Issue for Drying
        </Typography>
        <Chip
          label={`${entries.length} item${entries.length === 1 ? "" : "s"} selected`}
          size="small"
          sx={(theme) => ({
            height: 24,
            fontWeight: 600,
            fontSize: "11px",
            color: theme.customTokens.brand.primary,
            backgroundColor: theme.customTokens.surfaces.alt,
            borderColor: theme.customTokens.borders.default,
            borderWidth: "1px",
            borderStyle: "solid",
          })}
        />
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2.5),
          py: `${theme.spacing(2)} !important`,
          overflowY: "auto",
        })}
      >
        <Stack spacing={2}>
          {(
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: "8px",
                backgroundColor: theme.customTokens.surfaces.surface,
                overflow: "hidden",
              })}
            >
              <Box sx={(theme) => getDialogScrollableTableSx(theme)}>
                <Table size="small" sx={{ minWidth: 900, tableLayout: "fixed" }}>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={(theme) => ({
                          ...getDialogHeaderCellSx(theme),
                          width: 300,
                        })}
                      >
                        Item Details
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...getDialogHeaderCellSx(theme),
                          width: 140,
                        })}
                      >
                        Available Leaves
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...getDialogHeaderCellSx(theme),
                          width: 180,
                        })}
                      >
                        Leaves to Issue
                      </TableCell>
                      <TableCell
                        sx={(theme) => ({
                          ...getDialogHeaderCellSx(theme),
                          width: 280,
                          borderRight: 0,
                        })}
                      >
                        Remark
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map(({ available, leaves, row }, index) => {
                      const rowId = String(row.id);
                      const current = values[rowId] ?? {
                        leaves: "",
                        remark: "",
                      };
                      const invalid =
                        !Number.isInteger(leaves) ||
                        leaves <= 0 ||
                        leaves > available;
                      const storageSrNo = String(
                        row.storageSrNo ?? row.itemCode ?? `Item #${index + 1}`,
                      );
                      const logNo = String(
                        row.logNo ?? row.logCode ?? row.batchNo ?? "",
                      );
                      const bundleNo = String(
                        row.bundleNumber ?? row.bundleNo ?? "",
                      );
                      const palletNo = String(row.palletNo ?? "");
                      const dimensions = row.length
                        ? `${formatDimensionNumber(row.length)} × ${formatDimensionNumber(row.width)}${
                            row.thickness !== undefined && row.thickness !== null
                              ? ` × ${formatDimensionNumber(row.thickness)}`
                              : ""
                          }`
                        : "";
                      const supportingDetails = [
                        logNo ? `Log: ${logNo}` : "",
                        bundleNo ? `Bundle: ${bundleNo}` : "",
                        palletNo ? `Pallet: ${palletNo}` : "",
                        dimensions ? `Dim: ${dimensions}` : "",
                      ].filter(Boolean);

                      return (
                        <TableRow key={rowId}>
                          <TableCell
                            sx={(theme) => ({
                              ...getDialogBodyCellSx(theme),
                              whiteSpace: "normal",
                            })}
                          >
                            <Typography sx={{ fontSize: "13px", fontWeight: 600 }}>
                              {index + 1}. {storageSrNo}
                            </Typography>
                            {supportingDetails.length > 0 ? (
                              <Typography
                                sx={(theme) => ({
                                  color: theme.customTokens.text.secondary,
                                  fontSize: "11px",
                                  mt: 0.25,
                                })}
                              >
                                {supportingDetails.join(" · ")}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell sx={getDialogBodyCellSx}>
                            {available}
                          </TableCell>
                          <TableCell sx={getDialogBodyCellSx}>
                            <TextField
                              error={invalid}
                              fullWidth
                              helperText={
                                available <= 0
                                  ? "No leaves available."
                                  : invalid
                                    ? `Enter 1 to ${available}.`
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
                                getCompactFieldSx(
                                  theme,
                                  invalid ? "error" : "default",
                                )
                              }
                              type="number"
                              value={current.leaves}
                            />
                          </TableCell>
                          <TableCell
                            sx={(theme) => ({
                              ...getDialogBodyCellSx(theme),
                              borderRight: 0,
                            })}
                          >
                            <TextField
                              fullWidth
                              onChange={(event) =>
                                setValues((currentValues) => ({
                                  ...currentValues,
                                  [rowId]: {
                                    ...(currentValues[rowId] ?? current),
                                    remark: event.target.value,
                                  },
                                }))
                              }
                              placeholder="Enter remark (optional)"
                              size="small"
                              sx={(theme) => getCompactFieldSx(theme)}
                              value={current.remark}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          gap: theme.spacing(1),
          px: theme.spacing(2.5),
          py: theme.spacing(1.5),
          backgroundColor: theme.customTokens.surfaces.surface,
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
