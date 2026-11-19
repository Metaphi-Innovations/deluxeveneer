import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import {
  createSampleIssueProcessAction,
  issueToNextFactoryProcess,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";
import { buildMarquetryPressingIssueRow } from "./marquetryPressingIssue";

export function appendMarquetrySampleIssueActions<Row extends FactoryRecord>(
  actions: readonly EnterpriseTableAction<Row>[],
  sourceSlug: string,
  row: Row,
): EnterpriseTableAction<Row>[] {
  if (!buildMarquetryPressingIssueRow(row)) {
    return [...actions];
  }

  return [
    ...actions,
    createSampleIssueProcessAction<Row>("Pressing", (selectedRow) => {
      issueToNextFactoryProcess({
        destinationProcess: "Pressing",
        row: selectedRow,
        sourceSlug,
      });
    }),
  ];
}
