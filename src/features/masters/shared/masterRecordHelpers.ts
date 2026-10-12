import type { MasterRecord } from "./types";
import { getCachedSupplierMasterRows } from "../supplier-master/api/supplierMasterApi";

export const asDate = (value: string) => new Date(value);

export function withAuditFields<T extends MasterRecord>(rows: ReadonlyArray<T>) {
  return rows.map((row) => ({
    ...row,
    createdBy: String(row.createdBy ?? row.createdEditedBy ?? ""),
    editedBy: String(row.editedBy ?? row.updatedBy ?? row.createdEditedBy ?? ""),
    createdDate:
      (row.createdDate ??
        row.createdEditedDate ??
        row.createdEditedAt ??
        null) as MasterRecord[string],
    updatedDate:
      (row.updatedDate ??
        row.updatedAt ??
        row.createdEditedDate ??
        row.createdEditedAt ??
        null) as MasterRecord[string],
  }));
}

export const uniqueOptions = (rows: ReadonlyArray<MasterRecord>, key: string) =>
  Array.from(
    new Set(rows.map((row) => String(row[key] ?? "")).filter(Boolean)),
  );

export const activeOptions = (rows: ReadonlyArray<MasterRecord>, key: string) =>
  uniqueOptions(
    rows.filter(
      (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
    ),
    key,
  );

export const statusOptions = ["Active", "Inactive"];

function normalizeStateValue(state: string) {
  return state.trim().toLowerCase();
}

export function getSupplierState(supplierName: string) {
  const normalizedName = supplierName.trim().toLowerCase();

  if (!normalizedName) {
    return "";
  }

  const cachedMatch = getCachedSupplierMasterRows().find(
    (row) =>
      String(row.supplierName ?? "").trim().toLowerCase() === normalizedName,
  );

  return cachedMatch ? String(cachedMatch.state ?? "") : "";
}

/** Same warehouse and supplier state uses CGST+SGST. Different states use IGST. */
export function getInwardGstMode(
  warehouseState: string,
  supplierState: string,
): "intra" | "inter" {
  const warehouse = normalizeStateValue(warehouseState);
  const supplier = normalizeStateValue(supplierState);

  if (!warehouse || !supplier) {
    return "intra";
  }

  return warehouse === supplier ? "intra" : "inter";
}

export function getWarehouseAGstMode(
  supplierName: string,
  warehouseState = "",
): "intra" | "inter" {
  return getInwardGstMode(warehouseState, getSupplierState(supplierName));
}
