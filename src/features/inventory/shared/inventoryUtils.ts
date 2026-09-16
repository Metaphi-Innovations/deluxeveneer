import type { MasterFieldDefinition, MasterFieldValue } from "../../masters/shared";
import type { InventoryDefinition, InventoryPageMode, InventoryRecord } from "./types";

export type InventoryProcessTab = "issued" | "history";
export type InventoryWarehouseContext =
  | "warehouse-a"
  | "warehouse-b"
  | "warehouse-c";

const inventoryWarehouseLabels: Record<InventoryWarehouseContext, string> = {
  "warehouse-a": "Warehouse A",
  "warehouse-b": "Warehouse B",
  "warehouse-c": "Warehouse C",
};

export function getInventoryProcessTab(value: string | null): InventoryProcessTab {
  return value === "history" ? "history" : "issued";
}

export function getInventoryWarehouseContext(
  value: string | null,
): InventoryWarehouseContext {
  return value === "warehouse-a" || value === "warehouse-c"
    ? value
    : "warehouse-b";
}

export function createInventoryRows<Row extends InventoryRecord>(
  prefix: string,
  rows: ReadonlyArray<Omit<Row, "id"> & Partial<Pick<Row, "id">>>,
) {
  return rows.map((row, index) => ({
    id: row.id ?? `${prefix}-${index + 1}`,
    srNo: typeof row.srNo === "string" ? row.srNo : String(index + 1),
    ...row,
  })) as unknown as Row[];
}

export function uniqueInventoryOptions(
  rows: readonly InventoryRecord[],
  key: string,
) {
  return Array.from(
    new Set(
      rows
        .map((row) => row[key])
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
}

export function createInventoryViewFields(
  columns: readonly { key: string; label: string }[],
) {
  return columns.map<MasterFieldDefinition>((column) => ({
    key: column.key,
    label: column.label,
    type: "text",
  }));
}

export function buildInventoryInitialValues(
  fields: readonly MasterFieldDefinition[],
  row?: InventoryRecord,
) {
  return fields.reduce<Record<string, MasterFieldValue>>((accumulator, field) => {
    const value = row?.[field.key];

    if (field.type === "date") {
      accumulator[field.key] = value instanceof Date ? value : null;
      return accumulator;
    }

    if (field.type === "checkbox" || field.type === "toggle") {
      accumulator[field.key] = typeof value === "boolean" ? value : false;
      return accumulator;
    }

    if (value instanceof Date) {
      accumulator[field.key] = new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(value);
      return accumulator;
    }

    accumulator[field.key] = typeof value === "string" ? value : "";
    return accumulator;
  }, {});
}

export function getInventoryPaths(
  slug: string,
  tab: InventoryProcessTab = "issued",
  warehouse: InventoryWarehouseContext = "warehouse-b",
) {
  const query = getInventoryRecordQuery(warehouse, tab);

  return {
    add: `/inventory/${slug}/add${query}`,
    edit: (id: string) => `/inventory/${slug}/edit/${id}${query}`,
    list: getWarehouseInventoryListPath(warehouse, slug, tab),
    view: (id: string) => `/inventory/${slug}/view/${id}${query}`,
  };
}

export function getWarehouseLabel(warehouse: InventoryWarehouseContext) {
  return inventoryWarehouseLabels[warehouse];
}

export function getWarehouseRootPath(warehouse: InventoryWarehouseContext) {
  return `/${warehouse}`;
}

export function getWarehouseBRootPath() {
  return getWarehouseRootPath("warehouse-b");
}

export function getWarehouseAInventoryPath(slug: string) {
  return getWarehouseInventoryListPath("warehouse-a", slug);
}

export function getWarehouseBInventoryPath(slug: string): string {
  return `/warehouse-b?section=inventory&inventory=${slug}`;
}

export function getWarehouseInventoryListPath(
  warehouse: InventoryWarehouseContext,
  slug: string,
  tab: InventoryProcessTab = "issued",
): string {
  if (warehouse === "warehouse-b") {
    return getInventoryWarehouseBListPath(slug, tab);
  }

  if (warehouse === "warehouse-c") {
    return `${getWarehouseRootPath(warehouse)}?section=inventory&inventory=${slug}`;
  }

  return `${getWarehouseRootPath(warehouse)}?inventory=${slug}`;
}

export function getInventoryWarehouseBListPath(
  slug: string,
  tab: InventoryProcessTab,
): string {
  return tab === "issued"
    ? `/warehouse-b?section=inventory&inventory=${slug}`
    : `/warehouse-b?section=inventory&inventory=${slug}&tab=${tab}`;
}

function getInventoryRecordQuery(
  warehouse: InventoryWarehouseContext,
  tab: InventoryProcessTab,
) {
  const params = new URLSearchParams();

  params.set("warehouse", warehouse);

  if (warehouse === "warehouse-b" && tab === "history") {
    params.set("tab", "history");
  }

  const queryString = params.toString();

  return queryString ? `?${queryString}` : "";
}

export function getInventoryProcessTabs(title: string) {
  return [
    {
      label: `Issued for ${title} Inventory`,
      value: "issued",
    },
    {
      label: `${title} History`,
      value: "history",
    },
  ] as const satisfies readonly { label: string; value: InventoryProcessTab }[];
}

export function getInventoryRowsForTab<Row extends InventoryRecord>(
  rows: readonly Row[],
  tab: InventoryProcessTab,
) {
  const splitIndex = Math.ceil(rows.length / 2);

  return tab === "issued" ? rows.slice(0, splitIndex) : rows.slice(splitIndex);
}

export function getInventoryPageTitle<Row extends InventoryRecord>(
  definition: InventoryDefinition<Row>,
  mode: InventoryPageMode,
) {
  if (mode === "list") {
    return definition.title;
  }

  if (mode === "add") {
    return `Add ${definition.title}`;
  }

  if (mode === "edit") {
    return `Edit ${definition.title}`;
  }

  return `View ${definition.title}`;
}

export function getInventoryPageSubtitle<Row extends InventoryRecord>(
  definition: InventoryDefinition<Row>,
  mode: Exclude<InventoryPageMode, "list">,
) {
  if (mode === "add") {
    return `Create a new ${definition.title.toLowerCase()} stock entry using the standard ERP form pattern.`;
  }

  if (mode === "edit") {
    return `Update the ${definition.title.toLowerCase()} stock entry using the same reusable form layout.`;
  }

  return `Review the ${definition.title.toLowerCase()} stock details in a read-only layout.`;
}
