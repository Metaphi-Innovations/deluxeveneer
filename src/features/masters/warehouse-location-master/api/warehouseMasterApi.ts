import type { MasterFieldValue, MasterRecord } from "../../shared";
import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

interface BackendAuditUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface BackendWarehouseListItem {
  id: string;
  name: string;
  warehouseName?: string;
  code: string;
  warehouseCode?: string;
  type: string | null;
  warehouseType?: string | null;
  address: string | null;
  pincode: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  remarks: string | null;
  status: boolean;
  createdBy: BackendAuditUser | null;
  updatedBy: BackendAuditUser | null;
  createdAt: string;
  updatedAt: string;
}

type BackendWarehouseDetail = BackendWarehouseListItem;

export interface WarehouseMasterMetaResponse {
  types: Array<{ value: string; label: string }>;
  countries: Array<{ value: string; label: string }>;
  states: Array<{ value: string; label: string }>;
  cities: Array<{ value: string; label: string }>;
  columnFilters?: Record<string, Array<{ value: string; label: string }>>;
}

export type WarehouseMasterDropdownsResponse = WarehouseMasterMetaResponse;

export interface WarehouseMasterColumnDropdownResponse {
  column: string;
  options: Array<{ value: string; label: string }>;
}

export interface WarehouseMasterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  country?: string;
  state?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface WarehouseMasterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedWarehouseMasterResult {
  items: MasterRecord[];
  pagination: WarehouseMasterPagination;
}

export type WarehouseMasterDetail = MasterRecord;

const BASE_PATH = "/masters/warehouses";
const TYPE_LABELS = ["Inward", "Storage", "Production"];

export async function fetchWarehouseMasterMeta(): Promise<WarehouseMasterMetaResponse> {
  try {
    const res = await apiRequest<ApiResponse<WarehouseMasterMetaResponse>>(
      `${BASE_PATH}/meta`,
    );
    if (res?.success && res.data) {
      return {
        types: res.data.types ?? [],
        countries: res.data.countries ?? [],
        states: res.data.states ?? [],
        cities: res.data.cities ?? [],
        columnFilters: res.data.columnFilters ?? {},
      };
    }
  } catch (error) {
    console.error("[WarehouseMasterApi] fetchWarehouseMasterMeta error:", error);
  }

  return {
    types: TYPE_LABELS.map((label) => ({ value: label, label })),
    countries: [],
    states: [],
    cities: [],
    columnFilters: {},
  };
}

export async function fetchWarehouseMasterDropdowns(): Promise<WarehouseMasterDropdownsResponse> {
  return fetchWarehouseMasterMeta();
}

export async function fetchWarehouseMasterColumnDropdown(
  column: string,
): Promise<WarehouseMasterColumnDropdownResponse> {
  const res = await apiRequest<
    ApiResponse<WarehouseMasterColumnDropdownResponse>
  >(`${BASE_PATH}/dropdowns?column=${encodeURIComponent(column)}`);

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Unable to load column filter options.");
  }

  return {
    column: res.data.column ?? column,
    options: res.data.options ?? [],
  };
}

export async function fetchWarehouseMasterPaginated(
  params: WarehouseMasterQueryParams = {},
): Promise<PaginatedWarehouseMasterResult> {
  const queryParts: string[] = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search?.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.type) queryParts.push(`type=${encodeURIComponent(params.type)}`);
  if (params.country) {
    queryParts.push(`country=${encodeURIComponent(params.country)}`);
  }
  if (params.state) queryParts.push(`state=${encodeURIComponent(params.state)}`);
  if (params.status !== undefined) queryParts.push(`status=${params.status}`);
  if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.sortOrder) {
    queryParts.push(`sortOrder=${encodeURIComponent(params.sortOrder)}`);
  }
  if (params.filters && Object.keys(params.filters).length > 0) {
    queryParts.push(
      `filters=${encodeURIComponent(JSON.stringify(params.filters))}`,
    );
  }

  const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const res = await apiRequest<
    ApiResponse<{
      items: BackendWarehouseListItem[];
      pagination: WarehouseMasterPagination;
    }>
  >(`${BASE_PATH}${qs}`);

  if (!res?.success || !res.data?.items) {
    return {
      items: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 20,
        total: 0,
        totalPages: 1,
      },
    };
  }

  return {
    items: res.data.items.map(mapBackendListItemToRecord),
    pagination: res.data.pagination,
  };
}

export async function fetchWarehouseMasterDetail(
  id: string,
): Promise<WarehouseMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendWarehouseDetail>>(
    `${BASE_PATH}/${id}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Warehouse record not found.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function createWarehouseMasterRecord(
  values: Record<string, MasterFieldValue>,
): Promise<WarehouseMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendWarehouseDetail>>(BASE_PATH, {
    method: "POST",
    body: buildWarehousePayload(values),
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to create warehouse.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateWarehouseMasterRecord(
  id: string,
  values: Record<string, MasterFieldValue>,
): Promise<WarehouseMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendWarehouseDetail>>(
    `${BASE_PATH}/${id}`,
    {
      method: "PATCH",
      body: buildWarehousePayload(values),
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update warehouse.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateWarehouseMasterStatus(
  id: string,
  status: boolean,
): Promise<WarehouseMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendWarehouseDetail>>(
    `${BASE_PATH}/${id}/status`,
    {
      method: "PATCH",
      body: { status },
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update warehouse status.");
  }

  return mapBackendDetailToRecord(res.data);
}

function buildWarehousePayload(values: Record<string, MasterFieldValue>) {
  return {
    warehouseName: getStringValue(values.warehouseName) || null,
    name: getStringValue(values.warehouseName) || null,
    warehouseCode: getStringValue(values.warehouseCode) || null,
    code: getStringValue(values.warehouseCode) || null,
    warehouseType: getStringValue(values.warehouseType) || null,
    type: getStringValue(values.warehouseType) || null,
    address: getStringValue(values.address) || null,
    pincode: getStringValue(values.pincode) || null,
    country: getStringValue(values.country) || null,
    state: getStringValue(values.state) || null,
    city: getStringValue(values.city) || null,
    remarks:
      getStringValue(values.remark) || getStringValue(values.remarks) || null,
  };
}

function mapBackendListItemToRecord(item: BackendWarehouseListItem): MasterRecord {
  return {
    id: item.id,
    warehouseName: item.warehouseName ?? item.name ?? "",
    warehouseCode: item.warehouseCode ?? item.code ?? "",
    warehouseType: item.warehouseType ?? item.type ?? "",
    address: item.address ?? "",
    pincode: item.pincode ?? "",
    country: item.country ?? "",
    state: item.state ?? "",
    city: item.city ?? "",
    remark: item.remarks ?? "",
    status: item.status ? "Active" : "Inactive",
    createdBy: formatAuditName(item.createdBy),
    editedBy: formatAuditName(item.updatedBy),
    updatedBy: formatAuditName(item.updatedBy),
    createdDate: item.createdAt ? new Date(item.createdAt) : null,
    updatedDate: item.updatedAt ? new Date(item.updatedAt) : null,
  };
}

function mapBackendDetailToRecord(
  item: BackendWarehouseDetail,
): WarehouseMasterDetail {
  return mapBackendListItemToRecord(item);
}

function formatAuditName(user: BackendAuditUser | null): string {
  if (!user) return "";
  return `${user.firstName} ${user.lastName}`.trim();
}

function getStringValue(
  value: MasterFieldValue | undefined,
  fallback = "",
): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object" && !(value instanceof Date)) {
    if ("name" in value && typeof value.name === "string") {
      return value.name.trim();
    }
  }
  return fallback;
}
