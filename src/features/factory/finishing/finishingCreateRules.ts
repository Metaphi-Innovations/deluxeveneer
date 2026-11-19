import type { MasterFieldDefinition } from "../../masters/shared";
import { orderEmbossingCreateFields } from "../embossing/embossingCreateRules";

export const finishingProcessDate = {
  key: "finishingDate",
  label: "Finishing Date",
} as const;

/** Reuse embossing identity field ordering (Lot / Batch / Bundle / Pallet). */
export function orderFinishingCreateFields(
  fields: readonly MasterFieldDefinition[],
) {
  return orderEmbossingCreateFields(fields);
}

export const finishingCreateSourceColumns = [
  {
    key: "sourceSrNo",
    keys: [
      "sourceSrNo",
      "processSrNo",
      "storageSrNo",
      "storageSerialNumber",
      "issueSrNo",
    ],
    label: "Source Sr No",
    minWidth: 160,
  },
  {
    key: "issuedFrom",
    keys: ["issuedFrom", "sourceProcess", "process"],
    label: "Issued From",
    minWidth: 140,
  },
  { key: "orderNo", keys: ["orderNo"], label: "Order No", minWidth: 140 },
  {
    key: "orderItemNo",
    keys: ["orderItemNo"],
    label: "Order Item No",
    minWidth: 140,
  },
  {
    key: "itemName",
    keys: ["itemName", "productName"],
    label: "Item Name",
    minWidth: 180,
  },
  {
    key: "itemSubCategory",
    keys: ["itemSubCategory", "subCategory"],
    label: "Item Sub Category",
    minWidth: 170,
  },
  { key: "logNo", keys: ["logNo", "logCode"], label: "Lot No", minWidth: 120 },
  {
    key: "batchNo",
    keys: ["batchNo", "batchNoCode"],
    label: "Batch No",
    minWidth: 140,
  },
  {
    key: "bundleNumber",
    keys: ["bundleNumber", "bundleNo"],
    label: "Bundle No",
    minWidth: 140,
  },
  {
    key: "palletNo",
    keys: ["palletNo", "palletNumber"],
    label: "Pallet No",
    minWidth: 140,
  },
  { key: "length", keys: ["length"], label: "Length", minWidth: 120 },
  { key: "width", keys: ["width"], label: "Width", minWidth: 120 },
  {
    key: "thickness",
    keys: ["height", "thickness", "thickess"],
    label: "Thickness",
    minWidth: 120,
  },
  {
    key: "cutColor",
    keys: ["cutColor", "color", "colour", "processColour"],
    label: "Cut Color",
    minWidth: 130,
  },
  { key: "grade", keys: ["grade"], label: "Grade", minWidth: 120 },
  {
    key: "receivedSheets",
    keys: [
      "receivedNoOfSheets",
      "receivedSheets",
      "issuedNoOfSheets",
      "noOfSheets",
    ],
    label: "Received Sheets",
    minWidth: 150,
  },
  {
    key: "availableSheets",
    keys: [
      "sourceAvailableSheets",
      "availableNoOfSheets",
      "availableSheets",
      "currentAvailableSheets",
      "issuedNoOfSheets",
      "noOfSheets",
    ],
    label: "Available Sheets",
    minWidth: 150,
  },
  {
    key: "sqm",
    keys: ["availableSqm", "sqm", "issuedSqm", "outputSqm", "totalSqm"],
    label: "SQM",
    minWidth: 120,
  },
  {
    key: "sqf",
    keys: ["availableSqf", "sqf", "issuedSqf", "outputSqf", "totalSqf"],
    label: "SQF",
    minWidth: 120,
  },
  {
    key: "remark",
    keys: ["remark", "issueRemark"],
    label: "Remark",
    minWidth: 200,
  },
] as const;
