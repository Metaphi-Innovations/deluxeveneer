import type { ColumnFilterValue } from "./types";

export function formatActiveFilterChipLabel(
  columnLabel: string,
  filter: ColumnFilterValue,
): string {
  if (filter.type !== "multiSelect") {
    return columnLabel;
  }

  if (filter.values.length === 1) {
    const only = filter.values[0];
    return `${columnLabel}: ${only === "" ? "(Blank)" : only}`;
  }

  return `${columnLabel}: ${filter.values.length} selected`;
}
