import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClipboardCheck,
  Eye,
  FileOutput,
  Pencil,
  Plus,
} from "lucide-react";
import {
  Alert,
  Button,
  Stack,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { getInventoryPaths } from "../../inventory/shared";
import { canAccessPermission } from "../../permissions";
import {
  getListingToolbarButtonSx,
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  exportInwardsApi,
  fetchInwardColumnDropdown,
  fetchInwardsPaginated,
  getInwardInventoryTypeFromSlug,
  mapInwardListItemToRow,
} from "../api/inwardApi";
import { InwardQcUpdateDialog } from "../components/InwardQcUpdateDialog";
import { isApiSupportedInwardSlug } from "../inward/supportedInwardTypes";
import { type WarehouseInventoryRow } from "../shared/warehouseTableData";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "../../shared/columnFilters";

type InwardInventoryTab =
  | "veneer-blocks"
  | "raw-veneer"
  | "plywood"
  | "mdf";

const INWARD_SORT_FIELD_MAP: Record<string, string> = {
  inwardSrNo: "inwardSrNo",
  inwardDate: "inwardDate",
  invoiceNo: "invoiceNo",
  supplierName: "supplierName",
  currency: "currency",
  amount: "amount",
  totalAmount: "totalAmount",
  qcStatus: "qcStatus",
  qcRemark: "qcRemark",
  remark: "remark",
  itemName: "itemName",
};

function mapInwardSortField(columnKey: string | null): string | undefined {
  if (!columnKey) return undefined;
  return INWARD_SORT_FIELD_MAP[columnKey];
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) continue;
    filters[key] = filter.values;
  }

  return filters;
}

const inwardInventoryTabs = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
] as const satisfies readonly {
  label: string;
  value: InwardInventoryTab;
}[];

const inwardInventoryTitles: Record<InwardInventoryTab, string> = {
  "veneer-blocks": "Veneer Blocks",
  "raw-veneer": "Raw Veneer",
  plywood: "Plywood",
  mdf: "MDF",
};

const inwardListingColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "totalAmount", label: "Total Amount" },
    { key: "qcStatus", label: "QC Status" },
    { key: "qcRemark", label: "QC Remark" },
    { key: "remark", label: "Remark" },
  ];

interface InwardWarehousePageProps {
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
}

export function InwardWarehousePage({
  warehouseId,
  warehouseName,
  warehouseRootPath,
}: InwardWarehousePageProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>("inwardDate");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>("desc");
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [rows, setRows] = useState<WarehouseInventoryRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [qcInwardId, setQcInwardId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const activeInventory = getActiveInwardInventoryTab(
    searchParams.get("inventory"),
  );
  const activeTitle = inwardInventoryTitles[activeInventory];
  const canCreate = canAccessPermission("warehouseA", "create");
  const canEdit = canAccessPermission("warehouseA", "edit");
  const canView = canAccessPermission("warehouseA", "view");
  const isApiSupportedInventory = isApiSupportedInwardSlug(activeInventory);
  const activeInventoryListPath = `${warehouseRootPath}?inventory=${activeInventory}`;

  const loadInwards = useCallback(async () => {
    if (!isApiSupportedInventory) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage("");
      setIsLoading(false);
      return;
    }

    const inventoryType = getInwardInventoryTypeFromSlug(activeInventory);
    if (!inventoryType || !warehouseId) {
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const apiSortBy = mapInwardSortField(sortBy);
      const apiFilters = toApiColumnFilters(columnFilters);
      const result = await fetchInwardsPaginated({
        warehouseId,
        inventoryType,
        page,
        limit: rowsPerPage,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
        ...(apiSortBy ? { sortBy: apiSortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0
          ? { filters: apiFilters }
          : {}),
      });

      setRows(
        result.items.map((item) =>
          mapInwardListItemToRow(item, activeInventory),
        ),
      );
      setTotalCount(result.pagination.total);
    } catch (error) {
      setRows([]);
      setTotalCount(0);
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load inward stock.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    activeInventory,
    columnFilters,
    isApiSupportedInventory,
    page,
    rowsPerPage,
    searchValue,
    sortBy,
    sortOrder,
    warehouseId,
    reloadKey,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadInwards();
    }, 300);

    return () => window.clearTimeout(timer);
  }, [loadInwards]);

  const loadColumnDropdown = useCallback(
    async (columnKey: string) => {
      const inventoryType = getInwardInventoryTypeFromSlug(activeInventory);
      if (!inventoryType || !warehouseId || !isApiSupportedInventory) {
        return;
      }

      try {
        const result = await fetchInwardColumnDropdown({
          warehouseId,
          inventoryType,
          column: columnKey,
        });
        setFilterOptionsByColumn((current) => ({
          ...current,
          [columnKey]: result.options,
        }));
      } catch {
        setFilterOptionsByColumn((current) => ({
          ...current,
          [columnKey]: [],
        }));
      }
    },
    [activeInventory, isApiSupportedInventory, warehouseId],
  );

  const addStockPath = useMemo(
    () =>
      buildInwardInventoryPath({
        mode: "add",
        inventorySlug: activeInventory,
        warehouseId,
        warehouseName,
        returnTo: activeInventoryListPath,
      }),
    [activeInventory, activeInventoryListPath, warehouseId, warehouseName],
  );

  const handleExport = useCallback(async () => {
    if (!isApiSupportedInventory || isExporting || !warehouseId) {
      return;
    }

    const inventoryType = getInwardInventoryTypeFromSlug(activeInventory);
    if (!inventoryType) {
      return;
    }

    setIsExporting(true);
    setActionError("");

    try {
      const apiSortBy = mapInwardSortField(sortBy);
      const apiFilters = toApiColumnFilters(columnFilters);
      const items = await exportInwardsApi({
        warehouseId,
        inventoryType,
        ...(searchValue.trim() ? { search: searchValue.trim() } : {}),
        ...(apiSortBy ? { sortBy: apiSortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(apiFilters).length > 0
          ? { filters: apiFilters }
          : {}),
      });

      const exportRows = items.map((item) =>
        mapInwardListItemToRow(item, activeInventory),
      );

      if (exportRows.length === 0) {
        setActionError("No records available to export.");
        return;
      }

      exportRowsToCsv(
        exportRows,
        inwardListingColumns,
        `inward-${activeInventory}`,
      );
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Failed to export inward records.",
      );
    } finally {
      setIsExporting(false);
    }
  }, [
    activeInventory,
    columnFilters,
    isApiSupportedInventory,
    isExporting,
    searchValue,
    sortBy,
    sortOrder,
    warehouseId,
  ]);

  const getRowActions = useMemo(
    () =>
      (_row: WarehouseInventoryRow): EnterpriseTableAction<WarehouseInventoryRow>[] => {
        const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [];

        if (canView) {
          actions.push({
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: (selectedRow) => {
              navigate(
                buildInwardInventoryPath({
                  mode: "view",
                  inventorySlug: selectedRow.inventorySlug,
                  recordId: selectedRow.inventoryRecordId,
                  warehouseId,
                  warehouseName,
                  returnTo: activeInventoryListPath,
                }),
              );
            },
          });
        }

        if (canEdit) {
          actions.push({
            id: "edit",
            label: "Edit",
            icon: Pencil,
            onSelect: (selectedRow) => {
              navigate(
                buildInwardInventoryPath({
                  mode: "edit",
                  inventorySlug: selectedRow.inventorySlug,
                  recordId: selectedRow.inventoryRecordId,
                  warehouseId,
                  warehouseName,
                  returnTo: activeInventoryListPath,
                }),
              );
            },
          });

          actions.push({
            id: "qc-update",
            label: "QC Update",
            icon: ClipboardCheck,
            onSelect: (selectedRow) => {
              setActionError("");
              setQcInwardId(selectedRow.inventoryRecordId);
            },
          });
        }

        return actions;
      },
    [
      activeInventoryListPath,
      canEdit,
      canView,
      navigate,
      warehouseId,
      warehouseName,
    ],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: warehouseName }, { label: activeTitle }]}
      subtitle="Incoming material and warehouse inventory."
      title={warehouseName}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <ModuleProcessTabs
          onChange={(value) => {
            setSearchParams({ inventory: value }, { replace: true });
            setPage(1);
            setColumnFilters({});
            setFilterOptionsByColumn({});
            setSearchValue("");
          }}
          tabs={inwardInventoryTabs}
          value={activeInventory}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <ClearableSearchField
            value={searchValue}
            onChange={(value) => {
              setSearchValue(value);
              setPage(1);
            }}
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
            {canCreate && isApiSupportedInventory ? (
              <Button
                component={RouterLink}
                to={addStockPath}
                startIcon={<Plus size={15} />}
                variant="contained"
                sx={(theme) => getListingToolbarButtonSx(theme)}
              >
                Add Stock
              </Button>
            ) : (
              <Button
                startIcon={<Plus size={15} />}
                variant="contained"
                disabled
                sx={(theme) => getListingToolbarButtonSx(theme)}
              >
                Add Stock
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<FileOutput size={15} />}
              disabled={
                !isApiSupportedInventory || isExporting || totalCount === 0
              }
              onClick={() => {
                void handleExport();
              }}
              sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </Stack>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        {actionError ? <Alert severity="error">{actionError}</Alert> : null}

        <EnterpriseDataTable
          key={`${warehouseRootPath}-${activeInventory}`}
          columns={inwardListingColumns}
          columnFilters={columnFilters}
          defaultRowsPerPage={10}
          emptyStateLabel={
            isLoading
              ? "Loading inward records..."
              : isApiSupportedInventory
                ? `No ${activeTitle.toLowerCase()} records are available.`
                : `${activeTitle} inward will be available soon.`
          }
          filterOptionsByColumn={filterOptionsByColumn}
          getRowActions={isApiSupportedInventory ? getRowActions : () => []}
          onColumnFilterOpen={(columnKey) => {
            void loadColumnDropdown(columnKey);
          }}
          onColumnFiltersChange={(next) => {
            setColumnFilters(next);
            setPage(1);
          }}
          pagination={{
            page,
            rowsPerPage,
            totalCount,
            onPageChange: setPage,
            onRowsPerPageChange: (next) => {
              setRowsPerPage(next);
              setPage(1);
            },
          }}
          rows={isLoading ? [] : rows}
          sorting={{
            sortBy,
            sortOrder,
            onSortChange: (nextSortBy, nextSortOrder) => {
              setSortBy(nextSortBy);
              setSortOrder(nextSortOrder);
              setPage(1);
            },
          }}
        />
      </Stack>

      <InwardQcUpdateDialog
        inwardId={qcInwardId}
        open={Boolean(qcInwardId)}
        onClose={() => setQcInwardId(null)}
        onUpdated={() => setReloadKey((current) => current + 1)}
      />
    </MasterPageShell>
  );
}

function getActiveInwardInventoryTab(
  value: string | null,
): InwardInventoryTab {
  if (
    value === "veneer-blocks" ||
    value === "raw-veneer" ||
    value === "plywood" ||
    value === "mdf"
  ) {
    return value;
  }

  return "veneer-blocks";
}

function buildInwardInventoryPath(input: {
  mode: "add" | "view" | "edit";
  inventorySlug: string;
  recordId?: string;
  warehouseId: string;
  warehouseName: string;
  returnTo: string;
}) {
  const paths = getInventoryPaths(
    input.inventorySlug,
    "issued",
    "warehouse-a",
  );
  const basePath =
    input.mode === "add"
      ? paths.add
      : input.mode === "view"
        ? paths.view(input.recordId ?? "")
        : paths.edit(input.recordId ?? "");

  const url = new URL(basePath, window.location.origin);
  url.searchParams.set("warehouse", "warehouse-a");
  url.searchParams.set("warehouseId", input.warehouseId);
  url.searchParams.set("warehouseName", input.warehouseName);
  url.searchParams.set("returnTo", input.returnTo);
  return `${url.pathname}?${url.searchParams.toString()}`;
}
