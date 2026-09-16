import type {
  EnterpriseTableColumn,
  EnterpriseTableRow,
  EnterpriseTableSortConfig,
} from "../../../components/data-display/EnterpriseDataTable";
import type { MasterFieldDefinition } from "../../masters/shared";

export type FactoryPageMode = "list" | "add" | "edit" | "view";

export type FactoryRecord = EnterpriseTableRow;

export interface FactoryFormSection {
  description?: string;
  fields: readonly MasterFieldDefinition[];
  title: string;
}

export interface FactoryDefinition<Row extends FactoryRecord = FactoryRecord> {
  formSections: readonly FactoryFormSection[];
  initialSort?: EnterpriseTableSortConfig<Row>;
  listColumns: readonly EnterpriseTableColumn<Row>[];
  rows: readonly Row[];
  slug: string;
  title: string;
}
