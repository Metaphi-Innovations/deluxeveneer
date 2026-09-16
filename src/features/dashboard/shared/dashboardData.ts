import {
  ClipboardList,
  Factory,
  PackageCheck,
  PackageOpen,
  Truck,
} from "lucide-react";

import {
  cncFlutingDefinition,
  dryingDefinition,
  embossingDefinition,
  finishingDefinition,
  groupingDefinition,
  marquetryDefinition,
  pressingDefinition,
  slicingDefinition,
  splicingDefinition,
} from "../../factory/shared/factoryDefinitions";
import {
  getFactoryPaths,
  getFactoryRowsForTab,
} from "../../factory/shared/factoryUtils";
import type { FactoryDefinition, FactoryRecord } from "../../factory/shared/types";
import {
  getDispatchRecordsByTab,
  getPackingRecordsByTab,
  usePackingRecords,
  type PackingRecord,
} from "../../packing/shared/packingStore";
import {
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import {
  warehouseAInventoryConfigs,
  warehouseBInspectionConfigs,
  warehouseBInventoryConfigs,
  warehouseCInventoryConfigs,
  warehouseTableConfigs,
  type WarehouseInventoryRow,
  type WarehousePageId,
} from "../../warehouses/shared/warehouseTableData";
import { getWarehouseQcStatus } from "../../warehouses/shared/warehouseQcStore";
import type {
  AttentionItem,
  DashboardActivityItem,
  DashboardDatePeriod,
  DashboardKpi,
  DashboardMetrics,
  DashboardWarehouseFilter,
  FactoryPipelineStage,
  OrderStatusSlice,
  OrderTypeSlice,
  WarehouseSnapshotRow,
} from "./dashboardTypes";

const PIPELINE_DEFINITIONS: readonly FactoryDefinition[] = [
  slicingDefinition,
  dryingDefinition,
  groupingDefinition,
  splicingDefinition,
  marquetryDefinition,
  pressingDefinition,
  cncFlutingDefinition,
  embossingDefinition,
  finishingDefinition,
] as const;

const OPEN_ORDER_STATUSES = new Set(["Draft", "Confirmed"]);
const ACTIVE_ORDER_STATUSES = new Set([
  "Draft",
  "Confirmed",
  "In Production",
  "Packing Scheduled",
  "Ready for Dispatch",
]);

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

function getPeriodRange(period: DashboardDatePeriod, now = new Date()) {
  if (period === "all") {
    return null;
  }

  const end = endOfDay(now);
  const start = startOfDay(now);

  if (period === "week") {
    start.setDate(start.getDate() - 6);
  } else if (period === "month") {
    start.setDate(1);
  }

  return { start, end };
}

function isWithinPeriod(date: Date | null | undefined, period: DashboardDatePeriod) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return false;
  }

  const range = getPeriodRange(period);
  if (!range) {
    return true;
  }

  return date >= range.start && date <= range.end;
}

function isAvailableStockValue(value: string | undefined) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized.startsWith("hold")) {
    return false;
  }

  const numeric = Number.parseFloat(normalized.replace(/,/g, ""));
  return Number.isFinite(numeric) ? numeric > 0 : normalized.length > 0;
}

function isQcPendingRow(row: WarehouseInventoryRow) {
  const statusText = `${row.qcStatus ?? ""} ${row.status ?? ""}`.toLowerCase();
  if (statusText.includes("inspection pending")) {
    return true;
  }

  return getWarehouseQcStatus(row) === "pending";
}

function collectWarehouseRows(warehouseId: WarehousePageId): WarehouseInventoryRow[] {
  if (warehouseId === "warehouse-a") {
    return Object.values(warehouseAInventoryConfigs).flatMap((config) => [
      ...config.rows,
      ...(config.rawTabs
        ? Object.values(config.rawTabs).flatMap((tab) => [...tab.rows])
        : []),
    ]);
  }

  if (warehouseId === "warehouse-b") {
    return [
      ...Object.values(warehouseBInventoryConfigs).flatMap((config) => [
        ...config.rows,
      ]),
      ...warehouseBInspectionConfigs.pending.rows,
    ];
  }

  return Object.values(warehouseCInventoryConfigs).flatMap((config) => [
    ...config.rows,
  ]);
}

function buildWarehouseSnapshot(
  filter: DashboardWarehouseFilter,
): WarehouseSnapshotRow[] {
  const warehouseIds: WarehousePageId[] =
    filter === "all"
      ? ["warehouse-a", "warehouse-b", "warehouse-c"]
      : [filter];

  return warehouseIds.map((id) => {
    const rows = collectWarehouseRows(id);
    const uniqueRows = Array.from(
      new Map(rows.map((row) => [row.id, row])).values(),
    );

    return {
      id,
      name: warehouseTableConfigs[id].title,
      stockItems: uniqueRows.length,
      available: uniqueRows.filter((row) =>
        isAvailableStockValue(row.availableUnits),
      ).length,
      qcPending: uniqueRows.filter((row) => isQcPendingRow(row)).length,
      href: `/${id}`,
    };
  });
}

function buildPipeline(): FactoryPipelineStage[] {
  return PIPELINE_DEFINITIONS.map((definition) => {
    const pendingCount = getFactoryRowsForTab(definition.rows, "issued").length;

    return {
      slug: definition.slug,
      title: definition.title,
      pendingCount,
      href: getFactoryPaths(definition.slug).list,
    };
  });
}

function buildOrderStatus(
  orders: readonly OrderRecord[],
  packing: readonly PackingRecord[],
): OrderStatusSlice[] {
  const countByStatus = (status: string) =>
    orders.filter((order) => order.status === status).length;

  const openNew =
    countByStatus("Draft") + countByStatus("Confirmed");
  const inProduction = countByStatus("In Production");
  const packingScheduled = countByStatus("Packing Scheduled");
  const readyForDispatch = countByStatus("Ready for Dispatch");
  const cancelled = countByStatus("Cancelled");
  const dispatched = packing.filter(
    (record) => record.packingState === "dispatched",
  ).length;

  return [
    { key: "open", label: "Open / New", count: openNew, color: "#A83F3F" },
    {
      key: "production",
      label: "In Production",
      count: inProduction,
      color: "#741616",
    },
    {
      key: "packing",
      label: "Packing",
      count: packingScheduled,
      color: "#B86060",
    },
    {
      key: "ready",
      label: "Ready for Dispatch",
      count: readyForDispatch,
      color: "#5E7A5A",
    },
    {
      key: "dispatched",
      label: "Dispatched",
      count: dispatched,
      color: "#6F84A0",
    },
    {
      key: "cancelled",
      label: "Cancelled",
      count: cancelled,
      color: "#968686",
    },
  ];
}

function buildOrderTypes(orders: readonly OrderRecord[]): OrderTypeSlice[] {
  const raw = orders.filter((order) =>
    order.orderType.toLowerCase().includes("raw"),
  ).length;
  const finished = orders.filter((order) =>
    order.orderType.toLowerCase().includes("finished"),
  ).length;

  return [
    { key: "raw", label: "Raw Orders", count: raw },
    { key: "finished", label: "Finished Orders", count: finished },
  ];
}

function buildKpis(
  orders: readonly OrderRecord[],
  packing: readonly PackingRecord[],
  period: DashboardDatePeriod,
): DashboardKpi[] {
  const openOrders = orders.filter((order) =>
    OPEN_ORDER_STATUSES.has(order.status),
  ).length;
  const inProduction = orders.filter(
    (order) => order.status === "In Production",
  ).length;
  const readyForPacking = getPackingRecordsByTab("issued").length;
  const readyForDispatch = getDispatchRecordsByTab("issued").length;
  const dispatchedInPeriod = packing.filter(
    (record) =>
      record.packingState === "dispatched" &&
      isWithinPeriod(
        record.dispatchDate,
        period === "all" ? "all" : period,
      ),
  ).length;

  const dispatchedLabel =
    period === "today"
      ? "Dispatched Today"
      : period === "week"
        ? "Dispatched This Week"
        : period === "month"
          ? "Dispatched This Month"
          : "Dispatched";

  return [
    {
      id: "openOrders",
      label: "Open Orders",
      value: openOrders,
      hint: "Draft + Confirmed",
      href: "/orders",
      icon: ClipboardList,
    },
    {
      id: "inProduction",
      label: "In Production",
      value: inProduction,
      href: "/orders",
      icon: Factory,
    },
    {
      id: "readyForPacking",
      label: "Ready for Packing",
      value: readyForPacking,
      href: "/packing",
      icon: PackageOpen,
    },
    {
      id: "readyForDispatch",
      label: "Ready for Dispatch",
      value: readyForDispatch,
      href: "/dispatch",
      icon: PackageCheck,
    },
    {
      id: "dispatchedToday",
      label: dispatchedLabel,
      value: dispatchedInPeriod,
      href: "/dispatch",
      icon: Truck,
    },
  ];
}

function buildAttention(
  orders: readonly OrderRecord[],
  packing: readonly PackingRecord[],
  now = new Date(),
): AttentionItem[] {
  const today = startOfDay(now);

  const rejectedProduction = PIPELINE_DEFINITIONS.reduce(
    (total, definition) =>
      total + getFactoryRowsForTab(definition.rows, "rejected").length,
    0,
  );

  const delayedOrders = orders.filter((order) => {
    if (!ACTIVE_ORDER_STATUSES.has(order.status)) {
      return false;
    }

    if (!(order.deliveryDate instanceof Date)) {
      return false;
    }

    return startOfDay(order.deliveryDate) < today;
  }).length;

  const pendingPacking = packing.filter(
    (record) => record.packingState === "issued",
  ).length;
  const pendingDispatch = packing.filter(
    (record) => record.packingState === "done",
  ).length;

  const stockAttention = (["warehouse-a", "warehouse-b", "warehouse-c"] as const)
    .flatMap((id) => collectWarehouseRows(id))
    .filter((row) => isQcPendingRow(row)).length;

  return [
    {
      id: "rejected",
      label: "Rejected Production Items",
      count: rejectedProduction,
      href: "/factory/slicing",
      tone: "error",
    },
    {
      id: "delayed",
      label: "Delayed Orders",
      count: delayedOrders,
      href: "/orders",
      tone: "warning",
    },
    {
      id: "pending-packing",
      label: "Pending Packing",
      count: pendingPacking,
      href: "/packing",
      tone: "warning",
    },
    {
      id: "pending-dispatch",
      label: "Pending Dispatch",
      count: pendingDispatch,
      href: "/dispatch",
      tone: "warning",
    },
    {
      id: "stock",
      label: "Stock / Material Attention",
      count: stockAttention,
      href: "/warehouse-a",
      tone: "neutral",
    },
  ];
}

function getFactoryActivityTimestamp(row: FactoryRecord) {
  const dateKeys = [
    "updatedDate",
    "issuedDate",
    "createdDate",
    "groupingDate",
    "pressingDate",
    "cncDate",
    "finishingDate",
    "orderDate",
  ] as const;

  for (const key of dateKeys) {
    const value = row[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
  }

  return null;
}

function buildActivity(
  orders: readonly OrderRecord[],
  packing: readonly PackingRecord[],
  period: DashboardDatePeriod,
): DashboardActivityItem[] {
  const items: DashboardActivityItem[] = [];

  for (const definition of PIPELINE_DEFINITIONS) {
    for (const row of definition.rows) {
      const timestamp = getFactoryActivityTimestamp(row);
      if (!timestamp || !isWithinPeriod(timestamp, period)) {
        continue;
      }

      const listingState =
        typeof row.listingState === "string" ? row.listingState : "issued";
      const reference =
        String(row.orderNo ?? row.issueSrNo ?? row.groupNo ?? row.id ?? "").trim() ||
        definition.title;
      const statusLabel =
        listingState === "rejected"
          ? `Rejected at ${definition.title}`
          : listingState === "done"
            ? `${definition.title} Completed`
            : listingState === "history"
              ? `${definition.title} Archived`
              : `Moved to ${definition.title}`;

      items.push({
        id: `factory-${definition.slug}-${String(row.id)}`,
        reference,
        description: statusLabel,
        timestamp,
        href: getFactoryPaths(definition.slug).list,
      });
    }
  }

  for (const record of packing) {
    const timestamp = record.updatedDate;
    if (!isWithinPeriod(timestamp, period)) {
      continue;
    }

    const description =
      record.packingState === "issued"
        ? "Issued for Packing"
        : record.packingState === "done"
          ? "Packing Completed"
          : record.packingState === "dispatched"
            ? "Dispatched"
            : "Packing Updated";

    items.push({
      id: `packing-${record.id}`,
      reference: record.orderItemNo || record.orderNo || record.packingId,
      description,
      timestamp,
      href:
        record.packingState === "dispatched" || record.packingState === "done"
          ? "/dispatch"
          : "/packing",
    });
  }

  for (const order of orders) {
    if (!isWithinPeriod(order.updatedDate, period)) {
      continue;
    }

    items.push({
      id: `order-${order.id}`,
      reference: order.orderNo,
      description: `Status: ${order.status}`,
      timestamp: order.updatedDate,
      href: `/orders/view/${order.id}`,
    });
  }

  return items
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 5);
}

export function buildDashboardMetrics(
  orders: readonly OrderRecord[],
  packing: readonly PackingRecord[],
  options: {
    period: DashboardDatePeriod;
    warehouse: DashboardWarehouseFilter;
  },
): DashboardMetrics {
  return {
    kpis: buildKpis(orders, packing, options.period),
    pipeline: buildPipeline(),
    orderStatus: buildOrderStatus(orders, packing),
    orderTypes: buildOrderTypes(orders),
    attention: buildAttention(orders, packing),
    warehouses: buildWarehouseSnapshot(options.warehouse),
    activity: buildActivity(orders, packing, options.period),
  };
}

export function useDashboardSourceRecords() {
  const orders = useOrderRecords();
  const packing = usePackingRecords();
  return { orders, packing };
}

export const DASHBOARD_DATE_OPTIONS: readonly {
  label: string;
  value: DashboardDatePeriod;
}[] = [
  { label: "Today", value: "today" },
  { label: "This Week", value: "week" },
  { label: "This Month", value: "month" },
  { label: "All Time", value: "all" },
];

export const DASHBOARD_WAREHOUSE_OPTIONS: readonly {
  label: string;
  value: DashboardWarehouseFilter;
}[] = [
  { label: "All Warehouses", value: "all" },
  { label: "Warehouse A", value: "warehouse-a" },
  { label: "Warehouse B", value: "warehouse-b" },
  { label: "Warehouse C", value: "warehouse-c" },
];
