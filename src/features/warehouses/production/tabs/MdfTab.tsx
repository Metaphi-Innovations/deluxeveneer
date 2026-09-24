import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router";
import { getInventoryPaths } from "../../../inventory/shared";
import { mdfColumns, type MdfRow } from "../types/productionWarehouseTypes";
import { warehouseCInventoryConfigs } from "../../shared/warehouseTableData";
import { fetchProductionWarehouseInventory, type ProductionInventoryItem } from "../api/productionWarehouseApi";

export interface MdfTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?: Dispatch<SetStateAction<MdfRow[]>> | ((rows: MdfRow[]) => void) | undefined;
}

export function MdfTab({
  warehouseId,
  searchValue,
  canView,
  canEdit,
  onExportReady,
}: MdfTabProps) {
  const navigate = useNavigate();
  const [apiRows, setApiRows] = useState<MdfRow[] | null>(null);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      const data = await fetchProductionWarehouseInventory({
        warehouseId,
        tab: "mdf",
        search: searchValue,
      });
      if (!ignore && data && Array.isArray(data.items) && data.items.length > 0) {
        setApiRows(
          data.items.map((item: ProductionInventoryItem) => ({
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
            inventoryRecordId: item.inventoryRecordId ? String(item.inventoryRecordId) : String(item.id),
          }))
        );
      }
    }
    void loadData();
    return () => {
      ignore = true;
    };
  }, [warehouseId, searchValue]);

  const defaultRows = useMemo<MdfRow[]>(() => {
    const mdfConfigs = warehouseCInventoryConfigs["mdf"];
    const base = mdfConfigs?.rows ?? [];
    return base.map((r) => ({
      id: String(r.id),
      inwardDate: r.inwardDate,
      itemName: r.itemName,
      mdfType: r.mdfType ?? "",
      length: r.length,
      width: r.width,
      thickness: r.thickness,
      noOfLeaves: r.noOfLeaves ?? "",
      sqm: r.totalSqm ?? "",
      sqf: r.totalSqf ?? "",
      currency: r.currency ?? "",
      amount: r.amount ?? "",
      remark: r.remark ?? "",
      inventorySlug: r.inventorySlug,
      inventoryRecordId: r.inventoryRecordId,
    }));
  }, []);

  const allRows = apiRows ?? defaultRows;

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return allRows;
    }

    return allRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [allRows, searchValue]);

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
            getInventoryPaths((row.inventorySlug as any) || "mdf", "issued", "warehouse-c").view(
              row.inventoryRecordId || String(row.id),
            ),
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
            getInventoryPaths((row.inventorySlug as any) || "mdf", "issued", "warehouse-c").edit(
              row.inventoryRecordId || String(row.id),
            ),
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
      initialSort={{ key: "inwardDate", direction: "desc" }}
      rows={canView ? filteredRows : []}
    />
  );
}
