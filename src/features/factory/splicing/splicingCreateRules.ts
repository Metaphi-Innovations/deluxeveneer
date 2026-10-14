function readWholeLeafCount(value: unknown) {
  const text = String(value ?? "").trim();
  if (!/^\d+$/u.test(text)) return 0;
  const parsed = Number(text);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 0;
}

export function readSplicingReferenceLeaves(
  sourceRow: Record<string, unknown> | undefined,
) {
  if (!sourceRow) return 0;
  for (const key of [
    "availableNoOfLeaves",
    "receivedNoOfLeaves",
    "noOfLeaves",
    "issuedLeafCount",
  ]) {
    const leaves = readWholeLeafCount(sourceRow[key]);
    if (leaves > 0) return leaves;
  }
  return 0;
}

export const splicingProcessDate = {
  key: "splicingDate",
  label: "Splicing Date",
} as const;

export const splicingCreateSourceColumns = [
  { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
  { key: "issuedDate", keys: ["issuedDate", "issueDate"], label: "Issued Date", minWidth: 140 },
  { key: "groupNo", keys: ["groupNo"], label: "Group No.", minWidth: 140 },
  { key: "groupingDate", keys: ["groupingDate"], label: "Grouping Date", minWidth: 140 },
  { key: "issuedFor", keys: ["issuedFor", "productType"], label: "Issue For", minWidth: 140 },
  { key: "orderDate", keys: ["orderDate"], label: "Order Date", minWidth: 140 },
  { key: "customerName", keys: ["customerName"], label: "Customer Name", minWidth: 170 },
  { key: "orderNo", keys: ["orderNo"], label: "Order No", minWidth: 140 },
  { key: "orderItemNo", keys: ["orderItemNo"], label: "Order Item No", minWidth: 140 },
  { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
  { key: "itemSubCategory", keys: ["itemSubCategory", "subCategory"], label: "Sub Category", minWidth: 160 },
  { key: "grade", keys: ["grade"], label: "Grade", minWidth: 120 },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
  { key: "receivedNoOfLeaves", keys: ["receivedNoOfLeaves", "noOfLeaves", "issuedLeafCount"], label: "Received No of Leaves", minWidth: 180 },
  { key: "availableNoOfLeaves", keys: ["availableNoOfLeaves"], label: "Available No of Leaves", minWidth: 180 },
  { key: "sqm", keys: ["sqm"], label: "SQM", minWidth: 120 },
  { key: "sqf", keys: ["sqf"], label: "SQF", minWidth: 120 },
  { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
] as const;
