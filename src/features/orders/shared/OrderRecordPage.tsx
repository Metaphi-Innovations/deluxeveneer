import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { ChevronLeft, Info, Pencil, Save } from "lucide-react";
import { useNavigate, useParams, useSearchParams, useLocation } from "react-router";

import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
  formatMasterValue,
  hasFormFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
  type MasterRecord,
} from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../shared/buttonStyles";
import {
  formatAmount,
  formatCurrency,
  formatQuantity,
  formatSQM,
} from "../../shared/numberFormat";
import {
  type FormFieldSize,
} from "../../shared/formFieldSizes";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { SizedMasterFormFields } from "../../shared/SizedMasterFormFields";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import {
  createOrderRecord,
  getCreateOrderFormFields,
  getOrderCustomerRows,
  getOrderFormFields,
  getOrderLineItems,
  getOrderRecord,
  getOrdersPaths,
  getOrderCreateVariant,
  getOrderVariantLabel,
  ordersModuleConfig,
  orderViewFields,
  type OrderDraft,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderModuleConfig,
  type OrderRecord,
  updateOrderRecord,
  useOrderRecords,
} from "./ordersStore";
import {
  OrderLineItemsTable,
  type OrderLineItemsTableHandle,
} from "./OrderLineItemsTable";
import { allocateSampleToOrder } from "../../factory/shared/sampleSheetIdentityStore";

interface OrderRecordPageProps {
  mode: "add" | "edit" | "view";
  moduleConfig?: OrderModuleConfig;
}

type SampleOrderLocationState = {
  finishedType?: string;
  fromSampleSheet?: boolean;
  lineItemDraft?: Partial<OrderLineItem>;
  sampleNo?: string;
};

type DetailColumn<TRow> = {
  getValue: (row: TRow) => unknown;
  label: string;
  minWidth?: number;
};

const orderDetailColumns: readonly DetailColumn<OrderRecord>[] = [
  { label: "Order No", minWidth: 120, getValue: (row) => row.orderNo },
  { label: "Order Date", minWidth: 130, getValue: (row) => row.orderDate },
  { label: "Customer Name", minWidth: 220, getValue: (row) => row.customerName },
  { label: "Order Type", minWidth: 150, getValue: (row) => row.orderType },
  { label: "Priority", minWidth: 120, getValue: (row) => row.priority },
  { label: "Product Category", minWidth: 160, getValue: (row) => row.productCategory },
  { label: "Sales Coordinator", minWidth: 180, getValue: (row) => row.salesCoordinator },
  { label: "Status", minWidth: 130, getValue: (row) => row.status },
  { label: "Created Date", minWidth: 130, getValue: (row) => row.createdDate },
  { label: "Updated Date", minWidth: 130, getValue: (row) => row.updatedDate },
  { label: "Created By", minWidth: 130, getValue: (row) => row.createdBy },
  { label: "Updated By", minWidth: 130, getValue: (row) => row.updatedBy },
];

const unifiedItemDetailColumns: readonly DetailColumn<OrderLineItem>[] = [
  { label: "Product Type", minWidth: 150, getValue: (row) => row.productCategory || row.finishedType },
  { label: "Sales Item Name", minWidth: 190, getValue: (row) => row.salesItemName },
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Length", minWidth: 120, getValue: (row) => row.length },
  { label: "Width", minWidth: 120, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 120, getValue: (row) => row.thickness },
  { label: "No. of Sheets", minWidth: 130, getValue: (row) => row.quantitySheets },
  { label: "SQM", minWidth: 120, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 120, getValue: (row) => row.totalSqm },
  { label: "Rate per SQF", minWidth: 140, getValue: (row) => row.ratePerSqf },
  { label: "Base Type", minWidth: 130, getValue: (row) => row.baseType },
  { label: "Base Name", minWidth: 160, getValue: (row) => row.baseName },
  { label: "Base Length", minWidth: 130, getValue: (row) => row.baseLength },
  { label: "Base Width", minWidth: 130, getValue: (row) => row.baseWidth },
  { label: "Base Thickness", minWidth: 150, getValue: (row) => row.baseThickness },
  { label: "Amount", minWidth: 130, getValue: (row) => row.amount },
  { label: "Remark", minWidth: 200, getValue: (row) => row.remark },
];

const customerDetailColumns: readonly DetailColumn<MasterRecord>[] = [
  { label: "Customer Name", minWidth: 180, getValue: (row) => row.customerName },
  { label: "Company Name", minWidth: 200, getValue: (row) => row.companyName },
  { label: "Customer Type", minWidth: 150, getValue: (row) => row.customerType },
  { label: "Email", minWidth: 220, getValue: (row) => row.email },
  { label: "Phone No", minWidth: 150, getValue: (row) => row.phoneNumber },
  { label: "GST No", minWidth: 170, getValue: (row) => row.gstNo },
  { label: "PAN No", minWidth: 140, getValue: (row) => row.panNo },
  { label: "Pincode", minWidth: 120, getValue: (row) => row.pincode },
  { label: "Country", minWidth: 120, getValue: (row) => row.country },
  { label: "State", minWidth: 140, getValue: (row) => row.state },
  { label: "City", minWidth: 140, getValue: (row) => row.city },
  { label: "Remark", minWidth: 220, getValue: (row) => row.remark },
];

export function OrderRecordPage({
  mode,
  moduleConfig = ordersModuleConfig,
}: OrderRecordPageProps) {
  const records = useOrderRecords();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const samplePrefill = (location.state as SampleOrderLocationState | null) ?? null;
  const paths = getOrdersPaths(moduleConfig.basePath);
  const record = useMemo(
    () => records.find((entry) => entry.id === id),
    [id, records],
  );
  const createVariant = useMemo<OrderCreateVariant>(
    () => getOrderCreateVariant(searchParams.get("type")),
    [searchParams],
  );
  const recordVariant = useMemo<OrderCreateVariant | null>(
    () => (record ? "order" : null),
    [record],
  );
  const activeVariant = mode === "add" ? createVariant : recordVariant;
  const activeFields = useMemo(
    () =>
      mode === "view"
        ? orderViewFields
        : activeVariant
          ? getCreateOrderFormFields(activeVariant)
          : getOrderFormFields(),
    [activeVariant, mode],
  );
  const pageTitle = getOrderPageTitle(mode, activeVariant);
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildOrderInitialValues(activeFields, record, activeVariant),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const lineItemsTableRef = useRef<OrderLineItemsTableHandle>(null);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(() => {
    if (record) {
      return getOrderLineItems(record.id);
    }

    if (mode === "add" && samplePrefill?.fromSampleSheet && samplePrefill.lineItemDraft) {
      return [buildSamplePrefillLineItem(samplePrefill)];
    }

    return [];
  });
  const selectedCustomerName =
    typeof values.customerName === "string" ? values.customerName : "";
  const selectedCustomer = useMemo(
    () =>
      getOrderCustomerRows().find(
        (row) => String(row.customerName ?? "") === selectedCustomerName,
      ),
    [selectedCustomerName],
  );
  const canCreate = canAccessPermission(moduleConfig.permissionKey, "create");
  const canEdit = canAccessPermission(moduleConfig.permissionKey, "edit");
  const canView = canAccessPermission(moduleConfig.permissionKey, "view");
  const canUseMode =
    mode === "add" ? canCreate : mode === "edit" ? canEdit : canView;

  useEffect(() => {
    setValues(buildOrderInitialValues(activeFields, record, activeVariant));
  }, [activeFields, activeVariant, record]);

  useEffect(() => {
    setLineItems(record ? getOrderLineItems(record.id) : []);
  }, [record]);

  if ((mode === "edit" || mode === "view") && !record) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: moduleConfig.title, to: paths.list },
          { label: "Not Found" },
        ]}
        title={moduleConfig.title}
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested order could not be found in the mock dataset.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: moduleConfig.title, to: paths.list },
          { label: pageTitle },
        ]}
        title={pageTitle}
      >
        <MasterSectionCard>
          <Alert severity="warning">
            You do not have permission to access this order action.
          </Alert>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (mode === "view" && record) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: moduleConfig.title, to: paths.list },
          { label: pageTitle },
        ]}
        title={pageTitle}
        subtitle={
          recordVariant === "finished"
            ? "Finished product demand that may require Factory processing later."
            : "Customer request for raw / non-finished material."
        }
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(2),
          })}
        >
          <OrderTypeBanner variant={recordVariant} />

          <MasterSectionCard>
            <Stack spacing={1.5}>
              <OrderSectionTitle title="Order Summary" />
              <OrderLabelValueGrid
                items={orderDetailColumns.map((column) => ({
                  label: column.label,
                  value: formatDetailValue(column.getValue(record)),
                }))}
              />
            </Stack>
          </MasterSectionCard>

          <MasterSectionCard>
            <Stack spacing={1.5}>
              <OrderSectionTitle
                title={
                  recordVariant === "finished"
                    ? "Finished Order Items"
                    : "Raw Order Items"
                }
              />
              {lineItems.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No order items are available.
                </Typography>
              ) : (
                lineItems.map((item, index) => (
                  <Box
                    key={item.id}
                    sx={(theme) => ({
                      border: `1px solid ${theme.customTokens.borders.default}`,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      px: theme.spacing(1.5),
                      py: theme.spacing(1.25),
                    })}
                  >
                    <Typography
                      sx={(theme) => ({
                        color: theme.customTokens.brand.primary,
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        mb: 1,
                      })}
                    >
                      {recordVariant === "finished"
                        ? `Order Item No ${formatViewOrderItemNo(item.id, index)}`
                        : `Item ${index + 1}`}
                    </Typography>
                    <OrderLabelValueGrid
                      items={getItemDetailColumns(recordVariant).map((column) => ({
                        label: column.label,
                        value: formatDetailValue(column.getValue(item)),
                      }))}
                    />
                  </Box>
                ))
              )}
            </Stack>
          </MasterSectionCard>

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              gap: theme.spacing(1.25),
            })}
          >
            <Button
              onClick={() => navigate(paths.list)}
              startIcon={<ChevronLeft size={16} />}
              sx={recordViewActionButtonSx}
              variant="outlined"
            >
              Back
            </Button>

            <Button
              onClick={() => {
                if (record) {
                  navigate(paths.edit(record.id));
                }
              }}
              startIcon={<Pencil size={16} />}
              sx={recordViewActionButtonSx}
              variant="contained"
            >
              Edit
            </Button>
          </Box>
        </Stack>
      </MasterPageShell>
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: moduleConfig.title, to: paths.list },
        { label: pageTitle },
      ]}
      contentGap={1.5}
      title={pageTitle}
      subtitle={
        activeVariant === "finished"
          ? "Create a finished product customer order."
          : activeVariant === "raw"
            ? "Create a raw / non-finished material customer order."
            : undefined
      }
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1.5),
          width: "100%",
        })}
      >
        <OrderCompactSectionCard>
          <Stack spacing={1.15}>
            <OrderSectionTitle title="Order Details" />
            <OrderHeaderFields
              fields={getOrderDetailsFields(activeFields as MasterFieldDefinition[])}
              fieldActions={{
                customerName: (
                  <IconButton
                    aria-label="View customer details"
                    disabled={!selectedCustomer}
                    onClick={() => setIsCustomerDetailsOpen(true)}
                    size="small"
                    sx={(theme) => ({
                      color: selectedCustomer
                        ? theme.customTokens.navigation.activeText
                        : theme.palette.text.disabled,
                      height: theme.spacing(2.5),
                      minHeight: theme.spacing(2.5),
                      p: 0,
                      width: theme.spacing(2.5),
                      "&:hover": {
                        backgroundColor:
                          theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    <Info size={14} />
                  </IconButton>
                ),
              }}
              onChange={(key, value) => {
                if (key === "orderNo" && mode === "add") {
                  return;
                }

                setValues((current) => ({
                  ...current,
                  [key]: value,
                }));
              }}
              showRequiredErrors={hasSubmitted}
              values={{
                ...values,
                orderNo:
                  (typeof values.orderNo === "string" && values.orderNo.trim()
                    ? values.orderNo
                    : record?.orderNo) ||
                  (mode === "add" ? "Auto-generated" : ""),
              }}
            />
          </Stack>
        </OrderCompactSectionCard>

        <OrderLineItemsTable
          ref={lineItemsTableRef}
          items={lineItems}
          onChange={setLineItems}
          readOnly={false}
          variant={activeVariant}
        />

        <OrderFormFooter
          lineItems={lineItems}
          onCancel={() => navigate(paths.list)}
          onSave={() => {
            if (!canUseMode) {
              return;
            }

            setHasSubmitted(true);

            const lineItemsAreValid =
              lineItemsTableRef.current?.validate() ?? true;

            if (
              hasFormFieldErrors(activeFields, values) ||
              !lineItemsAreValid
            ) {
              return;
            }

            const payload = buildOrderPayload(values, lineItems);

            if (mode === "add") {
              if (activeVariant) {
                payload.orderType = getOrderVariantLabel(activeVariant);
              }

              const createdId = createOrderRecord(payload);
              if (samplePrefill?.fromSampleSheet && samplePrefill.sampleNo) {
                const createdOrder = getOrderRecord(createdId);
                const issuedSheets = lineItems.reduce((total, item) => {
                  const parsed = Number(
                    String(item.quantitySheets ?? "").replace(/[^\d.]/g, ""),
                  );
                  return total + (Number.isFinite(parsed) ? parsed : 0);
                }, 0);
                allocateSampleToOrder({
                  sampleNo: samplePrefill.sampleNo,
                  orderNo: createdOrder?.orderNo ?? createdId,
                  sheets: issuedSheets,
                });
              }
            } else if (record) {
              updateOrderRecord(record.id, payload);
            }

            navigate(paths.list);
          }}
        />
      </Stack>

      <CustomerDetailsDialog
        customer={selectedCustomer}
        onClose={() => setIsCustomerDetailsOpen(false)}
        open={isCustomerDetailsOpen}
      />
    </MasterPageShell>
  );
}

function OrderCompactSectionCard({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      {children}
    </Box>
  );
}

function OrderSectionTitle({ title }: { title: string }) {
  return <FormSectionHeader title={title} />;
}

const orderDetailsFieldOrder = [
  "orderNo",
  "orderDate",
  "customerName",
  "priority",
  "remark",
] as const;

const orderHeaderFieldSizes: Partial<Record<string, FormFieldSize>> = {
  orderNo: "sm",
  orderDate: "sm",
  customerName: "md",
  priority: "xs",
  remark: "full",
};

function getOrderDetailsFields(
  fields: readonly MasterFieldDefinition[],
): MasterFieldDefinition[] {
  const byKey = new Map(fields.map((field) => [field.key, field]));
  const ordered: MasterFieldDefinition[] = [];

  for (const key of orderDetailsFieldOrder) {
    if (key === "orderNo") {
      ordered.push({
        ...(byKey.get("orderNo") ?? { key: "orderNo", label: "Order No", type: "text" }),
        key: "orderNo",
        label: "Order No",
        type: "text",
        readOnly: true,
      });
      continue;
    }

    const field = byKey.get(key);

    if (field) {
      ordered.push(field);
    }
  }

  for (const field of fields) {
    if (
      !orderDetailsFieldOrder.includes(
        field.key as (typeof orderDetailsFieldOrder)[number],
      )
    ) {
      ordered.push(field);
    }
  }

  return ordered;
}

function OrderHeaderFields({
  fieldActions,
  fields,
  onChange,
  showRequiredErrors,
  values,
}: {
  fieldActions?: Record<string, ReactNode>;
  fields: readonly MasterFieldDefinition[];
  onChange: (key: string, value: MasterFieldValue) => void;
  showRequiredErrors: boolean;
  values: Record<string, MasterFieldValue>;
}) {
  return (
    <SizedMasterFormFields
      fieldActions={fieldActions}
      fields={fields}
      onChange={onChange}
      showRequiredErrors={showRequiredErrors}
      sizes={orderHeaderFieldSizes}
      values={values}
    />
  );
}

function OrderFormFooter({
  lineItems,
  onCancel,
  onSave,
}: {
  lineItems: readonly OrderLineItem[];
  onCancel: () => void;
  onSave: () => void;
}) {
  const totals = computeOrderLineTotals(lineItems);

  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "space-between",
        gap: theme.spacing(1.5),
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: "8px",
        backgroundColor: theme.customTokens.surfaces.surface,
        px: theme.spacing(1.75),
        py: theme.spacing(1.25),
      })}
    >
      <Box
        sx={(theme) => ({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: theme.spacing(2.5),
          rowGap: theme.spacing(1),
          minWidth: 0,
        })}
      >
        <OrderTotalMetric label="Total Items" value={String(totals.totalItems)} />
        <OrderTotalMetric label="Total Sheets" value={formatTotalNumber(totals.totalSheets, 0)} />
        <OrderTotalMetric label="Total SQM" value={formatTotalNumber(totals.totalSqm, 3)} />
        <OrderTotalMetric label="Total SQF" value={formatTotalNumber(totals.totalSqf, 3)} />
        <OrderTotalMetric
          emphasize
          label="Order Amount"
          value={formatCurrency(totals.orderAmount, { withSymbol: true })}
        />
      </Box>

      <Box
        sx={(theme) => ({
          display: "flex",
          gap: theme.spacing(1.25),
          flexShrink: 0,
          ml: "auto",
        })}
      >
        <Button
          type="button"
          onClick={onCancel}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={onSave}
          startIcon={<Save size={16} />}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Save Order
        </Button>
      </Box>
    </Box>
  );
}

function OrderTotalMetric({
  emphasize = false,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.35} sx={{ minWidth: emphasize ? 150 : undefined }}>
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.secondary,
          fontSize: "12px",
          fontWeight: 500,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        })}
      >
        {label}
      </Typography>
      <Typography
        sx={(theme) => ({
          color: emphasize
            ? theme.customTokens.brand.primary
            : theme.customTokens.text.primary,
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: 1.4,
        })}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function computeOrderLineTotals(lineItems: readonly OrderLineItem[]) {
  return lineItems.reduce(
    (totals, item) => ({
      totalItems: totals.totalItems + 1,
      totalSheets: totals.totalSheets + parseOrderNumber(item.quantitySheets),
      totalSqm: totals.totalSqm + parseOrderNumber(item.sqm),
      totalSqf: totals.totalSqf + parseOrderNumber(item.totalSqm),
      orderAmount: totals.orderAmount + parseOrderNumber(item.amount),
    }),
    {
      totalItems: 0,
      totalSheets: 0,
      totalSqm: 0,
      totalSqf: 0,
      orderAmount: 0,
    },
  );
}

function parseOrderNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const numeric = Number(String(value).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}

function formatTotalNumber(value: number, fractionDigits: number) {
  if (fractionDigits === 0) {
    return formatQuantity(value);
  }

  if (fractionDigits === 3) {
    return formatSQM(value);
  }

  return formatAmount(value);
}

function OrderLabelValueGrid({
  items,
}: {
  items: readonly { label: string; value: string }[];
}) {
  const visibleItems = items.filter((item) => item.value.trim().length > 0);

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: theme.spacing(1.25),
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(4, minmax(0, 1fr))",
        },
      })}
    >
      {visibleItems.map((item) => (
        <Stack key={item.label} spacing={0.35} sx={{ minWidth: 0 }}>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.secondary,
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
            })}
          >
            {item.label}
          </Typography>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.primary,
              fontSize: "0.8125rem",
              fontWeight: 600,
              lineHeight: 1.35,
              wordBreak: "break-word",
            })}
          >
            {item.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function formatViewOrderItemNo(itemId: string, index: number) {
  const numericTail = String(itemId).match(/(\d+)$/)?.[1];
  const sequence = numericTail
    ? Number.parseInt(numericTail, 10)
    : index + 1;

  return `OI-${String(Number.isFinite(sequence) ? sequence : index + 1).padStart(3, "0")}`;
}

function CustomerDetailsDialog({
  customer,
  onClose,
  open,
}: {
  customer: MasterRecord | undefined;
  onClose: () => void;
  open: boolean;
}) {
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
            boxShadow: theme.customTokens.elevation.md,
            maxHeight: "none",
            overflow: "visible",
            outline: "none",
            width: "min(96vw, 1760px)",
            "&:focus": {
              outline: "none",
            },
            "&:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Customer Details
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: theme.spacing(2),
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <OrderDetailTable
            columns={customerDetailColumns}
            emptyLabel="Customer details are not available."
            fitToContainer
            rows={customer ? [customer] : []}
            title="Selected Customer"
          />

          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Button onClick={onClose} variant="contained">
              Close
            </Button>
          </Box>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailTable<TRow>({
  columns,
  emptyLabel = "No records are available.",
  fitToContainer = false,
  rows,
  title,
}: {
  columns: readonly DetailColumn<TRow>[];
  emptyLabel?: string;
  fitToContainer?: boolean;
  rows: readonly TRow[];
  title: string;
}) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(1),
      })}
    >
      <Typography variant="body1" color="text.primary" fontWeight={600}>
        {title}
      </Typography>

      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.sm}px`,
          overflow: "hidden",
          backgroundColor: theme.customTokens.surfaces.surface,
        })}
      >
        <Box
          sx={(theme) =>
            fitToContainer
              ? getDetailTableFitContainerSx(theme)
              : getDetailTableScrollSx(theme)
          }
        >
          <Table
            size="small"
            sx={{
              minWidth: fitToContainer ? "100%" : getDetailTableMinWidth(columns),
              tableLayout: fitToContainer ? "fixed" : "auto",
              width: "100%",
            }}
          >
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.label}
                    sx={(theme) =>
                      getDetailHeaderCellSx(
                        theme,
                        fitToContainer ? undefined : column.minWidth ?? 130,
                        fitToContainer,
                      )
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
                        sx={(theme) => getDetailBodyCellSx(theme, fitToContainer)}
                      >
                        {formatDetailValue(column.getValue(row))}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    sx={(theme) => getDetailBodyCellSx(theme, fitToContainer)}
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

function formatDetailValue(value: unknown) {
  if (value instanceof Date) {
    return formatMasterValue(value);
  }

  if (value === null || typeof value === "undefined") {
    return "-";
  }

  const text = String(value).trim();

  return text.length > 0 ? text : "-";
}

function OrderTypeBanner(_props: { variant: OrderCreateVariant | null }) {
  return null;
}

function getItemDetailColumns(_variant: OrderCreateVariant | null) {
  return unifiedItemDetailColumns;
}

function getDetailTableMinWidth<TRow>(columns: readonly DetailColumn<TRow>[]) {
  return columns.reduce((total, column) => total + (column.minWidth ?? 130), 0);
}

function getDetailHeaderCellSx(
  theme: Theme,
  minWidth?: number,
  allowWrap = false,
) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth, "center"),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    lineHeight: 1.35,
    ...(allowWrap
      ? {
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }
      : {}),
  } as const;
}

function getDetailBodyCellSx(theme: Theme, allowWrap = false) {
  return {
    ...transactionTableBodyCellSx(theme, "center"),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    color: theme.palette.text.primary,
    ...(allowWrap
      ? {
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }
      : {}),
  } as const;
}

function getDetailTableFitContainerSx(_theme: Theme) {
  return {
    overflow: "hidden",
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

function buildOrderInitialValues(
  fields: readonly MasterFieldDefinition[],
  record?: OrderRecord,
  variant?: OrderCreateVariant | null,
) {
  return fields.reduce<Record<string, MasterFieldValue>>((accumulator, field) => {
    const value = record?.[field.key as keyof OrderRecord];

    if (!record && variant && field.key === "orderType") {
      accumulator[field.key] = getOrderVariantLabel(variant);
      return accumulator;
    }

    if (!record && field.key === "priority") {
      accumulator[field.key] = "Standard";
      return accumulator;
    }

    if (field.type === "date") {
      if (value instanceof Date) {
        accumulator[field.key] = value;
        return accumulator;
      }

      accumulator[field.key] = !record && field.key === "orderDate" ? new Date() : null;
      return accumulator;
    }

    accumulator[field.key] = typeof value === "string" ? value : "";
    return accumulator;
  }, {});
}

function buildSamplePrefillLineItem(
  samplePrefill: SampleOrderLocationState,
): OrderLineItem {
  const draft = samplePrefill.lineItemDraft ?? {};
  const finishedType =
    draft.finishedType || samplePrefill.finishedType || "Decorative";

  return {
    id: `sample-prefill-${Date.now()}`,
    productCategory: "Finished",
    finishedType,
    salesItemName: draft.salesItemName || `${finishedType} ${draft.itemName || "Sample"}`,
    itemName: draft.itemName || "",
    subCategory: draft.subCategory || "",
    series: draft.series || "",
    grade: draft.grade || "",
    length: draft.length || "",
    width: draft.width || "",
    thickness: draft.thickness || "",
    quantitySheets: draft.quantitySheets || "",
    sqm: draft.sqm || "",
    totalSqm: draft.totalSqm || "",
    ratePerSqf: draft.ratePerSqf || "",
    baseType: draft.baseType || "",
    baseName: draft.baseName || "",
    baseLength: draft.baseLength || "",
    baseWidth: draft.baseWidth || "",
    baseThickness: draft.baseThickness || "",
    amount: draft.amount || "",
    remark: draft.remark || (samplePrefill.sampleNo ? `From Sample ${samplePrefill.sampleNo}` : ""),
  };
}

function getOrderPageTitle(
  mode: "add" | "edit" | "view",
  variant?: OrderCreateVariant | null,
) {
  const suffix = variant ? getOrderVariantLabel(variant) : "Order";

  if (mode === "add") {
    return `Create ${suffix}`;
  }

  if (mode === "edit") {
    return `Edit ${suffix}`;
  }

  return `View ${suffix}`;
}

function buildOrderPayload(
  values: Record<string, MasterFieldValue>,
  lineItems: readonly OrderLineItem[],
) {
  const payload: Partial<OrderDraft> = {
    lineItems: [...lineItems],
  };

  assignStringValue(payload, "amount", values.amount);
  assignStringValue(payload, "customerName", values.customerName);
  assignDateValue(payload, "deliveryDate", values.deliveryDate);
  assignStringValue(payload, "grade", values.grade);
  assignStringValue(payload, "itemName", values.itemName);
  assignStringValue(payload, "length", values.length);
  assignDateValue(payload, "orderDate", values.orderDate);
  if (
    typeof values.orderNo === "string" &&
    values.orderNo.trim() &&
    values.orderNo.trim() !== "Auto-generated" &&
    values.orderNo.trim() !== "Auto-generated on Save"
  ) {
    assignStringValue(payload, "orderNo", values.orderNo);
  }
  assignStringValue(payload, "orderType", values.orderType);
  assignStringValue(payload, "priority", values.priority);
  assignStringValue(payload, "productCategory", values.productCategory);
  assignStringValue(payload, "quantitySheets", values.quantitySheets);
  assignStringValue(payload, "remark", values.remark);
  assignStringValue(payload, "salesCoordinator", values.salesCoordinator);
  assignStringValue(payload, "series", values.series);
  assignStringValue(payload, "status", values.status);
  assignStringValue(payload, "subCategory", values.subCategory);
  assignStringValue(payload, "thickness", values.thickness);
  assignStringValue(payload, "totalSqm", values.totalSqm);
  assignStringValue(payload, "width", values.width);

  return payload;
}

function assignDateValue(
  payload: Partial<OrderDraft>,
  key: keyof OrderDraft,
  value: MasterFieldValue | undefined,
) {
  if (!(value instanceof Date)) {
    return;
  }

  (payload as Record<string, string | Date>)[key] = value;
}

function assignStringValue(
  payload: Partial<OrderDraft>,
  key: keyof OrderDraft,
  value: MasterFieldValue | undefined,
) {
  if (typeof value !== "string") {
    return;
  }

  (payload as Record<string, string | Date>)[key] = value;
}
