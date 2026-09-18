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
    category: item.category || item.categoryName || "Decorative Veneer",
    categoryName: item.categoryName || item.category || "Decorative Veneer",
    subCategory: item.subCategory || "Natural Veneer",
    color: item.color || item.colorName || "Natural Oak",
    colorName: item.colorName || item.color || "Natural Oak",
    hsn: item.hsn || item.hsnCode || "4408",
    hsnCode: item.hsnCode || item.hsn || "4408",
    gst: item.gst || item.gstNo || item.gstPercentage || "12%",
    gstNo: item.gstNo || item.gst || item.gstPercentage || "12%",
    gstPercentage: item.gstPercentage || item.gst || item.gstNo || "12%",
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

export async function fetchItemsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  subCategory?: string;
  status?: boolean;
}): Promise<MasterRecord[]> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.category) query.set("category", params.category);
    if (params?.subCategory) query.set("subCategory", params.subCategory);
    if (params?.status !== undefined) query.set("status", String(params.status));

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/items?${queryString}` : "/masters/items";

    const res = await apiRequest<ApiResponse<BackendItemListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return res.data.items.map((item, idx) => mapBackendItemToMasterRecord(item, idx));
    }
  } catch (error) {
    console.warn("Failed to fetch items from backend API, using local records:", error);
  }
  return [];
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
  return null;
}

export async function createItemApi(values: {
  name?: string;
  itemName?: string;
  factoryItemCode?: string;
  itemCode?: string;
  category?: string;
  subCategory?: string;
  color?: string;
  hsn?: string;
  hsnCode?: string;
  gst?: string;
  gstNo?: string;
  gstPercentage?: string;
  length?: string;
  width?: string;
  thickness?: string;
  quantitySheets?: string;
  ratePerSqf?: string;
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

  const itemName = values.itemName || values.name || "";
  const factoryItemCode = values.factoryItemCode || values.itemCode || `ITM-${Date.now()}`;

  const body = {
    name: itemName,
    itemName,
    factoryItemCode,
    itemCode: factoryItemCode,
    category: values.category || "Decorative Veneer",
    subCategory: values.subCategory || "Natural Veneer",
    color: values.color || "Natural Oak",
    hsn: values.hsn || values.hsnCode || "4408",
    hsnCode: values.hsn || values.hsnCode || "4408",
    gst: values.gst || values.gstNo || values.gstPercentage || "12%",
    gstNo: values.gst || values.gstNo || values.gstPercentage || "12%",
    gstPercentage: values.gst || values.gstNo || values.gstPercentage || "12%",
    length: values.length || null,
    width: values.width || null,
    thickness: values.thickness || null,
    quantitySheets: values.quantitySheets || null,
    ratePerSqf: values.ratePerSqf || null,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

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
    name?: string;
    itemName?: string;
    factoryItemCode?: string;
    itemCode?: string;
    category?: string;
    subCategory?: string;
    color?: string;
    hsn?: string;
    hsnCode?: string;
    gst?: string;
    gstNo?: string;
    gstPercentage?: string;
    length?: string;
    width?: string;
    thickness?: string;
    quantitySheets?: string;
    ratePerSqf?: string;
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
  const itemName = values.itemName || values.name;
  if (itemName) {
    body.name = itemName;
    body.itemName = itemName;
  }
  const factoryItemCode = values.factoryItemCode || values.itemCode;
  if (factoryItemCode) {
    body.factoryItemCode = factoryItemCode;
    body.itemCode = factoryItemCode;
  }
  if (values.category) body.category = values.category;
  if (values.subCategory) body.subCategory = values.subCategory;
  if (values.color) body.color = values.color;
  const hsn = values.hsn || values.hsnCode;
  if (hsn) {
    body.hsn = hsn;
    body.hsnCode = hsn;
  }
  const gst = values.gst || values.gstNo || values.gstPercentage;
  if (gst) {
    body.gst = gst;
    body.gstNo = gst;
    body.gstPercentage = gst;
  }
  if (values.length !== undefined) body.length = values.length;
  if (values.width !== undefined) body.width = values.width;
  if (values.thickness !== undefined) body.thickness = values.thickness;
  if (values.quantitySheets !== undefined) body.quantitySheets = values.quantitySheets;
  if (values.ratePerSqf !== undefined) body.ratePerSqf = values.ratePerSqf;
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
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

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

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
