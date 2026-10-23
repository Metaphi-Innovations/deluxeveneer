import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Boxes, Layers } from "lucide-react";
import {
  fetchInwardKpisApi,
  getInwardInventoryTypeFromSlug,
} from "../api/inwardApi";
import { fetchStorageKpisApi } from "../storage/api/storageApi";
import { fetchProductionKpisApi } from "../production/api/productionWarehouseApi";
import {
  getFactoryIssuedWorkItems,
  useFactoryIssuedWorkItems,
} from "../../factory/shared/factoryIssuedWorkStore";
import { useWarehouseCMovedRows } from "../shared/warehouseCTransferStore";
import { useSawingFlowState } from "../../factory/sawing/sawingFrontendStore";
import type { WarehouseKpiCardData } from "../components/WarehouseKpiCards";

function isToday(dateStrOrObj: string | Date | null | undefined): boolean {
  if (!dateStrOrObj) return false;
  const today = new Date();
  
  if (typeof dateStrOrObj === "string") {
    const trimmed = dateStrOrObj.trim();
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
    if (match && match[1] && match[2] && match[3]) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      if (
        year === today.getFullYear() &&
        month === today.getMonth() &&
        day === today.getDate()
      ) {
        return true;
      }
    }
  }

  const d = typeof dateStrOrObj === "string" ? new Date(dateStrOrObj) : dateStrOrObj;
  if (Number.isNaN(d.getTime())) return false;
  return (
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()
  );
}

function parseNum(val: unknown): number {
  if (val == null) return 0;
  const n = typeof val === "number" ? val : parseFloat(String(val).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

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
 * Custom hook to dynamically calculate warehouse KPIs across:
 * - Inward Warehouse
 * - Storage Warehouse
 * - Production Warehouse
 *
 * Uses exactly ONE combined KPI API request per warehouse page and material context.
 */
export function useWarehouseDynamicKpis({
  warehouseType,
  warehouseId,
  tab,
}: {
  warehouseType: "inward" | "storage" | "production";
  warehouseId: string;
  tab: string; // veneer-blocks, raw-veneer, plywood, mdf, consumables, sawing
}): {
  cards: WarehouseKpiCardData[];
  isLoading: boolean;
} {
  // Always listen to local sync external stores if production or storage issues occur in client flow
  useFactoryIssuedWorkItems();
  const movedRows = useWarehouseCMovedRows();
  const sawingFlowState = useSawingFlowState();

  const isVeneerBlock = tab === "veneer-blocks";
  const isSheetGood = tab === "raw-veneer" || tab === "plywood" || tab === "mdf" || tab === "consumables";
  const isSawing = tab === "sawing";
  const inwardInventoryType = getInwardInventoryTypeFromSlug(tab);

  const isEnabled = Boolean(warehouseId) && (
    (warehouseType === "inward" && Boolean(inwardInventoryType)) ||
    (warehouseType === "storage" && Boolean(tab)) ||
    (warehouseType === "production" && (isSheetGood || isSawing))
  );

  // Single combined KPI query per warehouse page / material tab
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

    // 1. INWARD WAREHOUSE
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

      const unitName = tab === "raw-veneer" ? "Leaves" : tab === "consumables" ? "Qty" : "Sheets";
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

    // 2. STORAGE WAREHOUSE
    if (warehouseType === "storage") {
      const data = kpiQuery.data as {
        totalStock: { count: number; secondary: number };
        receivedToday: { count: number; secondary: number };
        outToday?: { count: number; secondary: number };
        issueSawing?: { count: number; secondary: number };
        issueSlicing?: { count: number; secondary: number };
      } | null;

      const totalStock = { ...(data?.totalStock ?? { count: 0, secondary: 0 }) };
      const receivedToday = { ...(data?.receivedToday ?? { count: 0, secondary: 0 }) };

      if (isVeneerBlock) {
        let sawingLogs = data?.issueSawing?.count ?? 0;
        let sawingCbm = data?.issueSawing?.secondary ?? 0;
        const slicingLogs = data?.issueSlicing?.count ?? 0;
        const slicingCbm = data?.issueSlicing?.secondary ?? 0;

        // Overlay frontend-issued sawing items that were issued today
        for (const item of sawingFlowState.extraIssued) {
          const itemIssueDate = (item.issueDate || item.issuedDate) as string | Date | null | undefined;
          if (isToday(itemIssueDate)) {
            const cbm = parseNum(item.cbm ?? item.receivedCbm);
            sawingLogs += 1;
            sawingCbm += cbm;
            // Also deduct from available stock count if frontend issued
            totalStock.count = Math.max(0, totalStock.count - 1);
            totalStock.secondary = Math.max(0, totalStock.secondary - cbm);
          }
        }

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
      const unitName = tab === "raw-veneer" ? "Leaves" : tab === "consumables" ? "Qty" : "Sheets";

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

    // 3. PRODUCTION WAREHOUSE
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

      const issuedWork = getFactoryIssuedWorkItems();

      let marquetryLeaves = 0;
      let marquetrySqm = 0;
      let groupingLeaves = 0;
      let groupingSqm = 0;
      let outTodayLeaves = 0;
      let outTodaySqm = 0;

      // Realtime factory work / grouping / marquetry issues out today
      for (const work of issuedWork) {
        if (isToday(work.createdAt)) {
          const snapshot = work.sourceSnapshot || {};
          const leaves = parseNum(
            snapshot.issuedLeafCount ??
              snapshot.groupingIssuedLeaves ??
              snapshot.noOfLeaves ??
              snapshot.quantity ??
              snapshot.sheets
          );
          const sqm = parseNum(snapshot.sqm ?? snapshot.totalSqMeter ?? snapshot.issuedSqm);
          outTodayLeaves += leaves;
          outTodaySqm += sqm;

          const dest = (work.destinationSlug || "").toLowerCase();
          const purpose = (
            String(snapshot.issuedFor || snapshot.destinationProcess || "")
          ).toLowerCase();

          if (dest === "marquetry" || purpose.includes("marquetry")) {
            marquetryLeaves += leaves;
            marquetrySqm += sqm;
          } else if (dest === "grouping" || purpose.includes("grouping")) {
            groupingLeaves += leaves;
            groupingSqm += sqm;
          }
        }
      }

      const totalStock = data?.totalStock ?? { count: 0, secondary: 0 };
      const receivedToday = data?.receivedToday ?? { count: 0, secondary: 0 };

      if (tab === "raw-veneer") {
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
            value: `${formatInt(marquetryLeaves)} Leaves`,
            secondaryValue: `/ ${formatDecimal(marquetrySqm, 2)} SQM`,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
          {
            id: "total-issue-grouping",
            label: "Total Issue for Grouping",
            value: `${formatInt(groupingLeaves)} Leaves`,
            secondaryValue: `/ ${formatDecimal(groupingSqm, 2)} SQM`,
            icon: ArrowUpRight,
            colorScheme: "neutral",
          },
        ];
      }

      if (tab === "sawing") {
        const sawingMoved = movedRows.filter(
          (row) =>
            String((row as any).inventorySlug ?? "").toLowerCase() === "sawing"
        );

        let totalInCount = sawingMoved.length + sawingFlowState.extraIssued.length;
        let totalInCbm = 0;

        for (const r of sawingMoved) {
          totalInCbm += parseNum((r as any).cbm ?? (r as any).receivedCbm);
        }
        for (const r of sawingFlowState.extraIssued) {
          totalInCbm += parseNum(r.cbm ?? r.receivedCbm ?? r.availableCbm);
        }

        if (totalInCount === 0 && data?.sawingIn?.count) {
          totalInCount = data.sawingIn.count;
          totalInCbm = data.sawingIn.secondary;
        }

        const uniqueIssuedIds = new Set<string>();
        let totalIssuedCount = 0;
        let totalIssuedLeaves = 0;

        for (const done of sawingFlowState.extraDone) {
          const id = String(done.id);
          if (!uniqueIssuedIds.has(id)) {
            uniqueIssuedIds.add(id);
            totalIssuedCount += 1;
            totalIssuedLeaves += parseNum(done.noOfLeaves ?? done.sheets ?? done.quantity ?? 1);
          }
        }

        for (const hist of sawingFlowState.extraHistory) {
          const id = String(hist.id);
          if (!uniqueIssuedIds.has(id)) {
            uniqueIssuedIds.add(id);
            totalIssuedCount += 1;
            totalIssuedLeaves += parseNum(hist.noOfLeaves ?? hist.sheets ?? hist.quantity ?? 1);
          }
        }

        for (const work of issuedWork) {
          const src = (work.sourceSlug || "").toLowerCase();
          const srcProcess = (work.sourceProcess || "").toLowerCase();
          if (src.includes("sawing") || srcProcess.includes("sawing")) {
            const id = String(work.id);
            if (!uniqueIssuedIds.has(id)) {
              uniqueIssuedIds.add(id);
              totalIssuedCount += 1;
              const snapshot = work.sourceSnapshot || {};
              const leaves = parseNum(
                snapshot.issuedLeafCount ??
                  snapshot.groupingIssuedLeaves ??
                  snapshot.noOfLeaves ??
                  snapshot.quantity ??
                  snapshot.sheets
              );
              totalIssuedLeaves += leaves > 0 ? leaves : 1;
            }
          }
        }

        if (totalIssuedCount === 0 && data?.sawingIssued?.count) {
          totalIssuedCount = data.sawingIssued.count;
          totalIssuedLeaves = data.sawingIssued.secondary;
        }

        return [
          {
            id: "total-in-count",
            label: "Total In Count",
            value: `${formatInt(totalInCount)} Items`,
            secondaryValue: totalInCbm > 0 ? `/ ${formatDecimal(totalInCbm, 3)} CBM` : undefined,
            icon: Boxes,
            colorScheme: "primary",
          },
          {
            id: "total-issued-count",
            label: "Total Issued Count",
            value: `${formatInt(totalIssuedCount)} Items`,
            secondaryValue: totalIssuedLeaves > 0 ? `/ ${formatInt(totalIssuedLeaves)} Leaves` : undefined,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
        ];
      }

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
          value: `${formatInt(outTodayLeaves)} ${unitName}`,
          secondaryValue: `/ ${formatDecimal(outTodaySqm, 2)} SQM`,
          icon: ArrowUpRight,
          colorScheme: "warning",
        },
      ];
    }

    return [];
  }, [
    isSawing,
    isSheetGood,
    isVeneerBlock,
    tab,
    warehouseType,
    kpiQuery.data,
    movedRows,
    sawingFlowState,
  ]);

  return { cards, isLoading: kpiQuery.isLoading };
}
