import { Box, Stack, Typography } from "@mui/material";

import { formFieldLabelSx } from "../../shared/formSectionStyles";
import {
  getOrderLineItems,
  type OrderLineItem,
  type OrderRecord,
} from "../../orders/shared/ordersStore";

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
    ["Series", line.series || order.series],
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
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: theme.spacing(1.5),
        gridColumn: "1 / -1",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
        pt: 0.5,
      })}
    >
      {items.map((item) => (
        <Stack key={item.label} spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography sx={(theme) => formFieldLabelSx(theme)}>{item.label}</Typography>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.primary,
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.45,
              wordBreak: "break-word",
            })}
          >
            {item.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}
