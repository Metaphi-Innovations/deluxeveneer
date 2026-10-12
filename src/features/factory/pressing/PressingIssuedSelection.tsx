import { useCallback, useMemo, useState } from "react";
import { Box, Button, Typography } from "@mui/material";

import {
  EnterpriseDataTable,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { formatFactorySearchValue } from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export function PressingIssuedSelection<Row extends FactoryRecord>({
  columns,
  emptyLabel = "No issued pressing records are available.",
  errorText = "Select at least one issued pressing item.",
  loading = false,
  onSelectedIdsChange,
  placeholder = "Search issued pressing...",
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

  const handleSelectionChange = useCallback(
    (visibleSelected: Row[]) => {
      const visibleIds = new Set(filteredRows.map((row) => String(row.id)));
      const nextIds = selectedIds.filter((id) => !visibleIds.has(id));

      visibleSelected.forEach((row) => {
        nextIds.push(String(row.id));
      });

      const uniqueIds = [...new Set(nextIds)];
      if (
        uniqueIds.length === selectedIds.length &&
        uniqueIds.every((id, index) => id === selectedIds[index])
      ) {
        return;
      }

      onSelectedIdsChange(uniqueIds);
    },
    [filteredRows, onSelectedIdsChange, selectedIds],
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
          Clear selection
        </Button>
      </Box>
      <EnterpriseDataTable
        columns={columns}
        dense
        emptyStateLabel={
          normalizedSearch ? "No issued pressing records match this search." : emptyLabel
        }
        loading={loading}
        loadingLabel="Loading issued pressing records..."
        onSelectionChange={handleSelectionChange}
        preserveColumnOrder
        rows={filteredRows}
        selectable
        selectedRowIds={selectedIds}
      />
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
