import { Eye } from "lucide-react";

import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import {
  createGroupingOrderIssueAction,
  createGroupingSampleIssueAction,
} from "../shared/listing/factoryListingParts";
import { getAvailableGroupedSheets } from "../shared/groupedStockIssueStore";
import type { FactoryRecord } from "../shared/types";

export function buildGroupingDoneRowActions<Row extends FactoryRecord>({
  canCreate,
  canView,
  onOrderIssue,
  onSampleIssue,
  onView,
}: {
  canCreate: boolean;
  canView: boolean;
  onOrderIssue: (row: Row) => void;
  onSampleIssue: (row: Row) => void;
  onView: (row: Row) => void;
}): (row: Row) => readonly EnterpriseTableAction<Row>[] {
  return (row) => {
    const available = getAvailableGroupedSheets(row);
    const actions: EnterpriseTableAction<Row>[] = [];

    if (canView) {
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: onView,
      });
    }

    if (canCreate && available > 0) {
      actions.push(
        createGroupingOrderIssueAction<Row>(onOrderIssue),
        createGroupingSampleIssueAction<Row>(onSampleIssue),
      );
    }

    return actions;
  };
}
