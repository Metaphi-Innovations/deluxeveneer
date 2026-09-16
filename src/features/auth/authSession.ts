import {
  buildDefaultUserPermissions,
  type UserPermissionFlags,
  type UserManagementDetail,
} from "../user-management/shared/userManagementConfig";
import {
  fetchUserManagementDetailByEmail,
  isUserManagementPasswordValid,
} from "../user-management/shared/userManagementApi";

const AUTH_STORAGE_KEY = "deluxe-veneers-erp-authenticated";
const AUTH_TOKEN_STORAGE_KEY = "deluxe-veneers-erp-token";
const AUTH_USER_STORAGE_KEY = "deluxe-veneers-erp-user";
const AUTH_PASSWORD_STORAGE_KEY = "deluxe-veneers-erp-password";
export const AUTH_USER_UPDATED_EVENT = "deluxe-veneers-auth-user-updated";
const DEMO_AUTH_TOKEN = "deluxe-veneers-local-demo-token";

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
  email: "admin@deluxeveneers.com",
  password: "admin",
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
  firstName: "Atharva",
  gender: "Male",
  id: "",
  lastName: "Patil",
  phoneNo: "+91 98765 43210",
  pincode: "380015",
  permissions: buildDefaultUserPermissions(),
  remarks: "System administrator profile for the Deluxe Veneers ERP.",
  role: "System Administrator",
  state: "Gujarat",
  userName: "Deluxe Veneers",
  userType: "Admin",
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

export async function signIn(email: string, password: string) {
  if (typeof window === "undefined") {
    return false;
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail === demoCredentials.email) {
    if (
      password !== demoCredentials.password &&
      password !== getCurrentPassword()
    ) {
      return false;
    }

    persistAuthenticatedSession(DEMO_AUTH_TOKEN, demoUserProfile);
    return true;
  }

  const userRecord = await fetchUserManagementDetailByEmail(normalizedEmail);

  if (!userRecord || !userRecord.isActive) {
    return false;
  }

  if (!isUserManagementPasswordValid(userRecord.id, password)) {
    return false;
  }

  persistAuthenticatedSession(
    DEMO_AUTH_TOKEN,
    mapUserManagementDetailToProfile(userRecord),
  );
  return true;
}

export function signOut() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_USER_STORAGE_KEY);
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
    const parsedValue = JSON.parse(
      storedValue,
    ) as Partial<SerializedAuthenticatedUserProfile>;

    return {
      ...demoUserProfile,
      ...parsedValue,
      dateOfBirth:
        parsedValue.dateOfBirth != null ? new Date(parsedValue.dateOfBirth) : null,
    };
  } catch {
    return demoUserProfile;
  }
}

export function saveCurrentUser(profile: AuthenticatedUserProfile) {
  persistCurrentUser(profile);
}

export function getDefaultAuthenticatedRoute(
  user: AuthenticatedUserProfile = getCurrentUser(),
) {
  if (
    user.accountRole === "Super Admin" ||
    getAccountRole(user.role, user.userType) === "Super Admin"
  ) {
    return "/dashboard";
  }

  const route = defaultPermissionRoutes.find(({ permissionKey }) =>
    hasAnyPermission(user, permissionKey),
  );

  return route?.path ?? "/profile";
}

export async function refreshCurrentUserPermissions() {
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

  persistCurrentUser(mapUserManagementDetailToProfile(detail));
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

function getCurrentPassword() {
  if (typeof window === "undefined") {
    return demoCredentials.password;
  }

  return (
    window.localStorage.getItem(AUTH_PASSWORD_STORAGE_KEY) ??
    demoCredentials.password
  );
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
