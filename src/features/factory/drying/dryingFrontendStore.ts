import { useSyncExternalStore } from "react";

import { SQM_TO_SQF } from "../../shared/numberFormat";
import {
  calculateSlicingSqmValue,
  formatSlicingDecimal,
} from "../shared/slicingAreaCalculation";

const STORAGE_KEY = "deluxe-drying-frontend-flow";

export type DryingFlowRow = Record<string, unknown>;

export type DryingIssuedPatch = {
  availableLeaves: string;
  /** Older saves stored the remaining count on noOfLeaves. */
  noOfLeaves?: string;
};

type DryingFlowState = {
  extraDone: DryingFlowRow[];
  hiddenIssuedIds: string[];
  issuedPatches: Record<string, DryingIssuedPatch>;
};

const emptyState = (): DryingFlowState => ({
  extraDone: [],
  hiddenIssuedIds: [],
  issuedPatches: {},
});

let memoryState: DryingFlowState | null = null;
const listeners = new Set<() => void>();

function readState(): DryingFlowState {
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
    const parsed = JSON.parse(raw) as Partial<DryingFlowState>;
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

function writeState(next: DryingFlowState) {
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

export function useDryingFlowState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function rowAliases(row: DryingFlowRow) {
  return [row.id, row.workItemId, row.storageSrNo, row.sourceStorageId, row.sourceRowId]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .map(String);
}

function findPatch(row: DryingFlowRow, patches: Record<string, DryingIssuedPatch>) {
  for (const key of rowAliases(row)) {
    const patch = patches[key];
    if (patch) return patch;
  }
  return undefined;
}

function isHiddenIssued(row: DryingFlowRow, hiddenIds: readonly string[]) {
  if (hiddenIds.length === 0) return false;
  const hidden = new Set(hiddenIds);
  return rowAliases(row).some((key) => hidden.has(key));
}

function numericLeafCount(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function dryingReceivedLeafCount(row: DryingFlowRow | null | undefined) {
  return numericLeafCount(row?.noOfLeaves ?? row?.totalLeaves ?? row?.noOfSheets);
}

export function dryingLeafCount(row: DryingFlowRow | null | undefined) {
  const available = row?.availableLeaves;
  if (available !== undefined && available !== null && String(available).trim() !== "") {
    return numericLeafCount(available);
  }
  return dryingReceivedLeafCount(row);
}

function patchAvailableLeaves(patch: DryingIssuedPatch | undefined) {
  if (!patch) return undefined;
  const raw = patch.availableLeaves ?? patch.noOfLeaves;
  if (raw === undefined || raw === null || String(raw).trim() === "") return undefined;
  return numericLeafCount(raw);
}

export function dryingLeafArea(length: unknown, width: unknown, leaves: number) {
  const sqm = calculateSlicingSqmValue(length, width, leaves);
  return {
    sqf: sqm > 0 ? formatSlicingDecimal(sqm * SQM_TO_SQF, 3) : "0",
    sqm: sqm > 0 ? formatSlicingDecimal(sqm, 3) : "0",
  };
}

export function applyDryingListingRows<Row extends DryingFlowRow>(
  rows: readonly Row[],
  tab: string,
  state: DryingFlowState = readState(),
): Row[] {
  if (tab === "issued") {
    return rows
      .map((row) => {
        const patch = findPatch(row, state.issuedPatches);
        const available = patchAvailableLeaves(patch) ?? dryingReceivedLeafCount(row);
        return { ...row, availableLeaves: String(available) } as Row;
      })
      .filter((row) => {
        if (isHiddenIssued(row, state.hiddenIssuedIds)) return false;
        return dryingLeafCount(row) > 0;
      });
  }

  if (tab === "done") {
    const existingIds = new Set(rows.map((row) => String(row.id)));
    const extras = state.extraDone.filter((row) => !existingIds.has(String(row.id))) as Row[];
    return [...extras, ...rows];
  }

  return [...rows];
}

export function updateDryingIssuedLeaves(keys: readonly string[], patch: DryingIssuedPatch) {
  const aliases = Array.from(new Set(keys.map(String).filter(Boolean)));
  if (aliases.length === 0) return;

  const state = readState();
  const issuedPatches = { ...state.issuedPatches };
  aliases.forEach((key) => {
    issuedPatches[key] = patch;
  });

  const depleted = numericLeafCount(patch.availableLeaves) <= 0;
  const hiddenIssuedIds = depleted
    ? Array.from(new Set([...state.hiddenIssuedIds, ...aliases]))
    : state.hiddenIssuedIds.filter((id) => !aliases.includes(id));

  writeState({
    ...state,
    issuedPatches,
    hiddenIssuedIds,
  });
}

export function addDryingDoneItems(items: readonly DryingFlowRow[]) {
  if (items.length === 0) return;
  const state = readState();
  writeState({
    ...state,
    extraDone: [...items, ...state.extraDone],
  });
}

/** Updates a created drying-done row. Removes it when no leaves remain. Returns false when the row is not in this store. */
export function adjustDryingDoneLeaves(
  id: string,
  remainingLeaves: number,
  area: { sqf: string; sqm: string },
  extra?: { issueForInspection?: string; status?: string },
) {
  const state = readState();
  const rowId = String(id);
  if (!state.extraDone.some((row) => String(row.id) === rowId)) return false;

  const extraDone =
    remainingLeaves <= 0
      ? state.extraDone.filter((row) => String(row.id) !== rowId)
      : state.extraDone.map((row) =>
          String(row.id) === rowId
            ? {
                ...row,
                availableLeaves: String(remainingLeaves),
                sqf: area.sqf,
                sqm: area.sqm,
                totalSqMeter: area.sqm,
                ...(extra?.issueForInspection ? { issueForInspection: extra.issueForInspection } : {}),
                ...(extra?.status ? { status: extra.status } : {}),
              }
            : row,
        );

  writeState({ ...state, extraDone });
  return true;
}

export function revertDryingDoneToIssued(row: DryingFlowRow) {
  const state = readState();
  const doneId = String(row.id ?? "");
  if (!state.extraDone.some((item) => String(item.id) === doneId)) return false;

  const leaves = numericLeafCount(row.noOfLeaves ?? row.availableLeaves);
  const keys = Array.from(
    new Set(
      [row.sourceIssuedId, row.workItemId, row.storageSrNo, row.sourceStorageId, row.sourceRowId]
        .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
        .map(String),
    ),
  );
  const issuedPatches = { ...state.issuedPatches };
  const existing = keys.map((key) => issuedPatches[key]).find((patch) => patch !== undefined);

  if (existing && leaves > 0) {
    const nextAvailable =
      numericLeafCount(existing.availableLeaves ?? existing.noOfLeaves) + leaves;
    const nextPatch: DryingIssuedPatch = { availableLeaves: String(nextAvailable) };
    keys.forEach((key) => {
      issuedPatches[key] = nextPatch;
    });
  }

  const hiddenIssuedIds = state.hiddenIssuedIds.filter((id) => {
    if (!keys.includes(id)) return true;
    return numericLeafCount(issuedPatches[id]?.availableLeaves ?? issuedPatches[id]?.noOfLeaves) <= 0;
  });

  writeState({
    ...state,
    extraDone: state.extraDone.filter((item) => String(item.id) !== doneId),
    issuedPatches,
    hiddenIssuedIds,
  });
  return true;
}
