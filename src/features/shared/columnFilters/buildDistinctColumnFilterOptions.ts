import type { ColumnFilterOption } from "../SearchableMultiSelectColumnFilter";

export const COLUMN_FILTER_BLANK_VALUE = "";
export const COLUMN_FILTER_BLANK_LABEL = "(Blank)";

/**
 * Build Excel-style distinct filter options from formatted cell strings.
 * Includes a selectable (Blank) entry when empty values exist.
 */
export function buildDistinctColumnFilterOptions(
  formattedValues: readonly string[],
): ColumnFilterOption[] {
  let hasBlank = false;
  const unique = new Set<string>();

  formattedValues.forEach((raw) => {
    const trimmed = raw.trim();

    if (!trimmed) {
      hasBlank = true;
      return;
    }

    unique.add(trimmed);
  });

  const sorted = Array.from(unique).sort((first, second) =>
    first.localeCompare(second, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );

  const options: ColumnFilterOption[] = sorted.map((value) => ({
    value,
    label: value,
  }));

  if (hasBlank) {
    options.unshift({
      value: COLUMN_FILTER_BLANK_VALUE,
      label: COLUMN_FILTER_BLANK_LABEL,
    });
  }

  return options;
}
