import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";

import { getWarehouseAGstMode } from "../../masters/shared/masterDefinitions";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";
import {
  WarehouseAAddStockLineItems,
  type WarehouseAAddStockLineItemsHandle,
  type WarehouseAAddStockSlug,
  type WarehouseALineItemsTotals,
} from "./WarehouseAAddStockLineItems";

type AdditionalChargeRow = {
  amount: string;
  id: string;
  name: string;
};

const emptyLineTotals: WarehouseALineItemsTotals = {
  cgst: 0,
  igst: 0,
  itemAmount: 0,
  sgst: 0,
  totalAmount: 0,
};

export interface WarehouseAAddStockWorkspaceHandle {
  getLineItems: () => Array<{ id: string; values: Record<string, string> }>;
  validate: () => boolean;
}

export const WarehouseAAddStockWorkspace = forwardRef<
  WarehouseAAddStockWorkspaceHandle,
  {
    invoiceDate?: Date | null;
    slug: WarehouseAAddStockSlug;
    supplierName?: string;
  }
>(function WarehouseAAddStockWorkspace({
  slug,
  supplierName = "",
}, ref) {
  const theme = useTheme();
  const lineItemsRef = useRef<WarehouseAAddStockLineItemsHandle>(null);
  const nextChargeId = useRef(1);
  const [lineTotals, setLineTotals] =
    useState<WarehouseALineItemsTotals>(emptyLineTotals);
  const [additionalCharges, setAdditionalCharges] = useState<
    AdditionalChargeRow[]
  >([]);

  const gstMode = useMemo(
    () => getWarehouseAGstMode(supplierName),
    [supplierName],
  );

  const additionalChargesTotal = useMemo(
    () =>
      additionalCharges.reduce(
        (total, row) => total + parseNumber(row.amount),
        0,
      ),
    [additionalCharges],
  );

  const invoiceSummary = useMemo(() => {
    const itemSubTotal = lineTotals.itemAmount;
    const cgst = lineTotals.cgst;
    const sgst = lineTotals.sgst;
    const igst = lineTotals.igst;
    const itemSubTotalWithTax = itemSubTotal + cgst + sgst + igst;
    const grandTotal = itemSubTotalWithTax + additionalChargesTotal;

    return {
      additionalCharges: additionalChargesTotal,
      cgst,
      grandTotal,
      itemSubTotal,
      itemSubTotalWithTax,
      sgst,
    };
  }, [additionalChargesTotal, lineTotals]);

  const handleAddCharge = () => {
    const id = `charge-${nextChargeId.current}`;
    nextChargeId.current += 1;
    setAdditionalCharges((current) => [
      ...current,
      { id, name: "", amount: "" },
    ]);
  };

  const handleChargeChange = (
    id: string,
    key: keyof Omit<AdditionalChargeRow, "id">,
    value: string,
  ) => {
    setAdditionalCharges((current) =>
      current.map((row) =>
        row.id === id
          ? {
              ...row,
              [key]: value,
            }
          : row,
      ),
    );
  };

  const handleRemoveCharge = (id: string) => {
    setAdditionalCharges((current) => current.filter((row) => row.id !== id));
  };

  useImperativeHandle(
    ref,
    () => ({
      getLineItems: () => lineItemsRef.current?.getFilledLineItems() ?? [],
      validate: () => lineItemsRef.current?.validate() ?? true,
    }),
    [],
  );

  return (
    <Stack
      sx={{
        gap: theme.spacing(2),
      }}
    >
      <SectionBlock title="Item Details">
        <Stack spacing={2}>
          <WarehouseAAddStockLineItems
            ref={lineItemsRef}
            gstMode={gstMode}
            slug={slug}
            onTotalsChange={setLineTotals}
          />

          <Stack spacing={2}>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                }}
              >
                Additional Charges
              </Typography>

              <Stack spacing={1}>
                {additionalCharges.length > 0 ? (
                  <Box
                    sx={{
                      display: { xs: "none", md: "grid" },
                      gap: 1,
                      gridTemplateColumns:
                        "minmax(200px, 1.4fr) minmax(120px, 0.7fr) 40px",
                      px: 0.25,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Charge Name
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Amount
                    </Typography>
                    <span />
                  </Box>
                ) : null}

                {additionalCharges.map((row) => (
                  <Box
                    key={row.id}
                    sx={{
                      display: "grid",
                      gap: 1,
                      alignItems: "center",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "minmax(200px, 1.4fr) minmax(120px, 0.7fr) 40px",
                      },
                    }}
                  >
                    <TextField
                      fullWidth
                      placeholder="Enter charge name"
                      size="small"
                      value={row.name}
                      onChange={(event) =>
                        handleChargeChange(row.id, "name", event.target.value)
                      }
                      sx={getCompactFieldSx(theme, "default", { dense: true })}
                    />
                    <TextField
                      fullWidth
                      placeholder="Amount"
                      size="small"
                      value={row.amount}
                      onChange={(event) =>
                        handleChargeChange(row.id, "amount", event.target.value)
                      }
                      sx={getCompactFieldSx(theme, "default", { dense: true })}
                    />
                    <IconButton
                      aria-label="Remove charge"
                      onClick={() => handleRemoveCharge(row.id)}
                      size="small"
                      sx={{
                        color: theme.customTokens.text.secondary,
                        "&:hover": {
                          color: theme.palette.error.main,
                        },
                      }}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </Box>
                ))}

                <Box>
                  <Button
                    disableElevation
                    onClick={handleAddCharge}
                    startIcon={<Plus size={14} />}
                    size="small"
                    sx={{
                      minHeight: 32,
                      textTransform: "none",
                      fontWeight: 600,
                      color: theme.customTokens.brand.primary,
                    }}
                    variant="text"
                  >
                    Add Charge
                  </Button>
                </Box>
              </Stack>
            </Box>

            <Divider sx={{ borderColor: theme.customTokens.borders.divider }} />

            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.alt,
                px: theme.spacing(2),
                py: theme.spacing(1.5),
                maxWidth: 420,
                ml: "auto",
                width: "100%",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 1,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: theme.customTokens.text.secondary,
                }}
              >
                Invoice Totals
              </Typography>

              <Stack spacing={0.75}>
                <SummaryLine
                  label="Item Sub Total"
                  value={invoiceSummary.itemSubTotal}
                />
                <SummaryLine label="CGST" value={invoiceSummary.cgst} />
                <SummaryLine label="SGST" value={invoiceSummary.sgst} />
                <SummaryLine
                  label="Item Sub Total"
                  value={invoiceSummary.itemSubTotalWithTax}
                />
                <SummaryLine
                  label="Additional Charges"
                  value={invoiceSummary.additionalCharges}
                />
                <Divider sx={{ borderColor: theme.customTokens.borders.default }} />
                <SummaryLine
                  emphasize
                  label="Grand Total"
                  value={invoiceSummary.grandTotal}
                />
              </Stack>
            </Box>
          </Stack>
        </Stack>
      </SectionBlock>
    </Stack>
  );
});

function SectionBlock({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      <Stack spacing={1.15}>
        <FormSectionHeader title={title} />
        {children}
      </Stack>
    </Box>
  );
}

function SummaryLine({
  emphasize = false,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: number;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography
        sx={(theme) => ({
          fontSize: emphasize ? "0.875rem" : "0.8125rem",
          fontWeight: emphasize ? 700 : 500,
          color: emphasize
            ? theme.palette.text.primary
            : theme.customTokens.text.secondary,
        })}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: emphasize ? "0.875rem" : "0.8125rem",
          fontWeight: emphasize ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatAmount(value)}
      </Typography>
    </Box>
  );
}

function parseNumber(value: string) {
  const numericValue = Number(value.replace(/,/g, "").replace(/%/g, "").trim());
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function formatAmount(value: number) {
  return formatAmountShared(value);
}
