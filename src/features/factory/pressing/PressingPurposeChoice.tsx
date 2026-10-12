import { Box, Stack, TextField, Typography } from "@mui/material";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { formSectionCardSx, FormSectionHeader } from "../../shared/formSectionStyles";
import type { OrderRecord } from "../../orders/shared/ordersStore";
import { pressingCompactInputSx } from "./pressingCompactTable";
import type { PressingBaseMaterialType } from "./usePressingBaseStock";

export type PressingPurpose = "" | "Order" | "Sample Sheet";

const pressingPurposeOptions = ["Order", "Sample Sheet"] as const;

export function PressingPurposeChoice({
  allocationError = "",
  baseType = "",
  onBaseTypeChange,
  onChange,
  onOrderItemNoChange,
  onOrderNoChange,
  onSampleNoChange,
  orderItemNo,
  orderItemOptions,
  orderNo,
  orderOptions,
  orderRecords,
  sampleNo,
  sampleOptions,
  showError,
  value,
}: {
  allocationError?: string;
  baseType?: PressingBaseMaterialType;
  onBaseTypeChange?: (value: PressingBaseMaterialType) => void;
  onChange: (value: PressingPurpose) => void;
  onOrderItemNoChange: (value: string) => void;
  onOrderNoChange: (value: string) => void;
  onSampleNoChange: (value: string) => void;
  orderItemNo: string;
  orderItemOptions: readonly string[];
  orderNo: string;
  orderOptions: readonly string[];
  orderRecords: readonly OrderRecord[];
  sampleNo: string;
  sampleOptions: readonly string[];
  showError: boolean;
  value: PressingPurpose;
}) {
  const missing = showError && value === "";
  const orderMissing = showError && value === "Order" && !orderNo;
  const itemMissing = showError && value === "Order" && !orderItemNo;
  const sampleMissing = showError && value === "Sample Sheet" && !sampleNo;
  const baseMissing = showError && baseType === "";

  return (
    <Stack spacing={1}>
      <Box
        sx={(theme) => ({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: theme.spacing(1),
        })}
      >
      <Box
        sx={(theme) => ({
          ...formSectionCardSx(theme),
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(1),
          py: 1,
          width: "fit-content",
          maxWidth: "100%",
        })}
      >
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.text.primary,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 700,
            lineHeight: "28px",
            whiteSpace: "nowrap",
          })}
        >
          Pressing For
        </Typography>
        <Box sx={(theme) => ({ display: "flex", gap: theme.spacing(1) })}>
          {pressingPurposeOptions.map((option) => {
            const selected = value === option;

            return (
              <Box
                key={option}
                aria-pressed={selected}
                component="button"
                onClick={() => onChange(option)}
                type="button"
                sx={(theme) => ({
                  backgroundColor: selected
                    ? theme.customTokens.brand.primary
                    : theme.customTokens.surfaces.surface,
                  border: `1px solid ${
                    selected
                      ? theme.customTokens.brand.primary
                      : missing
                        ? theme.palette.error.main
                        : theme.customTokens.borders.default
                  }`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  color: selected
                    ? theme.palette.common.white
                    : theme.customTokens.text.primary,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: 700,
                  height: 28,
                  px: 0,
                  width: 104,
                  "&:hover": {
                    backgroundColor: selected
                      ? theme.customTokens.brand.primary
                      : theme.customTokens.surfaces.alt,
                    borderColor: selected
                      ? theme.customTokens.brand.primary
                      : theme.customTokens.borders.hover,
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.customTokens.brand.primary}`,
                    outlineOffset: 2,
                  },
                })}
              >
                {option}
              </Box>
            );
          })}
        </Box>
        {missing ? (
          <Typography
            sx={(theme) => ({
              color: theme.palette.error.main,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: 600,
              lineHeight: "28px",
            })}
          >
            Select Order or Sample Sheet.
          </Typography>
        ) : null}
      </Box>
      {onBaseTypeChange ? (
      <Box
        sx={(theme) => ({
          ...formSectionCardSx(theme),
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(1),
          py: 1,
          width: "fit-content",
          maxWidth: "100%",
        })}
      >
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.text.primary,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 700,
            lineHeight: "28px",
            whiteSpace: "nowrap",
          })}
        >
          Base Material
        </Typography>
        <Box sx={(theme) => ({ display: "flex", gap: theme.spacing(1) })}>
          {(["Plywood", "MDF"] as const).map((option) => {
            const selected = baseType === option;

            return (
              <Box
                key={option}
                aria-pressed={selected}
                component="button"
                onClick={() => onBaseTypeChange(option)}
                type="button"
                sx={(theme) => ({
                  backgroundColor: selected
                    ? theme.customTokens.brand.primary
                    : theme.customTokens.surfaces.surface,
                  border: `1px solid ${
                    selected
                      ? theme.customTokens.brand.primary
                      : baseMissing
                        ? theme.palette.error.main
                        : theme.customTokens.borders.default
                  }`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  color: selected
                    ? theme.palette.common.white
                    : theme.customTokens.text.primary,
                  cursor: "pointer",
                  font: "inherit",
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: 700,
                  height: 28,
                  px: 0,
                  width: 104,
                  "&:hover": {
                    backgroundColor: selected
                      ? theme.customTokens.brand.primary
                      : theme.customTokens.surfaces.alt,
                    borderColor: selected
                      ? theme.customTokens.brand.primary
                      : theme.customTokens.borders.hover,
                  },
                  "&:focus-visible": {
                    outline: `2px solid ${theme.customTokens.brand.primary}`,
                    outlineOffset: 2,
                  },
                })}
              >
                {option}
              </Box>
            );
          })}
        </Box>
        {baseMissing ? (
          <Typography
            sx={(theme) => ({
              color: theme.palette.error.main,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: 600,
              lineHeight: "28px",
            })}
          >
            Select Plywood or MDF.
          </Typography>
        ) : null}
      </Box>
      ) : null}
      </Box>

      {value === "Order" || value === "Sample Sheet" ? (
        <Stack
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            gap: theme.spacing(1),
          })}
        >
          <FormSectionHeader
            title={value === "Sample Sheet" ? "Sample Sheet Details" : "Order Details"}
          />
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(1),
              gridTemplateColumns:
                value === "Order" ? "repeat(4, minmax(0, 1fr))" : "minmax(0, 280px)",
            })}
          >
            {value === "Order" ? (
              <>
                <PressingSelectField
                  error={orderMissing}
                  label="Order No"
                  onChange={onOrderNoChange}
                  options={orderOptions}
                  value={orderNo}
                />
                <PressingSelectField
                  error={itemMissing}
                  label="Order Item No"
                  onChange={onOrderItemNoChange}
                  options={orderItemOptions}
                  value={orderItemNo}
                />
                <ReadOnlyPressingField
                  label="Customer Name"
                  value={
                    orderRecords.find((order) => order.orderNo === orderNo)?.customerName ?? ""
                  }
                />
                <ReadOnlyPressingField
                  label="Order Date"
                  value={formatOrderDate(
                    orderRecords.find((order) => order.orderNo === orderNo)?.orderDate,
                  )}
                />
              </>
            ) : (
              <PressingSelectField
                error={sampleMissing}
                label="Sample Sheet No"
                onChange={onSampleNoChange}
                options={sampleOptions}
                value={sampleNo}
              />
            )}
          </Box>
          {allocationError ? (
            <Typography
              sx={(theme) => ({
                color: theme.palette.error.main,
                fontSize: theme.typography.caption.fontSize,
                fontWeight: 600,
              })}
            >
              {allocationError}
            </Typography>
          ) : null}
        </Stack>
      ) : null}
    </Stack>
  );
}

function ReadOnlyPressingField({ label, value }: { label: string; value: string }) {
  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        component="label"
        sx={(theme) => ({
          color: theme.customTokens.text.primary,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 700,
        })}
      >
        {label}
      </Typography>
      <TextField
        disabled
        size="small"
        sx={(theme) => ({
          ...getCompactFieldSx(theme),
          ...pressingCompactInputSx(),
          width: "100%",
        })}
        value={value || "-"}
      />
    </Stack>
  );
}

function formatOrderDate(value: Date | undefined) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function PressingSelectField({
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
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
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
        options={[...options]}
        searchable
        size="dense"
        state={error ? "error" : "default"}
        value={value}
      />
    </Stack>
  );
}
