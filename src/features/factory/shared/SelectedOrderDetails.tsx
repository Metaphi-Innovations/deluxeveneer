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

function detailFields(order: OrderRecord, line: OrderLineItem) {
  const fields: Array<[string, unknown]> = [
    ["Order Date", order.orderDate],
    ["Customer Name", order.customerName],
    ["Order Type", order.orderType],
    ["Priority", order.priority],
    ["Delivery Date", order.deliveryDate],
    ["Status", order.status],
    ["Finished Type", line.finishedType],
    ["Product Type", line.productCategory],
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
    ["Base Type", line.baseType],
    ["Base Name", line.baseName],
    ["Base Length", line.baseLength],
    ["Base Width", line.baseWidth],
    ["Base Thickness", line.baseThickness],
    ["Remark", line.remark || order.remark],
  ];

  return fields.flatMap(([label, value]) => {
    const text = detailText(value);
    return text ? [{ label, value: text }] : [];
  });
}

export function SelectedOrderDetails({
  order,
  orderItemNo,
}: {
  order: OrderRecord | undefined;
  orderItemNo: string;
}) {
  if (!order || !orderItemNo) {
    return null;
  }

  const line = getOrderLineItems(order.id)[Number(orderItemNo) - 1];
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
