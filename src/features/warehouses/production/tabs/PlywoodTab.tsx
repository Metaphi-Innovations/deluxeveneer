import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { getInventoryPaths } from "../../../inventory/shared";
import { plywoodColumns, type PlywoodRow } from "../types/productionWarehouseTypes";
import { fetchProductionWarehouseInventory, type ProductionInventoryItem } from "../api/productionWarehouseApi";

export interface PlywoodTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?: Dispatch<SetStateAction<PlywoodRow[]>> | ((rows: PlywoodRow[]) => void) | undefined;
}

function mapApiItem(item: ProductionInventoryItem): PlywoodRow {
  return {
    id: String(item.id),
    inwardDate: item.inwardDate,
    itemName: String(item.itemName ?? ""),
    subCategory: String(item.subCategory ?? ""),
    color: String(item.color ?? ""),
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? ""),
    noOfSheets: String(item.noOfSheets ?? item.totalNoOfSheets ?? ""),
    sqm: String(item.sqm ?? item.totalSqm ?? ""),
    sqf: String(item.sqf ?? item.totalSqf ?? ""),
    amount: String(item.amount ?? ""),
    remark: String(item.remark ?? ""),
    inventorySlug: item.inventorySlug ? String(item.inventorySlug) : "plywood",
    inventoryRecordId: item.inventoryRecordId
      ? String(item.inventoryRecordId)
      : String(item.id),
  };
}

export function PlywoodTab({
  warehouseId,
  searchValue,
  canView,
  canEdit,
  onExportReady,
}: PlywoodTabProps) {
  const navigate = useNavigate();
  const [apiRows, setApiRows] = useState<PlywoodRow[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      if (!warehouseId) {
        if (!ignore) setApiRows([]);
        return;
      }
      const data = await fetchProductionWarehouseInventory({
        warehouseId,
        tab: "plywood",
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

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return apiRows;
    }

    return apiRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [apiRows, searchValue]);

  useEffect(() => {
    onExportReady?.(filteredRows);
  }, [filteredRows, onExportReady]);

  const actions = useMemo<ReadonlyArray<EnterpriseTableAction<PlywoodRow>>>(() => {
    const list: EnterpriseTableAction<PlywoodRow>[] = [];

    if (canView) {
      list.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (row: PlywoodRow) =>
          navigate(
            getInventoryPaths(
              (row.inventorySlug as "plywood") || "plywood",
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
        onSelect: (row: PlywoodRow) =>
          navigate(
            getInventoryPaths(
              (row.inventorySlug as "plywood") || "plywood",
              "issued",
              "warehouse-c",
            ).edit(row.inventoryRecordId || String(row.id)),
          ),
      });
    }

    return list;
  }, [canView, canEdit, navigate]);

  return (
    <EnterpriseDataTable
      key="production-plywood"
      actions={actions}
      columns={plywoodColumns}
      defaultRowsPerPage={10}
      emptyStateLabel="No plywood inventory records are available."
      initialSort={{ key: "inwardDate", direction: "desc" }}
      rows={canView ? filteredRows : []}
    />
  );
}
