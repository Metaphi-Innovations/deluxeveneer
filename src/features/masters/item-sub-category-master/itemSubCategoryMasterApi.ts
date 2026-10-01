import { apiRequest, type ApiResponse } from "../../../lib/apiClient";
import type { MasterRecord } from "../shared/types";

export interface BackendItemSubCategoryItem {
  id: string;
  name: string;
  itemSubCategory: string;
  categoryId: string | null;
  categoryName: string;
  category: string;
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

export interface BackendItemSubCategoryListResponse {
  items: BackendItemSubCategoryItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendItemSubCategoryToMasterRecord(
  item: BackendItemSubCategoryItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;

  return {
    id: item.id,
    srNo: String((index ?? 0) + 1),
    itemSubCategory: item.name || item.itemSubCategory || "",
    name: item.name || item.itemSubCategory || "",
    categoryId: item.categoryId || "",
    categoryName: item.categoryName || item.category || "",
    category: item.categoryName || item.category || "",
    remarks: item.remarks || item.remark || "",
    remark: item.remark || item.remarks || "",
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

export interface ItemSubCategoryQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface PaginatedItemSubCategoryResult {
  items: MasterRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchItemSubCategoriesPaginated(
  params: ItemSubCategoryQueryParams = {},
): Promise<PaginatedItemSubCategoryResult> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.category) query.set("category", params.category);
    if (params.categoryId) query.set("categoryId", params.categoryId);
    if (params.status !== undefined) query.set("status", String(params.status));
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params.filters && Object.keys(params.filters).length > 0) {
      query.set("filters", encodeURIComponent(JSON.stringify(params.filters)));
    }

    const queryString = query.toString();
    const endpoint = queryString
      ? `/masters/item-sub-categories?${queryString}`
      : "/masters/item-sub-categories";

    const res = await apiRequest<ApiResponse<BackendItemSubCategoryListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return {
        items: res.data.items.map((item, idx) => mapBackendItemSubCategoryToMasterRecord(item, idx)),
        pagination: {
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to fetch item sub-categories from backend API:", error);
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

export async function fetchItemSubCategoriesApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  categoryId?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<MasterRecord[]> {
  const result = await fetchItemSubCategoriesPaginated(params);
  return result.items;
}

let itemSubCategoryRowsCache: MasterRecord[] = [];

export function getCachedItemSubCategoryMasterRows(): MasterRecord[] {
  return itemSubCategoryRowsCache;
}

export async function refreshItemSubCategoryMasterCache(
  items?: MasterRecord[],
): Promise<MasterRecord[]> {
  if (items) {
    itemSubCategoryRowsCache = items;
    return itemSubCategoryRowsCache;
  }

  const result = await fetchItemSubCategoriesPaginated({
    page: 1,
    limit: 1000,
    status: true,
    sortBy: "name",
    sortOrder: "asc",
  });
  itemSubCategoryRowsCache = result.items;
  return itemSubCategoryRowsCache;
}

export async function getItemSubCategoryByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(
      `/masters/item-sub-categories/${id}`,
    );
    if (res?.success && res?.data) {
      return mapBackendItemSubCategoryToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch item sub-category with id ${id} from API:`, error);
  }
  return null;
}

export async function createItemSubCategoryApi(values: {
  name?: string;
  itemSubCategory?: string;
  category?: string;
  categoryName?: string;
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
    name: values.name || values.itemSubCategory || "",
    itemSubCategory: values.name || values.itemSubCategory || "",
    categoryName: values.categoryName || values.category || "",
    category: values.categoryName || values.category || "",
    remarks: values.remark || values.remarks || null,
    remark: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(
    "/masters/item-sub-categories",
    { method: "POST", body },
  );

  if (res?.success && res?.data) {
    return mapBackendItemSubCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemSubCategoryApi(
  id: string,
  values: {
    name?: string;
    itemSubCategory?: string;
    category?: string;
    categoryName?: string;
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
  if (values.name || values.itemSubCategory) {
    body.name = values.name || values.itemSubCategory;
    body.itemSubCategory = values.name || values.itemSubCategory;
  }
  if (values.category || values.categoryName) {
    body.category = values.category || values.categoryName;
    body.categoryName = values.categoryName || values.category;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) body.status = isStatusActive;

  const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(
    `/masters/item-sub-categories/${id}`,
    { method: "PUT", body },
  );

  if (res?.success && res?.data) {
    return mapBackendItemSubCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemSubCategoryStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(
    `/masters/item-sub-categories/${id}/status`,
    { method: "PATCH", body: { status: checked } },
  );
  if (res?.success && res?.data) {
    return mapBackendItemSubCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function deleteItemSubCategoryApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(
    `/masters/item-sub-categories/${id}`,
    { method: "DELETE" },
  );
  return Boolean(res?.success);
}

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export async function fetchItemSubCategoryColumnDropdown(
  column: string,
): Promise<{ column: string; options: Array<{ value: string; label: string }> }> {
  try {
    const res = await apiRequest<ApiResponse<{ column: string; options: Array<{ value: string; label: string }> }>>(
      `/masters/item-sub-categories/dropdowns?column=${encodeURIComponent(column)}`,
    );
    if (res?.success && res.data) {
      return { column: res.data.column ?? column, options: res.data.options ?? [] };
    }
  } catch (error) {
    console.warn('Failed to fetch column dropdown:', error);
  }
  return { column, options: [] };
}
export function syncItemSubCategoryMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["item-sub-category-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
