import type { UserManagementRecord } from "../shared/userManagementConfig";

export function getUserDisplayName(row: UserManagementRecord) {
  const fullName = `${row.firstName} ${row.lastName}`.trim();
  return fullName || row.userName || row.email || "User";
}

export function getUniqueSortedValues(values: readonly string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((first, second) =>
    first.localeCompare(second, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
}
