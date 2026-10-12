import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";
import type { MasterRecord } from "../../shared/types";

export interface BackendItemCategoryItem {
  id: string;
  name: string;
  categoryName: string;
  hsnId: string | null;
  hsn: string;
  hsnCode: string;
  gst: string;
  gstNo: string;
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

export interface BackendItemCategoryListResponse {
  items: BackendItemCategoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendItemCategoryToMasterRecord(
  item: BackendItemCategoryItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;
  const name = item.categoryName || item.name || "";
  const hsn = item.hsnCode || item.hsn || "4412";
  const gst = item.gstNo || item.gst || "18%";

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    categoryName: name,
    name: name,
    hsn: hsn,
    hsnCode: hsn,
    gst: gst,
    gstNo: gst,
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

export interface ItemCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  hsn?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface PaginatedItemCategoryResult {
  items: MasterRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchItemCategoriesPaginated(
  params: ItemCategoryQueryParams = {},
): Promise<PaginatedItemCategoryResult> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.status !== undefined) query.set("status", String(params.status));
    if (params.hsn) query.set("hsn", params.hsn);
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params.filters && Object.keys(params.filters).length > 0) {
      query.set("filters", encodeURIComponent(JSON.stringify(params.filters)));
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/item-categories?${queryString}` : "/masters/item-categories";

    const res = await apiRequest<ApiResponse<BackendItemCategoryListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return {
        items: res.data.items.map((item, idx) => mapBackendItemCategoryToMasterRecord(item, idx)),
        pagination: {
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to fetch item categories from backend API:", error);
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

export async function fetchItemCategoriesApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  hsn?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<MasterRecord[]> {
  const result = await fetchItemCategoriesPaginated(params);
  return result.items;
}

export async function getItemCategoryByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendItemCategoryItem>>(`/masters/item-categories/${id}`);
    if (res?.success && res?.data) {
      return mapBackendItemCategoryToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch item category with id ${id} from API:`, error);
  }
  return null;
}

export async function createItemCategoryApi(values: {
  name?: string;
  categoryName?: string;
  hsn?: string;
  hsnCode?: string;
  gst?: string;
  gstNo?: string;
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

  const name = values.categoryName || values.name || "";
  const hsn = values.hsn || values.hsnCode || "4412";
  const gst = values.gst || values.gstNo || "18%";

  const body = {
    name,
    categoryName: name,
    hsn,
    hsnCode: hsn,
    gst,
    gstNo: gst,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendItemCategoryItem>>("/masters/item-categories", {
    method: "POST",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendItemCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemCategoryApi(
  id: string,
  values: {
    name?: string;
    categoryName?: string;
    hsn?: string;
    hsnCode?: string;
    gst?: string;
    gstNo?: string;
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
  const name = values.categoryName || values.name;
  if (name) {
    body.name = name;
    body.categoryName = name;
  }
  const hsn = values.hsn || values.hsnCode;
  if (hsn !== undefined) {
    body.hsn = hsn;
    body.hsnCode = hsn;
  }
  const gst = values.gst || values.gstNo;
  if (gst !== undefined) {
    body.gst = gst;
    body.gstNo = gst;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendItemCategoryItem>>(`/masters/item-categories/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendItemCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemCategoryStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendItemCategoryItem>>(`/masters/item-categories/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendItemCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function deleteItemCategoryApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/item-categories/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export async function fetchItemCategoryColumnDropdown(
  column: string,
): Promise<{ column: string; options: Array<{ value: string; label: string }> }> {
  try {
    const res = await apiRequest<ApiResponse<{ column: string; options: Array<{ value: string; label: string }> }>>(
      `/masters/item-categories/dropdowns?column=${encodeURIComponent(column)}`,
    );
    if (res?.success && res.data) {
      return { column: res.data.column ?? column, options: res.data.options ?? [] };
    }
  } catch (error) {
    console.warn('Failed to fetch column dropdown:', error);
  }
  return { column, options: [] };
}
export function syncItemCategoryMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["item-category-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
