import {
  formatMeasurement,
  formatQuantity,
  formatSQM,
} from "../../shared/numberFormat";

export type FactoryQuantityUnit =
  | "leaves"
  | "sheets"
  | "bundles"
  | "pieces"
  | "SQM";

export type FactoryQuantityAllocationConfig = {
  enabled: boolean;
  unitLabel: FactoryQuantityUnit;
  originalQuantityKeys: readonly string[];
};

export type FactoryProcessRunRecord = {
  id: string;
  stageSlug: string;
  sourceKey: string;
  processedNow: number;
  wastageNow: number;
  pendingBalance: number;
  remark: string;
  createdAt: string;
};

export type FactorySourceQuantitySummary = {
  availableNow: number;
  originalQuantity: number;
  pendingBalance: number;
  processedEarlier: number;
  processNow: number;
  unitLabel: FactoryQuantityUnit;
  wastageEarlier: number;
  wastageNow: number;
};

/**
 * Stages that consume a measurable source quantity support partial
 * process / wastage allocation. Others stay without this panel.
 */
export const factoryQuantityAllocationBySlug: Record<
  string,
  FactoryQuantityAllocationConfig
> = {
  slicing: {
    enabled: true,
    unitLabel: "leaves",
    originalQuantityKeys: [
      "noOfLeaves",
      "issuedLeaves",
      "noOfLeavesSheets",
      "availableUnits",
      "totalUnits",
      "totalNoOfSheets",
    ],
  },
  drying: {
    enabled: true,
    unitLabel: "bundles",
    originalQuantityKeys: ["noOfBundle", "noOfSheets", "noOfLeaves"],
  },
  grouping: {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "noOfSheets",
      "sampleSheets",
      "finishedSheets",
      "issuedNoOfSheets",
    ],
  },
  splicing: {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "noOfSheets",
      "sampleSheets",
      "issuedNoOfSheets",
      "finishedSheets",
    ],
  },
  pressing: {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "consumeSheets",
      "consumedNoOfSheets",
      "noOfSheets",
      "issuedNoOfSheets",
    ],
  },
  "cnc-fluting": {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "issuedNoOfSheets",
      "noOfSheets",
      "outputNoOfSheets",
    ],
  },
  embossing: {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "issuedNoOfSheets",
      "noOfSheets",
      "outputNoOfSheets",
    ],
  },
  finishing: {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "issuedNoOfSheets",
      "noOfSheets",
      "outputNoOfSheets",
      "finishedSheets",
    ],
  },
  marquetry: {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "noOfSheets",
      "issuedNoOfSheets",
      "sampleSheets",
      "finishedSheets",
    ],
  },
  "sample-sheets": {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: ["sampleSheets", "noOfSheets", "issuedNoOfSheets"],
  },
  "export-oem": {
    enabled: true,
    unitLabel: "sheets",
    originalQuantityKeys: [
      "issuedNoOfSheets",
      "noOfSheets",
      "outputNoOfSheets",
    ],
  },
};

export function getFactoryQuantityAllocationConfig(
  stageSlug: string,
): FactoryQuantityAllocationConfig | null {
  const config = factoryQuantityAllocationBySlug[stageSlug];
  return config?.enabled ? config : null;
}

export function parseQuantityValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = trimmed.replace(/,/g, "").match(/-?\d+(\.\d+)?/);
  if (!match) {
    return null;
  }

  const parsed = Number.parseFloat(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getSourceFieldValue(
  sourceRow: Record<string, unknown> | null | undefined,
  keys: readonly string[],
): unknown {
  if (!sourceRow) {
    return undefined;
  }

  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(sourceRow, key)) {
      const value = sourceRow[key];
      if (value !== null && typeof value !== "undefined" && String(value).trim() !== "") {
        return value;
      }
    }
  }

  return undefined;
}

export function resolveOriginalQuantity(
  sourceRow: Record<string, unknown> | null | undefined,
  config: FactoryQuantityAllocationConfig,
): number {
  const raw = getSourceFieldValue(sourceRow, config.originalQuantityKeys);
  const parsed = parseQuantityValue(raw);
  return parsed !== null && parsed >= 0 ? parsed : 0;
}

export function buildFactorySourceAllocationKey(
  stageSlug: string,
  sourceRow: Record<string, unknown> | null | undefined,
): string {
  const sourceId =
    typeof sourceRow?.id === "string" && sourceRow.id.trim()
      ? sourceRow.id.trim()
      : "unknown-source";
  const reference = String(
    getSourceFieldValue(sourceRow, [
      "issueSrNo",
      "sampleSrNo",
      "srNo",
      "itemSrNo",
      "orderNo",
      "logNo",
    ]) ?? "",
  ).trim();

  return `${stageSlug}::${sourceId}::${reference || "no-ref"}`;
}

export function sumProcessRuns(runs: readonly FactoryProcessRunRecord[]) {
  return runs.reduce(
    (totals, run) => ({
      processed: totals.processed + run.processedNow,
      wastage: totals.wastage + run.wastageNow,
    }),
    { processed: 0, wastage: 0 },
  );
}

export function computeAvailableNow(
  originalQuantity: number,
  processedEarlier: number,
  wastageEarlier: number,
) {
  return Math.max(0, roundQuantity(originalQuantity - processedEarlier - wastageEarlier));
}

export function computePendingBalance(
  availableNow: number,
  processNow: number,
  wastageNow: number,
) {
  return roundQuantity(availableNow - processNow - wastageNow);
}

export function roundQuantity(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function formatQuantityDisplay(value: number, unitLabel: string) {
  const normalized =
    unitLabel.toUpperCase() === "SQM"
      ? formatSQM(value)
      : Number.isInteger(value)
        ? formatQuantity(value)
        : formatMeasurement(value);

  return `${normalized} ${unitLabel}`;
}

export function parseEditableQuantity(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  return parseQuantityValue(trimmed);
}

export const QUANTITY_ALLOCATION_OVERFLOW_MESSAGE =
  "Processed quantity + wastage cannot exceed available quantity.";

export const PROCESS_QUANTITY_OVERFLOW_MESSAGE =
  "Total processed quantity cannot exceed available source quantity.";

/** Line-item field keys that represent processed quantity for each stage. */
export const factoryProcessedQuantityKeysBySlug: Record<string, readonly string[]> = {
  slicing: ["noOfLeaves"],
  drying: ["noOfBundle"],
  grouping: ["noOfSheets"],
  splicing: ["noOfSheets"],
  pressing: ["consumeSheets", "consumedNoOfSheets", "noOfSheets"],
  "cnc-fluting": ["issuedNoOfSheets", "noOfSheets", "outputNoOfSheets"],
  embossing: ["issuedNoOfSheets", "noOfSheets", "outputNoOfSheets"],
  finishing: ["issuedNoOfSheets", "noOfSheets", "finishedSheets", "outputNoOfSheets"],
  marquetry: ["noOfSheets", "issuedNoOfSheets", "sampleSheets"],
  "sample-sheets": ["sampleSheets", "noOfSheets"],
  "export-oem": ["issuedNoOfSheets", "noOfSheets", "outputNoOfSheets"],
};

export function getProcessedQuantityKeys(stageSlug: string): readonly string[] {
  return factoryProcessedQuantityKeysBySlug[stageSlug] ?? ["noOfSheets", "noOfLeaves", "noOfBundle"];
}

export function resolveLineItemProcessedQuantity(
  values: Record<string, string>,
  stageSlug: string,
): number {
  for (const key of getProcessedQuantityKeys(stageSlug)) {
    const parsed = parseQuantityValue(values[key]);
    if (parsed !== null && parsed >= 0) {
      return parsed;
    }
  }

  return 0;
}

export function sumProcessedLineItemQuantity(
  items: readonly { values: Record<string, string> }[],
  stageSlug: string,
): number {
  return roundQuantity(
    items.reduce(
      (total, item) =>
        total + resolveLineItemProcessedQuantity(item.values, stageSlug),
      0,
    ),
  );
}

/**
 * Available for this entry = original source qty minus previously saved processed qty.
 * Wastage is never inferred from balance.
 */
export function computeProcessEntryBalance(input: {
  originalQuantity: number;
  previouslyProcessed: number;
  currentProcessed: number;
}) {
  const sourceAvailable = Math.max(
    0,
    roundQuantity(input.originalQuantity - input.previouslyProcessed),
  );
  const balance = roundQuantity(sourceAvailable - input.currentProcessed);

  return {
    sourceQuantity: sourceAvailable,
    processedQuantity: roundQuantity(input.currentProcessed),
    balanceQuantity: balance,
    isOverflow: input.currentProcessed > sourceAvailable + 1e-9,
  };
}

export function getProcessQuantityOverflowError(input: {
  originalQuantity: number;
  previouslyProcessed: number;
  currentProcessed: number;
}): string {
  const summary = computeProcessEntryBalance(input);
  return summary.isOverflow ? PROCESS_QUANTITY_OVERFLOW_MESSAGE : "";
}

export function getQuantityAllocationValidationError(input: {
  availableNow: number;
  processNow: number;
  wastageNow: number;
}): string {
  const { availableNow, processNow, wastageNow } = input;

  if (processNow < 0 || wastageNow < 0) {
    return "Process Now and Wastage Now must be zero or greater.";
  }

  if (processNow + wastageNow > availableNow + 1e-9) {
    return QUANTITY_ALLOCATION_OVERFLOW_MESSAGE;
  }

  return "";
}

export function buildQuantitySummary(input: {
  originalQuantity: number;
  processedEarlier: number;
  wastageEarlier: number;
  processNow: number;
  wastageNow: number;
  unitLabel: FactoryQuantityUnit;
}): FactorySourceQuantitySummary {
  const availableNow = computeAvailableNow(
    input.originalQuantity,
    input.processedEarlier,
    input.wastageEarlier,
  );
  const pendingBalance = Math.max(
    0,
    computePendingBalance(availableNow, input.processNow, input.wastageNow),
  );

  return {
    originalQuantity: input.originalQuantity,
    processedEarlier: input.processedEarlier,
    wastageEarlier: input.wastageEarlier,
    availableNow,
    processNow: input.processNow,
    wastageNow: input.wastageNow,
    pendingBalance,
    unitLabel: input.unitLabel,
  };
}
