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

  const listingRows = useMemo(
    () =>
      rows
        .flatMap((row) => buildOrderListingRows(row))
        .sort((a, b) => {
          const dateA = new Date(a.orderDate || a.updatedDate || a.createdDate || 0).getTime();
          const dateB = new Date(b.orderDate || b.updatedDate || b.createdDate || 0).getTime();
          return dateB - dateA;
        }),
    [rows],
  );

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
        id: `${record.id}:item-1`,
        orderId: record.id,
        orderItemNumber: "1",
        orderLineItemId: "",
        rawMaterial: record.productCategory || record.orderType,
      },
    ];
  }

  return lineItems.map((lineItem, index) => ({
    ...record,
    ...getOrderLineItemListingValues(lineItem),
    id: `${record.id}:${lineItem.id || `item-${index + 1}`}`,
    orderId: record.id,
    orderItemNumber: String(index + 1),
    orderLineItemId: lineItem.id,
    rawMaterial:
      lineItem.productCategory === "Finished"
        ? lineItem.finishedType
        : lineItem.productCategory || lineItem.finishedType || record.productCategory,
  }));
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
