import type { LucideIcon } from "lucide-react";

export type DashboardDatePeriod = "today" | "week" | "month" | "all";

export type DashboardWarehouseFilter =
  | "all"
  | "warehouse-a"
  | "warehouse-b"
  | "warehouse-c";

export type DashboardKpiId =
  | "openOrders"
  | "inProduction"
  | "readyForPacking"
  | "readyForDispatch"
  | "dispatchedToday";

export type DashboardKpi = {
  id: DashboardKpiId;
  label: string;
  value: number;
  hint?: string;
  href: string;
  icon: LucideIcon;
};

export type FactoryPipelineStage = {
  slug: string;
  title: string;
  pendingCount: number;
  href: string;
};

export type OrderStatusSlice = {
  key: string;
  label: string;
  count: number;
  color: string;
};

export type OrderTypeSlice = {
  key: string;
  label: string;
  count: number;
};

export type AttentionItem = {
  id: string;
  label: string;
  count: number;
  href: string | null;
  tone: "warning" | "error" | "neutral";
};

export type WarehouseSnapshotRow = {
  id: DashboardWarehouseFilter;
  name: string;
  stockItems: number;
  available: number;
  qcPending: number;
  href: string;
};

export type DashboardActivityItem = {
  id: string;
  reference: string;
  description: string;
  timestamp: Date;
  href: string | null;
};

export type DashboardMetrics = {
  kpis: DashboardKpi[];
  pipeline: FactoryPipelineStage[];
  orderStatus: OrderStatusSlice[];
  orderTypes: OrderTypeSlice[];
  attention: AttentionItem[];
  warehouses: WarehouseSnapshotRow[];
  activity: DashboardActivityItem[];
};
