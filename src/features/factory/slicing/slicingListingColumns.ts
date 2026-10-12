import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

export function applySlicingListingColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  let columns = sourceColumns;

  if (activeTab === "issued") {
    return [
      { key: "storageSrNo", label: "Storage Sr No." },
      { key: "issueDate", label: "Issue Date" },
      { key: "itemName", label: "Item Name" },
      { key: "subCategory", label: "Sub Category" },
      { key: "batchNo", label: "Log No." },
      { key: "length", label: "Length" },
      { key: "width", label: "Width" },
      { key: "height", label: "Height" },
      { key: "receivedCbm", label: "Received CBM" },
      { key: "availableCbm", label: "Available CBM" },
      { key: "availableSqm", label: "Available SQM" },
      { key: "remark", label: "Remark" },
      { key: "createdBy", label: "Created" },
      { key: "updatedBy", label: "Updated" },
    ];
  }

  if (activeTab === "done") {
    const insertIdx = columns.findIndex((col) => col.key === "totalSqMeter");
    const mapped = columns.map((col) =>
      col.key === "issueDate" ? { ...col, label: "Slicing Date" } : col,
    );
    if (insertIdx >= 0) {
      columns = [
        ...mapped.slice(0, insertIdx),
        { key: "sqm", label: "SQM" },
        { key: "sqf", label: "SQF" },
        ...mapped.slice(insertIdx + 1),
      ];
    } else {
      columns = mapped;
    }
  }

  if (activeTab === "history") {
    columns = columns.map((col) =>
      col.key === "issueDate" || col.key === "processDate"
        ? { ...col, label: "Issued for Drying Date" }
        : col,
    );
  }

  if (activeTab === "rejected") {
    columns = columns.map((col) =>
      col.key === "issueDate" || col.key === "processDate"
        ? { ...col, label: "Rejected Date" }
        : col,
    );
  }

  return columns;
}
