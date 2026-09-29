import type { MasterFieldValue, MasterRecord } from "../../shared";
import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

interface BackendAuditUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface BackendTransporterListItem {
  id: string;
  name: string;
  transporterName?: string;
  branchName: string | null;
  transporterCode: string;
  transporterId?: string;
  type: string | null;
  areaOfOperation: string | null;
  remarks: string | null;
  status: boolean;
  createdBy: BackendAuditUser | null;
  updatedBy: BackendAuditUser | null;
  createdAt: string;
  updatedAt: string;
}

type BackendTransporterDetail = BackendTransporterListItem;

export interface TransporterMasterMetaResponse {
  types: Array<{ value: string; label: string }>;
  areaOfOperations: Array<{ value: string; label: string }>;
  branchNames: Array<{ value: string; label: string }>;
  columnFilters?: Record<
    string,
    Array<{
      value: string;
      label: string;
    }>
  >;
}

export type TransporterMasterDropdownsResponse = TransporterMasterMetaResponse;

export interface TransporterMasterColumnDropdownResponse {
  column: string;
  options: Array<{
    value: string;
    label: string;
  }>;
}

export interface TransporterMasterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  type?: string;
  areaOfOperation?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface TransporterMasterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedTransporterMasterResult {
  items: MasterRecord[];
  pagination: TransporterMasterPagination;
}

export type TransporterMasterDetail = MasterRecord;

const BASE_PATH = "/masters/transporters";

let transporterRowsCache: MasterRecord[] = [];

export function getCachedTransporterMasterRows(): MasterRecord[] {
  return transporterRowsCache;
}

export async function refreshTransporterMasterCache(
  items?: MasterRecord[],
): Promise<MasterRecord[]> {
  if (items) {
    transporterRowsCache = items;
    return transporterRowsCache;
  }

  const result = await fetchTransporterMasterPaginated({
    page: 1,
    limit: 100,
    status: true,
  });
  transporterRowsCache = result.items;
  return transporterRowsCache;
}

export async function fetchTransporterMasterMeta(): Promise<TransporterMasterMetaResponse> {
  try {
    const res = await apiRequest<ApiResponse<TransporterMasterMetaResponse>>(
      `${BASE_PATH}/meta`,
    );
    if (res?.success && res.data) {
      return {
        types: res.data.types ?? [],
        areaOfOperations: res.data.areaOfOperations ?? [],
        branchNames: res.data.branchNames ?? [],
        columnFilters: res.data.columnFilters ?? {},
      };
    }
  } catch (error) {
    console.error(
      "[TransporterMasterApi] fetchTransporterMasterMeta error:",
      error,
    );
  }

  return {
    types: [
      { value: "ROAD", label: "Road" },
      { value: "AIR", label: "Air" },
      { value: "RAIL", label: "Rail" },
    ],
    areaOfOperations: [],
    branchNames: [],
    columnFilters: {},
  };
}

export async function fetchTransporterMasterDropdowns(): Promise<TransporterMasterDropdownsResponse> {
  return fetchTransporterMasterMeta();
}

export async function fetchTransporterMasterColumnDropdown(
  column: string,
): Promise<TransporterMasterColumnDropdownResponse> {
  const res = await apiRequest<
    ApiResponse<TransporterMasterColumnDropdownResponse>
  >(`${BASE_PATH}/dropdowns?column=${encodeURIComponent(column)}`);

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Unable to load column filter options.");
  }

  return {
    column: res.data.column ?? column,
    options: res.data.options ?? [],
  };
}

export async function fetchTransporterMasterPaginated(
  params: TransporterMasterQueryParams = {},
): Promise<PaginatedTransporterMasterResult> {
  const queryParts: string[] = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search?.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.type) {
    queryParts.push(`type=${encodeURIComponent(params.type)}`);
  }
  if (params.areaOfOperation) {
    queryParts.push(
      `areaOfOperation=${encodeURIComponent(params.areaOfOperation)}`,
    );
  }
  if (params.status !== undefined) {
    queryParts.push(`status=${params.status}`);
  }
  if (params.sortBy) {
    queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  }
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
      items: BackendTransporterListItem[];
      pagination: TransporterMasterPagination;
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

export async function fetchTransporterMasterDetail(
  id: string,
): Promise<TransporterMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendTransporterDetail>>(
    `${BASE_PATH}/${id}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Transporter record not found.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function createTransporterMasterRecord(
  values: Record<string, MasterFieldValue>,
): Promise<TransporterMasterDetail> {
  const payload = buildTransporterPayload(values);
  const res = await apiRequest<ApiResponse<BackendTransporterDetail>>(
    BASE_PATH,
    {
      method: "POST",
      body: payload,
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to create transporter.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateTransporterMasterRecord(
  id: string,
  values: Record<string, MasterFieldValue>,
): Promise<TransporterMasterDetail> {
  const payload = buildTransporterPayload(values);
  const res = await apiRequest<ApiResponse<BackendTransporterDetail>>(
    `${BASE_PATH}/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update transporter.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateTransporterMasterStatus(
  id: string,
  status: boolean,
): Promise<TransporterMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendTransporterDetail>>(
    `${BASE_PATH}/${id}/status`,
    {
      method: "PATCH",
      body: { status },
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update transporter status.");
  }

  return mapBackendDetailToRecord(res.data);
}

function buildTransporterPayload(values: Record<string, MasterFieldValue>) {
  return {
    transporterName: getStringValue(values.transporterName) || null,
    name: getStringValue(values.transporterName) || null,
    branchName: getStringValue(values.branchName) || null,
    transporterId: getStringValue(values.transporterId) || null,
    transporterCode: getStringValue(values.transporterId) || null,
    type: getStringValue(values.type) || null,
    areaOfOperation: getStringValue(values.areaOfOperation) || null,
    remarks:
      getStringValue(values.remark) || getStringValue(values.remarks) || null,
  };
}

function mapBackendListItemToRecord(
  item: BackendTransporterListItem,
): MasterRecord {
  return {
    id: item.id,
    transporterName: item.transporterName ?? item.name ?? "",
    branchName: item.branchName ?? "",
    transporterId: item.transporterId ?? item.transporterCode ?? "",
    type: item.type ?? "",
    areaOfOperation: item.areaOfOperation ?? "",
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
  item: BackendTransporterDetail,
): TransporterMasterDetail {
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
    if (
      "previewUrl" in value &&
      typeof value.previewUrl === "string" &&
      value.previewUrl
    ) {
      return value.previewUrl.trim();
    }
    if ("name" in value && typeof value.name === "string") {
      return value.name.trim();
    }
  }
  return fallback;
}
