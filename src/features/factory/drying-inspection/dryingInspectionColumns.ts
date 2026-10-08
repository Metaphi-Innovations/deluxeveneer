import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";

export const DRYING_INSPECTION_TABS = [
  { label: "Inspection Pending", value: "issued" },
  { label: "Inspection Done", value: "done" },
  { label: "Inspection Fail", value: "failed" },
] as const;

export type DryingInspectionTab = (typeof DRYING_INSPECTION_TABS)[number]["value"];
