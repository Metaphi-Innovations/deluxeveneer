import { useMemo, useState } from "react";
import { Eye, FileOutput, Pencil, Plus } from "lucide-react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
  type EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import {
  getSampleSheetByNo,
  isSampleEligibleForOrder,
  resolveSampleFinishedType,
  useSampleSheetRecords,
  type SampleSheetRecord,
} from "../../factory/shared/sampleSheetIdentityStore";
import {
  issueFactoryWork,
  useFactoryIssuedWorkItems,
} from "../../factory/shared/factoryIssuedWorkStore";
import type { FactoryRecord } from "../../factory/shared/types";
import { useWarehouseCMovedRows } from "../shared/warehouseCTransferStore";
import { getInventoryPaths } from "../../inventory/shared";
import {
  getOrderLineItems,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import {
  getListingToolbarOutlinedButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  warehouseCInventoryConfigs,
  type WarehouseCInventorySlug,
  type WarehouseInventoryRow,
} from "../shared/warehouseTableData";
import {
  IssueOrderDialog,
  type IssueOrderValues,
} from "../shared/IssueOrderDialog";

type WarehouseCTabSlug = WarehouseCInventorySlug | "sample-sheets";

type SampleSheetTableRow = EnterpriseTableRow & {
  availableQuantity: string;
  color: string;
  currentStage: string;
  currentStatus: string;
  issueDate: Date;
  itemName: string;
  length: string;
  processRoute: string;
  sampleNo: string;
  subCategory: string;
  thickness: string;
  width: string;
};

const warehouseCInventoryTabs = [
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
  { label: "Sample Sheets", value: "sample-sheets" },
] as const satisfies readonly {
  label: string;
  value: WarehouseCTabSlug;
}[];

const sampleSheetColumns: readonly EnterpriseTableColumn<SampleSheetTableRow>[] = [
  { key: "sampleNo", label: "Sample No." },
  { key: "issueDate", label: "Issue Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  { key: "color", label: "Color" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "availableQuantity", label: "No. of Leaves / Quantity" },
  { key: "processRoute", label: "Process Route / Type" },
  { key: "currentStage", label: "Current Stage" },
  { key: "currentStatus", label: "Current Status" },
];

import { ProductionWarehousePage } from "../production/ProductionWarehousePage";

export interface WarehouseCInventoryModulePageProps {
  warehouseName?: string;
  warehouseId?: string;
}

export function WarehouseCInventoryPage() {
  return <ProductionWarehousePage warehouseName="Warehouse C" />;
}

export function WarehouseCInventoryModulePage({
  warehouseName = "Warehouse C",
  warehouseId,
}: WarehouseCInventoryModulePageProps = {}) {
  return <ProductionWarehousePage warehouseId={warehouseId} warehouseName={warehouseName} />;
}

