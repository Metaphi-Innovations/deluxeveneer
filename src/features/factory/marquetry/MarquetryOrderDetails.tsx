import { type Dispatch, type SetStateAction } from "react";
import { Box, Stack, Typography } from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { formSectionCardSx, FormSectionHeader } from "../../shared/formSectionStyles";
import {
  getOrderLineItems,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import type { SampleSheetRecord } from "../shared/sampleSheetIdentityStore";

export type MarquetryOrderDetailsValue = {
  orderItemNo: string;
  orderNo: string;
  purpose: "" | "Order" | "Sample Sheets";
  sampleNo: string;
};

export function MarquetryOrderDetails({
  hasSubmitted,
  onChange,
  orderRecords,
  sampleSheetRecords,
  value,
}: {
  hasSubmitted: boolean;
  onChange: Dispatch<SetStateAction<MarquetryOrderDetailsValue>>;
  orderRecords: readonly OrderRecord[];
  sampleSheetRecords: readonly SampleSheetRecord[];
  value: MarquetryOrderDetailsValue;
}) {
  const selectedOrder = orderRecords.find((order) => order.orderNo === value.orderNo);
  const orderItemOptions = selectedOrder
    ? getOrderLineItems(selectedOrder.id).map((_, index) => String(index + 1))
    : [];
  const purposeError = hasSubmitted && !value.purpose;
  const orderNoError =
    hasSubmitted && value.purpose === "Order" && !value.orderNo;
  const orderItemError =
    hasSubmitted && value.purpose === "Order" && !value.orderItemNo;
  const sampleNoError =
    hasSubmitted && value.purpose === "Sample Sheets" && !value.sampleNo;

  const update = (key: keyof MarquetryOrderDetailsValue, nextValue: string) => {
    onChange((current) => ({
      ...current,
      [key]: nextValue,
      ...(key === "purpose"
        ? {
          orderNo: nextValue === "Order" ? current.orderNo : "",
          orderItemNo: nextValue === "Order" ? current.orderItemNo : "",
          sampleNo: nextValue === "Sample Sheets" ? current.sampleNo : "",
        }
        : {}),
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
      <FormSectionHeader title="Order Details" />
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
          error={purposeError}
          label="For"
          onChange={(nextValue) => update("purpose", nextValue)}
          options={["Order", "Sample Sheets"]}
          value={value.purpose}
        />

        {value.purpose === "Order" ? (
          <>
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
          </>
        ) : null}

        {value.purpose === "Sample Sheets" ? (
          <MarquetrySelectField
            error={sampleNoError}
            label="Sample Sheet No"
            onChange={(nextValue) => update("sampleNo", nextValue)}
            options={sampleSheetRecords.map((sample) => sample.sampleNo)}
            value={value.sampleNo}
          />
        ) : null}
      </Box>
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

export function isMarquetryOrderDetailsInvalid(value: MarquetryOrderDetailsValue) {
  return (
    value.purpose === "" ||
    (value.purpose === "Order" && (!value.orderNo || !value.orderItemNo)) ||
    (value.purpose === "Sample Sheets" && !value.sampleNo)
  );
}
