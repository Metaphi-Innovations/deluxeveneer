import {
  supplierMasterOptions,
} from "../../masters/shared/masterDefinitions";
import type { MasterFieldDefinition } from "../../masters/shared";
import type { WarehouseAAddStockSlug } from "./WarehouseAAddStockLineItems";

export const warehouseAInwardTypeOptions = [
  "Veneer Blocks",
  "Raw Veneer",
  "Plywood",
  "MDF",
] as const;

export type WarehouseAInwardTypeLabel =
  (typeof warehouseAInwardTypeOptions)[number];

const warehouseAInwardTypeBySlug: Record<
  Exclude<WarehouseAAddStockSlug, "consumables">,
  WarehouseAInwardTypeLabel
> = {
  "veneer-blocks": "Veneer Blocks",
  "raw-veneer": "Raw Veneer",
  plywood: "Plywood",
  mdf: "MDF",
};

const warehouseASlugByInwardType: Record<
  WarehouseAInwardTypeLabel,
  Exclude<WarehouseAAddStockSlug, "consumables">
> = {
  "Veneer Blocks": "veneer-blocks",
  "Raw Veneer": "raw-veneer",
  Plywood: "plywood",
  MDF: "mdf",
};

export const warehouseACurrencyOptions = ["INR", "USD", "Euro"] as const;
export const warehouseAInwardModeOptions = ["Road", "Rail", "Sea", "Air"] as const;

export function getWarehouseAInwardTypeLabel(
  slug: WarehouseAAddStockSlug,
): string {
  if (slug === "consumables") {
    return "Consumables";
  }

  return warehouseAInwardTypeBySlug[slug];
}

export function getWarehouseASlugFromInwardType(
  value: string,
): Exclude<WarehouseAAddStockSlug, "consumables"> | null {
  if (value in warehouseASlugByInwardType) {
    return warehouseASlugByInwardType[value as WarehouseAInwardTypeLabel];
  }

  return null;
}

export function isInrCurrency(value: unknown) {
  return typeof value === "string" && value.trim().toUpperCase() === "INR";
}

export function createWarehouseAAddStockHeaderFields(
  currency: string,
): MasterFieldDefinition[] {
  const fields: MasterFieldDefinition[] = [
    {
      key: "inwardDate",
      label: "Inward Date",
      type: "date",
      readOnly: true,
      required: true,
    },
    {
      key: "supplierName",
      label: "Supplier Name",
      type: "select",
      options: supplierMasterOptions,
      required: true,
    },
    {
      key: "invoiceNo",
      label: "Invoice No.",
      type: "text",
      required: true,
    },
    {
      key: "currency",
      label: "Currency",
      type: "select",
      options: [...warehouseACurrencyOptions],
      required: true,
    },
    {
      key: "mode",
      label: "Mode",
      type: "select",
      options: [...warehouseAInwardModeOptions],
    },
    {
      key: "eta",
      label: "ETA",
      type: "date",
    },
    {
      key: "etd",
      label: "ETD",
      type: "date",
    },
    {
      key: "attachment",
      label: "Attachment",
      type: "file",
    },
  ];

  if (!isInrCurrency(currency)) {
    fields.push({
      key: "exchangeRate",
      label: "Exchange Rate",
      type: "text",
      required: true,
    });
  }

  return fields;
}

export function buildWarehouseAAddStockInitialValues(
  slug: WarehouseAAddStockSlug,
) {
  return {
    currency: "INR",
    exchangeRate: "",
    eta: null,
    etd: null,
    inwardDate: new Date(),
    inwardType: getWarehouseAInwardTypeLabel(slug),
    invoiceNo: "",
    mode: "",
    attachment: "",
    supplierName: "",
  };
}
