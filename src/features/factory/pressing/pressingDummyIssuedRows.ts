import {
  getOrderLineItems,
  type OrderLineItem,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import { formatSQF, formatSQM, SQM_TO_SQF } from "../../shared/numberFormat";
import { calculateSlicingSqmValue } from "../shared/slicingAreaCalculation";
import type { FactoryRecord } from "../shared/types";

const issuedSources = ["Splicing", "Grouping"] as const;

const dummyOrderDate = new Date(2026, 9, 15);

export const pressingDummyOrders: readonly OrderRecord[] = [
  {
    id: "pressing-demo-order-1",
    orderNo: "ORD-PRS-0001",
    orderDate: dummyOrderDate,
    customerName: "Demo Interiors",
    orderType: "Finished Order",
    priority: "Standard",
    productCategory: "Finished Goods",
    itemName: "Oak Pressed Panel",
    subCategory: "Decorative Panel",
    series: "DV-Prime",
    grade: "A",
    length: "2440 mm",
    width: "1220 mm",
    thickness: "0.60 mm",
    quantitySheets: "24",
    sqm: "71.45",
    totalSqm: "769.11",
    amount: "185000",
    remark: "Temporary Pressing demo order.",
    deliveryDate: new Date(2026, 10, 5),
    salesCoordinator: "Demo User",
    createdBy: "Demo User",
    updatedBy: "Demo User",
    createdDate: dummyOrderDate,
    updatedDate: dummyOrderDate,
    status: "Confirmed",
  },
  {
    id: "pressing-demo-order-2",
    orderNo: "ORD-PRS-0002",
    orderDate: new Date(2026, 9, 18),
    customerName: "Sample Furniture Studio",
    orderType: "Finished Order",
    priority: "Urgent",
    productCategory: "Finished Goods",
    itemName: "Walnut Pressed Panel",
    subCategory: "Marquetry Panel",
    series: "DV-Craft",
    grade: "A+",
    length: "2400 mm",
    width: "1200 mm",
    thickness: "0.80 mm",
    quantitySheets: "18",
    sqm: "51.84",
    totalSqm: "557.99",
    amount: "165000",
    remark: "Temporary Pressing demo order.",
    deliveryDate: new Date(2026, 10, 12),
    salesCoordinator: "Demo User",
    createdBy: "Demo User",
    updatedBy: "Demo User",
    createdDate: new Date(2026, 9, 18),
    updatedDate: new Date(2026, 9, 18),
    status: "In Production",
  },
] as const;

const pressingDummyOrderItems: Readonly<
  Record<string, readonly OrderLineItem[]>
> = {
  "pressing-demo-order-1": [
    createDummyOrderItem("pressing-demo-line-1", pressingDummyOrders[0]!),
  ],
  "pressing-demo-order-2": [
    createDummyOrderItem("pressing-demo-line-2", pressingDummyOrders[1]!),
  ],
};

export const pressingDummySampleNos = ["GRP-9001", "GRP-9002"] as const;

export function getPressingOrderLineItems(orderId: string) {
  return pressingDummyOrderItems[orderId] ?? getOrderLineItems(orderId);
}

export function buildPressingDummySampleIssuedRows(): FactoryRecord[] {
  return pressingDummySampleNos.map((sampleNo, index) => {
    const available = 8 + index * 4;
    const received = available + 3;
    const length = index === 0 ? "2440 mm" : "2400 mm";
    const width = index === 0 ? "1220 mm" : "1200 mm";
    const sqm = calculateSlicingSqmValue(length, width, available);

    return {
      id: `pressing-dummy-sample-${index + 1}`,
      listingState: "issued",
      issueSrNo: `ISS-PRS-SMP-${String(index + 1).padStart(4, "0")}`,
      issuedFrom: "Grouping",
      issuedFor: "Pressing",
      groupNo: sampleNo,
      sampleNo,
      orderNo: sampleNo,
      purpose: "SAMPLE",
      forLabel: "Sample",
      isSample: true,
      itemName: index === 0 ? "Oak Sample Panel" : "Walnut Sample Panel",
      itemSubCategory: "Sample Sheet",
      length,
      width,
      thickness: index === 0 ? "0.60 mm" : "0.80 mm",
      grade: index === 0 ? "A" : "A+",
      receivedQty: String(received),
      availableQty: String(available),
      receivedSheets: String(received),
      availableSheets: String(available),
      noOfSheets: String(received),
      sqm: formatSQM(sqm),
      sqf: formatSQF(sqm * SQM_TO_SQF),
      issuedDate: new Date(2026, 9, 20 + index),
      remark: "Temporary sample sheet issued for Pressing.",
      status: "Active",
    };
  });
}

export function buildPressingDummyIssuedRows(
  orders: readonly OrderRecord[],
): FactoryRecord[] {
  return orders.flatMap((order, orderIndex) => {
    const lineItems = getPressingOrderLineItems(String(order.id));
    const itemCount = Math.max(lineItems.length, 1);

    return Array.from({ length: itemCount }, (_, itemIndex) => {
      const line = lineItems[itemIndex];

      return issuedSources.map((issuedFrom, copy) => {
        const sequence = orderIndex * 20 + itemIndex * 2 + copy + 1;
        const available = 10 + copy * 6;
        const received = available + 4;
        const length =
          line?.length || order.length || `${2400 + sequence * 10} mm`;
        const width = line?.width || order.width || `${1200 + copy * 20} mm`;
        const thickness = line?.thickness || order.thickness || "0.60 mm";
        const sqmValue = calculateSlicingSqmValue(length, width, available);
        const sqm = sqmValue > 0 ? sqmValue : 18 + copy * 4;

        return {
          id: `pressing-dummy-${order.id}-${itemIndex + 1}-${copy + 1}`,
          listingState: "issued",
          issueSrNo: `ISS-PRS-${String(sequence).padStart(4, "0")}`,
          issuedFrom,
          issuedFor: "Pressing",
          groupNo: `GRP-${String(sequence).padStart(4, "0")}`,
          orderNo: order.orderNo,
          orderItemNo: String(itemIndex + 1),
          orderDate: order.orderDate,
          customerName: order.customerName,
          itemName: line?.itemName || line?.salesItemName || order.itemName,
          itemSubCategory: line?.subCategory || order.subCategory,
          length,
          width,
          thickness,
          cutColor:
            copy === 0
              ? "Quarter Cut / Natural Oak"
              : "Crown Cut / Dark Walnut",
          grade: line?.grade || order.grade || "A",
          receivedQty: String(received),
          availableQty: String(available),
          availableSheets: String(available),
          noOfSheets: String(received),
          sqm: formatSQM(sqm),
          sqf: formatSQF(sqm * SQM_TO_SQF),
          issuedDate: order.orderDate,
          remark:
            copy === 0
              ? "Issued for pressing against this order item."
              : "Second lot issued for pressing.",
          status: "Active",
        };
      });
    }).flat();
  });
}

function createDummyOrderItem(id: string, order: OrderRecord): OrderLineItem {
  return {
    id,
    productCategory: order.productCategory,
    finishedType: "Decorative",
    salesItemName: order.itemName,
    itemName: order.itemName,
    subCategory: order.subCategory,
    series: order.series,
    grade: order.grade,
    length: order.length,
    width: order.width,
    thickness: order.thickness,
    quantitySheets: order.quantitySheets,
    sqm: order.sqm,
    totalSqm: order.totalSqm,
    ratePerSqf: "225",
    baseType: "Plywood",
    baseName: "Commercial Plywood",
    baseLength: order.length,
    baseWidth: order.width,
    baseThickness: "12 mm",
    amount: order.amount,
    remark: order.remark,
  };
}
