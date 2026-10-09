import type { EnterpriseTableCellValue } from "../../../components/data-display/EnterpriseDataTable";
import type {
  WarehouseAInventorySlug,
  WarehouseInventoryRow,
} from "../shared/warehouseTableData";
import { warehouseAInventoryConfigs } from "../shared/warehouseTableData";

export type WarehouseAVisibleInventorySlug = Exclude<
  WarehouseAInventorySlug,
  "consumables"
>;

export const warehouseATabs = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
] as const satisfies readonly {
  label: string;
  value: WarehouseAVisibleInventorySlug;
}[];

const visibleWarehouseAInventorySlugs = new Set<WarehouseAInventorySlug>(
  warehouseATabs.map((tab) => tab.value),
);

export function getActiveWarehouseAInventory(
  value: string | null,
): WarehouseAInventorySlug {
  return value &&
    value in warehouseAInventoryConfigs &&
    visibleWarehouseAInventorySlugs.has(value as WarehouseAInventorySlug)
    ? (value as WarehouseAInventorySlug)
    : "veneer-blocks";
}

export function mergeWarehouseARows(
  configRows: readonly WarehouseInventoryRow[],
  inwardRows: readonly WarehouseInventoryRow[],
) {
  const seenIds = new Set<string>();
  const merged: WarehouseInventoryRow[] = [];

  [...inwardRows, ...configRows].forEach((row) => {
    if (seenIds.has(row.id)) {
      return;
    }

    seenIds.add(row.id);
    merged.push(row);
  });

  return merged;
}

export function addReturnToQuery(path: string, returnTo: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

export function formatInventorySearchValue(value: EnterpriseTableCellValue) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(value)
      .toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).toLowerCase();
}
