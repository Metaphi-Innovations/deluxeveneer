import { useSyncExternalStore } from "react";

import { SQM_TO_SQF } from "../../shared/numberFormat";
import { availableFactoryMeasures } from "../shared/factoryAvailableMeasures";
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
  forwardedLeavesByDoneId: Record<string, number>;
  hiddenDoneIds: string[];
  hiddenIssuedIds: string[];
  issuedPatches: Record<string, DryingIssuedPatch>;
  rejectedDone: DryingFlowRow[];
};

const emptyState = (): DryingFlowState => ({
  extraDone: [],
  forwardedLeavesByDoneId: {},
  hiddenDoneIds: [],
  hiddenIssuedIds: [],
  issuedPatches: {},
  rejectedDone: [],
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
      forwardedLeavesByDoneId:
        parsed.forwardedLeavesByDoneId && typeof parsed.forwardedLeavesByDoneId === "object"
          ? parsed.forwardedLeavesByDoneId
          : {},
      hiddenDoneIds: Array.isArray(parsed.hiddenDoneIds)
        ? parsed.hiddenDoneIds.map(String)
        : [],
      hiddenIssuedIds: Array.isArray(parsed.hiddenIssuedIds)
        ? parsed.hiddenIssuedIds.map(String)
        : [],
      issuedPatches:
        parsed.issuedPatches && typeof parsed.issuedPatches === "object"
          ? parsed.issuedPatches
          : {},
      rejectedDone: Array.isArray(parsed.rejectedDone) ? parsed.rejectedDone : [],
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
  return [row.id, row.sourceIssuedId, row.workItemId, row.storageSrNo, row.sourceStorageId, row.sourceRowId]
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
        const received = dryingReceivedLeafCount(row);
        const available = patchAvailableLeaves(patch) ?? received;
        return {
          ...row,
          availableLeaves: String(available),
          ...availableFactoryMeasures(row, received, available),
        } as Row;
      })
      .filter((row) => {
        if (isHiddenIssued(row, state.hiddenIssuedIds)) return false;
        return dryingLeafCount(row) > 0;
      });
  }

  if (tab === "done") {
    const hidden = new Set(state.hiddenDoneIds);
    const visibleRows = rows.filter((row) => !hidden.has(String(row.id)));
    const existingIds = new Set(visibleRows.map((row) => String(row.id)));
    const extras = state.extraDone.filter((row) => !existingIds.has(String(row.id))) as Row[];
    return [...extras, ...visibleRows];
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

export function getDryingEditLimits(row: DryingFlowRow | null | undefined) {
  if (!row) return { inspectedLeaves: 0, maximumLeaves: 0, minimumLeaves: 1 };
  const state = readState();
  const currentLeaves = dryingReceivedLeafCount(row);
  const availableDoneLeaves = dryingLeafCount(row);
  const inspectedLeaves = Math.max(0, currentLeaves - availableDoneLeaves);
  const issuedPatch = findPatch(row, state.issuedPatches);
  const sourceAvailableLeaves = patchAvailableLeaves(issuedPatch) ?? 0;
  return {
    inspectedLeaves,
    maximumLeaves: currentLeaves + sourceAvailableLeaves,
    minimumLeaves: Math.max(1, inspectedLeaves),
  };
}

export function updateDryingDoneItem(
  row: DryingFlowRow,
  entry: { driedLeaves: number; dryingDate: string; remark: string },
) {
  const state = readState();
  const rowId = String(row.id);
  const currentLeaves = dryingReceivedLeafCount(row);
  const currentAvailableLeaves = dryingLeafCount(row);
  const inspectedLeaves = Math.max(0, currentLeaves - currentAvailableLeaves);
  const nextAvailableLeaves = Math.max(0, entry.driedLeaves - inspectedLeaves);
  const area = dryingLeafArea(row.length, row.width, nextAvailableLeaves);
  const aliases = rowAliases(row);
  const currentSourceAvailable =
    patchAvailableLeaves(aliases.map((key) => state.issuedPatches[key]).find(Boolean)) ?? 0;
  const nextSourceAvailable = Math.max(
    0,
    currentSourceAvailable + currentLeaves - entry.driedLeaves,
  );
  const issuedPatches = { ...state.issuedPatches };
  const nextPatch: DryingIssuedPatch = {
    availableLeaves: String(nextSourceAvailable),
  };
  aliases.forEach((key) => {
    issuedPatches[key] = nextPatch;
  });
  const replacement = {
    ...row,
    dryingDate: entry.dryingDate,
    issueDate: entry.dryingDate,
    noOfLeaves: String(entry.driedLeaves),
    receivedLeaves: String(entry.driedLeaves),
    availableLeaves: String(nextAvailableLeaves),
    sqm: area.sqm,
    sqf: area.sqf,
    totalSqMeter: area.sqm,
    remark: entry.remark,
    updatedBy: "Admin",
  };
  const storedRow = state.extraDone.some((item) => String(item.id) === rowId);
  const replacementRow = storedRow
    ? replacement
    : { ...replacement, id: `drying-edit-${Date.now()}` };

  writeState({
    ...state,
    extraDone: storedRow
      ? state.extraDone.map((item) => String(item.id) === rowId ? replacementRow : item)
      : [replacementRow, ...state.extraDone],
    hiddenDoneIds: storedRow
      ? state.hiddenDoneIds
      : Array.from(new Set([...state.hiddenDoneIds, rowId])),
    hiddenIssuedIds:
      nextSourceAvailable <= 0
        ? Array.from(new Set([...state.hiddenIssuedIds, ...aliases]))
        : state.hiddenIssuedIds.filter((id) => !aliases.includes(id)),
    issuedPatches,
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

function dryingText(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function dryingGroupKey(row: DryingFlowRow) {
  return (
    dryingText(row.processRunId) ||
    dryingText(row.sourceIssuedId) ||
    dryingText(row.sourceIssueId) ||
    dryingText(row.id)
  );
}

function sameDryingEntry(candidate: DryingFlowRow, selected: DryingFlowRow) {
  const selectedKey = dryingGroupKey(selected);
  const candidateKey = dryingGroupKey(candidate);
  if (selectedKey && candidateKey && selectedKey === candidateKey) return true;
  const selectedId = dryingText(selected.id);
  const candidateId = dryingText(candidate.id);
  return (
    (dryingText(candidate.sourceDoneId) !== "" && dryingText(candidate.sourceDoneId) === selectedId) ||
    (dryingText(selected.sourceDoneId) !== "" && dryingText(selected.sourceDoneId) === candidateId)
  );
}

export function recordDryingInspectionIssue(doneId: string, leaves: number) {
  if (!doneId || leaves <= 0) return;
  const state = readState();
  const current = state.forwardedLeavesByDoneId[doneId] ?? 0;
  writeState({
    ...state,
    forwardedLeavesByDoneId: {
      ...state.forwardedLeavesByDoneId,
      [doneId]: current + leaves,
    },
  });
}

export function releaseDryingInspectionIssue(doneId: string, leaves: number) {
  if (!doneId || leaves <= 0) return;
  const state = readState();
  const next = Math.max(0, (state.forwardedLeavesByDoneId[doneId] ?? 0) - leaves);
  const forwardedLeavesByDoneId = { ...state.forwardedLeavesByDoneId };
  if (next <= 0) delete forwardedLeavesByDoneId[doneId];
  else forwardedLeavesByDoneId[doneId] = next;
  writeState({ ...state, forwardedLeavesByDoneId });
}

export function restoreDryingDoneLeaves(
  sourceDoneId: string,
  leaves: number,
  snapshot?: DryingFlowRow,
) {
  if (!sourceDoneId || leaves <= 0) return;
  const state = readState();
  const existing = state.extraDone.find((item) => String(item.id) === sourceDoneId);
  if (existing) {
    const nextAvailable = dryingLeafCount(existing) + leaves;
    const nextReceived = Math.max(
      numericLeafCount(existing.noOfLeaves ?? existing.receivedLeaves),
      nextAvailable,
    );
    const area = dryingLeafArea(existing.length, existing.width, nextAvailable);
    writeState({
      ...state,
      extraDone: state.extraDone.map((item) =>
        String(item.id) === sourceDoneId
          ? {
              ...item,
              listingState: "done",
              noOfLeaves: String(nextReceived),
              receivedLeaves: String(nextReceived),
              availableLeaves: String(nextAvailable),
              sqm: area.sqm,
              sqf: area.sqf,
              totalSqMeter: area.sqm,
            }
          : item,
      ),
      hiddenDoneIds: state.hiddenDoneIds.filter((id) => id !== sourceDoneId),
    });
    return;
  }

  const source = snapshot ?? {};
  const area = dryingLeafArea(source.length, source.width, leaves);
  writeState({
    ...state,
    extraDone: [
      {
        ...source,
        id: sourceDoneId,
        listingState: "done",
        noOfLeaves: String(leaves),
        receivedLeaves: String(leaves),
        availableLeaves: String(leaves),
        sqm: area.sqm,
        sqf: area.sqf,
        totalSqMeter: area.sqm,
      },
      ...state.extraDone,
    ],
    hiddenDoneIds: state.hiddenDoneIds.filter((id) => id !== sourceDoneId),
  });
}

export function markDryingDoneRejected(row: DryingFlowRow) {
  const state = readState();
  writeState({
    ...state,
    rejectedDone: [row, ...state.rejectedDone.filter((item) => String(item.id) !== String(row.id))],
  });
}

export function clearDryingDoneRejected(rejectedId: string) {
  const state = readState();
  const rejected = state.rejectedDone.find((row) => String(row.id) === rejectedId);
  if (!rejected) return;
  const sourceDoneId = dryingText(rejected.sourceDoneId);
  const leaves = numericLeafCount(rejected.noOfLeaves ?? rejected.availableLeaves);
  writeState({
    ...state,
    rejectedDone: state.rejectedDone.filter((row) => String(row.id) !== rejectedId),
  });
  if (sourceDoneId && leaves > 0) {
    restoreDryingDoneLeaves(sourceDoneId, leaves, { ...rejected, id: sourceDoneId });
  }
}

export function findDryingDoneRow(
  id: string,
  definitionRows: readonly DryingFlowRow[] = [],
) {
  const state = readState();
  return [...state.extraDone, ...definitionRows].find((row) => String(row.id) === id);
}

export function getDryingDoneEditBlockReason(
  selected: DryingFlowRow,
  definitionRows: readonly DryingFlowRow[] = [],
) {
  const state = readState();
  const group = [...definitionRows, ...state.extraDone, ...state.rejectedDone, selected].filter(
    (row) => sameDryingEntry(row, selected),
  );
  const forwarded = group.some((row) => {
    const doneId = dryingText(row.sourceDoneId) || dryingText(row.id);
    return (state.forwardedLeavesByDoneId[doneId] ?? 0) > 0;
  });
  const rejected = state.rejectedDone.some((row) => sameDryingEntry(row, selected));

  if (forwarded && rejected) {
    return "Edit is unavailable because an item from this drying entry was forwarded to Drying Inspection and an item was rejected.";
  }
  if (forwarded) {
    return "Edit is unavailable because an item from this drying entry was forwarded to Drying Inspection.";
  }
  if (rejected) {
    return "Edit is unavailable because an item from this drying entry was rejected.";
  }
  return "";
}
