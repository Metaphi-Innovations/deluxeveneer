import type { BackendOrder, BackendOrderItem } from "../../../orders/api/ordersApi";
import type { ProductionInventoryItem } from "../api/productionWarehouseApi";
import type {
  IssueStockMaterial,
  IssueStockOrderItemOption,
  IssueStockOrderOption,
  IssueStockRow,
} from "./issueStockForPacking.types";
import { isActiveRawOrder, orderItemMatchesMaterial } from "./issueStockForPacking.logic";

function toNumber(value: unknown, fallback = 0) {
  const parsed = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function text(value: unknown) {
  return value === null || value === undefined ? "" : String(value).trim();
}

export function mapProductionItemToIssueStockRow(
  item: ProductionInventoryItem,
  material: IssueStockMaterial,
): IssueStockRow {
  const receivedQty = toNumber(
    item.receivedQuantity ??
      item.noOfLeaves ??
      item.noOfSheets ??
      item.totalNoOfSheets ??
      0,
  );
  const availableQty = toNumber(
    item.availableQuantity ??
      item.noOfLeaves ??
      item.noOfSheets ??
      item.totalNoOfSheets ??
      receivedQty,
  );
  const availableSqm = toNumber(item.availableSqm ?? item.sqm ?? item.totalSqm);
  const availableSqf = toNumber(item.availableSqf ?? item.sqf ?? item.totalSqf);

  return {
    id: String(item.id),
    storageSrNo: text(item.storageSrNo),
    productionSrNo: text(item.productionSrNo),
    palletNo: text(item.palletNo),
    batchNo: text(item.batchNo ?? item.batchNoCode ?? item.logNo ?? item.logCode),
    itemName: text(item.itemName),
    subCategory: text(item.subCategory ?? item.mdfType),
    materialType: material,
    grade: text(item.grade),
    color: text(item.color),
    length: text(item.length),
    width: text(item.width),
    thickness: text(item.thickness),
    receivedQty,
    availableQty,
    availableSqm,
    availableSqf,
  };
}

function mapOrderItem(
  item: BackendOrderItem,
  previouslyIssuedQty = 0,
): IssueStockOrderItemOption {
  const orderedQty = toNumber(
    item.noOfLeaves ?? item.quantitySheets ?? 0,
  );
  const remaining = Math.max(0, orderedQty - previouslyIssuedQty);
  return {
    id: item.id,
    orderItemNo: text(item.orderItemNo),
    productCategory: text(item.productCategory),
    itemName: text(item.itemName),
    grade: text(item.gradeName),
    length: text(item.length),
    width: text(item.width),
    thickness: text(item.thickness),
    orderedQty,
    previouslyIssuedQty,
    remainingQty: remaining,
    sqm: toNumber(item.sqm),
    sqf: toNumber(item.totalSqf),
  };
}

export function mapOrdersToIssueOptions(
  orders: readonly BackendOrder[],
  material: IssueStockMaterial,
  previouslyIssuedByItemId: ReadonlyMap<string, number> = new Map(),
): IssueStockOrderOption[] {
  return orders
    .map((order) => {
      const items = (order.items ?? [])
        .filter((item) =>
          orderItemMatchesMaterial(item.productCategory, material),
        )
        .map((item) =>
          mapOrderItem(item, previouslyIssuedByItemId.get(item.id) ?? 0),
        );
      const customerId = order.customerId ?? order.customer?.id;
      return {
        id: order.id,
        orderNo: text(order.orderNo),
        orderDate: text(order.orderDate),
        deliveryDate: text(order.requiredDeliveryDate),
        customerName: text(order.customerName || order.customer?.companyName),
        ...(customerId ? { customerId: String(customerId) } : {}),
        status: text(order.status),
        orderType: text(order.orderType),
        items,
      } satisfies IssueStockOrderOption;
    })
    .filter((order) => isActiveRawOrder(order) && order.items.length > 0);
}

export function getIssueStockForPackingPath(input: {
  warehouseId: string;
  materialType: IssueStockMaterial;
  inventoryId?: string;
}) {
  const base = `/warehouses/${input.warehouseId}/issue-for-order/${input.materialType}`;
  if (!input.inventoryId) {
    return base;
  }
  const query = new URLSearchParams({ inventoryId: input.inventoryId });
  return `${base}?${query.toString()}`;
}
