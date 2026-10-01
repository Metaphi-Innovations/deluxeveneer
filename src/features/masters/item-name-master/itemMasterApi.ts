import { apiRequest, type ApiResponse } from "../../../lib/apiClient";
import type { MasterRecord } from "../shared/types";

export interface BackendItemItem {
  id: string;
  name: string;
  itemName: string;
  factoryItemCode: string;
  itemCode: string;
  categoryId: string | null;
  category: string;
  categoryName: string;
  subCategoryId: string | null;
  subCategory: string;
  colorId: string | null;
  color: string;
  colorName: string;
  hsnId: string | null;
  hsn: string;
  hsnCode: string;
  gst: string;
  gstNo: string;
  gstPercentage: string;
  length?: string | null;
  width?: string | null;
  thickness?: string | null;
  quantitySheets?: string | null;
  ratePerSqf?: string | null;
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

export interface BackendItemListResponse {
  items: BackendItemItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendItemToMasterRecord(
  item: BackendItemItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    itemName: item.itemName || item.name || "",
    name: item.name || item.itemName || "",
    itemCode: item.itemCode || item.factoryItemCode || "",
    factoryItemCode: item.factoryItemCode || item.itemCode || "",
    categoryId: item.categoryId || "",
    category: item.category || item.categoryName || "",
    categoryName: item.categoryName || item.category || "",
    subCategoryId: item.subCategoryId || "",
    subCategory: item.subCategory || "",
    subCategoryName: item.subCategory || "",
    colorId: item.colorId || "",
    color: item.color || item.colorName || "",
    colorName: item.colorName || item.color || "",
    hsnId: item.hsnId || "",
    hsn: item.hsn || item.hsnCode || "",
    hsnCode: item.hsnCode || item.hsn || "",
    gst: item.gst || item.gstNo || item.gstPercentage || "",
    gstNo: item.gstNo || item.gst || item.gstPercentage || "",
    gstPercentage: item.gstPercentage || item.gst || item.gstNo || "",
    length: item.length || undefined,
    width: item.width || undefined,
    thickness: item.thickness || undefined,
    quantitySheets: item.quantitySheets || undefined,
    ratePerSqf: item.ratePerSqf || undefined,
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

export const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export function getStoredItemMasterRows(): MasterRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const rows = parsed["item-name-master"];
    if (Array.isArray(rows)) {
      return rows.map((r, idx) => ({
        ...r,
        srNo: r.srNo || String(idx + 1),
        createdAt: r.createdAt ? new Date(r.createdAt) : new Date(),
        createdDate: r.createdDate ? new Date(r.createdDate) : new Date(),
        updatedAt: r.updatedAt ? new Date(r.updatedAt) : new Date(),
        updatedDate: r.updatedDate ? new Date(r.updatedDate) : new Date(),
      }));
    }
  } catch {
    // ignore
  }
  return [];
}

export function syncItemMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["item-name-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export interface ItemQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface PaginatedItemResult {
  items: MasterRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function fetchItemsPaginated(
  params: ItemQueryParams = {},
): Promise<PaginatedItemResult> {
  try {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.category) query.set("category", params.category);
    if (params.subCategory) query.set("subCategory", params.subCategory);
    if (params.status !== undefined) query.set("status", String(params.status));
    if (params.sortBy) query.set("sortBy", params.sortBy);
    if (params.sortOrder) query.set("sortOrder", params.sortOrder);
    if (params.filters && Object.keys(params.filters).length > 0) {
      query.set("filters", encodeURIComponent(JSON.stringify(params.filters)));
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/items?${queryString}` : "/masters/items";

    const res = await apiRequest<ApiResponse<BackendItemListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return {
        items: res.data.items.map((item, idx) => mapBackendItemToMasterRecord(item, idx)),
        pagination: {
          page: res.data.pagination.page,
          limit: res.data.pagination.limit,
          total: res.data.pagination.total,
          totalPages: res.data.pagination.totalPages,
        },
      };
    }
  } catch (error) {
    console.warn("Failed to fetch items from backend API:", error);
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

export async function fetchItemsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}): Promise<MasterRecord[]> {
  const result = await fetchItemsPaginated(params);
  return result.items;
}

let itemMasterRowsCache: MasterRecord[] = [];

export function getCachedItemMasterRows(): MasterRecord[] {
  return itemMasterRowsCache;
}

export async function refreshItemMasterCache(
  items?: MasterRecord[],
): Promise<MasterRecord[]> {
  if (items) {
    itemMasterRowsCache = items;
    return itemMasterRowsCache;
  }

  const result = await fetchItemsPaginated({
    page: 1,
    limit: 1000,
    status: true,
    sortBy: "name",
    sortOrder: "asc",
  });
  itemMasterRowsCache = result.items;
  return itemMasterRowsCache;
}

export async function getItemByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendItemItem>>(`/masters/items/${id}`);
    if (res?.success && res?.data) {
      return mapBackendItemToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch item with id ${id} from API:`, error);
  }
  const localRows = getStoredItemMasterRows();
  return localRows.find((r) => r.id === id) || null;
}

export async function createItemApi(values: {
  name?: string | undefined;
  itemName?: string | undefined;
  factoryItemCode?: string | undefined;
  itemCode?: string | undefined;
  category?: string | undefined;
  subCategory?: string | undefined;
  color?: string | undefined;
  hsn?: string | undefined;
  hsnCode?: string | undefined;
  gst?: string | undefined;
  gstNo?: string | undefined;
  gstPercentage?: string | undefined;
  length?: string | undefined;
  width?: string | undefined;
  thickness?: string | undefined;
  quantitySheets?: string | undefined;
  ratePerSqf?: string | undefined;
  remark?: string | null | undefined;
  remarks?: string | null | undefined;
  status?: boolean | string | undefined;
}): Promise<MasterRecord | null> {
  const isStatusActive =
    typeof values.status === "boolean"
      ? values.status
      : typeof values.status === "string"
        ? values.status.toLowerCase() === "active"
        : true;

  const itemName = (values.itemName || values.name || "").trim();
  const factoryItemCode = (values.factoryItemCode || values.itemCode || "").trim() || `ITM-${Date.now()}`;

  const body: any = {
    name: itemName,
    itemName,
    factoryItemCode,
    itemCode: factoryItemCode,
    status: isStatusActive,
  };

  const category = (values.category || "").trim();
  if (category) body.category = category;

  const subCategory = (values.subCategory || "").trim();
  if (subCategory) body.subCategory = subCategory;

  const color = (values.color || "").trim();
  if (color) body.color = color;

  const hsn = (values.hsn || values.hsnCode || "").trim();
  if (hsn) {
    body.hsn = hsn;
    body.hsnCode = hsn;
  }

  const gst = (values.gst || values.gstNo || values.gstPercentage || "").trim();
  if (gst) {
    body.gst = gst;
    body.gstNo = gst;
    body.gstPercentage = gst;
  }

  const remark = (values.remark ?? values.remarks ?? "").trim();
  if (remark) {
    body.remark = remark;
    body.remarks = remark;
  }

  if (values.length && String(values.length).trim()) {
    body.length = String(values.length).trim();
  }
  if (values.width && String(values.width).trim()) {
    body.width = String(values.width).trim();
  }
  if (values.thickness && String(values.thickness).trim()) {
    body.thickness = String(values.thickness).trim();
  }
  if (values.quantitySheets && String(values.quantitySheets).trim()) {
    body.quantitySheets = String(values.quantitySheets).trim();
  }
  if (values.ratePerSqf && String(values.ratePerSqf).trim()) {
    body.ratePerSqf = String(values.ratePerSqf).trim();
  }

  const res = await apiRequest<ApiResponse<BackendItemItem>>("/masters/items", {
    method: "POST",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendItemToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemApi(
  id: string,
  values: {
    name?: string | undefined;
    itemName?: string | undefined;
    factoryItemCode?: string | undefined;
    itemCode?: string | undefined;
    category?: string | undefined;
    subCategory?: string | undefined;
    color?: string | undefined;
    hsn?: string | undefined;
    hsnCode?: string | undefined;
    gst?: string | undefined;
    gstNo?: string | undefined;
    gstPercentage?: string | undefined;
    length?: string | undefined;
    width?: string | undefined;
    thickness?: string | undefined;
    quantitySheets?: string | undefined;
    ratePerSqf?: string | undefined;
    remark?: string | null | undefined;
    remarks?: string | null | undefined;
    status?: boolean | string | undefined;
  },
): Promise<MasterRecord | null> {
  const isStatusActive =
    typeof values.status === "boolean"
      ? values.status
      : typeof values.status === "string"
        ? values.status.toLowerCase() === "active"
        : undefined;

  const body: any = {};
  const itemName = (values.itemName || values.name)?.trim();
  if (itemName) {
    body.name = itemName;
    body.itemName = itemName;
  }
  const factoryItemCode = (values.factoryItemCode || values.itemCode)?.trim();
  if (factoryItemCode) {
    body.factoryItemCode = factoryItemCode;
    body.itemCode = factoryItemCode;
  }
  if (values.category && values.category.trim()) body.category = values.category.trim();
  if (values.subCategory && values.subCategory.trim()) body.subCategory = values.subCategory.trim();
  if (values.color && values.color.trim()) body.color = values.color.trim();
  const hsn = (values.hsn || values.hsnCode)?.trim();
  if (hsn) {
    body.hsn = hsn;
    body.hsnCode = hsn;
  }
  const gst = (values.gst || values.gstNo || values.gstPercentage)?.trim();
  if (gst) {
    body.gst = gst;
    body.gstNo = gst;
    body.gstPercentage = gst;
  }
  if (values.length && String(values.length).trim()) {
    body.length = String(values.length).trim();
  }
  if (values.width && String(values.width).trim()) {
    body.width = String(values.width).trim();
  }
  if (values.thickness && String(values.thickness).trim()) {
    body.thickness = String(values.thickness).trim();
  }
  if (values.quantitySheets && String(values.quantitySheets).trim()) {
    body.quantitySheets = String(values.quantitySheets).trim();
  }
  if (values.ratePerSqf && String(values.ratePerSqf).trim()) {
    body.ratePerSqf = String(values.ratePerSqf).trim();
  }
  const remark = (values.remark ?? values.remarks)?.trim();
  if (remark !== undefined) {
    body.remark = remark || null;
    body.remarks = remark || null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendItemItem>>(`/masters/items/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendItemToMasterRecord(res.data);
  }
  return null;
}

export async function updateItemStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendItemItem>>(`/masters/items/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendItemToMasterRecord(res.data);
  }
  return null;
}

export async function deleteItemApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/items/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

export async function fetchItemColumnDropdown(
  column: string,
): Promise<{ column: string; options: Array<{ value: string; label: string }> }> {
  try {
    const res = await apiRequest<ApiResponse<{ column: string; options: Array<{ value: string; label: string }> }>>(
      `/masters/items/dropdowns?column=${encodeURIComponent(column)}`,
    );
    if (res?.success && res.data) {
      return { column: res.data.column ?? column, options: res.data.options ?? [] };
    }
  } catch (error) {
    console.warn('Failed to fetch column dropdown:', error);
  }
  return { column, options: [] };
}

