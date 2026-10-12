import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryRecord } from "../shared/types";
import { getPressingNextProcessActions } from "./pressingNextProcessActions";

export function appendPressingSampleIssueActions<Row extends FactoryRecord>(
  actions: readonly EnterpriseTableAction<Row>[],
  row: Row,
  sourceSlug: string,
): EnterpriseTableAction<Row>[] {
  return [...actions, ...getPressingNextProcessActions(row, sourceSlug)];
}
