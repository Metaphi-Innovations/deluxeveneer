import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
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
  Clock,
  Layers,
  MessageSquare,
  Package2,
  Pencil,
  Receipt,
  Tag,
  User,
  UserCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterPageShell, MasterSectionCard } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  appendCreatedOrderToStore,
  getOrderLineItems,
  getOrderRecord,
  getOrdersPaths,
  getOrderVariantFromType,
  ordersModuleConfig,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderModuleConfig,
  type OrderRecord,
  useOrderRecords,
} from "../shared/ordersStore";
import { OrderStatusChip } from "../shared/OrderStatusChip";
import { fetchOrderByIdApi, mapBackendOrderToOrderRecord } from "../api/ordersApi";

interface ViewOrderPageProps {
  moduleConfig?: OrderModuleConfig;
}

type OrderLineItemTableRow = OrderLineItem & {
  orderItemNo: string;
};

type ItemTableColumn = {
  align?: "left" | "right" | "center";
  label: string;
  minWidth?: number;
  render: (row: OrderLineItemTableRow) => React.ReactNode;
};

export function ViewOrderPage({
  moduleConfig = ordersModuleConfig,
}: ViewOrderPageProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const paths = getOrdersPaths(moduleConfig.basePath);

  // Subscribe to updates so that edits/status changes re-render immediately
  const records = useOrderRecords();

  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch real order from backend on mount or when id changes
  useEffect(() => {
    if (!id) return;

    let isMounted = true;
    setIsLoading(true);
    setFetchError(null);

    fetchOrderByIdApi(id)
      .then((backendOrder) => {
        if (!isMounted) return;
        const { record: mappedRecord, lineItems: mappedItems } =
          mapBackendOrderToOrderRecord(backendOrder);
        appendCreatedOrderToStore(mappedRecord, mappedItems);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        // If not found in backend and also not in memory
        const errMsg = err instanceof Error ? err.message : "Failed to load order from server.";
        setFetchError(errMsg);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const record: OrderRecord | undefined = useMemo(() => {
    if (!id) return undefined;
    return getOrderRecord(id);
  }, [id, records]);

  const canEdit = canAccessPermission(moduleConfig.permissionKey, "edit");
  const canView = canAccessPermission(moduleConfig.permissionKey, "view");

  const lineItems = useMemo(() => {
    if (!record) return [];
    return getOrderLineItems(record.id);
  }, [record, records]);

  const variant = getOrderVariantFromType(record?.orderType);
  const isFinished = variant === "finished";

  const itemRows: OrderLineItemTableRow[] = useMemo(() => {
    return lineItems.map((item, index) => ({
      ...item,
      orderItemNo: item.orderItemNo || `OI-${String(index + 1).padStart(3, "0")}`,
    }));
  }, [lineItems]);

  const itemGroups = useMemo(() => {
    const map = new Map<string, OrderLineItemTableRow[]>();
    itemRows.forEach((item) => {
      const prod = (item.productCategory || item.finishedType || "")
        .trim()
        .replace(/\s*\((?:Raw|Finished)\)$/i, "")
        .toLowerCase();
      const groupTitle = prod
        ? `${prod.charAt(0).toUpperCase() + prod.slice(1)} Items`
        : "Order Items";
      const current = map.get(groupTitle) ?? [];
      current.push(item);
      map.set(groupTitle, current);
    });
    return Array.from(map.entries());
  }, [itemRows]);

  const initials = useMemo(() => {
    if (!record?.orderNo) return "OD";
    const parts = record.orderNo.replace(/^ORD-DV-/i, "").split(/[-_\s]+/);
    if (parts.length > 0 && parts[0]) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return "OD";
  }, [record?.orderNo]);

  const handleBack = () => {
    navigate(paths.list, {
      state: {
        orderListingTab: variant ?? "order",
      },
    });
  };

  const handleEdit = () => {
    if (!record) return;
    navigate(paths.edit(record.id), {
      state: {
        orderListingTab: variant ?? "order",
      },
    });
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
        backNav={{ label: "Back to Orders", to: paths.list, onBack: handleBack }}
        breadcrumbs={[
          { label: moduleConfig.title, to: paths.list },
          { label: "View Order" },
        ]}
        title="View Order"
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view order records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (isLoading && !record) {
    return (
      <MasterPageShell
        backNav={{ label: "Back to Orders", to: paths.list, onBack: handleBack }}
        breadcrumbs={[
          { label: moduleConfig.title, to: paths.list },
          { label: "Loading..." },
        ]}
        title="View Order"
        contentGap={1.5}
      >
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
          <CircularProgress size={32} />
        </Box>
      </MasterPageShell>
    );
  }

  if (!record) {
    return (
      <MasterPageShell
        backNav={{ label: "Back to Orders", to: paths.list, onBack: handleBack }}
        breadcrumbs={[
          { label: moduleConfig.title, to: paths.list },
          { label: "Not Found" },
        ]}
        title="View Order"
        contentGap={1.5}
      >
        <MasterSectionCard>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            {fetchError || "The requested order could not be found."}
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  const orderPriority = String(record.priority || "Standard").trim();
  const isUrgent = orderPriority.toLowerCase() === "urgent";

  return (
    <MasterPageShell
      backNav={{ label: "Back to Orders", to: paths.list, onBack: handleBack }}
      breadcrumbs={[
        { label: moduleConfig.title, to: paths.list },
        { label: record.orderNo || "View Order" },
      ]}
      title="View Order"
      contentGap={1.5}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">

          {canEdit && record.status !== "Cancelled" && (
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
              Edit Order
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
                  Order #{record.orderNo}
                </Typography>

                <Chip
                  label={record.orderType || (isFinished ? "Finished Order" : "Raw Order")}
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
                  label={orderPriority}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    backgroundColor: isUrgent ? "rgba(211, 47, 47, 0.12)" : "rgba(33, 150, 243, 0.12)",
                    color: isUrgent ? "#D32F2F" : "#1976D2",
                    border: `1px solid ${isUrgent ? "rgba(211, 47, 47, 0.3)" : "rgba(33, 150, 243, 0.3)"}`,
                  }}
                />
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
                    Order Date: {formatDisplayDate(record.orderDate)}
                  </Typography>
                </Stack>

                {record.deliveryDate && (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Clock size={13} style={{ color: theme.customTokens.text.secondary }} />
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        color: theme.customTokens.text.secondary,
                      }}
                    >
                      Required Delivery: {formatDisplayDate(record.deliveryDate)}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          </Stack>

          <Box sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}>
            <OrderStatusChip status={String(record.status ?? "")} />
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
          {/* Order & Customer Details */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              title="Order & Customer Details"
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
              <ProfileField label="Order No" value={record.orderNo} />
              <ProfileField label="Order Date" value={formatDisplayDate(record.orderDate)} />
              <ProfileField label="Customer Name" value={record.customerName} />
              <ProfileField label="Order Type" value={record.orderType} />
              <ProfileField label="Priority" value={record.priority} />
              <ProfileField
                label="Required Delivery Date"
                value={formatDisplayDate(record.deliveryDate)}
              />
              <ProfileField
                label="Sales Coordinator"
                value={record.salesCoordinator || "—"}
              />
              <ProfileField
                label="Order Status"
                value={record.status}
              />
            </Box>
          </Box>

          {/* Classification & Summary */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              title="Classification & Financials"
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
              <ProfileField label="Product Category" value={record.productCategory} />
              <ProfileField label="Item Name" value={record.itemName} />
              <ProfileField label="Sub Category" value={record.subCategory} />
              <ProfileField label="Total Quantity (Sheets)" value={record.quantitySheets} />
              <ProfileField label="Total SQM" value={record.sqm} />
              <ProfileField
                label="Total SQF"
                value={record.totalSqm}
              />
              <ProfileField
                label="Total Order Amount"
                value={record.amount}
              />
            </Box>
          </Box>
        </Box>

        {/* Order Items Table Section */}
        {itemRows.length > 0 ? (
          itemGroups.map(([groupTitle, groupItems]) => {
            const dynamicColumns = buildDynamicItemColumns(variant, groupItems);
            return (
              <Box
                key={groupTitle}
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                })}
              >
                <Stack spacing={1}>
                  <FormSectionHeader
                    icon={Layers}
                    title={`${groupTitle} (${groupItems.length})`}
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
                          minWidth: getTableMinWidth(dynamicColumns),
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
                            {dynamicColumns.map((col) => (
                              <TableCell
                                key={col.label}
                                align={col.align ?? "left"}
                                sx={getHeaderCellSx(theme, col.minWidth ?? 120)}
                              >
                                {col.label}
                              </TableCell>
                            ))}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {groupItems.map((item, idx) => (
                            <TableRow
                              key={item.id || idx}
                              sx={{
                                backgroundColor:
                                  idx % 2 === 1
                                    ? theme.customTokens.surfaces.alt
                                    : undefined,
                                "&:hover": {
                                  backgroundColor: theme.customTokens.surfaces.paper,
                                },
                              }}
                            >
                              {dynamicColumns.map((col) => (
                                <TableCell
                                  key={col.label}
                                  align={col.align ?? "left"}
                                  sx={getBodyCellSx(theme)}
                                >
                                  {col.render(item)}
                                </TableCell>
                              ))}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                </Stack>
              </Box>
            );
          })
        ) : (
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
            })}
          >
            <FormSectionHeader
              icon={Layers}
              title="Order Items"
              variant="cardTop"
            />
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: theme.customTokens.text.secondary,
                py: 1,
              }}
            >
              No item details recorded for this order.
            </Typography>
          </Box>
        )}

        {/* Financial Summary & Remarks Section */}
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
              title="Order Remarks"
              icon={MessageSquare}
              variant="cardTop"
            />
            <Box sx={{ mt: 1 }}>
              <ProfileField
                label="Special Instructions & Remarks"
                value={record.remark || "No special remarks provided for this order."}
                allowWrap
              />
            </Box>
          </Box>

          {/* Amount / Cost Summary Card */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
            })}
          >
            <FormSectionHeader
              icon={Receipt}
              title="Financial Overview"
              variant="cardTop"
            />
            <Stack spacing={0.75} sx={{ mt: 1 }}>
              <SummaryLine label="Total Sheets" value={record.quantitySheets || "—"} />
              <SummaryLine label="Total SQM" value={record.sqm || "—"} />
              <SummaryLine label="Total SQF" value={record.totalSqm || "—"} />
              <Divider sx={{ my: 0.25, borderColor: theme.customTokens.borders.divider }} />
              <SummaryLine
                bold
                label="Grand Total Amount"
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

function getTableMinWidth(columns: readonly ItemTableColumn[]) {
  return columns.reduce((total, column) => total + (column.minWidth ?? 120), 0);
}

function buildDynamicItemColumns(
  variant: OrderCreateVariant | null,
  lineItems: readonly OrderLineItem[] = [],
): ItemTableColumn[] {
  const types = new Set(
    lineItems.map((item) =>
      (item.productCategory || item.finishedType || "")
        .trim()
        .replace(/\s*\((?:Raw|Finished)\)$/i, "")
        .toLowerCase(),
    ),
  );

  const hasSawing = types.has("sawing");
  const hasVeneer = types.has("veneer");
  const hasSheetRaw = types.has("raw") || types.has("mdf");
  const hasDecorative = types.has("decorative");
  const hasFluted = types.has("fluted");
  const hasEmbossed = types.has("embossed");
  const hasMarquetry = types.has("marquetry");
  const hasPlywood = types.has("plywood");
  const hasFinished =
    variant === "finished" ||
    hasDecorative ||
    hasFluted ||
    hasEmbossed ||
    hasMarquetry ||
    hasPlywood;

  const cols: ItemTableColumn[] = [
    {
      label: "Order Item No",
      minWidth: 120,
      render: (row) => row.orderItemNo,
    },
    {
      label: "Product Type",
      minWidth: 140,
      render: (row) => row.productCategory || row.finishedType || "—",
    },
    {
      label: "Item Name",
      minWidth: 180,
      render: (row) => row.itemName || "—",
    },
    {
      label: "Sales Item Name",
      minWidth: 160,
      render: (row) => row.salesItemName || "—",
    },
  ];

  if (hasSawing) {
    cols.push(
      { label: "Log No.", minWidth: 110, render: (row) => row.logNo || "—" },
      { label: "Batch No", minWidth: 110, render: (row) => row.batchNo || "—" },
    );
  }

  if (hasDecorative) {
    cols.push(
      { label: "Group No", minWidth: 100, render: (row) => row.groupNo || "—" },
      { label: "Photo No", minWidth: 100, render: (row) => row.photoNo || "—" },
    );
  }

  if (hasFluted) {
    cols.push({
      label: "Design Code",
      minWidth: 120,
      render: (row) => row.designCode || "—",
    });
  }

  if (hasEmbossed) {
    cols.push({
      label: "Structured Code",
      minWidth: 130,
      render: (row) => row.structuredCode || "—",
    });
  }

  cols.push(
    { label: "Length", minWidth: 100, render: (row) => row.length || "—" },
    { label: "Width", minWidth: 100, render: (row) => row.width || "—" },
    { label: "Thickness", minWidth: 100, render: (row) => row.thickness || "—" },
  );

  if (hasSheetRaw || hasFinished || (!hasSawing && !hasVeneer)) {
    cols.push({
      label: "Sheets",
      minWidth: 80,
      align: "right",
      render: (row) => row.quantitySheets || "—",
    });
  }

  if (hasVeneer) {
    cols.push({
      label: "Leaves",
      minWidth: 80,
      align: "right",
      render: (row) => row.noOfLeaves || "—",
    });
  }

  if (hasSawing) {
    cols.push(
      { label: "CBM", minWidth: 90, align: "right", render: (row) => row.cbm || "—" },
      { label: "CBF", minWidth: 90, align: "right", render: (row) => row.cbf || "—" },
    );
  }

  cols.push(
    { label: "SQM", minWidth: 90, align: "right", render: (row) => row.sqm || "—" },
    { label: "SQF", minWidth: 90, align: "right", render: (row) => row.totalSqm || "—" },
    {
      label: "Rate",
      minWidth: 120,
      align: "right",
      render: (row) => {
        const prod = (row.productCategory ?? "").toLowerCase();
        if (prod.includes("sawing")) {
          return `${row.ratePerCbm || row.ratePerSqf} / CBM`;
        }
        if (prod.includes("veneer")) {
          return `${row.ratePerSqf} / SQM`;
        }
        return `${row.ratePerSqf} / SQF`;
      },
    },
    {
      label: "Amount",
      minWidth: 120,
      align: "right",
      render: (row) => (
        <Typography
          component="span"
          sx={{ fontWeight: 600, fontSize: "0.8125rem", fontVariantNumeric: "tabular-nums" }}
        >
          {row.amount || "—"}
        </Typography>
      ),
    },
  );

  if (hasFinished) {
    cols.push(
      { label: "Base Type", minWidth: 120, render: (row) => row.baseType || "—" },
      { label: "Base Name", minWidth: 150, render: (row) => row.baseName || "—" },
      { label: "Base Length", minWidth: 110, render: (row) => row.baseLength || "—" },
      { label: "Base Width", minWidth: 110, render: (row) => row.baseWidth || "—" },
      { label: "Base Thickness", minWidth: 120, render: (row) => row.baseThickness || "—" },
    );
  }

  cols.push({
    label: "Remark",
    minWidth: 180,
    render: (row) => row.remark || "—",
  });

  return cols;
}
