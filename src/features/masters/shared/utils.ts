import type {
  MasterColumn,
  MasterDefinition,
  MasterFieldDefinition,
  MasterFieldValue,
  MasterFilterDefinition,
  MasterRecord,
} from "./types";
import { formatDisplayValueByField } from "../../shared/numberFormat";

const activeStatusText = "Active";
const inactiveStatusText = "Inactive";
const statusOptions = [activeStatusText, inactiveStatusText];

const inactiveStatusValues = new Set([
  "0",
  "disabled",
  "false",
  "inactive",
  "in-active",
  "in_active",
  "no",
]);

function toDateDisplay(value: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function isRemarkToken(token: { key: string; label?: string }) {
  const normalizedKey = normalizeTokenIdentifier(token.key);
  const normalizedLabel = normalizeTokenIdentifier(token.label ?? "");

  return (
    normalizedKey === "remark" ||
    normalizedKey === "remarks" ||
    normalizedLabel === "remark" ||
    normalizedLabel === "remarks"
  );
}

function insertBeforeStatus<T extends { key: string; label?: string }>(
  items: readonly T[],
  itemToInsert: T,
) {
  const statusIndex = items.findIndex(isStatusToken);

  if (statusIndex === -1) {
    return [...items, itemToInsert];
  }

  return [
    ...items.slice(0, statusIndex),
    itemToInsert,
    ...items.slice(statusIndex),
  ];
}

export function createMasterRows(
  prefix: string,
  rows: ReadonlyArray<Omit<MasterRecord, "id"> & Partial<Pick<MasterRecord, "id">>>,
) {
  return rows.map((row, index) => ({
    id: row.id ?? `${prefix}-${index + 1}`,
    srNo: String(index + 1),
    ...row,
  }));
}

export function normalizeMasterStatusValue(
  value: MasterFieldValue | MasterRecord[string],
) {
  if (typeof value === "boolean") {
    return value ? activeStatusText : inactiveStatusText;
  }

  if (typeof value === "string") {
    return inactiveStatusValues.has(value.trim().toLowerCase())
      ? inactiveStatusText
      : activeStatusText;
  }

  return activeStatusText;
}

export function normalizeMasterRecordStatus(row: MasterRecord): MasterRecord {
  return {
    ...row,
    status: normalizeMasterStatusValue(row.status ?? row.statusLabel),
  };
}

export function normalizeMasterDefinitionStatus(
  definition: MasterDefinition,
): MasterDefinition {
  const hasRemarkColumn = definition.columns.some(isRemarkToken);
  const hasRemarkField = definition.fields.some(isRemarkToken);
  const hasStatusColumn = definition.columns.some(isStatusToken);
  const hasStatusFilter = definition.filters.some(isStatusToken);
  const hasStatusField = definition.fields.some(isStatusToken);
  const remarkColumn: MasterColumn = { key: "remark", label: "Remark" };
  const remarkField: MasterFieldDefinition = {
    key: "remark",
    label: "Remark",
    type: "text",
  };
  const statusColumn: MasterColumn = { key: "status", label: "Status" };
  const statusFilter: MasterFilterDefinition = {
    key: "status",
    label: "Status",
    options: statusOptions,
  };
  const statusField: MasterFieldDefinition = {
    key: "status",
    label: "Status",
    options: statusOptions,
    type: "select",
  };

  return {
    ...definition,
    columns: addStatusIfMissing(
      hasRemarkColumn
        ? definition.columns
        : insertBeforeStatus(definition.columns, remarkColumn),
      hasStatusColumn,
      statusColumn,
    ),
    fields: addStatusIfMissing(
      hasRemarkField
        ? definition.fields
        : insertBeforeStatus(definition.fields, remarkField),
      hasStatusField,
      statusField,
    ),
    filters: hasStatusFilter
      ? definition.filters
      : [...definition.filters, statusFilter],
    rows: definition.rows.map(normalizeMasterRecordStatus),
  };
}

function addStatusIfMissing<T extends { key: string; label?: string }>(
  items: readonly T[],
  hasStatus: boolean,
  statusItem: T,
) {
  return hasStatus ? [...items] : [...items, statusItem];
}

export function formatMasterValue(
  value: MasterRecord[string],
  key?: string,
  label?: string,
) {
  if (value instanceof Date) {
    return toDateDisplay(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (key) {
    return formatDisplayValueByField(value, key, label);
  }

  return String(value);
}

export function normalizeMasterSortValue(value: MasterRecord[string]) {
  if (value instanceof Date) {
    return value.getTime();
  }

  const textValue = formatMasterValue(value);
  const parsedDate = Date.parse(textValue);

  if (!Number.isNaN(parsedDate) && /[A-Za-z]{3}|\d{4}/.test(textValue)) {
    return parsedDate;
  }

  const numericCandidate = textValue.replace(/[^0-9.-]/g, "");

  if (numericCandidate && !Number.isNaN(Number(numericCandidate))) {
    return Number(numericCandidate);
  }

  return textValue.toLowerCase();
}

export function buildMasterInitialValues(
  definition: Pick<MasterDefinition, "fields">,
  row?: MasterRecord,
) {
  return definition.fields.reduce<Record<string, MasterFieldValue>>(
    (accumulator, field) => {
      accumulator[field.key] = getDefaultFieldValue(field, row?.[field.key]);
      return accumulator;
    },
    {},
  );
}

function getDefaultFieldValue(
  field: MasterFieldDefinition,
  value: MasterRecord[string],
) {
  if (field.type === "date") {
    return value instanceof Date ? value : null;
  }

  if (field.type === "checkbox" || field.type === "toggle") {
    return getBooleanFieldValue(value);
  }

  return typeof value === "string" ? value : "";
}

function getBooleanFieldValue(value: MasterRecord[string]) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["active", "enabled", "true", "yes"].includes(
      value.trim().toLowerCase(),
    );
  }

  return false;
}

function isStatusToken(token: { key: string; label?: string }) {
  return (
    normalizeTokenIdentifier(token.key) === "status" ||
    normalizeTokenIdentifier(token.label ?? "") === "status"
  );
}

function normalizeTokenIdentifier(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function getMasterPaths(slug: string) {
  return {
    list: `/masters/${slug}`,
    add: `/masters/${slug}/add`,
    edit: (id: string) => `/masters/${slug}/edit/${id}`,
    view: (id: string) => `/masters/${slug}/view/${id}`,
  };
}

export function getMasterPageTitle(
  definition: MasterDefinition,
  mode: "list" | "add" | "edit" | "view",
) {
  if (mode === "list") {
    return definition.title;
  }

  const verb =
    mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View";

  return `${verb} ${definition.title}`;
}
