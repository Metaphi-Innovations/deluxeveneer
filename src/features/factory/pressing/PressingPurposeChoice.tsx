import { Box, Stack, TextField, Typography } from "@mui/material";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import type { OrderRecord } from "../../orders/shared/ordersStore";
import type { PressingBaseMaterialType } from "./usePressingBaseStock";

export type PressingPurpose = "" | "Order" | "Sample Sheet";

export function PressingPurposeChoice({
  allocationError = "",
  baseType = "",
  onBaseTypeChange,
  onChange,
  onOrderItemNoChange,
  onOrderNoChange,
  orderItemNo,
  orderItemOptions,
  orderNo,
  orderOptions,
  orderRecords,
  showError,
  value,
}: {
  allocationError?: string;
  baseType?: PressingBaseMaterialType;
  onBaseTypeChange?: (value: PressingBaseMaterialType) => void;
  onChange: (value: PressingPurpose) => void;
  onOrderItemNoChange: (value: string) => void;
  onOrderNoChange: (value: string) => void;
  orderItemNo: string;
  orderItemOptions: readonly string[];
  orderNo: string;
  orderOptions: readonly string[];
  orderRecords: readonly OrderRecord[];
  showError: boolean;
  value: PressingPurpose;
}) {
  const selectedOrder = orderRecords.find((order) => order.orderNo === orderNo);

  return (
    <>
      <Stack
        sx={(theme) => ({
          ...formSectionCardSx(theme),
          alignItems: "center",
          flexDirection: "row",
          flexWrap: "wrap",
          gap: theme.spacing(1),
          padding: theme.spacing(1),
        })}
      >
        <PressingToggleField
          error={showError && !value}
          label="Pressing For"
          onChange={(next) => onChange(next as PressingPurpose)}
          options={["Order", "Sample Sheet"]}
          value={value}
        />
        {onBaseTypeChange ? (
          <PressingToggleField
            error={showError && !baseType}
            label="Base Material"
            onChange={(next) =>
              onBaseTypeChange(next as PressingBaseMaterialType)
            }
            options={["Plywood", "MDF"]}
            value={baseType}
          />
        ) : null}
      </Stack>

      {value === "Order" ? (
        <Stack
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            gap: theme.spacing(1.5),
          })}
        >
          <FormSectionHeader title="Order Selection" />
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(1.5),
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            })}
          >
            <>
              <PressingSelectField
                error={showError && !orderNo}
                label="Order No"
                onChange={onOrderNoChange}
                options={orderOptions}
                placeholder="Select order no"
                value={orderNo}
              />
              <PressingSelectField
                error={showError && !orderItemNo}
                label="Order Item No"
                onChange={onOrderItemNoChange}
                options={orderItemOptions}
                placeholder="Select order item no"
                value={orderItemNo}
              />
              <ReadOnlyPressingField
                label="Customer Name"
                value={selectedOrder?.customerName ?? ""}
              />
              <ReadOnlyPressingField
                label="Order Date"
                value={formatOrderDate(selectedOrder?.orderDate)}
              />
            </>
          </Box>
          {allocationError ? (
            <Typography
              color="error"
              sx={{ fontSize: "0.8125rem", fontWeight: 600 }}
            >
              {allocationError}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    </>
  );
}

function PressingToggleField({
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
    <Stack
      sx={{
        alignItems: "center",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 0.75,
        minWidth: 0,
      }}
    >
      <Typography
        component="span"
        sx={{ fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}
      >
        {label} *
      </Typography>
      <Box
        sx={(theme) => ({
          alignItems: "center",
          backgroundColor: theme.customTokens.surfaces.alt,
          border: `1px solid ${error ? theme.palette.error.main : theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          display: "flex",
          gap: "2px",
          height: 30,
          padding: "2px",
          width: "fit-content",
        })}
      >
        {options.map((option) => {
          const selected = value === option;

          return (
            <Box
              key={option}
              aria-pressed={selected}
              component="button"
              onClick={() => onChange(option)}
              type="button"
              sx={(theme) => ({
                alignItems: "center",
                backgroundColor: selected
                  ? theme.customTokens.brand.primary
                  : "transparent",
                border: "none",
                borderRadius: `${Math.max(theme.customTokens.radius.md - 2, 4)}px`,
                boxShadow: selected ? "0 1px 2px rgba(0,0,0,0.12)" : "none",
                color: selected
                  ? theme.palette.common.white
                  : theme.customTokens.text.secondary,
                cursor: "pointer",
                display: "inline-flex",
                font: "inherit",
                fontSize: "0.75rem",
                fontWeight: selected ? 700 : 600,
                height: "100%",
                justifyContent: "center",
                minWidth: 84,
                paddingX: 1.25,
                transition: "all 0.15s ease-in-out",
                whiteSpace: "nowrap",
                "&:hover": {
                  backgroundColor: selected
                    ? theme.customTokens.brand.primary
                    : theme.customTokens.surfaces.surface,
                  color: selected
                    ? theme.palette.common.white
                    : theme.customTokens.text.primary,
                },
                "&:focus-visible": {
                  outline: `2px solid ${theme.customTokens.brand.primary}`,
                  outlineOffset: 1,
                },
              })}
            >
              {option}
            </Box>
          );
        })}
      </Box>
      {error ? (
        <Typography
          sx={(theme) => ({
            color: theme.palette.error.main,
            fontSize: "0.75rem",
          })}
        >
          {label} is required.
        </Typography>
      ) : null}
    </Stack>
  );
}

function PressingSelectField({
  error,
  label,
  onChange,
  options,
  placeholder,
  value,
}: {
  error: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  placeholder: string;
  value: string;
}) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        component="label"
        sx={{ fontSize: "0.75rem", fontWeight: 700 }}
      >
        {label} *
      </Typography>
      <ErpSelectField
        helperText={error ? `${label} is required.` : " "}
        onChange={onChange}
        options={[...options]}
        placeholder={placeholder}
        searchable={options.length > 6}
        size="regular"
        state={error ? "error" : "default"}
        value={value}
      />
    </Stack>
  );
}

function ReadOnlyPressingField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        component="label"
        sx={{ fontSize: "0.75rem", fontWeight: 700 }}
      >
        {label}
      </Typography>
      <TextField
        fullWidth
        size="small"
        slotProps={{ input: { readOnly: true } }}
        sx={(theme) => getCompactFieldSx(theme)}
        value={value || "-"}
      />
    </Stack>
  );
}

function formatOrderDate(value: Date | undefined) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}
