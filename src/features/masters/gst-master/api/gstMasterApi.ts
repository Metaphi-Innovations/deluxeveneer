import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";
import type { MasterRecord } from "../../shared/types";

export interface BackendGstItem {
  id: string;
  percentage: number;
  gstPercentage: string;
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

export interface BackendGstListResponse {
  items: BackendGstItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendGstToMasterRecord(
  item: BackendGstItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;
  const percentageStr = item.gstPercentage || `${item.percentage}%`;

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    gstPercentage: percentageStr,
    percentage: String(item.percentage),
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

export interface GstQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface PaginatedGstResult {
  items: MasterRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchGstsPaginated(
  params: GstQueryParams = {},
): Promise<PaginatedGstResult> {
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
    const endpoint = queryString ? `/masters/gsts?${queryString}` : "/masters/gsts";

    const res = await apiRequest<ApiResponse<BackendGstListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return {
        items: res.data.items.map((item, idx) => mapBackendGstToMasterRecord(item, idx)),
        pagination: {
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to fetch GST records from backend API:", error);
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

export async function fetchGstsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<MasterRecord[]> {
  const result = await fetchGstsPaginated(params);
  return result.items;
}

export async function getGstByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendGstItem>>(`/masters/gsts/${id}`);
    if (res?.success && res?.data) {
      return mapBackendGstToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch GST record with id ${id} from API:`, error);
  }
  return null;
}

export async function createGstApi(values: {
  percentage?: number | string;
  gstPercentage?: number | string;
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

  const rawPercentage = values.percentage !== undefined ? values.percentage : values.gstPercentage;

  const body = {
    percentage: rawPercentage,
    gstPercentage: rawPercentage,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendGstItem>>("/masters/gsts", {
    method: "POST",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendGstToMasterRecord(res.data);
  }
  return null;
}

export async function updateGstApi(
  id: string,
  values: {
    percentage?: number | string;
    gstPercentage?: number | string;
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
  const rawPercentage = values.percentage !== undefined ? values.percentage : values.gstPercentage;
  if (rawPercentage !== undefined) {
    body.percentage = rawPercentage;
    body.gstPercentage = rawPercentage;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendGstItem>>(`/masters/gsts/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendGstToMasterRecord(res.data);
  }
  return null;
}

export async function updateGstStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendGstItem>>(`/masters/gsts/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendGstToMasterRecord(res.data);
  }
  return null;
}

export async function deleteGstApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/gsts/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export async function fetchGstColumnDropdown(
  column: string,
): Promise<{ column: string; options: Array<{ value: string; label: string }> }> {
  try {
    const res = await apiRequest<ApiResponse<{ column: string; options: Array<{ value: string; label: string }> }>>(
      `/masters/gst/dropdowns?column=${encodeURIComponent(column)}`,
    );
    if (res?.success && res.data) {
      return { column: res.data.column ?? column, options: res.data.options ?? [] };
    }
  } catch (error) {
    console.warn('Failed to fetch column dropdown:', error);
  }
  return { column, options: [] };
}
export function syncGstMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["gst-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
