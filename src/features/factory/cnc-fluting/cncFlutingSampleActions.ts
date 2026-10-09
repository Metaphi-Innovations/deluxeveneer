import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import {
  createSampleIssueProcessAction,
  issueToNextFactoryProcess,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export function appendCncFlutingSampleIssueActions<Row extends FactoryRecord>(
  actions: readonly EnterpriseTableAction<Row>[],
  sourceSlug: string,
): EnterpriseTableAction<Row>[] {
  return [
    ...actions,
    createSampleIssueProcessAction<Row>("Finishing", (selectedRow) => {
      issueToNextFactoryProcess({
        destinationProcess: "Finishing",
        row: selectedRow,
        sourceSlug,
      });
    }),
  ];
}
