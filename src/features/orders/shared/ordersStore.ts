import { useSyncExternalStore } from "react";

import type {
  EnterpriseTableColumn,
  EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import { buildLocalMasterDefinition } from "../../masters/shared/localMasterStore";
import {
  customerMasterDefinition,
  itemMasterDefinition,
} from "../../masters/shared/masterDefinitions";
import type { MasterFieldDefinition, MasterRecord } from "../../masters/shared";
import {
  formatAmount,
  formatSQM,
  formatSqfFromSqm as formatSqfFromSqmShared,
  parseNumericValue,
  SQM_TO_SQF,
} from "../../shared/numberFormat";

const sqmToSqf = SQM_TO_SQF;

export interface OrderLineItem {
  id: string;
  productCategory: string;
  finishedType: string;
  salesItemName: string;
  itemName: string;
  subCategory: string;
  series: string;
  grade: string;
  length: string;
  width: string;
  thickness: string;
  quantitySheets: string;
  sqm: string;
  totalSqm: string;
  ratePerSqf: string;
  baseType: string;
  baseName: string;
  baseLength: string;
  baseWidth: string;
  baseThickness: string;
  amount: string;
  remark: string;
}

export interface OrderRecord extends EnterpriseTableRow {
  orderNo: string;
  orderDate: Date;
  customerName: string;
  orderType: string;
  priority: string;
  productCategory: string;
  itemName: string;
  subCategory: string;
  series: string;
  grade: string;
  length: string;
  width: string;
  thickness: string;
  quantitySheets: string;
  sqm: string;
  totalSqm: string;
  amount: string;
  remark: string;
  deliveryDate: Date;
  salesCoordinator: string;
  createdBy: string;
  updatedBy: string;
  createdDate: Date;
  updatedDate: Date;
  status: string;
}

export interface OrderDraft {
  amount?: string;
  customerName?: string;
  deliveryDate?: Date;
  grade?: string;
  itemName?: string;
  length?: string;
  lineItems?: OrderLineItem[];
  orderDate?: Date;
  orderNo?: string;
  orderType?: string;
  priority?: string;
  productCategory?: string;
  quantitySheets?: string;
  salesCoordinator?: string;
  series?: string;
  status?: string;
  subCategory?: string;
  thickness?: string;
  sqm?: string;
  totalSqm?: string;
  width?: string;
  remark?: string;
}

export type OrderCreateVariant =
  | "order"
  | "raw"
  | "marquetry"
  | "decorative"
  | "fluted"
  | "embossed"
  | "finished";

export type OrderCreateOption = {
  label: string;
  value: OrderCreateVariant;
};

export type OrderModuleConfig = {
  basePath: string;
  createOptions: readonly OrderCreateOption[];
  permissionKey: string;
  title: string;
};

export const ordersCreateOptions: readonly OrderCreateOption[] = [
  { label: "Order", value: "order" },
];

export const orderModuleCreateOptions: readonly OrderCreateOption[] =
  ordersCreateOptions;

/** @deprecated Specialty process styles belong on Finished Order line items (Finished Type). */
export const specialtyOrderCreateOptions: readonly OrderCreateOption[] = [
  { label: "Marquetry Order", value: "marquetry" },
  { label: "Decorative Order", value: "decorative" },
  { label: "Fluted Order", value: "fluted" },
  { label: "Embossed Order", value: "embossed" },
];

const allOrderCreateOptions = [
  ...ordersCreateOptions,
  ...specialtyOrderCreateOptions,
];

export const orderCreateOptions = ordersCreateOptions;

export const ordersModuleConfig: OrderModuleConfig = {
  basePath: "/orders",
  createOptions: ordersCreateOptions,
  permissionKey: "placeOrder",
  title: "Orders",
};

export const orderModuleConfig: OrderModuleConfig = {
  basePath: "/orders",
  createOptions: orderModuleCreateOptions,
  permissionKey: "placeOrder",
  title: "Orders",
};

export const orderListingColumns: readonly EnterpriseTableColumn<OrderRecord>[] =
  [
    { key: "orderDate", label: "Order Date" },
    { key: "customerName", label: "Customer Name", filterable: true },
    { key: "orderNo", label: "Order No" },
    { key: "orderItemNumber", label: "Order Item No" },
    { key: "rawMaterial", label: "Product Type", filterable: true },
    { key: "itemName", label: "Item Name", filterable: true },
    { key: "quantitySheets", label: "No of Sheets" },
    { key: "priority", label: "Priority", filterable: true },
    { key: "dispatchQuantity", label: "Dispatch Quantity" },
    { key: "issuedQuantity", label: "Issued Quantity" },
    { key: "remark", label: "Remark" },
    { key: "createdBy", label: "Created By" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedBy", label: "Updated By" },
    { key: "updatedDate", label: "Updated Date" },
  ];

export const orderTypeOptions = orderCreateOptions.map((option) => option.label);

export const productCategoryOptions = [
  "Veneer",
  "Plywood",
  "MDF",
  "Decorative",
  "Marquetry",
  "Fluted",
  "Embossed",
] as const;

export const subCategoryOptions = getItemMasterSubCategoryOptions();
export const priorityOptions = ["Standard", "Urgent"] as const;

export const seriesOptions = [
  "DV-Architect",
  "DV-Craft",
  "DV-Prime",
  "DV-Select",
] as const;

export const gradeOptions = ["A+", "A", "B+", "B"] as const;

const salesCoordinatorOptions = [
  "Aarav Bansal",
  "Neha Sharma",
  "Ritika Soni",
  "Vikram Mehta",
] as const;

const statusOptions = [
  "Draft",
  "Confirmed",
  "In Production",
  "Packing Scheduled",
  "Ready for Dispatch",
  "Cancelled",
] as const;

export const orderFormFields: readonly MasterFieldDefinition[] =
  getOrderFormFields();

export function getOrderFormFields(): readonly MasterFieldDefinition[] {
  return [
    {
      key: "orderNo",
      label: "Order No",
      type: "text",
    },
    {
      key: "orderDate",
      label: "Order Date",
      type: "date",
      required: true,
    },
    {
      key: "customerName",
      label: "Customer Name",
      type: "select",
      options: getOrderCustomerOptions(),
    },
    {
      key: "priority",
      label: "Priority",
      type: "select",
      options: [...priorityOptions],
    },
    {
      key: "remark",
      label: "Remark",
      type: "text",
      required: false,
    },
  ];
}

export function getCreateOrderFormFields(
  variant: OrderCreateVariant,
): readonly MasterFieldDefinition[] {
  const orderTypeLabel = getOrderVariantLabel(variant);

  return getOrderFormFields()
    .filter((field) => field.key !== "orderNo")
    .map((field) =>
      field.key === "orderType"
        ? {
            ...field,
            options: [orderTypeLabel],
            placeholder: orderTypeLabel,
            readOnly: true,
          }
        : field,
    );
}

export function getOrderCustomerRows(): MasterRecord[] {
  return buildLocalMasterDefinition(customerMasterDefinition).rows;
}

export function getOrderCustomerOptions() {
  return Array.from(
    new Set(
      getOrderCustomerRows()
        .filter(
          (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
        )
        .map((row) => String(row.customerName ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getItemMasterSubCategoryOptions() {
  return Array.from(
    new Set(
      buildLocalMasterDefinition(itemMasterDefinition).rows
        .filter(
          (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
        )
        .map((row) => String(row.subCategory ?? "").trim())
        .filter(Boolean),
    ),
  );
}

export const orderViewFields: readonly MasterFieldDefinition[] = [
  ...orderFormFields,
  {
    key: "createdBy",
    label: "Created By",
    type: "text",
  },
  {
    key: "updatedBy",
    label: "Updated By",
    type: "text",
  },
  {
    key: "createdDate",
    label: "Created Date",
    type: "date",
  },
  {
    key: "updatedDate",
    label: "Updated Date",
    type: "date",
  },
];

export function getOrderVariantLabel(variant: OrderCreateVariant) {
  return (
    allOrderCreateOptions.find((option) => option.value === variant)?.label ??
    "Order"
  );
}

export function getOrderVariantFromType(
  orderType: string | null | undefined,
): OrderCreateVariant | null {
  if (!orderType) {
    return null;
  }

  const normalizedType = orderType.trim().toLowerCase();

  if (normalizedType === "order") {
    return "order";
  }

  if (normalizedType.includes("marquetry")) {
    return "marquetry";
  }

  if (normalizedType.includes("decorative")) {
    return "decorative";
  }

  if (normalizedType.includes("fluted")) {
    return "fluted";
  }

  if (normalizedType.includes("embossed")) {
    return "embossed";
  }

  if (normalizedType.includes("finished")) {
    return "finished";
  }

  if (normalizedType.includes("raw")) {
    return "raw";
  }

  return null;
}

export function getOrderCreateVariant(
  value: string | null | undefined,
): OrderCreateVariant {
  return (
    allOrderCreateOptions.find((option) => option.value === value)?.value ??
    "order"
  );
}

const orderListeners = new Set<() => void>();
const initialOrderState = createInitialOrderState();
let orderRecords = initialOrderState.records;
const orderLineItemsById = initialOrderState.lineItemsById;

export function useOrderRecords() {
  return useSyncExternalStore(
    subscribeToOrdersStore,
    getOrdersSnapshot,
    getOrdersSnapshot,
  );
}

export function getOrderRecord(recordId: string) {
  return orderRecords.find((record) => record.id === recordId);
}

export function getOrderRecordByOrderNo(orderNo: string) {
  const normalized = orderNo.trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  return orderRecords.find(
    (record) => record.orderNo.trim().toLowerCase() === normalized,
  );
}

export function getOrderLineItems(recordId: string) {
  return [...(orderLineItemsById.get(recordId) ?? [])];
}

export function createOrderRecord(order: Partial<OrderDraft>) {
  const timestamp = new Date();
  const recordCount = orderRecords.length + 1;
  const salesCoordinator = normalizeString(
    order.salesCoordinator,
    "Aarav Bansal",
  );
  const lineItems = normalizeLineItems(order.lineItems);
  const record = applyOrderLineItemSummary(
    {
      id: `order-${recordCount}`,
      orderNo: normalizeString(
        order.orderNo,
        `ORD-DV-${String(2000 + recordCount).padStart(4, "0")}`,
      ),
      orderDate: order.orderDate instanceof Date ? order.orderDate : timestamp,
      customerName: normalizeString(order.customerName, "New Customer"),
      orderType: normalizeString(order.orderType, "Raw Order"),
      priority: normalizeString(order.priority, "Standard"),
      productCategory: normalizeString(order.productCategory, "Raw Veneer"),
      itemName: normalizeString(order.itemName, "Oak Veneer Panel"),
      subCategory: normalizeString(order.subCategory, "Quarter Cut"),
      series: normalizeString(order.series, "DV-Prime"),
      grade: normalizeString(order.grade, "A"),
      length: normalizeString(order.length, "2440 mm"),
      width: normalizeString(order.width, "1220 mm"),
      thickness: normalizeString(order.thickness, "0.60 mm"),
      quantitySheets: normalizeString(order.quantitySheets, "24"),
      sqm: normalizeString(order.sqm, "7.280"),
      totalSqm: normalizeString(order.totalSqm, "78.400"),
      amount: normalizeOrderCurrency(order.amount, 185000 + recordCount * 2500),
      remark: normalizeString(order.remark, ""),
      deliveryDate:
        order.deliveryDate instanceof Date
          ? order.deliveryDate
          : new Date(
              timestamp.getFullYear(),
              timestamp.getMonth(),
              timestamp.getDate() + 12,
            ),
      salesCoordinator,
      createdBy: salesCoordinator,
      updatedBy: salesCoordinator,
      createdDate: timestamp,
      updatedDate: timestamp,
      status: normalizeString(order.status, "Draft"),
    },
    lineItems,
  );

  orderRecords = [record, ...orderRecords];
  orderLineItemsById.set(record.id, lineItems);
  emitOrdersChange();

  return record.id;
}

export function updateOrderRecord(
  recordId: string,
  updates: Partial<OrderDraft>,
) {
  const timestamp = new Date();
  const existingLineItems = orderLineItemsById.get(recordId) ?? [];
  const nextLineItems = updates.lineItems
    ? normalizeLineItems(updates.lineItems)
    : existingLineItems;

  orderRecords = orderRecords.map((record) =>
    record.id === recordId
      ? applyOrderLineItemSummary(
          {
            ...record,
            ...sanitizeOrderDraft(updates),
            updatedBy: normalizeString(
              updates.salesCoordinator,
              record.salesCoordinator || record.updatedBy,
            ),
            updatedDate: timestamp,
          },
          nextLineItems,
        )
      : record,
  );

  orderLineItemsById.set(recordId, nextLineItems);
  emitOrdersChange();
}

export function cancelOrderRecord(recordId: string) {
  const timestamp = new Date();

  orderRecords = orderRecords.map((record) =>
    record.id === recordId
      ? {
          ...record,
          status: "Cancelled",
          updatedBy: "Order Desk",
          updatedDate: timestamp,
        }
      : record,
  );

  emitOrdersChange();
}

export function getOrdersPaths(basePath = "/orders") {
  return {
    list: basePath,
    add: `${basePath}/add`,
    edit: (id: string) => `${basePath}/edit/${id}`,
    view: (id: string) => `${basePath}/view/${id}`,
  };
}

function subscribeToOrdersStore(listener: () => void) {
  orderListeners.add(listener);

  return () => {
    orderListeners.delete(listener);
  };
}

function getOrdersSnapshot() {
  return orderRecords;
}

function emitOrdersChange() {
  orderListeners.forEach((listener) => listener());
}

function sanitizeOrderDraft(updates: Partial<OrderDraft>): Partial<OrderRecord> {
  const { lineItems: _lineItems, amount, ...recordUpdates } = updates;

  return {
    ...recordUpdates,
    ...(typeof amount !== "undefined"
      ? { amount: normalizeOrderCurrency(amount) }
      : {}),
  };
}

function normalizeLineItems(
  lineItems: readonly OrderLineItem[] | undefined,
): OrderLineItem[] {
  if (!Array.isArray(lineItems)) {
    return [];
  }

  return lineItems.map((item, index) => {
    const sqm = normalizeString(item.sqm, "7.280");
    const totalSqf = formatSqfFromSqm(sqm, item.totalSqm);
    const ratePerSqf = normalizeString(item.ratePerSqf, "2,360.00");

    return {
      id: item.id || `order-line-item-${index + 1}`,
      productCategory: normalizeString(item.productCategory, ""),
      finishedType: normalizeString(item.finishedType, ""),
      salesItemName: normalizeString(item.salesItemName, ""),
      itemName: normalizeString(item.itemName, "Oak Veneer Panel"),
      subCategory: normalizeString(item.subCategory, "Quarter Cut"),
      series: normalizeString(item.series, "DV-Prime"),
      grade: normalizeString(item.grade, "A"),
      length: normalizeString(item.length, "2440 mm"),
      width: normalizeString(item.width, "1220 mm"),
      thickness: normalizeString(item.thickness, "0.60 mm"),
      quantitySheets: normalizeString(item.quantitySheets, "24"),
      sqm,
      totalSqm: totalSqf,
      ratePerSqf,
      baseType: normalizeString(item.baseType, ""),
      baseName: normalizeString(item.baseName, ""),
      baseLength: normalizeString(item.baseLength, ""),
      baseWidth: normalizeString(item.baseWidth, ""),
      baseThickness: normalizeString(item.baseThickness, ""),
      amount: calculateAmountFromSqf(totalSqf, ratePerSqf, item.amount),
      remark: normalizeString(item.remark, ""),
    };
  });
}

function applyOrderLineItemSummary(
  record: OrderRecord,
  lineItems: readonly OrderLineItem[],
) {
  if (lineItems.length === 0) {
    return record;
  }

  const firstItem = lineItems[0]!;
  const totalQuantitySheets = lineItems.reduce(
    (sum, item) => sum + parseNumberValue(item.quantitySheets),
    0,
  );
  const totalSqm = lineItems.reduce(
    (sum, item) => sum + parseNumberValue(item.totalSqm),
    0,
  );
  const totalOrderSqm = lineItems.reduce(
    (sum, item) => sum + parseNumberValue(item.sqm),
    0,
  );
  const totalAmount = lineItems.reduce(
    (sum, item) => sum + parseNumberValue(item.amount),
    0,
  );

  return {
    ...record,
    productCategory: firstItem.productCategory || record.productCategory,
    itemName: firstItem.itemName,
    subCategory: firstItem.subCategory,
    series: firstItem.series,
    grade: firstItem.grade,
    length: firstItem.length,
    width: firstItem.width,
    thickness: firstItem.thickness,
    quantitySheets:
      totalQuantitySheets > 0
        ? String(totalQuantitySheets)
        : firstItem.quantitySheets,
    sqm:
      totalOrderSqm > 0
        ? totalOrderSqm.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })
        : firstItem.sqm,
    totalSqm:
      totalSqm > 0
        ? totalSqm.toLocaleString("en-US", {
            minimumFractionDigits: 3,
            maximumFractionDigits: 3,
          })
        : firstItem.totalSqm,
    remark: firstItem.remark,
    amount:
      totalAmount > 0
        ? normalizeOrderCurrency(String(totalAmount), totalAmount)
        : normalizeOrderCurrency(firstItem.amount),
  };
}

function normalizeString(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function formatCurrencyAmount(value: number) {
  return formatAmount(value);
}

function normalizeOrderCurrency(value: string | undefined, fallback = 185000) {
  if (!value || value.trim().length === 0) {
    return formatCurrencyAmount(fallback);
  }

  const numericCandidate = parseNumericValue(value);

  if (numericCandidate === null) {
    return formatCurrencyAmount(fallback);
  }

  return formatCurrencyAmount(numericCandidate);
}

function normalizeCurrency(value: string | undefined, fallback = 185000) {
  return normalizeOrderCurrency(value, fallback);
}

function parseNumberValue(value: string | undefined) {
  return parseNumericValue(value) ?? 0;
}

function formatAreaValue(value: number) {
  return formatSQM(value);
}

function formatSqfFromSqm(sqm: string, fallbackSqf?: string) {
  return formatSqfFromSqmShared(sqm, fallbackSqf);
}

function calculateAmountFromSqf(
  sqf: string,
  ratePerSqf: string,
  fallbackAmount?: string,
) {
  const sqfValue = parseNumberValue(sqf);
  const rateValue = parseNumberValue(ratePerSqf);

  if (sqfValue > 0 && rateValue > 0) {
    return formatCurrencyAmount(sqfValue * rateValue);
  }

  return normalizeOrderCurrency(fallbackAmount, 185000);
}

function createInitialOrderState() {
  const customerNames = [
    "Aster Interior Studio",
    "Heritage Office Systems",
    "Maple Edge Exports",
    "Northwood Projects",
    "Royal Habitat",
    "Urban Craft Furnishings",
  ] as const;
  const rawItemNames = [
    "Ash Crown Cut Panel",
    "Oak Veneer Panel",
    "Smoked Oak Veneer",
    "Teak Feature Board",
    "Walnut Decorative Sheet",
    "Walnut Feature Slab",
  ] as const;
  const finishedItemNames = [
    "Marquetry Walnut Panel",
    "Fluted Oak Wall Panel",
    "Embossed Teak Sheet",
    "Decorative Ash Panel",
    "Prelam MDF Walnut",
    "Calibrated Board 18mm",
  ] as const;
  const seedRemarks = [
    "Priority customer finish.",
    "Match existing lot shade.",
    "Pack for dispatch planning.",
    "Confirm final surface before packing.",
    "Use latest approved sample.",
    "Hold for supervisor review.",
  ] as const;
  const finishedTypes = ["Marquetry", "Fluted", "Embossed", "Decorative"] as const;
  const baseTypes = ["Plywood", "MDF"] as const;
  const coordinators = [...salesCoordinatorOptions];
  const records: OrderRecord[] = [];
  const lineItemsById = new Map<string, OrderLineItem[]>();
  const pickValue = <Value,>(values: readonly Value[], index: number) =>
    values[index % values.length]!;

  const createLineItem = ({
    itemIndex,
    recordNumber,
    variant,
  }: {
    itemIndex: number;
    recordNumber: number;
    variant: "raw" | "finished";
  }): OrderLineItem => {
    const isFinished = variant === "finished";
    const sequence = recordNumber * 3 + itemIndex;
    const lengthMm = (isFinished ? 2100 : 2400) + (sequence % 7) * 85;
    const widthMm = (isFinished ? 900 : 1200) + (sequence % 5) * 45;
    const thickness = isFinished
      ? 0.65 + (sequence % 6) * 0.15
      : 0.55 + (sequence % 5) * 0.1;
    const quantitySheets = (isFinished ? 10 : 18) + (sequence % 9) * 4;
    const sqm = (lengthMm / 1000) * (widthMm / 1000) * quantitySheets;
    const sqf = sqm * sqmToSqf;
    const ratePerSqf = (isFinished ? 245 : 180) + (sequence % 8) * 17.5;
    const amount = sqf * ratePerSqf;
    const finishedType = pickValue(finishedTypes, sequence);
    const itemName = pickValue(isFinished ? finishedItemNames : rawItemNames, sequence);
    const productCategory = isFinished
      ? "Finished Goods"
      : pickValue(productCategoryOptions, sequence);
    const baseType = pickValue(baseTypes, sequence);

    return {
      id: `order-line-item-${recordNumber}-${itemIndex + 1}`,
      productCategory,
      finishedType: isFinished ? finishedType : "",
      salesItemName: isFinished ? `${finishedType} ${itemName}` : "",
      itemName,
      subCategory: pickValue(subCategoryOptions, sequence),
      series: pickValue(seriesOptions, sequence),
      grade: pickValue(gradeOptions, sequence),
      length: `${lengthMm} mm`,
      width: `${widthMm} mm`,
      thickness: `${thickness.toFixed(2)} mm`,
      quantitySheets: String(quantitySheets),
      sqm: formatAreaValue(sqm),
      totalSqm: formatAreaValue(sqf),
      ratePerSqf: formatCurrencyAmount(ratePerSqf),
      baseType: isFinished ? baseType : "",
      baseName: isFinished ? `${baseType} Base ${String(sequence).padStart(2, "0")}` : "",
      baseLength: isFinished ? `${lengthMm} mm` : "",
      baseWidth: isFinished ? `${widthMm} mm` : "",
      baseThickness: isFinished ? `${12 + (sequence % 5) * 3} mm` : "",
      amount: formatCurrencyAmount(amount),
      remark: itemIndex === 0 ? pickValue(seedRemarks, sequence) : "",
    };
  };

  const createSeedOrder = (variant: "raw" | "finished", index: number) => {
    const isFinished = variant === "finished";
    const recordNumber = isFinished ? index + 31 : index + 1;
    const orderDate = new Date(2026, isFinished ? 6 : 5, 1 + (index % 25));
    const deliveryDate = new Date(2026, isFinished ? 7 : 6, 4 + (index % 20));
    const createdDate = new Date(2026, isFinished ? 6 : 5, 1 + (index % 25));
    const updatedDate = new Date(2026, isFinished ? 6 : 5, 3 + (index % 25));
    const salesCoordinator = pickValue(coordinators, index);
    const itemCount = index % 10 === 0 ? 3 : index % 4 === 0 ? 2 : 1;
    const lineItems = Array.from({ length: itemCount }, (_, itemIndex) =>
      createLineItem({ itemIndex, recordNumber, variant }),
    );
    const firstItem = lineItems[0]!;
    const record = applyOrderLineItemSummary(
      {
        id: `order-${variant}-${index + 1}`,
        orderNo: `ORD-${isFinished ? "FIN" : "RAW"}-${String(202600 + index + 1).padStart(6, "0")}`,
      orderDate,
      customerName: pickValue(customerNames, index),
        orderType: isFinished ? "Finished Order" : "Raw Order",
        priority: index % 3 === 0 ? "Urgent" : "Standard",
        productCategory: firstItem.productCategory,
        itemName: firstItem.itemName,
        subCategory: firstItem.subCategory,
        series: firstItem.series,
        grade: firstItem.grade,
        length: firstItem.length,
        width: firstItem.width,
        thickness: firstItem.thickness,
        quantitySheets: firstItem.quantitySheets,
        sqm: firstItem.sqm,
        totalSqm: firstItem.totalSqm,
        amount: firstItem.amount,
        remark: firstItem.remark,
      deliveryDate,
      salesCoordinator,
      createdBy: salesCoordinator,
      updatedBy: index % 3 === 0 ? "Order Desk" : salesCoordinator,
      createdDate,
      updatedDate,
      status: pickValue(statusOptions, index),
      },
      lineItems,
    );

    records.push(record);
    lineItemsById.set(record.id, lineItems);
  };

  Array.from({ length: 2 }, (_, index) => createSeedOrder("raw", index));
  Array.from({ length: 2 }, (_, index) => createSeedOrder("finished", index));

  return { records, lineItemsById };
}
