import { useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  IconButton,
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
import { Pencil, Plus, Save, Trash2 } from "lucide-react";

import {
  formInlineActionButtonSx,
  formSectionCardSx,
} from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../components/shared/listingTableStyles";
import { formatSQM, parseNumericValue } from "../../shared/numberFormat";
import { pressingTableScrollSx } from "./pressingCompactTable";
import {
  calculatePressingUsedArea,
  getPressingAvailableQuantity,
  pressingText,
  sanitizePressingDecimal,
} from "./pressingQuantity";
import type { FactoryRecord } from "../shared/types";
import type { PressingBaseMaterialType } from "./usePressingBaseStock";

export type PressingBaseDetailRow = {
  id: string;
  baseType: PressingBaseMaterialType;
  selectedRecordId: string;
  consumeSheets: string;
  consumeSqm: string;
  isSaved?: boolean;
};

type BaseColumn = {
  key: string;
  label: string;
  minWidth: number;
  align?: "left" | "center" | "right";
};

const columns: readonly BaseColumn[] = [
  { key: "srNo", label: "Sr No.", minWidth: 48, align: "center" },
  { key: "warehouse", label: "Warehouse", minWidth: 150 },
  { key: "baseType", label: "Base Type", minWidth: 110 },
  { key: "palletNo", label: "Pallet No.", minWidth: 180 },
  { key: "length", label: "Length", minWidth: 80 },
  { key: "width", label: "Width", minWidth: 80 },
  { key: "thickness", label: "Thickness", minWidth: 80 },
  { key: "noOfSheets", label: "No. of Sheets", minWidth: 100 },
  { key: "consumeSheets", label: "Consume Sheets", minWidth: 120 },
  { key: "sqm", label: "SQM", minWidth: 90 },
  { key: "consumeSqm", label: "Consume SQM", minWidth: 120 },
];

const searchableRecordSlotProps = {
  paper: {
    sx: {
      maxWidth: "calc(100vw - 32px)",
      "& .MuiAutocomplete-option": {
        fontSize: "0.8125rem",
        minHeight: 36,
        whiteSpace: "normal",
        wordBreak: "break-word",
      },
    },
  },
  listbox: {
    sx: {
      maxHeight: 224,
      overflowY: "auto",
    },
  },
} as const;

const getBaseRecordLabel = (item: FactoryRecord) =>
  pressingText(item.palletNo) ||
  pressingText(item.palletNumber) ||
  pressingText(item.storageSrNo) ||
  pressingText(item.inwardSrNo) ||
  (item.lotNo
    ? `${pressingText(item.lotNo)} (${pressingText(item.itemSubCategory) || pressingText(item.subCategory) || pressingText(item.itemName)})`
    : pressingText(item.itemName) || `Stock #${item.id}`);

type Draft = { consumeSheets: string; consumeSqm: string; selectedRecordId: string };

const emptyDraft: Draft = { consumeSheets: "", consumeSqm: "", selectedRecordId: "" };

export function PressingBaseDetailsTable({
  availableRows,
  currentBaseType,
  emptyMessage = "No base material added.",
  onRowsChange,
  rows,
  showErrors = false,
}: {
  availableRows: readonly FactoryRecord[];
  currentBaseType: PressingBaseMaterialType;
  emptyMessage?: string;
  onRowsChange: (nextRows: PressingBaseDetailRow[]) => void;
  rows: PressingBaseDetailRow[];
  showErrors?: boolean;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftError, setDraftError] = useState("");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<Draft>(emptyDraft);
  const [editingError, setEditingError] = useState("");
  const savedRows = rows.filter((row) => row.selectedRecordId);
  const baseType = currentBaseType || "Plywood";
  const productionPalletRows = availableRows.filter((row) => {
    const warehouseType = pressingText(row.warehouseType).trim().toLowerCase();
    const palletNo = pressingText(row.palletNo) || pressingText(row.palletNumber);
    return warehouseType === "production" && Boolean(palletNo);
  });

  const headerCellSx = (minWidth: number, align: BaseColumn["align"]) => ({
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

  const inputSx = {
    width: "100%",
    minWidth: 72,
    backgroundColor: theme.customTokens.surfaces.surface,
    "& .MuiInputBase-root": { height: 32, fontSize: "12px" },
    "& .MuiInputBase-input": { py: "4px", px: "8px", fontSize: "12px" },
  };

  const optionsFor = (currentId = "") =>
    productionPalletRows.filter((row) => {
      const id = String(row.id);
      if (id === currentId) return true;
      return !savedRows.some((saved) => saved.selectedRecordId === id);
    });

  const applySheets = (record: FactoryRecord | undefined, sheets: string): Draft => ({
    selectedRecordId: record ? String(record.id) : "",
    consumeSheets: sheets,
    consumeSqm: record
      ? calculatePressingUsedArea(record.length, record.width, sheets).sqm
      : "",
  });

  const validate = (values: Draft, record: FactoryRecord | undefined, ignoreRowId?: string) => {
    if (!values.selectedRecordId || !record) return "Select a base material.";
    if (
      savedRows.some(
        (row) => row.id !== ignoreRowId && row.selectedRecordId === values.selectedRecordId,
      )
    ) {
      return "This base material is already added.";
    }
    const sheets = Number(values.consumeSheets);
    const available = getPressingAvailableQuantity(record);
    if (!values.consumeSheets.trim() || Number.isNaN(sheets) || sheets <= 0) {
      return "Enter consume sheets greater than 0.";
    }
    if (sheets > available) {
      return `Consume sheets cannot exceed ${available} available sheets.`;
    }
    return "";
  };

  const totalSqmFor = (record: FactoryRecord | undefined) => {
    if (!record) return "-";
    const availableQty = getPressingAvailableQuantity(record);
    const length = parseNumericValue(record.length) ?? 0;
    const width = parseNumericValue(record.width) ?? 0;
    if (length > 0 && width > 0 && availableQty > 0) {
      return formatSQM((length * width * availableQty) / 1_000_000);
    }
    return pressingText(record.sqm) || "-";
  };

  const handleAddItem = () => {
    const record = productionPalletRows.find((row) => String(row.id) === draft.selectedRecordId);
    const error = validate(draft, record);
    if (error) {
      setDraftError(error);
      return;
    }

    onRowsChange([
      ...savedRows,
      {
        id: `base-row-${Date.now()}`,
        baseType,
        selectedRecordId: draft.selectedRecordId,
        consumeSheets: draft.consumeSheets,
        consumeSqm: draft.consumeSqm,
        isSaved: true,
      },
    ]);
    setDraft(emptyDraft);
    setDraftError("");
  };

  const handleSaveEdit = (rowId: string) => {
    const record = productionPalletRows.find(
      (row) => String(row.id) === editingDraft.selectedRecordId,
    );
    const error = validate(editingDraft, record, rowId);
    if (error) {
      setEditingError(error);
      return;
    }

    onRowsChange(
      savedRows.map((row) =>
        row.id === rowId
          ? {
              ...row,
              baseType,
              selectedRecordId: editingDraft.selectedRecordId,
              consumeSheets: editingDraft.consumeSheets,
              consumeSqm: editingDraft.consumeSqm,
              isSaved: true,
            }
          : row,
      ),
    );
    setEditingRowId(null);
    setEditingError("");
  };

  const draftRecord = optionsFor().find((row) => String(row.id) === draft.selectedRecordId);

  const renderMeasureCells = (record: FactoryRecord | undefined) => (
    <>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.length) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.width) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.thickness) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>{record ? getPressingAvailableQuantity(record) : "-"}</TableCell>
    </>
  );

  return (
    <Stack spacing={2}>
      <Stack sx={(currentTheme) => ({ ...formSectionCardSx(currentTheme), gap: 1.5 })}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Base Selection</Typography>
        {productionPalletRows.length === 0 ? (
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>{emptyMessage}</Typography>
        ) : null}
        <Box
          sx={{
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            overflow: "hidden",
            backgroundColor: theme.customTokens.surfaces.surface,
          }}
        >
          <Box sx={pressingTableScrollSx(theme)}>
            <Table size="small" sx={{ width: "100%", minWidth: 1100 }}>
              <TableHead>
                <TableRow>
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      align={column.align ?? "left"}
                      sx={headerCellSx(column.minWidth, column.align)}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell align="center" sx={bodyCellSx}>
                    {savedRows.length + 1}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {draftRecord ? pressingText(draftRecord.warehouseName) || "Production Warehouse" : "Production Warehouse"}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{baseType}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Autocomplete
                      autoHighlight
                      getOptionLabel={getBaseRecordLabel}
                      isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                      onChange={(_event, value) => {
                        if (!value) {
                          setDraft(emptyDraft);
                          setDraftError("");
                          return;
                        }
                        const availableQty = getPressingAvailableQuantity(value);
                        setDraft(applySheets(value, availableQty > 0 ? String(availableQty) : ""));
                        setDraftError("");
                      }}
                      openOnFocus
                      options={optionsFor()}
                      renderInput={(params) => (
                        <TextField {...params} error={Boolean(draftError)} placeholder="Search pallet no." size="small" />
                      )}
                      size="small"
                      slotProps={searchableRecordSlotProps}
                      sx={{ minWidth: 180 }}
                      value={draftRecord ?? null}
                    />
                  </TableCell>
                  {renderMeasureCells(draftRecord)}
                  <TableCell sx={bodyCellSx}>
                    <TextField
                      error={Boolean(draftError)}
                      onChange={(event) => {
                        const sheets = sanitizePressingDecimal(event.target.value);
                        setDraft(applySheets(draftRecord, sheets));
                        setDraftError("");
                      }}
                      placeholder="0"
                      size="small"
                      sx={inputSx}
                      value={draft.consumeSheets}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{draftRecord ? totalSqmFor(draftRecord) : "-"}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <TextField
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          consumeSqm: sanitizePressingDecimal(event.target.value),
                        }));
                        setDraftError("");
                      }}
                      placeholder="0.000"
                      size="small"
                      sx={inputSx}
                      value={draft.consumeSqm}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5 }}>
          {draftError || (showErrors && savedRows.length === 0) ? (
            <Typography sx={{ color: "error.main", flex: "1 1 220px", fontSize: "0.8125rem", fontWeight: 500 }}>
              {draftError || "Add at least one base material."}
            </Typography>
          ) : (
            <span />
          )}
          <Button
            disableElevation
            onClick={handleAddItem}
            startIcon={<Plus size={15} />}
            sx={(currentTheme) => formInlineActionButtonSx(currentTheme)}
            variant="contained"
          >
            Add Item
          </Button>
        </Box>
      </Stack>

      {savedRows.length > 0 ? (
        <Stack sx={(currentTheme) => ({ ...formSectionCardSx(currentTheme), gap: 1.5 })}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Added Base</Typography>
          {editingError ? (
            <Typography sx={{ color: "error.main", fontSize: "0.8125rem", fontWeight: 500 }}>
              {editingError}
            </Typography>
          ) : null}
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
            }}
          >
            <Box sx={pressingTableScrollSx(theme)}>
              <Table size="small" sx={{ width: "100%", minWidth: 1200 }}>
                <TableHead>
                  <TableRow>
                    {columns.map((column) => (
                      <TableCell
                        key={column.key}
                        align={column.align ?? "left"}
                        sx={headerCellSx(column.minWidth, column.align)}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                    <TableCell align="center" sx={headerCellSx(90, "center")}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {savedRows.map((row, index) => {
                    const isEditing = editingRowId === row.id;
                    const activeId = isEditing ? editingDraft.selectedRecordId : row.selectedRecordId;
                    const record = productionPalletRows.find(
                      (item) => String(item.id) === activeId,
                    );

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell align="center" sx={bodyCellSx}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          {record ? pressingText(record.warehouseName) || "Production Warehouse" : "-"}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{row.baseType || baseType}</TableCell>
                        <TableCell sx={bodyCellSx}>
                          {isEditing ? (
                            <Autocomplete
                              autoHighlight
                              getOptionLabel={getBaseRecordLabel}
                              isOptionEqualToValue={(option, value) =>
                                String(option.id) === String(value.id)
                              }
                              onChange={(_event, value) => {
                                if (!value) {
                                  setEditingDraft(emptyDraft);
                                  return;
                                }
                                const availableQty = getPressingAvailableQuantity(value);
                                setEditingDraft(
                                  applySheets(value, availableQty > 0 ? String(availableQty) : ""),
                                );
                                setEditingError("");
                              }}
                              openOnFocus
                              options={optionsFor(editingDraft.selectedRecordId)}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Search pallet no." size="small" />
                              )}
                              size="small"
                              slotProps={searchableRecordSlotProps}
                              sx={{ minWidth: 180 }}
                              value={record ?? null}
                            />
                          ) : (
                            record ? getBaseRecordLabel(record) : "-"
                          )}
                        </TableCell>
                        {renderMeasureCells(record)}
                        <TableCell sx={bodyCellSx}>
                          {isEditing ? (
                            <TextField
                              onChange={(event) => {
                                setEditingDraft(
                                  applySheets(record, sanitizePressingDecimal(event.target.value)),
                                );
                                setEditingError("");
                              }}
                              size="small"
                              sx={inputSx}
                              value={editingDraft.consumeSheets}
                            />
                          ) : (
                            row.consumeSheets || "-"
                          )}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{totalSqmFor(record)}</TableCell>
                        <TableCell sx={bodyCellSx}>
                          {isEditing ? (
                            <TextField
                              onChange={(event) => {
                                setEditingDraft((current) => ({
                                  ...current,
                                  consumeSqm: sanitizePressingDecimal(event.target.value),
                                }));
                                setEditingError("");
                              }}
                              size="small"
                              sx={inputSx}
                              value={editingDraft.consumeSqm}
                            />
                          ) : (
                            row.consumeSqm || "-"
                          )}
                        </TableCell>
                        <TableCell align="center" sx={bodyCellSx}>
                          <Stack direction="row" justifyContent="center" spacing={0.5}>
                            <IconButton
                              aria-label={isEditing ? "Save base material" : "Edit base material"}
                              onClick={() => {
                                if (isEditing) {
                                  handleSaveEdit(row.id);
                                  return;
                                }
                                setEditingRowId(row.id);
                                setEditingDraft({
                                  selectedRecordId: row.selectedRecordId,
                                  consumeSheets: row.consumeSheets,
                                  consumeSqm: row.consumeSqm,
                                });
                                setEditingError("");
                              }}
                              size="small"
                            >
                              {isEditing ? <Save size={16} /> : <Pencil size={16} />}
                            </IconButton>
                            <IconButton
                              aria-label="Delete base material"
                              onClick={() => {
                                onRowsChange(savedRows.filter((item) => item.id !== row.id));
                                if (editingRowId === row.id) setEditingRowId(null);
                              }}
                              size="small"
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Stack>
      ) : null}
    </Stack>
  );
}
