import { Eye, Package, RotateCcw } from "lucide-react";

import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { isSampleFactoryRow } from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";

export function buildFinishingDoneRowActions<Row extends FactoryRecord>({
  canCreate,
  canEdit,
  canView,
  onIssueToPacking,
  onRevert,
  onView,
  rejectDoneAction,
  rowActions,
}: {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  onIssueToPacking: (row: Row) => void;
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
            {
              id: "issue-for-packing",
              label: "Issue for Packing",
              icon: Package,
              tone: "primary" as const,
              onSelect: onIssueToPacking,
            },
          ]
        : []),
      ...(canEdit || canCreate ? [rejectDoneAction] : []),
    ];
  };
}
