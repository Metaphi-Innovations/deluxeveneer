import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { createSampleIssueProcessAction } from "../shared/listing/factoryListingParts";
import {
  getSampleNoFromRow,
  issueSampleToProcess,
} from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";

export function appendPressingSampleIssueActions<Row extends FactoryRecord>(
  actions: readonly EnterpriseTableAction<Row>[],
): EnterpriseTableAction<Row>[] {
  return [
    ...actions,
    createSampleIssueProcessAction<Row>("Packing", (selectedRow) => {
      const sampleNo = getSampleNoFromRow(selectedRow);
      if (sampleNo) {
        issueSampleToProcess(sampleNo, "Packing");
      }
    }),
  ];
}
