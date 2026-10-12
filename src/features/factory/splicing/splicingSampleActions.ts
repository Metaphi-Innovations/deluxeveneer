import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import {
  createSampleIssueProcessAction,
  issueToNextFactoryProcess,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

const SPLICING_SAMPLE_PROCESSES = ["Finishing", "Fluting", "Embossing"] as const;

export function appendSplicingSampleIssueActions<Row extends FactoryRecord>(
  actions: readonly EnterpriseTableAction<Row>[],
  sourceSlug: string,
): EnterpriseTableAction<Row>[] {
  return [
    ...actions,
    ...SPLICING_SAMPLE_PROCESSES.map((process) =>
      createSampleIssueProcessAction<Row>(process, (selectedRow) => {
        issueToNextFactoryProcess({
          destinationProcess: process,
          row: selectedRow,
          sourceSlug,
        });
      }),
    ),
  ];
}
