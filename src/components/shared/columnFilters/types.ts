export type ColumnFilterType = "multiSelect" | "audit";

export type MultiSelectColumnFilter = {
  type: "multiSelect";
  values: string[];
};

/** Only Excel-style value filters are active in the portal. */
export type ColumnFilterValue = MultiSelectColumnFilter;

export const AUDIT_NAME_FILTER_PREFIX = "__audit_name__:";
export const AUDIT_DATE_FROM_FILTER_PREFIX = "__audit_date_from__:";
export const AUDIT_DATE_TO_FILTER_PREFIX = "__audit_date_to__:";

function asDateToken(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export function encodeAuditFilterValues(
  names: string[],
  dateFrom: string | string[] = "",
  dateTo: string | string[] = "",
) {
  const from = asDateToken(dateFrom);
  const to = asDateToken(dateTo);

  return [
    ...names.map((value) => `${AUDIT_NAME_FILTER_PREFIX}${value}`),
    ...(from ? [`${AUDIT_DATE_FROM_FILTER_PREFIX}${from}`] : []),
    ...(to ? [`${AUDIT_DATE_TO_FILTER_PREFIX}${to}`] : []),
  ];
}

export function decodeAuditFilterValues(values: readonly string[]) {
  const dateFrom =
    values
      .find((value) => value.startsWith(AUDIT_DATE_FROM_FILTER_PREFIX))
      ?.slice(AUDIT_DATE_FROM_FILTER_PREFIX.length) ?? "";
  const dateTo =
    values
      .find((value) => value.startsWith(AUDIT_DATE_TO_FILTER_PREFIX))
      ?.slice(AUDIT_DATE_TO_FILTER_PREFIX.length) ?? "";

  return {
    names: values
      .filter((value) => value.startsWith(AUDIT_NAME_FILTER_PREFIX))
      .map((value) => value.slice(AUDIT_NAME_FILTER_PREFIX.length)),
    dateFrom,
    dateTo,
    /** @deprecated Use dateFrom/dateTo. Kept so older callers do not crash. */
    dates: [dateFrom, dateTo].filter(Boolean),
  };
}

export type ColumnFilterOption = {
  label: string;
  value: string;
};

export function isActiveColumnFilter(
  filter: ColumnFilterValue | undefined,
): filter is ColumnFilterValue {
  return Boolean(filter && filter.type === "multiSelect" && filter.values.length > 0);
}

function isUpdatedAuditColumn(key: string) {
  return /updated|edited/i.test(key);
}

/**
 * Converts UI column filters into API query filters.
 * Created/Updated columns store encoded name + date-range tokens; those are
 * expanded into createdBy/createdAtFrom/createdAtTo (and updated* equivalents).
 */
export function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) {
      continue;
    }

    const auditValues = decodeAuditFilterValues(filter.values);
    const hasAudit =
      auditValues.names.length > 0 ||
      Boolean(auditValues.dateFrom) ||
      Boolean(auditValues.dateTo);

    if (hasAudit) {
      const isUpdated = isUpdatedAuditColumn(key);
      if (auditValues.names.length > 0) {
        filters[isUpdated ? "updatedBy" : "createdBy"] = auditValues.names;
      }
      if (auditValues.dateFrom) {
        filters[isUpdated ? "updatedAtFrom" : "createdAtFrom"] = [
          auditValues.dateFrom,
        ];
      }
      if (auditValues.dateTo) {
        filters[isUpdated ? "updatedAtTo" : "createdAtTo"] = [auditValues.dateTo];
      }
      continue;
    }

    filters[key] = filter.values;
  }

  return filters;
}
