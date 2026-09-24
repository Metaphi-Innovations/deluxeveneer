import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { getInventoryPaths } from "../../../inventory/shared";
import { mdfColumns, type MdfRow } from "../types/productionWarehouseTypes";
import { fetchProductionWarehouseInventory, type ProductionInventoryItem } from "../api/productionWarehouseApi";

export interface MdfTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?: Dispatch<SetStateAction<MdfRow[]>> | ((rows: MdfRow[]) => void) | undefined;
}

function mapApiItem(item: ProductionInventoryItem): MdfRow {
  return {
    id: String(item.id),
    inwardDate: item.inwardDate,
    itemName: String(item.itemName ?? ""),
    mdfType: String(item.mdfType ?? ""),
    length: String(item.length ?? ""),
    width: String(item.width ?? ""),
    thickness: String(item.thickness ?? ""),
    noOfLeaves: String(item.noOfLeaves ?? ""),
    sqm: String(item.sqm ?? item.totalSqm ?? ""),
    sqf: String(item.sqf ?? item.totalSqf ?? ""),
    currency: String(item.currency ?? ""),
    amount: String(item.amount ?? ""),
    remark: String(item.remark ?? ""),
    inventorySlug: item.inventorySlug ? String(item.inventorySlug) : "mdf",
    inventoryRecordId: item.inventoryRecordId
      ? String(item.inventoryRecordId)
      : String(item.id),
  };
}

export function MdfTab({
  warehouseId,
  searchValue,
  canView,
  canEdit,
  onExportReady,
}: MdfTabProps) {
  const navigate = useNavigate();
  const [apiRows, setApiRows] = useState<MdfRow[]>([]);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      if (!warehouseId) {
        if (!ignore) setApiRows([]);
        return;
      }
      const data = await fetchProductionWarehouseInventory({
        warehouseId,
        tab: "mdf",
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

  const actions = useMemo<ReadonlyArray<EnterpriseTableAction<MdfRow>>>(() => {
    const list: EnterpriseTableAction<MdfRow>[] = [];

    if (canView) {
      list.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (row: MdfRow) =>
          navigate(
            getInventoryPaths(
              (row.inventorySlug as "mdf") || "mdf",
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
        onSelect: (row: MdfRow) =>
          navigate(
            getInventoryPaths(
              (row.inventorySlug as "mdf") || "mdf",
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
      key="production-mdf"
      actions={actions}
      columns={mdfColumns}
      defaultRowsPerPage={10}
      emptyStateLabel="No MDF inventory records are available."
      initialSort={{ key: "inwardDate", direction: "desc" }}
      rows={canView ? filteredRows : []}
    />
  );
}
