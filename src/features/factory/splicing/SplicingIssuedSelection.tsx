import { useCallback, useMemo, useRef, useState } from "react";
import { TextField, Typography } from "@mui/material";

import {
  EnterpriseDataTable,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { formatFactorySearchValue } from "../shared/listing/factoryListingParts";
import {
  getSplicingConsumedQtyError,
  readSplicingAvailableLeaves,
} from "./splicingConsumedSheets";
import type { FactoryRecord } from "../shared/types";

export function SplicingIssuedSelection<Row extends FactoryRecord>({
  columns,
  consumedQty,
  onConsumedQtyChange,
  onSelectionChange,
  rows,
  selectedRowIds,
  showConsumedErrors,
  showError,
}: {
  columns: readonly EnterpriseTableColumn<Row>[];
  consumedQty: Readonly<Record<string, string>>;
  onConsumedQtyChange: (rowId: string, value: string) => void;
  onSelectionChange: (rows: Row[]) => void;
  rows: readonly Row[];
  selectedRowIds: ReadonlySet<string>;
  showConsumedErrors: boolean;
  showError: boolean;
}) {
  const [searchValue, setSearchValue] = useState("");
  const selectedIdsRef = useRef<Set<string>>(new Set());
  const displayRows = useMemo(
    () =>
      rows.map(
        (row) =>
          ({
            ...row,
            availableNoOfLeaves: String(readSplicingAvailableLeaves(row)),
          }) as Row,
      ),
    [rows],
  );
  const normalizedSearch = searchValue.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearch) {
      return displayRows;
    }

    return displayRows.filter((row) =>
      Object.values(row).some((value) =>
        formatFactorySearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [displayRows, normalizedSearch]);
  const tableColumns = useMemo(() => {
    const nextColumns: EnterpriseTableColumn<Row>[] = [];

    columns.forEach((column) => {
      if (column.key !== "noOfLeaves") {
        nextColumns.push(column);
        return;
      }

      nextColumns.push({
        key: "availableNoOfLeaves",
        label: "Available No of Leaves",
      });
      nextColumns.push({
        filterable: false,
        key: "consumedQty",
        label: "Consumed Qty",
        renderCell: (row) => {
          const available = readSplicingAvailableLeaves(row);
          const consumed = consumedQty[String(row.id)] ?? "";
          const error =
            showConsumedErrors && selectedRowIds.has(String(row.id))
              ? getSplicingConsumedQtyError(available, consumed)
              : "";

          return (
            <TextField
              error={Boolean(error)}
              helperText={error || undefined}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              onChange={(event) =>
                onConsumedQtyChange(
                  String(row.id),
                  event.target.value.replace(/\D/g, ""),
                )
              }
              size="small"
              slotProps={{
                htmlInput: {
                  inputMode: "numeric",
                  pattern: "[0-9]*",
                },
              }}
              sx={(theme) => ({
                ...getCompactFieldSx(theme, error ? "error" : "default"),
                width: 88,
              })}
              value={consumed}
            />
          );
        },
      });
    });

    return nextColumns;
  }, [columns, consumedQty, onConsumedQtyChange, selectedRowIds, showConsumedErrors]);

  const handleSelectionChange = useCallback(
    (visibleSelected: Row[]) => {
      const visibleIds = new Set(filteredRows.map((row) => String(row.id)));
      const nextIds = new Set(selectedIdsRef.current);

      visibleIds.forEach((id) => {
        nextIds.delete(id);
      });
      visibleSelected.forEach((row) => {
        nextIds.add(String(row.id));
      });
      selectedIdsRef.current = nextIds;
      onSelectionChange(displayRows.filter((row) => nextIds.has(String(row.id))));
    },
    [displayRows, filteredRows, onSelectionChange],
  );

  return (
    <>
      <ClearableSearchField
        onChange={setSearchValue}
        placeholder="Search..."
        value={searchValue}
      />
      <EnterpriseDataTable
        columns={tableColumns}
        emptyStateLabel={
          normalizedSearch
            ? "No grouping done records match this search."
            : "No grouping done records are available."
        }
        onSelectionChange={handleSelectionChange}
        rows={filteredRows}
        selectable
      />
      {showError ? (
        <Typography
          sx={(theme) => ({
            color: theme.palette.error.main,
            fontSize: "0.8125rem",
            fontWeight: 500,
          })}
        >
          Select at least one grouping done item.
        </Typography>
      ) : null}
    </>
  );
}
