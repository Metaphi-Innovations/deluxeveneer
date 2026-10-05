import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";
import type { WarehouseInventoryRow } from "../../shared/warehouseTableData";

const BASE_PATH = "/warehouse/storage";

export interface StorageInventoryItem {
  id: string;
  inwardId: string;
  inwardItemId: string;
  inwardWarehouseId: string;
  inwardWarehouseName: string;
  inventoryType: string;
  storageSrNo?: string | null;
  inwardSrNo: string | null;
  inwardDate: string;
  invoiceNo: string;
  supplierId: string;
  supplierName: string;
  currencyId: string;
  currency: string;
  itemId: string | null;
  itemName: string;
  itemCategoryId: string | null;
  itemCategoryName: string | null;
  itemSubCategoryId: string | null;
  itemSubCategoryName: string | null;
  hsnCode: string | null;
  batchNo: string | null;
  logCode: string | null;
  bundleNumber: string | null;
  palletNo: string | null;
  noOfLeaves: number | null;
  sheets: number | null;
  totalSqMeter: number | null;
  receivedQuantity?: number | null;
  availableQuantity?: number | null;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  cbm: number | null;
  rate: number | null;
  amount: number;
  totalAmount: number;
  qcStatus: string;
  qcRemark: string | null;
  remark: string | null;
  issueTo?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StorageInventoryListResponse {
  items: StorageInventoryItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface StorageQueryParams {
  warehouseId: string;
  section?: "inventory" | "history";
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface StorageColumnDropdownResponse {
  column: string;
  options: Array<{ value: string; label: string }>;
}

function formatAmount(value: number | null | undefined): string {
  if (value == null) return "0.00";
  return Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function mapStorageItemToRow(
  item: StorageInventoryItem,
  inventorySlug: WarehouseInventoryRow["inventorySlug"] = "veneer-blocks"
): WarehouseInventoryRow {
  const inwardDate = item.inwardDate
    ? new Date(`${item.inwardDate}T00:00:00`)
    : new Date();

  return {
    id: item.id,
    inventoryRecordId: item.id,
    inventorySlug,
    storageSrNo: item.storageSrNo ?? "",
    inwardSrNo: item.inwardSrNo ?? "",
    inwardType: item.inventoryType,
    inwardDate,
    invoiceNo: item.invoiceNo ?? "",
    referenceSrNo: item.inwardId ?? "",
    supplierName: item.supplierName ?? "",
    supplierItemName: "",
    supplierCode: "",
    itemName: item.itemName ?? "",
    subCategory: item.itemSubCategoryName ?? "",
    unitName: "",
    color: "",
    palletNo: item.palletNo ?? "",
    length: item.length != null ? `${item.length} mm` : "",
    width: item.width != null ? `${item.width} mm` : "",
    thickness: item.thickness != null ? `${item.thickness} mm` : "",
    totalUnits: (() => {
      // Received stock unit: raw veneer = leaves; plywood/mdf = sheets.
      if (item.receivedQuantity != null) return String(item.receivedQuantity);
      if (inventorySlug === "raw-veneer") {
        return item.noOfLeaves != null ? String(item.noOfLeaves) : "";
      }
      if (inventorySlug === "plywood" || inventorySlug === "mdf") {
        return item.sheets != null ? String(item.sheets) : "";
      }
      return item.sheets != null
        ? String(item.sheets)
        : item.noOfLeaves != null
          ? String(item.noOfLeaves)
          : item.cbm != null
            ? String(item.cbm)
            : "";
    })(),
    availableUnits: (() => {
      // Available stock unit: raw veneer = leaves; plywood/mdf = sheets.
      if (item.availableQuantity != null) return String(item.availableQuantity);
      if (inventorySlug === "raw-veneer") {
        return item.noOfLeaves != null ? String(item.noOfLeaves) : "";
      }
      if (inventorySlug === "plywood" || inventorySlug === "mdf") {
        return item.sheets != null ? String(item.sheets) : "";
      }
      return item.sheets != null
        ? String(item.sheets)
        : item.noOfLeaves != null
          ? String(item.noOfLeaves)
          : item.cbm != null
            ? String(item.cbm)
            : "";
    })(),
    totalSqm: item.totalSqMeter != null ? String(item.totalSqMeter) : "",
    totalSqf:
      item.totalSqMeter != null
        ? (Number(item.totalSqMeter) * 10.7639).toFixed(3)
        : "",
    availableSqm: item.totalSqMeter != null ? String(item.totalSqMeter) : "",
    availableSqf:
      item.totalSqMeter != null
        ? (Number(item.totalSqMeter) * 10.7639).toFixed(3)
        : "",
    currency: item.currency ?? "",
    amount: formatAmount(item.amount),
    totalAmount: formatAmount(item.totalAmount),
    attachment: "",
    consumables: "",
    eta: null,
    etd: null,
    mode: "",
    qcStatus: item.qcStatus ?? "Pass",
    qcRemark: item.qcRemark ?? "",
    remark: item.remark ?? "",
    status: item.qcStatus ?? "Pass",
    veneerSrNo: "",
    itemSrNo: "",
    mdfSrNo: "",
    timberCode: "",
    logCode: item.logCode ?? "",
    bundleNumber: item.bundleNumber ?? "",
    palletNumber: item.palletNo ?? "",
    noOfLeaves: item.noOfLeaves != null ? String(item.noOfLeaves) : "",
    processName: "",
    processColor: "",
    cutName: "",
    seriesName: "",
    grade: "",
    expenseAmount: "0.00",
    totalNoOfSheets: item.sheets != null ? String(item.sheets) : "",
    avSheets: item.sheets != null ? String(item.sheets) : "",
    avSqm: item.totalSqMeter != null ? String(item.totalSqMeter) : "",
    avSqf:
      item.totalSqMeter != null
        ? (Number(item.totalSqMeter) * 10.7639).toFixed(3)
        : "",
    plywoodType: "",
    mdfType: "",
    issueTo: item.issueTo || "",
    updatedBy: item.updatedBy ?? "",
  };
}

export async function fetchStorageInventoryPaginated(
  tabSlug: string,
  params: StorageQueryParams
): Promise<StorageInventoryListResponse> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  if (params.section) query.set("section", params.section);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const endpoint = `${BASE_PATH}/${tabSlug}?${query.toString()}`;
  const response = await apiRequest<ApiResponse<StorageInventoryListResponse>>(
    endpoint,
    { method: "GET" }
  );

  return response.data;
}

export async function fetchStorageColumnDropdown(
  tabSlug: string,
  warehouseId: string,
  column: string,
  section?: "inventory" | "history"
): Promise<StorageColumnDropdownResponse> {
  const query = new URLSearchParams({
    warehouseId,
    column,
    ...(section ? { section } : {}),
  });

  const endpoint = `${BASE_PATH}/${tabSlug}/dropdowns?${query.toString()}`;
  const response = await apiRequest<ApiResponse<StorageColumnDropdownResponse>>(
    endpoint,
    { method: "GET" }
  );

  return response.data;
}

export async function exportStorageInventoryApi(
  tabSlug: string,
  params: Omit<StorageQueryParams, "page" | "limit">
): Promise<StorageInventoryItem[]> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  if (params.section) query.set("section", params.section);
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const endpoint = `${BASE_PATH}/${tabSlug}/export?${query.toString()}`;
  const response = await apiRequest<ApiResponse<{ items: StorageInventoryItem[] }>>(
    endpoint,
    { method: "GET" }
  );

  return response.data.items;
}

export async function revertStorageItemApi(
  tabSlug: string,
  id: string,
  remark?: string | null
): Promise<void> {
  const endpoint = `${BASE_PATH}/${tabSlug}/${id}/revert`;
  await apiRequest<ApiResponse<{ id: string }>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function issueVeneerBlocksToSlicingApi(
  ids: string[],
  remark?: string | null
): Promise<void> {
  const endpoint = `${BASE_PATH}/veneer-blocks/issue-to-slicing`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { ids, remark },
  });
}

export interface StorageProductionWarehouseOption {
  id: string;
  name: string;
  code: string;
  city: string | null;
  state: string | null;
}

export interface StorageProductionWarehousesResponse {
  storageWarehouseId: string;
  storageCity: string | null;
  storageState: string | null;
  suggestedWarehouseId: string | null;
  items: StorageProductionWarehouseOption[];
}

export async function fetchStorageProductionWarehouses(
  warehouseId: string
): Promise<StorageProductionWarehousesResponse> {
  const query = new URLSearchParams({
    storageWarehouseId: warehouseId,
    warehouseId,
  });
  const endpoint = `${BASE_PATH}/production-warehouses?${query.toString()}`;
  const response = await apiRequest<ApiResponse<StorageProductionWarehousesResponse>>(
    endpoint,
    { method: "GET" }
  );
  return response.data;
}

export async function moveStorageItemToProductionApi(
  tabSlug: string,
  id: string,
  data: {
    productionWarehouseId: string;
    gradeId: string;
    quantity?: number | null;
    remark?: string | null;
  }
): Promise<void> {
  const endpoint = `${BASE_PATH}/${tabSlug}/${id}/move-to-production`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: data,
  });
}
