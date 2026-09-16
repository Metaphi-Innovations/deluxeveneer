import { useSyncExternalStore } from "react";

import type {
  EnterpriseTableColumn,
  EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import {
  getOrderRecordByOrderNo,
  getOrderVariantFromType,
  updateOrderRecord,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import { formatAmount, formatSQM, formatSQF } from "../../shared/numberFormat";

export type PackingTabValue = "done" | "issued";
export type DispatchTabValue = "done" | "issued";
export type PackingRecordState = "dispatched" | "done" | "issued" | "reverted";

export const packingOrderTypeOptions = ["Raw", "Finished"] as const;

export interface PackingRecord extends EnterpriseTableRow {
  packingId: string;
  issuedFrom: string;
  orderNo: string;
  orderItemNo: string;
  customerName: string;
  orderType: string;
  productCategory: string;
  preparedBy: string;
  checkedBy: string;
  itemName: string;
  length: string;
  width: string;
  thickness: string;
  noOfSheets: string;
  sqm: string;
  sqf: string;
  series: string;
  grade: string;
  amount: string;
  remark: string;
  sourceOrderId?: string;
  sourceOrderItemId?: string;
  dispatchBuyerAddress?: string;
  dispatchSellerAddress?: string;
  dispatchTransactionType?: string;
  dispatchTransporter?: string;
  dispatchTransportMode?: string;
  dispatchTotalQuantity?: string;
  dispatchTotalSqf?: string;
  dispatchGrandTotal?: string;
  packingDate: Date | null;
  dispatchDate: Date | null;
  createdBy: string;
  updatedBy: string;
  createdDate: Date;
  updatedDate: Date;
  packingState: PackingRecordState;
}

export const packingIssuedListingColumns: readonly EnterpriseTableColumn<PackingRecord>[] =
  [
    { key: "orderNo", label: "Order No" },
    { key: "orderItemNo", label: "Order Item No" },
    { key: "customerName", label: "Customer" },
    { key: "orderType", label: "Order Type" },
    { key: "itemName", label: "Product" },
    { key: "noOfSheets", label: "Qty" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "issuedFrom", label: "Ready From", filterable: true },
    { key: "remark", label: "Source Reference" },
  ];

export const packingDoneListingColumns: readonly EnterpriseTableColumn<PackingRecord>[] =
  [
    { key: "packingId", label: "Packing Ref" },
    { key: "orderNo", label: "Order No" },
    { key: "orderItemNo", label: "Order Item No" },
    { key: "customerName", label: "Customer" },
    { key: "orderType", label: "Order Type" },
    { key: "itemName", label: "Product" },
    { key: "noOfSheets", label: "Packed Qty" },
    { key: "packingDate", label: "Packing Date" },
    { key: "issuedFrom", label: "Ready From" },
  ];

/** @deprecated Prefer packingDoneListingColumns; kept for compatibility. */
export const packingListingColumns = packingDoneListingColumns;

export const dispatchIssuedListingColumns: readonly EnterpriseTableColumn<PackingRecord>[] =
  [
    { key: "packingId", label: "Packing Ref" },
    { key: "orderNo", label: "Order No" },
    { key: "orderItemNo", label: "Order Item No" },
    { key: "customerName", label: "Customer" },
    { key: "orderType", label: "Order Type" },
    { key: "itemName", label: "Product" },
    { key: "noOfSheets", label: "Packed Qty" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "packingDate", label: "Packing Date" },
  ];

export const dispatchDoneListingColumns: readonly EnterpriseTableColumn<PackingRecord>[] =
  [
    { key: "packingId", label: "Packing Ref" },
    { key: "orderNo", label: "Order No" },
    { key: "orderItemNo", label: "Order Item No" },
    { key: "customerName", label: "Customer" },
    { key: "dispatchTransporter", label: "Transporter" },
    { key: "dispatchTransportMode", label: "Transport Mode" },
    { key: "noOfSheets", label: "Qty" },
    { key: "dispatchDate", label: "Dispatch Date" },
    { key: "remark", label: "Remark" },
  ];

const packingListeners = new Set<() => void>();
let packingRecords = createPackingRecords();
let packingIdSequence = getInitialPackingIdSequence(packingRecords);

export function usePackingRecords() {
  return useSyncExternalStore(
    subscribeToPackingStore,
    getPackingRecordsSnapshot,
    getPackingRecordsSnapshot,
  );
}

export function getPackingRecord(recordId: string) {
  return packingRecords.find((record) => record.id === recordId);
}

export function getPackingRecordsByTab(tab: PackingTabValue) {
  return packingRecords.filter((record) =>
    tab === "issued"
      ? record.packingState === "issued"
      : record.packingState === "done",
  );
}

export function getDispatchRecordsByTab(tab: DispatchTabValue) {
  return packingRecords.filter((record) =>
    tab === "issued"
      ? record.packingState === "done"
      : record.packingState === "dispatched",
  );
}

export function updatePackingRecord(
  recordId: string,
  updates: Partial<PackingRecord>,
) {
  updatePackingRecords((records) =>
    records.map((record) =>
      record.id === recordId
        ? {
            ...record,
            ...updates,
          }
        : record,
    ),
  );
}

export function markPackingDone(
  recordId: string,
  payload: {
    packingDate?: Date | null;
    remark?: string;
  } = {},
) {
  const record = getPackingRecord(recordId);
  if (!record || record.packingState !== "issued") {
    return;
  }

  const timestamp = new Date();
  const packingDate =
    payload.packingDate instanceof Date ? payload.packingDate : timestamp;
  const packingId =
    record.packingId.trim().length > 0
      ? record.packingId
      : allocatePackingId();

  updatePackingRecords((records) =>
    records.map((entry) =>
      entry.id === recordId
        ? {
            ...entry,
            packingId,
            packingDate,
            remark:
              payload.remark !== undefined
                ? normalizeString(payload.remark, entry.remark)
                : entry.remark,
            packingState: "done",
            updatedBy: "Packing Supervisor",
            updatedDate: timestamp,
          }
        : entry,
    ),
  );

  syncOrderFulfillmentStatus(record.orderNo);
}

export function markDispatchDone(
  recordId: string,
  payload: {
    dispatchDate?: Date | null;
    dispatchTransporter?: string;
    dispatchTransportMode?: string;
    remark?: string;
  } = {},
) {
  const record = getPackingRecord(recordId);
  if (!record || record.packingState !== "done") {
    return;
  }

  const timestamp = new Date();

  updatePackingRecords((records) =>
    records.map((entry) =>
      entry.id === recordId
        ? applyDispatchDone(entry, payload, timestamp)
        : entry,
    ),
  );

  syncOrderFulfillmentStatus(record.orderNo);
}

export function revertPackingRecord(recordId: string) {
  const record = getPackingRecord(recordId);
  const timestamp = new Date();

  updatePackingRecords((records) =>
    records.map((entry) =>
      entry.id === recordId
        ? {
            ...entry,
            packingState: "reverted",
            updatedBy: "Packing Supervisor",
            updatedDate: timestamp,
          }
        : entry,
    ),
  );

  if (record) {
    syncOrderFulfillmentStatus(record.orderNo);
  }
}

export function revertDispatchEntry(recordId: string) {
  const record = getPackingRecord(recordId);
  const timestamp = new Date();

  updatePackingRecords((records) =>
    records.map((entry) =>
      entry.id === recordId
        ? {
            ...entry,
            dispatchDate: null,
            packingState: "done",
            updatedBy: "Dispatch Coordinator",
            updatedDate: timestamp,
          }
        : entry,
    ),
  );

  if (record) {
    syncOrderFulfillmentStatus(record.orderNo);
  }
}

export function dispatchPackingRecord(recordId: string) {
  markDispatchDone(recordId);
}

export function createPackingEntry(
  recordId: string | undefined,
  payload: {
    amount?: string;
    checkedBy?: string;
    completeImmediately?: boolean;
    customerName?: string;
    issuedFrom?: string;
    itemName?: string;
    length?: string;
    noOfSheets?: string;
    orderNo?: string;
    orderItemNo?: string;
    orderType?: string;
    packingDate?: Date | null;
    preparedBy?: string;
    productCategory?: string;
    remark?: string;
    sourceOrderId?: string;
    sourceOrderItemId?: string;
    sqf?: string;
    sqm?: string;
    thickness?: string;
    width?: string;
  },
) {
  const timestamp = new Date();
  const completeImmediately = payload.completeImmediately === true;
  const packingDate =
    payload.packingDate instanceof Date ? payload.packingDate : timestamp;

  if (!recordId) {
    const nextRecordNumber = packingRecords.length + 1;
    const orderNo = normalizeString(
      payload.orderNo,
      `ORD-RAW-${String(1000 + nextRecordNumber).padStart(4, "0")}`,
    );
    const packingId = completeImmediately ? allocatePackingId() : "";

    updatePackingRecords((records) => [
      {
        id: `packing-${nextRecordNumber}`,
        packingId,
        issuedFrom: normalizeString(payload.issuedFrom, "Manual Entry"),
        orderNo,
        orderItemNo: normalizeString(payload.orderItemNo, "OI-001"),
        customerName: normalizeString(payload.customerName, "New Customer"),
        orderType: normalizeString(payload.orderType, "Raw"),
        productCategory: normalizeString(payload.productCategory, "Raw"),
        preparedBy: normalizeString(payload.preparedBy, "Packing Supervisor"),
        checkedBy: normalizeString(payload.checkedBy, "Quality Coordinator"),
        itemName: normalizeString(payload.itemName, "Packing Item"),
        length: normalizeString(payload.length, "2440 mm"),
        width: normalizeString(payload.width, "1220 mm"),
        thickness: normalizeString(payload.thickness, "0.60 mm"),
        noOfSheets: normalizeString(payload.noOfSheets, "0"),
        sqm: normalizeString(payload.sqm, "0.000"),
        sqf: normalizeString(payload.sqf, "0.000"),
        series: "DV-Prime",
        grade: "A",
        amount: normalizeString(payload.amount, "18,500.00"),
        remark: normalizeString(payload.remark, ""),
        ...(payload.sourceOrderId
          ? { sourceOrderId: payload.sourceOrderId }
          : {}),
        ...(payload.sourceOrderItemId
          ? { sourceOrderItemId: payload.sourceOrderItemId }
          : {}),
        packingDate: completeImmediately ? packingDate : null,
        dispatchDate: null,
        createdBy: "Packing Supervisor",
        updatedBy: "Packing Supervisor",
        createdDate: timestamp,
        updatedDate: timestamp,
        packingState: completeImmediately ? "done" : "issued",
      },
      ...records,
    ]);

    syncOrderFulfillmentStatus(orderNo);
    return;
  }

  const existing = getPackingRecord(recordId);
  if (!existing) {
    return;
  }

  updatePackingRecords((records) =>
    records.map((record) => {
      if (record.id !== recordId) {
        return record;
      }

      const nextPackingId =
        completeImmediately && record.packingId.trim().length === 0
          ? allocatePackingId()
          : record.packingId;

      return {
        ...record,
        customerName: normalizeString(payload.customerName, record.customerName),
        orderNo: normalizeString(payload.orderNo, record.orderNo),
        orderItemNo: normalizeString(payload.orderItemNo, record.orderItemNo),
        orderType: normalizeString(payload.orderType, record.orderType),
        productCategory: normalizeString(
          payload.productCategory,
          record.productCategory,
        ),
        preparedBy: normalizeString(payload.preparedBy, record.preparedBy),
        checkedBy: normalizeString(payload.checkedBy, record.checkedBy),
        issuedFrom: normalizeString(payload.issuedFrom, record.issuedFrom),
        itemName: normalizeString(payload.itemName, record.itemName),
        length: normalizeString(payload.length, record.length),
        width: normalizeString(payload.width, record.width),
        thickness: normalizeString(payload.thickness, record.thickness),
        noOfSheets: normalizeString(payload.noOfSheets, record.noOfSheets),
        sqm: normalizeString(payload.sqm, record.sqm),
        sqf: normalizeString(payload.sqf, record.sqf),
        amount: normalizeString(payload.amount, record.amount),
        remark: normalizeString(payload.remark, record.remark),
        ...(payload.sourceOrderId
          ? { sourceOrderId: payload.sourceOrderId }
          : {}),
        ...(payload.sourceOrderItemId
          ? { sourceOrderItemId: payload.sourceOrderItemId }
          : {}),
        packingId: nextPackingId,
        packingDate: completeImmediately
          ? packingDate
          : payload.packingDate instanceof Date
            ? payload.packingDate
            : record.packingDate,
        packingState: completeImmediately ? "done" : record.packingState,
        updatedBy: "Packing Supervisor",
        updatedDate: timestamp,
      };
    }),
  );

  syncOrderFulfillmentStatus(
    normalizeString(payload.orderNo, existing.orderNo),
  );
}

export function createDispatchEntry(
  recordId: string,
  payload: {
    customerName?: string;
    dispatchDate?: Date | null;
    dispatchGrandTotal?: string;
    dispatchTotalQuantity?: string;
    dispatchTotalSqf?: string;
    dispatchBuyerAddress?: string;
    dispatchSellerAddress?: string;
    dispatchTransactionType?: string;
    dispatchTransporter?: string;
    dispatchTransportMode?: string;
    orderType?: string;
    productCategory?: string;
    remark?: string;
  },
) {
  const record = getPackingRecord(recordId);
  if (!record || record.packingState !== "done") {
    return;
  }

  const timestamp = new Date();

  updatePackingRecords((records) =>
    records.map((entry) => {
      if (entry.id !== recordId) {
        return entry;
      }

      const dispatched = applyDispatchDone(
        entry,
        {
          ...(payload.dispatchDate !== undefined
            ? { dispatchDate: payload.dispatchDate }
            : {}),
          ...(payload.dispatchTransporter !== undefined
            ? { dispatchTransporter: payload.dispatchTransporter }
            : {}),
          ...(payload.dispatchTransportMode !== undefined
            ? { dispatchTransportMode: payload.dispatchTransportMode }
            : {}),
          ...(payload.remark !== undefined ? { remark: payload.remark } : {}),
        },
        timestamp,
      );

      return {
        ...dispatched,
        customerName: normalizeString(payload.customerName, dispatched.customerName),
        orderType: normalizeString(payload.orderType, dispatched.orderType),
        productCategory: normalizeString(
          payload.productCategory,
          dispatched.productCategory,
        ),
        dispatchBuyerAddress: normalizeString(
          payload.dispatchBuyerAddress,
          dispatched.dispatchBuyerAddress ?? "",
        ),
        dispatchSellerAddress: normalizeString(
          payload.dispatchSellerAddress,
          dispatched.dispatchSellerAddress ?? "",
        ),
        dispatchTransactionType: normalizeString(
          payload.dispatchTransactionType,
          dispatched.dispatchTransactionType ?? "",
        ),
        dispatchTotalQuantity: normalizeString(
          payload.dispatchTotalQuantity,
          dispatched.dispatchTotalQuantity ?? dispatched.noOfSheets,
        ),
        dispatchTotalSqf: normalizeString(
          payload.dispatchTotalSqf,
          dispatched.dispatchTotalSqf ?? dispatched.sqf,
        ),
        dispatchGrandTotal: normalizeString(
          payload.dispatchGrandTotal,
          dispatched.dispatchGrandTotal ?? dispatched.amount,
        ),
      };
    }),
  );

  syncOrderFulfillmentStatus(record.orderNo);
}

export function syncOrderFulfillmentStatus(orderNo: string) {
  const order = getOrderRecordByOrderNo(orderNo);
  if (!order) {
    return;
  }

  const currentStatus = normalizeStatus(order.status);
  if (currentStatus === "cancelled") {
    return;
  }

  const related = packingRecords.filter(
    (record) =>
      record.orderNo.trim().toLowerCase() === orderNo.trim().toLowerCase() &&
      record.packingState !== "reverted",
  );

  if (related.length === 0) {
    return;
  }

  const hasIssued = related.some((record) => record.packingState === "issued");
  const hasDone = related.some((record) => record.packingState === "done");
  const allDispatched = related.every(
    (record) => record.packingState === "dispatched",
  );

  let nextStatus: string | null = null;
  if (hasIssued) {
    nextStatus = "Packing Scheduled";
  } else if (hasDone || allDispatched) {
    nextStatus = "Ready for Dispatch";
  }

  if (!nextStatus || normalizeStatus(order.status) === normalizeStatus(nextStatus)) {
    return;
  }

  updateOrderRecord(order.id, { status: nextStatus });
}

export function isRawOrderPackingEligible(order: OrderRecord) {
  const status = normalizeStatus(order.status);
  if (status === "draft" || status === "cancelled") {
    return false;
  }

  if (getOrderVariantFromType(order.orderType) !== "raw") {
    return false;
  }

  return (
    status === "confirmed" ||
    status === "in production" ||
    status === "packing scheduled" ||
    status === "ready for dispatch"
  );
}

export function isFinishedOrderPackingEligible(order: OrderRecord) {
  const variant = getOrderVariantFromType(order.orderType);
  if (variant === null || variant === "raw") {
    return false;
  }

  const status = normalizeStatus(order.status);
  return status === "packing scheduled" || status === "ready for dispatch";
}

export function isOrderItemPackingEligible(order: OrderRecord) {
  const variant = getOrderVariantFromType(order.orderType);
  if (variant === "raw") {
    return isRawOrderPackingEligible(order);
  }

  if (variant === null) {
    return false;
  }

  return isFinishedOrderPackingEligible(order);
}

export function getPackingPaths() {
  return {
    list: "/packing",
    add: (id?: string) => (id ? `/packing/add/${id}` : "/packing/add"),
    edit: (id: string) => `/packing/edit/${id}`,
    view: (id: string) => `/packing/view/${id}`,
  };
}

function applyDispatchDone(
  record: PackingRecord,
  payload: {
    dispatchDate?: Date | null;
    dispatchTransporter?: string;
    dispatchTransportMode?: string;
    remark?: string;
  },
  timestamp: Date,
): PackingRecord {
  return {
    ...record,
    dispatchDate:
      payload.dispatchDate instanceof Date ? payload.dispatchDate : timestamp,
    dispatchTransporter: normalizeString(
      payload.dispatchTransporter,
      record.dispatchTransporter ?? "",
    ),
    dispatchTransportMode: normalizeString(
      payload.dispatchTransportMode,
      record.dispatchTransportMode ?? "",
    ),
    remark:
      payload.remark !== undefined
        ? normalizeString(payload.remark, record.remark)
        : record.remark,
    packingState: "dispatched",
    updatedBy: "Dispatch Coordinator",
    updatedDate: timestamp,
  };
}

function allocatePackingId() {
  packingIdSequence += 1;
  return `PKG-2026-${String(packingIdSequence).padStart(4, "0")}`;
}

function getInitialPackingIdSequence(records: PackingRecord[]) {
  let max = 0;

  for (const record of records) {
    const match = /^PKG-2026-(\d+)$/.exec(record.packingId.trim());
    if (!match) {
      continue;
    }

    const value = Number(match[1]);
    if (Number.isFinite(value) && value > max) {
      max = value;
    }
  }

  return max;
}

function subscribeToPackingStore(listener: () => void) {
  packingListeners.add(listener);

  return () => {
    packingListeners.delete(listener);
  };
}

function getPackingRecordsSnapshot() {
  return packingRecords;
}

function updatePackingRecords(
  updater: (records: PackingRecord[]) => PackingRecord[],
) {
  packingRecords = updater(packingRecords);
  packingListeners.forEach((listener) => listener());
}

function normalizeString(value: string | undefined, fallback: string) {
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

function normalizeStatus(status: string) {
  return status.trim().toLowerCase();
}

function createPackingRecords(): PackingRecord[] {
  const finishedIssuedFromValues = [
    "Finishing",
    "Pressing",
    "CNC",
  ] as const;
  const orderTypes = [...packingOrderTypeOptions];
  const rawProductCategories = ["Veneer", "Plywood", "MDF"] as const;
  const finishedProductCategories = [
    "Marquetry",
    "Fluted",
    "Embossed",
    "Decorative",
  ] as const;
  const itemNames = [
    "Oak Veneer Panel",
    "Walnut Decorative Sheet",
    "Teak Feature Board",
    "Ash Crown Cut Panel",
    "Smoked Oak Veneer",
    "Natural Walnut Sheet",
  ] as const;
  const seriesValues = [
    "DV-Prime",
    "DV-Select",
    "DV-Architect",
    "DV-Craft",
  ] as const;
  const gradeValues = ["A+", "A", "B+", "B"] as const;
  const customerNames = [
    "Aster Interior Studio",
    "Northwood Projects",
    "Urban Craft Furnishings",
    "Heritage Office Systems",
    "Maple Edge Exports",
    "Royal Habitat",
  ] as const;
  const dispatchTransporters = [
    "Amardeep Cargo Logistic",
    "National Freight Carrier",
    "Deluxe Transport Services",
    "Blue Sky Air Cargo",
  ] as const;
  const dispatchTransportModes = ["Road", "Air", "Rail", "Ship"] as const;
  const dispatchTransactionTypes = [
    "REGULAR",
    "BILL TO SHIP TO",
    "BILL FORM DISPATCH FROM",
    "BILL TO SHIP TO AND BILL FROM DISPATCH FROM",
  ] as const;
  const dispatchBuyerAddresses = [
    "At Bhatpore",
    "Corporate Office, SG Highway",
    "Factory Billing Address",
    "Northwood Projects Registered Office",
  ] as const;
  const dispatchSellerAddresses = [
    "Plot No 317 325, Vill Karoli",
    "Deluxe Veneers Factory",
    "Deluxe Veneers Warehouse",
    "Deluxe Veneers Dispatch Office",
  ] as const;
  const pickValue = <Value,>(values: readonly Value[], index: number) =>
    values[index % values.length]!;

  return Array.from({ length: 6 }, (_, index) => {
    const rowNumber = index + 1;
    const createdDate = new Date(2026, 5, 1 + (index % 25));
    const updatedDate = new Date(2026, 5, 3 + (index % 25));
    const lengthMm = 2400 + (index % 6) * 50;
    const widthMm = 1200 + (index % 4) * 25;
    const noOfSheets = 20 + (index % 8) * 4;
    const sqm = (lengthMm / 1000) * (widthMm / 1000) * noOfSheets;
    const sqf = sqm * 10.7639;
    const packingState: PackingRecordState =
      index < 2 ? "issued" : index < 4 ? "done" : "dispatched";
    const orderType = pickValue(orderTypes, index);
    const isRawOrder = orderType === "Raw";
    const orderPrefix = isRawOrder ? "ORD-RAW" : "ORD-FIN";
    const issuedFrom = isRawOrder
      ? "Warehouse C"
      : pickValue(finishedIssuedFromValues, index);
    const sourceReference = isRawOrder
      ? `WH-C-REF-${String(rowNumber).padStart(4, "0")}`
      : `${issuedFrom.slice(0, 3).toUpperCase()}-JOB-${String(rowNumber).padStart(4, "0")}`;
    const updatedBy =
      packingState === "issued"
        ? "Packing Supervisor"
        : packingState === "done"
          ? "Quality Coordinator"
          : "Dispatch Coordinator";

    return {
      id: `packing-${rowNumber}`,
      packingId:
        packingState === "issued"
          ? ""
          : `PKG-2026-${String(rowNumber).padStart(4, "0")}`,
      issuedFrom,
      orderNo: `${orderPrefix}-${String(1000 + rowNumber).padStart(4, "0")}`,
      orderItemNo: `OI-${String((index % 5) + 1).padStart(3, "0")}`,
      customerName: pickValue(customerNames, index),
      orderType,
      productCategory: isRawOrder
        ? pickValue(rawProductCategories, index)
        : pickValue(finishedProductCategories, index),
      preparedBy: "Packing Supervisor",
      checkedBy: "Quality Coordinator",
      itemName: pickValue(itemNames, index),
      length: `${lengthMm} mm`,
      width: `${widthMm} mm`,
      thickness: `${(0.5 + (index % 5) * 0.1).toFixed(2)} mm`,
      noOfSheets: String(noOfSheets),
      sqm: formatSQM(sqm),
      sqf: formatSQF(sqf),
      series: pickValue(seriesValues, index),
      grade: pickValue(gradeValues, index),
      amount: formatAmount(18500 + index * 875),
      remark:
        packingState === "issued"
          ? sourceReference
          : packingState === "dispatched"
            ? `Dispatched via ${pickValue(dispatchTransporters, index)}`
            : "",
      ...(packingState === "dispatched"
        ? {
            dispatchBuyerAddress: pickValue(dispatchBuyerAddresses, index),
            dispatchSellerAddress: pickValue(dispatchSellerAddresses, index),
            dispatchTransactionType: pickValue(dispatchTransactionTypes, index),
            dispatchTransporter: pickValue(dispatchTransporters, index),
            dispatchTransportMode: pickValue(dispatchTransportModes, index),
            dispatchTotalQuantity: String(noOfSheets),
            dispatchTotalSqf: formatSQF(sqf),
            dispatchGrandTotal: formatAmount(18500 + index * 875),
          }
        : {}),
      packingDate: packingState === "issued" ? null : createdDate,
      dispatchDate: packingState === "dispatched" ? updatedDate : null,
      createdBy: index < 2 ? "Packing Planner" : "Packing Operator",
      updatedBy,
      createdDate,
      updatedDate,
      packingState,
    } satisfies PackingRecord;
  });
}
