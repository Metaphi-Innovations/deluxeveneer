import { Eye, RotateCcw } from "lucide-react";

import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { createSplicingOrderIssueAction } from "../shared/listing/factoryListingParts";
import { isSampleFactoryRow } from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";

export function buildFinishingDoneRowActions<Row extends FactoryRecord>({
  canCreate,
  canEdit,
  canView,
  onOrderIssue,
  onRevert,
  onView,
  rejectDoneAction,
  rowActions,
}: {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  onOrderIssue: (row: Row) => void;
  onRevert: (row: Row) => void;
  onView: (row: Row) => void;
  rejectDoneAction: EnterpriseTableAction<Row>;
  rowActions: readonly EnterpriseTableAction<Row>[];
}): (row: Row) => readonly EnterpriseTableAction<Row>[] {
  return (row) => {
    if (isSampleFactoryRow(row)) {
      const sampleActions: EnterpriseTableAction<Row>[] = [];
      if (canView) {
        sampleActions.push({
          id: "view",
          label: "View",
          icon: Eye,
          onSelect: onView,
        });
      }
      return sampleActions;
    }

    return [
      ...rowActions,
      ...(canCreate
        ? [
            {
              id: "revert-item",
              label: "Revert",
              icon: RotateCcw,
              tone: "danger" as const,
              onSelect: onRevert,
            },
            createSplicingOrderIssueAction<Row>(onOrderIssue),
          ]
        : []),
      ...(canEdit || canCreate ? [rejectDoneAction] : []),
    ];
  };
}
