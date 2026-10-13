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

  if (!rowId) {
    return;
  }

  const inventorySlug = getString(row, ["inventorySlug"]) === "sawing" ? "sawing" : "raw-veneer";
  const movedRow = buildMovedWarehouseRow(row, rowId, inventorySlug);
  const existing = readRows();
  const existingIndex = existing.findIndex((entry) => entry.inventoryRecordId === rowId);

  if (existingIndex >= 0) {
    if (inventorySlug !== "sawing") {
      return;
    }

    const nextRows = [...existing];
    nextRows[existingIndex] = movedRow;
    writeRows(nextRows);
    return;
  }

  writeRows([...existing, movedRow]);
}

function buildMovedWarehouseRow(
  row: Record<string, unknown>,
  rowId: string,
  inventorySlug: "raw-veneer" | "sawing",
) {
  const batchNo =
    inventorySlug === "sawing"
      ? getString(row, ["batchNo", "logNo", "logCode"])
      : getString(row, ["batchNo", "batchNoCode", "logNo", "logCode"]);
  const height = getString(row, ["height", "thickness"]);
  const thickness =
    inventorySlug === "sawing"
      ? getString(row, ["thickness"]) || height
      : height;
  const amount = getString(row, ["amount", "totalAmount"]);

  return {
    ...row,
    id: `warehouse-c-inspection-${rowId}`,
    inventoryRecordId: rowId,
    inventorySlug,
    warehouseName: getString(row, ["warehouseName", "destinationWarehouse"]) || "Warehouse C",
    storageSrNo: getString(row, ["storageSrNo", "storageSerialNumber"]),
    inwardDate: readDate(row.issuedDate ?? row.sawingDate ?? row.processDate ?? row.issueDate),
    invoiceNo: "-",
    supplierName: "-",
    itemName: getString(row, ["itemName", "productName"]),
    subCategory: getString(row, ["itemSubCategory", "subCategory"]),
    color: getString(row, ["color", "colour"]),
    batchNo,
    logNo: batchNo,
    referenceSrNo: batchNo,
    length: getString(row, ["length"]),
    width: getString(row, ["width"]),
    height,
    thickness,
    cbm: getString(row, ["cbm", "receivedCbm", "availableCbm"]),
    cbf: getString(row, ["cbf"]),
    totalUnits: getString(row, ["noOfLeaves", "noOfSheets", "quantity"]),
    availableUnits: getString(row, ["noOfLeaves", "noOfSheets", "quantity"]),
    totalSqm: getString(row, ["sqm", "issuedSqm", "totalSqm"]),
    availableSqm: getString(row, ["sqm", "issuedSqm", "totalSqm"]),
    totalSqf: getString(row, ["sqf", "issuedSqf", "totalSqf"]),
    availableSqf: getString(row, ["sqf", "issuedSqf", "totalSqf"]),
    currency: getString(row, ["currency"]) || "INR",
    amount,
    totalAmount: getString(row, ["totalAmount"]) || amount,
    remark: getString(row, ["remark"]),
    updatedBy: getString(row, ["updatedBy"]),
    qcStatus: "QC Pass",
    status: "Available",
  } as unknown as WarehouseInventoryRow;
}

function readDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
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
