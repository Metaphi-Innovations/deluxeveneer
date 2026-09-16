export type WarehouseQcStatus = "pending" | "pass" | "fail";

const warehouseQcStatusStorageKey = "deluxe-veneers-warehouse-qc-statuses";
const warehouseQcTransferStorageKey =
  "deluxe-veneers-warehouse-qc-transferred-ids";
const warehouseQcDetailsStorageKey =
  "deluxe-veneers-warehouse-qc-pass-details";
const warehouseQcStatusChangedEvent =
  "deluxe-veneers-warehouse-qc-status-changed";

type WarehouseQcRow = {
  id: string;
  inventoryRecordId?: string | undefined;
  qcStatus?: string | undefined;
  status?: string | undefined;
};

type WarehouseQcStatusMap = Record<string, WarehouseQcStatus>;

export interface WarehouseQcPassDetails {
  remark: string;
  fileName: string;
}

export function getWarehouseQcStatus(row: WarehouseQcRow): WarehouseQcStatus {
  const statusMap = getWarehouseQcStatusMap();
  const storedStatus =
    statusMap[row.id] ??
    (row.inventoryRecordId ? statusMap[row.inventoryRecordId] : undefined);

  if (storedStatus) {
    return storedStatus;
  }

  const normalizedQcStatus = normalizeWarehouseQcStatus(row.qcStatus);

  if (normalizedQcStatus) {
    return normalizedQcStatus;
  }

  const normalizedStatus = normalizeWarehouseQcStatus(row.status);
  return normalizedStatus ?? "pending";
}

export function isWarehouseQcTransferred(row: WarehouseQcRow | string) {
  const ids = getWarehouseQcTransferredIds();
  const rowId = typeof row === "string" ? row : row.id;
  const inventoryRecordId =
    typeof row === "string" ? undefined : row.inventoryRecordId;

  return (
    ids.has(rowId) ||
    (inventoryRecordId ? ids.has(inventoryRecordId) : false)
  );
}

/** @deprecated Prefer markWarehouseQcPass — kept for legacy callers. */
export function markWarehouseQcDone(row: WarehouseQcRow | string) {
  markWarehouseQcPass(row);
}

export function markWarehouseQcPass(
  row: WarehouseQcRow | string,
  details: WarehouseQcPassDetails = { remark: "", fileName: "" },
) {
  const rowId = typeof row === "string" ? row : row.id;
  const inventoryRecordId =
    typeof row === "string" ? undefined : row.inventoryRecordId;

  if (isWarehouseQcTransferred({ id: rowId, inventoryRecordId })) {
    return false;
  }

  const currentStatus = getWarehouseQcStatus({
    id: rowId,
    inventoryRecordId,
    qcStatus: typeof row === "string" ? undefined : row.qcStatus,
    status: typeof row === "string" ? undefined : row.status,
  });

  if (currentStatus === "pass") {
    return false;
  }

  const nextStatusMap: WarehouseQcStatusMap = {
    ...getWarehouseQcStatusMap(),
    [rowId]: "pass",
  };

  if (inventoryRecordId) {
    nextStatusMap[inventoryRecordId] = "pass";
  }

  const transferredIds = getWarehouseQcTransferredIds();
  transferredIds.add(rowId);

  if (inventoryRecordId) {
    transferredIds.add(inventoryRecordId);
  }

  const detailsMap = getWarehouseQcDetailsMap();
  detailsMap[rowId] = details;

  if (inventoryRecordId) {
    detailsMap[inventoryRecordId] = details;
  }

  updateWarehouseQcDetailsMap(detailsMap);
  updateWarehouseQcStatusMap(nextStatusMap);
  updateWarehouseQcTransferredIds(transferredIds);
  return true;
}

function getWarehouseQcDetailsMap() {
  if (typeof window === "undefined") {
    return {} as Record<string, WarehouseQcPassDetails>;
  }

  try {
    const rawValue = window.localStorage.getItem(warehouseQcDetailsStorageKey);

    if (!rawValue) {
      return {};
    }

    return JSON.parse(rawValue) as Record<string, WarehouseQcPassDetails>;
  } catch {
    return {};
  }
}

function updateWarehouseQcDetailsMap(
  detailsMap: Record<string, WarehouseQcPassDetails>,
) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    warehouseQcDetailsStorageKey,
    JSON.stringify(detailsMap),
  );
}

export function markWarehouseQcFail(row: WarehouseQcRow | string) {
  const rowId = typeof row === "string" ? row : row.id;
  const inventoryRecordId =
    typeof row === "string" ? undefined : row.inventoryRecordId;

  const currentStatus = getWarehouseQcStatus({
    id: rowId,
    inventoryRecordId,
    qcStatus: typeof row === "string" ? undefined : row.qcStatus,
    status: typeof row === "string" ? undefined : row.status,
  });

  if (currentStatus !== "pending") {
    return false;
  }

  if (isWarehouseQcTransferred({ id: rowId, inventoryRecordId })) {
    return false;
  }

  const nextStatusMap: WarehouseQcStatusMap = {
    ...getWarehouseQcStatusMap(),
    [rowId]: "fail",
  };

  if (inventoryRecordId) {
    nextStatusMap[inventoryRecordId] = "fail";
  }

  updateWarehouseQcStatusMap(nextStatusMap);
  return true;
}

export function resolveWarehouseQcRows<Row extends WarehouseQcRow>(
  rows: readonly Row[],
) {
  return rows.map((row) => ({
    ...row,
    qcStatus: getWarehouseQcStatus(row),
    status: getWarehouseQcDisplayStatus(getWarehouseQcStatus(row)),
  }));
}

export function getWarehouseQcDoneRows<Row extends WarehouseQcRow>(
  rows: readonly Row[],
) {
  return getWarehouseQcPassedRows(rows);
}

export function getWarehouseQcPassedRows<Row extends WarehouseQcRow>(
  rows: readonly Row[],
) {
  return resolveWarehouseQcRows(rows).filter(
    (row) => row.qcStatus === "pass",
  );
}

export function getWarehouseQcDisplayStatus(status: WarehouseQcStatus) {
  if (status === "pass") {
    return "QC Pass";
  }

  if (status === "fail") {
    return "QC Fail";
  }

  return "QC Pending";
}

export function subscribeWarehouseQcStatusUpdates(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener(warehouseQcStatusChangedEvent, listener);

  return () => {
    window.removeEventListener(warehouseQcStatusChangedEvent, listener);
  };
}

function normalizeWarehouseQcStatus(
  value: string | undefined,
): WarehouseQcStatus | null {
  const normalizedValue = value?.trim().toLowerCase();

  if (!normalizedValue) {
    return null;
  }

  if (
    normalizedValue === "pass" ||
    normalizedValue === "qc pass" ||
    normalizedValue === "done" ||
    normalizedValue === "qc done"
  ) {
    return "pass";
  }

  if (
    normalizedValue === "fail" ||
    normalizedValue === "qc fail" ||
    normalizedValue === "failed"
  ) {
    return "fail";
  }

  if (
    normalizedValue === "pending" ||
    normalizedValue === "qc pending" ||
    normalizedValue === "pending review" ||
    normalizedValue === "on hold" ||
    normalizedValue === "qc hold"
  ) {
    return "pending";
  }

  return null;
}

function getWarehouseQcStatusMap(): WarehouseQcStatusMap {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const rawValue = window.localStorage.getItem(warehouseQcStatusStorageKey);

    if (!rawValue) {
      return {};
    }

    const parsed = JSON.parse(rawValue) as Record<string, string>;
    const normalized: WarehouseQcStatusMap = {};

    Object.entries(parsed).forEach(([key, value]) => {
      const status = normalizeWarehouseQcStatus(value);

      if (status) {
        normalized[key] = status;
      }
    });

    return normalized;
  } catch {
    return {};
  }
}

function getWarehouseQcTransferredIds() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const rawValue = window.localStorage.getItem(warehouseQcTransferStorageKey);

    if (!rawValue) {
      return new Set<string>();
    }

    const parsed = JSON.parse(rawValue) as unknown;
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set<string>();
  }
}

function updateWarehouseQcStatusMap(statusMap: WarehouseQcStatusMap) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    warehouseQcStatusStorageKey,
    JSON.stringify(statusMap),
  );
  window.dispatchEvent(new CustomEvent(warehouseQcStatusChangedEvent));
}

function updateWarehouseQcTransferredIds(ids: Set<string>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(
    warehouseQcTransferStorageKey,
    JSON.stringify(Array.from(ids)),
  );
}
