import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, CircleX, Eye, FileOutput, Pencil, Plus } from "lucide-react";
import { Button, Stack } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableCellValue,
} from "../../../components/data-display/EnterpriseDataTable";
import { getInventoryPaths } from "../../inventory/shared";
import {
  getListingToolbarButtonSx,
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "../../shared/columnFilters";
import {
  warehouseAInventoryConfigs,
  warehouseInvoiceListingColumns,
  type WarehouseAInventorySlug,
  type WarehouseInventoryRow,
} from "../shared/warehouseTableData";
import {
  getWarehouseAInwardRows,
  subscribeWarehouseAInwardUpdates,
} from "../shared/warehouseAInwardStore";
import {
  markWarehouseQcFail,
  resolveWarehouseQcRows,
  subscribeWarehouseQcStatusUpdates,
} from "../shared/warehouseQcStore";
import {
  addReturnToQuery,
  formatInventorySearchValue,
  mergeWarehouseARows,
} from "./warehouseAInventory";

export function WarehouseAStockTable({
  activeInventory,
  canCreate,
  canEdit,
  canView,
  onQcPass,
  warehouseRootPath,
}: {
  activeInventory: WarehouseAInventorySlug;
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  onQcPass: (row: WarehouseInventoryRow) => void;
  warehouseRootPath: string;
}) {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const [qcStatusRevision, setQcStatusRevision] = useState(0);
  const [inwardRevision, setInwardRevision] = useState(0);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const activeConfig = warehouseAInventoryConfigs[activeInventory];
  const activeInventoryListPath = `${warehouseRootPath}?inventory=${activeInventory}`;

  const resolvedRows = useMemo(() => {
    const inwardRows = getWarehouseAInwardRows(activeInventory);
    const mergedRows = mergeWarehouseARows(activeConfig.rows, inwardRows);

    return resolveWarehouseQcRows(mergedRows).filter(
      (row) => row.qcStatus !== "pass",
    );
  }, [activeConfig.rows, activeInventory, inwardRevision, qcStatusRevision]);

  useEffect(
    () =>
      subscribeWarehouseQcStatusUpdates(() =>
        setQcStatusRevision((current) => current + 1),
      ),
    [],
  );

  useEffect(
    () =>
      subscribeWarehouseAInwardUpdates(() =>
        setInwardRevision((current) => current + 1),
      ),
    [],
  );

  const filteredRows = useMemo(() => {
    let result = resolvedRows;

    for (const [columnKey, filter] of Object.entries(columnFilters)) {
      if (!isActiveColumnFilter(filter) || filter.values.length === 0) continue;
      const lowerValues = new Set(filter.values.map((value) => value.toLowerCase().trim()));
      result = result.filter((row) => {
        const cellValue = formatInventorySearchValue(
          (row as unknown as Record<string, EnterpriseTableCellValue>)[columnKey],
        );
        return lowerValues.has(cellValue.trim());
      });
    }

    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return result;
    }

    return result.filter((row) =>
      Object.values(row).some((value) =>
        formatInventorySearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [columnFilters, resolvedRows, searchValue]);

  const handleColumnFilterOpen = (columnKey: string) => {
    const distinctSet = new Set<string>();
    resolvedRows.forEach((row) => {
      const val = formatInventorySearchValue(
        (row as unknown as Record<string, EnterpriseTableCellValue>)[columnKey],
      ).trim();
      if (val) distinctSet.add(val);
    });
    const options = Array.from(distinctSet)
      .sort()
      .map((val) => ({ value: val, label: val }));
    setFilterOptionsByColumn((prev) => ({
      ...prev,
      [columnKey]: options,
    }));
  };

  const getRowActions = useMemo(
    () => (_row: WarehouseInventoryRow) => {
      const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [
        ...(canView
          ? [
              {
                id: "view",
                label: "View",
                icon: Eye,
                onSelect: (selectedRow: WarehouseInventoryRow) =>
                  navigate(
                    addReturnToQuery(
                      getInventoryPaths(
                        selectedRow.inventorySlug,
                        "issued",
                        "warehouse-a",
                      ).view(selectedRow.inventoryRecordId),
                      activeInventoryListPath,
                    ),
                  ),
              },
            ]
          : []),
        ...(canEdit
          ? [
              {
                id: "edit",
                label: "Edit",
                icon: Pencil,
                onSelect: (selectedRow: WarehouseInventoryRow) =>
                  navigate(
                    addReturnToQuery(
                      getInventoryPaths(
                        selectedRow.inventorySlug,
                        "issued",
                        "warehouse-a",
                      ).edit(selectedRow.inventoryRecordId),
                      activeInventoryListPath,
                    ),
                  ),
              },
            ]
          : []),
      ];

      if (canEdit) {
        actions.push({
          id: "qc-pass",
          label: "QC Pass",
          icon: BadgeCheck,
          onSelect: (selectedRow) => {
            onQcPass(selectedRow);
          },
        });

        actions.push({
          id: "qc-fail",
          label: "QC Fail",
          icon: CircleX,
          tone: "danger",
          onSelect: (selectedRow) => {
            markWarehouseQcFail(selectedRow);
            setQcStatusRevision((current) => current + 1);
          },
        });
      }

      return actions;
    },
    [activeInventoryListPath, canEdit, canView, navigate, onQcPass],
  );

  return (
    <>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        alignItems={{ xs: "stretch", lg: "center" }}
        justifyContent="space-between"
        spacing={2}
      >
        <ClearableSearchField
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search inventory..."
          sx={{
            width: { xs: "100%", sm: 300 },
            maxWidth: "100%",
          }}
        />

        <Stack
          direction="row"
          spacing={portalButtonGroupGap}
          useFlexGap
          sx={{
            alignItems: "center",
            justifyContent: "flex-end",
            flexWrap: "wrap",
          }}
        >
          {canCreate ? (
            <Button
              component={RouterLink}
              to={addReturnToQuery(
                getInventoryPaths(activeInventory, "issued", "warehouse-a").add,
                activeInventoryListPath,
              )}
              startIcon={<Plus size={15} />}
              variant="contained"
              sx={(theme) => getListingToolbarButtonSx(theme)}
            >
              Add Stock
            </Button>
          ) : null}

          <Button
            variant="outlined"
            startIcon={<FileOutput size={15} />}
            disabled={filteredRows.length === 0}
            onClick={() =>
              exportRowsToCsv(
                filteredRows,
                warehouseInvoiceListingColumns,
                `warehouse-a-${activeInventory}`,
              )
            }
            sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
          >
            Export
          </Button>
        </Stack>
      </Stack>

      <EnterpriseDataTable
        key={activeInventory}
        columns={warehouseInvoiceListingColumns}
        columnFilters={columnFilters}
        defaultRowsPerPage={10}
        filterOptionsByColumn={filterOptionsByColumn}
        getRowActions={getRowActions}
        initialSort={{ key: "inwardDate", direction: "desc" }}
        onColumnFilterOpen={handleColumnFilterOpen}
        onColumnFiltersChange={setColumnFilters}
        rows={canView ? filteredRows : []}
      />
    </>
  );
}
