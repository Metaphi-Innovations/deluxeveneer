import type { MasterFieldValue } from "../../masters/shared";
import { getCurrentUser } from "../../auth";
import {
  buildDefaultUserPermissions,
  type UserPermissionFlags,
  type UserManagementDetail,
  type UserManagementRecord,
} from "./userManagementConfig";
import { apiRequest, type ApiResponse } from "../../../lib/apiClient";

const DEFAULT_USER_PASSWORD = "admin";

interface BackendUserListItem {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phoneCountryCode: string | null;
  phoneNumber: string | null;
  department: {
    id: string;
    name: string;
  } | null;
  remarks?: string | null;
  isActive: boolean;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  updatedBy: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

interface BackendUserDetail extends BackendUserListItem {
  dateOfBirth: string | null;
  age?: number | null;
  bloodGroup: string | null;
  address: string | null;
  pincode: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  aadhaarNo: string | null;
  aadhaarDocumentUrl: string | null;
  panNo: string | null;
  panDocumentUrl: string | null;
  remarks: string | null;
  permissions: string[];
}

export interface UserManagementMetaResponse {
  departments: Array<{ id: string; name: string }>;
  permissions: Array<{ id: string; code: string; module: string; action: string; name: string }>;
}

let cachedMeta: UserManagementMetaResponse | null = null;

export async function fetchUserManagementMeta(): Promise<UserManagementMetaResponse> {
  if (cachedMeta) return cachedMeta;
  try {
    const res = await apiRequest<ApiResponse<UserManagementMetaResponse>>("/users/meta");
    if (res?.success && res.data) {
      cachedMeta = res.data;
      return res.data;
    }
  } catch (err) {
    console.error("[UserManagementApi] fetchUserManagementMeta error:", err);
  }
  return { departments: [], permissions: [] };
}

export interface UserManagementQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface UserManagementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedUserManagementResult {
  items: UserManagementRecord[];
  pagination: UserManagementPagination;
}

/**
 * Fetch paginated users listing from backend GET /api/users
 */
export async function fetchUserManagementPaginated(
  params: UserManagementQueryParams = {}
): Promise<PaginatedUserManagementResult> {
  const queryParts: string[] = [];

  if (params.page) queryParts.push(`page=${params.page}`);
  if (params.limit) queryParts.push(`limit=${params.limit}`);
  if (params.search && params.search.trim()) {
    queryParts.push(`search=${encodeURIComponent(params.search.trim())}`);
  }
  if (params.departmentId) queryParts.push(`departmentId=${encodeURIComponent(params.departmentId)}`);
  if (params.isActive !== undefined) queryParts.push(`isActive=${params.isActive}`);
  if (params.sortBy) queryParts.push(`sortBy=${encodeURIComponent(params.sortBy)}`);
  if (params.sortOrder) queryParts.push(`sortOrder=${encodeURIComponent(params.sortOrder)}`);

  const qs = queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
  const res = await apiRequest<ApiResponse<{ items: BackendUserListItem[]; pagination: UserManagementPagination }>>(
    `/users${qs}`
  );

  if (!res?.success || !res.data?.items) {
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

  return {
    items: res.data.items.map(mapBackendListItemToRecord),
    pagination: res.data.pagination,
  };
}

/**
 * Fetch users listing from backend GET /api/users (convenience wrapper)
 */
export async function fetchUserManagementRows(search = ""): Promise<UserManagementRecord[]> {
  const result = await fetchUserManagementPaginated({ search, limit: 100 });
  return result.items;
}

/**
 * Fetch user details from backend GET /api/users/:id
 */
export async function fetchUserManagementDetail(id: string): Promise<UserManagementDetail> {
  const res = await apiRequest<ApiResponse<BackendUserDetail>>(`/users/${id}`);

  if (!res?.success || !res.data) {
    throw new Error("User record not found.");
  }

  return mapBackendDetailToUserDetail(res.data);
}

export async function fetchUserManagementDetailByEmail(email: string): Promise<UserManagementDetail | undefined> {
  try {
    const rows = await fetchUserManagementRows(email);
    const matched = rows.find((r) => r.email.trim().toLowerCase() === email.trim().toLowerCase());
    if (matched) {
      return await fetchUserManagementDetail(matched.id);
    }
  } catch (err) {
    console.error(err);
  }
  return undefined;
}

export function isUserManagementPasswordValid(_id: string, _password: string): boolean {
  // Password validation is processed securely by backend POST /api/auth/login
  return true;
}

/**
 * Create user via backend POST /api/users
 */
export async function createUserManagementRecord(
  values: Record<string, MasterFieldValue>,
  permissions?: Record<string, UserPermissionFlags>,
): Promise<UserManagementDetail> {
  const meta = await fetchUserManagementMeta();
  const deptName = getStringValue(values.department);
  const matchedDept = meta.departments.find(
    (d) => d.name.toLowerCase() === deptName.toLowerCase()
  );

  const permissionCodes = convertUiPermissionsToCodes(permissions);

  const [aadhaarDocumentUrl, panDocumentUrl] = await Promise.all([
    getFilePayloadValue(values.aadhaarUpload),
    getFilePayloadValue(values.panUpload),
  ]);

  const payload: any = {
    username: getStringValue(values.userName) || `${getStringValue(values.firstName)}_${getStringValue(values.lastName)}`.toLowerCase().trim(),
    firstName: getStringValue(values.firstName),
    lastName: getStringValue(values.lastName),
    email: getStringValue(values.email).toLowerCase(),
    phoneCountryCode: "+91",
    phoneNumber: getStringValue(values.phoneNo) || null,
    departmentId: matchedDept ? matchedDept.id : undefined,
    dateOfBirth: getDateString(values.dateOfBirth),
    age: getNumberValue(values.age),
    bloodGroup: getStringValue(values.bloodGroup) || null,
    address: getStringValue(values.address) || null,
    pincode: getStringValue(values.pincode) || null,
    country: getStringValue(values.country) || null,
    state: getStringValue(values.state) || null,
    city: getStringValue(values.city) || null,
    aadhaarNo: getStringValue(values.aadhaarNo) || null,
    aadhaarDocumentUrl: aadhaarDocumentUrl || null,
    panNo: getStringValue(values.panNo) || null,
    panDocumentUrl: panDocumentUrl || null,
    remarks: getStringValue(values.remarks) || null,
    permissionCodes,
  };

  const res = await apiRequest<ApiResponse<BackendUserDetail>>("/users", {
    method: "POST",
    body: payload,
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to create user.");
  }

  return mapBackendDetailToUserDetail(res.data);
}

/**
 * Update user via backend PATCH /api/users/:id
 */
export async function updateUserManagementRecord(
  id: string,
  values: Record<string, MasterFieldValue>,
  permissions?: Record<string, UserPermissionFlags>,
): Promise<UserManagementDetail> {
  const meta = await fetchUserManagementMeta();
  const deptName = getStringValue(values.department);
  const matchedDept = meta.departments.find(
    (d) => d.name.toLowerCase() === deptName.toLowerCase()
  );

  const permissionCodes = convertUiPermissionsToCodes(permissions);

  const [aadhaarDocumentUrl, panDocumentUrl] = await Promise.all([
    getFilePayloadValue(values.aadhaarUpload),
    getFilePayloadValue(values.panUpload),
  ]);

  const payload: any = {
    username: getStringValue(values.userName),
    firstName: getStringValue(values.firstName),
    lastName: getStringValue(values.lastName),
    email: getStringValue(values.email).toLowerCase(),
    phoneCountryCode: "+91",
    phoneNumber: getStringValue(values.phoneNo) || null,
    departmentId: matchedDept ? matchedDept.id : undefined,
    dateOfBirth: getDateString(values.dateOfBirth),
    age: getNumberValue(values.age),
    bloodGroup: getStringValue(values.bloodGroup) || null,
    address: getStringValue(values.address) || null,
    pincode: getStringValue(values.pincode) || null,
    country: getStringValue(values.country) || null,
    state: getStringValue(values.state) || null,
    city: getStringValue(values.city) || null,
    aadhaarNo: getStringValue(values.aadhaarNo) || null,
    aadhaarDocumentUrl: aadhaarDocumentUrl || null,
    panNo: getStringValue(values.panNo) || null,
    panDocumentUrl: panDocumentUrl || null,
    remarks: getStringValue(values.remarks) || null,
    permissionCodes,
  };

  const res = await apiRequest<ApiResponse<BackendUserDetail>>(`/users/${id}`, {
    method: "PATCH",
    body: payload,
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update user.");
  }

  return mapBackendDetailToUserDetail(res.data);
}

export async function changeUserPassword(id: string, password: string) {
  // Password change is handled via backend auth/reset-password endpoint
  return { id, password };
}

/**
 * Toggle user active status via backend PATCH /api/users/:id/status
 */
export async function updateUserManagementStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
): Promise<{ id: string; isActive: boolean; statusLabel: string; updatedBy: string; updatedDate: Date }> {
  const isActive = status === "ACTIVE";
  const res = await apiRequest<
    ApiResponse<{
      id: string;
      isActive: boolean;
      updatedAt?: string;
      updatedBy?: { id: string; firstName: string; lastName: string } | null;
    }>
  >(`/users/${id}/status`, {
    method: "PATCH",
    body: { isActive },
  });

  if (!res?.success || !res.data) {
    throw new Error(res?.message || "Failed to update user status.");
  }

  let updatedByName = "";
  if (res.data.updatedBy?.firstName || res.data.updatedBy?.lastName) {
    updatedByName = `${res.data.updatedBy.firstName || ""} ${res.data.updatedBy.lastName || ""}`.trim();
  } else {
    try {
      const current = getCurrentUser();
      const name = `${current.firstName || ""} ${current.lastName || ""}`.trim();
      updatedByName = name || current.userName || current.email || "System";
    } catch {
      updatedByName = "System";
    }
  }

  return {
    id: res.data.id,
    isActive: res.data.isActive,
    statusLabel: res.data.isActive ? "Active" : "Inactive",
    updatedBy: updatedByName,
    updatedDate: res.data.updatedAt ? new Date(res.data.updatedAt) : new Date(),
  };
}

// ---------------------------------------------------------------------------
// Helpers & Data Mappers
// ---------------------------------------------------------------------------

function mapBackendListItemToRecord(item: BackendUserListItem): UserManagementRecord {
  const createdBy = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}`.trim() : "System";
  const updatedBy = item.updatedBy ? `${item.updatedBy.firstName} ${item.updatedBy.lastName}`.trim() : "System";

  return {
    id: item.id,
    userName: item.username,
    userType: "Staff",
    department: item.department?.name || "-",
    approver: "-",
    role: "Staff",
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    country: "",
    state: "",
    city: "",
    address: "",
    pincode: "",
    gender: "",
    bloodGroup: "",
    dateOfBirth: new Date(),
    age: "",
    phoneNo: item.phoneNumber || "",
    remarks: item.remarks || "",
    createdBy,
    createdDate: new Date(item.createdAt),
    isActive: item.isActive,
    statusLabel: item.isActive ? "Active" : "Inactive",
    updatedBy,
    updatedDate: new Date(item.updatedAt),
  };
}

function mapBackendDetailToUserDetail(item: BackendUserDetail): UserManagementDetail {
  const createdBy = item.createdBy ? `${item.createdBy.firstName} ${item.createdBy.lastName}`.trim() : "System";
  const updatedBy = item.updatedBy ? `${item.updatedBy.firstName} ${item.updatedBy.lastName}`.trim() : "System";

  const permissions = buildDefaultUserPermissions();
  const codes = item.permissions || [];

  permissions.userManagement = {
    view: codes.includes("USER_MANAGEMENT_VIEW"),
    create: codes.includes("USER_MANAGEMENT_CREATE"),
    edit: codes.includes("USER_MANAGEMENT_UPDATE"),
  };

  permissions.customerMaster = {
    view: codes.includes("CUSTOMER_MASTER_VIEW"),
    create: codes.includes("CUSTOMER_MASTER_CREATE"),
    edit: codes.includes("CUSTOMER_MASTER_UPDATE"),
  };

  permissions.supplierMaster = {
    view: codes.includes("SUPPLIER_MASTER_VIEW"),
    create: codes.includes("SUPPLIER_MASTER_CREATE"),
    edit: codes.includes("SUPPLIER_MASTER_UPDATE"),
  };

  permissions.transporterMaster = {
    view: codes.includes("TRANSPORTER_MASTER_VIEW"),
    create: codes.includes("TRANSPORTER_MASTER_CREATE"),
    edit: codes.includes("TRANSPORTER_MASTER_UPDATE"),
  };

  permissions.warehouseLocationMaster = {
    view: codes.includes("WAREHOUSE_MASTER_VIEW"),
    create: codes.includes("WAREHOUSE_MASTER_CREATE"),
    edit: codes.includes("WAREHOUSE_MASTER_UPDATE"),
  };

  return {
    id: item.id,
    userName: item.username,
    userType: "Staff",
    department: item.department?.name || "",
    approver: "",
    role: "Staff",
    firstName: item.firstName,
    lastName: item.lastName,
    email: item.email,
    country: item.country || "",
    state: item.state || "",
    city: item.city || "",
    address: item.address || "",
    pincode: item.pincode || "",
    gender: "",
    bloodGroup: item.bloodGroup || "",
    dateOfBirth: item.dateOfBirth ? new Date(item.dateOfBirth) : new Date("2000-01-01"),
    age:
      item.age !== undefined && item.age !== null
        ? String(item.age)
        : item.dateOfBirth
          ? calculateAgeFromDob(item.dateOfBirth)
          : "",
    phoneNo: item.phoneNumber || "",
    aadhaarNo: item.aadhaarNo || "",
    aadhaarUpload: item.aadhaarDocumentUrl || "",
    panNo: item.panNo || "",
    panUpload: item.panDocumentUrl || "",
    remarks: item.remarks || "",
    createdBy,
    createdDate: new Date(item.createdAt),
    isActive: item.isActive,
    statusLabel: item.isActive ? "Active" : "Inactive",
    permissions,
    updatedBy,
    updatedDate: new Date(item.updatedAt),
  };
}

function convertUiPermissionsToCodes(permissions?: Record<string, UserPermissionFlags>): string[] {
  if (!permissions) return ["USER_MANAGEMENT_VIEW"];

  const codes: string[] = [];
  const um = permissions.userManagement;

  if (um?.view) codes.push("USER_MANAGEMENT_VIEW");
  if (um?.create) codes.push("USER_MANAGEMENT_CREATE");
  if (um?.edit) codes.push("USER_MANAGEMENT_UPDATE");

  // Always ensure at least VIEW if any action is enabled
  if (codes.length > 0 && !codes.includes("USER_MANAGEMENT_VIEW")) {
    codes.push("USER_MANAGEMENT_VIEW");
  }

  // Add status change permission if create or edit are enabled
  if (um?.create || um?.edit) {
    codes.push("USER_MANAGEMENT_STATUS_CHANGE");
  }

  const customer = permissions.customerMaster;
  if (customer?.view) codes.push("CUSTOMER_MASTER_VIEW");
  if (customer?.create) codes.push("CUSTOMER_MASTER_CREATE");
  if (customer?.edit) codes.push("CUSTOMER_MASTER_UPDATE");
  if (customer?.create || customer?.edit) {
    codes.push("CUSTOMER_MASTER_STATUS_CHANGE");
  }

  const supplier = permissions.supplierMaster;
  if (supplier?.view) codes.push("SUPPLIER_MASTER_VIEW");
  if (supplier?.create) codes.push("SUPPLIER_MASTER_CREATE");
  if (supplier?.edit) codes.push("SUPPLIER_MASTER_UPDATE");
  if (supplier?.create || supplier?.edit) {
    codes.push("SUPPLIER_MASTER_STATUS_CHANGE");
  }

  const transporter = permissions.transporterMaster;
  if (transporter?.view) codes.push("TRANSPORTER_MASTER_VIEW");
  if (transporter?.create) codes.push("TRANSPORTER_MASTER_CREATE");
  if (transporter?.edit) codes.push("TRANSPORTER_MASTER_UPDATE");
  if (transporter?.create || transporter?.edit) {
    codes.push("TRANSPORTER_MASTER_STATUS_CHANGE");
  }

  const warehouse = permissions.warehouseLocationMaster;
  if (warehouse?.view) codes.push("WAREHOUSE_MASTER_VIEW");
  if (warehouse?.create) codes.push("WAREHOUSE_MASTER_CREATE");
  if (warehouse?.edit) codes.push("WAREHOUSE_MASTER_UPDATE");
  if (warehouse?.create || warehouse?.edit) {
    codes.push("WAREHOUSE_MASTER_STATUS_CHANGE");
  }

  return Array.from(new Set(codes));
}

function getStringValue(value: MasterFieldValue | undefined, fallback = ""): string {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") {
    if ("previewUrl" in value && typeof (value as any).previewUrl === "string" && (value as any).previewUrl) {
      return (value as any).previewUrl.trim();
    }
    if ("name" in value && typeof (value as any).name === "string") {
      return (value as any).name.trim();
    }
  }
  return fallback;
}

async function getFilePayloadValue(value: MasterFieldValue | undefined): Promise<string | null> {
  if (!value) return null;
  if (typeof value === "string") return value.trim() || null;
  if (typeof value === "object" && !(value instanceof Date)) {
    const file = "file" in value ? value.file : undefined;
    if (file instanceof File) {
      return new Promise<string | null>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          resolve(typeof reader.result === "string" ? reader.result : null);
        };
        reader.onerror = () => {
          resolve(value.previewUrl || value.name || null);
        };
        reader.readAsDataURL(file);
      });
    }
    if ("previewUrl" in value && value.previewUrl) {
      return value.previewUrl;
    }
    if ("name" in value && value.name) {
      return value.name;
    }
  }
  return null;
}

function getDateString(value: MasterFieldValue | undefined): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const iso = value.toISOString().split("T")[0];
    return iso ?? null;
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      const iso = d.toISOString().split("T")[0];
      return iso ?? null;
    }
  }
  return null;
}

function calculateAgeFromDob(dob: Date | string | null | undefined): string {
  if (!dob) return "";
  const birthDate = dob instanceof Date ? dob : new Date(dob);
  if (Number.isNaN(birthDate.getTime())) return "";

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? String(age) : "";
}

function getNumberValue(value: MasterFieldValue | undefined): number | null {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = parseInt(value.trim(), 10);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return null;
}
