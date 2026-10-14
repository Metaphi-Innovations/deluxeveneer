import { useSyncExternalStore } from "react";

const STORAGE_KEY = "deluxe-slicing-frontend-flow";

export type SlicingFlowRow = Record<string, unknown>;

export type SlicingIssuedPatch = {
  availableCbm: number;
  height: string;
  length: string;
  width: string;
};

type SlicingFlowState = {
  doneAvailableLeaves: Record<string, number>;
  extraDone: SlicingFlowRow[];
  hiddenDoneIds: string[];
  hiddenIssuedIds: string[];
  issuedPatches: Record<string, SlicingIssuedPatch>;
  rejectedDoneIds: string[];
};

const emptyState = (): SlicingFlowState => ({
  doneAvailableLeaves: {},
  extraDone: [],
  hiddenDoneIds: [],
  hiddenIssuedIds: [],
  issuedPatches: {},
  rejectedDoneIds: [],
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
      doneAvailableLeaves:
        parsed.doneAvailableLeaves && typeof parsed.doneAvailableLeaves === "object"
          ? parsed.doneAvailableLeaves
          : {},
      extraDone: Array.isArray(parsed.extraDone) ? parsed.extraDone : [],
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
      rejectedDoneIds: Array.isArray(parsed.rejectedDoneIds)
        ? parsed.rejectedDoneIds.map(String)
        : [],
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
        return patch ? ({ ...row, ...patch } as Row) : row;
      })
      .filter((row) => {
        if (isHiddenIssued(row, state.hiddenIssuedIds)) return false;
        const patch = findPatch(row, state.issuedPatches);
        return !patch || patch.availableCbm > 0.000001;
      });
  }

  if (tab === "done") {
    const hidden = new Set(state.hiddenDoneIds);
    const visibleRows = rows.filter((row) => !hidden.has(String(row.id)));
    const existingIds = new Set(visibleRows.map((row) => String(row.id)));
    const extras = state.extraDone.filter(
      (row) => !hidden.has(String(row.id)) && !existingIds.has(String(row.id)),
    ) as Row[];
    return [...extras, ...visibleRows].map((row) => {
      const received = Math.max(
        0,
        Number(row.receivedLeaves ?? row.noOfLeaves ?? row.noOfSheets ?? 0) || 0,
      );
      const patchedAvailable = rowAliases(row)
        .map((key) => state.doneAvailableLeaves[key])
        .find((value) => typeof value === "number");
      const available = Math.max(
        0,
        patchedAvailable ??
          (Number(row.availableLeaves ?? received) || 0),
      );
      return {
        ...row,
        receivedLeaves: String(received),
        availableLeaves: String(available),
      } as Row;
    });
  }

  return [...rows];
}

export function updateSlicingDoneAvailableLeaves(
  row: SlicingFlowRow,
  availableLeaves: number,
) {
  const state = readState();
  const nextAvailable = Math.max(0, Math.floor(availableLeaves));
  const doneAvailableLeaves = { ...state.doneAvailableLeaves };
  rowAliases(row).forEach((key) => {
    doneAvailableLeaves[key] = nextAvailable;
  });
  writeState({ ...state, doneAvailableLeaves });
}

function slicingLeafCount(value: unknown) {
  const parsed = Number(String(value ?? "").replace(/[^\d.]/g, ""));
  return Number.isFinite(parsed) ? Math.max(0, Math.floor(parsed)) : 0;
}

function slicingReceivedLeaves(row: SlicingFlowRow) {
  return slicingLeafCount(row.receivedLeaves ?? row.noOfLeaves ?? row.noOfSheets);
}

function slicingAvailableLeaves(row: SlicingFlowRow, state: SlicingFlowState) {
  const patched = rowAliases(row)
    .map((key) => state.doneAvailableLeaves[key])
    .find((value) => typeof value === "number");
  if (typeof patched === "number") return Math.max(0, Math.floor(patched));
  return slicingLeafCount(row.availableLeaves ?? slicingReceivedLeaves(row));
}

export function markSlicingDoneRejected(row: SlicingFlowRow) {
  const state = readState();
  const rejectedDoneIds = Array.from(new Set([...state.rejectedDoneIds, ...rowAliases(row)]));
  writeState({ ...state, rejectedDoneIds });
}

export function clearSlicingDoneRejected(row: SlicingFlowRow) {
  const state = readState();
  const aliases = new Set(rowAliases(row));
  writeState({
    ...state,
    rejectedDoneIds: state.rejectedDoneIds.filter((id) => !aliases.has(id)),
  });
}

export function restoreSlicingDoneLeaves(sourceDoneId: string, leaves: number) {
  if (!sourceDoneId || leaves <= 0) return;
  const state = readState();
  const row = state.extraDone.find((item) => String(item.id) === sourceDoneId);
  const keys = row ? rowAliases(row) : [sourceDoneId];
  const received = row ? slicingReceivedLeaves(row) : 0;
  const current = keys
    .map((key) => state.doneAvailableLeaves[key])
    .find((value) => typeof value === "number");
  const base = typeof current === "number" ? current : received;
  const next = received > 0 ? Math.min(received, base + leaves) : base + leaves;
  const doneAvailableLeaves = { ...state.doneAvailableLeaves };
  keys.forEach((key) => {
    doneAvailableLeaves[key] = next;
  });
  writeState({ ...state, doneAvailableLeaves });
}

export function getSlicingDoneEditBlockReason(
  selected: SlicingFlowRow,
  definitionRows: readonly SlicingFlowRow[] = [],
) {
  const state = readState();
  const group = new Map<string, SlicingFlowRow>();
  [...definitionRows, ...state.extraDone, selected].forEach((row) => {
    if (!sameSlicingCreation(row, selected)) return;
    group.set(String(row.id), row);
  });

  const forwarded = [...group.values()].some((row) => {
    const received = slicingReceivedLeaves(row);
    return received > 0 && slicingAvailableLeaves(row, state) < received;
  });
  const rejected = [...group.values()].some((row) =>
    rowAliases(row).some((key) => state.rejectedDoneIds.includes(key)),
  );

  if (forwarded && rejected) {
    return "Edit is unavailable because an item from this slicing entry was forwarded to Drying and an item was rejected.";
  }
  if (forwarded) {
    return "Edit is unavailable because an item from this slicing entry was forwarded to Drying.";
  }
  if (rejected) {
    return "Edit is unavailable because an item from this slicing entry was rejected.";
  }
  return "";
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

function text(value: unknown) {
  return value === undefined || value === null ? "" : String(value).trim();
}

function sameSlicingCreation(candidate: SlicingFlowRow, selected: SlicingFlowRow) {
  const groupingKeys = ["processRunId", "sourceIssueId", "issueId", "storageSrNo"];
  const groupKey = groupingKeys.find((key) => text(selected[key]));
  return groupKey
    ? text(candidate[groupKey]) === text(selected[groupKey])
    : text(candidate.id) === text(selected.id);
}

export function listSlicingDoneRows(definitionRows: readonly SlicingFlowRow[]) {
  const doneRows = definitionRows.filter((row) => row.listingState === "done");
  return applySlicingListingRows(doneRows, "done");
}

export function getSlicingEditContext(
  selected: SlicingFlowRow,
  definitionRows: readonly SlicingFlowRow[],
) {
  const state = readState();
  const allDoneRows = listSlicingDoneRows(definitionRows);
  const matchedRows = allDoneRows.filter((row) => sameSlicingCreation(row, selected));
  const rows = matchedRows.length > 0 ? matchedRows : [selected];
  const aliases = rowAliases(selected);
  const issuedPatch = aliases.map((key) => state.issuedPatches[key]).find(Boolean);
  const processedCbm = rows.reduce(
    (total, row) => total + (Number(row.cbm) || 0),
    0,
  );
  const remainingCbm = Math.max(0, Number(issuedPatch?.availableCbm ?? 0) || 0);
  const recordedCbm = Math.max(
    Number(selected.receivedCbm) || 0,
    Number(selected.sourceCbm) || 0,
  );
  const sourceCbm =
    recordedCbm > 0
      ? Math.max(recordedCbm, processedCbm)
      : Math.max(processedCbm + remainingCbm, processedCbm);
  const length = issuedPatch?.length ?? text(selected.sourceLength || selected.length);
  const width = issuedPatch?.width ?? text(selected.sourceWidth || selected.width);
  const numericLength = Number(length) || 0;
  const numericWidth = Number(width) || 0;
  const derivedHeight =
    numericLength > 0 && numericWidth > 0
      ? sourceCbm / (numericLength * numericWidth)
      : 0;
  const fallbackHeight = text(selected.sourceHeight || selected.height || selected.thickness);
  const height = issuedPatch?.height ?? (derivedHeight > 0 ? String(derivedHeight) : fallbackHeight);

  return {
    rows,
    sourceRow: {
      ...selected,
      id: selected.sourceIssueId || selected.issueId || selected.id,
      length,
      width,
      height,
      thickness: height,
      sourceCbm,
      receivedCbm: sourceCbm,
      availableCbm: sourceCbm,
      cbm: sourceCbm,
    },
  };
}

export function replaceSlicingDoneItems(
  originalItems: readonly SlicingFlowRow[],
  replacementItems: readonly SlicingFlowRow[],
) {
  const state = readState();
  const originalIds = new Set(originalItems.map((row) => String(row.id)));
  const doneAvailableLeaves = { ...state.doneAvailableLeaves };
  replacementItems.forEach((row) => {
    const available = Math.max(
      0,
      Math.floor(Number(row.availableLeaves ?? row.noOfLeaves ?? 0) || 0),
    );
    rowAliases(row).forEach((key) => {
      doneAvailableLeaves[key] = available;
    });
  });

  writeState({
    ...state,
    doneAvailableLeaves,
    extraDone: [
      ...replacementItems,
      ...state.extraDone.filter((row) => !originalIds.has(String(row.id))),
    ],
    hiddenDoneIds: Array.from(new Set([...state.hiddenDoneIds, ...originalIds])),
  });
}
