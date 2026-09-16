import type { MasterFieldValue } from "../../masters/shared";
import {
  buildDefaultUserPermissions,
  type UserPermissionFlags,
  userManagementDetails,
  type UserManagementDetail,
  type UserManagementRecord,
} from "./userManagementConfig";

const USER_MANAGEMENT_STORAGE_KEY = "deluxe-veneers-user-management-records-v2";
const USER_PASSWORD_STORAGE_KEY = "deluxe-veneers-user-management-passwords-v2";
const SYSTEM_USER_NAME = "Deluxe Veneers";
const DEFAULT_USER_PASSWORD = "admin";

type StoredUserManagementDetail = Omit<
  UserManagementDetail,
  "createdDate" | "dateOfBirth" | "updatedDate"
> & {
  createdDate: string;
  dateOfBirth: string;
  updatedDate: string;
};

export async function fetchUserManagementRows(search = "") {
  const rows = getUserStore().map(toRecord);
  const normalizedSearch = search.trim().toLowerCase();

  if (!normalizedSearch) {
    return rows;
  }

  return rows.filter((row) =>
    getSearchValues(row).some((value) =>
      value.toLowerCase().includes(normalizedSearch),
    ),
  );
}

export async function fetchUserManagementDetail(id: string) {
  const detail = getUserStore().find((row) => row.id === id);

  if (!detail) {
    throw new Error("User record not found.");
  }

  return detail;
}

export async function fetchUserManagementDetailByEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  return getUserStore().find(
    (row) => row.email.trim().toLowerCase() === normalizedEmail,
  );
}

export function isUserManagementPasswordValid(id: string, password: string) {
  const passwordStore = getPasswordStore();
  const currentPassword = passwordStore[id] ?? DEFAULT_USER_PASSWORD;

  return password === currentPassword;
}

export async function createUserManagementRecord(
  values: Record<string, MasterFieldValue>,
  permissions?: Record<string, UserPermissionFlags>,
) {
  const records = getUserStore();
  const detail = buildUserDetailFromValues(
    values,
    undefined,
    createUserId(records),
    permissions,
  );

  records.unshift(detail);
  saveUserStore(records);

  return detail;
}

export async function updateUserManagementRecord(
  id: string,
  values: Record<string, MasterFieldValue>,
  permissions?: Record<string, UserPermissionFlags>,
) {
  const records = getUserStore();
  const recordIndex = records.findIndex((row) => row.id === id);

  if (recordIndex < 0) {
    throw new Error("User record not found.");
  }

  const updatedRecord = buildUserDetailFromValues(
    values,
    records[recordIndex],
    id,
    permissions,
  );
  records[recordIndex] = updatedRecord;
  saveUserStore(records);

  return updatedRecord;
}

export async function changeUserPassword(id: string, password: string) {
  const normalizedPassword = password.trim();

  if (!normalizedPassword) {
    throw new Error("Enter password.");
  }

  const records = getUserStore();
  const record = records.find((row) => row.id === id);

  if (!record) {
    throw new Error("User record not found.");
  }

  const passwordStore = getPasswordStore();
  const currentPassword = passwordStore[id] ?? DEFAULT_USER_PASSWORD;

  if (normalizedPassword === currentPassword) {
    throw new Error("New password cannot be the old password.");
  }

  passwordStore[id] = normalizedPassword;
  savePasswordStore(passwordStore);

  record.updatedBy = SYSTEM_USER_NAME;
  record.updatedDate = new Date();
  saveUserStore(records);

  return record;
}

export async function updateUserManagementStatus(
  id: string,
  status: "ACTIVE" | "INACTIVE",
) {
  const records = getUserStore();
  const recordIndex = records.findIndex((row) => row.id === id);

  if (recordIndex < 0) {
    throw new Error("User record not found.");
  }

  const existingRecord = records[recordIndex];

  if (!existingRecord) {
    throw new Error("User record not found.");
  }

  const isActive = status === "ACTIVE";
  const updatedRecord = {
    ...existingRecord,
    isActive,
    statusLabel: isActive ? "Active" : "Inactive",
    updatedBy: SYSTEM_USER_NAME,
    updatedDate: new Date(),
  };

  records[recordIndex] = updatedRecord;
  saveUserStore(records);

  return updatedRecord;
}

function buildUserDetailFromValues(
  values: Record<string, MasterFieldValue>,
  existingRecord: UserManagementDetail | undefined,
  id: string,
  permissions?: Record<string, UserPermissionFlags>,
): UserManagementDetail {
  const isActive = getBooleanValue(values.isActive, existingRecord?.isActive ?? true);
  const now = new Date();

  return {
    address: getStringValue(values.address, existingRecord?.address),
    aadhaarNo: getStringValue(values.aadhaarNo, existingRecord?.aadhaarNo),
    aadhaarUpload: getStringValue(
      values.aadhaarUpload,
      existingRecord?.aadhaarUpload,
    ),
    age: getStringValue(values.age, existingRecord?.age),
    approver: getStringValue(values.approver, existingRecord?.approver),
    bloodGroup: getStringValue(values.bloodGroup, existingRecord?.bloodGroup),
    city: getStringValue(values.city, existingRecord?.city),
    country: getStringValue(values.country, existingRecord?.country),
    createdBy: existingRecord?.createdBy ?? SYSTEM_USER_NAME,
    createdDate: existingRecord?.createdDate ?? now,
    dateOfBirth: getDateValue(values.dateOfBirth, existingRecord?.dateOfBirth),
    department: getStringValue(values.department, existingRecord?.department),
    email: getStringValue(values.email, existingRecord?.email),
    firstName: getStringValue(values.firstName, existingRecord?.firstName),
    gender: getStringValue(values.gender, existingRecord?.gender),
    id,
    isActive,
    lastName: getStringValue(values.lastName, existingRecord?.lastName),
    permissions:
      permissions ?? existingRecord?.permissions ?? buildDefaultUserPermissions(),
    phoneNo: getStringValue(values.phoneNo, existingRecord?.phoneNo),
    panNo: getStringValue(values.panNo, existingRecord?.panNo),
    panUpload: getStringValue(values.panUpload, existingRecord?.panUpload),
    pincode: getStringValue(values.pincode, existingRecord?.pincode),
    remarks: getStringValue(values.remarks, existingRecord?.remarks),
    role: getStringValue(values.role, existingRecord?.role),
    state: getStringValue(values.state, existingRecord?.state),
    statusLabel: isActive ? "Active" : "Inactive",
    updatedBy: SYSTEM_USER_NAME,
    updatedDate: now,
    userName: getStringValue(values.userName, existingRecord?.userName),
    userType: existingRecord?.userType ?? "",
  };
}

function getUserStore() {
  if (typeof window === "undefined") {
    return getSeedDetails();
  }

  const storedRecords = window.localStorage.getItem(USER_MANAGEMENT_STORAGE_KEY);

  if (!storedRecords) {
    const seedRecords = getSeedDetails();
    saveUserStore(seedRecords);
    return seedRecords;
  }

  try {
    const parsedRecords = JSON.parse(storedRecords) as StoredUserManagementDetail[];
    return parsedRecords.map(deserializeUserDetail);
  } catch {
    const seedRecords = getSeedDetails();
    saveUserStore(seedRecords);
    return seedRecords;
  }
}

function saveUserStore(records: UserManagementDetail[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    USER_MANAGEMENT_STORAGE_KEY,
    JSON.stringify(records.map(serializeUserDetail)),
  );
}

function getSeedDetails() {
  return userManagementDetails.map(serializeUserDetail).map(deserializeUserDetail);
}

function toRecord(detail: UserManagementDetail): UserManagementRecord {
  const { permissions: _permissions, ...record } = detail;
  return record;
}

function createUserId(records: UserManagementDetail[]) {
  const nextNumericId =
    records.reduce((maxId, record) => {
      const numericId = Number(record.id.replace(/\D/g, ""));
      return Number.isFinite(numericId) ? Math.max(maxId, numericId) : maxId;
    }, 0) + 1;

  return `user-${nextNumericId}`;
}

function serializeUserDetail(
  detail: UserManagementDetail,
): StoredUserManagementDetail {
  return {
    ...detail,
    createdDate: detail.createdDate.toISOString(),
    dateOfBirth: detail.dateOfBirth.toISOString(),
    updatedDate: detail.updatedDate.toISOString(),
  };
}

function deserializeUserDetail(
  detail: StoredUserManagementDetail,
): UserManagementDetail {
  const isActive = detail.isActive ?? detail.statusLabel !== "Inactive";

  return {
    ...detail,
    createdDate: parseDate(detail.createdDate),
    dateOfBirth: parseDate(detail.dateOfBirth),
    isActive,
    permissions: detail.permissions ?? buildDefaultUserPermissions(),
    statusLabel: isActive ? "Active" : "Inactive",
    updatedDate: parseDate(detail.updatedDate),
  };
}

function getPasswordStore() {
  if (typeof window === "undefined") {
    return {} as Record<string, string>;
  }

  const storedPasswords = window.localStorage.getItem(USER_PASSWORD_STORAGE_KEY);

  if (!storedPasswords) {
    return {};
  }

  try {
    return JSON.parse(storedPasswords) as Record<string, string>;
  } catch {
    return {};
  }
}

function savePasswordStore(passwords: Record<string, string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USER_PASSWORD_STORAGE_KEY, JSON.stringify(passwords));
}

function getStringValue(value: MasterFieldValue | undefined, fallback = "") {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object" && "name" in value) {
    return value.name.trim();
  }

  return fallback;
}

function getBooleanValue(value: MasterFieldValue | undefined, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["active", "enabled", "true", "yes"].includes(
      value.trim().toLowerCase(),
    );
  }

  return fallback;
}

function getDateValue(value: MasterFieldValue | undefined, fallback?: Date) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    return parseDate(value);
  }

  return fallback ?? new Date("2000-01-01");
}

function parseDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function getSearchValues(row: UserManagementRecord) {
  return Object.values(row).map((value) => {
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }

    return String(value ?? "");
  });
}
