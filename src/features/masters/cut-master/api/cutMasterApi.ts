import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";
import type { MasterRecord } from "../../shared/types";

export interface BackendCutItem {
  id: string;
  name: string;
  cutName: string;
  remarks: string | null;
  remark: string | null;
  status: boolean;
  statusLabel: "Active" | "Inactive";
  createdById: string | null;
  updatedById: string | null;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    initials: string;
    email: string;
  } | null;
  updatedBy: {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    initials: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  createdDate: string;
  updatedDate: string;
}

export interface BackendCutListResponse {
  items: BackendCutItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendCutToMasterRecord(
  item: BackendCutItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    cutName: item.cutName || item.name || "",
    name: item.name || item.cutName || "",
    remark: item.remark || item.remarks || "",
    remarks: item.remarks || item.remark || "",
    status: item.status ? "Active" : "Inactive",
    statusLabel: item.status ? "Active" : "Inactive",
    createdBy: createdByName,
    createdEditedBy: createdByName,
    editedBy: updatedByName,
    updatedBy: updatedByName,
    createdAt: createdDate,
    createdDate: createdDate,
    createdEditedDate: createdDate,
    updatedAt: updatedDate,
    updatedDate: updatedDate,
  };
}

export interface CutQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface PaginatedCutResult {
  items: MasterRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchCutsPaginated(
  params: CutQueryParams = {},
): Promise<PaginatedCutResult> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.status !== undefined) query.set("status", String(params.status));
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params.filters && Object.keys(params.filters).length > 0) {
      query.set("filters", encodeURIComponent(JSON.stringify(params.filters)));
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/cuts?${queryString}` : "/masters/cuts";

    const res = await apiRequest<ApiResponse<BackendCutListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return {
        items: res.data.items.map((item, idx) => mapBackendCutToMasterRecord(item, idx)),
        pagination: {
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to fetch cuts from backend API:", error);
  }
  return {
    items: [],
    pagination: {
      page: params.page || 1,
      limit: params.limit || 10,
      total: 0,
      totalPages: 1,
    },
  };
}

export async function fetchCutsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<MasterRecord[]> {
  const result = await fetchCutsPaginated(params);
  return result.items;
}

export async function getCutByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendCutItem>>(`/masters/cuts/${id}`);
    if (res?.success && res?.data) {
      return mapBackendCutToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch cut with id ${id} from API:`, error);
  }
  return null;
}

export async function createCutApi(values: {
  name?: string;
  cutName?: string;
  remark?: string | null;
  remarks?: string | null;
  status?: boolean | string;
}): Promise<MasterRecord | null> {
  const isStatusActive =
    typeof values.status === "boolean"
      ? values.status
      : typeof values.status === "string"
        ? values.status.toLowerCase() === "active"
        : true;

  const body = {
    name: values.cutName || values.name,
    cutName: values.cutName || values.name,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendCutItem>>("/masters/cuts", {
    method: "POST",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendCutToMasterRecord(res.data);
  }
  return null;
}

export async function updateCutApi(
  id: string,
  values: {
    name?: string;
    cutName?: string;
    remark?: string | null;
    remarks?: string | null;
    status?: boolean | string;
  },
): Promise<MasterRecord | null> {
  const isStatusActive =
    typeof values.status === "boolean"
      ? values.status
      : typeof values.status === "string"
        ? values.status.toLowerCase() === "active"
        : undefined;

  const body: any = {};
  if (values.cutName || values.name) {
    body.name = values.cutName || values.name;
    body.cutName = values.cutName || values.name;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendCutItem>>(`/masters/cuts/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendCutToMasterRecord(res.data);
  }
  return null;
}

export async function updateCutStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendCutItem>>(`/masters/cuts/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendCutToMasterRecord(res.data);
  }
  return null;
}

export async function deleteCutApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/cuts/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export async function fetchCutColumnDropdown(
  column: string,
): Promise<{ column: string; options: Array<{ value: string; label: string }> }> {
  try {
    const res = await apiRequest<ApiResponse<{ column: string; options: Array<{ value: string; label: string }> }>>(
      `/masters/cuts/dropdowns?column=${encodeURIComponent(column)}`,
    );
    if (res?.success && res.data) {
      return { column: res.data.column ?? column, options: res.data.options ?? [] };
    }
  } catch (error) {
    console.warn('Failed to fetch column dropdown:', error);
  }
  return { column, options: [] };
}
export function syncCutMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["cut-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
