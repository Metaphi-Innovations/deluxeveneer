import { useEffect, useMemo, useState } from "react";

import { formatMasterValue } from "../../masters/shared";
import {
  getOrderLineItems,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderModuleConfig,
  type OrderRecord,
  useOrderRecords,
} from "../shared/ordersStore";

export type OrderListingTab = OrderCreateVariant;

export type OrderListingRow = OrderRecord & {
  designCode?: string | undefined;
  dispatchQuantity: string;
  issuedQuantity: string;
  orderId: string;
  orderItemNumber: string;
  orderLineItemId: string;
  rawMaterial: string;
  structuredCode?: string | undefined;
};

export function useOrderList({
  moduleConfig,
  requestedTab,
  viewOrderId,
}: {
  moduleConfig: OrderModuleConfig;
  requestedTab: OrderListingTab | null;
  viewOrderId: string | undefined;
}) {
  const rows = useOrderRecords();
  const [activeTab, setActiveTab] = useState<OrderListingTab>("order");
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    setActiveTab("order");
  }, [moduleConfig, requestedTab]);

  const listingRows = useMemo(() => {
    // Deduplicate by order id / orderNo so there is strictly 1 row per order
    const uniqueOrders = new Map<string, OrderRecord>();
    rows.forEach((row) => {
      const key = (row.orderNo || row.id).trim().toLowerCase();
      if (!uniqueOrders.has(key)) {
        uniqueOrders.set(key, row);
      }
    });

    return Array.from(uniqueOrders.values())
      .flatMap((row) => buildOrderListingRows(row))
      .sort((a, b) => {
        const dateA = new Date(a.orderDate || a.updatedDate || a.createdDate || 0).getTime();
        const dateB = new Date(b.orderDate || b.updatedDate || b.createdDate || 0).getTime();
        return dateB - dateA;
      });
  }, [rows]);

  const filteredRows = useMemo(() => {
    return listingRows.filter((row) => {
      if (searchValue.trim().length === 0) {
        return true;
      }

      return Object.values(row).some((value) =>
        formatMasterValue(value)
          .toLowerCase()
          .includes(searchValue.trim().toLowerCase()),
      );
    });
  }, [activeTab, listingRows, searchValue]);

  const viewRecord = useMemo(
    () => rows.find((row) => row.id === viewOrderId),
    [rows, viewOrderId],
  );

  useEffect(() => {
    setActiveTab("order");
  }, [viewRecord?.id]);

  return {
    activeTab,
    filteredRows,
    searchValue,
    setActiveTab,
    setSearchValue,
    viewRecord,
  };
}

function buildOrderListingRows(record: OrderRecord): OrderListingRow[] {
  const lineItems = getOrderLineItems(record.id);

  if (lineItems.length === 0) {
    return [
      {
        ...record,
        dispatchQuantity: record.quantitySheets,
        issuedQuantity: record.quantitySheets,
        id: record.id,
        orderId: record.id,
        orderItemNumber: "OI-001",
        orderLineItemId: "",
        rawMaterial: record.productCategory || record.orderType,
      },
    ];
  }

  // Display each order item separately in its own row
  return lineItems.map((item, index) => {
    const rawMaterial =
      item.productCategory === "Finished"
        ? item.finishedType
        : item.productCategory || item.finishedType || record.productCategory;

    // Use OI-001 or formatOrderItemNo
    const numericTail = String(item.id).match(/(\d+)$/)?.[1];
    const sequence = numericTail ? Number.parseInt(numericTail, 10) : index + 1;
    const orderItemNumber = `OI-${String(Number.isFinite(sequence) ? sequence : index + 1).padStart(3, "0")}`;

    return {
      ...record,
      ...getOrderLineItemListingValues(item),
      // Unique row ID for enterprise table keying
      id: `${record.id}-${item.id || index + 1}`,
      orderId: record.id,
      orderItemNumber,
      orderLineItemId: item.id,
      rawMaterial,
    };
  });
}

function getOrderLineItemListingValues(lineItem: OrderLineItem) {
  return {
    amount: lineItem.amount,
    designCode: lineItem.designCode,
    dispatchQuantity: lineItem.quantitySheets,
    grade: lineItem.grade,
    issuedQuantity: lineItem.quantitySheets,
    itemName: lineItem.itemName || lineItem.salesItemName,
    length: lineItem.length,
    productCategory: lineItem.productCategory || lineItem.finishedType,
    quantitySheets: lineItem.quantitySheets,
    remark: lineItem.remark,
    series: lineItem.series,
    sqm: lineItem.sqm,
    structuredCode: lineItem.structuredCode,
    subCategory: lineItem.subCategory,
    thickness: lineItem.thickness,
    totalSqm: lineItem.totalSqm,
    width: lineItem.width,
  };
}
