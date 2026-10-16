import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryRecord } from "../shared/types";

const sharedIssuedColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "issueSrNo", label: "Issue Sr No" },
  { key: "groupNo", label: "Group No" },
];

const itemIssuedColumns: readonly EnterpriseTableColumn<FactoryRecord>[] = [
  { key: "itemName", label: "Item Name" },
  { key: "itemSubCategory", label: "Item Sub Category" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cutColor", label: "Cut Color" },
  { key: "grade", label: "Grade" },
  { key: "receivedQty", label: "Received Qty" },
  { key: "availableQty", label: "Available Qty" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "issuedDate", label: "Issued Date" },
  { key: "remark", label: "Remark" },
];

export const pressingOrderIssuedColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  withAvailableFactoryMeasureColumns([
    ...sharedIssuedColumns,
    { key: "orderNo", label: "Order No" },
    { key: "orderItemNo", label: "Order Item No" },
    ...itemIssuedColumns,
  ]);

export const pressingSampleIssuedColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  withAvailableFactoryMeasureColumns([
    ...sharedIssuedColumns,
    ...itemIssuedColumns,
  ]);

export const pressingCreateIssuedColumns = pressingOrderIssuedColumns;

export const pressingBaseStockColumns: readonly EnterpriseTableColumn<FactoryRecord>[] =
  withAvailableFactoryMeasureColumns([
  { key: "storageSrNo", label: "Production/Storage Sr No" },
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "itemName", label: "Item Name" },
  { key: "itemSubCategory", label: "Item Sub Category" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "receivedSheets", label: "Received Sheets" },
  { key: "availableSheets", label: "Available Sheets" },
  { key: "sqm", label: "SQM" },
  { key: "sqf", label: "SQF" },
  { key: "grade", label: "Grade" },
  { key: "remark", label: "Remark" },
]);
