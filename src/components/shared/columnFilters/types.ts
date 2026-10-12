export type ColumnFilterType = "multiSelect";

export type MultiSelectColumnFilter = {
  type: "multiSelect";
  values: string[];
};

/** Only Excel-style value filters are active in the portal. */
export type ColumnFilterValue = MultiSelectColumnFilter;

export type ColumnFilterOption = {
  label: string;
  value: string;
};

export function isActiveColumnFilter(
  filter: ColumnFilterValue | undefined,
): filter is ColumnFilterValue {
  return Boolean(filter && filter.type === "multiSelect" && filter.values.length > 0);
}
