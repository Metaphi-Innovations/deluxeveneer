import {
  batchIssueBoardOrderToProduction,
  fetchProductionInventoryById,
  issueOrderToProduction,
  type BoardMaterialType,
} from "../api/productionWarehouseApi";
import {
  buildIssueSummaryLines,
  calculateIssuedArea,
  parseWholeQuantity,
  unitForMaterial,
  validateIssueStockForPacking,
} from "./issueStockForPacking.logic";
import type {
  IssueStockLineDraft,
  IssueStockMaterial,
  IssueStockOrderItemOption,
  IssueStockOrderOption,
  IssueStockRow,
} from "./issueStockForPacking.types";

async function revalidateStockRows(
  stockById: ReadonlyMap<string, IssueStockRow>,
  lines: readonly IssueStockLineDraft[],
) {
  const refreshed = new Map<string, IssueStockRow>();
  for (const line of lines) {
    const current = stockById.get(line.inventoryId);
    if (!current) {
      throw new Error("Selected stock is no longer available.");
    }
    try {
      const latest = await fetchProductionInventoryById(line.inventoryId);
      const availableQty = Number(
        latest.availableQuantity ??
          latest.noOfLeaves ??
          latest.noOfSheets ??
          latest.totalNoOfSheets ??
          current.availableQty,
      );
      refreshed.set(line.inventoryId, {
        ...current,
        availableQty: Number.isFinite(availableQty)
          ? availableQty
          : current.availableQty,
        availableSqm: Number(
          latest.availableSqm ?? latest.sqm ?? current.availableSqm,
        ),
        availableSqf: Number(
          latest.availableSqf ?? latest.sqf ?? current.availableSqf,
        ),
        batchNo: String(
          latest.batchNo ?? latest.batchNoCode ?? current.batchNo ?? "",
        ),
        palletNo: String(latest.palletNo ?? current.palletNo ?? ""),
      });
    } catch {
      // Keep snapshot when detail fetch fails; quantity validation still runs.
      refreshed.set(line.inventoryId, current);
    }
  }
  return refreshed;
}

/**
 * Issues Warehouse C stock against an order item only.
 * Packing is intentionally not created here — that comes later.
 */
export async function submitIssueStockForPacking(input: {
  warehouseId: string;
  material: IssueStockMaterial;
  stockById: ReadonlyMap<string, IssueStockRow>;
  order: IssueStockOrderOption;
  orderItem: IssueStockOrderItemOption;
  issueDate: string;
  remark: string;
  lines: readonly IssueStockLineDraft[];
}) {
  const validation = validateIssueStockForPacking({
    material: input.material,
    stockById: input.stockById,
    order: input.order,
    orderItem: input.orderItem,
    issueDate: input.issueDate,
    lines: input.lines,
  });
  if (!validation.ok) {
    throw new Error(validation.formError || "Fix validation errors before submitting.");
  }

  const refreshedStock = await revalidateStockRows(input.stockById, input.lines);
  const revalidation = validateIssueStockForPacking({
    material: input.material,
    stockById: refreshedStock,
    order: input.order,
    orderItem: input.orderItem,
    issueDate: input.issueDate,
    lines: input.lines,
  });
  if (!revalidation.ok) {
    throw new Error(
      revalidation.formError ||
        "Inventory or order balances changed. Refresh and try again.",
    );
  }

  const summaryLines = buildIssueSummaryLines({
    material: input.material,
    stockById: refreshedStock,
    lines: input.lines,
  });
  if (summaryLines.length === 0) {
    throw new Error("Nothing to issue.");
  }

  const isDummyOrder =
    input.order.id.startsWith("dummy-") ||
    input.orderItem.id.startsWith("dummy-");
  if (isDummyOrder) {
    // Frontend-only demo path: no warehouse API call for dummy order/item.
    return {
      warehouseIssueIds: summaryLines.map(
        (line) => `dummy-issue-${line.inventoryId}`,
      ),
      totalQty: summaryLines.reduce((sum, line) => sum + line.qty, 0),
      unit: unitForMaterial(input.material),
      totalSqm: summaryLines.reduce((sum, line) => sum + line.sqm, 0),
      totalSqf: summaryLines.reduce((sum, line) => sum + line.sqf, 0),
    };
  }

  const warehouseIssueIds: string[] = [];

  if (input.material === "plywood" || input.material === "mdf") {
    const boardType: BoardMaterialType =
      input.material === "plywood" ? "PLYWOOD" : "MDF";
    const boardResult = await batchIssueBoardOrderToProduction({
      warehouseId: input.warehouseId,
      materialType: boardType,
      orderId: input.order.id,
      orderItemId: input.orderItem.id,
      remarks: input.remark || null,
      items: summaryLines.map((line) => ({
        inventoryId: line.inventoryId,
        issueSheets: line.qty,
      })),
    });
    for (const item of boardResult.items) {
      warehouseIssueIds.push(String(item.id));
    }
  } else {
    await issueOrderToProduction({
      orderNo: input.order.orderNo,
      orderItemNo: input.orderItem.orderItemNo,
      warehouseId: input.warehouseId,
      inventoryType: "raw-veneer",
    });
    for (const line of summaryLines) {
      warehouseIssueIds.push(`raw-issue-${line.inventoryId}-${Date.now()}`);
    }
  }

  return {
    warehouseIssueIds,
    totalQty: summaryLines.reduce((sum, line) => sum + line.qty, 0),
    unit: unitForMaterial(input.material),
    totalSqm: summaryLines.reduce((sum, line) => sum + line.sqm, 0),
    totalSqf: summaryLines.reduce((sum, line) => sum + line.sqf, 0),
  };
}

export function previewLineIssue(stock: IssueStockRow, qtyText: string) {
  const qty = parseWholeQuantity(qtyText) ?? 0;
  return calculateIssuedArea({
    availableQty: stock.availableQty,
    availableSqm: stock.availableSqm,
    availableSqf: stock.availableSqf,
    qtyToIssue: qty,
  });
}
