import {
  getCurrentUser,
  getUserDisplayName,
} from "../../auth";
import { warehouseLocationMasterDefinition } from "../../masters/shared/masterDefinitions";
import type {
  MasterDefinition,
  MasterFieldValue,
  MasterFilterDefinition,
  MasterRecord,
} from "../../masters/shared/types";

const LOCAL_WAREHOUSES_STORAGE_KEY = "deluxe-veneers-local-warehouses";
const LOCAL_WAREHOUSE_ID_PREFIX = "warehouse-location-master-local-";
const RESERVED_WAREHOUSE_SLUGS = new Set([
  "warehouse-a",
  "warehouse-b",
  "warehouse-c",
]);

export const LOCAL_WAREHOUSES_UPDATED_EVENT =
  "deluxe-veneers-local-warehouses-updated";

type WarehouseFieldKey =
  | "warehouseName"
  | "warehouseCode"
  | "warehouseType"
  | "status"
  | "address"
  | "city"
  | "pincode"
  | "state"
  | "country"
  | "remark";

export interface LocalWarehouseRecord extends MasterRecord {
  slug: string;
  warehouseName: string;
  warehouseCode: string;
  warehouseType: string;
  status: string;
  address: string;
  city: string;
  pincode: string;
  state: string;
  country: string;
  remark: string;
  createdBy: string;
  editedBy: string;
  createdDate: Date;
  updatedDate: Date;
}

interface SerializedLocalWarehouseRecord
  extends Omit<LocalWarehouseRecord, "createdDate" | "updatedDate"> {
  createdDate: string;
  updatedDate: string;
}

export interface DynamicWarehouseSidebarItem {
  id: string;
  label: string;
  slug: string;
  warehouseType: string;
}

const warehouseFieldKeys: readonly WarehouseFieldKey[] = [
  "warehouseName",
  "warehouseCode",
  "warehouseType",
  "status",
  "address",
  "city",
  "pincode",
  "state",
  "country",
  "remark",
] as const;

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function toSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toTextValue(value: MasterFieldValue) {
  return typeof value === "string" ? value.trim() : "";
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

function serializeWarehouseRecord(
  record: LocalWarehouseRecord,
): SerializedLocalWarehouseRecord {
  return {
    ...record,
    createdDate: record.createdDate.toISOString(),
    updatedDate: record.updatedDate.toISOString(),
  };
}

function parseWarehouseRecord(
  record: Partial<SerializedLocalWarehouseRecord>,
): LocalWarehouseRecord | null {
  if (
    typeof record.id !== "string" ||
    typeof record.slug !== "string" ||
    typeof record.warehouseName !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    slug: record.slug,
    srNo: typeof record.srNo === "string" ? record.srNo : "",
    warehouseName: record.warehouseName,
    warehouseCode:
      typeof record.warehouseCode === "string" ? record.warehouseCode : "",
    warehouseType:
      typeof record.warehouseType === "string" ? record.warehouseType : "",
    status: typeof record.status === "string" ? record.status : "Active",
    address: typeof record.address === "string" ? record.address : "",
    city: typeof record.city === "string" ? record.city : "",
    pincode: typeof record.pincode === "string" ? record.pincode : "",
    state: typeof record.state === "string" ? record.state : "",
    country: typeof record.country === "string" ? record.country : "",
    remark: typeof record.remark === "string" ? record.remark : "",
    createdBy:
      typeof record.createdBy === "string" ? record.createdBy : "Deluxe Veneers",
    editedBy:
      typeof record.editedBy === "string" ? record.editedBy : "Deluxe Veneers",
    createdDate:
      typeof record.createdDate === "string"
        ? new Date(record.createdDate)
        : new Date(),
    updatedDate:
      typeof record.updatedDate === "string"
        ? new Date(record.updatedDate)
        : new Date(),
  };
}

function readStoredWarehouses() {
  const storage = getLocalStorage();

  if (!storage) {
    return [] as LocalWarehouseRecord[];
  }

  const rawValue = storage.getItem(LOCAL_WAREHOUSES_STORAGE_KEY);

  if (!rawValue) {
    return [] as LocalWarehouseRecord[];
  }

  try {
    const parsedValue = JSON.parse(rawValue) as Partial<
      SerializedLocalWarehouseRecord
    >[];

    return parsedValue
      .map((record) => parseWarehouseRecord(record))
      .filter((record): record is LocalWarehouseRecord => record !== null);
  } catch {
    return [] as LocalWarehouseRecord[];
  }
}

function writeStoredWarehouses(records: ReadonlyArray<LocalWarehouseRecord>) {
  const storage = getLocalStorage();

  if (!storage) {
    return;
  }

  storage.setItem(
    LOCAL_WAREHOUSES_STORAGE_KEY,
    JSON.stringify(records.map((record) => serializeWarehouseRecord(record))),
  );

  window.dispatchEvent(new CustomEvent(LOCAL_WAREHOUSES_UPDATED_EVENT));
}

function buildUniqueWarehouseSlug(
  warehouseName: string,
  existingRecords: ReadonlyArray<LocalWarehouseRecord>,
  currentRecordId?: string,
) {
  const baseSlug = toSlug(warehouseName) || "warehouse";
  let nextSlug = baseSlug;
  let counter = 2;

  while (
    RESERVED_WAREHOUSE_SLUGS.has(nextSlug) ||
    existingRecords.some(
      (record) => record.slug === nextSlug && record.id !== currentRecordId,
    )
  ) {
    nextSlug = `${baseSlug}-${counter}`;
    counter += 1;
  }

  return nextSlug;
}

function buildLocalWarehouseRecord(
  values: Record<string, MasterFieldValue>,
  existingRecords: ReadonlyArray<LocalWarehouseRecord>,
  currentRecord?: LocalWarehouseRecord,
) {
  const currentUser = getCurrentUser();
  const userDisplayName = getUserDisplayName(currentUser);
  const now = new Date();

  const nextValues = Object.fromEntries(
    warehouseFieldKeys.map((key) => [key, toTextValue(values[key] ?? "")]),
  ) as Record<WarehouseFieldKey, string>;

  const warehouseName =
    nextValues.warehouseName || currentRecord?.warehouseName || "New Warehouse";

  return {
    id: currentRecord?.id ?? `${LOCAL_WAREHOUSE_ID_PREFIX}${Date.now()}`,
    slug: buildUniqueWarehouseSlug(
      warehouseName,
      existingRecords,
      currentRecord?.id,
    ),
    srNo: "",
    warehouseName,
    warehouseCode: nextValues.warehouseCode || currentRecord?.warehouseCode || "",
    warehouseType:
      nextValues.warehouseType || currentRecord?.warehouseType || "Storage",
    status: nextValues.status || currentRecord?.status || "Active",
    address: nextValues.address || currentRecord?.address || "",
    city: nextValues.city || currentRecord?.city || "",
    pincode: nextValues.pincode || currentRecord?.pincode || "",
    state: nextValues.state || currentRecord?.state || "",
    country: nextValues.country || currentRecord?.country || "",
    remark: nextValues.remark || currentRecord?.remark || "",
    createdBy: currentRecord?.createdBy ?? userDisplayName,
    editedBy: userDisplayName,
    createdDate: currentRecord?.createdDate ?? now,
    updatedDate: now,
  } satisfies LocalWarehouseRecord;
}

export function getLocalWarehousePath(slug: string) {
  return `/warehouses/${slug}`;
}

export function isLocalWarehouseRecordId(id: string) {
  return id.startsWith(LOCAL_WAREHOUSE_ID_PREFIX);
}

export function getLocalWarehouseRecords() {
  return readStoredWarehouses();
}

export function getDynamicSidebarWarehouses(): DynamicWarehouseSidebarItem[] {
  return getLocalWarehouseRecords().map((record) => ({
    id: record.id,
    label: record.warehouseName,
    slug: record.slug,
    warehouseType: record.warehouseType,
  }));
}

export function findLocalWarehouseBySlug(slug: string) {
  return getLocalWarehouseRecords().find((record) => record.slug === slug);
}

export function createLocalWarehouse(values: Record<string, MasterFieldValue>) {
  const existingRecords = getLocalWarehouseRecords();
  const nextRecord = buildLocalWarehouseRecord(values, existingRecords);
  writeStoredWarehouses([...existingRecords, nextRecord]);
  return nextRecord;
}

export function updateLocalWarehouse(
  id: string,
  values: Record<string, MasterFieldValue>,
) {
  const existingRecords = getLocalWarehouseRecords();
  const currentRecord = existingRecords.find((record) => record.id === id);

  if (!currentRecord) {
    return null;
  }

  const nextRecord = buildLocalWarehouseRecord(
    values,
    existingRecords,
    currentRecord,
  );

  writeStoredWarehouses(
    existingRecords.map((record) => (record.id === id ? nextRecord : record)),
  );

  return nextRecord;
}

export function buildWarehouseLocationMasterDefinition(): MasterDefinition {
  const mergedRows = [
    ...warehouseLocationMasterDefinition.rows,
    ...getLocalWarehouseRecords(),
  ]
    .slice()
    .sort((left, right) => {
      const leftTime =
        left.createdDate instanceof Date ? left.createdDate.getTime() : 0;
      const rightTime =
        right.createdDate instanceof Date ? right.createdDate.getTime() : 0;

      return rightTime - leftTime;
    })
    .map((row, index) => ({
      ...row,
      srNo: String(index + 1),
    }));

  return {
    ...warehouseLocationMasterDefinition,
    rows: mergedRows,
    filters: buildFilterDefinitions(
      warehouseLocationMasterDefinition.filters,
      mergedRows,
    ),
  };
}
