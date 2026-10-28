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
  storageSrNo: string | null;
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
  storageSrNo: string | null;
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
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  warehouseId?: string | undefined;
  filters?: Record<string, unknown> | undefined;
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
  remark?: string | undefined
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
  remark?: string | undefined
): Promise<void> {
  const endpoint = `${BASE_PATH}/issued/${issueItemId}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function createSawingProcessApi(data: {
  issueId?: string | undefined;
  issueItemId?: string | undefined;
  storageWarehouseId?: string | undefined;
  processDate?: string | undefined;
  remark?: string | undefined;
  processedItems: Array<{
    batchNo?: string | undefined;
    length: number;
    width: number;
    thickness: number;
    cbm?: number | undefined;
    cbf?: number | undefined;
    receivedCbm?: number | undefined;
    availableCbm?: number | undefined;
    ratePerCbf?: number | undefined;
    ratePerCbm?: number | undefined;
    amount?: number | undefined;
    remark?: string | undefined;
  }>;
  rejectAvailableItems?: Array<{
    type: string;
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    thickness?: number | undefined;
    cbm?: number | undefined;
    cbf?: number | undefined;
    amount?: number | undefined;
    remark?: string | undefined;
  }> | undefined;
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

export async function fetchSawingIssuedById(id: string): Promise<SawingIssueItem> {
  const endpoint = `${BASE_PATH}/issued/${id}`;
  const response = await apiRequest<ApiResponse<SawingIssueItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function fetchSawingDoneById(id: string): Promise<SawingDoneItem> {
  const endpoint = `${BASE_PATH}/done/${id}`;
  const response = await apiRequest<ApiResponse<SawingDoneItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function fetchSawingHistoryById(id: string): Promise<SawingHistoryItem> {
  const endpoint = `${BASE_PATH}/history/${id}`;
  const response = await apiRequest<ApiResponse<SawingHistoryItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function fetchSawingRejectedById(id: string): Promise<SawingRejectedItem> {
  const endpoint = `${BASE_PATH}/rejected/${id}`;
  const response = await apiRequest<ApiResponse<SawingRejectedItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function editSawingDoneApi(
  id: string,
  payload: {
    sawingDate?: string | undefined;
    processDate?: string | undefined;
    remark?: string | undefined;
    outputs?: Array<{
      id: string;
      batchNo?: string | undefined;
      length?: number | undefined;
      width?: number | undefined;
      thickness?: number | undefined;
      cbm?: number | undefined;
      cbf?: number | undefined;
      remark?: string | undefined;
    }> | undefined;
  }
): Promise<any> {
  const endpoint = `${BASE_PATH}/done/${id}`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function revertSawingRejectedApi(
  id: string,
  remark?: string
): Promise<void> {
  const endpoint = `${BASE_PATH}/rejected/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function fetchSawingDropdownsApi(
  tab: "issued" | "done" | "history" | "rejected" = "issued"
): Promise<{
  itemNames: string[];
  batchNos: string[];
  subCategories: string[];
}> {
  const endpoint = `${BASE_PATH}/dropdowns?tab=${tab}`;
  const response = await apiRequest<
    ApiResponse<{
      itemNames: string[];
      batchNos: string[];
      subCategories: string[];
    }>
  >(endpoint, { method: "GET" });
  return response.data;
}

