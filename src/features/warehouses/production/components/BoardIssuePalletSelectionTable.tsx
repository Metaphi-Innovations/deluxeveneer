import {
  Autocomplete,
  Box,
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

import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../../components/shared/listingTableStyles";
import { pressingTableScrollSx } from "../../../factory/pressing/pressingCompactTable";
import { formSectionCardSx } from "../../../shared/formSectionStyles";
import type { BoardIssueEligibleInventoryItem } from "../api/productionWarehouseApi";

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
  { key: "availableSheets", label: "Available Sheets", minWidth: 110 },
  { key: "issueSheets", label: "Issue Sheets", minWidth: 110 },
  { key: "sqm", label: "SQM", minWidth: 90 },
  { key: "issueSqm", label: "Issue SQM", minWidth: 100 },
  { key: "sqf", label: "SQF", minWidth: 90 },
  { key: "issueSqf", label: "Issue SQF", minWidth: 100 },
];

export function BoardIssuePalletSelectionTable({
  warehouseName,
  materialLabel,
  pallets,
  palletsLoading,
  selectedPallet,
  issueSheetsInput,
  issueSqm,
  issueSqf,
  showErrors = false,
  selectionError = "",
  emptyMessage = "No item",
  onRefreshPallets,
  onSelectPallet,
  onIssueSheetsChange,
}: {
  warehouseName: string;
  materialLabel: string;
  pallets: BoardIssueEligibleInventoryItem[];
  palletsLoading: boolean;
  selectedPallet: BoardIssueEligibleInventoryItem | null;
  issueSheetsInput: string;
  issueSqm: string;
  issueSqf: string;
  showErrors?: boolean;
  selectionError?: string;
  emptyMessage?: string;
  onRefreshPallets?: () => void;
  onSelectPallet: (pallet: BoardIssueEligibleInventoryItem | null) => void;
  onIssueSheetsChange: (value: string) => void;
}) {
  const theme = useTheme();
  const showFieldError = Boolean(showErrors && selectionError);

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

  return (
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
          <Table size="small" sx={{ width: "100%", minWidth: 1400 }}>
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
                  1
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
                      onSelectPallet(value);
                    }}
                    onOpen={() => {
                      onRefreshPallets?.();
                    }}
                    openOnFocus
                    options={pallets}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={showFieldError && !selectedPallet}
                        placeholder="Search pallet no."
                        size="small"
                      />
                    )}
                    size="small"
                    slotProps={{
                      ...searchablePalletSlotProps,
                      popper: {
                        sx: { zIndex: 1400 },
                      },
                    }}
                    sx={{ minWidth: 200 }}
                    value={selectedPallet}
                  />
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet?.storageSrNo ??
                    selectedPallet?.productionSrNo ??
                    "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet?.itemName ?? "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet?.length ?? "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet?.width ?? "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet?.thickness ?? "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet ? selectedPallet.availableSheets : "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  <TextField
                    disabled={!selectedPallet}
                    error={showFieldError}
                    onChange={(event) => {
                      onIssueSheetsChange(
                        event.target.value.replace(/\D/g, ""),
                      );
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
                    value={issueSheetsInput}
                  />
                </TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet ? selectedPallet.availableSqm : "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>{issueSqm || "—"}</TableCell>
                <TableCell sx={bodyCellSx}>
                  {selectedPallet ? selectedPallet.availableSqf : "—"}
                </TableCell>
                <TableCell sx={bodyCellSx}>{issueSqf || "—"}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
      {showFieldError && selectionError ? (
        <Typography
          sx={{
            color: theme.palette.error.main,
            fontSize: "0.8125rem",
            fontWeight: 500,
          }}
        >
          {selectionError}
        </Typography>
      ) : null}
    </Stack>
  );
}
