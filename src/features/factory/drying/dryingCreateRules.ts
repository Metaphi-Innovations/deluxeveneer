import type { MasterFieldDefinition } from "../../masters/shared";

export const dryingProcessDate = {
  key: "dryingDate",
  label: "Drying Date",
} as const;

export const dryingCreateSourceColumns = [
      { key: "storageSrNo", keys: ["storageSrNo", "storageSerialNumber"], label: "Storage Sr No.", minWidth: 160 },
      { key: "issueDate", keys: ["issueDate", "issuedDate", "processDate", "date"], label: "Issue Date", minWidth: 130 },
      { key: "itemName", keys: ["itemName", "productName"], label: "Item Name", minWidth: 170 },
      { key: "subCategory", keys: ["subCategory", "itemSubCategory", "itemSubCategoryName"], label: "Sub Category", minWidth: 170 },
      { key: "logCode", keys: ["logCode", "batchNoCode", "batchNo", "logNo"], label: "Log Code", minWidth: 140 },
      { key: "bundleNumber", keys: ["bundleNumber", "bundleNo"], label: "Bundle Number", minWidth: 140 },
      { key: "palletNo", keys: ["palletNo"], label: "Pallet No", minWidth: 140 },
      { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
      { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
      { key: "thickness", keys: ["thickness", "height"], label: "Thickness", minWidth: 120 },
      { key: "noOfLeaves", keys: ["noOfLeaves", "noOfSheets", "leaves"], label: "No of Leaves", minWidth: 130 },
      { key: "totalSqMeter", keys: ["totalSqMeter", "sqm"], label: "Total Sq Meter", minWidth: 140 },
      { key: "remark", keys: ["remark"], label: "Remark", minWidth: 200 },
];

export const dryingCreateLineItemFields: readonly MasterFieldDefinition[] = [
  { key: "itemName", label: "Item Name", type: "text" },
  { key: "itemSubCategory", label: "Sub Category", type: "text" },
  { key: "color", label: "Color", type: "text" },
  { key: "logNo", label: "Log No.", type: "text" },
  { key: "palletNo", label: "Pallet No", type: "text" },
  { key: "noOfBundle", label: "No of Bundle", type: "text" },
  { key: "length", label: "Length", type: "text" },
  { key: "width", label: "Width", type: "text" },
  { key: "height", label: "Thickness", type: "text" },
  { key: "remark", label: "Remark", type: "text" },
];
