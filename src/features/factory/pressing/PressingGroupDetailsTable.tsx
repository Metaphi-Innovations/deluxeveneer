import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Plus, Save, Trash2 } from "lucide-react";

import { getTableActionButtonSx } from "../../../components/shared/buttonStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../components/shared/listingTableStyles";
import { pressingTableScrollSx } from "./pressingCompactTable";
import {
  getPressingAvailableQuantity,
  pressingText,
  sanitizePressingDecimal,
} from "./pressingQuantity";
import type { FactoryRecord } from "../shared/types";

export type PressingGroupDetailRow = {
  id: string; // unique row id (e.g. g-1, g-2)
  selectedRecordId: string; // id of the FactoryRecord selected from issuedRows
  consume: string;
  isSaved?: boolean;
};

type GroupColumn = {
  key: string;
  label: string;
  minWidth: number;
  align?: "left" | "center" | "right";
};

const columns: readonly GroupColumn[] = [
  { key: "srNo", label: "Sr No.", minWidth: 48, align: "center" },
  { key: "groupNo", label: "Group No", minWidth: 140 },
  { key: "photoNo", label: "Photo No", minWidth: 100 },
  { key: "itemName", label: "Item Name", minWidth: 130 },
  { key: "itemSubCategory", label: "Item Sub Category", minWidth: 130 },
  { key: "logNo", label: "Log No", minWidth: 100 },
  { key: "length", label: "Length", minWidth: 80 },
  { key: "width", label: "Width", minWidth: 80 },
  { key: "thickness", label: "Thickness", minWidth: 80 },
  { key: "noOfSheets", label: "No. of Sheets", minWidth: 100 },
  { key: "consume", label: "Consume", minWidth: 100 },
  { key: "action", label: "Action", minWidth: 80, align: "center" },
];

export function PressingGroupDetailsTable({
  availableRows,
  emptyMessage = "No issued groups available.",
  onRowsChange,
  rows,
  showErrors = false,
}: {
  availableRows: readonly FactoryRecord[];
  emptyMessage?: string;
  onRowsChange: (nextRows: PressingGroupDetailRow[]) => void;
  rows: PressingGroupDetailRow[];
  showErrors?: boolean;
}) {
  const theme = useTheme();
  const [savedRowIds, setSavedRowIds] = useState<Set<string>>(new Set());

  // Styles matching other factory create pages (e.g. Splicing, Grouping)
  const headerCellSx = (minWidth: number, align: GroupColumn["align"]) => ({
    ...transactionTableHeaderCellSx(theme, minWidth, align ?? "left"),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    "&:last-child": { borderRight: "none" },
    fontSize: "12px",
  });

  const bodyCellSx = {
    ...transactionTableBodyCellSx(theme),
    fontSize: "12px",
    py: 0.75,
    px: 1,
    verticalAlign: "middle" as const,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    "&:last-child": { borderRight: "none" },
  };

  const selectSx = {
    fontSize: "12px",
    height: 32,
    minWidth: 130,
    backgroundColor: theme.customTokens.surfaces.surface,
    "& .MuiSelect-select": { py: "4px", px: "8px", fontSize: "12px" },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.customTokens.borders.default,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.customTokens.borders.hover,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.customTokens.borders.focus,
    },
  };

  const inputSx = {
    width: 90,
    backgroundColor: theme.customTokens.surfaces.surface,
    "& .MuiInputBase-root": { height: 32, fontSize: "12px" },
    "& .MuiInputBase-input": {
      py: "4px",
      px: "8px",
      fontSize: "12px",
      textAlign: "right" as const,
    },
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.customTokens.borders.default,
    },
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.customTokens.borders.hover,
    },
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: theme.customTokens.borders.focus,
    },
  };

  const handleAddNewItem = () => {
    const newRowId = `grp-row-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    onRowsChange([
      ...rows,
      { id: newRowId, selectedRecordId: "", consume: "" },
    ]);
  };

  const handleRemoveRow = (rowId: string) => {
    onRowsChange(rows.filter((r) => r.id !== rowId));
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  };

  const handleSelectRecord = (rowId: string, recordId: string) => {
    const record = availableRows.find((r) => String(r.id) === recordId);
    const availableQty = record ? getPressingAvailableQuantity(record) : 0;
    onRowsChange(
      rows.map((r) =>
        r.id === rowId
          ? { ...r, selectedRecordId: recordId, consume: availableQty > 0 ? String(availableQty) : r.consume }
          : r,
      ),
    );
  };

  const handleConsumeChange = (rowId: string, value: string) => {
    const sanitized = sanitizePressingDecimal(value);
    onRowsChange(rows.map((r) => (r.id === rowId ? { ...r, consume: sanitized } : r)));
  };

  const handleToggleSave = (rowId: string) => {
    setSavedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  };

  return (
    <Stack sx={{ gap: 1 }}>
      <Typography
        component="h3"
        sx={(t) => ({
          color: t.customTokens.neutrals[900],
          fontSize: "0.875rem",
          fontWeight: 600,
          letterSpacing: "0.01em",
          lineHeight: 1.25,
        })}
      >
        Group Details
      </Typography>
      <Box
        sx={{
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          overflow: "hidden",
          backgroundColor: theme.customTokens.surfaces.surface,
        }}
      >
        <Box sx={pressingTableScrollSx(theme)}>
          <Table size="small" sx={{ width: "100%", minWidth: 1050, tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key} align={col.align ?? "left"} sx={headerCellSx(col.minWidth, col.align)}>
                    {col.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow hover>
                  <TableCell align="center" sx={bodyCellSx}>1</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Select
                      size="small"
                      value=""
                      onChange={(e) => {
                        const newRowId = `grp-row-${Date.now()}`;
                        const record = availableRows.find((r) => String(r.id) === e.target.value);
                        const availableQty = record ? getPressingAvailableQuantity(record) : 0;
                        onRowsChange([
                          {
                            id: newRowId,
                            selectedRecordId: e.target.value,
                            consume: availableQty > 0 ? String(availableQty) : "",
                          },
                        ]);
                      }}
                      displayEmpty
                      sx={selectSx}
                    >
                      <MenuItem value="" disabled>Select Group</MenuItem>
                      {availableRows.map((item) => (
                        <MenuItem key={item.id} value={String(item.id)}>
                          {pressingText(item.groupNo) || pressingText(item.issueSrNo) || `Item #${item.id}`}
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>-</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <TextField
                      size="small"
                      value=""
                      disabled
                      sx={inputSx}
                      placeholder="0"
                    />
                  </TableCell>
                  <TableCell align="center" sx={bodyCellSx}>-</TableCell>
                </TableRow>
              ) : (
                rows.map((row, index) => {
                  const record = availableRows.find((r) => String(r.id) === row.selectedRecordId);
                  const availableQty = record ? getPressingAvailableQuantity(record) : 0;
                  const isSaved = savedRowIds.has(row.id);
                  const consumeNum = Number(row.consume);
                  const hasError =
                    showErrors &&
                    (!row.selectedRecordId || !row.consume.trim() || consumeNum <= 0 || consumeNum > availableQty);

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        backgroundColor: hasError
                          ? theme.customTokens.semanticScale?.error?.[50] ?? "rgba(173,101,90,0.06)"
                          : "inherit",
                      }}
                    >
                      <TableCell align="center" sx={bodyCellSx}>{index + 1}</TableCell>

                      <TableCell sx={bodyCellSx}>
                        <Select
                          size="small"
                          value={row.selectedRecordId}
                          onChange={(e) => handleSelectRecord(row.id, e.target.value)}
                          displayEmpty
                          disabled={isSaved}
                          sx={selectSx}
                        >
                          <MenuItem value="" disabled>Select Group</MenuItem>
                          {availableRows.map((item) => (
                            <MenuItem key={item.id} value={String(item.id)}>
                              {pressingText(item.groupNo) || pressingText(item.issueSrNo) || `Item #${item.id}`}
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>

                      <TableCell sx={bodyCellSx}>{record ? pressingText(record.photoNo) || "-" : "-"}</TableCell>
                      <TableCell sx={bodyCellSx}>{record ? pressingText(record.itemName) || "-" : "-"}</TableCell>
                      <TableCell sx={bodyCellSx}>
                        {record ? pressingText(record.itemSubCategory) || pressingText(record.subCategory) || "-" : "-"}
                      </TableCell>
                      <TableCell sx={bodyCellSx}>{record ? pressingText(record.logNo) || "-" : "-"}</TableCell>
                      <TableCell sx={bodyCellSx}>{record ? pressingText(record.length) || "-" : "-"}</TableCell>
                      <TableCell sx={bodyCellSx}>{record ? pressingText(record.width) || "-" : "-"}</TableCell>
                      <TableCell sx={bodyCellSx}>{record ? pressingText(record.thickness) || "-" : "-"}</TableCell>
                      <TableCell sx={bodyCellSx}>{record ? availableQty : "-"}</TableCell>

                      <TableCell sx={bodyCellSx}>
                        <TextField
                          size="small"
                          value={row.consume}
                          disabled={isSaved}
                          error={hasError}
                          onChange={(e) => handleConsumeChange(row.id, e.target.value)}
                          sx={inputSx}
                          placeholder="0"
                        />
                      </TableCell>

                      <TableCell align="center" sx={bodyCellSx}>
                        <Stack direction="row" spacing={0.5} justifyContent="center" alignItems="center">
                          <IconButton
                            size="small"
                            onClick={() => handleToggleSave(row.id)}
                            title={isSaved ? "Edit item" : "Save item"}
                            sx={{
                              p: 0.5,
                              color: isSaved ? theme.palette.success.main : theme.customTokens.neutrals[700],
                              "&:hover": {
                                color: theme.customTokens.brand.primary,
                                backgroundColor: theme.customTokens.navigation.hoverBackground,
                              },
                            }}
                          >
                            <Save size={15} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveRow(row.id)}
                            title="Delete item"
                            sx={{
                              p: 0.5,
                              color: theme.palette.error.main,
                              "&:hover": {
                                color: theme.palette.error.dark,
                                backgroundColor: "rgba(173,101,90,0.08)",
                              },
                            }}
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.5 }}>
        <Button
          variant="contained"
          size="small"
          onClick={handleAddNewItem}
          startIcon={<Plus size={15} />}
          sx={getTableActionButtonSx(theme)}
        >
          Add New Item
        </Button>
      </Box>
    </Stack>
  );
}
