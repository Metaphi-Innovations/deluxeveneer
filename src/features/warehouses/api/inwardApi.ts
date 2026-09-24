import { apiRequest, type ApiResponse } from "../../../lib/apiClient";
import type { WarehouseInventoryRow } from "../shared/warehouseTableData";

const BASE_PATH = "/warehouse/inwards";

export type InwardInventoryType =
  | "VENEER_BLOCKS"
  | "RAW_VENEER"
  | "PLYWOOD"
  | "MDF";

export type InwardQcStatus = "PENDING" | "PARTIAL_DONE" | "PASS" | "FAIL";

export interface InwardListItem {
  id: string;
  inwardId: string;
  warehouseId: string;
  inventoryType: string;
  inwardSrNo: string | null;
  inwardDate: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  currencyId: string;
  currency: string;
  itemName: string;
  itemCount?: number;
  amount: number;
  totalAmount: number;
  additionalChargesTotal: number;
  qcStatus: string;
  qcRemark: string | null;
  qcAttachmentUrl: string | null;
  remark: string | null;
  status: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface InwardListResponse {
  items: InwardListItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateInwardItemPayload {
  itemId?: string | null;
  itemName: string;
  itemCategoryId?: string | null;
  itemSubCategoryId?: string | null;
  hsnId?: string | null;
  hsnCode?: string | null;
  batchNo?: string | null;
  logCode?: string | null;
  bundleNumber?: string | null;
  palletNo?: string | null;
  noOfLeaves?: number | null;
  sheets?: number | null;
  totalSqMeter?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  thickness?: number | null;
  cbm?: number | null;
  rate?: number | null;
  amount: number;
  gstId?: string | null;
  cgst?: number;
  sgst?: number;
  igst?: number;
  totalAmount?: number;
  remark?: string | null;
}

export interface CreateInwardChargePayload {
  chargeName: string;
  amount: number;
}

export interface CreateInwardConsumablePayload {
  consumableName: string;
  price: number;
}

export interface CreateInwardPayload {
  warehouseId: string;
  inventoryType: InwardInventoryType;
  inwardDate: string;
  supplierId: string;
  invoiceNo: string;
  currencyId: string;
  mode?: string | null;
  eta?: string | null;
  etd?: string | null;
  attachmentUrl?: string | null;
  exchangeRate?: number | null;
  remarks?: string | null;
  items: CreateInwardItemPayload[];
  otherConsumables?: CreateInwardConsumablePayload[];
  additionalCharges?: CreateInwardChargePayload[];
}

export interface InwardItemDetail {
  id: string;
  sortOrder: number;
  itemId: string | null;
  itemName: string;
  itemCategoryId: string | null;
  itemCategoryName: string | null;
  itemSubCategoryId: string | null;
  itemSubCategoryName: string | null;
  hsnId: string | null;
  hsnCode: string | null;
  batchNo: string | null;
  logCode?: string | null;
  bundleNumber?: string | null;
  palletNo?: string | null;
  noOfLeaves?: number | null;
  sheets?: number | null;
  totalSqMeter?: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness?: number | null;
  cbm: number | null;
  rate: number | null;
  amount: number;
  gstId: string | null;
  gstPercentage: number | null;
  cgst: number;
  sgst: number;
  igst: number;
  totalAmount: number;
  remark: string | null;
  qcStatus: string;
  qcRemark: string | null;
  qcAttachmentUrl: string | null;
}

export interface InwardAdditionalChargeDetail {
  id: string;
  sortOrder: number;
  chargeName: string;
  amount: number;
}

export interface InwardOtherConsumableDetail {
  id: string;
  sortOrder: number;
  consumableName: string;
  price: number;
}

export interface InwardDetail {
  id: string;
  warehouseId: string;
  warehouseName: string;
  warehouseCity?: string | null;
  warehouseState?: string | null;
  storageWarehouseId?: string | null;
  storageWarehouseName?: string | null;
  storageWarehouseCity?: string | null;
  storageWarehouseState?: string | null;
  inventoryType: string;
  inwardSrNo: string | null;
  inwardDate: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  supplierState?: string | null;
  currencyId: string;
  currency: string;
  mode: string | null;
  eta: string | null;
  etd: string | null;
  attachmentUrl: string | null;
  exchangeRate: number | null;
  itemSubTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  otherConsumablesTotal: number;
  additionalChargesTotal: number;
  grandTotal: number;
  amount: number;
  totalAmount: number;
  remarks: string | null;
  remark: string | null;
  status: boolean;
  qcStatus: string;
  items: InwardItemDetail[];
  otherConsumables: InwardOtherConsumableDetail[];
  additionalCharges: InwardAdditionalChargeDetail[];
  createdAt: string;
  updatedAt: string;
}

export type UpdateInwardPayload = {
  inwardDate?: string;
  supplierId?: string;
  invoiceNo?: string;
  currencyId?: string;
  mode?: string | null;
  eta?: string | null;
  etd?: string | null;
  attachmentUrl?: string | null;
  exchangeRate?: number | null;
  remarks?: string | null;
  items?: CreateInwardItemPayload[];
  otherConsumables?: CreateInwardConsumablePayload[];
  additionalCharges?: CreateInwardChargePayload[];
};

export interface InwardQueryParams {
  warehouseId: string;
  inventoryType?: InwardInventoryType;
  page?: number;
  limit?: number;
  search?: string;
  qcStatus?: InwardQcStatus;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface InwardColumnDropdownResponse {
  column: string;
  options: Array<{ value: string; label: string }>;
}

const inventoryTypeBySlug: Record<string, InwardInventoryType> = {
  "veneer-blocks": "VENEER_BLOCKS",
  "raw-veneer": "RAW_VENEER",
  plywood: "PLYWOOD",
  mdf: "MDF",
};

export function getInwardInventoryTypeFromSlug(
  slug: string,
): InwardInventoryType | null {
  return inventoryTypeBySlug[slug] ?? null;
}

function formatAmount(value: number): string {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeListingQcStatus(value: string): "QC Done" | "Partially Done" | "Pending" {
  const normalized = value.trim().toLowerCase();
  if (
    normalized === "qc done" ||
    normalized === "done" ||
    normalized === "pass" ||
    normalized === "fail" ||
    normalized === "qc pass" ||
    normalized === "qc fail"
  ) {
    return "QC Done";
  }
  if (
    normalized === "partially done" ||
    normalized === "partial" ||
    normalized === "partial_done"
  ) {
    return "Partially Done";
  }
  return "Pending";
}

export function mapInwardListItemToRow(
  item: InwardListItem,
  inventorySlug: WarehouseInventoryRow["inventorySlug"] = "veneer-blocks",
): WarehouseInventoryRow {
  const inwardDate = item.inwardDate
    ? new Date(`${item.inwardDate}T00:00:00`)
    : new Date();

  const listingQcStatus = normalizeListingQcStatus(item.qcStatus);

  return {
    id: item.inwardId || item.id,
    inventoryRecordId: item.inwardId || item.id,
    inventorySlug,
    inwardSrNo: item.inwardSrNo ?? "",
    inwardType: item.inventoryType,
    inwardDate,
    invoiceNo: item.invoiceNo,
    referenceSrNo: "",
    supplierName: item.supplierName,
    supplierItemName: "",
    supplierCode: "",
    itemName: item.itemName ?? "",
    subCategory: "",
    unitName: "",
    color: "",
    palletNo: "",
    length: "",
    width: "",
    thickness: "",
    totalUnits: item.itemCount != null ? String(item.itemCount) : "",
    availableUnits: "",
    totalSqm: "",
    totalSqf: "",
    availableSqm: "",
    availableSqf: "",
    currency: item.currency,
    amount: formatAmount(item.amount),
    totalAmount: formatAmount(item.totalAmount),
    attachment: "",
    consumables: "",
    eta: null,
    etd: null,
    mode: "",
    qcStatus: listingQcStatus,
    qcRemark: item.qcRemark ?? "",
    remark: item.remark ?? "",
    status: listingQcStatus,
    veneerSrNo: "",
    itemSrNo: "",
    mdfSrNo: "",
    timberCode: "",
    logCode: "",
    bundleNumber: "",
    palletNumber: "",
    noOfLeaves: "",
    processName: "",
    processColor: "",
    cutName: "",
    seriesName: "",
    grade: "",
    expenseAmount: formatAmount(item.additionalChargesTotal),
    totalNoOfSheets: "",
    avSheets: "",
    avSqm: "",
    avSqf: "",
    plywoodType: "",
    mdfType: "",
  };
}

export async function fetchInwardsPaginated(
  params: InwardQueryParams,
): Promise<InwardListResponse> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  query.set("inventoryType", params.inventoryType ?? "VENEER_BLOCKS");
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.qcStatus) query.set("qcStatus", params.qcStatus);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const res = await apiRequest<ApiResponse<InwardListResponse>>(
    `${BASE_PATH}?${query.toString()}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to fetch inwards");
  }

  return res.data;
}

export async function exportInwardsApi(
  params: Omit<InwardQueryParams, "page" | "limit">,
): Promise<InwardListItem[]> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  query.set("inventoryType", params.inventoryType ?? "VENEER_BLOCKS");
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.qcStatus) query.set("qcStatus", params.qcStatus);
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const res = await apiRequest<ApiResponse<{ items: InwardListItem[] }>>(
    `${BASE_PATH}/export?${query.toString()}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to export inwards");
  }

  return res.data.items ?? [];
}

export async function fetchInwardColumnDropdown(params: {
  warehouseId: string;
  inventoryType?: InwardInventoryType;
  column: string;
}): Promise<InwardColumnDropdownResponse> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  query.set("inventoryType", params.inventoryType ?? "VENEER_BLOCKS");
  query.set("column", params.column);

  const res = await apiRequest<ApiResponse<InwardColumnDropdownResponse>>(
    `${BASE_PATH}/dropdowns?${query.toString()}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to fetch column filters");
  }

  return res.data;
}

export async function createInwardApi(payload: CreateInwardPayload) {
  const res = await apiRequest<ApiResponse<unknown>>(BASE_PATH, {
    method: "POST",
    body: payload,
  });

  if (!res?.success) {
    throw new Error(res?.message || "Failed to create inward");
  }

  return res.data;
}

export async function fetchInwardById(id: string): Promise<InwardDetail> {
  const res = await apiRequest<ApiResponse<InwardDetail>>(`${BASE_PATH}/${id}`);

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to load inward");
  }

  return res.data;
}

export async function updateInwardApi(id: string, payload: UpdateInwardPayload) {
  const res = await apiRequest<ApiResponse<InwardDetail>>(`${BASE_PATH}/${id}`, {
    method: "PATCH",
    body: payload,
  });

  if (!res?.success) {
    throw new Error(res?.message || "Failed to update inward");
  }

  return res.data;
}

export async function updateInwardQcStatusApi(
  itemId: string,
  payload: {
    qcStatus: InwardQcStatus;
    qcRemark?: string | null;
    qcAttachmentUrl?: string | null;
    storageWarehouseId?: string | null;
  },
) {
  const res = await apiRequest<ApiResponse<unknown>>(
    `${BASE_PATH}/items/${itemId}/qc-status`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  if (!res?.success) {
    throw new Error(res?.message || "Failed to update QC status");
  }

  return res.data;
}

export async function deleteInwardApi(id: string) {
  const res = await apiRequest<ApiResponse<unknown>>(`${BASE_PATH}/${id}`, {
    method: "DELETE",
  });

  if (!res?.success) {
    throw new Error(res?.message || "Failed to delete inward");
  }

  return res.data;
}
