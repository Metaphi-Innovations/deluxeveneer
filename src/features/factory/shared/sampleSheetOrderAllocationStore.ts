import { useSyncExternalStore } from "react";

import type { FactoryRecord } from "./types";

const STORAGE_KEY = "deluxe-veneers-sample-sheet-order-allocations";

export type SampleSheetOrderAllocation = {
  allocatedSheets: number;
  createdAt: string;
  id: string;
  orderItemNo: string;
  orderNo: string;
  sampleSheetRowId: string;
  sampleProcessType: string;
};

type SampleSheetOrderAllocationStore = {
  allocations: SampleSheetOrderAllocation[];
};

let memoryStore: SampleSheetOrderAllocationStore | null = null;
const listeners = new Set<() => void>();

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStore(): SampleSheetOrderAllocationStore {
  if (memoryStore) {
    return memoryStore;
  }

  const storage = getLocalStorage();
  if (!storage) {
    memoryStore = { allocations: [] };
    return memoryStore;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryStore = { allocations: [] };
    return memoryStore;
  }

  try {
    const parsed = JSON.parse(raw) as SampleSheetOrderAllocationStore;
    memoryStore =
      parsed && Array.isArray(parsed.allocations)
        ? { allocations: parsed.allocations }
        : { allocations: [] };
  } catch {
    memoryStore = { allocations: [] };
  }

  return memoryStore;
}

function writeStore(next: SampleSheetOrderAllocationStore) {
  memoryStore = next;
  const storage = getLocalStorage();
  if (storage) {
    storage.setItem(STORAGE_KEY, JSON.stringify(next));
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
  return readStore();
}

export function getSampleSheetOrderAllocations() {
  return [...readStore().allocations];
}

export function getSampleSheetAllocationsForRow(sampleSheetRowId: string) {
  return getSampleSheetOrderAllocations().filter(
    (allocation) => allocation.sampleSheetRowId === sampleSheetRowId,
  );
}

export function getAllocatedSampleSheetSheetsTotal(sampleSheetRowId: string) {
  return getSampleSheetAllocationsForRow(sampleSheetRowId).reduce(
    (total, allocation) => total + allocation.allocatedSheets,
    0,
  );
}

export function getOriginalSampleSheetSheets(row: FactoryRecord) {
  return getFactoryRowSheetValue(row, [
    "originalSheets",
    "sampleSheets",
    "noOfSheets",
    "outputNoOfSheets",
    "issuedNoOfSheets",
    "totalNoOfSheets",
  ]);
}

export function getAvailableSampleSheetSheets(row: FactoryRecord) {
  const original = getOriginalSampleSheetSheets(row);
  const allocated = getAllocatedSampleSheetSheetsTotal(String(row.id));
  return Math.max(0, original - allocated);
}

export function appendSampleSheetOrderAllocation(input: {
  allocatedSheets: number;
  orderItemNo: string;
  orderNo: string;
  sampleProcessType: string;
  sampleSheetRowId: string;
}): SampleSheetOrderAllocation {
  const store = readStore();
  const nextAllocation: SampleSheetOrderAllocation = {
    id: `sample-order-alloc-${Date.now()}-${store.allocations.length + 1}`,
    sampleSheetRowId: input.sampleSheetRowId,
    orderNo: input.orderNo,
    orderItemNo: input.orderItemNo,
    allocatedSheets: input.allocatedSheets,
    sampleProcessType: input.sampleProcessType,
    createdAt: new Date().toISOString(),
  };

  writeStore({
    allocations: [nextAllocation, ...store.allocations],
  });

  return nextAllocation;
}

export function useSampleSheetOrderAllocations() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [...store.allocations];
}

function getFactoryRowSheetValue(row: FactoryRecord, keys: readonly string[]) {
  for (const key of keys) {
    const raw = row[key];
    if (typeof raw === "number" && Number.isFinite(raw)) {
      return Math.max(0, Math.floor(raw));
    }

    if (typeof raw === "string" && raw.trim()) {
      const parsed = Number(raw.replace(/[^\d.]/g, ""));
      if (Number.isFinite(parsed)) {
        return Math.max(0, Math.floor(parsed));
      }
    }
  }

  return 0;
}
