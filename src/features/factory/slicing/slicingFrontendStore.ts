import { useSyncExternalStore } from "react";

import { calculateSqmFromCbm, formatSlicingDecimal } from "../shared/slicingAreaCalculation";

const STORAGE_KEY = "deluxe-slicing-frontend-flow";

export type SlicingFlowRow = Record<string, unknown>;

export type SlicingIssuedPatch = {
  availableCbm: number;
  height: string;
  length: string;
  width: string;
};

type SlicingFlowState = {
  extraDone: SlicingFlowRow[];
  hiddenIssuedIds: string[];
  issuedPatches: Record<string, SlicingIssuedPatch>;
};

const emptyState = (): SlicingFlowState => ({
  extraDone: [],
  hiddenIssuedIds: [],
  issuedPatches: {},
});

let memoryState: SlicingFlowState | null = null;
const listeners = new Set<() => void>();

function readState(): SlicingFlowState {
  if (memoryState) return memoryState;

  if (typeof window === "undefined") {
    memoryState = emptyState();
    return memoryState;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryState = emptyState();
    return memoryState;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SlicingFlowState>;
    memoryState = {
      extraDone: Array.isArray(parsed.extraDone) ? parsed.extraDone : [],
      hiddenIssuedIds: Array.isArray(parsed.hiddenIssuedIds)
        ? parsed.hiddenIssuedIds.map(String)
        : [],
      issuedPatches:
        parsed.issuedPatches && typeof parsed.issuedPatches === "object"
          ? parsed.issuedPatches
          : {},
    };
  } catch {
    memoryState = emptyState();
  }

  return memoryState;
}

function writeState(next: SlicingFlowState) {
  memoryState = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return readState();
}

export function useSlicingFlowState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function rowAliases(row: SlicingFlowRow) {
  return [row.id, row.workItemId, row.storageSrNo, row.sourceStorageId, row.sourceRowId]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(String);
}

function findPatch(row: SlicingFlowRow, patches: Record<string, SlicingIssuedPatch>) {
  for (const key of rowAliases(row)) {
    const patch = patches[key];
    if (patch) return patch;
  }
  return undefined;
}

function isHiddenIssued(row: SlicingFlowRow, hiddenIds: readonly string[]) {
  if (hiddenIds.length === 0) return false;
  const hidden = new Set(hiddenIds);
  return rowAliases(row).some((key) => hidden.has(key));
}

export function applySlicingListingRows<Row extends SlicingFlowRow>(
  rows: readonly Row[],
  tab: string,
  state: SlicingFlowState = readState(),
): Row[] {
  if (tab === "issued") {
    return rows
      .map((row) => {
        const patch = findPatch(row, state.issuedPatches);
        const next = patch ? ({ ...row, ...patch } as Row) : row;
        const availableCbm = Number(String(next.availableCbm ?? "").replace(/[^\d.]/g, ""));
        const depth = next.height || next.thickness;
        const sqm = calculateSqmFromCbm(
          Number.isFinite(availableCbm) ? availableCbm : 0,
          depth,
        );
        return {
          ...next,
          availableSqm: sqm > 0 ? formatSlicingDecimal(sqm, 3) : "",
        };
      })
      .filter((row) => {
        if (isHiddenIssued(row, state.hiddenIssuedIds)) return false;
        const patch = findPatch(row, state.issuedPatches);
        return !patch || patch.availableCbm > 0.000001;
      });
  }

  if (tab === "done") {
    const existingIds = new Set(rows.map((row) => String(row.id)));
    const extras = state.extraDone.filter((row) => !existingIds.has(String(row.id))) as Row[];
    return [...extras, ...rows];
  }

  return [...rows];
}

export function updateSlicingIssuedAvailability(
  keys: readonly string[],
  patch: SlicingIssuedPatch,
) {
  const aliases = Array.from(new Set(keys.map(String).filter(Boolean)));
  if (aliases.length === 0) return;

  const state = readState();
  const issuedPatches = { ...state.issuedPatches };
  aliases.forEach((key) => {
    issuedPatches[key] = patch;
  });

  const depleted = patch.availableCbm <= 0.000001;
  const hiddenIssuedIds = depleted
    ? Array.from(new Set([...state.hiddenIssuedIds, ...aliases]))
    : state.hiddenIssuedIds.filter((id) => !aliases.includes(id));

  writeState({
    ...state,
    issuedPatches,
    hiddenIssuedIds,
  });
}

export function addSlicingDoneItems(items: readonly SlicingFlowRow[]) {
  if (items.length === 0) return;
  const state = readState();
  writeState({
    ...state,
    extraDone: [...items, ...state.extraDone],
  });
}
