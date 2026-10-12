import { useSyncExternalStore } from "react";

import type { WarehouseInventoryRow } from "./warehouseTableData";

const storageKey = "deluxe-veneers-warehouse-b-transferred-rows";
const changeEvent = "deluxe-veneers-warehouse-b-transferred-rows-changed";
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

export function moveFactoryRowToWarehouseB(row: Record<string, unknown>) {
  const rowId = String(row.id ?? "");

  if (!rowId || readRows().some((entry) => entry.inventoryRecordId === rowId)) {
    return;
  }

  const noOfLeaves = getString(row, ["noOfLeaves", "noOfSheets", "leaves", "availableLeaves", "quantity"]);
  const inspectionDate = getString(row, ["inspectionDate", "issuedInspectionDate", "processDate"]);
  const remark = getString(row, ["remark", "inspectionRemark"]);
  const itemName = getString(row, ["itemName", "productName"]);
  const subCategory = getString(row, ["subCategory", "itemSubCategory"]);
  const logCode = getString(row, ["logCode", "logNo", "batchNo"]);
  const totalSqm = getString(row, ["totalSqMeter", "sqm", "issuedSqm", "totalSqm"]);
  const totalSqf = getString(row, ["sqf", "issuedSqf", "totalSqf"]);
  const palletNo = getString(row, ["palletNo", "palletNumber"]);
  const storageSrNo = getString(row, ["storageSrNo", "storageSerialNumber"]);
  const movedRow: WarehouseInventoryRow = {
    id: `warehouse-b-inspection-${rowId}`,
    inventoryRecordId: rowId,
    inventorySlug: "raw-veneer",
    storageSrNo,
    inwardSrNo: storageSrNo || "-",
    inwardType: "Production",
    inwardDate: readDate(row.inspectionDate ?? row.issuedDate ?? row.issueDate),
    invoiceNo: "-",
    referenceSrNo: logCode || "-",
    supplierName: "-",
    supplierItemName: itemName,
    supplierCode: "-",
    itemName,
    subCategory,
    unitName: "",
    color: getString(row, ["color", "colour"]),
    palletNo,
    length: getString(row, ["length"]),
    width: getString(row, ["width"]),
    thickness: getString(row, ["thickness", "height"]),
    totalUnits: noOfLeaves,
    availableUnits: noOfLeaves,
    totalSqm,
    totalSqf,
    availableSqm: totalSqm,
    availableSqf: totalSqf,
    currency: getString(row, ["currency"]) || "INR",
    amount: getString(row, ["amount"]),
    qcStatus: "QC Pass",
    remark,
    status: "Available",
    veneerSrNo: storageSrNo || "-",
    itemSrNo: "",
    mdfSrNo: "",
    timberCode: "",
    logCode,
    bundleNumber: getString(row, ["bundleNumber", "bundleNo"]),
    palletNumber: palletNo,
    noOfLeaves,
    processName: "Drying Inspection",
    processColor: getString(row, ["color", "colour"]),
    cutName: getString(row, ["cut", "cutName"]),
    seriesName: "",
    grade: getString(row, ["grade"]),
    expenseAmount: "",
    totalNoOfSheets: "",
    avSheets: "",
    avSqm: "",
    avSqf: "",
    plywoodType: "",
    mdfType: "",
    inspectionDate,
  };

  writeRows([...readRows(), movedRow]);
}

export function useWarehouseBMovedRows() {
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

function getString(row: Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}
