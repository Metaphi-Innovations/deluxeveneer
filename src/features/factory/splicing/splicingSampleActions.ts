import { Plus } from "lucide-react";

import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { issueToNextFactoryProcess } from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

/** Sample Sheet from Splicing Done only continues to Pressing. */
export function appendSplicingSampleIssueActions<Row extends FactoryRecord>(
  actions: readonly EnterpriseTableAction<Row>[],
  sourceSlug: string,
): EnterpriseTableAction<Row>[] {
  return [
    ...actions,
    {
      id: "issue-to-pressing",
      label: "Issue to Pressing",
      icon: Plus,
      tone: "primary",
      onSelect: (selectedRow) => {
        issueToNextFactoryProcess({
          destinationProcess: "Pressing",
          row: selectedRow,
          sourceSlug,
        });
      },
    },
  ];
}
