import {
  getCurrentUser,
  getUserDisplayName,
} from "../../auth";
import type {
  MasterDefinition,
  MasterFieldValue,
  MasterFilterDefinition,
  MasterRecord,
} from "./types";
import {
  normalizeMasterDefinitionStatus,
  normalizeMasterRecordStatus,
  normalizeMasterStatusValue,
} from "./utils";

const LOCAL_MASTER_RECORDS_STORAGE_KEY = "deluxe-veneers-local-master-records";
const LOCAL_MASTER_RECORD_ID_PREFIX = "local-master-record-";

type SerializedMasterRecord = Record<
  string,
  string | boolean | null | undefined
>;

type StoredMasterRecords = Record<string, SerializedMasterRecord[]>;

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStoredMasterRecords(): StoredMasterRecords {
  const storage = getLocalStorage();

  if (!storage) {
    return {};
  }

  const rawValue = storage.getItem(LOCAL_MASTER_RECORDS_STORAGE_KEY);

  if (!rawValue) {
    return {};
  }

  try {
    const parsedValue = JSON.parse(rawValue) as StoredMasterRecords;
    return parsedValue && typeof parsedValue === "object" ? parsedValue : {};
  } catch {
    return {};
  }
}

function writeStoredMasterRecords(records: StoredMasterRecords) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(LOCAL_MASTER_RECORDS_STORAGE_KEY, JSON.stringify(records));
}

function serializeMasterRecord(record: MasterRecord): SerializedMasterRecord {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [
      key,
      value instanceof Date ? value.toISOString() : value,
    ]),
  );
}

function parseMasterRecord(record: SerializedMasterRecord): MasterRecord {
  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => {
      if (
        typeof value === "string" &&
        (key.toLowerCase().includes("date") || key.toLowerCase().endsWith("at"))
      ) {
        const parsedDate = new Date(value);
        return [key, Number.isNaN(parsedDate.getTime()) ? value : parsedDate];
      }

      return [key, value];
    }),
  ) as MasterRecord;
}

export function getStoredMasterRows(slug: string): MasterRecord[] {
  return (readStoredMasterRecords()[slug] ?? []).map(parseMasterRecord);
}

export function getLiveMasterOptions(
  definitionRows: ReadonlyArray<MasterRecord>,
  slug: string,
  key: string,
): string[] {
  const stored = getStoredMasterRows(slug);
  const allRows = [...definitionRows, ...stored];
  const unique = new Set<string>();

  for (const row of allRows) {
    if (String(row.status ?? "Active").toLowerCase() === "inactive") {
      continue;
    }
    const val = row[key];
    if (typeof val === "string" && val.trim().length > 0) {
      unique.add(val.trim());
    }
  }

  return Array.from(unique);
}

function toTextValue(value: MasterFieldValue) {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (value && typeof value === "object" && "name" in value) {
    return value.name;
  }

  return typeof value === "string" ? value.trim() : "";
}

function getCreatedTime(row: MasterRecord) {
  const value = row.createdDate ?? row.createdAt ?? row.createdEditedDate;

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return Number.isNaN(timestamp) ? 0 : timestamp;
  }

  return 0;
}

function getUniqueFilterOptions(
  rows: ReadonlyArray<MasterRecord>,
  key: string,
) {
  return Array.from(
    new Set(
      rows
        .map((row) => row[key])
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );
}

function buildFilterDefinitions(
  filters: readonly MasterFilterDefinition[],
  rows: ReadonlyArray<MasterRecord>,
) {
  return filters.map((filter) => ({
    ...filter,
    options: getUniqueFilterOptions(rows, filter.key),
  }));
}

function buildLocalMasterRecord(
  definition: MasterDefinition,
  values: Record<string, MasterFieldValue>,
  currentRecord?: MasterRecord,
) {
  const currentUser = getCurrentUser();
  const userDisplayName = getUserDisplayName(currentUser);
  const now = new Date();
  const nextRecord: MasterRecord = {
    ...(currentRecord ?? {}),
    id:
      currentRecord?.id ??
      `${LOCAL_MASTER_RECORD_ID_PREFIX}${definition.slug}-${Date.now()}`,
    createdBy: currentRecord?.createdBy ?? userDisplayName,
    editedBy: userDisplayName,
    createdDate: currentRecord?.createdDate ?? now,
    updatedDate: now,
    status: normalizeMasterStatusValue(currentRecord?.status),
  };

  definition.fields.forEach((field) => {
    const nextValue = toTextValue(values[field.key] ?? "");

    if (field.key === "status" && nextValue === "") {
      nextRecord[field.key] = "Active";
      return;
    }

    nextRecord[field.key] = nextValue;
  });

  Object.entries(values).forEach(([key, value]) => {
    if (definition.fields.some((field) => field.key === key)) {
      return;
    }

    nextRecord[key] = toTextValue(value);
  });

  return nextRecord;
}

function getStatusText(checked: boolean) {
  return checked ? "Active" : "Inactive";
}

export function buildLocalMasterDefinition(
  definition: MasterDefinition,
): MasterDefinition {
  const normalizedDefinition = normalizeMasterDefinitionStatus(definition);
  const rowsById = new Map<string, MasterRecord>();

  normalizedDefinition.rows.forEach((row) => {
    rowsById.set(row.id, row);
  });

  getStoredMasterRows(normalizedDefinition.slug).forEach((row) => {
    rowsById.set(row.id, normalizeMasterRecordStatus(row));
  });

  const mergedRows = Array.from(rowsById.values())
    .slice()
    .sort((left, right) => getCreatedTime(right) - getCreatedTime(left))
    .map((row, index) => ({
      ...row,
      srNo: String(index + 1),
    }));

  // Dynamically resolve options for fields that depend on other masters
  const updatedFields = normalizedDefinition.fields.map((field) => {
    // 1. Dynamic GST options in HSN Master
    if (normalizedDefinition.slug === "hsn-master" && (field.key === "gstPercentage" || field.key === "gst")) {
      const storedGst = getStoredMasterRows("gst-master");
      const gstPercentages = new Set<string>();
      // Standard base options
      ["5%", "12%", "18%", "28%"].forEach((p) => gstPercentages.add(p));
      for (const r of storedGst) {
        if (String(r.status ?? "Active").toLowerCase() !== "inactive") {
          const p = r.gstPercentage || r.percentage;
          if (p) gstPercentages.add(String(p).endsWith("%") ? String(p) : `${p}%`);
        }
      }
      return {
        ...field,
        options: Array.from(gstPercentages),
      };
    }

    // 2. Dynamic HSN options in other masters (Item Master, Item Category Master, etc.)
    if (field.key === "hsn" || field.key === "hsnCode") {
      const storedHsn = getStoredMasterRows("hsn-master");
      const hsnCodes = new Set<string>(field.options ?? []);
      for (const r of storedHsn) {
        if (String(r.status ?? "Active").toLowerCase() !== "inactive") {
          const code = r.hsnCode || r.code || r.hsn;
          if (typeof code === "string" && code.trim()) {
            hsnCodes.add(code.trim());
          }
        }
      }
      return {
        ...field,
        options: Array.from(hsnCodes),
      };
    }

    return field;
  });

  return {
    ...normalizedDefinition,
    fields: updatedFields,
    rows: mergedRows,
    filters: buildFilterDefinitions(normalizedDefinition.filters, mergedRows),
  };
}

export function createLocalMasterRecord(
  definition: MasterDefinition,
  values: Record<string, MasterFieldValue>,
) {
  const storedRecords = readStoredMasterRecords();
  const nextRecord = buildLocalMasterRecord(definition, values);
  const currentRows = (storedRecords[definition.slug] ?? []).map(parseMasterRecord);
  const nextRows = [...currentRows, nextRecord].map(serializeMasterRecord);

  writeStoredMasterRecords({
    ...storedRecords,
    [definition.slug]: nextRows,
  });

  return nextRecord;
}

export function updateLocalMasterRecord(
  definition: MasterDefinition,
  row: MasterRecord,
  values: Record<string, MasterFieldValue>,
) {
  const storedRecords = readStoredMasterRecords();
  const currentRows = (storedRecords[definition.slug] ?? []).map(parseMasterRecord);

  if (!row.id.startsWith(LOCAL_MASTER_RECORD_ID_PREFIX)) {
    const nextRecord = buildLocalMasterRecord(definition, values, row);
    writeStoredMasterRecords({
      ...storedRecords,
      [definition.slug]: [...currentRows, nextRecord].map(serializeMasterRecord),
    });
    return nextRecord;
  }

  const nextRecord = buildLocalMasterRecord(definition, values, row);
  writeStoredMasterRecords({
    ...storedRecords,
    [definition.slug]: currentRows
      .map((record) => (record.id === row.id ? nextRecord : record))
      .map(serializeMasterRecord),
  });

  return nextRecord;
}

export function updateLocalMasterStatus(
  definition: MasterDefinition,
  row: MasterRecord,
  checked: boolean,
) {
  const storedRecords = readStoredMasterRecords();
  const currentRows = (storedRecords[definition.slug] ?? []).map(parseMasterRecord);
  const currentUser = getCurrentUser();
  const userDisplayName = getUserDisplayName(currentUser);
  const nextRecord: MasterRecord = {
    ...row,
    status: getStatusText(checked),
    editedBy: userDisplayName,
    updatedDate: new Date(),
  };
  const hasStoredRecord = currentRows.some((record) => record.id === row.id);
  const nextRows = hasStoredRecord
    ? currentRows.map((record) => (record.id === row.id ? nextRecord : record))
    : [...currentRows, nextRecord];

  writeStoredMasterRecords({
    ...storedRecords,
    [definition.slug]: nextRows.map(serializeMasterRecord),
  });

  return nextRecord;
}
