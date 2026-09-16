import { SearchableMultiSelectColumnFilter } from "../SearchableMultiSelectColumnFilter";
import type { ColumnFilterOption as MultiSelectOption } from "../SearchableMultiSelectColumnFilter";
import {
  isActiveColumnFilter,
  type ColumnFilterType,
  type ColumnFilterValue,
} from "./types";

/**
 * Shared column filter popover — always Excel-style value multiselect.
 */
export function ColumnFilterPopoverRouter({
  open,
  anchorEl,
  onClose,
  label,
  options,
  value,
  onApplyMultiSelect,
  onClear,
}: {
  open: boolean;
  anchorEl: HTMLElement | null;
  onClose: () => void;
  label: string;
  /** @deprecated Ignored — all columns use value multiselect. */
  filterType?: ColumnFilterType;
  options: readonly MultiSelectOption[];
  uniqueCount?: number;
  value: ColumnFilterValue | undefined;
  onApply?: (nextFilter: ColumnFilterValue | null) => void;
  onApplyMultiSelect: (values: string[]) => void;
  onClear: () => void;
}) {
  const selectedValues =
    value?.type === "multiSelect" ? value.values : [];

  return (
    <SearchableMultiSelectColumnFilter
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      label={label}
      options={options}
      selectedValues={selectedValues}
      onApply={onApplyMultiSelect}
      onClear={onClear}
      searchable
      searchPlaceholder="Search values..."
    />
  );
}

export function getColumnFilterBadgeCount(
  filter: ColumnFilterValue | undefined,
): number {
  if (!isActiveColumnFilter(filter)) {
    return 0;
  }

  if (filter.type === "multiSelect") {
    return filter.values.length;
  }

  return 0;
}

/** Preferred name for the shared Excel-style value filter popover. */
export { SearchableMultiSelectColumnFilter as ColumnValueFilter } from "../SearchableMultiSelectColumnFilter";
