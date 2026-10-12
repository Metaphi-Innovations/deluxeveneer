import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

const embossingHiddenKeys = new Set(["warehouseName", "issuedFrom"]);

export function applyEmbossingListingColumns<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  return columns.filter((column) => {
    if (embossingHiddenKeys.has(column.key)) {
      return false;
    }

    if (column.key === "issuedFor") {
      return activeTab === "history";
    }

    return true;
  });
}
