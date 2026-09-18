import { apiRequest, type ApiResponse } from "../../../lib/apiClient";
import type { MasterRecord } from "../shared/types";

export interface BackendHsnItem {
  id: string;
  code: string;
  hsnCode: string;
  description: string;
  hsnCodeDescription: string;
  gstId: string | null;
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

export interface BackendHsnListResponse {
  items: BackendHsnItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export function mapBackendHsnToMasterRecord(
  item: BackendHsnItem,
  index?: number,
): MasterRecord {
  const createdDate = item.createdAt ? new Date(item.createdAt) : new Date();
  const updatedDate = item.updatedAt ? new Date(item.updatedAt) : new Date();
  const createdByName = item.createdBy?.fullName || "Super Admin";
  const updatedByName = item.updatedBy?.fullName || createdByName;
  const code = item.hsnCode || item.code || "";
  const desc = item.hsnCodeDescription || item.description || "";
  const gst = item.gstPercentage || "18%";

  return {
    id: item.id,
    srNo: index !== undefined ? String(index + 1) : undefined,
    hsnCode: code,
    code: code,
    hsnCodeDescription: desc,
    description: desc,
    gstPercentage: gst,
    gst: gst,
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

export async function fetchHsnsApi(params?: {
  page?: number;
  limit?: number;
  search?: string;
  status?: boolean;
  gstPercentage?: string;
}): Promise<MasterRecord[]> {
  try {
    const query = new URLSearchParams();
    if (params?.page) query.set("page", String(params.page));
    if (params?.limit) query.set("limit", String(params.limit));
    if (params?.search) query.set("search", params.search);
    if (params?.status !== undefined) query.set("status", String(params.status));
    if (params?.gstPercentage) query.set("gstPercentage", params.gstPercentage);

    const queryString = query.toString();
    const endpoint = queryString ? `/masters/hsns?${queryString}` : "/masters/hsns";

    const res = await apiRequest<ApiResponse<BackendHsnListResponse>>(endpoint);
    if (res?.success && Array.isArray(res?.data?.items)) {
      return res.data.items.map((item, idx) => mapBackendHsnToMasterRecord(item, idx));
    }
  } catch (error) {
    console.warn("Failed to fetch HSN records from backend API, using local records:", error);
  }
  return [];
}

export async function getHsnByIdApi(id: string): Promise<MasterRecord | null> {
  try {
    const res = await apiRequest<ApiResponse<BackendHsnItem>>(`/masters/hsns/${id}`);
    if (res?.success && res?.data) {
      return mapBackendHsnToMasterRecord(res.data);
    }
  } catch (error) {
    console.warn(`Failed to fetch HSN record with id ${id} from API:`, error);
  }
  return null;
}

export async function createHsnApi(values: {
  code?: string;
  hsnCode?: string;
  description?: string;
  hsnCodeDescription?: string;
  gstPercentage?: string | number;
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

  const code = values.hsnCode || values.code || "";
  const description = values.hsnCodeDescription || values.description || "";

  const body = {
    code,
    hsnCode: code,
    description,
    hsnCodeDescription: description,
    gstPercentage: values.gstPercentage,
    remark: values.remark || values.remarks || null,
    remarks: values.remark || values.remarks || null,
    status: isStatusActive,
  };

  const res = await apiRequest<ApiResponse<BackendHsnItem>>("/masters/hsns", {
    method: "POST",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendHsnToMasterRecord(res.data);
  }
  return null;
}

export async function updateHsnApi(
  id: string,
  values: {
    code?: string;
    hsnCode?: string;
    description?: string;
    hsnCodeDescription?: string;
    gstPercentage?: string | number;
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
  const code = values.hsnCode || values.code;
  if (code) {
    body.code = code;
    body.hsnCode = code;
  }
  const description = values.hsnCodeDescription || values.description;
  if (description !== undefined) {
    body.description = description;
    body.hsnCodeDescription = description;
  }
  if (values.gstPercentage !== undefined) {
    body.gstPercentage = values.gstPercentage;
  }
  if (values.remark !== undefined || values.remarks !== undefined) {
    body.remark = values.remark ?? values.remarks ?? null;
    body.remarks = values.remark ?? values.remarks ?? null;
  }
  if (isStatusActive !== undefined) {
    body.status = isStatusActive;
  }

  const res = await apiRequest<ApiResponse<BackendHsnItem>>(`/masters/hsns/${id}`, {
    method: "PUT",
    body,
  });

  if (res?.success && res?.data) {
    return mapBackendHsnToMasterRecord(res.data);
  }
  return null;
}

export async function updateHsnStatusApi(
  id: string,
  checked: boolean,
): Promise<MasterRecord | null> {
  const res = await apiRequest<ApiResponse<BackendHsnItem>>(`/masters/hsns/${id}/status`, {
    method: "PATCH",
    body: { status: checked },
  });

  if (res?.success && res?.data) {
    return mapBackendHsnToMasterRecord(res.data);
  }
  return null;
}

export async function deleteHsnApi(id: string): Promise<boolean> {
  const res = await apiRequest<ApiResponse<{ id: string }>>(`/masters/hsns/${id}`, {
    method: "DELETE",
  });
  return Boolean(res?.success);
}

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";

export function syncHsnMasterToStorage(rows: MasterRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    parsed["hsn-master"] = rows.map((r) =>
      Object.fromEntries(
        Object.entries(r).map(([k, v]) => [k, v instanceof Date ? v.toISOString() : v])
      )
    );
    window.localStorage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}
