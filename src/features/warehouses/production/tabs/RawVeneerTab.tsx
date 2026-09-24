import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { Eye, Pencil, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import { getInventoryPaths } from "../../../inventory/shared";
import { rawVeneerColumns, type RawVeneerRow } from "../types/productionWarehouseTypes";
import { useWarehouseCMovedRows } from "../../shared/warehouseCTransferStore";
import { issueFactoryWork, useFactoryIssuedWorkItems } from "../../../factory/shared/factoryIssuedWorkStore";
import type { FactoryRecord } from "../../../factory/shared/types";
import { fetchProductionWarehouseInventory, type ProductionInventoryItem } from "../api/productionWarehouseApi";

export interface RawVeneerTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?: Dispatch<SetStateAction<RawVeneerRow[]>> | ((rows: RawVeneerRow[]) => void) | undefined;
}

function mapApiItem(item: ProductionInventoryItem): RawVeneerRow {
  return {
    id: String(item.id),
    inwardDate: item.inwardDate,
    itemName: String(item.itemName ?? ""),
    subCategory: String(item.subCategory ?? ""),
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? ""),
    noOfLeaves: String(item.noOfLeaves ?? ""),
    sqm: String(item.sqm ?? item.totalSqm ?? ""),
    sqf: String(item.sqf ?? item.totalSqf ?? ""),
    grade: String(item.grade ?? ""),
    currency: String(item.currency ?? ""),
    amount: String(item.amount ?? ""),
    remark: String(item.remark ?? ""),
    inventorySlug: item.inventorySlug ? String(item.inventorySlug) : "raw-veneer",
    inventoryRecordId: item.inventoryRecordId
      ? String(item.inventoryRecordId)
      : String(item.id),
  };
}

export function RawVeneerTab({
  warehouseName,
  warehouseId,
  searchValue,
  canView,
  canEdit,
  onExportReady,
}: RawVeneerTabProps) {
  const navigate = useNavigate();
  const [marquetryIssuedRowIds, setMarquetryIssuedRowIds] = useState<string[]>([]);
  const movedWarehouseCRows = useWarehouseCMovedRows();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const [apiRows, setApiRows] = useState<RawVeneerRow[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      if (!warehouseId) {
        if (!ignore) setApiRows([]);
        return;
      }
      const data = await fetchProductionWarehouseInventory({
        warehouseId,
        tab: "raw-veneer",
        search: searchValue,
      });
      if (!ignore) {
        setApiRows(
          data && Array.isArray(data.items) ? data.items.map(mapApiItem) : [],
        );
      }
    }
    void loadData();
    return () => {
      ignore = true;
    };
  }, [warehouseId, searchValue]);

  const movedFromLocal = useMemo<RawVeneerRow[]>(
    () =>
      movedWarehouseCRows
        .filter((r) => r.inventorySlug === "raw-veneer")
        .map((r) => ({
          id: String(r.id),
          inwardDate: r.inwardDate,
          itemName: r.itemName,
          subCategory: r.subCategory,
          length: r.length,
          width: r.width,
          thickness: r.thickness,
          noOfLeaves: r.noOfLeaves ?? "",
          sqm: r.totalSqm ?? "",
          sqf: r.totalSqf ?? "",
          grade: r.grade ?? "",
          currency: r.currency ?? "",
          amount: r.amount ?? "",
          remark: r.remark ?? "",
          inventorySlug: r.inventorySlug,
          inventoryRecordId: r.inventoryRecordId,
        })),
    [movedWarehouseCRows],
  );

  const allRows = useMemo(() => {
    const apiIds = new Set(apiRows.map((row) => String(row.id)));
    return [
      ...apiRows,
      ...movedFromLocal.filter((row) => !apiIds.has(String(row.id))),
    ];
  }, [apiRows, movedFromLocal]);

  const movedWarehouseRowIds = useMemo(
    () =>
      new Set(
        factoryIssuedWorkItems
          .filter((item) => item.sourceSlug === warehouseName)
          .map((item) => item.sourceRowId),
      ),
    [factoryIssuedWorkItems, warehouseName],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const available = allRows.filter(
      (row) =>
        !marquetryIssuedRowIds.includes(String(row.id)) &&
        !movedWarehouseRowIds.has(String(row.id)),
    );

    if (!normalizedSearch) {
      return available;
    }

    return available.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [allRows, marquetryIssuedRowIds, movedWarehouseRowIds, searchValue]);

  useEffect(() => {
    onExportReady?.(filteredRows);
  }, [filteredRows, onExportReady]);

  const actions = useMemo<ReadonlyArray<EnterpriseTableAction<RawVeneerRow>>>(() => {
    const list: EnterpriseTableAction<RawVeneerRow>[] = [];

    if (canView) {
      list.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (row: RawVeneerRow) =>
          navigate(
            getInventoryPaths(
              (row.inventorySlug as "raw-veneer") || "raw-veneer",
              "issued",
              "warehouse-c",
            ).view(row.inventoryRecordId || String(row.id)),
          ),
      });
    }

    if (canEdit) {
      list.push({
        id: "edit",
        label: "Edit",
        icon: Pencil,
        onSelect: (row: RawVeneerRow) =>
          navigate(
            getInventoryPaths(
              (row.inventorySlug as "raw-veneer") || "raw-veneer",
              "issued",
              "warehouse-c",
            ).edit(row.inventoryRecordId || String(row.id)),
          ),
      });

      list.push({
        id: "issue-for-marquetry",
        label: "Issue for Marquetry",
        icon: Plus,
        tone: "primary",
        onSelect: (row: RawVeneerRow) => {
          issueFactoryWork({
            destinationProcess: "Marquetry",
            sourceSlug: warehouseName,
            sourceProcess: "Inventory",
            sourceWarehouseName: warehouseName,
            sourceRow: {
              ...row,
              issuedFrom: "Inventory",
              issuedFor: "Marquetry",
              issuedDate: new Date(),
              warehouseName,
            } as FactoryRecord,
          });
          setMarquetryIssuedRowIds((current) =>
            current.includes(String(row.id))
              ? current
              : [...current, String(row.id)],
          );
        },
      });
    }

    return list;
  }, [canView, canEdit, navigate, warehouseName]);

  return (
    <EnterpriseDataTable
      key="production-raw-veneer"
      actions={actions}
      columns={rawVeneerColumns}
      defaultRowsPerPage={10}
      emptyStateLabel="No raw veneer inventory records are available."
      initialSort={{ key: "inwardDate", direction: "desc" }}
      rows={canView ? filteredRows : []}
    />
  );
}
