import type { MasterFieldValue } from "../../masters/shared";
import { departmentMasterDefinition } from "../../masters/department-master/mock/departmentMasterData";
import {
  buildDefaultRolePermissions,
  rolePermissionRows,
  type RolePermissionDetail,
  type RolePermissionRecord,
} from "./rolesPermissionsConfig";

const ROLE_PERMISSIONS_STORAGE_KEY = "deluxe-veneers-role-permissions-records-v2";
const SYSTEM_USER_NAME = "Deluxe Veneers";

type StoredRolePermissionDetail = Omit<
  RolePermissionDetail,
  "createdDate" | "updatedDate"
> & {
  createdDate: string;
  updatedDate: string;
};

export async function fetchRolePermissionRows(search = "") {
  const rows = getRolePermissionStore().map(toRecord);
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) =>
    Object.values(row).some((value) =>
      String(value ?? "").toLowerCase().includes(normalizedSearch),
    ),
  );
}

export async function fetchRolePermissionDetail(id: string) {
  const detail = getRolePermissionStore().find((row) => row.id === id);

  if (!detail) {
    throw new Error("Role permission record not found.");
  }

  return detail;
}

export async function createRolePermissionRecord(
  values: Record<string, MasterFieldValue>,
) {
  const records = getRolePermissionStore();
  const now = new Date();
  const isActive = true;
  const detail: RolePermissionDetail = {
    createdBy: SYSTEM_USER_NAME,
    createdDate: now,
    department: getStringValue(values.department),
    id: createRolePermissionId(records),
    isActive,
    permissions: buildDefaultRolePermissions(),
    remark: getStringValue(values.remark),
    roleName: getStringValue(values.roleName),
    statusLabel: "Active",
    updatedDate: now,
  };

  if (!detail.roleName) {
    throw new Error("Role name is required.");
  }

  if (!detail.department) {
    throw new Error("Department is required.");
  }

  records.unshift(detail);
  saveRolePermissionStore(records);

  return detail;
}

export async function fetchRolePermissionDepartmentOptions() {
  return Array.from(
    new Set(
      departmentMasterDefinition.rows
        .filter((row) => row.status !== "Inactive")
        .map((row) =>
          typeof row.departmentName === "string" ? row.departmentName.trim() : "",
        )
        .filter(Boolean),
    ),
  );
}

export async function updateRolePermissionMatrix(
  id: string,
  permissions: RolePermissionDetail["permissions"],
) {
  const records = getRolePermissionStore();
  const recordIndex = records.findIndex((row) => row.id === id);

  if (recordIndex < 0) {
    throw new Error("Role permission record not found.");
  }

  const currentRecord = records[recordIndex];

  if (!currentRecord) {
    throw new Error("Role permission record not found.");
  }

  const updatedRecord: RolePermissionDetail = {
    ...currentRecord,
    permissions,
    updatedDate: new Date(),
  };

  records[recordIndex] = updatedRecord;
  saveRolePermissionStore(records);

  return updatedRecord;
}

function getRolePermissionStore() {
  if (typeof window === "undefined") {
    return getSeedDetails();
  }

  const storedRecords = window.localStorage.getItem(ROLE_PERMISSIONS_STORAGE_KEY);

  if (!storedRecords) {
    const seedRecords = getSeedDetails();
    saveRolePermissionStore(seedRecords);
    return seedRecords;
  }

  try {
    const parsedRecords = JSON.parse(
      storedRecords,
    ) as StoredRolePermissionDetail[];
    return parsedRecords.map(deserializeRolePermissionDetail);
  } catch {
    const seedRecords = getSeedDetails();
    saveRolePermissionStore(seedRecords);
    return seedRecords;
  }
}

function saveRolePermissionStore(records: RolePermissionDetail[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    ROLE_PERMISSIONS_STORAGE_KEY,
    JSON.stringify(records.map(serializeRolePermissionDetail)),
  );
}

function getSeedDetails() {
  return rolePermissionRows.map((row) => ({
    ...row,
    permissions: buildDefaultRolePermissions(),
  }));
}

function toRecord(detail: RolePermissionDetail): RolePermissionRecord {
  const { permissions: _permissions, ...record } = detail;
  return record;
}

function createRolePermissionId(records: RolePermissionDetail[]) {
  const nextNumericId =
    records.reduce((maxId, record) => {
      const numericId = Number(record.id.replace(/\D/g, ""));
      return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
    }, 0) + 1;

  return `role-${nextNumericId}`;
}

function serializeRolePermissionDetail(
  detail: RolePermissionDetail,
): StoredRolePermissionDetail {
  return {
    ...detail,
    createdDate: detail.createdDate.toISOString(),
    updatedDate: detail.updatedDate.toISOString(),
  };
}

function deserializeRolePermissionDetail(
  detail: StoredRolePermissionDetail,
): RolePermissionDetail {
  const isActive = detail.isActive ?? detail.statusLabel !== "Inactive";

  return {
    ...detail,
    createdDate: parseDate(detail.createdDate),
    isActive,
    permissions: detail.permissions ?? buildDefaultRolePermissions(),
    statusLabel: isActive ? "Active" : "Inactive",
    updatedDate: parseDate(detail.updatedDate),
  };
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getStringValue(value: MasterFieldValue | undefined) {
  return typeof value === "string" ? value.trim() : "";
}
