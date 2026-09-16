/**
 * Portal-wide numeric DISPLAY formatters.
 * Do not use these to persist values — format only at the UI layer.
 */

export const SQM_TO_SQF = 10.7639;

const areaFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

const amountFormatter = new Intl.NumberFormat("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const quantityFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

export type NumericFieldKind =
  | "sqm"
  | "sqf"
  | "currency"
  | "quantity"
  | "percentage"
  | "measurement"
  | "other";

export type FormatCurrencyOptions = {
  /** ISO-ish currency code; defaults to INR. */
  currency?: string;
  /** When true, prefixes a currency symbol (₹ for INR). Default false for table cells. */
  withSymbol?: boolean;
};

/** Parse a number from raw values or already-formatted display strings. */
export function parseNumericValue(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const normalized = trimmed
    .replace(/^[₹$€£]\s*/u, "")
    .replace(/%$/u, "")
    .replace(/,/g, "")
    .replace(/[^\d.-]/g, "");

  if (!normalized || normalized === "-" || normalized === ".") {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

/** SQM / Square Metre — always 3 decimal places (en-IN grouping). */
export function formatSQM(value: unknown): string {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return value == null || value === "" ? "" : String(value);
  }

  return areaFormatter.format(parsed);
}

/** SQF / Square Feet — always 3 decimal places (en-IN grouping). */
export function formatSQF(value: unknown): string {
  return formatSQM(value);
}

/** Convert SQM → SQF for display (does not change stored SQM). */
export function formatSqfFromSqm(
  sqm: unknown,
  fallbackSqf?: unknown,
): string {
  const sqmValue = parseNumericValue(sqm);

  if (sqmValue !== null && sqmValue > 0) {
    return formatSQF(sqmValue * SQM_TO_SQF);
  }

  const fallback = parseNumericValue(fallbackSqf);

  if (fallback !== null) {
    return formatSQF(fallback);
  }

  return fallbackSqf == null || fallbackSqf === ""
    ? ""
    : String(fallbackSqf);
}

/**
 * Monetary amount — Indian grouping + 2 decimals.
 * Symbol is optional so listings that show a separate Currency column stay clean.
 */
export function formatAmount(
  value: unknown,
  options?: FormatCurrencyOptions,
): string {
  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return value == null || value === "" ? "" : String(value);
  }

  const formatted = amountFormatter.format(parsed);
  const currency = (options?.currency ?? "INR").toUpperCase();

  if (!options?.withSymbol) {
    return formatted;
  }

  if (currency === "INR" || currency === "RS" || currency === "₹") {
    return `₹${formatted}`;
  }

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(parsed);
  } catch {
    return formatted;
  }
}

/** Alias for monetary display (same rules as formatAmount). */
export function formatCurrency(
  value: unknown,
  options?: FormatCurrencyOptions,
): string {
  return formatAmount(value, options);
}

/** Whole-number quantities with Indian grouping. */
export function formatQuantity(value: unknown): string {
  if (typeof value === "string" && /[A-Za-z]/.test(value)) {
    // Preserve labels like "Hold 48" rather than stripping to a bare number.
    return value.trim();
  }

  const parsed = parseNumericValue(value);

  if (parsed === null) {
    return value == null || value === "" ? "" : String(value);
  }

  return quantityFormatter.format(Math.round(parsed));
}

/**
 * Percentages — drop unnecessary trailing zeros.
 * Accepts 18, "18", "18%", "18.00".
 */
export function formatPercentage(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }

  const raw = String(value).trim();
  const parsed = parseNumericValue(raw);

  if (parsed === null) {
    return raw;
  }

  const formatted = new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(parsed);

  return `${formatted}%`;
}

/**
 * Physical measurements — trim trailing zeros; preserve unit suffix when present.
 * Examples: 8.000 → 8, 8.500 → 8.5, "8.750 mm" → "8.75 mm"
 */
export function formatMeasurement(value: unknown): string {
  if (value == null || value === "") {
    return "";
  }

  if (typeof value === "number") {
    return trimTrailingZeros(value);
  }

  const raw = String(value).trim();
  const match = raw.match(/^([₹$€£]?\s*-?\d[\d,]*\.?\d*)(.*)$/u);

  if (!match) {
    return raw;
  }

  const numericPart = match[1] ?? "";
  const suffix = (match[2] ?? "").trim();
  const parsed = parseNumericValue(numericPart);

  if (parsed === null) {
    return raw;
  }

  const formatted = trimTrailingZeros(parsed);

  return suffix ? `${formatted} ${suffix}` : formatted;
}

function trimTrailingZeros(value: number): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (Number.isInteger(value)) {
    return quantityFormatter.format(value);
  }

  const asFixed = value.toFixed(6).replace(/\.?0+$/u, "");
  const [whole = "0", fraction = ""] = asFixed.split(".");
  const wholeFormatted = quantityFormatter.format(Number(whole));

  return fraction ? `${wholeFormatted}.${fraction}` : wholeFormatted;
}

/** Infer display kind from column key / label. */
export function classifyNumericField(
  key?: string,
  label?: string,
): NumericFieldKind {
  const haystack = `${key ?? ""} ${label ?? ""}`.toLowerCase();

  if (
    /\bsqm\b/.test(haystack) ||
    haystack.includes("square metre") ||
    haystack.includes("square meter") ||
    haystack.includes("avsqm") ||
    haystack.includes("totalsqm") ||
    haystack.includes("availablesqm")
  ) {
    return "sqm";
  }

  if (
    /\bsqf\b/.test(haystack) ||
    haystack.includes("square feet") ||
    haystack.includes("square foot") ||
    haystack.includes("avsqf") ||
    haystack.includes("totalsqf") ||
    haystack.includes("availablesqf")
  ) {
    return "sqf";
  }

  if (
    haystack.includes("gstpercentage") ||
    haystack.includes("gst %") ||
    haystack.includes("gst%") ||
    key?.toLowerCase() === "gst" ||
    (/\bgst\b/.test(haystack) &&
      !haystack.includes("amount") &&
      !haystack.includes("gstno") &&
      !haystack.includes("gst no")) ||
    haystack.includes("percentage") ||
    (haystack.includes("percent") && !haystack.includes("amount"))
  ) {
    return "percentage";
  }

  if (
    haystack.includes("amount") ||
    haystack.includes("ratepersqf") ||
    haystack.includes("rate / sqf") ||
    haystack.includes("rate/sqf") ||
    /\brate\b/.test(haystack) ||
    haystack.includes("taxable") ||
    haystack.includes("discount") ||
    haystack.includes("balance") ||
    haystack.includes("outstanding") ||
    haystack.includes("paid") ||
    haystack.includes("grandtotal") ||
    haystack.includes("grand total") ||
    haystack.includes("expenseamount") ||
    haystack.includes("cgst") ||
    haystack.includes("sgst") ||
    haystack.includes("igst") ||
    (haystack.includes("gst") && haystack.includes("amount"))
  ) {
    return "currency";
  }

  if (
    haystack.includes("sheet") ||
    haystack.includes("quantity") ||
    haystack.includes("qty") ||
    haystack.includes("count") ||
    haystack.includes("leaves") ||
    haystack.includes("bundle") ||
    haystack.includes("pieces") ||
    haystack.includes("noof") ||
    haystack.includes("no. of") ||
    haystack.includes("totalitems") ||
    haystack.includes("itemcount") ||
    haystack.includes("ordercount") ||
    haystack.includes("productioncount") ||
    haystack.includes("availableunits") ||
    haystack.includes("totalunits")
  ) {
    return "quantity";
  }

  if (
    haystack.includes("length") ||
    haystack.includes("width") ||
    haystack.includes("thickness") ||
    haystack.includes("height") ||
    haystack.includes("diameter") ||
    haystack.includes("cmt")
  ) {
    return "measurement";
  }

  return "other";
}

/**
 * Format a cell/total value using field key/label heuristics.
 * Non-numeric / unrecognized fields are returned as-is (stringified).
 */
export function formatDisplayValueByField(
  value: unknown,
  key?: string,
  label?: string,
): string {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  const kind = classifyNumericField(key, label);

  switch (kind) {
    case "sqm":
      return formatSQM(value);
    case "sqf":
      return formatSQF(value);
    case "currency":
      return formatAmount(value);
    case "quantity":
      return formatQuantity(value);
    case "percentage":
      return formatPercentage(value);
    case "measurement":
      return formatMeasurement(value);
    default:
      return String(value);
  }
}

/** Input helpers — clamp decimal places without converting storage model. */
export function sanitizeAreaInput(raw: string): string {
  return sanitizeDecimalInput(raw, 3);
}

export function sanitizeAmountInput(raw: string): string {
  return sanitizeDecimalInput(raw, 2);
}

export function sanitizeQuantityInput(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function sanitizeDecimalInput(raw: string, maxDecimals: number): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");

  if (firstDot === -1) {
    return cleaned;
  }

  const whole = cleaned.slice(0, firstDot).replace(/\./g, "");
  const fraction = cleaned
    .slice(firstDot + 1)
    .replace(/\./g, "")
    .slice(0, maxDecimals);

  return `${whole}.${fraction}`;
}
