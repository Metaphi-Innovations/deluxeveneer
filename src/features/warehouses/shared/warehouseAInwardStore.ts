import type { WarehouseAAddStockSlug } from "../../inventory/shared/WarehouseAAddStockLineItems";
import { formatSqfFromSqm as formatSqfFromSqmShared } from "../../shared/numberFormat";
import type {
  WarehouseAInventorySlug,
  WarehouseInventoryRow,
} from "./warehouseTableData";

const warehouseAInwardStorageKey = "deluxe-veneers-warehouse-a-inward-rows";
const warehouseAInwardChangedEvent =
  "deluxe-veneers-warehouse-a-inward-changed";

export type WarehouseAInwardHeaderValues = {
  attachment: string;
  currency: string;
  eta: Date | null;
  etd: Date | null;
  invoiceNo: string;
  inwardDate: Date | null;
  inwardType: string;
  mode: string;
  supplierName: string;
};

export type WarehouseAInwardLineItem = {
  values: Record<string, string>;
};

type StoredWarehouseInventoryRow = Omit<WarehouseInventoryRow, "inwardDate"> & {
  inwardDate: string;
};

export function getWarehouseAInwardRows(
  slug?: WarehouseAInventorySlug,
): WarehouseInventoryRow[] {
  const rows = readWarehouseAInwardRows().map(reviveWarehouseInventoryRow);

  if (!slug) {
    return rows;
  }

  return rows.filter((row) => row.inventorySlug === slug);
}

export function saveWarehouseAInwardItems(input: {
  header: WarehouseAInwardHeaderValues;
  lineItems: readonly WarehouseAInwardLineItem[];
  slug: Exclude<WarehouseAAddStockSlug, "consumables">;
}) {
  const existingRows = readWarehouseAInwardRows();
  const timestamp = Date.now();
  const nextRows = input.lineItems.map((lineItem, index) =>
    serializeWarehouseInventoryRow(
      buildWarehouseAInwardRow({
        header: input.header,
        index,
        lineValues: lineItem.values,
        slug: input.slug,
        timestamp,
      }),
    ),
  );

  writeWarehouseAInwardRows([...nextRows, ...existingRows]);
  return nextRows.map(reviveWarehouseInventoryRow);
}

export function subscribeWarehouseAInwardUpdates(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(warehouseAInwardChangedEvent, listener);

  return () => {
    window.removeEventListener(warehouseAInwardChangedEvent, listener);
  };
}

function buildWarehouseAInwardRow(input: {
  header: WarehouseAInwardHeaderValues;
  index: number;
  lineValues: Record<string, string>;
  slug: Exclude<WarehouseAAddStockSlug, "consumables">;
  timestamp: number;
}): WarehouseInventoryRow {
  const sequence = String(input.index + 1).padStart(3, "0");
  const recordId = `wa-inward-${input.slug}-${input.timestamp}-${sequence}`;
  const totalSqm = String(
    input.lineValues.totalSqMeter ??
      input.lineValues.totalSqm ??
      "",
  );
  const noOfLeaves = String(
    input.lineValues.noOfLeaves ??
      input.lineValues.sheets ??
      input.lineValues.noOfSheets ??
      "",
  );
  const remark = String(
    input.lineValues.remark ?? input.lineValues.remarks ?? "",
  );
  const subCategory = String(
    input.lineValues.itemSubCategory ?? input.lineValues.subCategory ?? "",
  );
  const inwardDate = input.header.inwardDate ?? new Date();

  return {
    id: recordId,
    inventoryRecordId: recordId,
    inventorySlug: input.slug,
    inwardSrNo: `INW-${input.timestamp.toString().slice(-6)}-${sequence}`,
    inwardType: input.header.inwardType || getInwardTypeLabel(input.slug),
    inwardDate,
    invoiceNo: input.header.invoiceNo,
    referenceSrNo: "",
    supplierName: input.header.supplierName,
    supplierItemName: "",
    supplierCode: "",
    itemName: String(input.lineValues.itemName ?? ""),
    subCategory,
    unitName: "",
    color: String(input.lineValues.color ?? ""),
    palletNo: String(input.lineValues.palletNo ?? ""),
    length: String(input.lineValues.length ?? ""),
    width: String(input.lineValues.width ?? ""),
    thickness: String(input.lineValues.thickness ?? ""),
    totalUnits: noOfLeaves,
    availableUnits: "0",
    totalSqm,
    totalSqf: formatSqfFromSqm(totalSqm),
    availableSqm: "0.000",
    availableSqf: "0.000",
    currency: input.header.currency,
    amount: String(
      input.lineValues.productAmount ?? input.lineValues.amount ?? "",
    ),
    attachment: input.header.attachment,
    consumables: "",
    eta: input.header.eta,
    etd: input.header.etd,
    mode: input.header.mode,
    qcStatus: "pending",
    remark,
    status: "QC Pending",
    veneerSrNo: "",
    itemSrNo: "",
    mdfSrNo: "",
    timberCode: "",
    logCode: String(input.lineValues.logCode ?? ""),
    bundleNumber: String(input.lineValues.bundleNumber ?? ""),
    palletNumber: String(input.lineValues.palletNo ?? ""),
    noOfLeaves,
    processName: "",
    processColor: String(input.lineValues.color ?? ""),
    cutName: subCategory,
    seriesName: "",
    grade: "",
    expenseAmount: "",
    totalNoOfSheets: String(
      input.lineValues.sheets ?? input.lineValues.noOfSheets ?? "",
    ),
    avSheets: "0",
    avSqm: "0.000",
    avSqf: "0.000",
    plywoodType: String(input.lineValues.plywoodType ?? ""),
    mdfType: String(input.lineValues.mdfType ?? ""),
  };
}

function getInwardTypeLabel(
  slug: Exclude<WarehouseAAddStockSlug, "consumables">,
) {
  if (slug === "veneer-blocks") {
    return "Veneer Blocks";
  }

  if (slug === "raw-veneer") {
    return "Raw Veneer";
  }

  if (slug === "plywood") {
    return "Plywood";
  }

  return "MDF";
}

function formatSqfFromSqm(value: string) {
  return formatSqfFromSqmShared(value);
}

function serializeWarehouseInventoryRow(
  row: WarehouseInventoryRow,
): StoredWarehouseInventoryRow {
  return {
    ...row,
    inwardDate:
      row.inwardDate instanceof Date
        ? row.inwardDate.toISOString()
        : new Date().toISOString(),
  };
}

function reviveWarehouseInventoryRow(
  row: StoredWarehouseInventoryRow,
): WarehouseInventoryRow {
  return {
    ...row,
    inwardDate: new Date(row.inwardDate),
  };
}

function readWarehouseAInwardRows(): StoredWarehouseInventoryRow[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(warehouseAInwardStorageKey);

    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return Array.isArray(parsed)
      ? (parsed as StoredWarehouseInventoryRow[])
      : [];
  } catch {
    return [];
  }
}

function writeWarehouseAInwardRows(rows: StoredWarehouseInventoryRow[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(warehouseAInwardStorageKey, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent(warehouseAInwardChangedEvent));
}
