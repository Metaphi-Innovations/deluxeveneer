/**
 * Frontend-only sawing flow.
 * The sawing API module stays in place for later backend work and is not called from here.
 */

import { sawingDefinition } from "../shared/factoryDefinitions";

const STORAGE_KEY = "deluxe-sawing-frontend-flow";

type SawingFlowRow = Record<string, unknown>;

type SawingIssuedAvailability = {
  availableCbf?: string;
  availableCbm?: number;
  height?: string;
  length?: string;
  width?: string;
};

type SawingFlowState = {
  extraIssued: SawingFlowRow[];
  extraDone: SawingFlowRow[];
  extraHistory: SawingFlowRow[];
  extraRejected: SawingFlowRow[];
  hiddenIds: string[];
  availableCbm: Record<string, number>;
  issuedAvailability: Record<string, SawingIssuedAvailability>;
};

export type SawingFlowTab = "issued" | "done" | "history" | "rejected";

const emptyState = (): SawingFlowState => ({
  extraIssued: [],
  extraDone: [],
  extraHistory: [],
  extraRejected: [],
  hiddenIds: [],
  availableCbm: {},
  issuedAvailability: {},
});

function readState(): SawingFlowState {
  if (typeof window === "undefined") return emptyState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return migrateLegacyState();
    const parsed = JSON.parse(raw) as Partial<SawingFlowState>;
    return {
      extraIssued: Array.isArray(parsed.extraIssued) ? parsed.extraIssued : [],
      extraDone: Array.isArray(parsed.extraDone) ? parsed.extraDone : [],
      extraHistory: Array.isArray(parsed.extraHistory) ? parsed.extraHistory : [],
      extraRejected: Array.isArray(parsed.extraRejected) ? parsed.extraRejected : [],
      hiddenIds: Array.isArray(parsed.hiddenIds) ? parsed.hiddenIds.map(String) : [],
      availableCbm:
        parsed.availableCbm && typeof parsed.availableCbm === "object"
          ? parsed.availableCbm
          : {},
      issuedAvailability:
        parsed.issuedAvailability && typeof parsed.issuedAvailability === "object"
          ? parsed.issuedAvailability
          : {},
    };
  } catch {
    return emptyState();
  }
}

function migrateLegacyState(): SawingFlowState {
  const next = emptyState();
  try {
    const created = window.localStorage.getItem("sawing_done_created_items");
    if (created) {
      const items = JSON.parse(created);
      if (Array.isArray(items)) next.extraDone = items;
    }
  } catch {
    // ignore legacy parse errors
  }
  try {
    const cbm = window.localStorage.getItem("sawing_available_cbm_map");
    if (cbm) {
      const map = JSON.parse(cbm);
      if (map && typeof map === "object") next.availableCbm = map;
    }
  } catch {
    // ignore legacy parse errors
  }
  return next;
}

function writeState(next: SawingFlowState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

function text(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string") {
    const iso = value.match(/^\d{4}-\d{2}-\d{2}/);
    if (iso) return iso[0];
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()) && value.length > 10) {
      return parsed.toISOString().slice(0, 10);
    }
    return value.trim();
  }
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function presentRow(row: SawingFlowRow): SawingFlowRow {
  const subCategory = text(row.subCategory) || text(row.itemSubCategory) || "-";
  const issueDate = text(row.issueDate) || text(row.issuedDate);
  const sawingDate = text(row.sawingDate) || text(row.processDate);
  return {
    ...row,
    subCategory,
    itemSubCategory: subCategory,
    ...(issueDate ? { issueDate, issuedDate: issueDate } : {}),
    ...(sawingDate ? { sawingDate, processDate: sawingDate } : {}),
  };
}

function rowsForTab(state: SawingFlowState, tab: SawingFlowTab) {
  if (tab === "issued") return state.extraIssued;
  if (tab === "done") return state.extraDone;
  if (tab === "history") return state.extraHistory;
  return state.extraRejected;
}

export function getSawingAvailableCbm(key: string, fallback: number) {
  const state = readState();
  if (key in state.availableCbm) return Number(state.availableCbm[key] ?? fallback);
  return fallback;
}

export function listSawingFlowRows(
  tab: SawingFlowTab,
  definitionRows: readonly SawingFlowRow[],
) {
  const state = readState();
  const hidden = new Set(state.hiddenIds);
  const base = definitionRows.filter(
    (row) => row.listingState === tab && !hidden.has(String(row.id)),
  );
  const extra = rowsForTab(state, tab).filter((row) => !hidden.has(String(row.id)));
  let items = [...extra, ...base].map((row) => {
    if (tab !== "issued") return row;
    const keys = rowKeys(row);
    const patch = keys.map((key) => state.issuedAvailability[key]).find(Boolean);
    const availableKey = keys.find((key) => key in state.availableCbm);
    if (!patch && !availableKey) return row;
    return {
      ...row,
      ...(patch ?? {}),
      ...(availableKey ? { availableCbm: state.availableCbm[availableKey] } : {}),
      ...(patch?.height ? { height: patch.height } : {}),
    };
  });

  if (tab === "issued") {
    items = items.filter((row) => Number(row.availableCbm ?? row.receivedCbm ?? row.cbm ?? 0) > 0);
  }

  return items.map(presentRow);
}

export function searchSawingFlowRows(rows: readonly SawingFlowRow[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return [...rows];
  return rows.filter((row) =>
    Object.values(row).some((value) => text(value).toLowerCase().includes(query)),
  );
}

export function issueSawingFromStorageRows(rows: readonly SawingFlowRow[]) {
  const state = readState();
  const existingIds = new Set(state.extraIssued.map((row) => String(row.sourceStorageId || row.id)));
  const today = new Date().toISOString().slice(0, 10);
  const created = rows
    .filter((row) => !existingIds.has(String(row.id)))
    .map((row, index) => {
      const cbmValue = Number(
        String(row.cbm ?? row.availableUnits ?? row.receivedCbm ?? "").replace(/[^\d.]/g, ""),
      );
      const cbm = Number.isFinite(cbmValue) && cbmValue > 0 ? cbmValue : 1;
      const subCategory =
        text(row.subCategory) || text(row.itemSubCategory) || text(row.itemSubCategoryName) || "Veneer Block";
      return presentRow({
        id: `saw-issued-${Date.now()}-${index}`,
        sourceStorageId: row.id,
        storageSrNo: row.storageSrNo || "-",
        issueDate: today,
        issuedDate: today,
        itemName: row.itemName || "Veneer Block",
        subCategory,
        itemSubCategory: subCategory,
        batchNo: row.batchNo || row.logCode || row.logNo || "-",
        length: row.length || "-",
        width: row.width || "-",
        height: row.height || row.thickness || "-",
        receivedCbm: cbm,
        availableCbm: cbm,
        cbm,
        remark: row.remark || "-",
        createdBy: "Admin",
        updatedBy: "Admin",
        listingState: "issued",
        storageWarehouseName: row.storageWarehouseName || row.warehouseName || "Storage",
      });
    });

  if (created.length === 0) return created;
  writeState({ ...state, extraIssued: [...created, ...state.extraIssued] });
  return created;
}

function rowKeys(row: SawingFlowRow) {
  return [row.id, row.storageSrNo, row.sourceStorageId, row.sourceIssueId]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
}

function matchesIssuedRow(row: SawingFlowRow, keys: readonly string[]) {
  if (row.listingState && row.listingState !== "issued") return false;
  const aliases = new Set(rowKeys(row));
  return keys.some((key) => aliases.has(key));
}

export function updateSawingIssuedAvailability(
  key: string | readonly string[],
  patch: SawingIssuedAvailability,
) {
  const keys = (Array.isArray(key) ? key : [key])
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);
  if (keys.length === 0) return;
  const state = readState();
  const availableCbm = { ...state.availableCbm };
  const issuedAvailability = { ...state.issuedAvailability };
  keys.forEach((alias) => {
    if (patch.availableCbm !== undefined) availableCbm[alias] = patch.availableCbm;
    issuedAvailability[alias] = { ...issuedAvailability[alias], ...patch };
  });
  const nextPatch = {
    ...patch,
    ...(patch.height ? { height: patch.height } : {}),
  };
  writeState({
    ...state,
    availableCbm,
    issuedAvailability,
    extraIssued: state.extraIssued.map((row) =>
      matchesIssuedRow(row, keys) ? { ...row, ...nextPatch } : row,
    ),
  });

  (sawingDefinition.rows as unknown as SawingFlowRow[]).forEach((row) => {
    if (!matchesIssuedRow(row, keys)) return;
    Object.assign(row, nextPatch);
  });
}

export function addSawingDoneItems(items: readonly SawingFlowRow[], availableCbmPatch?: Record<string, number>) {
  const state = readState();
  writeState({
    ...state,
    extraDone: [...items.map(presentRow), ...state.extraDone],
    availableCbm: { ...state.availableCbm, ...(availableCbmPatch ?? {}) },
  });
}

export function hideSawingRows(ids: readonly string[]) {
  const state = readState();
  const hiddenIds = Array.from(new Set([...state.hiddenIds, ...ids.map(String)]));
  writeState({ ...state, hiddenIds });
}

export function recordSawingHistory(rows: readonly SawingFlowRow[]) {
  const state = readState();
  const today = new Date().toISOString().slice(0, 10);
  const history = rows.map((row, index) => ({
    ...presentRow(row),
    id: `saw-history-${Date.now()}-${index}`,
    listingState: "history",
    processDate: today,
  }));
  writeState({
    ...state,
    extraHistory: [...history, ...state.extraHistory],
    hiddenIds: Array.from(new Set([...state.hiddenIds, ...rows.map((row) => String(row.id))])),
  });
}

export function recordSawingRejection(row: SawingFlowRow, remark: string) {
  const state = readState();
  const rejected = presentRow({
    ...row,
    id: `saw-rejected-${Date.now()}`,
    listingState: "rejected",
    processDate: new Date().toISOString().slice(0, 10),
    remark: remark || "Rejected from sawing done",
    status: "Rejected",
  });
  writeState({
    ...state,
    extraRejected: [rejected, ...state.extraRejected],
    hiddenIds: Array.from(new Set([...state.hiddenIds, String(row.id)])),
  });
}

export function revertSawingFlowRow(tab: SawingFlowTab, row: SawingFlowRow) {
  const state = readState();
  const id = String(row.id);
  if (tab === "issued") {
    writeState({
      ...state,
      extraIssued: state.extraIssued.filter((item) => String(item.id) !== id),
      hiddenIds: Array.from(new Set([...state.hiddenIds, id])),
    });
    return;
  }

  if (tab === "done") {
    writeState({
      ...state,
      extraDone: state.extraDone.filter((item) => String(item.id) !== id),
      extraIssued: [
        presentRow({
          ...row,
          id: `saw-reissued-${Date.now()}`,
          listingState: "issued",
          availableCbm: row.cbm || row.receivedCbm || row.availableCbm || 1,
        }),
        ...state.extraIssued,
      ],
      hiddenIds: Array.from(new Set([...state.hiddenIds, id])),
    });
    return;
  }

  writeState({
    ...state,
    extraRejected: state.extraRejected.filter((item) => String(item.id) !== id),
    extraDone: [
      presentRow({
        ...row,
        id: `saw-restored-${Date.now()}`,
        listingState: "done",
      }),
      ...state.extraDone,
    ],
    hiddenIds: Array.from(new Set([...state.hiddenIds, id])),
  });
}
