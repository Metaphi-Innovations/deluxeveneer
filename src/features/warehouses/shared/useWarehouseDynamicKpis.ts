import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownLeft, ArrowUpRight, Boxes, Layers } from "lucide-react";
import { queryKeys } from "../../../query/queryKeys";
import {
  exportInwardsApi,
  fetchInwardById,
  getInwardInventoryTypeFromSlug,
} from "../api/inwardApi";
import { exportStorageInventoryApi } from "../storage/api/storageApi";
import { exportProductionInventoryApi } from "../production/api/productionWarehouseApi";
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
    // If it's a date-only string like "YYYY-MM-DD", parse components directly to avoid UTC shift
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
 */
export function useWarehouseDynamicKpis({
  warehouseType,
  warehouseId,
  tab,
}: {
  warehouseType: "inward" | "storage" | "production";
  warehouseId: string;
  tab: string; // veneer-blocks, raw-veneer, plywood, mdf, etc.
}): {
  cards: WarehouseKpiCardData[];
  isLoading: boolean;
} {
  // Always listen to local sync external stores if production or storage issues occur
  useFactoryIssuedWorkItems();
  const movedRows = useWarehouseCMovedRows();
  const sawingFlowState = useSawingFlowState();

  const isVeneerBlock = tab === "veneer-blocks";
  const isSheetGood = tab === "raw-veneer" || tab === "plywood" || tab === "mdf";
  const isSawing = tab === "sawing";

  // 1. INWARD WAREHOUSE
  const inwardInventoryType = getInwardInventoryTypeFromSlug(tab);
  const inwardQuery = useQuery({
    queryKey: [...queryKeys.warehouse.inward.all, "kpis-export", warehouseId, tab],
    enabled: warehouseType === "inward" && Boolean(warehouseId) && Boolean(inwardInventoryType),
    queryFn: async () => {
      const headers = await exportInwardsApi({
        warehouseId,
        inventoryType: inwardInventoryType!,
      });

      // To calculate accurate total logs/cbm or leaves/sqm, fetch line items for inward headers
      const detailPromises = headers.map((h) =>
        fetchInwardById(h.id).catch(() => null)
      );
      const details = await Promise.all(detailPromises);
      return details.filter((d): d is NonNullable<typeof d> => d !== null);
    },
    staleTime: 1000 * 60,
  });

  // 2. STORAGE WAREHOUSE
  const storageInventoryQuery = useQuery({
    queryKey: [...queryKeys.warehouse.storage.all, "kpis-inventory", warehouseId, tab],
    enabled: warehouseType === "storage" && Boolean(warehouseId),
    queryFn: () =>
      exportStorageInventoryApi(tab, {
        warehouseId,
        section: "inventory",
      }),
    staleTime: 1000 * 60,
  });

  const storageHistoryQuery = useQuery({
    queryKey: [...queryKeys.warehouse.storage.all, "kpis-history", warehouseId, tab],
    enabled: warehouseType === "storage" && Boolean(warehouseId),
    queryFn: () =>
      exportStorageInventoryApi(tab, {
        warehouseId,
        section: "history",
      }),
    staleTime: 1000 * 60,
  });

  // 3. PRODUCTION WAREHOUSE
  const isSupportedProductionTab =
    tab === "raw-veneer" || tab === "plywood" || tab === "mdf" || tab === "consumables";
  const productionQuery = useQuery({
    queryKey: ["warehouse-production", "kpis-inventory", warehouseId, tab],
    enabled: warehouseType === "production" && Boolean(warehouseId) && isSupportedProductionTab,
    queryFn: () =>
      exportProductionInventoryApi({
        warehouseId,
        tab: tab as "raw-veneer" | "plywood" | "mdf" | "consumables",
      }),
    staleTime: 1000 * 60,
  });

  const cards = useMemo<WarehouseKpiCardData[]>(() => {
    // Check supported tabs
    if (!isVeneerBlock && !isSheetGood && !isSawing) {
      return [];
    }

    if (warehouseType === "inward") {
      const details = inwardQuery.data ?? [];
      let totalLogs = 0;
      let totalCbm = 0;
      let totalLeaves = 0;
      let totalSqm = 0;

      let receivedTodayLogs = 0;
      let receivedTodayCbm = 0;
      let receivedTodayLeaves = 0;
      let receivedTodaySqm = 0;

      let outTodayLogs = 0;
      let outTodayCbm = 0;
      let outTodayLeaves = 0;
      let outTodaySqm = 0;

      for (const inward of details) {
        const headerToday = isToday(inward.inwardDate);
        const headerUpdatedToday = isToday(inward.updatedAt);

        for (const item of inward.items || []) {
          const cbm = parseNum(item.cbm);
          const leaves =
            item.availableStock != null
              ? parseNum(item.availableStock)
              : tab === "raw-veneer"
              ? parseNum(item.noOfLeaves)
              : parseNum(item.sheets);
          const receivedLeaves =
            tab === "raw-veneer" ? parseNum(item.noOfLeaves) : parseNum(item.sheets);
          const sqm = parseNum(item.totalSqMeter);

          if (isVeneerBlock) {
            totalLogs += 1;
            totalCbm += cbm;

            if (headerToday) {
              receivedTodayLogs += 1;
              receivedTodayCbm += cbm;
            }

            // QC passed lines move to storage (or if qcLocked, forwarded out)
            const isQcPassed = (item.qcStatus ?? "").toUpperCase() === "PASS";
            if (isQcPassed && (headerUpdatedToday || isToday(inward.updatedAt))) {
              outTodayLogs += 1;
              outTodayCbm += cbm;
            }
          } else {
            totalLeaves += leaves;
            totalSqm += sqm;

            if (headerToday) {
              receivedTodayLeaves += receivedLeaves;
              receivedTodaySqm += sqm;
            }

            // Transferred out through QC Pass / storage movement
            const isQcPassed = (item.qcStatus ?? "").toUpperCase() === "PASS";
            if (isQcPassed && (headerUpdatedToday || isToday(inward.updatedAt))) {
              outTodayLeaves += parseNum(item.qcPassQuantity ?? receivedLeaves);
              outTodaySqm += sqm;
            }
          }
        }
      }

      if (isVeneerBlock) {
        return [
          {
            id: "total-logs-cbm",
            label: "Total Logs / CBM",
            value: `${formatInt(totalLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(totalCbm, 3)} CBM`,
            icon: Boxes,
            colorScheme: "primary",
          },
          {
            id: "total-received-today",
            label: "Total Received Today",
            value: `${formatInt(receivedTodayLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(receivedTodayCbm, 3)} CBM`,
            icon: ArrowDownLeft,
            colorScheme: "success",
          },
          {
            id: "total-out-today",
            label: "Total Out Today",
            value: `${formatInt(outTodayLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(outTodayCbm, 3)} CBM`,
            icon: ArrowUpRight,
            colorScheme: "warning",
          },
        ];
      }

      return [
        {
          id: "total-leaves-sqm",
          label: "Total Leaves / SQM",
          value: `${formatInt(totalLeaves)} ${tab === "raw-veneer" ? "Leaves" : "Sheets"}`,
          secondaryValue: `/ ${formatDecimal(totalSqm, 2)} SQM`,
          icon: Layers,
          colorScheme: "primary",
        },
        {
          id: "total-received-today",
          label: "Total Received Today",
          value: `${formatInt(receivedTodayLeaves)} ${tab === "raw-veneer" ? "Leaves" : "Sheets"}`,
          secondaryValue: `/ ${formatDecimal(receivedTodaySqm, 2)} SQM`,
          icon: ArrowDownLeft,
          colorScheme: "success",
        },
        {
          id: "total-out-today",
          label: "Total Out Today",
          value: `${formatInt(outTodayLeaves)} ${tab === "raw-veneer" ? "Leaves" : "Sheets"}`,
          secondaryValue: `/ ${formatDecimal(outTodaySqm, 2)} SQM`,
          icon: ArrowUpRight,
          colorScheme: "warning",
        },
      ];
    }

    if (warehouseType === "storage") {
      const inventoryItems = storageInventoryQuery.data ?? [];
      const historyItems = storageHistoryQuery.data ?? [];

      const issuedToSawingIds = new Set(
        sawingFlowState.extraIssued.map((r) => String(r.sourceStorageId || "")).filter(Boolean)
      );

      let totalLogs = 0;
      let totalCbm = 0;
      let totalLeaves = 0;
      let totalSqm = 0;

      let receivedTodayLogs = 0;
      let receivedTodayCbm = 0;
      let receivedTodayLeaves = 0;
      let receivedTodaySqm = 0;

      for (const item of inventoryItems) {
        // If this item was issued to sawing via frontend flow, skip it from available inventory
        if (isVeneerBlock && issuedToSawingIds.has(String(item.id))) {
          continue;
        }

        const cbm = parseNum(item.cbm);
        const leaves =
          item.availableQuantity != null
            ? parseNum(item.availableQuantity)
            : tab === "raw-veneer"
            ? parseNum(item.noOfLeaves)
            : parseNum(item.sheets);
        const sqm =
          item.availableSqm != null
            ? parseNum(item.availableSqm)
            : parseNum(item.totalSqMeter);

        if (isVeneerBlock) {
          totalLogs += 1;
          totalCbm += cbm;

          if (isToday(item.createdAt) || isToday(item.inwardDate)) {
            receivedTodayLogs += 1;
            receivedTodayCbm += cbm;
          }
        } else {
          totalLeaves += leaves;
          totalSqm += sqm;

          if (isToday(item.createdAt) || isToday(item.inwardDate)) {
            receivedTodayLeaves +=
              item.receivedQuantity != null
                ? parseNum(item.receivedQuantity)
                : leaves;
            receivedTodaySqm +=
              item.receivedSqm != null
                ? parseNum(item.receivedSqm)
                : sqm;
          }
        }
      }

      // Out today: items issued, transferred to production, or sawed/sliced today
      let outTodayLogs = 0;
      let outTodayCbm = 0;
      let sawingLogs = 0;
      let sawingCbm = 0;
      let slicingLogs = 0;
      let slicingCbm = 0;
      let outTodayLeaves = 0;
      let outTodaySqm = 0;

      const recordedSawingStorageIds = new Set<string>();

      for (const hist of historyItems) {
        if (isToday(hist.createdAt) || isToday(hist.updatedAt)) {
          if (isVeneerBlock) {
            const histCbm = parseNum(hist.cbm);
            outTodayLogs += 1;
            outTodayCbm += histCbm;

            const issueTarget = (hist.issueTo || hist.remark || "").toLowerCase();
            if (issueTarget.includes("slicing")) {
              slicingLogs += 1;
              slicingCbm += histCbm;
            } else {
              // Defaults to sawing if issued to sawing or production
              sawingLogs += 1;
              sawingCbm += histCbm;
              if (hist.id) recordedSawingStorageIds.add(String(hist.id));
            }
          } else {
            const forwardedQty =
              hist.receivedQuantity != null
                ? parseNum(hist.receivedQuantity)
                : tab === "raw-veneer"
                ? parseNum(hist.noOfLeaves)
                : parseNum(hist.sheets);
            outTodayLeaves += forwardedQty;
            outTodaySqm += parseNum(hist.receivedSqm ?? hist.totalSqMeter);
          }
        }
      }

      // Also include frontend-issued sawing items that were issued today
      if (isVeneerBlock) {
        for (const item of sawingFlowState.extraIssued) {
          const itemIssueDate = (item.issueDate || item.issuedDate) as string | Date | null | undefined;
          const storageId = String(item.sourceStorageId || item.id);
          if (isToday(itemIssueDate) && !recordedSawingStorageIds.has(storageId)) {
            const cbm = parseNum(item.cbm ?? item.receivedCbm);
            sawingLogs += 1;
            sawingCbm += cbm;
            outTodayLogs += 1;
            outTodayCbm += cbm;
          }
        }
      }

      if (isVeneerBlock) {
        return [
          {
            id: "total-logs-cbm",
            label: "Total Logs / CBM",
            value: `${formatInt(totalLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(totalCbm, 3)} CBM`,
            icon: Boxes,
            colorScheme: "primary",
          },
          {
            id: "total-received-today",
            label: "Total Received Today",
            value: `${formatInt(receivedTodayLogs)} Logs`,
            secondaryValue: `/ ${formatDecimal(receivedTodayCbm, 3)} CBM`,
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

      return [
        {
          id: "total-leaves-sqm",
          label: "Total Leaves / SQM",
          value: `${formatInt(totalLeaves)} ${tab === "raw-veneer" ? "Leaves" : "Sheets"}`,
          secondaryValue: `/ ${formatDecimal(totalSqm, 2)} SQM`,
          icon: Layers,
          colorScheme: "primary",
        },
        {
          id: "total-received-today",
          label: "Total Received Today",
          value: `${formatInt(receivedTodayLeaves)} ${tab === "raw-veneer" ? "Leaves" : "Sheets"}`,
          secondaryValue: `/ ${formatDecimal(receivedTodaySqm, 2)} SQM`,
          icon: ArrowDownLeft,
          colorScheme: "success",
        },
        {
          id: "total-out-today",
          label: "Total Out Today",
          value: `${formatInt(outTodayLeaves)} ${tab === "raw-veneer" ? "Leaves" : "Sheets"}`,
          secondaryValue: `/ ${formatDecimal(outTodaySqm, 2)} SQM`,
          icon: ArrowUpRight,
          colorScheme: "warning",
        },
      ];
    }

    if (warehouseType === "production") {
      const items = productionQuery.data ?? [];
      const issuedWork = getFactoryIssuedWorkItems();

      let totalLeaves = 0;
      let totalSqm = 0;
      let receivedTodayLeaves = 0;
      let receivedTodaySqm = 0;
      let outTodayLeaves = 0;
      let outTodaySqm = 0;

      let marquetryLeaves = 0;
      let marquetrySqm = 0;
      let groupingLeaves = 0;
      let groupingSqm = 0;

      for (const item of items) {
        const leaves =
          item.availableQuantity != null
            ? parseNum(item.availableQuantity)
            : tab === "raw-veneer"
            ? parseNum(item.noOfLeaves)
            : parseNum(item.noOfSheets ?? item.totalNoOfSheets);
        const receivedLeaves =
          item.receivedQuantity != null
            ? parseNum(item.receivedQuantity)
            : tab === "raw-veneer"
            ? parseNum(item.noOfLeaves)
            : parseNum(item.noOfSheets ?? item.totalNoOfSheets);
        const sqm = parseNum(item.sqm ?? item.totalSqm);

        totalLeaves += leaves;
        totalSqm += sqm;

        if (isToday(item.inwardDate as string) || isToday(item.createdAt as string)) {
          receivedTodayLeaves += receivedLeaves;
          receivedTodaySqm += sqm;
        }
      }

      // Factory work / grouping issues out today
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

      if (tab === "raw-veneer") {
        return [
          {
            id: "total-leaves-sqm",
            label: "Total Leaves / SQM",
            value: `${formatInt(totalLeaves)} Leaves`,
            secondaryValue: `/ ${formatDecimal(totalSqm, 2)} SQM`,
            icon: Layers,
            colorScheme: "primary",
          },
          {
            id: "total-received-today",
            label: "Total Received Today",
            value: `${formatInt(receivedTodayLeaves)} Leaves`,
            secondaryValue: `/ ${formatDecimal(receivedTodaySqm, 2)} SQM`,
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
        // Sawing items in production warehouse:
        // 1. Items moved to Warehouse C (from inspection pass)
        // 2. Items issued to Sawing flow (from storage warehouse or initial sawing)
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

        // Total Issued Count:
        // Counts items that have been processed/completed and issued out from Sawing
        // (in extraDone, extraHistory, or tracked in factory issuedWork where source is sawing)
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

      return [
        {
          id: "total-leaves-sqm",
          label: "Total Leaves / SQM",
          value: `${formatInt(totalLeaves)} Sheets`,
          secondaryValue: `/ ${formatDecimal(totalSqm, 2)} SQM`,
          icon: Layers,
          colorScheme: "primary",
        },
        {
          id: "total-received-today",
          label: "Total Received Today",
          value: `${formatInt(receivedTodayLeaves)} Sheets`,
          secondaryValue: `/ ${formatDecimal(receivedTodaySqm, 2)} SQM`,
          icon: ArrowDownLeft,
          colorScheme: "success",
        },
        {
          id: "total-out-today",
          label: "Total Out Today",
          value: `${formatInt(outTodayLeaves)} Sheets`,
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
    inwardQuery.data,
    storageInventoryQuery.data,
    storageHistoryQuery.data,
    productionQuery.data,
    movedRows,
    sawingFlowState,
  ]);

  const isLoading =
    warehouseType === "inward"
      ? inwardQuery.isLoading
      : warehouseType === "storage"
      ? storageInventoryQuery.isLoading || storageHistoryQuery.isLoading
      : productionQuery.isLoading;

  return { cards, isLoading };
}
