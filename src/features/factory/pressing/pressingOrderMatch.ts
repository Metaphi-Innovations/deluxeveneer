import type { OrderLineItem, OrderRecord } from "../../orders/shared/ordersStore";
import { getOrderLineItems } from "../../orders/shared/ordersStore";
import type { FactoryRecord } from "../shared/types";

const nameStopWords = new Set([
  "board",
  "decorative",
  "embossed",
  "feature",
  "fluted",
  "marquetry",
  "panel",
  "sheet",
  "veneer",
  "wall",
]);

function textValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    return value.trim();
  }

  return "";
}

function normalizeText(value: unknown) {
  return textValue(value).toLowerCase().replace(/\s+/g, " ");
}

function numericValue(value: unknown) {
  const numeric = Number(textValue(value).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function nameTokens(value: unknown) {
  return normalizeText(value)
    .split(/[^a-z0-9]+/u)
    .filter((token) => token.length > 2 && !nameStopWords.has(token));
}

function namesMatch(orderValue: unknown, rowValue: unknown) {
  const orderText = normalizeText(orderValue);
  const rowText = normalizeText(rowValue);
  if (!orderText || !rowText) {
    return false;
  }

  if (orderText === rowText || orderText.includes(rowText) || rowText.includes(orderText)) {
    return true;
  }

  const orderTokens = nameTokens(orderValue);
  const rowTokens = new Set(nameTokens(rowValue));
  return orderTokens.some((token) => rowTokens.has(token));
}

function measuresMatch(orderValue: unknown, rowValue: unknown) {
  const orderNumber = numericValue(orderValue);
  const rowNumber = numericValue(rowValue);
  if (orderNumber !== null && rowNumber !== null) {
    return Math.abs(orderNumber - rowNumber) < 0.01;
  }

  const orderText = normalizeText(orderValue);
  const rowText = normalizeText(rowValue);
  return Boolean(orderText && rowText && orderText === rowText);
}

function rowText(row: FactoryRecord, keys: readonly string[]) {
  for (const key of keys) {
    const value = textValue(row[key]);
    if (value) {
      return value;
    }
  }

  return "";
}

export function getPressingOrderLine(order: OrderRecord, orderItemNo: string) {
  const lineItems = getOrderLineItems(order.id);
  const index = Math.max(0, Number(orderItemNo || "1") - 1);
  return lineItems[index] ?? lineItems[0] ?? null;
}

export function buildPressingOrderOverviewItems(
  order: OrderRecord,
  line: OrderLineItem | null,
  orderItemNo: string,
) {
  const fields: Array<[string, unknown]> = [
    ["Order No", order.orderNo],
    ["Order Date", order.orderDate],
    ["Customer Name", order.customerName],
    ["Order Item No", orderItemNo],
    ["Finished Type", line?.finishedType || order.productCategory],
    ["Item Name", line?.itemName || line?.salesItemName || order.itemName],
    ["Sub Category", line?.subCategory || order.subCategory],
    ["Series", line?.series || order.series],
    ["Grade", line?.grade || order.grade],
    ["Length", line?.length || order.length],
    ["Width", line?.width || order.width],
    ["Thickness", line?.thickness || order.thickness],
    ["No of Sheets", line?.quantitySheets || order.quantitySheets],
    ["SQM", line?.sqm || order.sqm],
  ];

  return fields.flatMap(([label, value]) => {
    const text = textValue(value);
    return text ? [{ label, value: text }] : [];
  });
}

function orderItemNumbersMatch(rowValue: unknown, selectedValue: string) {
  const rowItemNo = normalizeText(rowValue);
  const selectedItemNo = normalizeText(selectedValue);
  if (!rowItemNo || !selectedItemNo) {
    return false;
  }

  if (rowItemNo === selectedItemNo) {
    return true;
  }

  const rowDigits = rowItemNo.replace(/\D/g, "");
  const selectedDigits = selectedItemNo.replace(/\D/g, "");
  if (rowDigits && selectedDigits) {
    return Number(rowDigits) === Number(selectedDigits);
  }

  return false;
}

export function pressingRowIssuedForOrder(
  row: FactoryRecord,
  orderNo: string,
  orderItemNo: string,
) {
  const rowOrderNo = normalizeText(row.orderNo);
  const selectedOrderNo = normalizeText(orderNo);
  if (!rowOrderNo || !selectedOrderNo || rowOrderNo !== selectedOrderNo) {
    return false;
  }

  return orderItemNumbersMatch(row.orderItemNo, orderItemNo);
}

export function pressingRowMatchesOrder(
  row: FactoryRecord,
  order: OrderRecord,
  line: OrderLineItem | null,
  orderItemNo: string,
) {
  const rowOrderNo = normalizeText(row.orderNo);
  if (rowOrderNo && rowOrderNo === normalizeText(order.orderNo)) {
    const rowItemNo = normalizeText(row.orderItemNo).replace(/\D/g, "");
    const selectedItemNo = orderItemNo.replace(/\D/g, "");
    if (!rowItemNo || !selectedItemNo) {
      return true;
    }

    return rowItemNo === selectedItemNo;
  }

  const itemName = line?.itemName || line?.salesItemName || order.itemName;
  const rowItemName = rowText(row, ["itemName", "productName", "salesItemName"]);
  if (!namesMatch(itemName, rowItemName)) {
    return false;
  }

  const comparisons: Array<[unknown, string]> = [
    [line?.subCategory || order.subCategory, rowText(row, ["itemSubCategory", "subCategory"])],
    [line?.grade || order.grade, rowText(row, ["grade"])],
    [line?.length || order.length, rowText(row, ["length"])],
    [line?.width || order.width, rowText(row, ["width"])],
    [line?.thickness || order.thickness, rowText(row, ["thickness", "height"])],
  ];

  return comparisons.every(([orderValue, rowValue]) => {
    if (!textValue(orderValue) || !rowValue) {
      return true;
    }

    return measuresMatch(orderValue, rowValue);
  });
}
