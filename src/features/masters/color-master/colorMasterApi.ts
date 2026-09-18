import { apiRequest, type ApiResponse } from "../../../lib/apiClient";
import type { MasterRecord } from "../shared/types";

export interface BackendColorItem {
  id: string;
  name: string;
  colorName: string;
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

export interface BackendColorListResponse {
  items: BackendColorItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendColorToMasterRecord(
  item: BackendColorItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    colorName: item.colorName || item.name || "",
    name: item.name || item.colorName || "",
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

export const mapBackendColourToMasterRecord = mapBackendColorToMasterRecord;

export async function fetchColorsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
}): Promise<MasterRecord[]> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.status !== undefined) query.set("status", String(params.status));

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/colors?${queryString}` : "/masters/colors";

    const res = await apiRequest<ApiResponse<BackendColorListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return res.data.items.map((item, idx) => mapBackendColorToMasterRecord(item, idx));
    }
  } catch (error) {
    console.warn("Failed to fetch colors from backend API, using local records:", error);
  }
  return [];
}

export const fetchColoursApi = fetchColorsApi;

export async function getColorByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendColorItem>>(`/masters/colors/${id}`);
    if (res?.success && res?.data) {
      return mapBackendColorToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch color with id ${id} from API:`, error);
  }
  return null;
}

export const getColourByIdApi = getColorByIdApi;

export async function createColorApi(values: {
  name?: string;
  colorName?: string;
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
    name: values.colorName || values.name,
    colorName: values.colorName || values.name,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendColorItem>>("/masters/colors", {
    method: "POST",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendColorToMasterRecord(res.data);
  }
  return null;
}

export const createColourApi = createColorApi;

export async function updateColorApi(
  id: string,
  values: {
    name?: string;
    colorName?: string;
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
  if (values.colorName || values.name) {
    body.name = values.colorName || values.name;
    body.colorName = values.colorName || values.name;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendColorItem>>(`/masters/colors/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendColorToMasterRecord(res.data);
  }
  return null;
}

export const updateColourApi = updateColorApi;

export async function updateColorStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendColorItem>>(`/masters/colors/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendColorToMasterRecord(res.data);
  }
  return null;
}

export const updateColourStatusApi = updateColorStatusApi;

export async function deleteColorApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/colors/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

export const deleteColourApi = deleteColorApi;

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export function syncColorMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["color-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
