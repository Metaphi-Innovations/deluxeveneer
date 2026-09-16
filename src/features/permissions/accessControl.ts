import {
  getCurrentUser,
  type AuthenticatedUserProfile,
} from "../auth/authSession";
import type { UserPermissionAction } from "../user-management/shared/userManagementConfig";

export const masterPermissionKeyBySlug: Record<string, string> = {
  "color-master": "colorMaster",
  "currency-master": "currencyMaster",
  "cut-master": "cutMaster",
  "customer-master": "customerMaster",
  "department-master": "departmentMaster",
  "grade-master": "gradeMaster",
  "gst-master": "gstMaster",
  "hsn-master": "hsnMaster",
  "item-category-master": "itemCategoryMaster",
  "item-name-master": "itemMaster",
  "item-sub-category-master": "itemSubCategoryMaster",
  "supplier-master": "supplierMaster",
  "transporter-master": "transporterMaster",
  "unit-master": "unitMaster",
  "warehouse-location-master": "warehouseLocationMaster",
};

export const factoryPermissionKeyBySlug: Record<string, string> = {
  "cnc-fluting": "cncFluting",
  drying: "drying",
  embossing: "embossing",
  finishing: "finishing",
  grouping: "grouping",
  inspection: "inspection",
  marquetry: "marquetry",
  pressing: "pressing",
  sawing: "sawing",
  slicing: "slicing",
  splicing: "splicing",
};

export const warehousePermissionKeyById: Record<string, string> = {
  "warehouse-a": "warehouseA",
  "warehouse-b": "warehouseB",
  "warehouse-c": "warehouseC",
};

export function canAccessPermission(
  permissionKey: string | undefined,
  action: UserPermissionAction,
  user: AuthenticatedUserProfile = getCurrentUser(),
) {
  if (!permissionKey) {
    return false;
  }

  if (isSuperAdminUser(user)) {
    return true;
  }

  const permission = user.permissions?.[permissionKey];

  if (!permission) {
    return false;
  }

  if (action === "view") {
    return Boolean(permission.view || permission.edit || permission.create);
  }

  return Boolean(permission[action]);
}

export function canAccessAnyAction(
  permissionKey: string | undefined,
  user: AuthenticatedUserProfile = getCurrentUser(),
) {
  return (
    canAccessPermission(permissionKey, "view", user) ||
    canAccessPermission(permissionKey, "edit", user) ||
    canAccessPermission(permissionKey, "create", user)
  );
}

export function getMasterPermissionKey(slug: string) {
  return masterPermissionKeyBySlug[slug];
}

export function getFactoryPermissionKey(slug: string) {
  return factoryPermissionKeyBySlug[slug];
}

export function getWarehousePermissionKey(warehouseId: string) {
  return warehousePermissionKeyById[warehouseId];
}

export function isSuperAdminUser(user: AuthenticatedUserProfile) {
  return (
    user.accountRole === "Super Admin" ||
    user.role.trim().toLowerCase() === "super admin"
  );
}
