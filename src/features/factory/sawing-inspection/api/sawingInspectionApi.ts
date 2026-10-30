import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

const BASE_PATH = "/factory/sawing-inspection";

export interface SawingInspectionPendingItem {
  id: string;
  sawingHistoryId: string;
  storageSrNo: string | null;
  issuedDate: string;
  sawingDate: string | null;
  blockIssuedDate: string | null;
  itemName: string;
  subCategory: string | null;
  itemCategoryName: string | null;
  colorName: string | null;
  logNo: string | null;
  batchNo: string | null;
  batchNoCode: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  cbm: number;
  cbf: number;
  qcStatus: string;
  remark: string | null;
  sourceRemark: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface SawingInspectionDoneItem {
  id: string;
  inspectionId: string;
  storageSrNo: string | null;
  inspectionDate: string;
  sawingDate: string | null;
  blockIssuedDate: string | null;
  inspectionIssuedDate: string | null;
  itemName: string;
  subCategory: string | null;
  itemCategoryName: string | null;
  colorName: string | null;
  logNo: string | null;
  batchNo: string | null;
  batchNoCode: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  cbm: number;
  cbf: number;
  qcStatus: string;
  productionWarehouseId: string | null;
  productionWarehouseName: string | null;
  productionSrNo: string | null;
  transferDate: string | null;
  isTransferred: boolean;
  remark: string | null;
  sourceRemark: string | null;
  inspectedBy: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface SawingInspectionFailItem {
  id: string;
  inspectionId: string;
  storageSrNo: string | null;
  inspectionDate: string;
  issuedDate: string | null;
  sawingDate: string | null;
  itemName: string;
  subCategory: string | null;
  itemCategoryName: string | null;
  colorName: string | null;
  logNo: string | null;
  batchNo: string | null;
  batchNoCode: string | null;
  length: number | null;
  width: number | null;
  thickness: number | null;
  cbm: number;
  cbf: number;
  qcStatus: string;
  remark: string | null;
  sourceRemark: string | null;
  inspectedBy: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
}

export interface SawingInspectionDropdowns {
  storageSrNos: string[];
  itemNames: string[];
  subCategories: string[];
  logNos: string[];
  batchNos: string[];
  remarks: string[];
}

export interface SawingInspectionPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface SawingInspectionListResponse<T> {
  items: T[];
  pagination: SawingInspectionPagination;
}

export interface SawingInspectionQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  warehouseId?: string | undefined;
  filters?: Record<string, unknown> | undefined;
}

// ---------------------------------------------------------------------------
// A. Inspection Pending APIs
// ---------------------------------------------------------------------------

export async function fetchSawingInspectionPending(
  params: SawingInspectionQueryParams = {}
): Promise<SawingInspectionListResponse<SawingInspectionPendingItem>> {
  const hasFilterOrSort = Boolean(
    (params.filters && Object.keys(params.filters).length > 0) ||
      params.sortBy ||
      params.sortOrder ||
      params.search
  );

  let response: ApiResponse<SawingInspectionListResponse<SawingInspectionPendingItem>>;
  if (hasFilterOrSort) {
    let endpoint = `${BASE_PATH}/pending/filter`;
    if (params.sortOrder === "asc") endpoint = `${BASE_PATH}/pending/ascending`;
    else if (params.sortOrder === "desc" && !params.sortBy) endpoint = `${BASE_PATH}/pending/latest`;
    else if (params.sortOrder === "desc") endpoint = `${BASE_PATH}/pending/descending`;

    response = await apiRequest<ApiResponse<SawingInspectionListResponse<SawingInspectionPendingItem>>>(
      endpoint,
      {
        method: "POST",
        body: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder ?? "desc",
          filters: params.filters,
        },
      }
    );
  } else {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const url = `${BASE_PATH}/pending?${qs.toString()}`;
    response = await apiRequest<ApiResponse<SawingInspectionListResponse<SawingInspectionPendingItem>>>(url, {
      method: "GET",
    });
  }

  return response.data ?? { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function fetchSawingInspectionPendingById(id: string): Promise<SawingInspectionPendingItem> {
  const response = await apiRequest<ApiResponse<SawingInspectionPendingItem>>(`${BASE_PATH}/pending/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function recordSawingInspectionDecisionApi(
  id: string,
  decision: "PASS" | "FAIL",
  body: { inspectionDate: string; remark?: string | undefined }
): Promise<any> {
  const endpoint = `${BASE_PATH}/pending/${id}/${decision.toLowerCase()}`;
  const response = await apiRequest<ApiResponse<any>>(endpoint, {
    method: "POST",
    body,
  });
  return response.data;
}

export async function revertSawingInspectionPendingApi(
  id: string,
  remark?: string | undefined
): Promise<any> {
  const response = await apiRequest<ApiResponse<any>>(`${BASE_PATH}/pending/${id}/revert`, {
    method: "POST",
    body: { remark },
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// B. Inspection Done (PASS) APIs
// ---------------------------------------------------------------------------

export async function fetchSawingInspectionDone(
  params: SawingInspectionQueryParams = {}
): Promise<SawingInspectionListResponse<SawingInspectionDoneItem>> {
  const hasFilterOrSort = Boolean(
    (params.filters && Object.keys(params.filters).length > 0) ||
      params.sortBy ||
      params.sortOrder ||
      params.search
  );

  let response: ApiResponse<SawingInspectionListResponse<SawingInspectionDoneItem>>;
  if (hasFilterOrSort) {
    response = await apiRequest<ApiResponse<SawingInspectionListResponse<SawingInspectionDoneItem>>>(
      `${BASE_PATH}/done/filter`,
      {
        method: "POST",
        body: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder ?? "desc",
          filters: params.filters,
        },
      }
    );
  } else {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const url = `${BASE_PATH}/done?${qs.toString()}`;
    response = await apiRequest<ApiResponse<SawingInspectionListResponse<SawingInspectionDoneItem>>>(url, {
      method: "GET",
    });
  }

  return response.data ?? { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function fetchSawingInspectionDoneById(id: string): Promise<SawingInspectionDoneItem> {
  const response = await apiRequest<ApiResponse<SawingInspectionDoneItem>>(`${BASE_PATH}/done/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function editSawingInspectionDoneApi(
  id: string,
  body: { inspectionDate?: string | undefined; remark?: string | undefined }
): Promise<any> {
  const response = await apiRequest<ApiResponse<any>>(`${BASE_PATH}/done/${id}`, {
    method: "PUT",
    body,
  });
  return response.data;
}

export async function revertSawingInspectionDoneApi(
  id: string,
  remark?: string | undefined
): Promise<any> {
  const response = await apiRequest<ApiResponse<any>>(`${BASE_PATH}/done/${id}/revert`, {
    method: "POST",
    body: { remark },
  });
  return response.data;
}

export async function issueSawingInspectionToWarehouseApi(
  id: string,
  body: { warehouseId?: string | undefined; remark?: string | undefined } = {}
): Promise<any> {
  const response = await apiRequest<ApiResponse<any>>(`${BASE_PATH}/done/${id}/issue-to-warehouse`, {
    method: "POST",
    body,
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// C. Inspection Fail APIs
// ---------------------------------------------------------------------------

export async function fetchSawingInspectionFail(
  params: SawingInspectionQueryParams = {}
): Promise<SawingInspectionListResponse<SawingInspectionFailItem>> {
  const hasFilterOrSort = Boolean(
    (params.filters && Object.keys(params.filters).length > 0) ||
      params.sortBy ||
      params.sortOrder ||
      params.search
  );

  let response: ApiResponse<SawingInspectionListResponse<SawingInspectionFailItem>>;
  if (hasFilterOrSort) {
    response = await apiRequest<ApiResponse<SawingInspectionListResponse<SawingInspectionFailItem>>>(
      `${BASE_PATH}/fail/filter`,
      {
        method: "POST",
        body: {
          page: params.page ?? 1,
          limit: params.limit ?? 10,
          search: params.search,
          sortBy: params.sortBy,
          sortOrder: params.sortOrder ?? "desc",
          filters: params.filters,
        },
      }
    );
  } else {
    const qs = new URLSearchParams();
    if (params.page) qs.set("page", String(params.page));
    if (params.limit) qs.set("limit", String(params.limit));
    const url = `${BASE_PATH}/fail?${qs.toString()}`;
    response = await apiRequest<ApiResponse<SawingInspectionListResponse<SawingInspectionFailItem>>>(url, {
      method: "GET",
    });
  }

  return response.data ?? { items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 1 } };
}

export async function fetchSawingInspectionFailById(id: string): Promise<SawingInspectionFailItem> {
  const response = await apiRequest<ApiResponse<SawingInspectionFailItem>>(`${BASE_PATH}/fail/${id}`, {
    method: "GET",
  });
  return response.data;
}

export async function revertSawingInspectionFailApi(
  id: string,
  remark?: string | undefined
): Promise<any> {
  const response = await apiRequest<ApiResponse<any>>(`${BASE_PATH}/fail/${id}/revert`, {
    method: "POST",
    body: { remark },
  });
  return response.data;
}

// ---------------------------------------------------------------------------
// D. Dropdowns API
// ---------------------------------------------------------------------------

export async function fetchSawingInspectionDropdownsApi(
  tab: "pending" | "done" | "failed" = "pending"
): Promise<SawingInspectionDropdowns> {
  const response = await apiRequest<ApiResponse<SawingInspectionDropdowns>>(
    `${BASE_PATH}/dropdowns?tab=${tab}`,
    { method: "GET" }
  );
  return response.data ?? {
    storageSrNos: [],
    itemNames: [],
    subCategories: [],
    logNos: [],
    batchNos: [],
    remarks: [],
  };
}
