import { getOrderLineItems, type OrderRecord } from "../../orders/shared/ordersStore";
import { formatSQF, formatSQM, SQM_TO_SQF } from "../../shared/numberFormat";
import { calculateSlicingSqmValue } from "../shared/slicingAreaCalculation";
import type { FactoryRecord } from "../shared/types";

const issuedSources = ["Splicing", "Grouping"] as const;

export function buildPressingDummyIssuedRows(
  orders: readonly OrderRecord[],
): FactoryRecord[] {
  return orders.flatMap((order, orderIndex) => {
    const lineItems = getOrderLineItems(order.id);
    const itemCount = Math.max(lineItems.length, 1);

    return Array.from({ length: itemCount }, (_, itemIndex) => {
      const line = lineItems[itemIndex];

      return issuedSources.map((issuedFrom, copy) => {
        const sequence = orderIndex * 20 + itemIndex * 2 + copy + 1;
        const available = 10 + copy * 6;
        const received = available + 4;
        const length = line?.length || order.length || `${2400 + sequence * 10} mm`;
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
          groupNo: `GRP-2026-${String(sequence).padStart(4, "0")}`,
          orderNo: order.orderNo,
          orderItemNo: String(itemIndex + 1),
          orderDate: order.orderDate,
          customerName: order.customerName,
          itemName: line?.itemName || line?.salesItemName || order.itemName,
          itemSubCategory: line?.subCategory || order.subCategory,
          length,
          width,
          thickness,
          cutColor: copy === 0 ? "Quarter Cut / Natural Oak" : "Crown Cut / Dark Walnut",
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
