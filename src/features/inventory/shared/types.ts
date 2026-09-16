import type {
  EnterpriseTableColumn,
  EnterpriseTableRow,
  EnterpriseTableSortConfig,
} from "../../../components/data-display/EnterpriseDataTable";
import type { MasterFieldDefinition } from "../../masters/shared";

export type InventoryPageMode = "list" | "add" | "edit" | "view";

export type InventoryRecord = EnterpriseTableRow;

export interface InventoryDefinition<
  Row extends InventoryRecord = InventoryRecord,
> {
  editFields?: readonly MasterFieldDefinition[];
  formFields: readonly MasterFieldDefinition[];
  initialSort?: EnterpriseTableSortConfig<Row>;
  listColumns: readonly EnterpriseTableColumn<Row>[];
  rows: readonly Row[];
  slug: string;
  title: string;
  viewFields: readonly MasterFieldDefinition[];
}
