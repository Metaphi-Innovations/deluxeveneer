import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

const BASE_PATH = "/factory/sawing";

export interface SawingIssueItem {
  id: string;
  issueId: string;
  sawingSrNo: string | null;
  storageWarehouseId: string;
  storageWarehouseName: string;
  storageItemId: string | null;
  storageSrNo: string | null;
  issueDate: string;
  processDate: string;
  itemName: string;
  itemCategoryName: string | null;
  subCategory: string | null;
  colorName: string | null;
  batchNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  cbm: number | null;
  receivedCbm: number | null;
  availableCbm: number | null;
  cbf: number | null;
  ratePerCbf: number | null;
  amount: number;
  totalAmount: number;
  remark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SawingDoneItem {
  id: string;
  doneId: string;
  sawingSrNo: string | null;
  sourceIssueId: string | null;
  storageWarehouseId: string;
  storageWarehouseName: string;
  issuedDate: string;
  processDate: string;
  completedDate: string;
  itemName: string;
  subCategory: string | null;
  batchNo: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  cbm: number | null;
  cbf: number | null;
  receivedCbm: number | null;
  availableCbm: number | null;
  ratePerCbf: number | null;
  amount: number;
  totalAmount: number;
  remark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SawingHistoryItem {
  id: string;
  eventType: string;
  sawingSrNo: string | null;
  processDate: string;
  itemName: string | null;
  batchNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  cbm: number | null;
  cbf: number | null;
  ratePerCbf: number | null;
  amount: number | null;
  totalAmount: number | null;
  remark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface SawingRejectedItem {
  id: string;
  sawingSrNo: string | null;
  processDate: string;
  itemName: string | null;
  batchNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  cbm: number | null;
  cbf: number | null;
  remark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface SawingAvailableItem {
  id: string;
  sawingSrNo: string | null;
  processDate: string;
  itemName: string | null;
  batchNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  availableCbm: number;
  availableCbf: number;
  remark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface SawingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SawingListResponse<T> {
  items: T[];
  pagination: SawingPagination;
}

export interface SawingQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  warehouseId?: string;
  filters?: Record<string, unknown>;
}

// ── API Methods ───────────────────────────────────────────────────

export async function fetchSawingIssued(
  params: SawingQueryParams = {}
): Promise<SawingListResponse<SawingIssueItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const endpoint = `${BASE_PATH}/issued?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SawingListResponse<SawingIssueItem>>>(
    endpoint,
    { method: "GET" }
  );
  return response.data;
}

export async function issueSawingFromStorageApi(
  storageItemIds: string[],
  remark?: string
): Promise<any> {
  const endpoint = `${BASE_PATH}/issue-from-storage`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { storageItemIds, remark },
  });
  return response.data;
}

export async function revertSawingIssueApi(
  issueItemId: string,
  remark?: string
): Promise<void> {
  const endpoint = `${BASE_PATH}/issued/${issueItemId}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function createSawingProcessApi(data: {
  issueId?: string;
  issueItemId?: string;
  storageWarehouseId?: string;
  processDate?: string;
  remark?: string;
  processedItems: Array<{
    batchNo?: string;
    length: number;
    width: number;
    thickness: number;
    cbm?: number;
    cbf?: number;
    ratePerCbf?: number;
    amount?: number;
    remark?: string;
  }>;
  rejectAvailableItems?: Array<{
    type: string;
    length?: number;
    width?: number;
    height?: number;
    thickness?: number;
    cbm?: number;
    cbf?: number;
    amount?: number;
    remark?: string;
  }>;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/create-process`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: data,
  });
  return response.data;
}

export async function fetchSawingDone(
  params: SawingQueryParams = {}
): Promise<SawingListResponse<SawingDoneItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const endpoint = `${BASE_PATH}/done?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SawingListResponse<SawingDoneItem>>>(
    endpoint,
    { method: "GET" }
  );
  return response.data;
}

export async function revertSawingDoneApi(
  doneItemId: string,
  remark?: string
): Promise<void> {
  const endpoint = `${BASE_PATH}/done/${doneItemId}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function rejectSawingDoneApi(
  doneItemId: string,
  remark?: string
): Promise<void> {
  const endpoint = `${BASE_PATH}/done/${doneItemId}/reject`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function issueSawingForInspectionApi(
  doneItemIds: string[],
  remark?: string
): Promise<void> {
  const endpoint = `${BASE_PATH}/issue-for-inspection`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { doneItemIds, remark },
  });
}

export async function fetchSawingHistory(
  params: SawingQueryParams = {}
): Promise<SawingListResponse<SawingHistoryItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());

  const endpoint = `${BASE_PATH}/history?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SawingListResponse<SawingHistoryItem>>>(
    endpoint,
    { method: "GET" }
  );
  return response.data;
}

export async function fetchSawingRejected(
  params: SawingQueryParams = {}
): Promise<SawingListResponse<SawingRejectedItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());

  const endpoint = `${BASE_PATH}/rejected?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SawingListResponse<SawingRejectedItem>>>(
    endpoint,
    { method: "GET" }
  );
  return response.data;
}

export async function fetchSawingAvailable(
  params: SawingQueryParams = {}
): Promise<SawingListResponse<SawingAvailableItem>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());

  const endpoint = `${BASE_PATH}/available?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SawingListResponse<SawingAvailableItem>>>(
    endpoint,
    { method: "GET" }
  );
  return response.data;
}
