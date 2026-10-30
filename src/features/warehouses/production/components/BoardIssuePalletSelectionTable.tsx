import { useMemo, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../../components/shared/listingTableStyles";
import { pressingTableScrollSx } from "../../../factory/pressing/pressingCompactTable";
import {
  formInlineActionButtonSx,
  formSectionCardSx,
} from "../../../shared/formSectionStyles";
import type { BoardIssueEligibleInventoryItem } from "../api/productionWarehouseApi";
import { previewBoardIssueLine } from "../utils/boardIssueSheetSplit";

const searchablePalletSlotProps = {
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

function getPalletRecordLabel(item: BoardIssueEligibleInventoryItem) {
  return [
    item.palletNo || "No pallet",
    item.storageSrNo || item.productionSrNo,
    item.itemName,
  ]
    .filter(Boolean)
    .join(" — ");
}

export type BoardIssuePalletLine = {
  id: string;
  inventoryId: string;
  issueSheets: string;
  issueSqm: string;
  issueSqf: string;
};

type Column = {
  key: string;
  label: string;
  minWidth: number;
  align?: "left" | "center" | "right";
};

const columns: readonly Column[] = [
  { key: "srNo", label: "Sr No.", minWidth: 48, align: "center" },
  { key: "warehouse", label: "Warehouse", minWidth: 150 },
  { key: "materialType", label: "Material Type", minWidth: 110 },
  { key: "palletNo", label: "Pallet No.", minWidth: 200 },
  { key: "storageRef", label: "Storage Ref.", minWidth: 120 },
  { key: "itemName", label: "Item Name", minWidth: 140 },
  { key: "length", label: "Length", minWidth: 80 },
  { key: "width", label: "Width", minWidth: 80 },
  { key: "thickness", label: "Thickness", minWidth: 80 },
  { key: "receivedSheets", label: "Received Sheets", minWidth: 110 },
  { key: "availableSheets", label: "Available Sheets", minWidth: 110 },
  { key: "issueSheets", label: "Issue Sheets", minWidth: 110 },
  { key: "receivedSqm", label: "Received SQM", minWidth: 100 },
  { key: "availableSqm", label: "Available SQM", minWidth: 100 },
  { key: "issueSqm", label: "Issue SQM", minWidth: 100 },
  { key: "receivedSqf", label: "Received SQF", minWidth: 100 },
  { key: "availableSqf", label: "Available SQF", minWidth: 100 },
  { key: "issueSqf", label: "Issue SQF", minWidth: 100 },
];

type Draft = {
  inventoryId: string;
  issueSheets: string;
  issueSqm: string;
  issueSqf: string;
};

const emptyDraft: Draft = {
  inventoryId: "",
  issueSheets: "",
  issueSqm: "",
  issueSqf: "",
};

export function BoardIssuePalletSelectionTable({
  warehouseName,
  materialLabel,
  pallets,
  palletsLoading,
  lines,
  onLinesChange,
  showErrors = false,
  selectionError = "",
  emptyMessage = "No item",
  onRefreshPallets,
}: {
  warehouseName: string;
  materialLabel: string;
  pallets: BoardIssueEligibleInventoryItem[];
  palletsLoading: boolean;
  lines: BoardIssuePalletLine[];
  onLinesChange: (next: BoardIssuePalletLine[]) => void;
  showErrors?: boolean;
  selectionError?: string;
  emptyMessage?: string;
  onRefreshPallets?: () => void;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [draftError, setDraftError] = useState("");

  const showFieldError = Boolean(showErrors && selectionError);

  const palletById = useMemo(() => {
    const map = new Map<string, BoardIssueEligibleInventoryItem>();
    for (const pallet of pallets) {
      map.set(String(pallet.id), pallet);
    }
    return map;
  }, [pallets]);

  const usedInventoryIds = useMemo(
    () => new Set(lines.map((line) => line.inventoryId)),
    [lines],
  );

  const optionsFor = (currentId = "") =>
    pallets.filter((row) => {
      const id = String(row.id);
      if (id === currentId) return true;
      return !usedInventoryIds.has(id);
    });

  const draftPallet = draft.inventoryId
    ? (palletById.get(draft.inventoryId) ?? null)
    : null;

  const applyDraftSheets = (
    pallet: BoardIssueEligibleInventoryItem | null,
    sheetsInput: string,
  ): Draft => {
    if (!pallet || sheetsInput.trim() === "") {
      return {
        inventoryId: pallet ? String(pallet.id) : "",
        issueSheets: sheetsInput,
        issueSqm: "",
        issueSqf: "",
      };
    }
    const sheets = Number(sheetsInput);
    if (!Number.isInteger(sheets) || sheets <= 0) {
      return {
        inventoryId: String(pallet.id),
        issueSheets: sheetsInput,
        issueSqm: "",
        issueSqf: "",
      };
    }
    const preview = previewBoardIssueLine(pallet, sheets);
    return {
      inventoryId: String(pallet.id),
      issueSheets: sheetsInput,
      issueSqm: String(preview.issuedSqm),
      issueSqf: String(preview.issuedSqf),
    };
  };

  const validateDraft = () => {
    if (!draft.inventoryId || !draftPallet) {
      return "Select a pallet with available stock.";
    }
    if (usedInventoryIds.has(draft.inventoryId)) {
      return "This pallet is already added.";
    }
    const sheets = Number(draft.issueSheets);
    if (draft.issueSheets.trim() === "" || Number.isNaN(sheets)) {
      return "Issue sheets is required.";
    }
    if (!Number.isInteger(sheets) || sheets <= 0) {
      return "Issue sheets must be a whole number greater than zero.";
    }
    if (sheets > draftPallet.availableSheets) {
      return `Issue sheets cannot exceed ${draftPallet.availableSheets} available sheets.`;
    }
    return "";
  };

  const handleAddItem = () => {
    const error = validateDraft();
    if (error) {
      setDraftError(error);
      return;
    }
    onLinesChange([
      ...lines,
      {
        id: `pallet-line-${Date.now()}`,
        inventoryId: draft.inventoryId,
        issueSheets: draft.issueSheets,
        issueSqm: draft.issueSqm,
        issueSqf: draft.issueSqf,
      },
    ]);
    setDraft(emptyDraft);
    setDraftError("");
  };

  const headerCellSx = (minWidth: number, align: Column["align"]) => ({
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

  const renderMeasureCells = (pallet: BoardIssueEligibleInventoryItem | null) => (
    <>
      <TableCell sx={bodyCellSx}>
        {pallet?.storageSrNo ?? pallet?.productionSrNo ?? "—"}
      </TableCell>
      <TableCell sx={bodyCellSx}>{pallet?.itemName ?? "—"}</TableCell>
      <TableCell sx={bodyCellSx}>{pallet?.length ?? "—"}</TableCell>
      <TableCell sx={bodyCellSx}>{pallet?.width ?? "—"}</TableCell>
      <TableCell sx={bodyCellSx}>{pallet?.thickness ?? "—"}</TableCell>
      <TableCell sx={bodyCellSx}>
        {pallet ? pallet.receivedSheets : "—"}
      </TableCell>
      <TableCell sx={bodyCellSx}>
        {pallet ? pallet.availableSheets : "—"}
      </TableCell>
    </>
  );

  return (
    <Stack spacing={2}>
      <Stack sx={(currentTheme) => ({ ...formSectionCardSx(currentTheme), gap: 1.5 })}>
        <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>
          Pallet Selection
        </Typography>
        {palletsLoading ? (
          <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
            Loading production stock...
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
            <Table size="small" sx={{ width: "100%", minWidth: 1680 }}>
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
                    {lines.length + 1}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{warehouseName}</TableCell>
                  <TableCell sx={bodyCellSx}>{materialLabel}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    <Autocomplete
                      autoHighlight
                      getOptionLabel={getPalletRecordLabel}
                      isOptionEqualToValue={(option, value) =>
                        String(option.id) === String(value.id)
                      }
                      loading={palletsLoading}
                      loadingText="Loading..."
                      noOptionsText={emptyMessage}
                      onChange={(_event, value) => {
                        if (!value) {
                          setDraft(emptyDraft);
                          setDraftError("");
                          return;
                        }
                        setDraft(
                          applyDraftSheets(
                            value,
                            value.availableSheets > 0
                              ? String(value.availableSheets)
                              : "",
                          ),
                        );
                        setDraftError("");
                      }}
                      onOpen={() => {
                        onRefreshPallets?.();
                      }}
                      openOnFocus
                      options={optionsFor()}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          error={Boolean(draftError)}
                          placeholder="Search pallet no."
                          size="small"
                        />
                      )}
                      size="small"
                      slotProps={{
                        ...searchablePalletSlotProps,
                        popper: { sx: { zIndex: 1400 } },
                      }}
                      sx={{ minWidth: 200 }}
                      value={draftPallet}
                    />
                  </TableCell>
                  {renderMeasureCells(draftPallet)}
                  <TableCell sx={bodyCellSx}>
                    <TextField
                      disabled={!draftPallet}
                      error={Boolean(draftError)}
                      onChange={(event) => {
                        setDraft(
                          applyDraftSheets(
                            draftPallet,
                            event.target.value.replace(/\D/g, ""),
                          ),
                        );
                        setDraftError("");
                      }}
                      placeholder="0"
                      size="small"
                      slotProps={{
                        htmlInput: {
                          inputMode: "numeric",
                          pattern: "[0-9]*",
                        },
                      }}
                      sx={inputSx}
                      value={draft.issueSheets}
                    />
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {draftPallet ? draftPallet.receivedSqm : "—"}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {draftPallet ? draftPallet.availableSqm : "—"}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{draft.issueSqm || "—"}</TableCell>
                  <TableCell sx={bodyCellSx}>
                    {draftPallet ? draftPallet.receivedSqf : "—"}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>
                    {draftPallet ? draftPallet.availableSqf : "—"}
                  </TableCell>
                  <TableCell sx={bodyCellSx}>{draft.issueSqf || "—"}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          {draftError || (showFieldError && lines.length === 0) ? (
            <Typography
              sx={{
                color: theme.palette.error.main,
                flex: "1 1 220px",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              {draftError || selectionError || "Add at least one pallet."}
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

      {lines.length > 0 ? (
        <Stack sx={(currentTheme) => ({ ...formSectionCardSx(currentTheme), gap: 1.5 })}>
          <Typography sx={{ fontSize: "0.9375rem", fontWeight: 700 }}>
            Added Pallets
          </Typography>
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
            }}
          >
            <Box sx={pressingTableScrollSx(theme)}>
              <Table size="small" sx={{ width: "100%", minWidth: 1680 }}>
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
                    <TableCell align="center" sx={headerCellSx(72, "center")}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.map((line, index) => {
                    const pallet = palletById.get(line.inventoryId) ?? null;
                    return (
                      <TableRow key={line.id} hover>
                        <TableCell align="center" sx={bodyCellSx}>
                          {index + 1}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{warehouseName}</TableCell>
                        <TableCell sx={bodyCellSx}>{materialLabel}</TableCell>
                        <TableCell sx={bodyCellSx}>
                          {pallet ? getPalletRecordLabel(pallet) : "—"}
                        </TableCell>
                        {renderMeasureCells(pallet)}
                        <TableCell sx={bodyCellSx}>{line.issueSheets}</TableCell>
                        <TableCell sx={bodyCellSx}>
                          {pallet ? pallet.receivedSqm : "—"}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          {pallet ? pallet.availableSqm : "—"}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{line.issueSqm || "—"}</TableCell>
                        <TableCell sx={bodyCellSx}>
                          {pallet ? pallet.receivedSqf : "—"}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>
                          {pallet ? pallet.availableSqf : "—"}
                        </TableCell>
                        <TableCell sx={bodyCellSx}>{line.issueSqf || "—"}</TableCell>
                        <TableCell align="center" sx={bodyCellSx}>
                          <IconButton
                            aria-label="Remove pallet line"
                            onClick={() => {
                              onLinesChange(
                                lines.filter((row) => row.id !== line.id),
                              );
                            }}
                            size="small"
                          >
                            <Trash2 size={16} />
                          </IconButton>
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
