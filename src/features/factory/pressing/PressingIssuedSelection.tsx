import { useCallback, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { listingTableContainerSx } from "../../shared/listingTableStyles";
import {
  pressingCompactBodyCellSx,
  pressingCompactHeaderCellSx,
  pressingDetailsTableSx,
  pressingTableScrollSx,
} from "./pressingCompactTable";
import { formatFactorySearchValue } from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

const compactCheckboxCellSx = {
  width: 36,
  minWidth: 36,
  maxWidth: 36,
  px: 0.5,
  py: 0.25,
  lineHeight: 1,
  textAlign: "center" as const,
};

const compactCheckboxSx = {
  p: 0,
  m: 0,
  width: 20,
  height: 20,
  color: "text.secondary",
  "& .MuiSvgIcon-root": {
    fontSize: 16,
  },
  "&.Mui-checked": {
    color: "primary.main",
  },
  "&.MuiCheckbox-indeterminate": {
    color: "primary.main",
  },
};

export function PressingIssuedSelection<Row extends FactoryRecord>({
  columns,
  emptyLabel = "No issued pressing records are available.",
  errorText = "Select at least one item.",
  loading = false,
  onSelectedIdsChange,
  placeholder = "Search items...",
  rows,
  selectedIds,
  showError,
}: {
  columns: readonly EnterpriseTableColumn<Row>[];
  emptyLabel?: string;
  errorText?: string;
  loading?: boolean;
  onSelectedIdsChange: (ids: string[]) => void;
  placeholder?: string;
  rows: readonly Row[];
  selectedIds: readonly string[];
  showError: boolean;
}) {
  const [searchValue, setSearchValue] = useState("");
  const normalizedSearch = searchValue.trim().toLowerCase();

  const filteredRows = useMemo(() => {
    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      Object.values(row).some((value) =>
        formatFactorySearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [normalizedSearch, rows]);

  const allVisibleSelected =
    filteredRows.length > 0 &&
    filteredRows.every((row) => selectedIds.includes(String(row.id)));
  const someVisibleSelected =
    !allVisibleSelected &&
    filteredRows.some((row) => selectedIds.includes(String(row.id)));

  const handleToggleAll = useCallback(() => {
    const visibleIds = filteredRows.map((row) => String(row.id));
    if (allVisibleSelected) {
      onSelectedIdsChange(selectedIds.filter((id) => !visibleIds.includes(id)));
    } else {
      const nextIds = Array.from(new Set([...selectedIds, ...visibleIds]));
      onSelectedIdsChange(nextIds);
    }
  }, [allVisibleSelected, filteredRows, onSelectedIdsChange, selectedIds]);

  const handleToggleRow = useCallback(
    (rowId: string) => {
      if (selectedIds.includes(rowId)) {
        onSelectedIdsChange(selectedIds.filter((id) => id !== rowId));
      } else {
        onSelectedIdsChange([...selectedIds, rowId]);
      }
    },
    [onSelectedIdsChange, selectedIds],
  );

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Box sx={{ flex: "1 1 240px" }}>
          <ClearableSearchField
            onChange={setSearchValue}
            placeholder={placeholder}
            value={searchValue}
          />
        </Box>
        <Button
          disabled={selectedIds.length === 0}
          onClick={() => onSelectedIdsChange([])}
          sx={recordFormActionButtonSx}
          type="button"
          variant="outlined"
        >
          Clear selection ({selectedIds.length})
        </Button>
      </Box>

      <Box sx={(theme) => listingTableContainerSx(theme)}>
        <TableContainer sx={(theme) => pressingTableScrollSx(theme)}>
          <Table stickyHeader sx={pressingDetailsTableSx}>
            <TableHead>
              <TableRow>
                <TableCell
                  align="center"
                  sx={(theme: Theme) => ({
                    ...pressingCompactHeaderCellSx(theme, 36),
                    ...compactCheckboxCellSx,
                  })}
                >
                  <Checkbox
                    checked={allVisibleSelected}
                    indeterminate={someVisibleSelected}
                    inputProps={{ "aria-label": "Select all items" }}
                    onChange={handleToggleAll}
                    sx={(theme) => ({
                      ...compactCheckboxSx,
                      color: theme.customTokens.text.secondary,
                      "&.Mui-checked": {
                        color: theme.customTokens.brand.primary,
                      },
                      "&.MuiCheckbox-indeterminate": {
                        color: theme.customTokens.brand.primary,
                      },
                    })}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={(theme: Theme) => pressingCompactHeaderCellSx(theme)}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    sx={(theme) => ({
                      ...pressingCompactBodyCellSx(theme),
                      py: 3,
                      textAlign: "center",
                      color: theme.customTokens.text.secondary,
                    })}
                  >
                    Loading items...
                  </TableCell>
                </TableRow>
              ) : filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length + 1}
                    sx={(theme) => ({
                      ...pressingCompactBodyCellSx(theme),
                      py: 3,
                      textAlign: "center",
                      color: theme.customTokens.text.secondary,
                    })}
                  >
                    {normalizedSearch ? "No items match this search." : emptyLabel}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => {
                  const id = String(row.id);
                  const isSelected = selectedIds.includes(id);

                  return (
                    <TableRow
                      hover
                      key={id}
                      onClick={() => handleToggleRow(id)}
                      sx={(theme) => ({
                        cursor: "pointer",
                        "& td": {
                          backgroundColor: isSelected
                            ? theme.customTokens.surfaces.alt
                            : theme.customTokens.surfaces.surface,
                        },
                        "&:hover td": {
                          backgroundColor: theme.customTokens.surfaces.alt,
                        },
                      })}
                    >
                      <TableCell
                        align="center"
                        onClick={(event) => event.stopPropagation()}
                        sx={(theme: Theme) => ({
                          ...pressingCompactBodyCellSx(theme, 36),
                          ...compactCheckboxCellSx,
                        })}
                      >
                        <Checkbox
                          checked={isSelected}
                          onChange={() => handleToggleRow(id)}
                          sx={compactCheckboxSx}
                        />
                      </TableCell>
                      {columns.map((column) => {
                        if (column.renderCell) {
                          return (
                            <TableCell
                              key={column.key}
                              sx={(theme: Theme) => pressingCompactBodyCellSx(theme)}
                            >
                              {column.renderCell(row)}
                            </TableCell>
                          );
                        }

                        const cellValue = row[column.key];
                        const text =
                          cellValue === null || cellValue === undefined || cellValue === ""
                            ? "-"
                            : String(cellValue);

                        return (
                          <TableCell
                            key={column.key}
                            sx={(theme: Theme) => pressingCompactBodyCellSx(theme)}
                          >
                            {text}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {showError ? (
        <Typography
          sx={(theme) => ({
            color: theme.palette.error.main,
            fontSize: "0.8125rem",
            fontWeight: 500,
          })}
        >
          {errorText}
        </Typography>
      ) : null}
    </>
  );
}
