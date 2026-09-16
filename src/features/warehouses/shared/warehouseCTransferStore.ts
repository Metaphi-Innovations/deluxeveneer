import { useSyncExternalStore } from "react";

import type { WarehouseInventoryRow } from "./warehouseTableData";

const storageKey = "deluxe-veneers-warehouse-c-transferred-rows";
const changeEvent = "deluxe-veneers-warehouse-c-transferred-rows-changed";
let memoryRows: WarehouseInventoryRow[] | null = null;
const listeners = new Set<() => void>();

function readRows() {
  if (memoryRows) {
    return memoryRows;
  }

  if (typeof window === "undefined") {
    memoryRows = [];
    return memoryRows;
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    memoryRows = stored ? (JSON.parse(stored) as WarehouseInventoryRow[]) : [];
  } catch {
    memoryRows = [];
  }

  return memoryRows;
}

function writeRows(rows: WarehouseInventoryRow[]) {
  memoryRows = rows;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(storageKey, JSON.stringify(rows));
    window.dispatchEvent(new Event(changeEvent));
  }

  listeners.forEach((listener) => listener());
}

export function moveFactoryRowToWarehouseC(row: Record<string, unknown>) {
  const rowId = String(row.id ?? "");

  if (!rowId || readRows().some((entry) => entry.inventoryRecordId === rowId)) {
    return;
  }

  const movedRow = {
    ...row,
    id: `warehouse-c-inspection-${rowId}`,
    inventoryRecordId: rowId,
    inventorySlug: "raw-veneer",
    inwardDate: row.issuedDate instanceof Date ? row.issuedDate : new Date(),
    invoiceNo: "-",
    supplierName: "-",
    itemName: getString(row, ["itemName", "productName"]),
    subCategory: getString(row, ["itemSubCategory", "subCategory"]),
    totalUnits: getString(row, ["noOfLeaves", "noOfSheets", "quantity"]),
    availableUnits: getString(row, ["noOfLeaves", "noOfSheets", "quantity"]),
    totalSqm: getString(row, ["sqm", "issuedSqm", "totalSqm"]),
    availableSqm: getString(row, ["sqm", "issuedSqm", "totalSqm"]),
    totalSqf: getString(row, ["sqf", "issuedSqf", "totalSqf"]),
    availableSqf: getString(row, ["sqf", "issuedSqf", "totalSqf"]),
    currency: getString(row, ["currency"]) || "INR",
    amount: getString(row, ["amount"]),
    remark: getString(row, ["remark"]),
    qcStatus: "QC Pass",
    status: "Available",
  } as unknown as WarehouseInventoryRow;

  writeRows([...readRows(), movedRow]);
}

export function useWarehouseCMovedRows() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      if (typeof window !== "undefined") {
        window.addEventListener(changeEvent, listener);
      }
      return () => {
        listeners.delete(listener);
        if (typeof window !== "undefined") {
          window.removeEventListener(changeEvent, listener);
        }
      };
    },
    () => readRows(),
    () => readRows(),
  );
}

function getString(row: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}
