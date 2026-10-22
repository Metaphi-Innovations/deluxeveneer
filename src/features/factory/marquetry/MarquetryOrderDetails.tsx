import { type Dispatch, type SetStateAction } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  formSectionCardSx,
  plainFormSectionHeadingSx,
} from "../../shared/formSectionStyles";
import { SelectedOrderDetails } from "../shared/SelectedOrderDetails";
import {
  getOrderLineItems,
  type OrderRecord,
} from "../../orders/shared/ordersStore";

export type MarquetryOrderDetailsValue = {
  orderItemNo: string;
  orderNo: string;
  purpose: "Order";
};

export function MarquetryOrderDetails({
  hasSubmitted,
  onChange,
  orderRecords,
  value,
}: {
  hasSubmitted: boolean;
  onChange: Dispatch<SetStateAction<MarquetryOrderDetailsValue>>;
  orderRecords: readonly OrderRecord[];
  value: MarquetryOrderDetailsValue;
}) {
  const selectedOrder = orderRecords.find(
    (order) => order.orderNo === value.orderNo,
  );
  const orderItemOptions = selectedOrder
    ? getOrderLineItems(selectedOrder.id).map((_, index) => String(index + 1))
    : [];
  const orderNoError = hasSubmitted && !value.orderNo;
  const orderItemError = hasSubmitted && !value.orderItemNo;

  const update = (key: "orderItemNo" | "orderNo", nextValue: string) => {
    onChange((current) => ({
      ...current,
      purpose: "Order",
      [key]: nextValue,
      ...(key === "orderNo" ? { orderItemNo: "" } : {}),
    }));
  };

  return (
    <Stack
      sx={(theme) => ({
        ...formSectionCardSx(theme),
        gap: theme.spacing(1.5),
      })}
    >
      <Typography component="h2" sx={plainFormSectionHeadingSx}>
        Order Details
      </Typography>
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
          },
        })}
      >
        <MarquetrySelectField
          error={orderNoError}
          label="Order No"
          onChange={(nextValue) => update("orderNo", nextValue)}
          options={orderRecords.map((order) => order.orderNo)}
          value={value.orderNo}
        />
        <MarquetrySelectField
          error={orderItemError}
          label="Order Item No"
          onChange={(nextValue) => update("orderItemNo", nextValue)}
          options={orderItemOptions}
          value={value.orderItemNo}
        />
      </Box>
      <SelectedOrderDetails
        order={selectedOrder}
        orderItemNo={value.orderItemNo}
      />
    </Stack>
  );
}

function MarquetrySelectField({
  error,
  label,
  onChange,
  options,
  value,
}: {
  error: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  value: string;
}) {
  return (
    <Stack spacing={0.5}>
      <Typography
        component="label"
        sx={(theme) => ({
          color: theme.customTokens.text.primary,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 700,
        })}
      >
        {label} *
      </Typography>
      <ErpSelectField
        helperText={error ? `${label} is required.` : " "}
        onChange={onChange}
        options={options}
        searchable={options.length > 6}
        size="regular"
        state={error ? "error" : "default"}
        value={value}
      />
    </Stack>
  );
}

export function isMarquetryOrderDetailsInvalid(
  value: MarquetryOrderDetailsValue,
) {
  return !value.orderNo || !value.orderItemNo;
}
