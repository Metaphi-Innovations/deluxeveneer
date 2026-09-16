import { useSyncExternalStore } from "react";

import type { FactoryProcessRunRecord } from "./factoryQuantityAllocation";
import { sumProcessRuns } from "./factoryQuantityAllocation";

const STORAGE_KEY = "deluxe-veneers-factory-process-runs";

type FactoryProcessRunStore = Record<string, FactoryProcessRunRecord[]>;

let memoryStore: FactoryProcessRunStore | null = null;
const listeners = new Set<() => void>();

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStore(): FactoryProcessRunStore {
  if (memoryStore) {
    return memoryStore;
  }

  const storage = getLocalStorage();
  if (!storage) {
    memoryStore = {};
    return memoryStore;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryStore = {};
    return memoryStore;
  }

  try {
    const parsed = JSON.parse(raw) as FactoryProcessRunStore;
    memoryStore =
      parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    memoryStore = {};
  }

  return memoryStore;
}

function writeStore(next: FactoryProcessRunStore) {
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

export function getFactoryProcessRuns(sourceKey: string): FactoryProcessRunRecord[] {
  const store = readStore();
  return store[sourceKey] ? [...store[sourceKey]] : [];
}

export function getFactoryProcessRunTotals(sourceKey: string) {
  return sumProcessRuns(getFactoryProcessRuns(sourceKey));
}

export function appendFactoryProcessRun(
  run: Omit<FactoryProcessRunRecord, "id" | "createdAt"> & {
    createdAt?: string;
  },
): FactoryProcessRunRecord {
  const store = readStore();
  const existing = store[run.sourceKey] ?? [];
  const nextRun: FactoryProcessRunRecord = {
    ...run,
    id: `factory-run-${Date.now()}-${existing.length + 1}`,
    createdAt: run.createdAt ?? new Date().toISOString(),
  };

  writeStore({
    ...store,
    [run.sourceKey]: [...existing, nextRun],
  });

  return nextRun;
}

export function useFactoryProcessRuns(sourceKey: string) {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return store[sourceKey] ? [...store[sourceKey]] : [];
}

export function useFactoryProcessRunTotals(sourceKey: string) {
  const runs = useFactoryProcessRuns(sourceKey);
  return sumProcessRuns(runs);
}
