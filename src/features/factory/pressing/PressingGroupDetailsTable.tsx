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
import { pressingTableScrollSx } from "./pressingCompactTable";
import {
  getPressingAvailableQuantity,
  pressingText,
  sanitizePressingDecimal,
} from "./pressingQuantity";
import type { FactoryRecord } from "../shared/types";

export type PressingGroupDetailRow = {
  id: string;
  selectedRecordId: string;
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
  { key: "groupNo", label: "Group No", minWidth: 160 },
  { key: "itemName", label: "Item Name", minWidth: 130 },
  { key: "itemSubCategory", label: "Item Sub Category", minWidth: 130 },
  { key: "logNo", label: "Log No", minWidth: 100 },
  { key: "length", label: "Length", minWidth: 80 },
  { key: "width", label: "Width", minWidth: 80 },
  { key: "thickness", label: "Thickness", minWidth: 80 },
  { key: "noOfSheets", label: "No. of Sheets", minWidth: 100 },
  { key: "consume", label: "Consume", minWidth: 100 },
];

const searchableGroupSlotProps = {
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

const getGroupRecordLabel = (item: FactoryRecord) =>
  pressingText(item.groupNo) || pressingText(item.issueSrNo) || `Item #${item.id}`;

const emptyDraft = { consume: "", selectedRecordId: "" };

export function PressingGroupDetailsTable({
  availableRows,
  emptyMessage = "No groups added.",
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
  const [draft, setDraft] = useState(emptyDraft);
  const [draftError, setDraftError] = useState("");
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState(emptyDraft);
  const [editingError, setEditingError] = useState("");
  const savedRows = rows.filter((row) => row.selectedRecordId);

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

  const inputSx = {
    width: "100%",
    minWidth: 72,
    backgroundColor: theme.customTokens.surfaces.surface,
    "& .MuiInputBase-root": { height: 32, fontSize: "12px" },
    "& .MuiInputBase-input": { py: "4px", px: "8px", fontSize: "12px" },
  };

  const optionsFor = (currentId = "") =>
    availableRows.filter((row) => {
      const id = String(row.id);
      if (id === currentId) return true;
      return !savedRows.some((saved) => saved.selectedRecordId === id);
    });

  const validate = (
    values: typeof emptyDraft,
    record: FactoryRecord | undefined,
    ignoreRowId?: string,
  ) => {
    if (!values.selectedRecordId || !record) return "Select a group.";
    if (
      savedRows.some(
        (row) => row.id !== ignoreRowId && row.selectedRecordId === values.selectedRecordId,
      )
    ) {
      return "This group is already added.";
    }
    const consume = Number(values.consume);
    const available = getPressingAvailableQuantity(record);
    if (!values.consume.trim() || Number.isNaN(consume) || consume <= 0) {
      return "Enter a consume quantity greater than 0.";
    }
    if (consume > available) {
      return `Consume cannot exceed ${available} available sheets.`;
    }
    return "";
  };

  const handleAddItem = () => {
    const record = availableRows.find((row) => String(row.id) === draft.selectedRecordId);
    const error = validate(draft, record);
    if (error) {
      setDraftError(error);
      return;
    }

    onRowsChange([
      ...savedRows,
      {
        id: `grp-row-${Date.now()}`,
        selectedRecordId: draft.selectedRecordId,
        consume: draft.consume,
        isSaved: true,
      },
    ]);
    setDraft(emptyDraft);
    setDraftError("");
  };

  const handleSaveEdit = (rowId: string) => {
    const record = availableRows.find((row) => String(row.id) === editingDraft.selectedRecordId);
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
              selectedRecordId: editingDraft.selectedRecordId,
              consume: editingDraft.consume,
              isSaved: true,
            }
          : row,
      ),
    );
    setEditingRowId(null);
    setEditingError("");
  };

  const draftRecord = optionsFor().find((row) => String(row.id) === draft.selectedRecordId);

  const renderRecordCells = (record: FactoryRecord | undefined) => (
    <>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.itemName) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>
        {record
          ? pressingText(record.itemSubCategory) || pressingText(record.subCategory) || "-"
          : "-"}
      </TableCell>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.logNo) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.length) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.width) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>{record ? pressingText(record.thickness) || "-" : "-"}</TableCell>
      <TableCell sx={bodyCellSx}>
        {record ? getPressingAvailableQuantity(record) : "-"}
      </TableCell>
    </>
  );

  return (
    <Stack spacing={2}>
      <Stack sx={(currentTheme) => ({ ...formSectionCardSx(currentTheme), gap: 1.5 })}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Group Details</Typography>
        {availableRows.length === 0 ? (
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
            <Table size="small" sx={{ width: "100%", minWidth: 1050 }}>
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
                    <Autocomplete
                      autoHighlight
                      getOptionLabel={getGroupRecordLabel}
                      isOptionEqualToValue={(option, value) => String(option.id) === String(value.id)}
                      onChange={(_event, value) => {
                        const availableQty = value ? getPressingAvailableQuantity(value) : 0;
                        setDraft({
                          selectedRecordId: value ? String(value.id) : "",
                          consume: availableQty > 0 ? String(availableQty) : "",
                        });
                        setDraftError("");
                      }}
                      openOnFocus
                      options={optionsFor()}
                      renderInput={(params) => (
                        <TextField {...params} error={Boolean(draftError)} placeholder="Search group" size="small" />
                      )}
                      size="small"
                      slotProps={searchableGroupSlotProps}
                      sx={{ minWidth: 160 }}
                      value={draftRecord ?? null}
                    />
                  </TableCell>
                  {renderRecordCells(draftRecord)}
                  <TableCell sx={bodyCellSx}>
                    <TextField
                      error={Boolean(draftError)}
                      onChange={(event) => {
                        setDraft((current) => ({
                          ...current,
                          consume: sanitizePressingDecimal(event.target.value),
                        }));
                        setDraftError("");
                      }}
                      placeholder="0"
                      size="small"
                      sx={inputSx}
                      value={draft.consume}
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
              {draftError || "Add at least one group."}
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
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>Added Groups</Typography>
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
              <Table size="small" sx={{ width: "100%", minWidth: 1120 }}>
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
                    const record = availableRows.find(
                      (item) =>
                        String(item.id) ===
                        (isEditing ? editingDraft.selectedRecordId : row.selectedRecordId),
                    );

                    return (
                      <TableRow key={row.id} hover>
                        <TableCell align="center" sx={bodyCellSx}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          {isEditing ? (
                            <Autocomplete
                              autoHighlight
                              getOptionLabel={getGroupRecordLabel}
                              isOptionEqualToValue={(option, value) =>
                                String(option.id) === String(value.id)
                              }
                              onChange={(_event, value) => {
                                const availableQty = value ? getPressingAvailableQuantity(value) : 0;
                                setEditingDraft({
                                  selectedRecordId: value ? String(value.id) : "",
                                  consume: availableQty > 0 ? String(availableQty) : editingDraft.consume,
                                });
                                setEditingError("");
                              }}
                              openOnFocus
                              options={optionsFor(editingDraft.selectedRecordId)}
                              renderInput={(params) => (
                                <TextField {...params} placeholder="Search group" size="small" />
                              )}
                              size="small"
                              slotProps={searchableGroupSlotProps}
                              sx={{ minWidth: 160 }}
                              value={record ?? null}
                            />
                          ) : (
                            record ? getGroupRecordLabel(record) : "-"
                          )}
                        </TableCell>
                        {renderRecordCells(record)}
                        <TableCell sx={bodyCellSx}>
                          {isEditing ? (
                            <TextField
                              onChange={(event) => {
                                setEditingDraft((current) => ({
                                  ...current,
                                  consume: sanitizePressingDecimal(event.target.value),
                                }));
                                setEditingError("");
                              }}
                              size="small"
                              sx={inputSx}
                              value={editingDraft.consume}
                            />
                          ) : (
                            row.consume || "-"
                          )}
                        </TableCell>
                        <TableCell align="center" sx={bodyCellSx}>
                          <Stack direction="row" justifyContent="center" spacing={0.5}>
                            <IconButton
                              aria-label={isEditing ? "Save group" : "Edit group"}
                              onClick={() => {
                                if (isEditing) {
                                  handleSaveEdit(row.id);
                                  return;
                                }
                                setEditingRowId(row.id);
                                setEditingDraft({
                                  selectedRecordId: row.selectedRecordId,
                                  consume: row.consume,
                                });
                                setEditingError("");
                              }}
                              size="small"
                            >
                              {isEditing ? <Save size={16} /> : <Pencil size={16} />}
                            </IconButton>
                            <IconButton
                              aria-label="Delete group"
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
