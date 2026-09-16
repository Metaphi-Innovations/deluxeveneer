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
  getOrderLineItems,
  getOrderVariantFromType,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderRecord,
} from "./ordersStore";

type DetailColumn<TRow> = {
  getValue: (row: TRow) => unknown;
  label: string;
  minWidth?: number;
};

const orderDetailColumns: readonly DetailColumn<OrderRecord>[] = [
  { label: "Order No", minWidth: 140, getValue: (row) => row.orderNo },
  { label: "Order Date", minWidth: 130, getValue: (row) => row.orderDate },
  { label: "Customer Name", minWidth: 220, getValue: (row) => row.customerName },
  { label: "Order Type", minWidth: 150, getValue: (row) => row.orderType },
  { label: "Priority", minWidth: 120, getValue: (row) => row.priority },
  { label: "Status", minWidth: 130, getValue: (row) => row.status },
  { label: "Remark", minWidth: 220, getValue: (row) => row.remark },
  { label: "Created Date", minWidth: 130, getValue: (row) => row.createdDate },
  { label: "Updated Date", minWidth: 130, getValue: (row) => row.updatedDate },
  { label: "Created By", minWidth: 130, getValue: (row) => row.createdBy },
  { label: "Updated By", minWidth: 130, getValue: (row) => row.updatedBy },
];

type OrderLineItemTableRow = OrderLineItem & {
  orderItemNo: string;
};

const rawItemDetailColumns: readonly DetailColumn<OrderLineItemTableRow>[] = [
  { label: "Order Item No", minWidth: 130, getValue: (row) => row.orderItemNo },
  { label: "Product Type", minWidth: 150, getValue: (row) => row.productCategory },
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Sub Category", minWidth: 160, getValue: (row) => row.subCategory },
  { label: "Series", minWidth: 130, getValue: (row) => row.series },
  { label: "Grade", minWidth: 110, getValue: (row) => row.grade },
  { label: "Length", minWidth: 120, getValue: (row) => row.length },
  { label: "Width", minWidth: 120, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 120, getValue: (row) => row.thickness },
  { label: "No. of Sheets", minWidth: 130, getValue: (row) => row.quantitySheets },
  { label: "SQM", minWidth: 120, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 130, getValue: (row) => row.totalSqm },
  { label: "Rate per SQF", minWidth: 140, getValue: (row) => row.ratePerSqf },
  { label: "Amount", minWidth: 130, getValue: (row) => row.amount },
  { label: "Remark", minWidth: 220, getValue: (row) => row.remark },
];

const finishedItemDetailColumns: readonly DetailColumn<OrderLineItemTableRow>[] = [
  { label: "Order Item No", minWidth: 130, getValue: (row) => row.orderItemNo },
  { label: "Finished Type", minWidth: 150, getValue: (row) => row.finishedType },
  { label: "Sales Item Name", minWidth: 190, getValue: (row) => row.salesItemName },
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Length", minWidth: 120, getValue: (row) => row.length },
  { label: "Width", minWidth: 120, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 120, getValue: (row) => row.thickness },
  { label: "No. of Sheets", minWidth: 130, getValue: (row) => row.quantitySheets },
  { label: "SQM", minWidth: 120, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 130, getValue: (row) => row.totalSqm },
  { label: "Rate per SQF", minWidth: 140, getValue: (row) => row.ratePerSqf },
  { label: "Base Type", minWidth: 130, getValue: (row) => row.baseType },
  { label: "Base Name", minWidth: 160, getValue: (row) => row.baseName },
  { label: "Base Length", minWidth: 130, getValue: (row) => row.baseLength },
  { label: "Base Width", minWidth: 130, getValue: (row) => row.baseWidth },
  { label: "Base Thickness", minWidth: 150, getValue: (row) => row.baseThickness },
  { label: "Amount", minWidth: 130, getValue: (row) => row.amount },
  { label: "Remark", minWidth: 220, getValue: (row) => row.remark },
];

export function OrderViewDetailsDialog({
  onClose,
  onEdit,
  open,
  record,
}: {
  onClose: () => void;
  onEdit?: (() => void | Promise<void>) | undefined;
  open: boolean;
  record: OrderRecord | undefined;
}) {
  const lineItems = record ? getOrderLineItems(record.id) : [];
  const variant = getOrderVariantFromType(record?.orderType);
  const itemColumns = getItemDetailColumns(variant);
  const isFinished = variant === "finished";
  const itemRows = lineItems.map((item, index) => ({
    ...item,
    orderItemNo: String(index + 1),
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
        {isFinished ? "Finished Order Details" : "Raw Order Details"}
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

            <OrderDetailTable
              columns={itemColumns}
              emptyLabel="No order items are available."
              rows={itemRows}
              title={isFinished ? "Finished Order Items" : "Raw Order Items"}
            />

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
            The requested order could not be found in the mock dataset.
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
                        {formatDialogValue(column.getValue(row))}
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

function getItemDetailColumns(variant: OrderCreateVariant | null) {
  return variant === "finished" ? finishedItemDetailColumns : rawItemDetailColumns;
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
