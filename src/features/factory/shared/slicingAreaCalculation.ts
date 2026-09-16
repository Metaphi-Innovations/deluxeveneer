import {
  formatAmount,
  formatMeasurement,
  formatQuantity,
  formatSQM,
  formatSqfFromSqm,
  parseNumericValue,
  sanitizeAmountInput,
  sanitizeQuantityInput,
} from "../../shared/numberFormat";

const SLICING_AREA_INPUT_KEYS = new Set([
  "length",
  "width",
  "noOfLeaves",
]);

const SLICING_DIMENSION_KEYS = new Set(["length", "width", "height"]);

/** Parse a measurement string into a numeric magnitude (unit-agnostic). */
export function parseMeasurementMagnitude(value: unknown): number {
  const parsed = parseNumericValue(value);
  return parsed === null ? 0 : parsed;
}

/**
 * Resolve Length / Width / Thickness in metres for Slicing.
 * Values already in m/mtr are used as-is; legacy mm values are converted.
 */
export function resolveSlicingDimensionMetres(value: unknown): number {
  if (value == null || value === "") {
    return 0;
  }

  const raw = String(value).trim().toLowerCase();
  const magnitude = parseMeasurementMagnitude(value);

  if (!magnitude) {
    return 0;
  }

  if (/\bmm\b/.test(raw) || raw.endsWith("mm")) {
    return magnitude / 1000;
  }

  if (/\bcm\b/.test(raw) || raw.endsWith("cm")) {
    return magnitude / 100;
  }

  // Explicit metres, or bare numbers on the Slicing form (stored as metres).
  return magnitude;
}

/**
 * Slicing SQM when Length/Width are in metres:
 * length(m) × width(m) × no. of leaves
 */
export function calculateSlicingSqmValue(
  length: unknown,
  width: unknown,
  noOfLeaves: unknown,
): number {
  const lengthM = resolveSlicingDimensionMetres(length);
  const widthM = resolveSlicingDimensionMetres(width);
  const leaves = parseNumericValue(noOfLeaves) ?? 0;

  if (!lengthM || !widthM || !leaves) {
    return 0;
  }

  return lengthM * widthM * leaves;
}

export function isSlicingAreaInputKey(key: string) {
  return SLICING_AREA_INPUT_KEYS.has(key);
}

export function formatSlicingDimensionMetres(value: unknown): string {
  const metres = resolveSlicingDimensionMetres(value);

  if (!metres) {
    if (value == null || value === "") {
      return "";
    }

    const trimmed = String(value).trim();
    return trimmed ? formatMeasurement(ensureMetresSuffix(trimmed)) : "";
  }

  return formatMeasurement(`${metres} m`);
}

function ensureMetresSuffix(value: string) {
  const lower = value.toLowerCase();
  if (
    /\bm\b/.test(lower) ||
    lower.includes("mtr") ||
    lower.includes("metre") ||
    lower.includes("meter") ||
    lower.endsWith("mm") ||
    lower.endsWith("cm")
  ) {
    return value;
  }

  return `${value} m`;
}

export function applySlicingDerivedAreas<
  T extends Record<string, string>,
>(values: T): T {
  const sqmValue = calculateSlicingSqmValue(
    values.length,
    values.width,
    values.noOfLeaves,
  );

  return {
    ...values,
    sqm: sqmValue > 0 ? formatSQM(sqmValue) : "",
    sqf: sqmValue > 0 ? formatSqfFromSqm(sqmValue) : "",
  };
}

export function normalizeSlicingLineItemInput(
  key: string,
  value: string,
): string {
  if (key === "noOfLeaves") {
    return sanitizeQuantityInput(value);
  }

  if (key === "amount") {
    return sanitizeAmountInput(value);
  }

  if (SLICING_DIMENSION_KEYS.has(key)) {
    return value;
  }

  return value;
}

export function formatSlicingLineItemDisplay(
  key: string,
  value: string,
): string {
  if (!value.trim()) {
    return "-";
  }

  if (key === "sqm") {
    return formatSQM(value) || value;
  }

  if (key === "sqf") {
    return formatSqfFromSqm(value) || value;
  }

  if (key === "amount") {
    return formatAmount(value, { withSymbol: true }) || value;
  }

  if (key === "noOfLeaves") {
    return formatQuantity(value) || value;
  }

  if (SLICING_DIMENSION_KEYS.has(key)) {
    return formatSlicingDimensionMetres(value) || value;
  }

  return value;
}
