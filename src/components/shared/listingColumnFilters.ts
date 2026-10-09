import { inferColumnFilterType } from "./columnFilters/inferFilterType";
import type { ColumnFilterType } from "./columnFilters/types";

const NEVER_FILTERABLE_PATTERN =
  /(^|[^a-z])(actions?|menu|edit|view|checkbox|selection)([^a-z]|$)|remark|note|description/i;

const REMARK_PATTERN = /(^|[^a-z])(remark|remarks|note|notes|description|descriptions)([^a-z]|$)/i;

export function isRemarkColumn(key: string, label = ""): boolean {
  return REMARK_PATTERN.test(`${key} ${label}`.trim());
}

const ALWAYS_FILTERABLE_PATTERN =
  /(status|active|category|sub.?categor|department|warehouse|location|grade|unit|currency|country|state|city|type|stage|role|supplier|customer|cut|color|gst|hsn|transporter|qc|packing|dispatch|priority|payment|mode|factory|order.?no|item.?name|product|issued.?from|issued.?for|sample|process|date|amount|qty|quantity|sheets|rate|sqm|sqf)/i;

export function isFilterableListingColumn(
  key: string,
  label: string,
  uniqueValueCount: number,
  filterableOverride?: boolean,
  _filterType?: ColumnFilterType,
): boolean {
  const haystack = `${key} ${label}`.trim();

  if (NEVER_FILTERABLE_PATTERN.test(haystack)) {
    return false;
  }

  if (typeof filterableOverride === "boolean") {
    return filterableOverride;
  }

  return uniqueValueCount >= 1;
}

export function shouldSearchColumnFilterOptions(_uniqueValueCount?: number) {
  return true;
}

export function buildColumnFilterSearchPlaceholder(_label?: string) {
  return "Search values...";
}

export function resolveListingColumnFilterType(_args?: {
  key?: string;
  label?: string;
  override?: ColumnFilterType;
  sampleValues?: readonly (string | boolean | Date | null | undefined)[];
}): ColumnFilterType {
  return inferColumnFilterType();
}
