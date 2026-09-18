import { apiRequest, type ApiResponse } from "../../../lib/apiClient";
import type { MasterRecord } from "../shared/types";

export interface BackendItemSubCategoryItem {
  id: string;
  name: string;
  itemSubCategory: string;
  categoryId: string | null;
  category: string;
  categoryName: string;
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
  const name = item.itemSubCategory || item.name || "";
  const category = item.category || item.categoryName || "Decorative Veneer";

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    itemSubCategory: name,
    name: name,
    category: category,
    categoryName: category,
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

export async function fetchItemSubCategoriesApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: boolean;
}): Promise<MasterRecord[]> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.status !== undefined) query.set("status", String(params.status));

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/item-sub-categories?${queryString}` : "/masters/item-sub-categories";

    const res = await apiRequest<ApiResponse<BackendItemSubCategoryListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return res.data.items.map((item, idx) => mapBackendItemSubCategoryToMasterRecord(item, idx));
    }
  } catch (error) {
    console.warn("Failed to fetch item sub categories from backend API, using local records:", error);
  }
  return [];
}

export async function getItemSubCategoryByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(`/masters/item-sub-categories/${id}`);
    if (res?.success && res?.data) {
      return mapBackendItemSubCategoryToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch item sub category with id ${id} from API:`, error);
  }
  return null;
}

export async function createItemSubCategoryApi(values: {
  name?: string;
  itemSubCategory?: string;
  category?: string;
  categoryName?: string;
  categoryId?: string | null;
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

  const name = values.itemSubCategory || values.name || "";
  const category = values.category || values.categoryName || "Decorative Veneer";

  const body = {
    name,
    itemSubCategory: name,
    category,
    categoryName: category,
    categoryId: values.categoryId || null,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>("/masters/item-sub-categories", {
    method: "POST",
    body,
  });

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
    categoryId?: string | null;
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
  const name = values.itemSubCategory || values.name;
  if (name) {
    body.name = name;
    body.itemSubCategory = name;
  }
  const category = values.category || values.categoryName;
  if (category) {
    body.category = category;
    body.categoryName = category;
  }
  if (values.categoryId !== undefined) {
    body.categoryId = values.categoryId;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(`/masters/item-sub-categories/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendItemSubCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemSubCategoryStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendItemSubCategoryItem>>(`/masters/item-sub-categories/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendItemSubCategoryToMasterRecord(res.data);
  }
  return null;
}

export async function deleteItemSubCategoryApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/item-sub-categories/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

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
