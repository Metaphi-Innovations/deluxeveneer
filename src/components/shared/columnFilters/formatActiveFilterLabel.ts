import {
  decodeAuditFilterValues,
  type ColumnFilterValue,
} from "./types";

export function formatActiveFilterChipLabel(
  columnLabel: string,
  filter: ColumnFilterValue,
): string {
  const auditValues = decodeAuditFilterValues(filter.values);
  if (auditValues.names.length > 0 || auditValues.dateFrom || auditValues.dateTo) {
    const parts = [
      auditValues.names.length > 0
        ? `${auditValues.names.length} ${auditValues.names.length === 1 ? "name" : "names"}`
        : "",
      auditValues.dateFrom || auditValues.dateTo ? "date range" : "",
    ].filter(Boolean);
    return `${columnLabel}: ${parts.join(", ")}`;
  }

  if (filter.values.length === 1) {
    const only = filter.values[0];
    return `${columnLabel}: ${only === "" ? "(Blank)" : only}`;
  }

  return `${columnLabel}: ${filter.values.length} selected`;
}
