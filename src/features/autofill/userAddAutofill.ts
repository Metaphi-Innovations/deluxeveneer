import type { MasterFieldValue } from "../masters/shared";
import {
  bloodGroupOptions,
  buildDefaultUserPermissions,
  type UserPermissionFlags,
} from "../user-management/shared/userManagementConfig";
import { pickFirstOption } from "./autofillUtils";
import { buildSampleIdentityDocumentUpload } from "./userDocumentAutofill";

const AUTOFILL_FIRST_NAMES = [
  "Rahul",
  "Priya",
  "Amit",
  "Neha",
  "Vikram",
  "Anita",
  "Sanjay",
  "Kavita",
] as const;

const AUTOFILL_LAST_NAMES = [
  "Sharma",
  "Patel",
  "Mehta",
  "Iyer",
  "Desai",
  "Kulkarni",
  "Reddy",
  "Nair",
] as const;

const AUTOFILL_ADDRESSES = [
  "Plot 12, MIDC Road, Andheri East",
  "Unit 8, Goregaon Industrial Estate",
  "221B, SV Road, Borivali West",
] as const;

function pickFrom<T extends string>(
  items: readonly T[],
  index: number,
): T {
  const picked = items[Math.abs(index) % items.length];
  if (picked !== undefined) {
    return picked;
  }
  return items[0] as T;
}

/** Dev-only: populate add-user with realistic sample values (unique username/email per run). */
export function buildUserAddAutofillValues(
  current: Record<string, MasterFieldValue>,
  departmentOptions: readonly string[] = [],
): Record<string, MasterFieldValue> {
  const stamp = Date.now().toString().slice(-6);
  const seed = Number(stamp);
  const firstName = pickFrom(AUTOFILL_FIRST_NAMES, seed);
  const lastName = pickFrom(AUTOFILL_LAST_NAMES, Math.floor(seed / 100));
  const address = pickFrom(AUTOFILL_ADDRESSES, Math.floor(seed / 10));
  const department =
    pickFirstOption(departmentOptions) || "Administration";
  const dateOfBirth = new Date("1992-08-14");
  const unique = stamp.slice(-4);
  const userName = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${unique}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${unique}@deluxeveneers.com`;
  const panLetters = lastName.slice(0, 5).toUpperCase().padEnd(5, "X");
  const panNo = `${panLetters}${stamp.slice(-4)}${firstName.charAt(0).toUpperCase()}`;
  const aadhaarNo = `9${stamp}${String(seed % 100000).padStart(5, "0")}`.slice(0, 12);
  const aadhaarUpload = buildSampleIdentityDocumentUpload("aadhaar_sample.jpg");
  const panUpload = buildSampleIdentityDocumentUpload("pan_sample.jpg");

  return {
    ...current,
    userName,
    firstName,
    lastName,
    email,
    phoneNo: `98${stamp}${stamp.slice(0, 2)}`.slice(0, 10),
    department,
    dateOfBirth,
    age: "32",
    bloodGroup: bloodGroupOptions[2] ?? "B+",
    address,
    pincode: "400069",
    country: "India",
    state: "Maharashtra",
    city: "Mumbai",
    aadhaarNo,
    aadhaarUpload,
    panNo,
    panUpload,
    remarks: "Sample employee profile for testing",
  };
}

/** Minimal permissions so a test user can sign in and browse. */
export function buildUserAddAutofillPermissions(): Record<
  string,
  UserPermissionFlags
> {
  const permissions = buildDefaultUserPermissions();
  permissions.dashboard = { view: true, edit: false, create: false };
  permissions.userManagement = { view: true, edit: false, create: false };
  return permissions;
}