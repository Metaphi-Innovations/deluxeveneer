import {
  buildDefaultUserPermissions,
  type UserPermissionFlags,
  type UserManagementDetail,
} from "../user-management/shared/userManagementConfig";
import { apiRequest, type ApiResponse } from "../../lib/apiClient";

const AUTH_STORAGE_KEY = "deluxe-veneers-erp-authenticated";
const AUTH_TOKEN_STORAGE_KEY = "deluxe-veneers-erp-token";
const AUTH_USER_STORAGE_KEY = "deluxe-veneers-erp-user";
const AUTH_PASSWORD_STORAGE_KEY = "deluxe-veneers-erp-password";
export const AUTH_USER_UPDATED_EVENT = "deluxe-veneers-auth-user-updated";

export interface AuthenticatedUserProfile {
  accountRole: "Admin" | "Super Admin" | "Staff";
  address: string;
  age: string;
  approver: string;
  bloodGroup: string;
  city: string;
  country: string;
  dateOfBirth: Date | null;
  department: string;
  email: string;
  firstName: string;
  gender: string;
  id: string;
  lastName: string;
  phoneNo: string;
  pincode: string;
  aadhaarNo?: string;
  aadhaarUpload?: string;
  panNo?: string;
  panUpload?: string;
  permissions: Record<string, UserPermissionFlags>;
  remarks: string;
  role: string;
  state: string;
  userName: string;
  userType: string;
}

type SerializedAuthenticatedUserProfile = Omit<
  AuthenticatedUserProfile,
  "dateOfBirth"
> & {
  dateOfBirth: string | null;
};

export const demoCredentials = {
  email: "superadmin@deluxe-veneers.com",
  password: "SuperAdmin@12345",
} as const;

export const demoUserProfile: AuthenticatedUserProfile = {
  accountRole: "Super Admin",
  address: "Corporate Office, SG Highway",
  age: "31",
  approver: "Tanya Khanna",
  bloodGroup: "O+",
  city: "Ahmedabad",
  country: "India",
  dateOfBirth: new Date("1995-04-18"),
  department: "Management / Admin",
  email: demoCredentials.email,
  firstName: "Super",
  gender: "Male",
  id: "",
  lastName: "Admin",
  phoneNo: "+91 98765 43210",
  pincode: "380015",
  permissions: buildDefaultUserPermissions(),
  remarks: "System administrator profile for the Deluxe Veneers ERP.",
  role: "System Administrator",
  state: "Gujarat",
  userName: "Super Admin",
  userType: "Super Admin",
};

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true" &&
    Boolean(window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY))
  );
}

/**
 * Sign in against backend POST /api/auth/login
 * @throws Error with backend message (e.g. inactive account)
 */
export async function signIn(email: string, password: string): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  const res = await apiRequest<ApiResponse<{ accessToken: string; user: any }>>(
    "/auth/login",
    {
      method: "POST",
      body: { email: email.trim().toLowerCase(), password },
    },
  );

  if (res?.success && res?.data?.accessToken) {
    const backendUser = res.data.user;
    const profile = mapBackendUserToProfile(backendUser);
    persistAuthenticatedSession(res.data.accessToken, profile);
    return true;
  }

  return false;
}

/**
 * Log out against backend POST /api/auth/logout
 */
export async function signOut() {
  if (typeof window === "undefined") {
    return;
  }

  // Clear session storage immediately so any synchronous route guards/checks evaluate as unauthenticated
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(AUTH_USER_UPDATED_EVENT));

  try {
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => {});
  } catch {
    // Ignore error
  }
}

/**
 * Request password reset email via POST /api/auth/forgot-password
 */
export async function requestPasswordReset(email: string): Promise<string> {
  const res = await apiRequest<ApiResponse>(
    "/auth/forgot-password",
    {
      method: "POST",
      body: { email: email.trim().toLowerCase() },
    }
  );
  return res.message || "Password reset link sent if account exists.";
}

/**
 * Reset password via POST /api/auth/reset-password
 */
export async function confirmPasswordReset(
  token: string,
  password: string,
  confirmPassword?: string,
): Promise<string> {
  const res = await apiRequest<ApiResponse>(
    "/auth/reset-password",
    {
      method: "POST",
      body: {
        token: token.trim(),
        password,
        confirmPassword: confirmPassword || password,
      },
    }
  );
  return res.message || "Password updated successfully.";
}

export function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function resetDemoPassword(password: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_PASSWORD_STORAGE_KEY, password);
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return demoUserProfile;
  }

  const storedValue = window.sessionStorage.getItem(AUTH_USER_STORAGE_KEY);

  if (!storedValue) {
    return demoUserProfile;
  }

  try {
    const parsed = JSON.parse(storedValue) as SerializedAuthenticatedUserProfile;

    return {
      ...parsed,
      dateOfBirth: parsed.dateOfBirth ? new Date(parsed.dateOfBirth) : null,
    };
  } catch {
    return demoUserProfile;
  }
}

export function getDefaultAuthenticatedRoute() {
  const user = getCurrentUser();

  if (
    user.accountRole === "Super Admin" ||
    user.role.toLowerCase().includes("super admin") ||
    hasAnyPermission(user, "dashboard")
  ) {
    return "/dashboard";
  }

  const route = defaultPermissionRoutes.find(({ permissionKey }) =>
    hasAnyPermission(user, permissionKey),
  );

  return route?.path ?? "/profile";
}

export async function refreshCurrentUserPermissions() {
  try {
    const res = await apiRequest<ApiResponse<{ user: any }>>("/auth/me");
    if (res?.success && res?.data?.user) {
      const profile = mapBackendUserToProfile(res.data.user);
      persistCurrentUser(profile);
      return profile;
    }
  } catch (error) {
    console.error("[Auth] Failed to refresh permissions:", error);
  }
  return getCurrentUser();
}

export function syncCurrentUserFromUserManagementDetail(
  detail: UserManagementDetail,
) {
  if (typeof window === "undefined") {
    return;
  }

  const currentUser = getCurrentUser();
  const isCurrentUser =
    Boolean(currentUser.id && currentUser.id === detail.id) ||
    Boolean(
      currentUser.email &&
        detail.email &&
        currentUser.email.trim().toLowerCase() ===
          detail.email.trim().toLowerCase(),
    );

  if (!isCurrentUser) {
    return;
  }

  // Always reload from /auth/me. User-management detail mapping drops
  // isSuperAdmin and can wipe session permissions until a hard refresh.
  void refreshCurrentUserPermissions();
}

export function getUserDisplayName(profile: AuthenticatedUserProfile) {
  return profile.userName.trim().length > 0
    ? profile.userName
    : `${profile.firstName} ${profile.lastName}`.trim() || "Deluxe Veneers User";
}

export function getUserInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  return parts.map((part) => part.charAt(0).toUpperCase()).join("") || "DV";
}

export function saveCurrentUser(profile: AuthenticatedUserProfile) {
  persistCurrentUser(profile);
}

function persistCurrentUser(profile: AuthenticatedUserProfile) {
  if (typeof window === "undefined") {
    return;
  }

  const serializedProfile: SerializedAuthenticatedUserProfile = {
    ...profile,
    dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.toISOString() : null,
  };

  window.sessionStorage.setItem(
    AUTH_USER_STORAGE_KEY,
    JSON.stringify(serializedProfile),
  );
  window.dispatchEvent(new CustomEvent(AUTH_USER_UPDATED_EVENT));
}

function persistAuthenticatedSession(token: string, user: AuthenticatedUserProfile) {
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
  window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  persistCurrentUser(user);
}

function mapBackendUserToProfile(user: any): AuthenticatedUserProfile {
  const isSuperAdmin = Boolean(user.isSuperAdmin);
  const permissions = buildDefaultUserPermissions();

  const userPerms: string[] = user.permissions || [];
  if (isSuperAdmin) {
    Object.keys(permissions).forEach((k) => {
      permissions[k] = { view: true, edit: true, create: true };
    });
  } else {
    // Enable userManagement actions
    permissions.userManagement = {
      view: userPerms.includes("USER_MANAGEMENT_VIEW"),
      create: userPerms.includes("USER_MANAGEMENT_CREATE"),
      edit: userPerms.includes("USER_MANAGEMENT_UPDATE"),
    };

    permissions.customerMaster = {
      view: userPerms.includes("CUSTOMER_MASTER_VIEW"),
      create: userPerms.includes("CUSTOMER_MASTER_CREATE"),
      edit: userPerms.includes("CUSTOMER_MASTER_UPDATE"),
    };

    permissions.supplierMaster = {
      view: userPerms.includes("SUPPLIER_MASTER_VIEW"),
      create: userPerms.includes("SUPPLIER_MASTER_CREATE"),
      edit: userPerms.includes("SUPPLIER_MASTER_UPDATE"),
    };

    permissions.transporterMaster = {
      view: userPerms.includes("TRANSPORTER_MASTER_VIEW"),
      create: userPerms.includes("TRANSPORTER_MASTER_CREATE"),
      edit: userPerms.includes("TRANSPORTER_MASTER_UPDATE"),
    };

    permissions.colorMaster = {
      view: userPerms.includes("COLOR_MASTER_VIEW"),
      create: userPerms.includes("COLOR_MASTER_CREATE"),
      edit: userPerms.includes("COLOR_MASTER_UPDATE"),
    };

    permissions.currencyMaster = {
      view: userPerms.includes("CURRENCY_MASTER_VIEW"),
      create: userPerms.includes("CURRENCY_MASTER_CREATE"),
      edit: userPerms.includes("CURRENCY_MASTER_UPDATE"),
    };

    permissions.cutMaster = {
      view: userPerms.includes("CUT_MASTER_VIEW"),
      create: userPerms.includes("CUT_MASTER_CREATE"),
      edit: userPerms.includes("CUT_MASTER_UPDATE"),
    };

    permissions.departmentMaster = {
      view: userPerms.includes("DEPARTMENT_MASTER_VIEW"),
      create: userPerms.includes("DEPARTMENT_MASTER_CREATE"),
      edit: userPerms.includes("DEPARTMENT_MASTER_UPDATE"),
    };

    permissions.gradeMaster = {
      view: userPerms.includes("GRADE_MASTER_VIEW"),
      create: userPerms.includes("GRADE_MASTER_CREATE"),
      edit: userPerms.includes("GRADE_MASTER_UPDATE"),
    };

    permissions.gstMaster = {
      view: userPerms.includes("GST_MASTER_VIEW"),
      create: userPerms.includes("GST_MASTER_CREATE"),
      edit: userPerms.includes("GST_MASTER_UPDATE"),
    };

    permissions.hsnMaster = {
      view: userPerms.includes("HSN_MASTER_VIEW"),
      create: userPerms.includes("HSN_MASTER_CREATE"),
      edit: userPerms.includes("HSN_MASTER_UPDATE"),
    };

    permissions.itemCategoryMaster = {
      view: userPerms.includes("ITEM_CATEGORY_MASTER_VIEW"),
      create: userPerms.includes("ITEM_CATEGORY_MASTER_CREATE"),
      edit: userPerms.includes("ITEM_CATEGORY_MASTER_UPDATE"),
    };

    permissions.itemMaster = {
      view: userPerms.includes("ITEM_MASTER_VIEW"),
      create: userPerms.includes("ITEM_MASTER_CREATE"),
      edit: userPerms.includes("ITEM_MASTER_UPDATE"),
    };

    permissions.itemSubCategoryMaster = {
      view: userPerms.includes("ITEM_SUB_CATEGORY_MASTER_VIEW"),
      create: userPerms.includes("ITEM_SUB_CATEGORY_MASTER_CREATE"),
      edit: userPerms.includes("ITEM_SUB_CATEGORY_MASTER_UPDATE"),
    };

    permissions.unitMaster = {
      view: userPerms.includes("UNIT_MASTER_VIEW"),
      create: userPerms.includes("UNIT_MASTER_CREATE"),
      edit: userPerms.includes("UNIT_MASTER_UPDATE"),
    };

    permissions.warehouseLocationMaster = {
      view: userPerms.includes("WAREHOUSE_MASTER_VIEW"),
      create: userPerms.includes("WAREHOUSE_MASTER_CREATE"),
      edit: userPerms.includes("WAREHOUSE_MASTER_UPDATE"),
    };

    permissions.warehouseA = {
      view:
        userPerms.includes("WAREHOUSE_INWARD_VIEW") ||
        userPerms.includes("WAREHOUSE_MASTER_VIEW"),
      create:
        userPerms.includes("WAREHOUSE_INWARD_CREATE") ||
        userPerms.includes("WAREHOUSE_MASTER_CREATE"),
      edit:
        userPerms.includes("WAREHOUSE_INWARD_UPDATE") ||
        userPerms.includes("WAREHOUSE_MASTER_UPDATE"),
    };
  }

  return {
    accountRole: isSuperAdmin ? "Super Admin" : "Staff",
    address: user.address || "",
    age: user.age || "",
    approver: "",
    bloodGroup: user.bloodGroup || "",
    city: user.city || "",
    country: user.country || "",
    dateOfBirth: user.dateOfBirth ? new Date(user.dateOfBirth) : null,
    department: user.department?.name || "",
    email: user.email || "",
    firstName: user.firstName || "",
    gender: "",
    id: user.id || "",
    lastName: user.lastName || "",
    phoneNo: user.phoneNumber || "",
    pincode: user.pincode || "",
    aadhaarNo: user.aadhaarNo || "",
    aadhaarUpload: user.aadhaarDocumentUrl || "",
    panNo: user.panNo || "",
    panUpload: user.panDocumentUrl || "",
    permissions,
    remarks: user.remarks || "",
    role: isSuperAdmin ? "Super Admin" : "Staff",
    state: user.state || "",
    userName: user.username || `${user.firstName || ""} ${user.lastName || ""}`.trim(),
    userType: isSuperAdmin ? "Super Admin" : "Staff",
  };
}

function mapUserManagementDetailToProfile(
  detail: UserManagementDetail,
): AuthenticatedUserProfile {
  return {
    accountRole: getAccountRole(detail.role, detail.userType),
    address: detail.address,
    age: detail.age,
    approver: detail.approver,
    bloodGroup: detail.bloodGroup,
    city: detail.city,
    country: detail.country,
    dateOfBirth: detail.dateOfBirth,
    department: detail.department,
    email: detail.email,
    firstName: detail.firstName,
    gender: detail.gender,
    id: detail.id,
    lastName: detail.lastName,
    phoneNo: detail.phoneNo,
    pincode: detail.pincode,
    permissions: detail.isActive
      ? detail.permissions
      : buildDefaultUserPermissions(),
    remarks: detail.remarks,
    role: detail.role,
    state: detail.state,
    userName: detail.userName,
    userType: detail.userType,
  };
}

function getAccountRole(
  role: string,
  userType: string,
): AuthenticatedUserProfile["accountRole"] {
  const normalizedValue = `${role} ${userType}`.toLowerCase();

  if (normalizedValue.includes("super admin")) {
    return "Super Admin";
  }

  if (normalizedValue.includes("admin")) {
    return "Admin";
  }

  return "Staff";
}

function hasAnyPermission(
  user: AuthenticatedUserProfile,
  permissionKey: string,
) {
  const permission = user.permissions?.[permissionKey];

  return Boolean(permission?.view || permission?.edit || permission?.create);
}

const defaultPermissionRoutes = [
  { permissionKey: "dashboard", path: "/dashboard" },
  { permissionKey: "userManagement", path: "/user-management" },
  { permissionKey: "warehouseA", path: "/warehouse-a" },
  { permissionKey: "warehouseB", path: "/warehouse-b" },
  { permissionKey: "warehouseC", path: "/warehouse-c" },
  { permissionKey: "colorMaster", path: "/masters/color-master" },
  { permissionKey: "currencyMaster", path: "/masters/currency-master" },
  { permissionKey: "customerMaster", path: "/masters/customer-master" },
  { permissionKey: "cutMaster", path: "/masters/cut-master" },
  { permissionKey: "departmentMaster", path: "/masters/department-master" },
  { permissionKey: "gradeMaster", path: "/masters/grade-master" },
  { permissionKey: "gstMaster", path: "/masters/gst-master" },
  { permissionKey: "hsnMaster", path: "/masters/hsn-master" },
  { permissionKey: "itemCategoryMaster", path: "/masters/item-category-master" },
  { permissionKey: "itemMaster", path: "/masters/item-name-master" },
  {
    permissionKey: "itemSubCategoryMaster",
    path: "/masters/item-sub-category-master",
  },
  { permissionKey: "supplierMaster", path: "/masters/supplier-master" },
  { permissionKey: "transporterMaster", path: "/masters/transporter-master" },
  { permissionKey: "unitMaster", path: "/masters/unit-master" },
  {
    permissionKey: "warehouseLocationMaster",
    path: "/masters/warehouse-location-master",
  },
  { permissionKey: "sawing", path: "/factory/sawing" },
  { permissionKey: "slicing", path: "/factory/slicing" },
  { permissionKey: "drying", path: "/factory/drying" },
  { permissionKey: "inspection", path: "/factory/inspection" },
  { permissionKey: "grouping", path: "/factory/grouping" },
  { permissionKey: "marquetry", path: "/factory/marquetry" },
  { permissionKey: "splicing", path: "/factory/splicing" },
  { permissionKey: "pressing", path: "/factory/pressing" },
  { permissionKey: "cncFluting", path: "/factory/cnc-fluting" },
  { permissionKey: "embossing", path: "/factory/embossing" },
  { permissionKey: "finishing", path: "/factory/finishing" },
  { permissionKey: "placeOrder", path: "/orders" },
  { permissionKey: "packing", path: "/packing" },
  { permissionKey: "dispatch", path: "/dispatch" },
  { permissionKey: "componentLibrary", path: "/tools/component-library" },
] as const;
