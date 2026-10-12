import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryRecord } from "../shared/types";

export const marquetryCreateIssuedColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "storageSrNo", label: "Storage No" },
  { key: "issuedDate", label: "Issued Date" },
  { key: "itemName", label: "Item Name" },
  { key: "itemSubCategory", label: "Item Sub-Category" },
  { key: "logNo", label: "Log No" },
  { key: "bundleNumber", label: "Bundle No" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "color", label: "Color" },
  { key: "grade", label: "Grade" },
  { key: "receivedLeaves", label: "Received Leaves" },
  { key: "availableLeaves", label: "Available Leaves" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "remark", label: "Remark" },
  { key: "createdUpdatedBy", label: "Created / Updated By" },
];

function textValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function mapMarquetryCreateIssuedRow<Row extends FactoryRecord>(row: Row): Row {
  const receivedLeaves =
    textValue(row.receivedNoOfLeaves) ||
    textValue(row.receivedLeaves) ||
    textValue(row.noOfLeaves) ||
    textValue(row.noOfSheets);
  const availableLeaves =
    textValue(row.availableNoOfLeaves) ||
    textValue(row.availableLeaves) ||
    receivedLeaves;
  const createdBy = textValue(row.createdBy);
  const updatedBy = textValue(row.updatedBy);

  return {
    ...row,
    storageSrNo: textValue(row.storageSrNo) || textValue(row.storageSerialNumber),
    issueSrNo: textValue(row.issueSrNo) || textValue(row.workItemId) || textValue(row.id),
    itemName: textValue(row.itemName) || textValue(row.productName),
    itemSubCategory: textValue(row.itemSubCategory) || textValue(row.subCategory),
    logNo: textValue(row.logNo) || textValue(row.logCode) || textValue(row.batchNo),
    bundleNumber: textValue(row.bundleNumber) || textValue(row.noOfBundle),
    palletNo: textValue(row.palletNo) || textValue(row.palletNumber),
    thickness: textValue(row.thickness) || textValue(row.height),
    color: textValue(row.color) || textValue(row.timberColor) || textValue(row.processColor),
    receivedLeaves,
    availableLeaves,
    sqm: textValue(row.availableSqm) || textValue(row.sqm),
    sqf: textValue(row.availableSqf) || textValue(row.sqf),
    createdUpdatedBy: [createdBy, updatedBy].filter(Boolean).join(" / "),
  } as Row;
}
