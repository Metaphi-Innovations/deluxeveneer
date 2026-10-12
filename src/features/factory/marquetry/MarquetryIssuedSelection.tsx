import { useCallback, useMemo, useState } from "react";
import { Typography } from "@mui/material";

import {
  EnterpriseDataTable,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { formatFactorySearchValue } from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export function MarquetryIssuedSelection<Row extends FactoryRecord>({
  columns,
  onSelectedIdsChange,
  rows,
  selectedIds,
  showError,
}: {
  columns: readonly EnterpriseTableColumn<Row>[];
  onSelectedIdsChange: (ids: string[]) => void;
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
      <ClearableSearchField
        onChange={setSearchValue}
        placeholder="Search issued marquetry..."
        value={searchValue}
      />
      <EnterpriseDataTable
        columns={columns}
        emptyStateLabel={
          normalizedSearch
            ? "No issued marquetry records match this search."
            : "No issued marquetry records are available."
        }
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
          Select at least one issued marquetry item.
        </Typography>
      ) : null}
    </>
  );
}
