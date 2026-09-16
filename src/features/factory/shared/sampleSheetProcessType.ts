import type { FactoryRecord } from "./types";

export type SampleSheetProcessType =
  | "Fluting"
  | "Embossing"
  | "Finishing"
  | "Decorative"
  | "Marquetry";

const sampleProcessTypeAliases: Record<SampleSheetProcessType, readonly string[]> = {
  Fluting: ["fluting", "fluted", "cnc", "cnc / fluting", "cnc/fluting"],
  Embossing: ["embossing", "embossed"],
  Finishing: ["finishing", "finish"],
  Decorative: ["decorative"],
  Marquetry: ["marquetry"],
};

/** Order line finishedType values compatible with each Sample Sheet process type. */
const compatibleOrderFinishedTypes: Record<
  SampleSheetProcessType,
  readonly string[]
> = {
  Fluting: ["Fluted", "Fluting"],
  Embossing: ["Embossed", "Embossing"],
  Finishing: ["Decorative", "Finishing"],
  Decorative: ["Decorative"],
  Marquetry: ["Marquetry"],
};

export function resolveSampleSheetProcessType(
  row: FactoryRecord | Record<string, unknown> | undefined,
): SampleSheetProcessType | null {
  if (!row) {
    return null;
  }

  const candidates = [
    row.sampleProcessType,
    row.finishType,
    row.processType,
    row.purpose,
    row.productType,
    row.issuedFor,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeSampleSheetProcessType(
      typeof candidate === "string" ? candidate : "",
    );
    if (resolved) {
      return resolved;
    }
  }

  return null;
}

export function normalizeSampleSheetProcessType(
  value: string | null | undefined,
): SampleSheetProcessType | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim().toLowerCase();

  return (
    (Object.keys(sampleProcessTypeAliases) as SampleSheetProcessType[]).find(
      (type) =>
        sampleProcessTypeAliases[type].some(
          (alias) => normalized === alias || normalized.includes(alias),
        ),
    ) ?? null
  );
}

export function isSampleSheetCompatibleWithFinishedType(
  sampleType: SampleSheetProcessType | null,
  finishedType: string | null | undefined,
): boolean {
  if (!sampleType || !finishedType?.trim()) {
    return false;
  }

  const normalizedFinished = finishedType.trim().toLowerCase();
  return compatibleOrderFinishedTypes[sampleType].some(
    (option) => option.toLowerCase() === normalizedFinished,
  );
}

/**
 * After allocating Sample Sheet stock to a matching order item,
 * continue from the next required stage (do not remake the sample).
 */
export function getDownstreamRouteAfterSampleAllocation(
  sampleType: SampleSheetProcessType | null,
): { label: string; path: string } {
  if (sampleType === "Finishing") {
    return { label: "Packing", path: "/packing" };
  }

  if (sampleType === "Marquetry") {
    return { label: "Pressing", path: "/factory/pressing/add" };
  }

  // Fluting / Embossing / Decorative sample stock → Finishing next
  return { label: "Finishing", path: "/factory/finishing/add" };
}

export function formatSampleSheetProcessLabel(
  sampleType: SampleSheetProcessType | null,
): string {
  if (!sampleType) {
    return "Sample Sheet";
  }

  return `${sampleType} Sample Sheet`;
}
