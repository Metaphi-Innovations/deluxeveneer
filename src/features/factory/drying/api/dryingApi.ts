import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

const BASE_PATH = "/factory/drying";

export interface DryingIssueItem {
  id: string;
  storageWarehouseId: string;
  storageWarehouseName: string;
  storageItemId: string | null;
  storageSrNo: string | null;
  issuedDate: string;
  issueDate: string;
  processDate?: string;
  itemName: string;
  itemCategoryName: string | null;
  subCategory: string | null;
  colorName: string | null;
  logCode: string | null;
  batchNo: string | null;
  bundleNumber: string | null;
  palletNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  receivedLeaves: number;
  availableLeaves: number;
  noOfLeaves: number;
  receivedSqm: number;
  availableSqm: number;
  sqm: number;
  totalSqMeter: number;
  receivedSqf: number;
  availableSqf: number;
  sqf: number;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DryingDoneItem {
  id: string;
  doneId: string;
  dryingIssueId: string;
  storageItemId: string | null;
  storageSrNo: string | null;
  issuedDryingDate: string;
  issuedDate: string;
  dryingDate: string;
  processDate: string;
  issuedForInspectionDate: string | null;
  itemName: string;
  subCategory: string | null;
  colorName: string | null;
  logCode: string | null;
  batchNo: string | null;
  bundleNumber: string | null;
  palletNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  noOfLeaves: number;
  availableLeaves: number;
  totalSqMeter: number;
  sqm: number;
  sqf: number;
  previousAvailableLeaves: number;
  remainingAvailableLeaves: number;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DryingHistoryItem {
  id: string;
  dryingDoneId: string;
  dryingIssueId: string | null;
  storageItemId: string | null;
  storageSrNo: string | null;
  issuedDryingDate: string;
  issuedDate: string;
  dryingDate: string | null;
  processDate: string | null;
  itemName: string;
  subCategory: string | null;
  colorName: string | null;
  logCode: string | null;
  batchNo: string | null;
  bundleNumber: string | null;
  palletNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  noOfLeaves: number;
  totalSqMeter: number;
  sqm: number;
  sqf: number;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DryingRejectedItem {
  id: string;
  dryingDoneId: string;
  dryingIssueId: string | null;
  storageItemId: string | null;
  storageSrNo: string | null;
  rejectedDate: string;
  dryingDate: string | null;
  processDate: string | null;
  itemName: string;
  subCategory: string | null;
  colorName: string | null;
  logCode: string | null;
  batchNo: string | null;
  bundleNumber: string | null;
  palletNo: string | null;
  length: number | null;
  width: number | null;
  height: number | null;
  thickness: number | null;
  noOfLeaves: number;
  rejectedLeaves: number;
  totalSqMeter: number;
  rejectedSqm: number;
  sqm: number;
  sqf: number;
  rejectionReason: string | null;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DryingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface DryingListResponse<T> {
  items: T[];
  pagination: DryingPagination;
}

export interface DryingQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | "latest" | "ascending" | "descending" | undefined;
  warehouseId?: string | undefined;
  filters?: Record<string, unknown> | undefined;
}

// ── 1. Issued for Drying APIs ──────────────────────────────────────────

export async function fetchDryingIssued(
  params: DryingQueryParams = {}
): Promise<DryingListResponse<DryingIssueItem>> {
  const hasFilters = Boolean(params.filters && Object.keys(params.filters).length > 0);
  if (hasFilters) {
    const body: Record<string, unknown> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      filters: params.filters,
    };
    if (params.search?.trim()) body.search = params.search.trim();
    if (params.sortBy) body.sortBy = params.sortBy;
    if (params.sortOrder) body.sortOrder = params.sortOrder;
    if (params.warehouseId) body.warehouseId = params.warehouseId;

    const response = await apiRequest<ApiResponse<DryingListResponse<DryingIssueItem>>>(
      `${BASE_PATH}/issued/filter`,
      {
        method: "POST",
        body,
        cache: "no-store",
      }
    );
    return response.data;
  }

  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);

  const endpoint = `${BASE_PATH}/issued?${query.toString()}`;
  const response = await apiRequest<ApiResponse<DryingListResponse<DryingIssueItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchDryingIssuedById(id: string): Promise<DryingIssueItem> {
  const endpoint = `${BASE_PATH}/issued/${id}`;
  const response = await apiRequest<ApiResponse<DryingIssueItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function issueDryingFromStorageApi(payload: {
  storageItemIds: string[];
  issueDate?: string;
  remark?: string;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/issue-from-storage`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function createDryingProcessApi(payload: {
  issueId: string;
  dryingDate: string;
  leavesToIssue: number;
  remark?: string;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/create-process`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function revertDryingIssueApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/issued/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function fetchDryingEligibleStorageItems(params?: {
  search?: string;
  warehouseId?: string;
  page?: number;
  limit?: number;
}): Promise<{ items: any[]; pagination: DryingPagination }> {
  const query = new URLSearchParams();
  if (params?.search) query.set("search", params.search);
  if (params?.warehouseId) query.set("warehouseId", params.warehouseId);
  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const endpoint = `${BASE_PATH}/storage-items?${query.toString()}`;
  const response = await apiRequest<ApiResponse<{ items: any[]; pagination: DryingPagination }>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

// ── 2. Drying Done APIs ──────────────────────────────────────────────────

export async function fetchDryingDone(
  params: DryingQueryParams = {}
): Promise<DryingListResponse<DryingDoneItem>> {
  const hasFilters = Boolean(params.filters && Object.keys(params.filters).length > 0);
  if (hasFilters) {
    const body: Record<string, unknown> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      filters: params.filters,
    };
    if (params.search?.trim()) body.search = params.search.trim();
    if (params.sortBy) body.sortBy = params.sortBy;
    if (params.sortOrder) body.sortOrder = params.sortOrder;
    if (params.warehouseId) body.warehouseId = params.warehouseId;

    const response = await apiRequest<ApiResponse<DryingListResponse<DryingDoneItem>>>(
      `${BASE_PATH}/done/filter`,
      {
        method: "POST",
        body,
        cache: "no-store",
      }
    );
    return response.data;
  }

  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);

  const endpoint = `${BASE_PATH}/done?${query.toString()}`;
  const response = await apiRequest<ApiResponse<DryingListResponse<DryingDoneItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchDryingDoneById(id: string): Promise<DryingDoneItem> {
  const endpoint = `${BASE_PATH}/done/${id}`;
  const response = await apiRequest<ApiResponse<DryingDoneItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function editDryingDoneApi(
  id: string,
  payload: { dryingDate?: string; noOfLeaves?: number; remark?: string }
): Promise<any> {
  const endpoint = `${BASE_PATH}/done/${id}`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "PUT",
    body: payload,
  });
  return response.data;
}

export async function revertDryingDoneApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/done/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function rejectDryingDoneApi(
  id: string,
  payload: { rejectedLeaves: number; rejectionReason?: string; remark?: string }
): Promise<any> {
  const endpoint = `${BASE_PATH}/done/${id}/reject`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function issueDryingForInspectionApi(payload: {
  doneIds: string[];
  inspectionDate?: string;
  remark?: string;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/issue-for-inspection`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

// ── 3. Drying History APIs ──────────────────────────────────────────────

export async function fetchDryingHistory(
  params: DryingQueryParams = {}
): Promise<DryingListResponse<DryingHistoryItem>> {
  const hasFilters = Boolean(params.filters && Object.keys(params.filters).length > 0);
  if (hasFilters) {
    const body: Record<string, unknown> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      filters: params.filters,
    };
    if (params.search?.trim()) body.search = params.search.trim();
    if (params.sortBy) body.sortBy = params.sortBy;
    if (params.sortOrder) body.sortOrder = params.sortOrder;

    const response = await apiRequest<ApiResponse<DryingListResponse<DryingHistoryItem>>>(
      `${BASE_PATH}/history/filter`,
      {
        method: "POST",
        body,
        cache: "no-store",
      }
    );
    return response.data;
  }

  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const endpoint = `${BASE_PATH}/history?${query.toString()}`;
  const response = await apiRequest<ApiResponse<DryingListResponse<DryingHistoryItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchDryingHistoryById(id: string): Promise<DryingHistoryItem> {
  const endpoint = `${BASE_PATH}/history/${id}`;
  const response = await apiRequest<ApiResponse<DryingHistoryItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

// ── 4. Drying Rejected APIs ─────────────────────────────────────────────

export async function fetchDryingRejected(
  params: DryingQueryParams = {}
): Promise<DryingListResponse<DryingRejectedItem>> {
  const hasFilters = Boolean(params.filters && Object.keys(params.filters).length > 0);
  if (hasFilters) {
    const body: Record<string, unknown> = {
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
      filters: params.filters,
    };
    if (params.search?.trim()) body.search = params.search.trim();
    if (params.sortBy) body.sortBy = params.sortBy;
    if (params.sortOrder) body.sortOrder = params.sortOrder;

    const response = await apiRequest<ApiResponse<DryingListResponse<DryingRejectedItem>>>(
      `${BASE_PATH}/rejected/filter`,
      {
        method: "POST",
        body,
        cache: "no-store",
      }
    );
    return response.data;
  }

  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);

  const endpoint = `${BASE_PATH}/rejected?${query.toString()}`;
  const response = await apiRequest<ApiResponse<DryingListResponse<DryingRejectedItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchDryingRejectedById(id: string): Promise<DryingRejectedItem> {
  const endpoint = `${BASE_PATH}/rejected/${id}`;
  const response = await apiRequest<ApiResponse<DryingRejectedItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function revertDryingRejectedApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/rejected/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

// ── 5. Dropdowns API ────────────────────────────────────────────────────

export async function fetchDryingDropdowns(tab: string, column?: string): Promise<any> {
  const query = new URLSearchParams({ tab });
  if (column) query.set("column", column);
  const endpoint = `${BASE_PATH}/dropdowns?${query.toString()}`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function exportDryingDataApi(
  tab: "issued" | "done" | "history" | "rejected" = "done",
  params: DryingQueryParams = {}
): Promise<any[]> {
  const body: Record<string, unknown> = {};
  if (params.search?.trim()) body.search = params.search.trim();
  if (params.sortBy) body.sortBy = params.sortBy;
  if (params.sortOrder) body.sortOrder = params.sortOrder;
  if (params.warehouseId) body.warehouseId = params.warehouseId;
  if (params.filters && Object.keys(params.filters).length > 0) {
    body.filters = params.filters;
  }

  const endpoint = `${BASE_PATH}/${tab}/export`;
  const response = await apiRequest<ApiResponse<any[]>>(endpoint, {
    method: "POST",
    body,
  });
  return response.data || [];
}

