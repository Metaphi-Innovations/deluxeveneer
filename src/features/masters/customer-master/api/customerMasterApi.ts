import type { MasterFieldValue, MasterRecord } from "../../shared";
import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";
import { encodeMasterDocumentValue } from "../../shared/masterDocumentValue";

interface BackendAuditUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface BackendCustomerAddress {
  id?: string;
  address: string | null;
  pincode: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  sortOrder: number;
}

interface BackendCustomerListItem {
  id: string;
  customerName: string | null;
  companyName: string | null;
  customerType: string | null;
  email: string | null;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  gstNo: string | null;
  remarks: string | null;
  status: boolean;
  createdBy: BackendAuditUser | null;
  updatedBy: BackendAuditUser | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendCustomerDetail extends BackendCustomerListItem {
  dateOfBirth: string | null;
  address: string | null;
  pincode: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  gstDocumentUrl: string | null;
  panNo: string | null;
  panDocumentUrl: string | null;
  addresses: BackendCustomerAddress[];
}

export interface CustomerMasterMetaResponse {
  customerTypes: Array<{
    value: string;
    label: string;
  }>;
  companyNames: Array<{
    value: string;
    label: string;
  }>;
  columnFilters?: Record<
    string,
    Array<{
      value: string;
      label: string;
    }>
  >;
}

export type CustomerMasterDropdownsResponse = CustomerMasterMetaResponse;

export interface CustomerMasterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  customerType?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface CustomerMasterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedCustomerMasterResult {
  items: MasterRecord[];
  pagination: CustomerMasterPagination;
}

export interface CustomerMasterDetail extends MasterRecord {
  customerAddresses: string;
}

const BASE_PATH = "/masters/customers";

let customerRowsCache: MasterRecord[] = [];

export function getCachedCustomerMasterRows(): MasterRecord[] {
  return customerRowsCache;
}

export async function refreshCustomerMasterCache(
  items?: MasterRecord[],
): Promise<MasterRecord[]> {
  if (items) {
    customerRowsCache = items;
    return customerRowsCache;
  }

  const result = await fetchCustomerMasterPaginated({
    page: 1,
    limit: 100,
    status: true,
  });
  customerRowsCache = result.items;
  return customerRowsCache;
}

export async function fetchCustomerMasterMeta(): Promise<CustomerMasterMetaResponse> {
  try {
    const res = await apiRequest<ApiResponse<CustomerMasterMetaResponse>>(
      `${BASE_PATH}/meta`,
    );
    if (res?.success && res.data) {
      return {
        customerTypes: res.data.customerTypes ?? [],
        companyNames: res.data.companyNames ?? [],
        columnFilters: res.data.columnFilters ?? {},
      };
    }
  } catch (error) {
    console.error("[CustomerMasterApi] fetchCustomerMasterMeta error:", error);
  }

  return {
    customerTypes: [
      { value: "PLATINUM", label: "Platinum" },
      { value: "GOLD", label: "Gold" },
      { value: "SILVER", label: "Silver" },
    ],
    companyNames: [],
    columnFilters: {},
  };
}

export async function fetchCustomerMasterDropdowns(): Promise<CustomerMasterDropdownsResponse> {
  try {
    const res = await apiRequest<ApiResponse<CustomerMasterDropdownsResponse>>(
      `${BASE_PATH}/dropdowns`,
    );
    if (res?.success && res.data) {
      return {
        customerTypes: res.data.customerTypes ?? [],
        companyNames: res.data.companyNames ?? [],
        columnFilters: res.data.columnFilters ?? {},
      };
    }
  } catch (error) {
    console.error(
      "[CustomerMasterApi] fetchCustomerMasterDropdowns error:",
      error,
    );
  }

  return fetchCustomerMasterMeta();
}

export async function fetchCustomerMasterPaginated(
  params: CustomerMasterQueryParams = {},
): Promise<PaginatedCustomerMasterResult> {
  const queryParts: string[] = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search?.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.customerType) {
    queryParts.push(
      `customerType=${encodeURIComponent(params.customerType)}`,
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
      items: BackendCustomerListItem[];
      pagination: CustomerMasterPagination;
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

export async function fetchCustomerMasterDetail(
  id: string,
): Promise<CustomerMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendCustomerDetail>>(
    `${BASE_PATH}/${id}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Customer record not found.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function createCustomerMasterRecord(
  values: Record<string, MasterFieldValue>,
  addresses: Array<{
    address: string;
    pincode: string;
    country: string;
    state: string;
    city: string;
  }> = [],
): Promise<CustomerMasterDetail> {
  const payload = await buildCustomerPayload(values, addresses);
  const res = await apiRequest<ApiResponse<BackendCustomerDetail>>(BASE_PATH, {
    method: "POST",
    body: payload,
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to create customer.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateCustomerMasterRecord(
  id: string,
  values: Record<string, MasterFieldValue>,
  addresses: Array<{
    address: string;
    pincode: string;
    country: string;
    state: string;
    city: string;
  }> = [],
): Promise<CustomerMasterDetail> {
  const payload = await buildCustomerPayload(values, addresses);
  const res = await apiRequest<ApiResponse<BackendCustomerDetail>>(
    `${BASE_PATH}/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update customer.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateCustomerMasterStatus(
  id: string,
  status: boolean,
): Promise<CustomerMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendCustomerDetail>>(
    `${BASE_PATH}/${id}/status`,
    {
      method: "PATCH",
      body: { status },
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update customer status.");
  }

  return mapBackendDetailToRecord(res.data);
}

async function buildCustomerPayload(
  values: Record<string, MasterFieldValue>,
  addresses: Array<{
    address: string;
    pincode: string;
    country: string;
    state: string;
    city: string;
  }>,
) {
  const [gstDocumentUrl, panDocumentUrl] = await Promise.all([
    getFilePayloadValue(values.gstUpload),
    getFilePayloadValue(values.panUpload),
  ]);

  return {
    customerName: getStringValue(values.customerName) || null,
    companyName: getStringValue(values.companyName) || null,
    customerType: getStringValue(values.customerType) || null,
    dateOfBirth: getDateString(values.dob ?? values.dateOfBirth),
    email: getStringValue(values.email) || null,
    phoneCountryCode:
      getStringValue(values.phoneNumberCountryCode) ||
      getStringValue(values.phoneCountryCode) ||
      (getLocalPhoneDigits(values.phoneNumber) ? "+91" : null),
    phoneNumber: getLocalPhoneDigits(values.phoneNumber) || null,
    address: getStringValue(values.address) || null,
    pincode: getStringValue(values.pincode) || null,
    country: getStringValue(values.country) || null,
    state: getStringValue(values.state) || null,
    city: getStringValue(values.city) || null,
    gstNo: getStringValue(values.gstNo) || null,
    gstDocumentUrl,
    panNo: getStringValue(values.panNo) || null,
    panDocumentUrl,
    remarks:
      getStringValue(values.remark) || getStringValue(values.remarks) || null,
    addresses: addresses.map((address, index) => ({
      address: address.address || null,
      pincode: address.pincode || null,
      country: address.country || null,
      state: address.state || null,
      city: address.city || null,
      sortOrder: index,
    })),
  };
}

function mapBackendListItemToRecord(item: BackendCustomerListItem): MasterRecord {
  return {
    id: item.id,
    customerName: item.customerName ?? "",
    companyName: item.companyName ?? "",
    customerType: item.customerType ?? "",
    email: item.email ?? "",
    phoneNumber: formatPhoneDisplay(item.phoneCountryCode, item.phoneNumber),
    phoneNumberCountryCode: item.phoneCountryCode ?? "+91",
    gstNo: item.gstNo ?? "",
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
  item: BackendCustomerDetail,
): CustomerMasterDetail {
  return {
    ...mapBackendListItemToRecord(item),
    dob: item.dateOfBirth ? new Date(item.dateOfBirth) : null,
    dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : null,
    phoneNumber: getLocalPhoneDigits(item.phoneNumber) || "",
    phoneNumberCountryCode: item.phoneCountryCode ?? "+91",
    address: item.address ?? "",
    pincode: item.pincode ?? "",
    country: item.country ?? "",
    state: item.state ?? "",
    city: item.city ?? "",
    gstUpload: item.gstDocumentUrl ?? "",
    panNo: item.panNo ?? "",
    panUpload: item.panDocumentUrl ?? "",
    customerAddresses: JSON.stringify(
      (item.addresses || []).map((address) => ({
        address: address.address ?? "",
        pincode: address.pincode ?? "",
        country: address.country ?? "",
        state: address.state ?? "",
        city: address.city ?? "",
      })),
    ),
  };
}

function formatAuditName(user: BackendAuditUser | null): string {
  if (!user) return "";
  return `${user.firstName} ${user.lastName}`.trim();
}

function formatPhoneDisplay(
  countryCode: string | null,
  phoneNumber: string | null,
): string {
  const code = countryCode?.trim() || "";
  const number = phoneNumber?.trim() || "";
  if (!code && !number) return "";
  if (!code) return number;
  if (!number) return code;
  return `${code} ${number}`.trim();
}

function getLocalPhoneDigits(value: MasterFieldValue | undefined): string {
  if (typeof value !== "string") return "";
  return value.replace(/\D/g, "").slice(-10);
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

async function getFilePayloadValue(
  value: MasterFieldValue | undefined,
): Promise<string | null> {
  if (!value) return null;

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "object" && !(value instanceof Date)) {
    const file = "file" in value ? value.file : undefined;
    const existingName =
      "name" in value && typeof value.name === "string" ? value.name.trim() : "";

    if (file instanceof File) {
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result !== "string" || !reader.result) {
            resolve(null);
            return;
          }

          resolve(
            encodeMasterDocumentValue(file.name || existingName, reader.result),
          );
        };
        reader.onerror = () => {
          const fallbackUrl =
            ("previewUrl" in value && value.previewUrl) || existingName || null;
          resolve(
            fallbackUrl
              ? encodeMasterDocumentValue(
                  file.name || existingName || "Document",
                  fallbackUrl,
                )
              : null,
          );
        };
        reader.readAsDataURL(file);
      });
    }

    if ("previewUrl" in value && value.previewUrl) {
      const previewUrl = value.previewUrl.trim();
      if (!previewUrl) {
        return null;
      }

      if (previewUrl.startsWith("{") || !existingName) {
        return previewUrl;
      }

      return encodeMasterDocumentValue(existingName, previewUrl);
    }

    if (existingName) {
      return existingName;
    }
  }

  return null;
}

function getDateString(value: MasterFieldValue | undefined): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0] ?? null;
  }
  if (typeof value === "string" && value.trim()) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString().split("T")[0] ?? null;
    }
  }
  return null;
}
