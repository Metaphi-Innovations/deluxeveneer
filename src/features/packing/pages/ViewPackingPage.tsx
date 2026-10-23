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
import {
  getOrderLineItems,
  getOrderRecordByOrderNo,
  type OrderLineItem,
} from "../../orders/shared/ordersStore";
import { OrderStatusChip } from "../../orders/shared/OrderStatusChip";
import { canAccessPermission } from "../../permissions";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  getPackingPaths,
  type PackingRecord,
  usePackingRecords,
} from "../shared/packingStore";

export function ViewPackingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const paths = getPackingPaths();

  // Sync with store updates
  const packingRecords = usePackingRecords();

  const record: PackingRecord | undefined = useMemo(() => {
    if (!id) return undefined;
    return packingRecords.find((entry) => entry.id === id);
  }, [id, packingRecords]);

  const canEdit = canAccessPermission("packing", "edit");
  const canView = canAccessPermission("packing", "view");

  const orderRecord = useMemo(() => {
    if (!record?.orderNo) return undefined;
    return getOrderRecordByOrderNo(record.orderNo);
  }, [record?.orderNo]);

  const orderLineItem: OrderLineItem | undefined = useMemo(() => {
    if (!orderRecord) return undefined;
    const items = getOrderLineItems(orderRecord.id);
    if (!items.length) return undefined;

    if (record?.orderItemNo) {
      const matchIndex = items.findIndex(
        (_it, idx) => `OI-${String(idx + 1).padStart(3, "0")}` === record.orderItemNo,
      );
      if (matchIndex >= 0) return items[matchIndex];
    }
    return items[0];
  }, [orderRecord, record?.orderItemNo]);

  const initials = useMemo(() => {
    if (record?.packingId?.trim()) {
      const clean = record.packingId.replace(/^PKG-DV-/i, "").replace(/^PKG-/i, "");
      return clean.slice(0, 2).toUpperCase() || "PK";
    }
    if (record?.orderNo?.trim()) {
      const clean = record.orderNo.replace(/^ORD-(?:DV-|RAW-)?/i, "");
      return clean.slice(0, 2).toUpperCase() || "PK";
    }
    return "PK";
  }, [record?.packingId, record?.orderNo]);

  const handleEdit = () => {
    if (!record) return;
    navigate(paths.edit(record.id));
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
          { label: "Packing", to: paths.list },
          { label: "View Packing" },
        ]}
        title="View Packing"
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view packing records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (!record) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Packing", to: paths.list },
          { label: "Not Found" },
        ]}
        title="View Packing"
        contentGap={1.5}
      >
        <MasterSectionCard>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            The requested packing record could not be found.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  const isPackingDone = record.packingState === "done" || record.packingState === "dispatched";
  const isDispatched = record.packingState === "dispatched";

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Packing", to: paths.list },
        { label: record.packingId || record.orderNo || "View Packing" },
      ]}
      title="View Packing"
      contentGap={1.5}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">

          {canEdit && record.packingState !== "dispatched" && (
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
              Edit Packing
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
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: theme.customTokens.text.primary,
                    lineHeight: 1.25,
                  }}
                >
                  {record.packingId ? `Packing Ref #${record.packingId}` : `Order #${record.orderNo}`}
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
                  label={record.orderType || "Finished"}
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

                {record.issuedFrom && (
                  <Chip
                    label={`Ready From: ${record.issuedFrom}`}
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
                sx={{ mt: 0.5, flexWrap: "wrap", gap: 1 }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: 600,
                    color: theme.customTokens.text.secondary,
                  }}
                >
                  Customer: {record.customerName || "—"}
                </Typography>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Calendar size={13} style={{ color: theme.customTokens.text.secondary }} />
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: theme.customTokens.text.secondary,
                    }}
                  >
                    Packing Date: {formatDisplayDate(record.packingDate ?? record.createdDate)}
                  </Typography>
                </Stack>

                {record.dispatchDate && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Truck size={13} style={{ color: theme.customTokens.text.secondary }} />
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        color: theme.customTokens.text.secondary,
                      }}
                    >
                      Dispatched: {formatDisplayDate(record.dispatchDate)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
            <PackingStateChip state={record.packingState} />
          </Box>
        </Box>

        {/* 2-Column Responsive Information Cards */}
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
          {/* Packing & Source Order Details */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              title="Packing & Order Details"
              icon={Receipt}
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
              <ProfileField label="Packing Ref" value={record.packingId || "Pending Allocation"} />
              <ProfileField
                label="Packing Date"
                value={formatDisplayDate(record.packingDate ?? record.createdDate)}
              />
              <ProfileField label="Order No" value={record.orderNo} />
              <ProfileField label="Order Item No" value={record.orderItemNo} />
              <ProfileField label="Customer Name" value={record.customerName} />
              <ProfileField label="Order Type" value={record.orderType} />
              <ProfileField label="Prepared By" value={record.preparedBy || "—"} />
              <ProfileField label="Checked By" value={record.checkedBy || "—"} />
            </Box>
          </Box>

          {/* Product Specifications & Dimensions */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              title="Product Specifications"
              icon={Tag}
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
              <ProfileField label="Item Name" value={record.itemName} />
              <ProfileField label="Product Category" value={record.productCategory} />
              <ProfileField label="Series" value={record.series || orderLineItem?.series || "—"} />
              <ProfileField label="Grade" value={record.grade || orderLineItem?.grade || "—"} />
              <ProfileField label="Length" value={record.length} />
              <ProfileField label="Width" value={record.width} />
              <ProfileField label="Thickness" value={record.thickness} />
              <ProfileField label="Leaves / Sheets" value={record.noOfSheets} />
              <ProfileField label="SQM" value={record.sqm} />
              <ProfileField label="SQF" value={record.sqf} />
              <ProfileField label="Amount" value={record.amount} />
              <ProfileField label="Ready From" value={record.issuedFrom || "Manual Entry"} />
            </Box>
          </Box>
        </Box>

        {/* Packing Item Details Table Section */}
        <Box
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            borderRadius: "8px",
          })}
        >
          <Stack spacing={1.5}>
            <FormSectionHeader
              icon={Layers}
              title="Packed Item Details"
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
                    minWidth: 1000,
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
                      <TableCell sx={getHeaderCellSx(theme, 130)}>Packing Ref</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 130)}>Order No</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 120)}>Order Item</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 180)}>Item Name</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 100)}>Length</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 100)}>Width</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 100)}>Thickness</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 90)}>Sheets</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 90)}>SQM</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 90)}>SQF</TableCell>
                      <TableCell align="right" sx={getHeaderCellSx(theme, 110)}>Amount</TableCell>
                      <TableCell sx={getHeaderCellSx(theme, 140)}>Ready From</TableCell>
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
                      <TableCell sx={{ ...getBodyCellSx(theme), fontWeight: 600 }}>
                        {record.packingId || "—"}
                      </TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.orderNo}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.orderItemNo}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.itemName}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.length}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.width}</TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.thickness}</TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>{record.noOfSheets}</TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>{record.sqm}</TableCell>
                      <TableCell align="right" sx={getBodyCellSx(theme)}>{record.sqf}</TableCell>
                      <TableCell align="right" sx={{ ...getBodyCellSx(theme), fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                        {record.amount}
                      </TableCell>
                      <TableCell sx={getBodyCellSx(theme)}>{record.issuedFrom || "Manual Entry"}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Source Order Overview (if order details found) */}
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
              <ProfileField label="Priority" value={orderRecord.priority} />
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

        {/* Financial Overview & Remarks Grid */}
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(300px, 360px)",
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
              title="Remarks & Source Reference"
              icon={MessageSquare}
              variant="cardTop"
            />
            <Box sx={{ mt: 1 }}>
              <ProfileField
                label="Packing Remark"
                value={record.remark || "No special packing remarks entered."}
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

          {/* Quantity & Amount Overview Card */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
            })}
          >
            <FormSectionHeader
              icon={Receipt}
              title="Quantity & Amount"
              variant="cardTop"
            />
            <Stack spacing={1} sx={{ mt: 1 }}>
              <SummaryLine label="Packed Sheets / Leaves" value={record.noOfSheets || "—"} />
              <SummaryLine label="Total SQM" value={record.sqm || "—"} />
              <SummaryLine label="Total SQF" value={record.sqf || "—"} />
              <Divider sx={{ my: 0.35, borderColor: theme.customTokens.borders.divider }} />
              <SummaryLine
                bold
                label="Packed Total Amount"
                value={record.amount || "—"}
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

function PackingStateChip({ state }: { state: string }) {
  const normalized = (state || "").toLowerCase();
  let label = "Issued";
  let bg = "rgba(237, 108, 2, 0.12)";
  let color = "#ED6C02";
  let border = "rgba(237, 108, 2, 0.3)";

  if (normalized === "done") {
    label = "Packing Done";
    bg = "rgba(46, 125, 50, 0.12)";
    color = "#2E7D32";
    border = "rgba(46, 125, 50, 0.3)";
  } else if (normalized === "dispatched") {
    label = "Dispatched";
    bg = "rgba(25, 118, 210, 0.12)";
    color = "#1976D2";
    border = "rgba(25, 118, 210, 0.3)";
  } else if (normalized === "reverted") {
    label = "Reverted";
    bg = "rgba(211, 47, 47, 0.12)";
    color = "#D32F2F";
    border = "rgba(211, 47, 47, 0.3)";
  }

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        height: 24,
        fontSize: "0.75rem",
        fontWeight: 600,
        backgroundColor: bg,
        color,
        border: `1px solid ${border}`,
      }}
    />
  );
}

function SummaryLine({
  bold = false,
  label,
  value,
  valueColor,
}: {
  bold?: boolean;
  label: string;
  value: React.ReactNode;
  valueColor?: string;
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
        {value}
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
