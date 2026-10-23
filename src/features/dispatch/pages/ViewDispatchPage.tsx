import { useMemo } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  MessageSquare,
  Package2,
  Pencil,
  Receipt,
  RotateCcw,
  Tag,
  Truck,
  UserCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterPageShell, MasterSectionCard } from "../../masters/shared";
import { getCachedCustomerMasterRows } from "../../masters/customer-master/api/customerMasterApi";
import {
  getOrderLineItems,
  getOrderRecordByOrderNo,
  type OrderLineItem,
} from "../../orders/shared/ordersStore";
import { OrderStatusChip } from "../../orders/shared/OrderStatusChip";
import {
  type PackingRecord,
  usePackingRecords,
} from "../../packing/shared/packingStore";
import { canAccessPermission } from "../../permissions";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";

export function ViewDispatchPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  // Subscribe to updates so that changes re-render immediately
  const records = usePackingRecords();

  const record: PackingRecord | undefined = useMemo(() => {
    if (!id) return undefined;
    return records.find((entry) => entry.id === id);
  }, [id, records]);

  const canEdit = canAccessPermission("dispatch", "edit");
  const canView = canAccessPermission("dispatch", "view");

  const orderRecord = useMemo(() => {
    if (!record?.orderNo) return undefined;
    return getOrderRecordByOrderNo(record.orderNo);
  }, [record?.orderNo]);

  const initials = useMemo(() => {
    if (record?.packingId?.trim()) {
      const clean = record.packingId.replace(/^PKG-DV-/i, "").replace(/^PKG-/i, "");
      return clean.slice(0, 2).toUpperCase() || "DS";
    }
    if (record?.orderNo?.trim()) {
      const clean = record.orderNo.replace(/^ORD-(?:DV-|RAW-)?/i, "");
      return clean.slice(0, 2).toUpperCase() || "DS";
    }
    return "DS";
  }, [record?.packingId, record?.orderNo]);

  const handleEdit = () => {
    if (!record) return;
    navigate(`/dispatch/edit/${record.id}`);
  };

  const actionButtonSx = {
    minHeight: 36,
    height: 36,
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    px: 1.75,
    boxShadow: "none",
    textTransform: "none" as const,
    "&:hover": {
      boxShadow: "none",
    },
  };

  if (!canView) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Dispatch", to: "/dispatch" },
          { label: "View Dispatch" },
        ]}
        title="View Dispatch"
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view dispatch records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (!record) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Dispatch", to: "/dispatch" },
          { label: "Not Found" },
        ]}
        title="View Dispatch"
        contentGap={1.5}
      >
        <MasterSectionCard>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            The requested dispatch record could not be found.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  const isDispatched = record.packingState === "dispatched";
  const customerName = record.customerName || "—";
  const buyerAddress = record.dispatchBuyerAddress || "—";
  const sellerAddress =
    record.dispatchSellerAddress || "Deluxe Veneers Factory, Plot 14-16 GIDC, Gujarat, India";
  const transactionType = record.dispatchTransactionType || "Tax Invoice";
  const transporter = record.dispatchTransporter || "—";
  const transportMode = record.dispatchTransportMode || "Road";

  // Financial calculations
  const totalSheetsNum = parseInt(record.noOfSheets, 10) || 0;
  const dispatchQtyNum =
    parseInt(record.dispatchTotalQuantity || "", 10) || totalSheetsNum;
  const originalAmount = parseAmount(record.amount);
  const itemAmount =
    totalSheetsNum > 0
      ? (originalAmount / totalSheetsNum) * dispatchQtyNum
      : originalAmount;
  const originalSqm = parseAmount(record.sqm);
  const dispatchSqm =
    totalSheetsNum > 0
      ? ((originalSqm / totalSheetsNum) * dispatchQtyNum).toFixed(3)
      : record.sqm;
  const dispatchSqf =
    record.dispatchTotalSqf ||
    (totalSheetsNum > 0
      ? ((parseAmount(record.sqf) / totalSheetsNum) * dispatchQtyNum).toFixed(3)
      : record.sqf);

  const gstMode = resolveGstMode(customerName, buyerAddress, sellerAddress);
  const totalGstRate = gstMode === "none" ? 0 : 0.18;
  const totalGstAmount = itemAmount * totalGstRate;
  const halfGstAmount = totalGstAmount / 2;
  const cgstAmount = gstMode === "intra" ? halfGstAmount : 0;
  const sgstAmount = gstMode === "intra" ? halfGstAmount : 0;
  const igstAmount = gstMode === "inter" ? totalGstAmount : 0;
  const grandTotal = itemAmount + totalGstAmount;

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Dispatch", to: "/dispatch" },
        { label: record.packingId || record.orderNo || "View Dispatch" },
      ]}
      title="View Dispatch"
      contentGap={1.5}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">

          {canEdit && (
            <Button
              onClick={handleEdit}
              startIcon={<Pencil size={16} />}
              sx={[
                recordViewActionButtonSx,
                actionButtonSx,
                {
                  backgroundColor: theme.customTokens.brand.primary,
                  color: "#FFFFFF",
                },
              ]}
              variant="contained"
            >
              Edit Dispatch
            </Button>
          )}
        </Stack>
      }
    >
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 1.25 }}>
        {/* Header Identity Card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
            px: 1.75,
            py: 1,
            borderRadius: "8px",
            border: `1px solid ${theme.customTokens.borders.default}`,
            backgroundColor: theme.customTokens.surfaces.surface,
          }}
        >
          <Stack
            direction="row"
            spacing={1.5}
            alignItems="center"
            sx={{ minWidth: 0, flex: "1 1 auto" }}
          >
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.customTokens.brand.primaryScale[100],
                color: theme.customTokens.brand.primary,
                fontSize: "0.9375rem",
                fontWeight: 700,
                borderRadius: "8px",
                flexShrink: 0,
              }}
            >
              {initials}
            </Avatar>

            <Box sx={{ minWidth: 0 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ flexWrap: "wrap", gap: 0.75 }}
              >
                <Typography
                  sx={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: theme.customTokens.text.primary,
                    lineHeight: 1.25,
                  }}
                >
                  {record.packingId ? `Dispatch Ref #${record.packingId}` : `Order #${record.orderNo}`}
                </Typography>

                <Chip
                  label={record.orderItemNo ? `Item: ${record.orderItemNo}` : record.orderNo}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    backgroundColor: theme.customTokens.surfaces.paper,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                  }}
                />

                <Chip
                  label={transactionType}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    backgroundColor: "rgba(33, 150, 243, 0.12)",
                    color: "#1976D2",
                    border: "1px solid rgba(33, 150, 243, 0.3)",
                  }}
                />

                {transporter && transporter !== "—" && (
                  <Chip
                    label={`Transporter: ${transporter}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.72rem",
                      fontWeight: 600,
                      backgroundColor: theme.customTokens.surfaces.alt,
                      border: `1px solid ${theme.customTokens.borders.divider}`,
                    }}
                  />
                )}
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 0.25, flexWrap: "wrap", gap: 1 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: theme.customTokens.text.secondary,
                  }}
                >
                  Customer: {customerName}
                </Typography>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Calendar size={13} style={{ color: theme.customTokens.text.secondary }} />
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: theme.customTokens.text.secondary,
                    }}
                  >
                    Dispatch Date: {formatDisplayDate(record.dispatchDate ?? record.packingDate ?? record.createdDate)}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Truck size={13} style={{ color: theme.customTokens.text.secondary }} />
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: theme.customTokens.text.secondary,
                    }}
                  >
                    Mode: {transportMode}
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
            <DispatchStateChip isDispatched={isDispatched} />
          </Box>
        </Box>

        {/* 2-Column Responsive Master Information Cards */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, minmax(0, 1fr))",
            },
            gap: 1.25,
          }}
        >
          {/* Dispatch & Transport Overview */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              title="Dispatch & Transport Details"
              icon={Truck}
              variant="cardTop"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                columnGap: 2.5,
                rowGap: 1,
                mt: 1,
              }}
            >
              <ProfileField label="Packing Ref" value={record.packingId || "—"} />
              <ProfileField
                label="Dispatch Date"
                value={formatDisplayDate(record.dispatchDate ?? record.packingDate ?? record.createdDate)}
              />
              <ProfileField label="Customer Name" value={customerName} />
              <ProfileField label="Transaction Type" value={transactionType} />
              <ProfileField label="Transporter" value={transporter} />
              <ProfileField label="Transport Mode" value={transportMode} />
              <ProfileField label="Product Category" value={record.productCategory || "Finished"} />
              <ProfileField label="Order Type" value={record.orderType || "Finished"} />
            </Box>
          </Box>

          {/* Shipping Addresses & Origin Details */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              title="Billing & Shipping Addresses"
              icon={MapPin}
              variant="cardTop"
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 1.25,
                mt: 1,
              }}
            >
              <ProfileField
                allowWrap
                label="Buyer Shipping Address"
                value={buyerAddress}
              />
              <Divider sx={{ borderColor: theme.customTokens.borders.divider }} />
              <ProfileField
                allowWrap
                label="Seller / Dispatch Location"
                value={sellerAddress}
              />
            </Box>
          </Box>
        </Box>

        {/* Dispatched Line Items Table Section */}
        <Box
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            borderRadius: "8px",
          })}
        >
          <Stack spacing={1.5}>
            <FormSectionHeader
              icon={Layers}
              title="Dispatched Line Items"
              variant="cardTop"
            />
            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              }}
            >
              <Box sx={getTableScrollSx(theme)}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1200,
                    tableLayout: "auto",
                    width: "100%",
                  }}
                >
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: theme.customTokens.surfaces.alt,
                      }}
                    >
                      <TableCell sx={getHeaderCellSx(theme, 70)}>Sr.</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 130)}>Order No</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 110)}>Order Item</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 180)}>Item Name</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 100)}>Length</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 100)}>Width</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 100)}>Thickness</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 90)}>Total Qty</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 100)}>Dispatch Qty</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 100)}>Remaining</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 90)}>SQM</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 90)}>SQF</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 110)}>Taxable Amt</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 100)}>GST (18%)</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 120)}>Final Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow
                      sx={{
                        "&:hover": {
                          backgroundColor: theme.customTokens.surfaces.paper,
                        },
                      }}
                    >
                      <TableCell sx={getBodyCellSx(theme)}>1</TableCell>
                      <TableCell sx={{ ...getBodyCellSx(theme), fontWeight: 600 }}>{record.orderNo}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.orderItemNo}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.itemName}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.length}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.width}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.thickness}</TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>{totalSheetsNum}</TableCell>
                      <TableCell align="right" sx={{ ...getBodyCellSx(theme), fontWeight: 600, color: theme.customTokens.brand.primary }}>
                        {dispatchQtyNum}
                      </TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>
                        {Math.max(0, totalSheetsNum - dispatchQtyNum)}
                      </TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>{dispatchSqm}</TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>{dispatchSqf}</TableCell>
                      <TableCell align="right" sx={{ ...getBodyCellSx(theme), fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(itemAmount)}
                      </TableCell>
                      <TableCell align="right" sx={{ ...getBodyCellSx(theme), fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(totalGstAmount)}
                      </TableCell>
                      <TableCell align="right" sx={{ ...getBodyCellSx(theme), fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>
                        {formatAmount(grandTotal)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Source Order Overview (if matched) */}
        {orderRecord && (
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
            })}
          >
            <FormSectionHeader
              title={`Source Order Overview (${orderRecord.orderNo})`}
              icon={Package2}
              variant="cardTop"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                columnGap: 2.5,
                rowGap: 1,
                mt: 1,
              }}
            >
              <ProfileField label="Order Date" value={formatDisplayDate(orderRecord.orderDate)} />
              <ProfileField
                label="Required Delivery Date"
                value={formatDisplayDate(orderRecord.deliveryDate)}
              />
              <ProfileField label="Order Priority" value={orderRecord.priority} />
              <Box sx={{ minWidth: 0, py: 0.1 }}>
                <Typography
                  sx={{
                    fontSize: "0.71875rem",
                    fontWeight: 700,
                    color: theme.customTokens.text.secondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    lineHeight: 1.25,
                    mb: 0.2,
                  }}
                >
                  Order Status
                </Typography>
                <OrderStatusChip status={orderRecord.status} />
              </Box>
            </Box>
          </Box>
        )}

        {/* Invoice Totals & Remarks Grid */}
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(320px, 380px)",
            },
            alignItems: "start",
          }}
        >
          {/* Remarks Section */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              height: "100%",
            })}
          >
            <FormSectionHeader
              title="Dispatch Remarks & Instructions"
              icon={MessageSquare}
              variant="cardTop"
            />
            <Box sx={{ mt: 1 }}>
              <ProfileField
                label="Dispatch Remark"
                value={record.remark || "No special dispatch remarks recorded."}
                allowWrap
              />
              {record.sourceRef && (
                <Box sx={{ mt: 1 }}>
                  <ProfileField
                    label="Internal Source Reference"
                    value={record.sourceRef}
                  />
                </Box>
              )}
            </Box>
          </Box>

          {/* Invoice Financial Totals Card */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
            })}
          >
            <FormSectionHeader
              icon={Receipt}
              title="Invoice Totals"
              variant="cardTop"
            />
            <Stack spacing={1} sx={{ mt: 1 }}>
              <SummaryLine label="Dispatched Quantity" valueText={`${dispatchQtyNum} Sheets`} />
              <SummaryLine label="Dispatched SQM" valueText={`${dispatchSqm} SQM`} />
              <SummaryLine label="Dispatched SQF" valueText={`${dispatchSqf} SQF`} />
              <Divider sx={{ my: 0.35, borderColor: theme.customTokens.borders.divider }} />
              <SummaryLine label="Sub Total / Taxable Amount" value={itemAmount} />
              {gstMode === "intra" ? (
                <>
                  <SummaryLine label="CGST (9%)" value={cgstAmount} />
                  <SummaryLine label="SGST (9%)" value={sgstAmount} />
                </>
              ) : gstMode === "inter" ? (
                <SummaryLine label="IGST (18%)" value={igstAmount} />
              ) : null}
              <Divider sx={{ my: 0.35, borderColor: theme.customTokens.borders.divider }} />
              <SummaryLine
                bold
                label="Grand Total Amount"
                value={grandTotal}
                valueColor={theme.customTokens.brand.primary}
              />
            </Stack>
          </Box>
        </Box>

        {/* Audit Metadata Card */}
        {(record.createdBy || record.createdDate || record.updatedBy || record.updatedDate) ? (
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              backgroundColor: theme.customTokens.surfaces.alt || "transparent",
            })}
          >
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                columnGap: 2.5,
                rowGap: 1,
              }}
            >
              <ProfileField label="Created By" value={record.createdBy} />
              <ProfileField
                label="Created Date"
                value={formatDisplayDateTime(record.createdDate)}
              />
              <ProfileField label="Updated By" value={record.updatedBy} />
              <ProfileField
                label="Updated Date"
                value={formatDisplayDateTime(record.updatedDate)}
              />
            </Box>
          </Box>
        ) : null}
      </Box>
    </MasterPageShell>
  );
}

function DispatchStateChip({ isDispatched }: { isDispatched: boolean }) {
  if (isDispatched) {
    return (
      <Chip
        label="Dispatched"
        size="small"
        sx={{
          height: 24,
          fontSize: "0.75rem",
          fontWeight: 600,
          backgroundColor: "rgba(46, 125, 50, 0.12)",
          color: "#2E7D32",
          border: "1px solid rgba(46, 125, 50, 0.3)",
        }}
      />
    );
  }

  return (
    <Chip
      label="Ready for Dispatch"
      size="small"
      sx={{
        height: 24,
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: "rgba(237, 108, 2, 0.12)",
        color: "#ED6C02",
        border: "1px solid rgba(237, 108, 2, 0.3)",
      }}
    />
  );
}

function SummaryLine({
  bold = false,
  label,
  value,
  valueColor,
  valueText,
}: {
  bold?: boolean;
  label: string;
  value?: number;
  valueColor?: string;
  valueText?: string;
}) {
  const theme = useTheme();
  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      spacing={1}
    >
      <Typography
        sx={{
          fontSize: bold ? "0.875rem" : "0.8125rem",
          fontWeight: bold ? 700 : 500,
          color: bold ? theme.customTokens.text.primary : theme.customTokens.text.secondary,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: bold ? "0.9375rem" : "0.8125rem",
          fontWeight: bold ? 700 : 600,
          color: valueColor ?? theme.customTokens.text.primary,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {valueText !== undefined ? valueText : formatAmount(value ?? 0)}
      </Typography>
    </Stack>
  );
}

function ProfileField({
  allowWrap = false,
  label,
  value,
}: {
  allowWrap?: boolean;
  label: string;
  value?: string | number | null | undefined;
}) {
  const theme = useTheme();
  const rawValue = value !== undefined && value !== null ? String(value).trim() : "";
  const hasValue = Boolean(rawValue);

  return (
    <Box sx={{ minWidth: 0, py: 0.1 }}>
      <Typography
        sx={{
          fontSize: "0.71875rem",
          fontWeight: 700,
          color: theme.customTokens.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.25,
          mb: 0.2,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: hasValue
            ? theme.customTokens.text.primary
            : theme.customTokens.text.secondary,
          lineHeight: 1.35,
          whiteSpace: allowWrap ? "pre-wrap" : "nowrap",
          overflow: allowWrap ? "visible" : "hidden",
          textOverflow: allowWrap ? "clip" : "ellipsis",
          wordBreak: allowWrap ? "break-word" : "normal",
        }}
      >
        {hasValue ? rawValue : "—"}
      </Typography>
    </Box>
  );
}

function formatDisplayDate(dateVal?: unknown): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(dateVal);
  }
}

function formatDisplayDateTime(dateVal?: unknown): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
    color: theme.customTokens.text.secondary,
    whiteSpace: "nowrap" as const,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    minWidth,
    py: 1,
    px: 1.5,
  };
}

function getBodyCellSx(theme: Theme) {
  return {
    fontSize: "0.8125rem",
    color: theme.customTokens.text.primary,
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    py: 1,
    px: 1.5,
    whiteSpace: "nowrap" as const,
  };
}

function getTableScrollSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}

function parseAmount(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (!val) return 0;
  const num = Number(String(val).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(num) ? num : 0;
}

function formatAmount(num: number): string {
  return formatAmountShared(num, { withSymbol: false });
}

function resolveGstMode(
  customerName: string,
  buyerAddress: string,
  sellerAddress: string,
): "intra" | "inter" | "none" {
  const fromAddr = (buyerAddress || "").toLowerCase();
  const sellerAddr = (sellerAddress || "").toLowerCase();

  const isBuyerGujarat = fromAddr.includes("gujarat");
  const isSellerGujarat = sellerAddr.includes("gujarat") || !sellerAddr.trim();

  if (isBuyerGujarat && isSellerGujarat) {
    return "intra";
  }

  // Check customer master cache
  const match = getCachedCustomerMasterRows().find(
    (row) => String(row.customerName ?? "").trim().toLowerCase() === customerName.trim().toLowerCase(),
  );
  if (match?.state) {
    const custState = String(match.state).trim().toLowerCase();
    if (custState === "gujarat") {
      return "intra";
    }
    return "inter";
  }

  return isBuyerGujarat ? "intra" : "inter";
}
