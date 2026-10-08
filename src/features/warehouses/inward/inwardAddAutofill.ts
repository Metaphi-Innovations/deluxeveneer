import {
  warehouseACurrencyOptions,
  warehouseAInwardModeOptions,
} from "../../inventory/shared/warehouseAAddStockConfig";
import type { MasterFieldValue } from "../../masters/shared";
import { getSupplierMasterOptions } from "../../masters/shared/masterDefinitions";

/** Pick first non-empty option; empty string if none (never invent dropdown values). */
export function pickFirstOption(
  options: readonly string[] | null | undefined,
): string {
  if (!options?.length) return "";
  for (const option of options) {
    const trimmed = String(option ?? "").trim();
    if (trimmed) return trimmed;
  }
  return "";
}

/** Only keep value when it exists in options (case-sensitive match used by ErpSelectField). */
export function coerceSelectValue(
  value: string | null | undefined,
  options: readonly string[] | null | undefined,
): string {
  const trimmed = String(value ?? "").trim();
  if (!trimmed || !options?.length) return "";
  return options.includes(trimmed) ? trimmed : "";
}

export function buildInwardHeaderAutofillValues(
  current: Record<string, MasterFieldValue>,
): Record<string, MasterFieldValue> {
  const supplierOptions = getSupplierMasterOptions();
  const supplierName =
    coerceSelectValue(
      typeof current.supplierName === "string" ? current.supplierName : "",
      supplierOptions,
    ) || pickFirstOption(supplierOptions);

  const currencyOptions = [...warehouseACurrencyOptions];
  const currency =
    coerceSelectValue(
      typeof current.currency === "string" ? current.currency : "",
      currencyOptions,
    ) || pickFirstOption(currencyOptions) || "INR";

  const modeOptions = [...warehouseAInwardModeOptions];
  const mode =
    coerceSelectValue(
      typeof current.mode === "string" ? current.mode : "",
      modeOptions,
    ) || pickFirstOption(modeOptions);

  const stamp = Date.now().toString().slice(-6);

  return {
    ...current,
    inwardDate:
      current.inwardDate instanceof Date ? current.inwardDate : new Date(),
    supplierName,
    invoiceNo:
      typeof current.invoiceNo === "string" && current.invoiceNo.trim()
        ? current.invoiceNo
        : `TEST-INV-${stamp}`,
    currency,
    mode,
    eta: current.eta instanceof Date ? current.eta : new Date(),
    etd: current.etd instanceof Date ? current.etd : new Date(),
    exchangeRate:
      currency.toUpperCase() === "INR"
        ? ""
        : typeof current.exchangeRate === "string" && current.exchangeRate.trim()
          ? current.exchangeRate
          : "1",
    remark:
      typeof current.remark === "string" && current.remark.trim()
        ? current.remark
        : "Autofill test inward",
  };
}
