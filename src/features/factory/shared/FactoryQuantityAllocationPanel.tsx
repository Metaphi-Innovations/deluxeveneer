import { Box, Stack, TextField, Typography, useTheme } from "@mui/material";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  formFieldLabelSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  formatQuantityDisplay,
  type FactoryQuantityUnit,
} from "./factoryQuantityAllocation";

export type FactoryQuantityAllocationPanelProps = {
  availableNow: number;
  errorText?: string;
  onProcessNowChange: (value: string) => void;
  onRemarkChange: (value: string) => void;
  onWastageNowChange: (value: string) => void;
  originalQuantity: number;
  pendingBalance: number;
  processNow: string;
  processedEarlier: number;
  remark: string;
  showValidation?: boolean;
  unitLabel: FactoryQuantityUnit | string;
  wastageEarlier: number;
  wastageNow: string;
};

export function FactoryQuantityAllocationPanel({
  availableNow,
  errorText = "",
  onProcessNowChange,
  onRemarkChange,
  onWastageNowChange,
  originalQuantity,
  pendingBalance,
  processNow,
  processedEarlier,
  remark,
  showValidation = false,
  unitLabel,
  wastageEarlier,
  wastageNow,
}: FactoryQuantityAllocationPanelProps) {
  const theme = useTheme();
  const validationMessage = showValidation ? errorText : "";

  return (
    <Box
      sx={{
        ...formSectionCardSx(theme),
      }}
    >
      <Stack spacing={1.75}>
        <FormSectionHeader title="Quantity Allocation" />

        <Box
          sx={{
            display: "grid",
            gap: theme.spacing(1.25),
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          <ReadOnlyQuantity
            label="Original Qty"
            value={formatQuantityDisplay(originalQuantity, unitLabel)}
          />
          <ReadOnlyQuantity
            label="Processed Earlier"
            value={formatQuantityDisplay(processedEarlier, unitLabel)}
          />
          <ReadOnlyQuantity
            label="Wastage Earlier"
            value={formatQuantityDisplay(wastageEarlier, unitLabel)}
          />
        </Box>

        <Box
          sx={{
            border: `1px solid ${theme.customTokens.brand.primaryScale[200]}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.brand.primaryScale[50],
            px: theme.spacing(1.5),
            py: theme.spacing(1.15),
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: theme.spacing(1),
            flexWrap: "wrap",
          }}
        >
          <Typography
            sx={{
              color: theme.customTokens.brand.primary,
              fontSize: "12px",
              fontWeight: 500,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            Available Now
          </Typography>
          <Typography
            sx={{
              color: theme.customTokens.brand.primary,
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.4,
            }}
          >
            {formatQuantityDisplay(availableNow, unitLabel)}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: theme.spacing(1.5),
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            alignItems: "start",
          }}
        >
          <EditableQuantityField
            label="Process Now"
            onChange={onProcessNowChange}
            value={processNow}
            error={Boolean(validationMessage)}
          />
          <EditableQuantityField
            label="Wastage Now"
            onChange={onWastageNowChange}
            value={wastageNow}
            error={Boolean(validationMessage)}
          />
          <Stack spacing={0.5} sx={{ minWidth: 0 }}>
            <Typography
              sx={{
                ...formFieldLabelSx(theme),
              }}
            >
              Pending Balance
            </Typography>
            <Typography
              sx={{
                color: theme.customTokens.text.primary,
                fontSize: "14px",
                fontWeight: 600,
                lineHeight: 1.4,
                minHeight: 40,
                display: "flex",
                alignItems: "center",
              }}
            >
              {formatQuantityDisplay(Math.max(0, pendingBalance), unitLabel)}
            </Typography>
            <Typography
              sx={{
                color: theme.customTokens.text.secondary,
                fontSize: "12px",
                fontWeight: 400,
                lineHeight: 1.4,
              }}
            >
              Auto-calculated
            </Typography>
          </Stack>
        </Box>

        {validationMessage ? (
          <Typography
            sx={{
              color: theme.palette.error.main,
              fontSize: "12px",
              fontWeight: 400,
            }}
          >
            {validationMessage}
          </Typography>
        ) : null}

        <Stack spacing={0.65}>
          <Typography
            sx={{
              ...formFieldLabelSx(theme),
            }}
          >
            Remark
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={2}
            placeholder="Optional remark"
            size="small"
            value={remark}
            onChange={(event) => onRemarkChange(event.target.value)}
            sx={getCompactFieldSx(theme)}
          />
        </Stack>
      </Stack>
    </Box>
  );
}

function ReadOnlyQuantity({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <Stack spacing={0.5} sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          ...formFieldLabelSx(theme),
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          color: theme.customTokens.text.primary,
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: 1.45,
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function EditableQuantityField({
  error,
  label,
  onChange,
  value,
}: {
  error?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const theme = useTheme();

  return (
    <Stack spacing={0.65} sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          ...formFieldLabelSx(theme),
        }}
      >
        {label}
      </Typography>
      <TextField
        error={error}
        fullWidth
        inputMode="decimal"
        placeholder="0"
        size="small"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        sx={{
          ...getCompactFieldSx(theme, error ? "error" : "default"),
          maxWidth: 220,
        }}
      />
    </Stack>
  );
}
