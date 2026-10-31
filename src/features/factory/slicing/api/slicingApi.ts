import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

const BASE_PATH = "/factory/slicing";

export interface SlicingIssueItem {
  id: string;
  storageWarehouseId: string;
  storageWarehouseName: string;
  storageItemId: string | null;
  storageSrNo: string | null;
  issuedDate: string;
  processDate: string;
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
  cbm: number | null;
  receivedCbm: number | null;
  availableCbm: number | null;
  cbf: number | null;
  receivedCbf: number | null;
  availableCbf: number | null;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlicingDoneItem {
  id: string;
  doneId: string;
  sourceIssueId: string | null;
  storageWarehouseId: string;
  storageWarehouseName: string;
  storageItemId: string | null;
  storageSrNo: string | null;
  issuedDate: string;
  slicingDate: string;
  processDate: string;
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
  cbm: number | null;
  cbf: number | null;
  noOfLeaves: number;
  receivedLeaves: number;
  availableLeaves: number;
  sqm: number;
  sqf: number;
  totalSqMeter: number;
  receivedSqm: number;
  availableSqm: number;
  receivedSqf: number;
  availableSqf: number;
  ratePerCbf: number | null;
  amount: number;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlicingHistoryItem {
  id: string;
  outputDetailId: string;
  storageSrNo: string | null;
  issuedDate: string;
  slicingDate: string | null;
  itemName: string | null;
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
  cbm: number | null;
  cbf: number | null;
  noOfLeaves: number;
  sqm: number;
  sqf: number;
  totalSqMeter: number;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlicingRejectedItem {
  id: string;
  slicingDoneId: string;
  storageSrNo: string | null;
  rejectedDate: string;
  slicingDate: string | null;
  itemName: string | null;
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
  cbm: number | null;
  cbf: number | null;
  noOfLeaves: number | null;
  sqm: number | null;
  sqf: number | null;
  totalSqMeter: number | null;
  remark: string | null;
  status: string;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SlicingPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SlicingListResponse<T> {
  items: T[];
  pagination: SlicingPagination;
}

export interface SlicingQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | "latest" | "ascending" | "descending" | undefined;
  warehouseId?: string | undefined;
  filters?: Record<string, unknown> | undefined;
}

// ── 1. Issued for Slicing APIs ──────────────────────────────────────────

export async function fetchSlicingIssued(
  params: SlicingQueryParams = {}
): Promise<SlicingListResponse<SlicingIssueItem>> {
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

    const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingIssueItem>>>(
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
  const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingIssueItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchSlicingIssuedById(id: string): Promise<SlicingIssueItem> {
  const endpoint = `${BASE_PATH}/issued/${id}`;
  const response = await apiRequest<ApiResponse<SlicingIssueItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function issueSlicingFromStorageApi(payload: {
  storageItemIds: string[];
  remark?: string | undefined;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/issue-from-storage`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function createSlicingProcessApi(payload: {
  issueId: string;
  slicingDate?: string | undefined;
  processDate?: string | undefined;
  remark?: string | undefined;
  previousAvailableCbm?: number | string | undefined;
  processedItems: Array<{
    logCode?: string | undefined;
    batchNo?: string | undefined;
    bundleNumber?: string | undefined;
    palletNo?: string | undefined;
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    thickness?: number | undefined;
    cbm?: number | string | undefined;
    cbf?: number | string | undefined;
    noOfLeaves: number;
    sqm?: number | string | undefined;
    sqf?: number | string | undefined;
    totalSqMeter?: number | string | undefined;
    ratePerCbf?: number | undefined;
    amount?: number | undefined;
    remark?: string | undefined;
  }>;
  rejected?: {
    logCode?: string | undefined;
    batchNo?: string | undefined;
    bundleNumber?: string | undefined;
    palletNo?: string | undefined;
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    thickness?: number | undefined;
    cbm?: number | string | undefined;
    cbf?: number | string | undefined;
    noOfLeaves?: number | undefined;
    sqm?: number | string | undefined;
    sqf?: number | string | undefined;
    totalSqMeter?: number | string | undefined;
    remark?: string | undefined;
  } | null | undefined;
  remaining?: {
    length?: number | undefined;
    width?: number | undefined;
    height?: number | undefined;
    thickness?: number | undefined;
    cbm?: number | string | undefined;
    cbf?: number | string | undefined;
  } | undefined;
  rejectAvailableItems?: Array<any> | undefined;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/create-process`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function revertSlicingIssueApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/issued/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

// ── 2. Slicing Done APIs ────────────────────────────────────────────────

export async function fetchSlicingDone(
  params: SlicingQueryParams = {}
): Promise<SlicingListResponse<SlicingDoneItem>> {
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

    const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingDoneItem>>>(
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
  const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingDoneItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchSlicingDoneById(id: string): Promise<SlicingDoneItem> {
  const endpoint = `${BASE_PATH}/done/${id}`;
  const response = await apiRequest<ApiResponse<SlicingDoneItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function editSlicingDoneApi(
  id: string,
  payload: {
    slicingDate?: string | undefined;
    processDate?: string | undefined;
    remark?: string | undefined;
    outputs?: Array<{
      id: string;
      logCode?: string | undefined;
      batchNo?: string | undefined;
      bundleNumber?: string | undefined;
      palletNo?: string | undefined;
      length?: number | undefined;
      width?: number | undefined;
      height?: number | undefined;
      thickness?: number | undefined;
      cbm?: number | string | undefined;
      cbf?: number | string | undefined;
      noOfLeaves?: number | undefined;
      sqm?: number | string | undefined;
      sqf?: number | string | undefined;
      totalSqMeter?: number | string | undefined;
      ratePerCbf?: number | undefined;
      amount?: number | undefined;
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

export async function revertSlicingDoneApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/done/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

export async function issueSlicingForDryingApi(payload: {
  outputDetailIds?: string[] | undefined;
  doneItemIds?: string[] | undefined;
  remark?: string | undefined;
}): Promise<any> {
  const endpoint = `${BASE_PATH}/issue-for-drying`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

export async function rejectSlicingDoneApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/done/${id}/reject`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

// ── 3. Slicing History APIs ─────────────────────────────────────────────

export async function fetchSlicingHistory(
  params: SlicingQueryParams = {}
): Promise<SlicingListResponse<SlicingHistoryItem>> {
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

    const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingHistoryItem>>>(
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
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);

  const endpoint = `${BASE_PATH}/history?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingHistoryItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchSlicingHistoryById(id: string): Promise<SlicingHistoryItem> {
  const endpoint = `${BASE_PATH}/history/${id}`;
  const response = await apiRequest<ApiResponse<SlicingHistoryItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

// ── 4. Slicing Rejected APIs ────────────────────────────────────────────

export async function fetchSlicingRejected(
  params: SlicingQueryParams = {}
): Promise<SlicingListResponse<SlicingRejectedItem>> {
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

    const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingRejectedItem>>>(
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
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);

  const endpoint = `${BASE_PATH}/rejected?${query.toString()}`;
  const response = await apiRequest<ApiResponse<SlicingListResponse<SlicingRejectedItem>>>(
    endpoint,
    { method: "GET", cache: "no-store" }
  );
  return response.data;
}

export async function fetchSlicingRejectedById(id: string): Promise<SlicingRejectedItem> {
  const endpoint = `${BASE_PATH}/rejected/${id}`;
  const response = await apiRequest<ApiResponse<SlicingRejectedItem>>(endpoint, {
    method: "GET",
  });
  return response.data;
}

export async function revertSlicingRejectedApi(id: string, remark?: string): Promise<void> {
  const endpoint = `${BASE_PATH}/rejected/${id}/revert`;
  await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body: { remark },
  });
}

// ── Dropdowns & Export APIs ─────────────────────────────────────────────

export async function fetchSlicingDropdownsApi(
  tab: "issued" | "done" | "history" | "rejected" = "issued",
  column?: string
): Promise<{
  itemNames: string[];
  logCodes: string[];
  bundleNumbers: string[];
  palletNos: string[];
  options?: string[];
}> {
  const query = new URLSearchParams({ tab });
  if (column) query.set("column", column);
  const endpoint = `${BASE_PATH}/dropdowns?${query.toString()}`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, { method: "GET" });
  return response.data;
}

export async function exportSlicingDataApi(
  tab: "issued" | "done" | "history" | "rejected" = "done",
  params: SlicingQueryParams = {}
): Promise<any[]> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.sortBy) query.set("sortBy", params.sortBy);
  if (params.sortOrder) query.set("sortOrder", params.sortOrder);
  if (params.warehouseId) query.set("warehouseId", params.warehouseId);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set("filters", JSON.stringify(params.filters));
  }

  const endpoint = `${BASE_PATH}/${tab}/export?${query.toString()}`;
  const response = await apiRequest<ApiResponse<any[]>>(endpoint, { method: "GET" });
  return response.data || [];
}

