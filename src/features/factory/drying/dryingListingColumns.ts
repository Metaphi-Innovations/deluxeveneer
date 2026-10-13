import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

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

  return columns;
}
