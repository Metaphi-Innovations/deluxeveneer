import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import { withAvailableFactoryMeasureColumns } from "../shared/factoryAvailableMeasures";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

function formatDryingDate(value: unknown) {
  const date = value instanceof Date ? value : typeof value === "string" && value.trim() ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function applyDryingListingColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  let columns = sourceColumns;

  if (activeTab === "issued") {
    columns = columns.flatMap((col) =>
      col.key === "noOfLeaves"
        ? [
            { ...col, label: "Received No of Leaves" },
            { key: "availableLeaves", label: "Available No of Leaves" },
          ]
        : [col],
    );
  }

  if (activeTab === "done") {
    columns = columns.map((col) =>
      col.key === "issueDate" ? { ...col, label: "Drying Date" } : col,
    );

    if (!columns.some((col) => col.key === "issuedForInspectionDate")) {
      const dryingDateIndex = columns.findIndex(
        (col) => col.key === "issueDate" || col.key === "processDate" || col.key === "issuedDate",
      );
      const inspectionDateColumn: EnterpriseTableColumn<Row> = {
        key: "issuedForInspectionDate",
        label: "Issued for Inspection Date",
        renderCell: (row) =>
          formatDryingDate(
            row.issuedForInspectionDate ?? row.inspectionDate,
          ),
      };
      columns =
        dryingDateIndex === -1
          ? [inspectionDateColumn, ...columns]
          : [
              ...columns.slice(0, dryingDateIndex + 1),
              inspectionDateColumn,
              ...columns.slice(dryingDateIndex + 1),
            ];
    }
  }

  if (activeTab === "history") {
    columns = columns.map((col) =>
      col.key === "issueDate" || col.key === "processDate"
        ? { ...col, label: "Issued Drying Date" }
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

  return withAvailableFactoryMeasureColumns(columns);
}
