import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Boxes, Layers } from "lucide-react";
import {
  fetchInwardKpisApi,
  getInwardInventoryTypeFromSlug,
} from "../api/inwardApi";
import { fetchStorageKpisApi } from "../storage/api/storageApi";
import { fetchProductionKpisApi } from "../production/api/productionWarehouseApi";
import type { WarehouseKpiCardData } from "../components/WarehouseKpiCards";

function formatInt(n: number): string {
  return Math.round(n).toLocaleString("en-IN");
}

function formatDecimal(n: number, decimals = 3): string {
  return Number(n.toFixed(decimals)).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Warehouse KPIs from backend APIs only (no localStorage warehouse stores).
 */
export function useWarehouseDynamicKpis({
  warehouseType,
  warehouseId,
  tab,
}: {
  warehouseType: "inward" | "storage" | "production";
  warehouseId: string;
  tab: string;
}): {
  cards: WarehouseKpiCardData[];
  isLoading: boolean;
} {
  const isVeneerBlock = tab === "veneer-blocks";
  const isSheetGood =
    tab === "raw-veneer" ||
    tab === "plywood" ||
    tab === "mdf" ||
    tab === "consumables";
  const isSawing = tab === "sawing";
  const inwardInventoryType = getInwardInventoryTypeFromSlug(tab);

  const isEnabled =
    Boolean(warehouseId) &&
    ((warehouseType === "inward" && Boolean(inwardInventoryType)) ||
      (warehouseType === "storage" && Boolean(tab)) ||
      (warehouseType === "production" && (isSheetGood || isSawing)));

  const kpiQuery = useQuery({
    queryKey: ["warehouse-kpis", warehouseType, warehouseId, tab],
    enabled: isEnabled,
    queryFn: async () => {
      if (warehouseType === "inward" && inwardInventoryType) {
        return await fetchInwardKpisApi({
          warehouseId,
          inventoryType: inwardInventoryType,
        });
      }
      if (warehouseType === "storage") {
        return await fetchStorageKpisApi({
          warehouseId,
          tab,
        });
      }
      if (warehouseType === "production") {
        return await fetchProductionKpisApi({
          warehouseId,
          tab,
        });
      }
      return null;
    },
  });

  const cards = useMemo<WarehouseKpiCardData[]>(() => {
    if (!isVeneerBlock && !isSheetGood && !isSawing) {
      return [];
    }

    if (warehouseType === "inward") {
      const data = kpiQuery.data as {
        totalStock: { count: number; secondary: number };
        receivedToday: { count: number; secondary: number };
        outToday: { count: number; secondary: number };
      } | null;

      const totalStock = data?.totalStock ?? { count: 0, secondary: 0 };
      const receivedToday = data?.receivedToday ?? { count: 0, secondary: 0 };
      const outToday = data?.outToday ?? { count: 0, secondary: 0 };

      if (isVeneerBlock) {
        return [
          {
            id: "total-logs-cbm",
            label: "Total Logs / CBM",
            value: `${formatInt(totalStock.count)} Logs`,
            secondaryValue: `/ ${formatDecimal(totalStock.secondary, 3)} CBM`,
            icon: Boxes,
            colorScheme: "primary",
          },
          {
            id: "total-received-today",
            label: "Total Received Today",
            value: `${formatInt(receivedToday.count)} Logs`,
            secondaryValue: `/ ${formatDecimal(receivedToday.secondary, 3)} CBM`,
            icon: ArrowDownLeft,
            colorScheme: "success",
          },
          {
            id: "total-out-today",
            label: "Total Out Today",
            value: `${formatInt(outToday.count)} Logs`,
            secondaryValue: `/ ${formatDecimal(outToday.secondary, 3)} CBM`,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
        ];
      }

      const unitName =
        tab === "raw-veneer"
          ? "Leaves"
          : tab === "consumables"
            ? "Qty"
            : "Sheets";
      return [
        {
          id: "total-leaves-sqm",
          label: "Total Leaves / SQM",
          value: `${formatInt(totalStock.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(totalStock.secondary, 2)} SQM`,
          icon: Layers,
          colorScheme: "primary",
        },
        {
          id: "total-received-today",
          label: "Total Received Today",
          value: `${formatInt(receivedToday.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(receivedToday.secondary, 2)} SQM`,
          icon: ArrowDownLeft,
          colorScheme: "success",
        },
        {
          id: "total-out-today",
          label: "Total Out Today",
          value: `${formatInt(outToday.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(outToday.secondary, 2)} SQM`,
          icon: ArrowUpRight,
          colorScheme: "warning",
        },
      ];
    }

    if (warehouseType === "storage") {
      const data = kpiQuery.data as {
        totalStock: { count: number; secondary: number };
        receivedToday: { count: number; secondary: number };
        outToday?: { count: number; secondary: number };
        issueSawing?: { count: number; secondary: number };
        issueSlicing?: { count: number; secondary: number };
      } | null;

      const totalStock = data?.totalStock ?? { count: 0, secondary: 0 };
      const receivedToday = data?.receivedToday ?? { count: 0, secondary: 0 };

      if (isVeneerBlock) {
        const sawingLogs = data?.issueSawing?.count ?? 0;
        const sawingCbm = data?.issueSawing?.secondary ?? 0;
        const slicingLogs = data?.issueSlicing?.count ?? 0;
        const slicingCbm = data?.issueSlicing?.secondary ?? 0;

        return [
          {
            id: "total-logs-cbm",
            label: "Total Logs / CBM",
            value: `${formatInt(totalStock.count)} Logs`,
            secondaryValue: `/ ${formatDecimal(totalStock.secondary, 3)} CBM`,
            icon: Boxes,
            colorScheme: "primary",
          },
          {
            id: "total-received-today",
            label: "Total Received Today",
            value: `${formatInt(receivedToday.count)} Logs`,
            secondaryValue: `/ ${formatDecimal(receivedToday.secondary, 3)} CBM`,
            icon: ArrowDownLeft,
            colorScheme: "success",
          },
          {
            id: "total-issue-sawing",
            label: "Total Issue for Sawing",
            value: `${formatInt(sawingLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(sawingCbm, 3)} CBM`,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
          {
            id: "total-issue-slicing",
            label: "Total Issue for Slicing",
            value: `${formatInt(slicingLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(slicingCbm, 3)} CBM`,
            icon: ArrowUpRight,
            colorScheme: "neutral",
          },
        ];
      }

      const outToday = data?.outToday ?? { count: 0, secondary: 0 };
      const unitName =
        tab === "raw-veneer" ? "Leaves" : tab === "consumables" ? "Qty" : "Sheets";

      return [
        {
          id: "total-leaves-sqm",
          label: "Total Leaves / SQM",
          value: `${formatInt(totalStock.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(totalStock.secondary, 2)} SQM`,
          icon: Layers,
          colorScheme: "primary",
        },
        {
          id: "total-received-today",
          label: "Total Received Today",
          value: `${formatInt(receivedToday.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(receivedToday.secondary, 2)} SQM`,
          icon: ArrowDownLeft,
          colorScheme: "success",
        },
        {
          id: "total-out-today",
          label: "Total Out Today",
          value: `${formatInt(outToday.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(outToday.secondary, 2)} SQM`,
          icon: ArrowUpRight,
          colorScheme: "warning",
        },
      ];
    }

    if (warehouseType === "production") {
      const data = kpiQuery.data as {
        totalStock: { count: number; secondary: number };
        receivedToday: { count: number; secondary: number };
        outToday?: { count: number; secondary: number };
        issueMarquetry?: { count: number; secondary: number };
        issueGrouping?: { count: number; secondary: number };
        sawingIn?: { count: number; secondary: number };
        sawingIssued?: { count: number; secondary: number };
      } | null;

      const totalStock = data?.totalStock ?? { count: 0, secondary: 0 };
      const receivedToday = data?.receivedToday ?? { count: 0, secondary: 0 };

      if (tab === "raw-veneer") {
        const marquetry = data?.issueMarquetry ?? { count: 0, secondary: 0 };
        const grouping = data?.issueGrouping ?? { count: 0, secondary: 0 };
        return [
          {
            id: "total-leaves-sqm",
            label: "Total Leaves / SQM",
            value: `${formatInt(totalStock.count)} Leaves`,
            secondaryValue: `/ ${formatDecimal(totalStock.secondary, 2)} SQM`,
            icon: Layers,
            colorScheme: "primary",
          },
          {
            id: "total-received-today",
            label: "Total Received Today",
            value: `${formatInt(receivedToday.count)} Leaves`,
            secondaryValue: `/ ${formatDecimal(receivedToday.secondary, 2)} SQM`,
            icon: ArrowDownLeft,
            colorScheme: "success",
          },
          {
            id: "total-issue-marquetry",
            label: "Total Issue for Marquetry",
            value: `${formatInt(marquetry.count)} Leaves`,
            secondaryValue: `/ ${formatDecimal(marquetry.secondary, 2)} SQM`,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
          {
            id: "total-issue-grouping",
            label: "Total Issue for Grouping",
            value: `${formatInt(grouping.count)} Leaves`,
            secondaryValue: `/ ${formatDecimal(grouping.secondary, 2)} SQM`,
            icon: ArrowUpRight,
            colorScheme: "neutral",
          },
        ];
      }

      if (isSawing) {
        const sawingIn = data?.sawingIn ?? { count: 0, secondary: 0 };
        const sawingIssued = data?.sawingIssued ?? { count: 0, secondary: 0 };
        return [
          {
            id: "total-in-count",
            label: "Total In Count",
            value: `${formatInt(sawingIn.count)} Items`,
            secondaryValue:
              sawingIn.secondary > 0
                ? `/ ${formatDecimal(sawingIn.secondary, 3)} CBM`
                : undefined,
            icon: Boxes,
            colorScheme: "primary",
          },
          {
            id: "total-issued-count",
            label: "Total Issued Count",
            value: `${formatInt(sawingIssued.count)} Items`,
            secondaryValue:
              sawingIssued.secondary > 0
                ? `/ ${formatInt(sawingIssued.secondary)} Leaves`
                : undefined,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
        ];
      }

      const outToday = data?.outToday ?? { count: 0, secondary: 0 };
      const unitName = tab === "consumables" ? "Qty" : "Sheets";
      return [
        {
          id: "total-leaves-sqm",
          label: "Total Leaves / SQM",
          value: `${formatInt(totalStock.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(totalStock.secondary, 2)} SQM`,
          icon: Layers,
          colorScheme: "primary",
        },
        {
          id: "total-received-today",
          label: "Total Received Today",
          value: `${formatInt(receivedToday.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(receivedToday.secondary, 2)} SQM`,
          icon: ArrowDownLeft,
          colorScheme: "success",
        },
        {
          id: "total-out-today",
          label: "Total Out Today",
          value: `${formatInt(outToday.count)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(outToday.secondary, 2)} SQM`,
          icon: ArrowUpRight,
          colorScheme: "warning",
        },
      ];
    }

    return [];
  }, [isSawing, isSheetGood, isVeneerBlock, tab, warehouseType, kpiQuery.data]);

  return { cards, isLoading: kpiQuery.isLoading };
}
