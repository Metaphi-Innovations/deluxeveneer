import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import {
  consumablesDefinition,
  mdfDefinition,
  plywoodDefinition,
  rawVeneerDefinition,
  veneerBlocksDefinition,
} from "../../inventory/shared/inventoryDefinitions";
import {
  formatAmount as formatAmountShared,
  formatSqfFromSqm as formatSqfFromSqmShared,
  parseNumericValue,
  SQM_TO_SQF as SHARED_SQM_TO_SQF,
} from "../../shared/numberFormat";

export type WarehousePageId = "warehouse-a" | "warehouse-b" | "warehouse-c";
export type WarehouseInventorySlug =
  | "raw-veneer"
  | "veneer-blocks"
  | "plywood"
  | "mdf";
export type WarehouseAInventorySlug = WarehouseInventorySlug | "consumables";
export type WarehouseCInventorySlug = Exclude<
  WarehouseInventorySlug,
  "veneer-blocks"
>;
export type WarehouseARawVeneerTab = "purchase" | "production";
export type WarehouseBRawVeneerTab = "all" | WarehouseARawVeneerTab;

export type WarehouseInventoryRow = {
  id: string;
  inventoryRecordId: string;
  inventorySlug: WarehouseAInventorySlug;
  inwardSrNo: string;
  inwardType: string;
  inwardDate: Date;
  invoiceNo: string;
  referenceSrNo: string;
  supplierName: string;
  supplierItemName: string;
  supplierCode: string;
  itemName: string;
  category?: string;
  subCategory: string;
  unitName: string;
  color: string;
  palletNo: string;
  length: string;
  width: string;
  thickness: string;
  totalUnits: string;
  availableUnits: string;
  totalSqm: string;
  totalSqf: string;
  availableSqm: string;
  availableSqf: string;
  currency: string;
  amount: string;
  attachment?: string;
  consumables?: string;
  eta?: Date | string | null;
  etd?: Date | string | null;
  mode?: string;
  qcStatus: string;
  remark: string;
  status?: string;
  veneerSrNo: string;
  itemSrNo: string;
  mdfSrNo: string;
  timberCode: string;
  logCode: string;
  bundleNumber: string;
  palletNumber: string;
  noOfLeaves: string;
  processName: string;
  processColor: string;
  cutName: string;
  seriesName: string;
  grade: string;
  expenseAmount: string;
  totalNoOfSheets: string;
  avSheets: string;
  avSqm: string;
  avSqf: string;
  plywoodType: string;
  mdfType: string;
};

type WarehouseTableConfig = {
  columns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[];
  rows: readonly WarehouseInventoryRow[];
  title: string;
};

type WarehouseInventoryTabConfig = {
  columns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[];
  rows: readonly WarehouseInventoryRow[];
  title: string;
};

export type WarehouseAInventoryConfig = WarehouseInventoryTabConfig & {
  rawTabs?: Record<WarehouseARawVeneerTab, WarehouseInventoryTabConfig>;
};

const warehouseBaseColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "itemName", label: "Item Name" },
    { key: "mdfType", label: "MDF Type" },
    { key: "color", label: "Color" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalNoOfSheets", label: "No of Sheets" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "grade", label: "Grade" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

export const warehouseInvoiceListingColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "expenseAmount", label: "Expense Amount" },
    { key: "qcStatus", label: "QC Status" },
    { key: "remark", label: "Remark" },
  ];

const warehouseBColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [...warehouseBaseColumns, { key: "status", label: "Status" }];

const withQcStatusColumn = (
  columns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[],
): readonly EnterpriseTableColumn<WarehouseInventoryRow>[] => {
  const remarkIndex = columns.findIndex((column) => column.key === "remark");
  const consumablesColumn: EnterpriseTableColumn<WarehouseInventoryRow> = {
    key: "consumables",
    label: "Consumables",
  };
  const qcColumn: EnterpriseTableColumn<WarehouseInventoryRow> = {
    key: "qcStatus",
    label: "QC Status",
  };

  if (remarkIndex === -1) {
    return [...columns, consumablesColumn, qcColumn];
  }

  return [
    ...columns.slice(0, remarkIndex),
    consumablesColumn,
    qcColumn,
    ...columns.slice(remarkIndex),
  ];
};

const warehouseAVeneerColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "itemName", label: "Item Name" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "grade", label: "Grade" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

const warehouseARawProductionColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  warehouseAVeneerColumns;

const warehouseBRawVeneerColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  warehouseAVeneerColumns;

const warehouseBRawProductionColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  warehouseBRawVeneerColumns;

const warehouseAPlywoodColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "itemName", label: "Item Name" },
    { key: "color", label: "Color" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalNoOfSheets", label: "No of Sheets" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

const warehouseAMdfColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "invoiceNo", label: "Invoice No" },
    { key: "supplierName", label: "Supplier Name" },
    { key: "itemName", label: "Item Name" },
    { key: "mdfType", label: "MDF Type" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remarks" },
  ];

const warehouseAConsumablesColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardSrNo", label: "Inward Sr No" },
    { key: "inwardType", label: "Inward Type" },
    { key: "inwardDate", label: "Inward Date" },
    { key: "subCategory", label: "Category" },
    { key: "totalUnits", label: "Quantity" },
    { key: "availableUnits", label: "Available Quantity" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

const warehouseCVeneerColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "itemName", label: "Item Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "grade", label: "Grade" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

const warehouseCPlywoodColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "itemName", label: "Item Name" },
    { key: "subCategory", label: "Sub Category" },
    { key: "color", label: "Color" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "totalNoOfSheets", label: "No of Sheets" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remark" },
  ];

const warehouseCMdfColumns: readonly EnterpriseTableColumn<WarehouseInventoryRow>[] =
  [
    { key: "inwardDate", label: "Inward Date" },
    { key: "itemName", label: "Item Name" },
    { key: "mdfType", label: "MDF Type" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfLeaves", label: "No of Leaves" },
    { key: "totalSqm", label: "SQM" },
    { key: "totalSqf", label: "SQF" },
    { key: "currency", label: "Currency" },
    { key: "amount", label: "Amount" },
    { key: "remark", label: "Remarks" },
  ];

const warehouseAVeneerColumnsWithQc = withQcStatusColumn(warehouseAVeneerColumns);
const warehouseAPlywoodColumnsWithQc = withQcStatusColumn(warehouseAPlywoodColumns);
const warehouseAMdfColumnsWithQc = withQcStatusColumn(warehouseAMdfColumns);

const processNames = [
  "Slicing Ready",
  "Drying Ready",
  "Grouping Ready",
  "Pressing Ready",
  "Finishing Ready",
] as const;
const seriesNames = [
  "Reganto Classic",
  "Reganto Premier",
  "Marvel",
  "Canvas",
  "Bunito",
] as const;
const grades = ["A", "A+", "B+", "Premium", "Export"] as const;
const cuts = ["Quarter Cut", "Crown Cut", "Rift Cut", "Natural", "Flaky"] as const;
const veneerSubCategories = [
  "Natural Veneer",
  "Dyed Veneer",
  "Architectural Panel",
  "Structural Panel",
] as const;
const warehouseConsumables = [
  "Phenolic Resin",
  "Melamine Glue",
  "Edge Tape",
  "Sanding Belt",
  "Packing Strap",
] as const;

function pickCycledValue<const TValue extends string>(
  values: readonly TValue[],
  index: number,
): TValue {
  const fallback = values[0];
  return (values[index % values.length] ?? fallback)!;
}

function parseAmount(value: string) {
  return parseNumericValue(value) ?? 0;
}

function formatAmount(value: number) {
  return formatAmountShared(value);
}

const SQM_TO_SQF = SHARED_SQM_TO_SQF;

function formatSqfFromSqm(value: string) {
  return formatSqfFromSqmShared(value);
}

function buildExpenseAmount(amount: string, multiplier: number) {
  return formatAmount(parseAmount(amount) * multiplier);
}

function buildTimberCode(prefix: string, index: number) {
  return `${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function normalizeRawVeneerRow(
  row: Record<string, unknown>,
  idPrefix: string,
): WarehouseInventoryRow {
  const totalUnits = String(row.noOfLeavesSheets ?? "");
  const totalSqm = String(row.totalSqm ?? "");
  const approvalStatus = String(row.approvalStatus ?? "");
  const availableSqm = approvalStatus === "Approved" ? totalSqm : "0.000";
  const qcStatus = approvalStatus === "Approved" ? "done" : "pending";

  return {
    id: `${idPrefix}-${String(row.id ?? "")}`,
    inventoryRecordId: String(row.id ?? ""),
    inventorySlug: "raw-veneer",
    inwardSrNo: String(row.inwardSrNo ?? ""),
    inwardType: String(row.inwardType ?? ""),
    inwardDate: row.inwardDate instanceof Date ? row.inwardDate : new Date(),
    invoiceNo: String(row.invoiceNo ?? ""),
    referenceSrNo: String(row.veneerSrNo ?? ""),
    supplierName: String(row.supplierName ?? ""),
    supplierItemName: String(row.supplierItemName ?? ""),
    supplierCode: String(row.supplierCode ?? ""),
    itemName: String(row.itemName ?? ""),
    subCategory: String(row.subCategory ?? ""),
    unitName: "",
    color: String(row.timberColor ?? ""),
    palletNo: String(row.palletNo ?? ""),
    length: String(row.length ?? ""),
    width: String(row.width ?? ""),
    thickness: String(row.thickness ?? ""),
    totalUnits,
    availableUnits:
      approvalStatus === "Approved" ? totalUnits : `Hold ${totalUnits}`,
    totalSqm,
    totalSqf: formatSqfFromSqm(totalSqm),
    availableSqm,
    availableSqf: formatSqfFromSqm(availableSqm),
    currency: String(row.currency ?? ""),
    amount: String(row.amount ?? ""),
    consumables: "",
    qcStatus,
    remark: String(row.remark ?? ""),
    status:
      approvalStatus === "Approved"
        ? "QC Done"
        : approvalStatus === "On Hold"
          ? "QC Hold"
          : "QC Pending",
    veneerSrNo: String(row.veneerSrNo ?? ""),
    itemSrNo: "",
    mdfSrNo: "",
    timberCode: "",
    logCode: "",
    bundleNumber: String(row.bundleNumber ?? ""),
    palletNumber: String(row.palletNo ?? ""),
    noOfLeaves: totalUnits,
    processName: "",
    processColor: String(row.timberColor ?? ""),
    cutName: String(row.cutName ?? row.cut ?? row.subCategory ?? ""),
    seriesName: "",
    grade: String(row.grade ?? ""),
    expenseAmount: "",
    totalNoOfSheets: "",
    avSheets: "",
    avSqm: "",
    avSqf: "",
    plywoodType: "",
    mdfType: "",
  };
}

function normalizeStockRow(
  row: Record<string, unknown>,
  idPrefix: string,
  status = "QC Done",
): WarehouseInventoryRow {
  const totalSqm = String(row.totalSqm ?? "");
  const availableSqm = String(row.availableSqm ?? "");
  const qcStatus = status === "QC Done" ? "done" : "pending";

  return {
    id: `${idPrefix}-${String(row.id ?? "")}`,
    inventoryRecordId: String(row.id ?? ""),
    inventorySlug:
      idPrefix === "veneer-blocks"
        ? "veneer-blocks"
        : idPrefix === "plywood"
          ? "plywood"
          : "mdf",
    inwardSrNo: String(row.inwardSrNo ?? ""),
    inwardType: String(row.inwardType ?? ""),
    inwardDate: row.inwardDate instanceof Date ? row.inwardDate : new Date(),
    invoiceNo: String(row.invoiceNo ?? ""),
    referenceSrNo: String(row.itemSrNo ?? ""),
    supplierName: String(row.supplierName ?? ""),
    supplierItemName: String(row.supplierItemName ?? ""),
    supplierCode: String(row.supplierCode ?? ""),
    itemName: String(row.itemName ?? ""),
    subCategory: String(row.subCategory ?? ""),
    unitName: "",
    color: String(row.color ?? ""),
    palletNo: String(row.palletNo ?? ""),
    length: String(row.length ?? ""),
    width: String(row.width ?? ""),
    thickness: String(row.thickness ?? ""),
    totalUnits: String(row.totalNoOfSheets ?? ""),
    availableUnits: String(row.availableNoOfSheets ?? ""),
    totalSqm,
    totalSqf: formatSqfFromSqm(totalSqm),
    availableSqm,
    availableSqf: formatSqfFromSqm(availableSqm),
    currency: String(row.currency ?? ""),
    amount: String(row.amount ?? ""),
    consumables: "",
    qcStatus,
    remark: String(row.remark ?? ""),
    status,
    veneerSrNo: "",
    itemSrNo: String(row.itemSrNo ?? ""),
    mdfSrNo: "",
    timberCode: "",
    logCode: "",
    bundleNumber: "",
    palletNumber: String(row.palletNo ?? ""),
    noOfLeaves: String(row.noOfLeavesSheets ?? row.totalNoOfSheets ?? ""),
    processName: "",
    processColor: String(row.color ?? ""),
    cutName: String(row.cutName ?? row.cut ?? row.subCategory ?? ""),
    seriesName: "",
    grade: String(row.grade ?? ""),
    expenseAmount: "",
    totalNoOfSheets: String(row.totalNoOfSheets ?? ""),
    avSheets: String(row.availableNoOfSheets ?? ""),
    avSqm: availableSqm,
    avSqf: formatSqfFromSqm(availableSqm),
    plywoodType: String(row.plywoodType ?? ""),
    mdfType: String(row.plywoodType ?? ""),
  };
}

function mapWarehouseVeneerRow(
  row: Record<string, unknown>,
  index: number,
  options?: {
    dropSupplierFields?: boolean;
    dropInvoice?: boolean;
    idPrefix?: string;
    inventorySlug?: WarehouseAInventorySlug;
    status?: string;
  },
): WarehouseInventoryRow {
  const base = normalizeRawVeneerRow(
    row,
    options?.idPrefix ?? "warehouse-a-raw-veneer",
  );

  return {
    ...base,
    id: `${base.id}-${index + 1}`,
    inventorySlug: options?.inventorySlug ?? base.inventorySlug,
    inventoryRecordId: options?.dropSupplierFields
      ? `${base.inventoryRecordId}-production`
      : base.inventoryRecordId,
    invoiceNo: options?.dropInvoice ? "" : base.invoiceNo,
    supplierName: options?.dropSupplierFields ? "" : base.supplierName,
    supplierItemName: options?.dropSupplierFields ? "" : base.supplierItemName,
    supplierCode: options?.dropSupplierFields ? "" : base.supplierCode,
    timberCode: buildTimberCode("TMB", index),
    logCode: `LOG-${String(index + 1).padStart(4, "0")}`,
    bundleNumber: base.bundleNumber || `BDL-${String(index + 1).padStart(4, "0")}`,
    palletNumber: base.palletNumber || `PAL-${String(index + 1).padStart(2, "0")}`,
    processName: pickCycledValue(processNames, index),
    processColor: base.color,
    cutName: pickCycledValue(cuts, index),
    seriesName: pickCycledValue(seriesNames, index),
    grade: pickCycledValue(grades, index),
    expenseAmount: buildExpenseAmount(base.amount, 0.075),
    consumables: pickCycledValue(warehouseConsumables, index),
    status: options?.status ?? base.status ?? "",
  };
}

function mapWarehouseBRawVeneerRow(
  row: WarehouseInventoryRow,
  index: number,
  inwardType: "Purchase" | "Production",
): WarehouseInventoryRow {
  return {
    ...row,
    id: `warehouse-b-raw-${inwardType.toLowerCase()}-${index + 1}`,
    category: "Decorative Veneer",
    subCategory: pickCycledValue(veneerSubCategories, index),
    cutName: row.cutName || row.subCategory,
    inwardType,
    status: "QC Done",
  };
}

function mapWarehousePlywoodRow(
  row: Record<string, unknown>,
  index: number,
): WarehouseInventoryRow {
  const base = normalizeStockRow(row, "warehouse-a-plywood");

  return {
    ...base,
    id: `${base.id}-${index + 1}`,
    inventorySlug: "plywood",
    itemSrNo: base.itemSrNo || `ITM-PLY-${String(index + 1).padStart(3, "0")}`,
    palletNumber: base.palletNo,
    expenseAmount: buildExpenseAmount(base.amount, 0.0825),
    plywoodType: String(row.plywoodType ?? ""),
    consumables: pickCycledValue(warehouseConsumables, index + 1),
    qcStatus: index % 3 === 0 ? "done" : "pending",
    status: index % 3 === 0 ? "QC Done" : "QC Pending",
  };
}

function mapWarehouseMdfRow(
  row: Record<string, unknown>,
  index: number,
): WarehouseInventoryRow {
  const base = normalizeStockRow(row, "warehouse-a-mdf");

  return {
    ...base,
    id: `${base.id}-${index + 1}`,
    inventorySlug: "mdf",
    mdfSrNo: base.itemSrNo || `MDF-${String(index + 1).padStart(3, "0")}`,
    palletNumber: base.palletNo,
    expenseAmount: buildExpenseAmount(base.amount, 0.08),
    mdfType: String(row.plywoodType ?? ""),
    consumables: pickCycledValue(warehouseConsumables, index + 2),
    qcStatus: index % 3 === 0 ? "done" : "pending",
    status: index % 3 === 0 ? "QC Done" : "QC Pending",
  };
}

function mapWarehouseConsumableRow(
  row: Record<string, unknown>,
  index: number,
): WarehouseInventoryRow {
  return {
    id: `warehouse-a-consumables-${String(row.id ?? "")}-${index + 1}`,
    inventoryRecordId: String(row.id ?? ""),
    inventorySlug: "consumables",
    inwardSrNo: String(row.inwardSrNo ?? ""),
    inwardType: String(row.inwardType ?? ""),
    inwardDate: row.inwardDate instanceof Date ? row.inwardDate : new Date(),
    invoiceNo: String(row.invoiceNo ?? ""),
    referenceSrNo: String(row.itemSrNo ?? ""),
    supplierName: String(row.supplierName ?? ""),
    supplierItemName: String(row.supplierItemName ?? ""),
    supplierCode: "",
    itemName: String(row.itemName ?? ""),
    subCategory: String(row.subCategory ?? ""),
    unitName: String(row.unitName ?? ""),
    color: "",
    palletNo: "",
    length: "",
    width: "",
    thickness: "",
    totalUnits: String(row.quantity ?? ""),
    availableUnits: String(row.availableQuantity ?? ""),
    totalSqm: "",
    totalSqf: "",
    availableSqm: "",
    availableSqf: "",
    currency: String(row.currency ?? ""),
    amount: String(row.amount ?? ""),
    consumables: String(row.itemName ?? ""),
    qcStatus: "",
    remark: String(row.remark ?? ""),
    status: "",
    veneerSrNo: "",
    itemSrNo: String(row.itemSrNo ?? ""),
    mdfSrNo: "",
    timberCode: "",
    logCode: "",
    bundleNumber: "",
    palletNumber: "",
    noOfLeaves: "",
    processName: "",
    processColor: "",
    cutName: "",
    seriesName: "",
    grade: "",
    expenseAmount: "",
    totalNoOfSheets: "",
    avSheets: "",
    avSqm: "",
    avSqf: "",
    plywoodType: "",
    mdfType: "",
  };
}

const rawRows = rawVeneerDefinition.rows.map((row) =>
  normalizeRawVeneerRow(row as Record<string, unknown>, "raw-veneer"),
);
const veneerBlockRows = veneerBlocksDefinition.rows.map((row) =>
  normalizeStockRow(row as Record<string, unknown>, "veneer-blocks"),
);
const plywoodRows = plywoodDefinition.rows.map((row) =>
  normalizeStockRow(row as Record<string, unknown>, "plywood"),
);
const mdfRows = mdfDefinition.rows.map((row) =>
  normalizeStockRow(row as Record<string, unknown>, "mdf"),
);

const warehouseAVeneerBlockRows = rawVeneerDefinition.rows.map((row, index) =>
  mapWarehouseVeneerRow(
    {
      ...row,
      veneerSrNo:
        (row as Record<string, unknown>).veneerSrNo ??
        `VNR-${String(index + 1).padStart(5, "0")}`,
    } as Record<string, unknown>,
    index,
    { idPrefix: "warehouse-a-veneer-blocks", inventorySlug: "veneer-blocks" },
  ),
);

const warehouseARawPurchaseRows = rawVeneerDefinition.rows.map((row, index) =>
  mapWarehouseVeneerRow(row as Record<string, unknown>, index, {
    idPrefix: "warehouse-a-raw-purchase",
  }),
);

const warehouseARawProductionRows = rawVeneerDefinition.rows.map((row, index) =>
  mapWarehouseVeneerRow(
    {
      ...row,
      inwardType: "Production",
      invoiceNo: "",
      supplierName: "",
      supplierItemName: "",
      supplierCode: "",
      remark: `Issued from ${pickCycledValue(processNames, index)}.`,
    } as Record<string, unknown>,
    index,
    {
      dropSupplierFields: true,
      dropInvoice: true,
      idPrefix: "warehouse-a-raw-production",
    },
  ),
);

const warehouseBRawPurchaseRows = warehouseARawPurchaseRows.map((row, index) =>
  mapWarehouseBRawVeneerRow(row, index, "Purchase"),
);

const warehouseBRawProductionRows = warehouseARawProductionRows.map((row, index) =>
  mapWarehouseBRawVeneerRow(row, index, "Production"),
);

const warehouseBRawAllRows = warehouseBRawPurchaseRows
  .flatMap((row, index) => {
    const productionRow = warehouseBRawProductionRows[index];

    return productionRow
      ? [
          row,
          {
            ...productionRow,
            invoiceNo: "-",
            supplierName: "-",
          },
        ]
      : [row];
  })
  .slice(0, 12);

const warehouseAPlywoodRows = plywoodDefinition.rows.map((row, index) =>
  mapWarehousePlywoodRow(row as Record<string, unknown>, index),
);

const warehouseAMdfRows = mdfDefinition.rows.map((row, index) =>
  mapWarehouseMdfRow(row as Record<string, unknown>, index),
);
const warehouseAConsumablesRows = consumablesDefinition.rows.map((row, index) =>
  mapWarehouseConsumableRow(row as Record<string, unknown>, index),
);

const warehouseARows: readonly WarehouseInventoryRow[] = [
  ...warehouseAVeneerBlockRows.slice(0, 12),
  ...warehouseARawPurchaseRows.slice(0, 12),
];

const warehouseBRows: readonly WarehouseInventoryRow[] = [
  ...rawRows.slice(0, 12).map((row) => ({ ...row, status: "QC Done" })),
  ...veneerBlockRows.slice(0, 12).map((row) => ({ ...row, status: "QC Done" })),
];

const warehouseCRows: readonly WarehouseInventoryRow[] = [
  ...rawRows.slice(0, 12),
  ...plywoodRows.slice(0, 12),
];

export const warehouseAInventoryConfigs: Record<
  WarehouseAInventorySlug,
  WarehouseAInventoryConfig
> = {
  "veneer-blocks": {
    title: "Veneer Blocks",
    columns: warehouseAVeneerColumnsWithQc,
    rows: warehouseAVeneerBlockRows,
  },
  "raw-veneer": {
    title: "Raw Veneer",
    columns: warehouseAVeneerColumnsWithQc,
    rows: warehouseARawPurchaseRows,
  },
  plywood: {
    title: "Plywood",
    columns: warehouseAPlywoodColumnsWithQc,
    rows: warehouseAPlywoodRows,
  },
  mdf: {
    title: "MDF",
    columns: warehouseAMdfColumnsWithQc,
    rows: warehouseAMdfRows,
  },
  consumables: {
    title: "Consumables",
    columns: warehouseAConsumablesColumns,
    rows: warehouseAConsumablesRows,
  },
};

export const warehouseRawVeneerTabConfigs: Record<
  WarehouseARawVeneerTab,
  WarehouseInventoryTabConfig
> = {
  purchase: {
    title: "Purchase",
    columns: warehouseAVeneerColumnsWithQc,
    rows: warehouseARawPurchaseRows,
  },
  production: {
    title: "Production",
    columns: withQcStatusColumn(warehouseARawProductionColumns),
    rows: warehouseARawProductionRows,
  },
};

export const warehouseBRawVeneerTabConfigs: Record<
  WarehouseBRawVeneerTab,
  WarehouseInventoryTabConfig
> = {
  all: {
    title: "All",
    columns: warehouseBRawVeneerColumns,
    rows: warehouseBRawAllRows,
  },
  purchase: {
    title: "Purchase",
    columns: warehouseBRawVeneerColumns,
    rows: warehouseBRawPurchaseRows,
  },
  production: {
    title: "Production",
    columns: warehouseBRawProductionColumns,
    rows: warehouseBRawProductionRows,
  },
};

export const warehouseBInspectionConfigs: Record<
  "pending" | "done",
  WarehouseInventoryTabConfig
> = {
  pending: {
    title: "Veneer Blocks",
    columns: warehouseAVeneerColumns,
    rows: cloneWarehouseInspectionRows(
      takeWarehouseInspectionRows(
        warehouseAInventoryConfigs["veneer-blocks"].rows,
        0,
        12,
      ),
      "Inspection Pending",
    ),
  },
  done: {
    title: "Veneer Blocks",
    columns: warehouseAVeneerColumns,
    rows: cloneWarehouseInspectionRows(
      takeWarehouseInspectionRows(
        warehouseAInventoryConfigs["veneer-blocks"].rows,
        0,
        12,
      ),
      "Inspection Done",
    ),
  },
};

export const warehouseBInventoryConfigs: Record<
  WarehouseInventorySlug,
  WarehouseInventoryTabConfig
> = {
  "veneer-blocks": {
    title: "Veneer Blocks",
    columns: warehouseAVeneerColumns,
    rows: veneerBlockRows,
  },
  "raw-veneer": {
    title: "Raw Veneer",
    columns: warehouseAVeneerColumns,
    rows: warehouseBRawAllRows,
  },
  plywood: {
    title: "Plywood",
    columns: warehouseAPlywoodColumns,
    rows: plywoodRows,
  },
  mdf: {
    title: "MDF",
    columns: warehouseAMdfColumns,
    rows: mdfRows,
  },
};

function takeWarehouseInspectionRows(
  rows: readonly WarehouseInventoryRow[],
  start: number,
  end: number,
) {
  const windowedRows = rows.slice(start, end);

  return windowedRows.length > 0 ? windowedRows : rows.slice(0, 12);
}

function cloneWarehouseInspectionRows(
  rows: readonly WarehouseInventoryRow[],
  status: "Inspection Pending" | "Inspection Done",
) {
  return rows.map((row) => ({
    ...row,
    status,
  }));
}

export const warehouseCInventoryConfigs: Record<
  WarehouseCInventorySlug,
  WarehouseInventoryTabConfig
> = {
  "raw-veneer": {
    title: "Raw Veneer",
    columns: warehouseCVeneerColumns,
    rows: rawRows.slice(0, 12),
  },
  plywood: {
    title: "Plywood",
    columns: warehouseCPlywoodColumns,
    rows: plywoodRows.slice(0, 12),
  },
  mdf: {
    title: "MDF",
    columns: warehouseCMdfColumns,
    rows: mdfRows.slice(0, 12),
  },
};

export const warehouseTableConfigs: Record<
  WarehousePageId,
  WarehouseTableConfig
> = {
  "warehouse-a": {
    title: "Warehouse A",
    columns: warehouseBaseColumns,
    rows: warehouseARows,
  },
  "warehouse-b": {
    title: "Warehouse B",
    columns: warehouseBColumns,
    rows: warehouseBRows,
  },
  "warehouse-c": {
    title: "Warehouse C",
    columns: warehouseBaseColumns,
    rows: warehouseCRows,
  },
};
