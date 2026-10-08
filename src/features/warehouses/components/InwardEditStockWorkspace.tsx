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

import {
  getInwardGstMode,
  getSupplierState,
} from "../../masters/shared/masterDefinitions";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";
import { buildInvoiceTotalsSummary } from "../shared/invoiceTotalsSummary";
import {
  InwardEditStockLineItems,
  type InwardEditStockLineItemsHandle,
  type WarehouseAAddStockSlug,
  type WarehouseALineItemsTotals,
} from "./InwardEditStockLineItems";

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

export interface InwardEditStockWorkspaceHandle {
  getAdditionalCharges: () => Array<{ chargeName: string; amount: string }>;
  getLineItems: () => Array<{ id: string; values: Record<string, string> }>;
  validate: () => boolean;
}

export const InwardEditStockWorkspace = forwardRef<
  InwardEditStockWorkspaceHandle,
  {
    invoiceDate?: Date | null;
    initialAdditionalCharges?: Array<{ chargeName: string; amount: string }>;
    initialLineItems?: Array<{ id?: string; values: Record<string, string> }>;
    onRemarkChange?: (value: string) => void;
    readOnly?: boolean;
    remark?: string;
    slug: WarehouseAAddStockSlug;
    supplierName?: string;
    supplierState?: string;
    warehouseState?: string;
  }
>(function InwardEditStockWorkspace({
  initialAdditionalCharges,
  initialLineItems,
  onRemarkChange,
  readOnly = false,
  remark = "",
  slug,
  supplierName = "",
  supplierState = "",
  warehouseState = "",
}, ref) {
  const theme = useTheme();
  const lineItemsRef = useRef<InwardEditStockLineItemsHandle>(null);
  const nextChargeId = useRef((initialAdditionalCharges?.length ?? 0) + 1);
  const [lineTotals, setLineTotals] =
    useState<WarehouseALineItemsTotals>(emptyLineTotals);
  const [additionalCharges, setAdditionalCharges] = useState<
    AdditionalChargeRow[]
  >(() =>
    (initialAdditionalCharges ?? []).map((charge, index) => ({
      id: `charge-${index + 1}`,
      name: charge.chargeName,
      amount: charge.amount,
    })),
  );
  const gstMode = useMemo(() => {
    const resolvedSupplierState =
      getSupplierState(supplierName) || supplierState;
    return getInwardGstMode(warehouseState, resolvedSupplierState);
  }, [supplierName, supplierState, warehouseState]);

  const additionalChargesTotal = useMemo(
    () =>
      additionalCharges.reduce(
        (total, row) => total + parseNumber(row.amount),
        0,
      ),
    [additionalCharges],
  );

  const invoiceSummary = useMemo(
    () =>
      buildInvoiceTotalsSummary({
        itemSubTotal: lineTotals.itemAmount,
        additionalCharges: additionalChargesTotal,
        cgst: lineTotals.cgst,
        sgst: lineTotals.sgst,
        igst: lineTotals.igst,
        gstMode,
      }),
    [additionalChargesTotal, gstMode, lineTotals],
  );

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
      getAdditionalCharges: () =>
        additionalCharges
          .filter((row) => row.name.trim() || row.amount.trim())
          .map((row) => ({
            chargeName: row.name.trim(),
            amount: row.amount.trim(),
          })),
      getLineItems: () => lineItemsRef.current?.getFilledLineItems() ?? [],
      validate: () => lineItemsRef.current?.validate() ?? true,
    }),
    [additionalCharges],
  );

  return (
    <Stack
      sx={{
        gap: theme.spacing(2),
      }}
    >
      <SectionBlock title="Item Details">
        <Stack spacing={2}>
          <InwardEditStockLineItems
            ref={lineItemsRef}
            gstMode={gstMode}
            {...(initialLineItems ? { initialLineItems } : {})}
            readOnly={readOnly}
            slug={slug}
            onTotalsChange={setLineTotals}
          />

          <Box
            sx={{
              display: "grid",
              gap: theme.spacing(2),
              alignItems: "start",
              gridTemplateColumns: {
                xs: "1fr",
                md: "minmax(0, 1fr) minmax(260px, 320px)",
              },
            }}
          >
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
                      gridTemplateColumns: readOnly
                        ? "minmax(200px, 1.4fr) minmax(120px, 0.7fr)"
                        : "minmax(200px, 1.4fr) minmax(120px, 0.7fr) 40px",
                      px: 0.25,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Charge Name
                    </Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>
                      Amount
                    </Typography>
                    {!readOnly ? <span /> : null}
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
                        md: readOnly
                          ? "minmax(200px, 1.4fr) minmax(120px, 0.7fr)"
                          : "minmax(200px, 1.4fr) minmax(120px, 0.7fr) 40px",
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
                      sx={getCompactFieldSx(
                        theme,
                        readOnly ? "readOnly" : "default",
                        { dense: true },
                      )}
                      slotProps={{
                        input: {
                          readOnly,
                        },
                      }}
                    />
                    <TextField
                      fullWidth
                      placeholder="Amount"
                      size="small"
                      value={row.amount}
                      onChange={(event) =>
                        handleChargeChange(row.id, "amount", event.target.value)
                      }
                      sx={getCompactFieldSx(
                        theme,
                        readOnly ? "readOnly" : "default",
                        { dense: true },
                      )}
                      slotProps={{
                        input: {
                          readOnly,
                        },
                      }}
                    />
                    {!readOnly ? (
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
                    ) : null}
                  </Box>
                ))}

                {!readOnly ? (
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
                ) : null}
              </Stack>

              <Box sx={{ mt: 2, maxWidth: 360 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1,
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                  }}
                >
                  Remark
                </Typography>
                <TextField
                  fullWidth
                  multiline
                  minRows={5}
                  placeholder="Enter remark"
                  size="small"
                  value={remark}
                  onChange={(event) => onRemarkChange?.(event.target.value)}
                  sx={getCompactFieldSx(
                    theme,
                    readOnly ? "readOnly" : "default",
                    { dense: true },
                  )}
                  slotProps={{
                    input: {
                      readOnly,
                    },
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.alt,
                px: theme.spacing(2),
                py: theme.spacing(1.5),
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
                Cost Summary
              </Typography>

              <Stack spacing={0.75}>
                <SummaryLine
                  label="Sub Total"
                  value={invoiceSummary.subTotal}
                />
                <SummaryLine
                  label="Additional Charges"
                  value={invoiceSummary.additionalCharges}
                />
                <SummaryLine
                  label="Taxable Amount"
                  value={invoiceSummary.taxableAmount}
                />
                {invoiceSummary.gstLines.map((line) => (
                  <SummaryLine
                    key={line.label}
                    label={line.label}
                    value={line.value}
                  />
                ))}
                <Divider sx={{ borderColor: theme.customTokens.borders.default }} />
                <SummaryLine
                  emphasize
                  label="Total"
                  value={invoiceSummary.total}
                />
              </Stack>
            </Box>
          </Box>
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
