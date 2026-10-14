import { Eye, XCircle } from "lucide-react";

import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import {
  createGroupingOrderIssueAction,
  createGroupingSampleIssueAction,
} from "../shared/listing/factoryListingParts";
import {
  getAvailableGroupedSheets,
  getIssuedGroupedSheetsTotal,
} from "../shared/groupedStockIssueStore";
import type { FactoryRecord } from "../shared/types";

export function buildGroupingDoneRowActions<Row extends FactoryRecord>({
  canCreate,
  canEdit = true,
  canReject,
  canView,
  onOrderIssue,
  onReject,
  onSampleIssue,
  onView,
  rowActions = [],
}: {
  canCreate: boolean;
  canEdit?: boolean;
  canReject: boolean;
  canView: boolean;
  onOrderIssue: (row: Row) => void;
  onReject: (row: Row) => void;
  onSampleIssue: (row: Row) => void;
  onView: (row: Row) => void;
  rowActions?: readonly EnterpriseTableAction<Row>[];
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

    if (canEdit && rowActions.length > 0) {
      const issuedCount = getIssuedGroupedSheetsTotal(String(row.id));
      const editBlocked =
        issuedCount > 0
          ? "Edit is unavailable because sheets from this grouping have already been issued."
          : "";
      rowActions.forEach((action) => {
        if (action.id === "edit") {
          actions.push({
            ...action,
            disabled: Boolean(editBlocked),
            disabledReason: editBlocked || undefined,
          });
        }
      });
    }

    if (canCreate && available > 0) {
      actions.push(
        createGroupingOrderIssueAction<Row>(onOrderIssue),
        createGroupingSampleIssueAction<Row>(onSampleIssue),
      );
    }

    if (canReject) {
      actions.push({
        id: "reject-grouping",
        label: "Reject Grouping",
        icon: XCircle,
        tone: "danger",
        onSelect: onReject,
      });
    }

    return actions;
  };
}
