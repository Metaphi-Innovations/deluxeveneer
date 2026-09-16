import { useSyncExternalStore } from "react";

import type { FactoryProcessTab } from "./factoryUtils";
import type { FactoryRecord } from "./types";

const STORAGE_KEY = "deluxe-veneers-factory-issued-work";

export type FactoryWorkPurpose = "ORDER" | "SAMPLE";

export type FactoryIssuedWorkRecord = {
  completedAt?: string;
  createdAt: string;
  destinationSlug: string;
  id: string;
  listingState: "issued" | "done" | "moved";
  movedAt?: string;
  orderItemNo?: string;
  orderNo?: string;
  purpose: FactoryWorkPurpose;
  sampleNo?: string;
  sourceRowId: string;
  sourceSlug: string;
  sourceProcess?: string;
  sourceSnapshot: Record<string, unknown>;
  sourceWarehouseName?: string;
};

type FactoryIssuedWorkStore = {
  items: FactoryIssuedWorkRecord[];
};

const processLabelToSlug: Record<string, string> = {
  Drying: "drying",
  Embossing: "embossing",
  Finishing: "finishing",
  Fluting: "cnc-fluting",
  Grouping: "grouping",
  Inspection: "inspection",
  Marquetry: "marquetry",
  Pressing: "pressing",
  Sawing: "sawing",
  Splicing: "splicing",
  "CNC / Fluting": "cnc-fluting",
  "CNC/Fluting": "cnc-fluting",
};

const slugToProcessLabel: Record<string, string> = {
  drying: "Drying",
  embossing: "Embossing",
  finishing: "Finishing",
  "cnc-fluting": "Fluting",
  grouping: "Grouping",
  inspection: "Inspection",
  marquetry: "Marquetry",
  pressing: "Pressing",
  sawing: "Sawing",
  splicing: "Splicing",
};

let memoryStore: FactoryIssuedWorkStore | null = null;
const listeners = new Set<() => void>();

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage;
}

function readStore(): FactoryIssuedWorkStore {
  if (memoryStore) {
    return memoryStore;
  }

  const storage = getLocalStorage();
  if (!storage) {
    memoryStore = { items: [] };
    return memoryStore;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryStore = { items: [] };
    return memoryStore;
  }

  try {
    const parsed = JSON.parse(raw) as FactoryIssuedWorkStore;
    memoryStore =
      parsed && Array.isArray(parsed.items) ? { items: parsed.items } : { items: [] };
  } catch {
    memoryStore = { items: [] };
  }

  return memoryStore;
}

function writeStore(next: FactoryIssuedWorkStore) {
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

export function resolveFactoryProcessSlug(processOrSlug: string) {
  if (processOrSlug in slugToProcessLabel) {
    return processOrSlug;
  }
  return processLabelToSlug[processOrSlug] ?? processOrSlug.toLowerCase();
}

export function resolveFactoryProcessLabel(slugOrProcess: string) {
  if (slugOrProcess in processLabelToSlug) {
    return slugOrProcess;
  }
  return slugToProcessLabel[slugOrProcess] ?? slugOrProcess;
}

export function getFactoryListPathForProcess(processOrSlug: string) {
  const slug = resolveFactoryProcessSlug(processOrSlug);
  if (slug === "packing") {
    return "/packing";
  }
  return `/factory/${slug}`;
}

export function getFactoryIssuedWorkItems() {
  return [...readStore().items];
}

export function getFactoryIssuedWorkById(id: string) {
  return readStore().items.find((item) => item.id === id) ?? null;
}

export function useFactoryIssuedWorkItems() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [...store.items];
}

export function issueFactoryWork(input: {
  destinationProcess: string;
  orderItemNo?: string;
  orderNo?: string;
  purpose?: FactoryWorkPurpose;
  sampleNo?: string;
  sourceProcess?: string;
  sourceRow: FactoryRecord;
  sourceSlug: string;
  sourceWarehouseName?: string;
}): FactoryIssuedWorkRecord {
  const store = readStore();
  const destinationSlug = resolveFactoryProcessSlug(input.destinationProcess);
  const sourceWorkItemId =
    typeof input.sourceRow.workItemId === "string"
      ? input.sourceRow.workItemId
      : "";
  const purpose: FactoryWorkPurpose =
    input.purpose ??
    (input.sampleNo ||
    input.sourceRow.purpose === "SAMPLE" ||
    input.sourceRow.for === "Sample" ||
    input.sourceRow.forLabel === "Sample"
      ? "SAMPLE"
      : "ORDER");

  const nextItem: FactoryIssuedWorkRecord = {
    id: `factory-work-${Date.now()}-${store.items.length + 1}`,
    destinationSlug,
    listingState: "issued",
    sourceSlug: input.sourceSlug,
    sourceRowId: String(input.sourceRow.id),
    purpose,
    sourceSnapshot: { ...input.sourceRow },
    createdAt: new Date().toISOString(),
    ...(input.sampleNo ? { sampleNo: input.sampleNo } : {}),
    ...(input.orderNo ? { orderNo: input.orderNo } : {}),
    ...(input.orderItemNo ? { orderItemNo: input.orderItemNo } : {}),
    ...(input.sourceProcess ? { sourceProcess: input.sourceProcess } : {}),
    ...(input.sourceWarehouseName
      ? { sourceWarehouseName: input.sourceWarehouseName }
      : {}),
  };

  const movedAt = new Date().toISOString();
  const existingItems = store.items.map((item) =>
    sourceWorkItemId && item.id === sourceWorkItemId
      ? { ...item, listingState: "moved" as const, movedAt }
      : item,
  );

  writeStore({
    items: [nextItem, ...existingItems],
  });

  return nextItem;
}

export function completeFactoryIssuedWork(
  workItemId: string,
  resultSnapshot?: Record<string, unknown>,
) {
  const store = readStore();
  const index = store.items.findIndex((item) => item.id === workItemId);
  if (index < 0) {
    return null;
  }

  const current = store.items[index]!;
  const nextItem: FactoryIssuedWorkRecord = {
    ...current,
    listingState: "done",
    completedAt: new Date().toISOString(),
    sourceSnapshot: resultSnapshot
      ? { ...current.sourceSnapshot, ...resultSnapshot }
      : current.sourceSnapshot,
  };
  const items = [...store.items];
  items[index] = nextItem;
  writeStore({ items });
  return nextItem;
}

export function getFactoryIssuedWorkForListing(
  destinationSlug: string,
  tab: FactoryProcessTab,
) {
  if (tab !== "issued" && tab !== "done") {
    return [] as FactoryIssuedWorkRecord[];
  }

  return getFactoryIssuedWorkItems().filter(
    (item) =>
      item.destinationSlug === destinationSlug && item.listingState === tab,
  );
}

export function factoryIssuedWorkToRow(
  item: FactoryIssuedWorkRecord,
): FactoryRecord {
  const processLabel = resolveFactoryProcessLabel(item.destinationSlug);
  const snapshot = item.sourceSnapshot;
  const isSample = item.purpose === "SAMPLE";
  const warehouseName = getIssuedWorkWarehouseName(item);
  const issuedFrom = getIssuedWorkSourceProcess(item);

  return {
    ...snapshot,
    id: item.id,
    workItemId: item.id,
    listingState: item.listingState,
    warehouseName,
    issuedFrom,
    issuedFor: processLabel,
    issuedDate: new Date(item.createdAt),
    purpose: isSample ? "SAMPLE" : "ORDER",
    for: isSample ? "Sample" : "Order",
    forLabel: isSample ? "Sample" : "Order",
    ...(item.sampleNo
      ? {
          sampleNo: item.sampleNo,
          customerName: item.sampleNo,
          orderNo: item.sampleNo,
          isSample: true,
        }
      : {}),
    ...(item.orderNo ? { orderNo: item.orderNo } : {}),
    ...(item.orderItemNo ? { orderItemNo: item.orderItemNo } : {}),
    remark:
      typeof snapshot.remark === "string" && snapshot.remark.trim()
        ? snapshot.remark
        : isSample
          ? `Sample ${item.sampleNo ?? ""}`.trim()
          : typeof snapshot.orderNo === "string"
            ? `Order ${snapshot.orderNo}`
            : "",
  } as FactoryRecord;
}

function getIssuedWorkWarehouseName(item: FactoryIssuedWorkRecord) {
  const snapshot = item.sourceSnapshot;
  const explicitWarehouse =
    item.sourceWarehouseName ||
    getStringValue(snapshot, "warehouseName") ||
    getStringValue(snapshot, "sourceWarehouseName");

  if (explicitWarehouse) {
    return explicitWarehouse;
  }

  const snapshotIssuedFrom = getStringValue(snapshot, "issuedFrom");
  if (isWarehouseLabel(snapshotIssuedFrom)) {
    return snapshotIssuedFrom;
  }

  if (isWarehouseLabel(item.sourceSlug)) {
    return item.sourceSlug;
  }

  return "";
}

function getIssuedWorkSourceProcess(item: FactoryIssuedWorkRecord) {
  const snapshot = item.sourceSnapshot;
  const explicitProcess =
    item.sourceProcess ||
    getStringValue(snapshot, "issuedFromProcess") ||
    getStringValue(snapshot, "sourceProcess");

  if (explicitProcess) {
    return explicitProcess;
  }

  if (isWarehouseLabel(item.sourceSlug)) {
    const snapshotIssuedFrom = getStringValue(snapshot, "issuedFrom");
    return snapshotIssuedFrom && !isWarehouseLabel(snapshotIssuedFrom)
      ? snapshotIssuedFrom
      : "Inventory";
  }

  return resolveFactoryProcessLabel(item.sourceSlug);
}

function isWarehouseLabel(value: unknown) {
  return typeof value === "string" && /^warehouse\b/i.test(value.trim());
}

function getStringValue(source: Record<string, unknown>, key: string) {
  const value = source[key];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}
