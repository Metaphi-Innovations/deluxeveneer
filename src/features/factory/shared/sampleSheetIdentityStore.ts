import { useSyncExternalStore } from "react";

import type { FactoryProcessTab } from "./factoryUtils";
import type { FactoryRecord } from "./types";

const STORAGE_KEY = "deluxe-veneers-sample-sheet-identities";

export type SampleNextProcess = "Marquetry" | "Splicing";

export type SampleFactoryStage =
  | "Grouping"
  | "Marquetry"
  | "Pressing"
  | "Splicing"
  | "Fluting"
  | "Embossing"
  | "Finishing"
  | "Packing";

export type SampleJourneyEvent = {
  at: string;
  stage: SampleFactoryStage;
  status: string;
};

export type SampleOrderAllocation = {
  at: string;
  orderItemNo?: string;
  orderNo: string;
  sheets: number;
};

export type SampleSheetRecord = {
  availableSheets: number;
  color: string;
  createdAt: string;
  currentStage: SampleFactoryStage;
  currentStatus: string;
  forLabel: "Sample";
  groupingRowId: string;
  issueDate: string;
  itemName: string;
  journey: SampleJourneyEvent[];
  length: string;
  nextProcess: SampleNextProcess;
  orderAllocations: SampleOrderAllocation[];
  originalSheets: number;
  processRoute: string;
  purpose: "SAMPLE";
  remark: string;
  sampleNo: string;
  sourceSnapshot: Record<string, unknown>;
  subCategory: string;
  thickness: string;
  width: string;
};

type SampleSheetStore = {
  samples: SampleSheetRecord[];
  sequence: number;
};

let memoryStore: SampleSheetStore | null = null;
const listeners = new Set<() => void>();

const stageByFactorySlug: Record<string, SampleFactoryStage> = {
  marquetry: "Marquetry",
  pressing: "Pressing",
  splicing: "Splicing",
  "cnc-fluting": "Fluting",
  embossing: "Embossing",
  finishing: "Finishing",
};

function getLocalStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function readStore(): SampleSheetStore {
  if (memoryStore) {
    return memoryStore;
  }

  const storage = getLocalStorage();
  if (!storage) {
    memoryStore = { samples: [], sequence: 0 };
    return memoryStore;
  }

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    memoryStore = { samples: [], sequence: 0 };
    return memoryStore;
  }

  try {
    const parsed = JSON.parse(raw) as SampleSheetStore;
    memoryStore =
      parsed && Array.isArray(parsed.samples)
        ? {
            samples: parsed.samples,
            sequence: Number(parsed.sequence) || parsed.samples.length,
          }
        : { samples: [], sequence: 0 };
  } catch {
    memoryStore = { samples: [], sequence: 0 };
  }

  return memoryStore;
}

function writeStore(next: SampleSheetStore) {
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

function nowIso() {
  return new Date().toISOString();
}

function createSampleNo(sequence: number) {
  const year = new Date().getFullYear();
  return `SMP-${year}-${String(sequence).padStart(4, "0")}`;
}

function getStringField(row: FactoryRecord | Record<string, unknown>, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}

function deriveProcessRoute(sample: SampleSheetRecord) {
  const statuses = sample.journey.map((event) => event.status.toLowerCase());
  const stages = sample.journey.map((event) => event.stage);

  if (stages.includes("Marquetry") && statuses.some((status) => status.includes("pressing done"))) {
    return "Marquetry";
  }
  if (statuses.some((status) => status.includes("fluting done") || status.includes("issued for fluting"))) {
    if (statuses.some((status) => status.includes("finishing done"))) {
      return "Fluted";
    }
    return "Fluting";
  }
  if (statuses.some((status) => status.includes("embossing done") || status.includes("issued for embossing"))) {
    if (statuses.some((status) => status.includes("finishing done"))) {
      return "Embossed";
    }
    return "Embossing";
  }
  if (statuses.some((status) => status.includes("finishing done"))) {
    return "Finished";
  }
  if (stages.includes("Marquetry")) {
    return "Marquetry";
  }
  if (stages.includes("Splicing")) {
    return "Splicing";
  }
  return sample.nextProcess;
}

function withDerivedFields(sample: SampleSheetRecord): SampleSheetRecord {
  const latest = sample.journey[sample.journey.length - 1];
  return {
    ...sample,
    currentStage: latest?.stage ?? sample.currentStage,
    currentStatus: latest?.status ?? sample.currentStatus,
    processRoute: deriveProcessRoute(sample),
  };
}

function updateSample(
  sampleNo: string,
  updater: (sample: SampleSheetRecord) => SampleSheetRecord,
) {
  const store = readStore();
  const index = store.samples.findIndex((sample) => sample.sampleNo === sampleNo);
  if (index < 0) {
    return null;
  }

  const nextSample = withDerivedFields(updater(store.samples[index]!));
  const samples = [...store.samples];
  samples[index] = nextSample;
  writeStore({ ...store, samples });
  return nextSample;
}

export function getSampleSheetRecords() {
  return [...readStore().samples];
}

export function getSampleSheetByNo(sampleNo: string) {
  return readStore().samples.find((sample) => sample.sampleNo === sampleNo) ?? null;
}

export function useSampleSheetRecords() {
  const store = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return [...store.samples];
}

export function createSampleSheetFromGrouping(input: {
  groupingRow: FactoryRecord;
  issueDate: Date | null;
  issueSheets: number;
  nextProcess: SampleNextProcess;
  remark?: string;
}): SampleSheetRecord {
  const store = readStore();
  const sequence = store.sequence + 1;
  const sampleNo = createSampleNo(sequence);
  const issueDate =
    input.issueDate instanceof Date
      ? input.issueDate.toISOString()
      : nowIso();
  const at = nowIso();
  const issuedStatus = `Issued for ${input.nextProcess}` as const;

  const sample = withDerivedFields({
    sampleNo,
    groupingRowId: String(input.groupingRow.id),
    issueDate,
    originalSheets: input.issueSheets,
    availableSheets: input.issueSheets,
    nextProcess: input.nextProcess,
    remark: input.remark?.trim() ?? "",
    purpose: "SAMPLE",
    forLabel: "Sample",
    itemName: getStringField(input.groupingRow, ["itemName", "productName"]),
    subCategory: getStringField(input.groupingRow, ["itemSubCategory", "subCategory"]),
    color: getStringField(input.groupingRow, ["color", "colour", "processColour"]),
    length: getStringField(input.groupingRow, ["length"]),
    width: getStringField(input.groupingRow, ["width"]),
    thickness: getStringField(input.groupingRow, ["thickness", "thickess"]),
    currentStage: input.nextProcess,
    currentStatus: issuedStatus,
    processRoute: input.nextProcess,
    journey: [
      { stage: "Grouping", status: "Grouping Done", at },
      { stage: input.nextProcess, status: issuedStatus, at },
    ],
    sourceSnapshot: { ...input.groupingRow },
    createdAt: at,
    orderAllocations: [],
  });

  writeStore({
    sequence,
    samples: [sample, ...store.samples],
  });

  return sample;
}

export function markSampleProcessDone(sampleNo: string, factorySlug: string) {
  const stage = stageByFactorySlug[factorySlug];
  if (!stage) {
    return null;
  }

  return updateSample(sampleNo, (sample) => {
    const at = nowIso();
    const doneStatus = `${stage} Done`;

    return {
      ...sample,
      journey: [...sample.journey, { stage, status: doneStatus, at }],
    };
  });
}

export function issueSampleToProcess(
  sampleNo: string,
  process: "Finishing" | "Fluting" | "Embossing" | "Pressing" | "Packing",
) {
  return updateSample(sampleNo, (sample) => {
    const at = nowIso();
    return {
      ...sample,
      journey: [
        ...sample.journey,
        {
          stage: process,
          status: `Issued for ${process}`,
          at,
        },
      ],
    };
  });
}

export function isSampleEligibleForOrder(sample: SampleSheetRecord) {
  if (sample.availableSheets <= 0) {
    return false;
  }

  const status = sample.currentStatus.toLowerCase();
  return status === "pressing done" || status === "finishing done";
}

export function resolveSampleFinishedType(sample: SampleSheetRecord) {
  const route = sample.processRoute.toLowerCase();
  if (route.includes("marquetry")) {
    return "Marquetry";
  }
  if (route.includes("flut")) {
    return "Fluted";
  }
  if (route.includes("emboss")) {
    return "Embossed";
  }
  if (route.includes("finish") || route.includes("decor")) {
    return "Decorative";
  }
  return "Decorative";
}

export function allocateSampleToOrder(input: {
  orderItemNo?: string;
  orderNo: string;
  sampleNo: string;
  sheets: number;
}) {
  return updateSample(input.sampleNo, (sample) => {
    const sheets = Math.min(sample.availableSheets, Math.max(0, input.sheets));
    return {
      ...sample,
      availableSheets: Math.max(0, sample.availableSheets - sheets),
      orderAllocations: [
        {
          orderNo: input.orderNo,
          ...(input.orderItemNo ? { orderItemNo: input.orderItemNo } : {}),
          sheets,
          at: nowIso(),
        },
        ...sample.orderAllocations,
      ],
    };
  });
}

export function getSamplesForFactoryListing(
  factorySlug: string,
  tab: FactoryProcessTab,
) {
  const stage = stageByFactorySlug[factorySlug];
  if (!stage || tab === "rejected" || tab === "history") {
    return [] as SampleSheetRecord[];
  }

  return getSampleSheetRecords().filter((sample) => {
    if (sample.currentStage !== stage) {
      return false;
    }

    const status = sample.currentStatus.toLowerCase();
    if (tab === "issued") {
      return status.startsWith("issued for");
    }
    if (tab === "done") {
      return status.endsWith(" done");
    }
    return false;
  });
}

export function sampleToFactoryRecord(
  sample: SampleSheetRecord,
  listingState: FactoryProcessTab,
): FactoryRecord {
  const dimensions = [sample.length, sample.width, sample.thickness]
    .filter(Boolean)
    .join(" × ");

  return {
    ...sample.sourceSnapshot,
    id: `sample-${sample.sampleNo}`,
    sampleNo: sample.sampleNo,
    groupingRef: sample.groupingRowId,
    purpose: "SAMPLE",
    forLabel: "Sample",
    for: "Sample",
    warehouseName:
      typeof sample.sourceSnapshot.warehouseName === "string" &&
      sample.sourceSnapshot.warehouseName.trim()
        ? sample.sourceSnapshot.warehouseName
        : "Warehouse C",
    issuedFrom: "Grouping",
    issuedFor: sample.currentStatus.replace(/^Issued for\s+/i, "") || sample.nextProcess,
    issuedDate: new Date(sample.issueDate),
    itemName: sample.itemName,
    productName: sample.itemName,
    itemSubCategory: sample.subCategory,
    subCategory: sample.subCategory,
    color: sample.color,
    length: sample.length,
    width: sample.width,
    thickness: sample.thickness,
    noOfSheets: String(sample.availableSheets),
    availableSheets: String(sample.availableSheets),
    originalSheets: String(sample.originalSheets),
    remark: sample.remark || `Sample ${sample.sampleNo}`,
    customerName: sample.sampleNo,
    orderNo: sample.sampleNo,
    listingState,
    processRoute: sample.processRoute,
    currentStage: sample.currentStage,
    currentStatus: sample.currentStatus,
    dimensions,
    isSample: true,
  } as FactoryRecord;
}

export function isSampleFactoryRow(row: FactoryRecord | null | undefined) {
  if (!row) {
    return false;
  }
  return (
    row.purpose === "SAMPLE" ||
    row.forLabel === "Sample" ||
    row.for === "Sample" ||
    Boolean(row.sampleNo) ||
    row.isSample === true
  );
}

export function getSampleNoFromRow(row: FactoryRecord) {
  if (typeof row.sampleNo === "string" && row.sampleNo.trim()) {
    return row.sampleNo.trim();
  }
  if (typeof row.id === "string" && row.id.startsWith("sample-")) {
    return row.id.replace(/^sample-/, "");
  }
  return null;
}

export function getFactorySlugForSampleProcess(
  process: "Finishing" | "Fluting" | "Embossing" | "Pressing" | "Packing" | "Marquetry" | "Splicing",
) {
  if (process === "Packing") {
    return "/packing";
  }
  if (process === "Fluting") {
    return "/factory/cnc-fluting";
  }
  return `/factory/${process.toLowerCase()}`;
}
