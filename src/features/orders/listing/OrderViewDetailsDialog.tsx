import React from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Pencil } from "lucide-react";

import { formatMasterValue } from "../../masters/shared";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import {
  appendCreatedOrderToStore,
  getOrderLineItems,
  getOrderVariantFromType,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderRecord,
} from "../shared/ordersStore";
import { OrderStatusChip } from "../shared/OrderStatusChip";
import { fetchOrderByIdApi, mapBackendOrderToOrderRecord } from "../api/ordersApi";

type DetailColumn<TRow> = {
  getValue: (row: TRow) => unknown;
  label: string;
  minWidth?: number;
  renderCell?: (row: TRow) => React.ReactNode;
};


const orderDetailColumns: readonly DetailColumn<OrderRecord>[] = [
  { label: "Order No", minWidth: 140, getValue: (row) => row.orderNo },
  { label: "Order Date", minWidth: 130, getValue: (row) => row.orderDate },
  { label: "Required Delivery Date", minWidth: 160, getValue: (row) => row.deliveryDate },
  { label: "Customer Name", minWidth: 220, getValue: (row) => row.customerName },
  { label: "Order Type", minWidth: 150, getValue: (row) => row.orderType },
  { label: "Priority", minWidth: 120, getValue: (row) => row.priority },
  {
    label: "Order Status",
    minWidth: 170,
    getValue: (row) => row.status,
    renderCell: (row) => <OrderStatusChip status={String(row.status ?? "")} />,
  },
  { label: "Remark", minWidth: 220, getValue: (row) => row.remark },
];

type OrderLineItemTableRow = OrderLineItem & {
  orderItemNo: string;
};

const orderItemDetailColumns: readonly DetailColumn<OrderLineItemTableRow>[] = [
  { label: "Order Item No", minWidth: 120, getValue: (row) => row.orderItemNo },
  { label: "Product Type", minWidth: 140, getValue: (row) => row.productCategory || row.finishedType },
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Sales Item Name", minWidth: 160, getValue: (row) => row.salesItemName },
  { label: "Log No.", minWidth: 110, getValue: (row) => row.logNo ?? "-" },
  { label: "Batch No", minWidth: 110, getValue: (row) => row.batchNo ?? "-" },
  { label: "Length", minWidth: 100, getValue: (row) => row.length },
  { label: "Width", minWidth: 100, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 100, getValue: (row) => row.thickness },
  { label: "CBM", minWidth: 90, getValue: (row) => row.cbm ?? "-" },
  { label: "CBF", minWidth: 90, getValue: (row) => row.cbf ?? "-" },
  { label: "Sheets", minWidth: 80, getValue: (row) => row.quantitySheets },
  { label: "Leaves", minWidth: 80, getValue: (row) => row.noOfLeaves ?? "-" },
  { label: "Group No", minWidth: 100, getValue: (row) => row.groupNo ?? "-" },
  { label: "Photo No", minWidth: 100, getValue: (row) => row.photoNo ?? "-" },
  { label: "SQM", minWidth: 90, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 90, getValue: (row) => row.totalSqm },
  {
    label: "Rate",
    minWidth: 120,
    getValue: (row) => {
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
  { label: "Amount", minWidth: 110, getValue: (row) => row.amount },
  { label: "Base Type", minWidth: 120, getValue: (row) => row.baseType },
  { label: "Base Name", minWidth: 150, getValue: (row) => row.baseName },
  { label: "Base Length", minWidth: 110, getValue: (row) => row.baseLength },
  { label: "Base Width", minWidth: 110, getValue: (row) => row.baseWidth },
  { label: "Base Thickness", minWidth: 120, getValue: (row) => row.baseThickness },
  { label: "Design Code", minWidth: 120, getValue: (row) => row.designCode },
  { label: "Structured Code", minWidth: 130, getValue: (row) => row.structuredCode },
  { label: "Remark", minWidth: 180, getValue: (row) => row.remark },
];

const rawItemDetailColumns: readonly DetailColumn<OrderLineItemTableRow>[] = [
  { label: "Order Item No", minWidth: 120, getValue: (row) => row.orderItemNo },
  { label: "Product Type", minWidth: 140, getValue: (row) => row.productCategory || row.finishedType },
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Sales Item Name", minWidth: 160, getValue: (row) => row.salesItemName },
  { label: "Log No.", minWidth: 110, getValue: (row) => row.logNo ?? "-" },
  { label: "Batch No", minWidth: 110, getValue: (row) => row.batchNo ?? "-" },
  { label: "Length", minWidth: 100, getValue: (row) => row.length },
  { label: "Width", minWidth: 100, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 100, getValue: (row) => row.thickness },
  { label: "CBM", minWidth: 90, getValue: (row) => row.cbm ?? "-" },
  { label: "CBF", minWidth: 90, getValue: (row) => row.cbf ?? "-" },
  { label: "Sheets", minWidth: 80, getValue: (row) => row.quantitySheets },
  { label: "Leaves", minWidth: 80, getValue: (row) => row.noOfLeaves ?? "-" },
  { label: "SQM", minWidth: 90, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 90, getValue: (row) => row.totalSqm },
  {
    label: "Rate",
    minWidth: 120,
    getValue: (row) => {
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
  { label: "Amount", minWidth: 110, getValue: (row) => row.amount },
  { label: "Design Code", minWidth: 120, getValue: (row) => row.designCode },
  { label: "Structured Code", minWidth: 130, getValue: (row) => row.structuredCode },
  { label: "Remark", minWidth: 180, getValue: (row) => row.remark },
];

const finishedItemDetailColumns: readonly DetailColumn<OrderLineItemTableRow>[] = [
  { label: "Order Item No", minWidth: 120, getValue: (row) => row.orderItemNo },
  { label: "Finished Type", minWidth: 140, getValue: (row) => row.finishedType || row.productCategory },
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Sales Item", minWidth: 160, getValue: (row) => row.salesItemName },
  { label: "Length", minWidth: 100, getValue: (row) => row.length },
  { label: "Width", minWidth: 100, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 100, getValue: (row) => row.thickness },
  { label: "Sheets", minWidth: 80, getValue: (row) => row.quantitySheets },
  { label: "Group No", minWidth: 100, getValue: (row) => row.groupNo ?? "-" },
  { label: "Photo No", minWidth: 100, getValue: (row) => row.photoNo ?? "-" },
  { label: "SQM", minWidth: 90, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 90, getValue: (row) => row.totalSqm },
  { label: "Rate/SQF", minWidth: 100, getValue: (row) => row.ratePerSqf },
  { label: "Amount", minWidth: 110, getValue: (row) => row.amount },
  { label: "Design Code", minWidth: 120, getValue: (row) => row.designCode },
  { label: "Structured Code", minWidth: 130, getValue: (row) => row.structuredCode },
  { label: "Remark", minWidth: 180, getValue: (row) => row.remark },
];

export function OrderViewDetailsDialog({
  onClose,
  onEdit,
  open,
  record: initialRecord,
}: {
  onClose: () => void;
  onEdit?: (() => void | Promise<void>) | undefined;
  open: boolean;
  record: OrderRecord | undefined;
}) {
  const [activeRecord, setActiveRecord] = React.useState<OrderRecord | undefined>(initialRecord);
  const [activeItems, setActiveItems] = React.useState<OrderLineItem[]>(() =>
    initialRecord ? getOrderLineItems(initialRecord.id) : [],
  );

  React.useEffect(() => {
    setActiveRecord(initialRecord);
    if (initialRecord) {
      setActiveItems(getOrderLineItems(initialRecord.id));
    }
  }, [initialRecord]);

  React.useEffect(() => {
    if (!open || !initialRecord?.id) return;
    let isMounted = true;

    fetchOrderByIdApi(initialRecord.id)
      .then((backendOrder) => {
        if (!isMounted) return;
        const { record: mappedRecord, lineItems: mappedItems } =
          mapBackendOrderToOrderRecord(backendOrder);
        setActiveRecord(mappedRecord);
        setActiveItems(mappedItems);
        appendCreatedOrderToStore(mappedRecord, mappedItems);
      })
      .catch(() => {
        // Fallback to local record if network fails
      });

    return () => {
      isMounted = false;
    };
  }, [initialRecord?.id, open]);

  const record = activeRecord;
  const lineItems = activeItems;
  const variant = getOrderVariantFromType(record?.orderType);
  const itemColumns = getItemDetailColumns(variant, lineItems);
  const isFinished = variant === "finished";
  const itemRows = lineItems.map((item, index) => ({
    ...item,
    orderItemNo: item.orderItemNo || `OI-${String(index + 1).padStart(3, "0")}`,
  }));

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.18)",
            maxHeight: "none",
            maxWidth: "calc(100vw - 32px)",
            outline: "none",
            overflow: "visible",
            width: "min(1760px, calc(100vw - 32px))",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          color: theme.palette.text.primary,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 600,
          px: theme.spacing(2),
          py: theme.spacing(1.75),
        })}
      >
        {variant === "order"
          ? "Order Details"
          : isFinished
            ? "Finished Order Details"
            : "Raw Order Details"}
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          maxHeight: "none",
          overflow: "visible",
          px: theme.spacing(2),
          py: theme.spacing(2),
        })}
      >
        {record ? (
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(2),
            })}
          >
            <OrderDetailTable
              columns={orderDetailColumns}
              rows={[record]}
              title="Order Details"
            />

            {itemRows.length > 0 ? (
              Array.from(
                itemRows.reduce((map, item) => {
                  const prod = (item.productCategory || item.finishedType || "")
                    .trim()
                    .replace(/\s*\((?:Raw|Finished)\)$/i, "")
                    .toLowerCase();
                  const groupTitle = prod ? `${prod.charAt(0).toUpperCase() + prod.slice(1)} Items` : "Order Items";
                  const current = map.get(groupTitle) ?? [];
                  current.push(item);
                  map.set(groupTitle, current);
                  return map;
                }, new Map<string, OrderLineItemTableRow[]>()),
              ).map(([title, groupRows]) => (
                <OrderDetailTable
                  key={title}
                  columns={getItemDetailColumns(variant, groupRows)}
                  emptyLabel="No order items are available."
                  rows={groupRows}
                  title={`${title} (${groupRows.length})`}
                />
              ))
            ) : (
              <OrderDetailTable
                columns={itemColumns}
                emptyLabel="No order items are available."
                rows={itemRows}
                title="Order Items"
              />
            )}

            <Box
              sx={(theme) => ({
                display: "flex",
                gap: theme.spacing(1.25),
                justifyContent: "flex-end",
                pt: theme.spacing(0.5),
              })}
            >
              <Button
                disableElevation
                onClick={onClose}
                sx={recordFormActionButtonSx}
                variant="outlined"
              >
                Close
              </Button>
              {onEdit ? (
                <Button
                  disableElevation
                  onClick={onEdit}
                  startIcon={<Pencil size={16} />}
                  sx={recordFormActionButtonSx}
                  variant="contained"
                >
                  Edit
                </Button>
              ) : null}
            </Box>
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            The requested order could not be found.
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <Typography
      sx={(theme) => ({
        color: theme.customTokens.text.secondary,
        fontSize: "0.75rem",
        fontWeight: 600,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
      })}
    >
      {title}
    </Typography>
  );
}

function OrderDetailTable<TRow>({
  columns,
  emptyLabel = "No records are available.",
  rows,
  title,
}: {
  columns: readonly DetailColumn<TRow>[];
  emptyLabel?: string;
  rows: readonly TRow[];
  title: string;
}) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(1),
      })}
    >
      <SectionLabel title={title} />

      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.sm}px`,
          overflow: "hidden",
          backgroundColor: theme.customTokens.surfaces.surface,
        })}
      >
        <Box sx={(theme) => getDetailTableScrollSx(theme)}>
          <Table
            size="small"
            sx={(theme) => ({
              minWidth: getDetailTableMinWidth(columns),
              tableLayout: "auto",
              width: "100%",
            })}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.label}
                    sx={(theme) =>
                      getDetailHeaderCellSx(theme, column.minWidth ?? 130)
                    }
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length > 0 ? (
                rows.map((row, rowIndex) => (
                  <TableRow key={rowIndex}>
                    {columns.map((column) => (
                      <TableCell
                        key={column.label}
                        sx={(theme) => getDetailBodyCellSx(theme)}
                      >
                        {column.renderCell
                          ? column.renderCell(row)
                          : formatDialogValue(column.getValue(row))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={(theme) => getDetailBodyCellSx(theme)}
                  >
                    {emptyLabel}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Stack>
  );
}

function getDetailTableMinWidth<TRow>(columns: readonly DetailColumn<TRow>[]) {
  return columns.reduce((total, column) => total + (column.minWidth ?? 130), 0);
}

function getDetailHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth, "center"),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    lineHeight: 1.35,
  } as const;
}

function getDetailBodyCellSx(theme: Theme) {
  return {
    ...transactionTableBodyCellSx(theme, "center"),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    color: theme.palette.text.primary,
  } as const;
}

function getDetailTableScrollSx(theme: Theme) {
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

function getItemDetailColumns(
  variant: OrderCreateVariant | null,
  lineItems: readonly OrderLineItem[] = [],
) {
  if (lineItems.length === 0) {
    if (variant === "finished") return finishedItemDetailColumns;
    if (variant === "raw") return rawItemDetailColumns;
    return orderItemDetailColumns;
  }

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
  const hasFinished = hasDecorative || hasFluted || hasEmbossed || hasMarquetry || hasPlywood;

  const cols: DetailColumn<OrderLineItemTableRow>[] = [
    { label: "Order Item No", minWidth: 120, getValue: (row) => row.orderItemNo },
    { label: "Product Type", minWidth: 140, getValue: (row) => row.productCategory || row.finishedType },
    { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
    { label: "Sales Item Name", minWidth: 160, getValue: (row) => row.salesItemName },
  ];

  if (hasSawing) {
    cols.push(
      { label: "Log No.", minWidth: 110, getValue: (row) => row.logNo ?? "-" },
      { label: "Batch No", minWidth: 110, getValue: (row) => row.batchNo ?? "-" },
    );
  }

  if (hasDecorative) {
    cols.push(
      { label: "Group No", minWidth: 100, getValue: (row) => row.groupNo ?? "-" },
      { label: "Photo No", minWidth: 100, getValue: (row) => row.photoNo ?? "-" },
    );
  }

  if (hasFluted) {
    cols.push({ label: "Design Code", minWidth: 120, getValue: (row) => row.designCode });
  }

  if (hasEmbossed) {
    cols.push({ label: "Structured Code", minWidth: 130, getValue: (row) => row.structuredCode });
  }

  cols.push(
    { label: "Length", minWidth: 100, getValue: (row) => row.length },
    { label: "Width", minWidth: 100, getValue: (row) => row.width },
    { label: "Thickness", minWidth: 100, getValue: (row) => row.thickness },
  );

  if (hasSheetRaw || hasFinished) {
    cols.push({ label: "Sheets", minWidth: 80, getValue: (row) => row.quantitySheets });
  }

  if (hasVeneer) {
    cols.push({ label: "Leaves", minWidth: 80, getValue: (row) => row.noOfLeaves ?? "-" });
  }

  if (hasSawing) {
    cols.push(
      { label: "CBM", minWidth: 90, getValue: (row) => row.cbm ?? "-" },
      { label: "CBF", minWidth: 90, getValue: (row) => row.cbf ?? "-" },
    );
  }

  if (hasVeneer || hasSheetRaw || hasFinished) {
    cols.push(
      { label: "SQM", minWidth: 90, getValue: (row) => row.sqm },
      { label: "SQF", minWidth: 90, getValue: (row) => row.totalSqm },
    );
  }

  cols.push(
    {
      label: "Rate",
      minWidth: 120,
      getValue: (row) => {
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
    { label: "Amount", minWidth: 110, getValue: (row) => row.amount },
  );

  if (hasFinished) {
    cols.push(
      { label: "Base Type", minWidth: 120, getValue: (row) => row.baseType },
      { label: "Base Name", minWidth: 150, getValue: (row) => row.baseName },
      { label: "Base Length", minWidth: 110, getValue: (row) => row.baseLength },
      { label: "Base Width", minWidth: 110, getValue: (row) => row.baseWidth },
      { label: "Base Thickness", minWidth: 120, getValue: (row) => row.baseThickness },
    );
  }

  cols.push({ label: "Remark", minWidth: 180, getValue: (row) => row.remark });

  return cols;
}

function formatDialogValue(value: unknown) {
  if (value instanceof Date) {
    return formatMasterValue(value);
  }

  if (value === null || typeof value === "undefined") {
    return "-";
  }

  const text = String(value).trim();

  return text.length > 0 ? text : "-";
}
