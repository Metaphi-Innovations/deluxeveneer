import type { ColumnFilterType } from "./types";

/**
 * All listing column filters use Excel-style distinct value multiselect.
 * Condition builders (equals / gt / date ranges) are not used.
 */
export function inferColumnFilterType(_args?: {
  key?: string;
  label?: string;
  override?: ColumnFilterType;
  sampleValues?: readonly unknown[];
}): ColumnFilterType {
  return "multiSelect";
}
