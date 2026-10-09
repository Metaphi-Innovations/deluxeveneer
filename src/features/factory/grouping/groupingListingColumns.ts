import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

export function applyGroupingListingColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  let columns = sourceColumns;

  if (activeTab === "issued") {
    columns = columns.filter(
      (column) =>
        column.key !== "groupNo" &&
        column.key !== "groupPhoto" &&
        column.key !== "issueTo",
    );
  }

  if (activeTab === "done") {
    columns = columns.filter((column) => column.key !== "issueTo");
    const availableSheetsColumn: EnterpriseTableColumn<Row> = {
      key: "availableSheets",
      label: "Available Sheets",
    };
    const insertAt = columns.findIndex((entry) => entry.key === "remark");
    if (insertAt === -1) {
      return [...columns, availableSheetsColumn];
    }
    return [
      ...columns.slice(0, insertAt),
      availableSheetsColumn,
      ...columns.slice(insertAt),
    ];
  }

  return columns;
}
