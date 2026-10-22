import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";

import { parseNumericValue } from "../../shared/numberFormat";
import { queryKeys } from "../../../query/queryKeys";
import { useSidebarWarehousesQuery } from "../../../query/useSidebarWarehousesQuery";
import {
  fetchProductionWarehouseInventory,
  type ProductionInventoryItem,
} from "../../warehouses/production/api/productionWarehouseApi";
import type { FactoryRecord } from "../shared/types";
import { availableFactoryMeasures } from "../shared/factoryAvailableMeasures";
import { getPressingAvailableQuantity, pressingText } from "./pressingQuantity";
import { buildPressingDummyBaseStock } from "./pressingDummyBaseStock";

export type PressingBaseMaterialType = "" | "Plywood" | "MDF";

const pageSize = 200;

async function fetchProductionWarehouseStock(
  warehouseId: string,
  tab: "plywood" | "mdf",
) {
  const firstPage = await fetchProductionWarehouseInventory({
    warehouseId,
    tab,
    page: 1,
    limit: pageSize,
  });
  const items = [...(firstPage?.items ?? [])];
  const totalPages = firstPage?.totalPages ?? 1;

  for (let page = 2; page <= totalPages; page += 1) {
    const nextPage = await fetchProductionWarehouseInventory({
      warehouseId,
      tab,
      page,
      limit: pageSize,
    });
    items.push(...(nextPage?.items ?? []));
  }

  return items;
}

function mapProductionStockRow(
  item: ProductionInventoryItem,
  warehouse: { id: string; label: string },
): FactoryRecord {
  const receivedSheets =
    pressingText(item.receivedQuantity) ||
    pressingText(item.noOfSheets) ||
    pressingText(item.totalNoOfSheets);
  const availableSheets =
    pressingText(item.availableQuantity) ||
    pressingText(item.noOfSheets) ||
    pressingText(item.totalNoOfSheets);

  return {
    id: String(item.id),
    warehouseId: warehouse.id,
    warehouseName: warehouse.label || "Production Warehouse",
    warehouseType: "Production",
    storageSrNo:
      pressingText(item.storageSrNo) || pressingText(item.productionSrNo),
    inwardSrNo:
      pressingText(item.inwardItemCode) || pressingText(item.inwardSrNo),
    itemName: pressingText(item.itemName),
    itemSubCategory: pressingText(item.subCategory),
    palletNo: pressingText(item.palletNo) || pressingText(item.palletNumber),
    length: pressingText(item.length),
    width: pressingText(item.width),
    thickness: pressingText(item.thickness),
    receivedSheets,
    availableSheets,
    sqm: pressingText(item.sqm) || pressingText(item.totalSqm),
    sqf: pressingText(item.sqf) || pressingText(item.totalSqf),
    grade: pressingText(item.grade),
    remark: pressingText(item.remark),
  };
}

export function usePressingBaseStock(materialType: PressingBaseMaterialType) {
  const materialSelected = materialType === "Plywood" || materialType === "MDF";
  const tab = materialType === "MDF" ? "mdf" : "plywood";
  const warehousesQuery = useSidebarWarehousesQuery(materialSelected);
  const productionWarehouses = useMemo(
    () =>
      (warehousesQuery.data ?? []).filter(
        (warehouse) => warehouse.warehouseType === "Production",
      ),
    [warehousesQuery.data],
  );
  const stockQueries = useQueries({
    queries: materialSelected
      ? productionWarehouses.map((warehouse) => ({
          queryKey: queryKeys.warehouse.production.list(tab, {
            warehouseId: warehouse.id,
            page: 1,
            limit: pageSize,
            pressingBase: true,
          }),
          enabled: Boolean(warehouse.id),
          queryFn: () => fetchProductionWarehouseStock(warehouse.id, tab),
        }))
      : [],
  });

  const rows = useMemo(() => {
    const seen = new Set<string>();
    const liveRows = stockQueries.flatMap((query, queryIndex) => {
      const items = (query.data ?? []) as ProductionInventoryItem[];
      const warehouse = productionWarehouses[queryIndex];
      if (!warehouse) return [];

      return items.flatMap((item) => {
        const row = mapProductionStockRow(item, warehouse);
        const id = String(row.id);
        if (seen.has(id) || getPressingAvailableQuantity(row) <= 0) {
          return [];
        }
        seen.add(id);
        return [row];
      });
    });

    if (materialType !== "Plywood" && materialType !== "MDF") {
      return [];
    }

    const dummyRows = buildPressingDummyBaseStock(materialType);

    return [...liveRows, ...dummyRows].map((row) => {
      const received = parseNumericValue(row.receivedSheets) ?? 0;
      const available = parseNumericValue(row.availableSheets) ?? received;
      return {
        ...row,
        ...availableFactoryMeasures(row, received, available),
      };
    });
  }, [materialType, productionWarehouses, stockQueries]);

  const isLoading =
    warehousesQuery.isLoading || stockQueries.some((query) => query.isLoading);
  const emptyLabel = !materialSelected
    ? "Select a base material."
    : isLoading
      ? "Loading Production Warehouse stock..."
      : productionWarehouses.length === 0
        ? "No Production Warehouse is configured."
        : `No ${materialType.toLowerCase()} pallets with available sheets were found in the Production Warehouse.`;

  return {
    emptyLabel,
    isLoading,
    rows,
  };
}
