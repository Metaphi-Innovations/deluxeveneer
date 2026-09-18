import type { MasterFieldValue, MasterRecord } from "../../shared";
import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";
import { encodeMasterDocumentValue } from "../../shared/masterDocumentValue";

interface BackendAuditUser {
  id: string;
  firstName: string;
  lastName: string;
}

interface BackendSupplierContactPerson {
  id?: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
  designation: string | null;
  sortOrder: number;
}

interface BackendSupplierListItem {
  id: string;
  name: string;
  supplierName?: string;
  contactPersonName: string | null;
  email: string | null;
  emailAddress?: string | null;
  phoneNumber: string | null;
  mobileNumber?: string | null;
  country: string | null;
  msmeType: string | null;
  gstNo: string | null;
  remarks: string | null;
  status: boolean;
  createdBy: BackendAuditUser | null;
  updatedBy: BackendAuditUser | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendSupplierDetail extends BackendSupplierListItem {
  address: string | null;
  pincode: string | null;
  state: string | null;
  city: string | null;
  msmeNo: string | null;
  gstDocumentUrl: string | null;
  fscCode: string | null;
  panNo: string | null;
  panDocumentUrl: string | null;
  contactPersons: BackendSupplierContactPerson[];
}

export interface SupplierMasterMetaResponse {
  countries: Array<{ value: string; label: string }>;
  states: Array<{ value: string; label: string }>;
  cities: Array<{ value: string; label: string }>;
  msmeTypes: Array<{ value: string; label: string }>;
  columnFilters?: Record<
    string,
    Array<{
      value: string;
      label: string;
    }>
  >;
}

export type SupplierMasterDropdownsResponse = SupplierMasterMetaResponse;

export interface SupplierMasterQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  country?: string;
  msmeType?: string;
  status?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filters?: Record<string, string[]>;
}

export interface SupplierMasterPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedSupplierMasterResult {
  items: MasterRecord[];
  pagination: SupplierMasterPagination;
}

export interface SupplierContactPersonInput {
  contactPersonName: string;
  designation: string;
  email: string;
  phoneNumber: string;
}

export interface SupplierMasterDetail extends MasterRecord {
  contactPersonsJson: string;
}

const BASE_PATH = "/masters/suppliers";

let supplierRowsCache: MasterRecord[] = [];

export function getCachedSupplierMasterRows(): MasterRecord[] {
  return supplierRowsCache;
}

export async function refreshSupplierMasterCache(
  items?: MasterRecord[],
): Promise<MasterRecord[]> {
  if (items) {
    supplierRowsCache = items;
    return supplierRowsCache;
  }

  const result = await fetchSupplierMasterPaginated({
    page: 1,
    limit: 100,
    status: true,
  });
  supplierRowsCache = result.items;
  return supplierRowsCache;
}

export async function fetchSupplierMasterMeta(): Promise<SupplierMasterMetaResponse> {
  try {
    const res = await apiRequest<ApiResponse<SupplierMasterMetaResponse>>(
      `${BASE_PATH}/meta`,
    );
    if (res?.success && res.data) {
      return {
        countries: res.data.countries ?? [],
        states: res.data.states ?? [],
        cities: res.data.cities ?? [],
        msmeTypes: res.data.msmeTypes ?? [],
        columnFilters: res.data.columnFilters ?? {},
      };
    }
  } catch (error) {
    console.error("[SupplierMasterApi] fetchSupplierMasterMeta error:", error);
  }

  return {
    countries: [],
    states: [],
    cities: [],
    msmeTypes: [],
    columnFilters: {},
  };
}

export async function fetchSupplierMasterDropdowns(): Promise<SupplierMasterDropdownsResponse> {
  try {
    const res = await apiRequest<ApiResponse<SupplierMasterDropdownsResponse>>(
      `${BASE_PATH}/dropdowns`,
    );
    if (res?.success && res.data) {
      return {
        countries: res.data.countries ?? [],
        states: res.data.states ?? [],
        cities: res.data.cities ?? [],
        msmeTypes: res.data.msmeTypes ?? [],
        columnFilters: res.data.columnFilters ?? {},
      };
    }
  } catch (error) {
    console.error(
      "[SupplierMasterApi] fetchSupplierMasterDropdowns error:",
      error,
    );
  }

  return fetchSupplierMasterMeta();
}

export async function fetchSupplierMasterPaginated(
  params: SupplierMasterQueryParams = {},
): Promise<PaginatedSupplierMasterResult> {
  const queryParts: string[] = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search?.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.country) {
    queryParts.push(`country=${encodeURIComponent(params.country)}`);
  }
  if (params.msmeType) {
    queryParts.push(`msmeType=${encodeURIComponent(params.msmeType)}`);
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
      items: BackendSupplierListItem[];
      pagination: SupplierMasterPagination;
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

export async function fetchSupplierMasterDetail(
  id: string,
): Promise<SupplierMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendSupplierDetail>>(
    `${BASE_PATH}/${id}`,
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Supplier record not found.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function createSupplierMasterRecord(
  values: Record<string, MasterFieldValue>,
  contacts: SupplierContactPersonInput[] = [],
): Promise<SupplierMasterDetail> {
  const payload = await buildSupplierPayload(values, contacts);
  const res = await apiRequest<ApiResponse<BackendSupplierDetail>>(BASE_PATH, {
    method: "POST",
    body: payload,
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to create supplier.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateSupplierMasterRecord(
  id: string,
  values: Record<string, MasterFieldValue>,
  contacts: SupplierContactPersonInput[] = [],
): Promise<SupplierMasterDetail> {
  const payload = await buildSupplierPayload(values, contacts);
  const res = await apiRequest<ApiResponse<BackendSupplierDetail>>(
    `${BASE_PATH}/${id}`,
    {
      method: "PATCH",
      body: payload,
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update supplier.");
  }

  return mapBackendDetailToRecord(res.data);
}

export async function updateSupplierMasterStatus(
  id: string,
  status: boolean,
): Promise<SupplierMasterDetail> {
  const res = await apiRequest<ApiResponse<BackendSupplierDetail>>(
    `${BASE_PATH}/${id}/status`,
    {
      method: "PATCH",
      body: { status },
    },
  );

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update supplier status.");
  }

  return mapBackendDetailToRecord(res.data);
}

async function buildSupplierPayload(
  values: Record<string, MasterFieldValue>,
  contacts: SupplierContactPersonInput[],
) {
  const [gstDocumentUrl, panDocumentUrl] = await Promise.all([
    getFilePayloadValue(values.gstUpload),
    getFilePayloadValue(values.panUpload),
  ]);

  return {
    supplierName: getStringValue(values.supplierName) || null,
    name: getStringValue(values.supplierName) || null,
    address: getStringValue(values.address) || null,
    pincode: getStringValue(values.pincode) || null,
    country: getStringValue(values.country) || null,
    state: getStringValue(values.state) || null,
    city: getStringValue(values.city) || null,
    msmeType: getStringValue(values.msmeType) || null,
    msmeNo: getStringValue(values.msmeNo) || null,
    gstNo: getStringValue(values.gstNo) || null,
    gstDocumentUrl,
    fscCode: getStringValue(values.fscCode) || null,
    panNo: getStringValue(values.panNo) || null,
    panDocumentUrl,
    remarks:
      getStringValue(values.remark) || getStringValue(values.remarks) || null,
    contactPersons: contacts
      .filter((contact) => contact.contactPersonName.trim())
      .map((contact, index) => ({
        name: contact.contactPersonName.trim(),
        email: contact.email.trim() || null,
        phoneNumber: contact.phoneNumber.replace(/\D/g, "") || null,
        designation: contact.designation.trim() || null,
        sortOrder: index,
      })),
  };
}

function mapBackendListItemToRecord(item: BackendSupplierListItem): MasterRecord {
  const email = item.emailAddress ?? item.email ?? "";
  const phone = item.mobileNumber ?? item.phoneNumber ?? "";

  return {
    id: item.id,
    supplierName: item.supplierName ?? item.name ?? "",
    contactPersonName: item.contactPersonName ?? "",
    emailAddress: email,
    mobileNumber: phone,
    country: item.country ?? "",
    msmeType: item.msmeType ?? "",
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
  item: BackendSupplierDetail,
): SupplierMasterDetail {
  const contacts = (item.contactPersons || []).map((contact) => ({
    contactPersonName: contact.name ?? "",
    designation: contact.designation ?? "",
    email: contact.email ?? "",
    phoneNumber: (contact.phoneNumber ?? "").replace(/\D/g, "").slice(-10),
  }));

  return {
    ...mapBackendListItemToRecord(item),
    address: item.address ?? "",
    pincode: item.pincode ?? "",
    state: item.state ?? "",
    city: item.city ?? "",
    msmeNo: item.msmeNo ?? "",
    fscCode: item.fscCode ?? "",
    gstUpload: item.gstDocumentUrl ?? "",
    panNo: item.panNo ?? "",
    panUpload: item.panDocumentUrl ?? "",
    contactPersonsJson: JSON.stringify(contacts),
  };
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
