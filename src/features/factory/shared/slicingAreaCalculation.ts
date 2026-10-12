import {
  formatAmount,
  formatMeasurement,
  formatQuantity,
  parseNumericValue,
  sanitizeAmountInput,
  sanitizeQuantityInput,
  SQM_TO_SQF,
} from "../../shared/numberFormat";

/**
 * Slicing measures, in metres. This is the frontend reference for the backend.
 *
 * Block:  CBM = length × width × height
 *          SQM = CBM / height
 * Slice:  CBM = length × width × thickness × number of leaves
 *          SQM = length × width × number of leaves
 * SQF   = SQM × 10.7639
 * CBF   = CBM × 35.3147
 *
 * Leftover height shrinks with leftover CBM. Leftover SQM stays the face
 * area (CBM / height) until the available CBM is 0.
 */
export const CBM_TO_CBF = 35.3147;

const SLICING_AREA_INPUT_KEYS = new Set([
  "length",
  "width",
  "thickness",
  "height",
  "noOfLeaves",
  "noOfSheets",
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
 * Face area used by processes that do not have a block height.
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

/** CBM = length × width × depth × pieces. Depth is height or thickness. Pieces is 1 for a block. */
export function calculateSlicingCbm(
  length: unknown,
  width: unknown,
  depth: unknown,
  pieces: unknown = 1,
): number {
  const lengthM = resolveSlicingDimensionMetres(length);
  const widthM = resolveSlicingDimensionMetres(width);
  const depthM = resolveSlicingDimensionMetres(depth);
  const count = parseNumericValue(pieces) ?? 0;

  if (!lengthM || !widthM || !depthM || count <= 0) {
    return 0;
  }

  return lengthM * widthM * depthM * count;
}

/** SQM = CBM / height, or CBM / thickness. */
export function calculateSqmFromCbm(cbm: number, depth: unknown): number {
  const depthM = resolveSlicingDimensionMetres(depth);
  if (cbm <= 0 || depthM <= 0) return 0;
  return cbm / depthM;
}

/** Height or thickness = CBM / (length × width). */
export function calculateDepthFromCbm(
  cbm: number,
  length: unknown,
  width: unknown,
): number {
  const lengthM = resolveSlicingDimensionMetres(length);
  const widthM = resolveSlicingDimensionMetres(width);
  if (cbm <= 0 || lengthM <= 0 || widthM <= 0) return 0;
  return cbm / (lengthM * widthM);
}

export type SlicingSliceInput = {
  height?: unknown;
  length?: unknown;
  noOfLeaves?: unknown;
  noOfSheets?: unknown;
  thickness?: unknown;
  totalLeaves?: unknown;
  width?: unknown;
};

export function measureSlicingSlice(values: SlicingSliceInput) {
  const depth = values.thickness || values.height;
  const pieces = values.noOfLeaves || values.noOfSheets || values.totalLeaves;
  const cbm = calculateSlicingCbm(values.length, values.width, depth, pieces);
  const sqm = calculateSlicingSqmValue(values.length, values.width, pieces);

  return {
    cbf: cbm * CBM_TO_CBF,
    cbm,
    complete: cbm > 0 && sqm > 0,
    depth: resolveSlicingDimensionMetres(depth),
    sqf: sqm * SQM_TO_SQF,
    sqm,
  };
}

export function slicingStockCbm(source: Record<string, unknown> | undefined) {
  const given =
    parseNumericValue(source?.availableCbm) ??
    parseNumericValue(source?.receivedCbm) ??
    parseNumericValue(source?.cbm);

  if (given !== null && given > 0) {
    return given;
  }

  return calculateSlicingCbm(
    source?.length,
    source?.width,
    source?.height || source?.thickness,
    1,
  );
}

export function calculateSlicingRemainder(
  source: Record<string, unknown> | undefined,
  slices: readonly SlicingSliceInput[],
) {
  const length = resolveSlicingDimensionMetres(source?.length);
  const width = resolveSlicingDimensionMetres(source?.width);
  const height = resolveSlicingDimensionMetres(source?.height || source?.thickness);
  const stockCbm = slicingStockCbm(source);
  const usedCbm = slices.reduce((sum, slice) => sum + measureSlicingSlice(slice).cbm, 0);
  const cbm = Math.max(0, stockCbm - usedCbm);
  const depleted = slices.length > 0 && cbm <= 0.000001;
  const depth = depleted
    ? 0
    : height > 0 && stockCbm > 0
      ? height * (cbm / stockCbm)
      : calculateDepthFromCbm(cbm, length, width);
  const sqm = depleted ? 0 : calculateSqmFromCbm(cbm, depth);

  return {
    cbf: depleted ? 0 : cbm * CBM_TO_CBF,
    cbm: depleted ? 0 : cbm,
    depleted,
    height: depth,
    length: depleted ? 0 : length,
    sqf: sqm * SQM_TO_SQF,
    sqm,
    width: depleted ? 0 : width,
  };
}

export function formatSlicingDecimal(value: number, digits: number) {
  if (!Number.isFinite(value) || value < 0) return "";
  if (value === 0) return "0";
  return value.toFixed(digits).replace(/\.?0+$/u, "");
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
  const measured = measureSlicingSlice(values);

  return {
    ...values,
    cbf: measured.cbm > 0 ? formatSlicingDecimal(measured.cbf, 4) : "",
    cbm: measured.cbm > 0 ? formatSlicingDecimal(measured.cbm, 6) : "",
    sqf: measured.sqm > 0 ? formatSlicingDecimal(measured.sqf, 3) : "",
    sqm: measured.sqm > 0 ? formatSlicingDecimal(measured.sqm, 3) : "",
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

  if (key === "sqm" || key === "sqf" || key === "cbm" || key === "cbf") {
    return value;
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
