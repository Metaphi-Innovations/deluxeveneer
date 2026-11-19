import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import {
  availableFactoryMeasures,
  withAvailableFactoryMeasureColumns,
} from "../shared/factoryAvailableMeasures";
import type { FactoryRecord } from "../shared/types";

export const marquetryCreateIssuedColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  withAvailableFactoryMeasureColumns([
    { key: "issuedDate", label: "Issued Date" },
    { key: "itemName", label: "Item Name" },
    { key: "itemSubCategory", label: "Item Sub-Category" },
    { key: "logNo", label: "Lot No" },
    { key: "batchNo", label: "Batch No" },
    { key: "bundleNumber", label: "Bundle No" },
    { key: "palletNo", label: "Pallet No" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "color", label: "Color" },
    { key: "grade", label: "Grade" },
    { key: "receivedNoOfLeaves", label: "Received No. of Leaves" },
    { key: "availableNoOfLeaves", label: "Available No. of Leaves" },
    { key: "sqm", label: "SQM" },
    { key: "sqf", label: "SQF" },
    { key: "remark", label: "Remark" },
    { key: "createdUpdatedBy", label: "Created / Updated By" },
  ]);

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
  const sqm = textValue(row.sqm) || textValue(row.totalSqMeter) || textValue(row.totalSqm);
  const sqf = textValue(row.sqf) || textValue(row.totalSqf);
  const receivedCount = Number(receivedLeaves.replace(/[^\d.]/g, "")) || 0;
  const availableCount = Number(availableLeaves.replace(/[^\d.]/g, "")) || 0;

  return {
    ...row,
    storageSrNo: textValue(row.storageSrNo) || textValue(row.storageSerialNumber),
    issueSrNo: textValue(row.issueSrNo) || textValue(row.workItemId) || textValue(row.id),
    itemName: textValue(row.itemName) || textValue(row.productName),
    itemSubCategory: textValue(row.itemSubCategory) || textValue(row.subCategory),
    logNo: textValue(row.logNo) || textValue(row.logCode),
    batchNo: textValue(row.batchNo) || textValue(row.batchNoCode),
    bundleNumber: textValue(row.bundleNumber) || textValue(row.noOfBundle),
    palletNo: textValue(row.palletNo) || textValue(row.palletNumber),
    thickness: textValue(row.thickness) || textValue(row.height),
    color: textValue(row.color) || textValue(row.timberColor) || textValue(row.processColor),
    receivedNoOfLeaves: receivedLeaves,
    availableNoOfLeaves: availableLeaves,
    receivedLeaves,
    availableLeaves,
    noOfLeaves: receivedLeaves,
    sqm,
    sqf,
    ...availableFactoryMeasures(
      { ...row, sqm, sqf },
      receivedCount,
      availableCount,
    ),
    createdUpdatedBy: [createdBy, updatedBy].filter(Boolean).join(" / "),
  } as Row;
}
