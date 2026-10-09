import type { ColumnFilterValue } from "./types";
import { isActiveColumnFilter } from "./types";

/**
 * Match a cell against an applied column filter.
 * Only Excel-style multiSelect value filters are supported.
 */
export function matchColumnFilter(
  _rawValue: unknown,
  formattedValue: string,
  filter: ColumnFilterValue | undefined,
): boolean {
  if (!isActiveColumnFilter(filter)) {
    return true;
  }

  if (filter.type !== "multiSelect") {
    return true;
  }

  const normalized = formattedValue.trim();
  return filter.values.includes(normalized);
}
