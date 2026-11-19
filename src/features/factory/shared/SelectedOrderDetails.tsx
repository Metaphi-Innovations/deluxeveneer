import { Box, Table, TableBody, TableCell, TableHead, TableRow } from "@mui/material";

import {
  getOrderLineItems,
  type OrderLineItem,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import {
  getDialogBodyCellSx,
  getDialogHeaderCellSx,
  getDialogScrollableTableSx,
} from "./listing/factoryListingParts";

function detailText(value: unknown) {
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

  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return "";
}

const baseTypeLabels: Record<string, string> = {
  PLYWOOD: "Plywood",
  MDF: "MDF",
  FLEECE_BACK: "Fleece Back",
  TWIST: "Twist",
};

function formatBaseType(value: unknown) {
  const text = detailText(value);
  if (!text) {
    return "";
  }

  return baseTypeLabels[text] ?? baseTypeLabels[text.toUpperCase()] ?? text;
}

function isFinishedOrderLine(order: OrderRecord, line: OrderLineItem) {
  const orderType = detailText(order.orderType);
  const finishedType =
    detailText(line.finishedType) || detailText(line.productCategory);

  return (
    /finished/i.test(orderType) ||
    /decorative|fluted|embossed|marquetry/i.test(finishedType) ||
    Boolean(detailText(line.baseType) || detailText(line.baseName))
  );
}

function detailFields(order: OrderRecord, line: OrderLineItem) {
  const finished = isFinishedOrderLine(order, line);
  const baseType =
    formatBaseType(line.baseType) || (finished ? "Plywood" : "");
  const baseName =
    detailText(line.baseName) || (baseType ? `${baseType} Base` : "");
  const fields: Array<[string, unknown]> = [
    ["Order Date", order.orderDate],
    ["Customer Name", order.customerName],
    ["Order Type", order.orderType],
    ["Priority", order.priority],
    ["Delivery Date", order.deliveryDate],
    ["Status", order.status],
    ["Finished Type", line.finishedType],
    ["Product Type", line.productCategory || line.finishedType],
    ["Base Type", baseType],
    ["Base Name", baseName],
    ["Sales Item Name", line.salesItemName],
    ["Item Name", line.itemName || order.itemName],
    ["Sub Category", line.subCategory || order.subCategory],
    ["Grade", line.grade || order.grade],
    ["Length", line.length || order.length],
    ["Width", line.width || order.width],
    ["Thickness", line.thickness || order.thickness],
    ["No. of Sheets", line.quantitySheets || order.quantitySheets],
    ["SQM", line.sqm || order.sqm],
    ["SQF", line.totalSqm || order.totalSqm],
    [
      "Base Length",
      detailText(line.baseLength) || (finished ? detailText(line.length) : ""),
    ],
    [
      "Base Width",
      detailText(line.baseWidth) || (finished ? detailText(line.width) : ""),
    ],
    [
      "Base Thickness",
      detailText(line.baseThickness) || (finished ? "12 mm" : ""),
    ],
    ["Remark", line.remark || order.remark],
  ];

  return fields.flatMap(([label, value]) => {
    const text = detailText(value);
    return text ? [{ label, value: text }] : [];
  });
}

function resolveOrderLineItem(order: OrderRecord, orderItemNo: string) {
  const lineItems = getOrderLineItems(order.id);
  if (lineItems.length === 0) {
    return null;
  }

  const exactIndex = Number(orderItemNo) - 1;
  if (Number.isInteger(exactIndex) && exactIndex >= 0 && exactIndex < lineItems.length) {
    return lineItems[exactIndex] ?? null;
  }

  const digits = orderItemNo.replace(/\D/g, "");
  if (!digits) {
    return null;
  }

  const digitIndex = Number(digits) - 1;
  if (!Number.isInteger(digitIndex) || digitIndex < 0 || digitIndex >= lineItems.length) {
    return null;
  }

  return lineItems[digitIndex] ?? null;
}

export function SelectedOrderDetails({
  lineItem,
  order,
  orderItemNo,
}: {
  lineItem?: OrderLineItem | null;
  order: OrderRecord | undefined;
  orderItemNo: string;
}) {
  if (!order || !orderItemNo) {
    return null;
  }

  const line = lineItem ?? resolveOrderLineItem(order, orderItemNo);
  if (!line) {
    return null;
  }

  const items = detailFields(order, line);
  if (items.length === 0) {
    return null;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Box sx={getDialogScrollableTableSx}>
        <Table size="small" sx={{ minWidth: "100%" }}>
          <TableHead>
            <TableRow>
              {items.map((item) => (
                <TableCell key={item.label} sx={getDialogHeaderCellSx}>
                  {item.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              {items.map((item) => (
                <TableCell key={item.label} sx={getDialogBodyCellSx}>
                  {item.value}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}
