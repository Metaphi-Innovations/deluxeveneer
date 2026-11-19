import {
  type DispatchTabValue,
  type PackingRecord,
  type PackingRecordState,
  type PackingTabValue,
} from "./shared/packingStore";
import { formatAmount, formatSQF, formatSQM } from "../shared/numberFormat";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 30, 0, 0);
  return date;
}

const customers = [
  "Aster Interior Studio",
  "Northwood Projects",
  "Urban Craft Furnishings",
  "Heritage Office Systems",
  "Maple Edge Exports",
  "Royal Habitat",
] as const;

const products = [
  "Oak Veneer Panel",
  "Walnut Decorative Sheet",
  "Teak Feature Board",
  "Ash Crown Cut Panel",
  "Smoked Oak Veneer",
  "Natural Walnut Sheet",
] as const;

const readyFrom = ["Finishing", "Pressing", "CNC", "Warehouse C"] as const;
const people = [
  "Packing Operator",
  "Quality Coordinator",
  "Packing Supervisor",
  "Dispatch Coordinator",
] as const;
const transporters = [
  "Amardeep Cargo Logistic",
  "National Freight Carrier",
  "Deluxe Transport Services",
  "Blue Sky Air Cargo",
] as const;
const transportModes = ["Road", "Air", "Rail", "Ship"] as const;
const transactionTypes = [
  "REGULAR",
  "BILL TO SHIP TO",
  "BILL FORM DISPATCH FROM",
  "BILL TO SHIP TO AND BILL FROM DISPATCH FROM",
] as const;
const buyerAddresses = [
  "At Bhatpore",
  "Corporate Office, SG Highway",
  "Factory Billing Address",
  "Northwood Projects Registered Office",
] as const;
const sellerAddresses = [
  "Plot No 317 325, Vill Karoli",
  "Deluxe Veneers Factory",
  "Deluxe Veneers Warehouse",
  "Deluxe Veneers Dispatch Office",
] as const;

function buildPackingDummyRecord(
  index: number,
  packingState: PackingRecordState,
): PackingRecord {
  const sequence = String(index + 1).padStart(4, "0");
  const lengthMm = 2400 + index * 50;
  const widthMm = 1200 + (index % 3) * 25;
  const sheets = 16 + index * 4;
  const sqmValue = (lengthMm / 1000) * (widthMm / 1000) * sheets;
  const createdDate = daysAgo(10 - index);
  const packingDate =
    packingState === "issued" ? null : daysAgo(6 - (index % 4));
  const dispatchDate =
    packingState === "dispatched" ? daysAgo(2 - (index % 2)) : null;
  const isRaw = index % 2 === 1;
  const issuedFrom = isRaw
    ? "Warehouse C"
    : readyFrom[index % readyFrom.length]!;
  const transporter = transporters[index % transporters.length]!;

  return {
    id: `dummy-packing-${packingState}-${sequence}`,
    packingId:
      packingState === "issued"
        ? ""
        : `PKG-2026-${String(
            (packingState === "done"
              ? 1000
              : packingState === "dispatchIssued"
                ? 2000
                : 3000) + index + 1,
          ).padStart(4, "0")}`,
    issuedFrom,
    orderNo: `${isRaw ? "ORD-RAW" : "ORD-FIN"}-${String(2100 + index)}`,
    orderItemNo: `OI-${String((index % 4) + 1).padStart(3, "0")}`,
    customerName: customers[index % customers.length]!,
    orderType: isRaw ? "Raw" : "Finished",
    productCategory: isRaw
      ? index % 2 === 0
        ? "Veneer"
        : "Plywood"
      : index % 2 === 0
        ? "Decorative"
        : "Marquetry",
    preparedBy: "Packing Supervisor",
    checkedBy: "Quality Coordinator",
    itemName: products[index % products.length]!,
    length: `${lengthMm} mm`,
    width: `${widthMm} mm`,
    thickness: `${(0.6 + index * 0.1).toFixed(2)} mm`,
    noOfSheets: String(sheets),
    sqm: formatSQM(sqmValue),
    sqf: formatSQF(sqmValue * 10.7639),
    series: index % 2 === 0 ? "DV-Prime" : "DV-Select",
    grade: index % 2 === 0 ? "A+" : "A",
    amount: formatAmount(18500 + index * 875),
    remark:
      packingState === "issued"
        ? `${issuedFrom.slice(0, 3).toUpperCase()}-REF-${sequence}`
        : packingState === "dispatched"
          ? `Dispatched via ${transporter}`
          : "Frontend dummy packing record.",
    sourceRef: `${issuedFrom.slice(0, 3).toUpperCase()}-JOB-${sequence}`,
    ...(packingState === "dispatched"
      ? {
          dispatchBuyerAddress: buyerAddresses[index % buyerAddresses.length]!,
          dispatchSellerAddress:
            sellerAddresses[index % sellerAddresses.length]!,
          dispatchTransactionType:
            transactionTypes[index % transactionTypes.length]!,
          dispatchTransporter: transporter,
          dispatchTransportMode: transportModes[index % transportModes.length]!,
          dispatchTotalQuantity: String(sheets),
          dispatchTotalSqf: formatSQF(sqmValue * 10.7639),
          dispatchGrandTotal: formatAmount(18500 + index * 875),
        }
      : packingState === "dispatchIssued"
        ? {
            dispatchTransporter: transporter,
            dispatchTransportMode:
              transportModes[index % transportModes.length]!,
          }
        : {}),
    packingDate,
    dispatchDate,
    createdBy: people[index % people.length]!,
    updatedBy:
      packingState === "dispatched"
        ? "Dispatch Coordinator"
        : people[(index + 1) % people.length]!,
    createdDate,
    updatedDate: dispatchDate ?? packingDate ?? createdDate,
    packingState,
  };
}

export const packingIssuedDummyRecords: readonly PackingRecord[] = Array.from(
  { length: 6 },
  (_, index) => buildPackingDummyRecord(index, "issued"),
);

export const packingDoneDummyRecords: readonly PackingRecord[] = Array.from(
  { length: 6 },
  (_, index) => buildPackingDummyRecord(index, "done"),
);

export const dispatchIssuedDummyRecords: readonly PackingRecord[] = Array.from(
  { length: 6 },
  (_, index) => buildPackingDummyRecord(index, "dispatchIssued"),
);

export const dispatchDoneDummyRecords: readonly PackingRecord[] = Array.from(
  { length: 6 },
  (_, index) => buildPackingDummyRecord(index, "dispatched"),
);

const allDummyRecords: readonly PackingRecord[] = [
  ...packingIssuedDummyRecords,
  ...packingDoneDummyRecords,
  ...dispatchIssuedDummyRecords,
  ...dispatchDoneDummyRecords,
];

export function getPackingDummyRecord(id: string) {
  return allDummyRecords.find((record) => record.id === id);
}

/** @deprecated Prefer getPackingDummyRecord */
export function getPackingDoneDummyRecord(id: string) {
  return packingDoneDummyRecords.find((record) => record.id === id);
}

function matchesSearch(record: PackingRecord, search: string) {
  if (!search) return true;
  return [
    record.packingId,
    record.orderNo,
    record.orderItemNo,
    record.customerName,
    record.itemName,
    record.issuedFrom,
    record.dispatchTransporter,
    record.dispatchTransportMode,
    record.remark,
  ].some((value) => String(value ?? "").toLowerCase().includes(search));
}

function paginateRecords(
  records: readonly PackingRecord[],
  params: { page?: number; limit?: number; search?: string } = {},
) {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.max(1, params.limit ?? 10);
  const search = (params.search ?? "").trim().toLowerCase();
  const matched = records.filter((record) => matchesSearch(record, search));
  const start = (page - 1) * limit;

  return {
    items: matched.slice(start, start + limit),
    total: matched.length,
  };
}

export function paginatePackingDummyRecords(
  tab: PackingTabValue,
  params: { page?: number; limit?: number; search?: string } = {},
) {
  return paginateRecords(
    tab === "issued" ? packingIssuedDummyRecords : packingDoneDummyRecords,
    params,
  );
}

export function paginatePackingDoneDummyRecords(params: {
  page?: number;
  limit?: number;
  search?: string;
} = {}) {
  return paginatePackingDummyRecords("done", params);
}

export function getDispatchDummyRecords(tab: DispatchTabValue) {
  return tab === "issued"
    ? [...dispatchIssuedDummyRecords]
    : [...dispatchDoneDummyRecords];
}

export function filterDispatchDummyRecords(
  tab: DispatchTabValue,
  searchValue = "",
) {
  const search = searchValue.trim().toLowerCase();
  return getDispatchDummyRecords(tab).filter((record) =>
    matchesSearch(record, search),
  );
}
