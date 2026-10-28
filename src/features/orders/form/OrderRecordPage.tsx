import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
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
import { Info, Pencil, Save } from "lucide-react";
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
import { fetchCustomerMasterDetail } from "../../masters/customer-master/api/customerMasterApi";
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
  appendCreatedOrderToStore,
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
  setCachedOrderCustomerData,
  type OrderDraft,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderModuleConfig,
  type OrderRecord,
  updateOrderRecord,
  useOrderRecords,
} from "../shared/ordersStore";
import {
  OrderLineItemsTable,
  type OrderLineItemsTableHandle,
} from "./OrderLineItemsTable";
import { allocateSampleToOrder } from "../../factory/shared/sampleSheetIdentityStore";
import {
  createOrderApi,
  fetchNextOrderNoApi,
  fetchOrderByIdApi,
  fetchOrderDropdownsApi,
  mapBackendOrderToOrderRecord,
  updateOrderApi,
} from "../api/ordersApi";

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
  { label: "Required Delivery Date", minWidth: 160, getValue: (row) => row.deliveryDate },
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
  { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
  { label: "Sales Item Name", minWidth: 190, getValue: (row) => row.salesItemName },
  { label: "Log No.", minWidth: 120, getValue: (row) => row.logNo ?? "-" },
  { label: "Batch No", minWidth: 120, getValue: (row) => row.batchNo ?? "-" },
  { label: "Length", minWidth: 120, getValue: (row) => row.length },
  { label: "Width", minWidth: 120, getValue: (row) => row.width },
  { label: "Thickness", minWidth: 120, getValue: (row) => row.thickness },
  { label: "CBM", minWidth: 110, getValue: (row) => row.cbm ?? "-" },
  { label: "CBF", minWidth: 110, getValue: (row) => row.cbf ?? "-" },
  { label: "No. of Sheets", minWidth: 130, getValue: (row) => row.quantitySheets },
  { label: "No. of Leaves", minWidth: 130, getValue: (row) => row.noOfLeaves ?? "-" },
  { label: "Group No.", minWidth: 130, getValue: (row) => row.groupNo ?? "-" },
  { label: "Photo No.", minWidth: 130, getValue: (row) => row.photoNo ?? "-" },
  { label: "SQM", minWidth: 120, getValue: (row) => row.sqm },
  { label: "SQF", minWidth: 120, getValue: (row) => row.totalSqm },
  {
    label: "Rate",
    minWidth: 140,
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
  { label: "Base Type", minWidth: 130, getValue: (row) => row.baseType },
  { label: "Base Name", minWidth: 160, getValue: (row) => row.baseName },
  { label: "Base Length", minWidth: 130, getValue: (row) => row.baseLength },
  { label: "Base Width", minWidth: 130, getValue: (row) => row.baseWidth },
  { label: "Base Thickness", minWidth: 150, getValue: (row) => row.baseThickness },
  { label: "Design Code", minWidth: 130, getValue: (row) => row.designCode },
  { label: "Structured Code", minWidth: 140, getValue: (row) => row.structuredCode },
  { label: "Amount", minWidth: 130, getValue: (row) => row.amount },
  { label: "Remark", minWidth: 200, getValue: (row) => row.remark },
];

const customerDetailColumns: readonly DetailColumn<MasterRecord>[] = [
  { label: "Customer Name", minWidth: 180, getValue: (row) => row.customerName },
  { label: "Company Name", minWidth: 200, getValue: (row) => row.companyName },
  { label: "Customer Type", minWidth: 150, getValue: (row) => row.customerType },
  { label: "Email", minWidth: 220, getValue: (row) => row.email },
  { label: "Phone No", minWidth: 150, getValue: (row) => row.phoneNumber },
  { label: "GSTIN", minWidth: 170, getValue: (row) => row.gstNo },
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
  const [customerOptionsVersion, setCustomerOptionsVersion] = useState(0);
  const activeFields = useMemo(() => {
    const rawFields =
      mode === "view"
        ? orderViewFields
        : activeVariant
          ? getCreateOrderFormFields(activeVariant)
          : getOrderFormFields();

    return rawFields.map((field) => {
      if (field.key === "customerName") {
        return {
          ...field,
          onOpenDropdown: () => {
            void fetchOrderDropdownsApi({ type: "customers" })
              .then((data) => {
                if (data?.customers && data.customers.length > 0) {
                  setCachedOrderCustomerData(data.customers);
                  setCustomerOptionsVersion((v) => v + 1);
                }
              })
              .catch(() => {});
          },
        };
      }
      return field;
    });
  }, [activeVariant, customerOptionsVersion, mode]);
  const pageTitle = getOrderPageTitle(mode, activeVariant);
  const activeOrderTypeLabel = activeVariant
    ? getOrderVariantLabel(activeVariant)
    : "Order";
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildOrderInitialValues(activeFields, record, activeVariant),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
    [customerOptionsVersion, selectedCustomerName],
  );
  const canCreate = canAccessPermission(moduleConfig.permissionKey, "create");
  const canEdit = canAccessPermission(moduleConfig.permissionKey, "edit");
  const canView = canAccessPermission(moduleConfig.permissionKey, "view");
  const canUseMode =
    mode === "add" ? canCreate : mode === "edit" ? canEdit : canView;

  // When in add mode, fetch and display the auto-generated order number from the backend
  useEffect(() => {
    if (mode !== "add") return;

    let isMounted = true;
    fetchNextOrderNoApi()
      .then((nextOrderNo) => {
        if (!isMounted || !nextOrderNo) return;
        setValues((current) => ({
          ...current,
          orderNo: nextOrderNo,
        }));
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [mode]);

  useEffect(() => {
    if (mode === "add" || !id) return;

    let isMounted = true;
    fetchOrderByIdApi(id)
      .then((backendOrder) => {
        if (!isMounted) return;
        const { record: mappedRecord, lineItems: mappedItems } =
          mapBackendOrderToOrderRecord(backendOrder);
        appendCreatedOrderToStore(mappedRecord, mappedItems);
        setValues(buildOrderInitialValues(activeFields, mappedRecord, activeVariant));
        setLineItems(mappedItems);
      })
      .catch((err: unknown) => {
        if (!isMounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load order from server.";
        setErrorMessage(msg);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFields, activeVariant, id, mode]);

  useEffect(() => {
    if (mode === "add") return;
    setValues(buildOrderInitialValues(activeFields, record, activeVariant));
  }, [activeFields, activeVariant, mode, record]);

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
            The requested order could not be found.
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
                      items={getDynamicLineItemDetailColumns(item).map((column) => ({
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
      subtitle={getOrderFormSubtitle(mode, activeOrderTypeLabel)}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1.5),
          width: "100%",
        })}
      >
        {errorMessage ? (
          <Alert severity="error">
            {errorMessage}
          </Alert>
        ) : null}

        <OrderCompactSectionCard>
          <Stack spacing={1.15}>
            <OrderSectionTitle
              endAdornment={mode === "add" ? (
                <Box
                  sx={(theme) => ({
                    backgroundColor: theme.customTokens.navigation.hoverBackground,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    borderRadius: "999px",
                    color: theme.customTokens.brand.primary,
                    fontSize: "11px",
                    fontWeight: 700,
                    lineHeight: 1,
                    px: 1.1,
                    py: 0.55,
                    whiteSpace: "nowrap",
                  })}
                >
                  {activeOrderTypeLabel}
                </Box>
              ) : undefined}
              title="Order Details"
            />
            <OrderHeaderFields
              createLayout={mode === "add"}
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

                // When user selects from customer dropdown, call the specific customer dropdown API
                if (key === "customerName" && typeof value === "string" && value.trim()) {
                  void fetchOrderDropdownsApi({
                    type: "customers",
                    search: value.trim(),
                  })
                    .then((data) => {
                      if (data?.customers && data.customers.length > 0) {
                        setCachedOrderCustomerData(data.customers);
                      }
                    })
                    .catch(() => {});
                }
              }}
              showRequiredErrors={hasSubmitted}
              values={{
                ...values,
                orderNo:
                  (typeof values.orderNo === "string" && values.orderNo.trim()
                    ? values.orderNo
                    : record?.orderNo) || "",
              }}
            />
          </Stack>
        </OrderCompactSectionCard>

        <OrderLineItemsTable
          createLayout={mode === "add"}
          ref={lineItemsTableRef}
          items={lineItems}
          onChange={setLineItems}
          readOnly={false}
          variant={activeVariant}
        />

        <OrderFormFooter
          createLayout={mode === "add"}
          customerState={selectedCustomer?.state ? String(selectedCustomer.state) : ""}
          isSaving={isSaving}
          lineItems={lineItems}
          onCancel={() => navigate(paths.list)}
          onSave={async () => {
            if (!canUseMode || isSaving) {
              return;
            }

            setHasSubmitted(true);
            setErrorMessage("");

            const hasHeaderErrors = hasFormFieldErrors(activeFields, values);
            const lineItemsAreValid =
              lineItemsTableRef.current?.validate() ?? true;

            if (lineItems.length === 0) {
              setErrorMessage("Please add at least one line item to the order.");
              return;
            }

            if (hasHeaderErrors && !lineItemsAreValid) {
              setErrorMessage("Please fill in all required order details and complete the line items information.");
              return;
            }

            if (hasHeaderErrors) {
              setErrorMessage("Please fill in all required order header details.");
              return;
            }

            if (!lineItemsAreValid) {
              setErrorMessage("Please correct errors in the line items table (all marked * fields are required).");
              return;
            }

            const payload = buildOrderPayload(values, lineItems);

            if (mode === "add") {
              if (activeVariant) {
                payload.orderType = getOrderVariantLabel(activeVariant);
              }

              setIsSaving(true);
              try {
                // Call real Create Order Backend API
                const createdBackendOrder = await createOrderApi(payload);
                const { record: mappedRecord, lineItems: mappedItems } =
                  mapBackendOrderToOrderRecord(createdBackendOrder);

                // Update in-memory & local storage sync for listings
                appendCreatedOrderToStore(mappedRecord, mappedItems);

                if (samplePrefill?.fromSampleSheet && samplePrefill.sampleNo) {
                  const issuedSheets = lineItems.reduce((total, item) => {
                    const parsed = Number(
                      String(item.quantitySheets ?? "").replace(/[^\d.]/g, ""),
                    );
                    return total + (Number.isFinite(parsed) ? parsed : 0);
                  }, 0);
                  allocateSampleToOrder({
                    sampleNo: samplePrefill.sampleNo,
                    orderNo: mappedRecord.orderNo,
                    sheets: issuedSheets,
                  });
                }

                navigate(paths.list, {
                  state: {
                    orderFlashMessage: `Order ${mappedRecord.orderNo} created successfully.`,
                  },
                });
              } catch (err: unknown) {
                const message =
                  err instanceof Error
                    ? err.message
                    : "Failed to create order on server. Please check your network or inputs.";
                setErrorMessage(message);
              } finally {
                setIsSaving(false);
              }
            } else if (record) {
              setIsSaving(true);
              try {
                const updatedBackendOrder = await updateOrderApi(record.id, payload);
                const { record: mappedRecord, lineItems: mappedItems } =
                  mapBackendOrderToOrderRecord(updatedBackendOrder);

                appendCreatedOrderToStore(mappedRecord, mappedItems);

                navigate(paths.list, {
                  state: {
                    orderFlashMessage: `Order ${mappedRecord.orderNo} updated successfully.`,
                  },
                });
              } catch (err: unknown) {
                const message =
                  err instanceof Error
                    ? err.message
                    : "Failed to update order on server. Please check your network or inputs.";
                setErrorMessage(message);
              } finally {
                setIsSaving(false);
              }
            }
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

function OrderSectionTitle({
  endAdornment,
  title,
}: {
  endAdornment?: ReactNode;
  title: string;
}) {
  return <FormSectionHeader endAdornment={endAdornment} title={title} />;
}

function getOrderFormSubtitle(mode: "add" | "edit" | "view", orderTypeLabel: string) {
  if (mode === "add") {
    return `Create a ${orderTypeLabel.toLowerCase()} with customer, delivery, and item details.`;
  }

  return undefined;
}

const orderDetailsFieldOrder = [
  "orderNo",
  "orderDate",
  "deliveryDate",
  "customerName",
  "priority",
  "status",
  "remark",
] as const;

const orderHeaderFieldSizes: Partial<Record<string, FormFieldSize>> = {
  orderNo: "sm",
  orderDate: "sm",
  deliveryDate: "sm",
  customerName: "md",
  priority: "xs",
  status: "sm",
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
        placeholder: "Auto-generated",
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
  createLayout,
  fieldActions,
  fields,
  onChange,
  showRequiredErrors,
  values,
}: {
  createLayout: boolean;
  fieldActions?: Record<string, ReactNode>;
  fields: readonly MasterFieldDefinition[];
  onChange: (key: string, value: MasterFieldValue) => void;
  showRequiredErrors: boolean;
  values: Record<string, MasterFieldValue>;
}) {
  if (createLayout) {
    return (
      <Box
        sx={(theme) => ({
          alignItems: "flex-start",
          display: "grid",
          gap: theme.spacing(1.25, 1.5),
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          width: "100%",
        })}
      >
        {fields.map((field) => (
          <Box
            key={field.key}
            sx={{
              gridColumn: {
                xs: "1 / -1",
                sm: field.key === "remark" ? "1 / -1" : "auto",
                lg: field.key === "remark" ? "span 2" : "auto",
              },
              minWidth: 0,
            }}
          >
            <MasterFormFields
              compact
              definition={{ fields: [field], gridColumns: 2 }}
              {...(fieldActions ? { fieldActions } : {})}
              onChange={onChange}
              showRequiredErrors={showRequiredErrors}
              values={values}
            />
          </Box>
        ))}
      </Box>
    );
  }

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
  createLayout,
  customerState = "",
  isSaving = false,
  lineItems,
  onCancel,
  onSave,
}: {
  createLayout: boolean;
  customerState?: string;
  isSaving?: boolean;
  lineItems: readonly OrderLineItem[];
  onCancel: () => void;
  onSave: () => void;
}) {
  const totals = computeOrderLineTotals(lineItems);
  const normCustomerState = (customerState || "").trim().toLowerCase();
  // Deluxe Veneers primary/factory state is Gujarat (or Maharashtra)
  // If customer is within the same state (Gujarat/Maharashtra or unspecified), apply CGST + SGST (9% + 9%)
  // If customer is from a different state (e.g. Rajasthan, Delhi, Karnataka, etc.), apply IGST (18%)
  const isInterState = Boolean(normCustomerState && normCustomerState !== "gujarat" && normCustomerState !== "maharashtra");
  const cgstAmount = isInterState ? 0 : totals.orderAmount * 0.09;
  const sgstAmount = isInterState ? 0 : totals.orderAmount * 0.09;
  const igstAmount = isInterState ? totals.orderAmount * 0.18 : 0;
  const totalTax = cgstAmount + sgstAmount + igstAmount;
  const totalInvoiceAmount = totals.orderAmount + totalTax;

  if (!createLayout) {
    return (
      <Box
        sx={(theme) => ({
          alignItems: "center",
          backgroundColor: theme.customTokens.surfaces.surface,
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: "8px",
          display: "flex",
          flexWrap: "wrap",
          gap: theme.spacing(1.5),
          justifyContent: "space-between",
          px: theme.spacing(1.75),
          py: theme.spacing(1.25),
        })}
      >
        <Box
          sx={(theme) => ({
            alignItems: "center",
            display: "flex",
            flexWrap: "wrap",
            gap: theme.spacing(2.5),
            minWidth: 0,
            rowGap: theme.spacing(1),
          })}
        >
          <OrderTotalMetric label="Total Items" value={String(totals.totalItems)} />
          <OrderTotalMetric label="Total Sheets" value={formatTotalNumber(totals.totalSheets, 0)} />
          <OrderTotalMetric label="Total SQM" value={formatTotalNumber(totals.totalSqm, 3)} />
          <OrderTotalMetric label="Total SQF" value={formatTotalNumber(totals.totalSqf, 3)} />
          <OrderTotalMetric emphasize label="Order Amount" value={formatCurrency(totals.orderAmount, { withSymbol: true })} />
        </Box>
        <OrderFooterActions isSaving={isSaving} onCancel={onCancel} onSave={onSave} />
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      <FormSectionHeader title="Order Summary" />
      <Box
        sx={(theme) => ({
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing(1.5),
          pt: theme.spacing(1.25),
        })}
      >
        <Box
          sx={(theme) => ({
            display: "grid",
            flex: "1 1 720px",
            gap: theme.spacing(1),
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              sm: "repeat(3, minmax(0, 1fr))",
              lg: `repeat(${totals.hasLeafBasedItems ? 6 : 5}, minmax(110px, 1fr))`,
            },
            minWidth: 0,
          })}
        >
          <OrderTotalMetric card label="Total Items" value={String(totals.totalItems)} />
          <OrderTotalMetric card label="Total Sheets" value={formatTotalNumber(totals.totalSheets, 0)} />
          {totals.hasLeafBasedItems ? (
            <OrderTotalMetric card label="Total Leaves" value={formatTotalNumber(totals.totalLeaves, 0)} />
          ) : null}
          <OrderTotalMetric card label="Total SQM" value={formatTotalNumber(totals.totalSqm, 3)} />
          <OrderTotalMetric card label="Total SQF" value={formatTotalNumber(totals.totalSqf, 3)} />
          <OrderTotalMetric
            card
            emphasize
            label="Order Amount"
            value={formatCurrency(totals.orderAmount, { withSymbol: true })}
          />
        </Box>

        {/* Invoice Totals Box */}
        <Box
          sx={(theme) => ({
            backgroundColor: theme.customTokens.surfaces.alt,
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            minWidth: { xs: "100%", sm: "320px" },
            p: 1.5,
          })}
        >
          <Typography
            sx={(theme) => ({
              borderBottom: `1px solid ${theme.customTokens.borders.default}`,
              color: theme.customTokens.text.primary,
              fontSize: "12px",
              fontWeight: 700,
              letterSpacing: "0.04em",
              pb: 0.75,
              textTransform: "uppercase",
            })}
          >
            Invoice Totals
          </Typography>
          <Stack spacing={0.65} sx={{ pt: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={(theme) => ({ color: theme.customTokens.text.secondary, fontSize: "12px" })}>
                Sub Total
              </Typography>
              <Typography sx={(theme) => ({ color: theme.customTokens.text.primary, fontSize: "12px", fontWeight: 600 })}>
                {formatCurrency(totals.orderAmount, { withSymbol: true })}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography sx={(theme) => ({ color: theme.customTokens.text.secondary, fontSize: "12px" })}>
                Taxable Amount
              </Typography>
              <Typography sx={(theme) => ({ color: theme.customTokens.text.primary, fontSize: "12px", fontWeight: 600 })}>
                {formatCurrency(totals.orderAmount, { withSymbol: true })}
              </Typography>
            </Box>
            {isInterState ? (
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography sx={(theme) => ({ color: theme.customTokens.text.secondary, fontSize: "12px" })}>
                  IGST (18%)
                </Typography>
                <Typography sx={(theme) => ({ color: theme.customTokens.text.primary, fontSize: "12px", fontWeight: 600 })}>
                  {formatCurrency(igstAmount, { withSymbol: true })}
                </Typography>
              </Box>
            ) : (
              <>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={(theme) => ({ color: theme.customTokens.text.secondary, fontSize: "12px" })}>
                    CGST (9%)
                  </Typography>
                  <Typography sx={(theme) => ({ color: theme.customTokens.text.primary, fontSize: "12px", fontWeight: 600 })}>
                    {formatCurrency(cgstAmount, { withSymbol: true })}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography sx={(theme) => ({ color: theme.customTokens.text.secondary, fontSize: "12px" })}>
                    SGST (9%)
                  </Typography>
                  <Typography sx={(theme) => ({ color: theme.customTokens.text.primary, fontSize: "12px", fontWeight: 600 })}>
                    {formatCurrency(sgstAmount, { withSymbol: true })}
                  </Typography>
                </Box>
              </>
            )}
            <Box
              sx={(theme) => ({
                borderTop: `1px solid ${theme.customTokens.borders.default}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                pt: 0.75,
              })}
            >
              <Typography sx={(theme) => ({ color: theme.customTokens.text.primary, fontSize: "13px", fontWeight: 700 })}>
                Total
              </Typography>
              <Typography sx={(theme) => ({ color: theme.customTokens.brand.primary, fontSize: "14px", fontWeight: 700 })}>
                {formatCurrency(totalInvoiceAmount, { withSymbol: true })}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      {/* Action buttons row below Order Summary & Invoice Totals */}
      <Box
        sx={(theme) => ({
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          pt: theme.spacing(1.5),
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          mt: theme.spacing(1),
        })}
      >
        <OrderFooterActions isSaving={isSaving} onCancel={onCancel} onSave={onSave} responsive />
      </Box>
    </Box>
  );
}

function OrderFooterActions({
  isSaving = false,
  onCancel,
  onSave,
  responsive = false,
}: {
  isSaving?: boolean;
  onCancel: () => void;
  onSave: () => void;
  responsive?: boolean;
}) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        display: "flex",
        flexShrink: 0,
        gap: theme.spacing(1.25),
        justifyContent: responsive ? { xs: "stretch", sm: "flex-end" } : "flex-end",
        ml: "auto",
        width: responsive ? { xs: "100%", sm: "auto" } : "auto",
      })}
    >
      <Button disabled={isSaving} type="button" onClick={onCancel} sx={recordFormActionButtonSx} variant="outlined">
        Cancel
      </Button>
      <Button
        disabled={isSaving}
        type="button"
        onClick={onSave}
        startIcon={<Save size={16} />}
        sx={recordFormActionButtonSx}
        variant="contained"
      >
        {isSaving ? "Saving..." : "Save Order"}
      </Button>
    </Box>
  );
}

function OrderTotalMetric({
  card = false,
  emphasize = false,
  label,
  value,
}: {
  card?: boolean;
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  return (
    <Stack
      spacing={0.35}
      sx={(theme) => card
        ? ({
            backgroundColor: emphasize
              ? theme.customTokens.navigation.hoverBackground
              : theme.customTokens.surfaces.alt,
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "7px",
            minWidth: 0,
            px: 1.25,
            py: 0.8,
          })
        : ({ minWidth: emphasize ? 150 : undefined })}
    >
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
      totalLeaves: totals.totalLeaves + parseOrderNumber(item.noOfLeaves),
      hasLeafBasedItems: totals.hasLeafBasedItems || parseOrderNumber(item.noOfLeaves) > 0,
      totalSqm: totals.totalSqm + parseOrderNumber(item.sqm),
      totalSqf: totals.totalSqf + parseOrderNumber(item.totalSqm),
      orderAmount: totals.orderAmount + parseOrderNumber(item.amount),
    }),
    {
      totalItems: 0,
      totalSheets: 0,
      totalLeaves: 0,
      hasLeafBasedItems: false,
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
  const [detailCustomer, setDetailCustomer] = useState<MasterRecord | undefined>(customer);

  useEffect(() => {
    setDetailCustomer(customer);
    if (!open || !customer?.id) return;
    
    // Call the View API for customer details when (i) button is opened
    void fetchCustomerMasterDetail(customer.id)
      .then((data) => {
        if (data) {
          setDetailCustomer((prev) => ({
            ...(prev ?? {}),
            ...data,
            customerName: data.customerName || prev?.customerName || "",
          }));
        }
      })
      .catch(() => {});
  }, [open, customer]);

  const activeData = detailCustomer ?? customer;

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.customTokens.elevation.md,
            overflow: "hidden",
            width: { xs: "92vw", sm: "520px" },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: "1rem",
          fontWeight: 700,
          px: theme.spacing(2.5),
          py: theme.spacing(1.75),
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        })}
      >
        <span>Customer Details</span>
        <Button
          onClick={onClose}
          size="small"
          sx={{ minWidth: "auto", p: 0.5, color: "text.secondary" }}
        >
          ✕
        </Button>
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(3),
          pt: `${theme.spacing(2.75)} !important`,
          pb: theme.spacing(2.5),
        })}
      >
        {activeData ? (
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(1.5),
              gridTemplateColumns: "repeat(2, 1fr)",
            })}
          >
            {customerDetailColumns.map((col) => {
              const val = formatDetailValue(col.getValue(activeData));
              return (
                <Stack key={col.label} spacing={0.25} sx={{ minWidth: 0 }}>
                  <Typography
                    sx={(theme) => ({
                      color: theme.customTokens.text.secondary,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                    })}
                  >
                    {col.label}
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      color: theme.customTokens.text.primary,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      wordBreak: "break-word",
                    })}
                  >
                    {val}
                  </Typography>
                </Stack>
              );
            })}
          </Box>
        ) : (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
            Customer details are not available.
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 2.5, pb: 2 }}>
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
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

export function getDynamicLineItemDetailColumns(item: OrderLineItem): readonly DetailColumn<OrderLineItem>[] {
  const normProduct = (item.productCategory || item.finishedType || "")
    .trim()
    .replace(/\s*\((?:Raw|Finished)\)$/i, "")
    .toLowerCase();

  const isSawing = normProduct === "sawing";
  const isVeneer = normProduct === "veneer";
  const isDecorative = normProduct === "decorative";
  const isFluted = normProduct === "fluted";
  const isEmbossed = normProduct === "embossed";
  const isFinished = ["decorative", "marquetry", "fluted", "embossed", "plywood"].includes(normProduct);

  const columns: DetailColumn<OrderLineItem>[] = [
    { label: "Product Type", minWidth: 150, getValue: (row) => row.productCategory || row.finishedType },
    { label: "Item Name", minWidth: 180, getValue: (row) => row.itemName },
    { label: "Sales Item Name", minWidth: 190, getValue: (row) => row.salesItemName },
  ];

  if (isSawing) {
    columns.push(
      { label: "Log No.", minWidth: 120, getValue: (row) => row.logNo ?? "-" },
      { label: "Batch No", minWidth: 120, getValue: (row) => row.batchNo ?? "-" },
    );
  }

  columns.push(
    { label: "Length", minWidth: 120, getValue: (row) => row.length },
    { label: "Width", minWidth: 120, getValue: (row) => row.width },
    { label: "Thickness", minWidth: 120, getValue: (row) => row.thickness },
  );

  if (isSawing) {
    columns.push(
      { label: "CBM", minWidth: 110, getValue: (row) => row.cbm ?? "-" },
      { label: "CBF", minWidth: 110, getValue: (row) => row.cbf ?? "-" },
    );
  }

  if (!isVeneer && !isSawing) {
    columns.push(
      { label: "No. of Sheets", minWidth: 130, getValue: (row) => row.quantitySheets },
    );
  }

  if (isVeneer) {
    columns.push(
      { label: "No. of Leaves", minWidth: 130, getValue: (row) => row.noOfLeaves ?? "-" },
    );
  }

  if (!isSawing) {
    columns.push(
      { label: "SQM", minWidth: 120, getValue: (row) => row.sqm },
      { label: "SQF", minWidth: 120, getValue: (row) => row.totalSqm },
    );
  }

  columns.push(
    {
      label: "Rate",
      minWidth: 140,
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
    { label: "Amount", minWidth: 130, getValue: (row) => row.amount },
  );

  if (isDecorative) {
    columns.push(
      { label: "Group No.", minWidth: 130, getValue: (row) => row.groupNo ?? "-" },
      { label: "Photo No.", minWidth: 130, getValue: (row) => row.photoNo ?? "-" },
    );
  }

  if (isFinished) {
    columns.push(
      { label: "Base Type", minWidth: 130, getValue: (row) => row.baseType },
      { label: "Base Name", minWidth: 160, getValue: (row) => row.baseName },
      { label: "Base Length", minWidth: 130, getValue: (row) => row.baseLength },
      { label: "Base Width", minWidth: 130, getValue: (row) => row.baseWidth },
      { label: "Base Thickness", minWidth: 150, getValue: (row) => row.baseThickness },
    );
  }

  if (isFluted) {
    columns.push(
      { label: "Design Code", minWidth: 130, getValue: (row) => row.designCode },
    );
  }

  if (isEmbossed) {
    columns.push(
      { label: "Structured Code", minWidth: 140, getValue: (row) => row.structuredCode },
    );
  }

  columns.push({ label: "Remark", minWidth: 200, getValue: (row) => row.remark });

  return columns;
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

    if (!record && field.key === "orderNo") {
      accumulator[field.key] = "Auto-generated";
      return accumulator;
    }

    if (!record && variant && field.key === "orderType") {
      accumulator[field.key] = getOrderVariantLabel(variant);
      return accumulator;
    }

    if (!record && field.key === "priority") {
      accumulator[field.key] = "Standard";
      return accumulator;
    }

    if (!record && field.key === "status") {
      accumulator[field.key] = "Pending";
      return accumulator;
    }

    if (field.type === "date") {
      if (value instanceof Date) {
        accumulator[field.key] = value;
        return accumulator;
      }

      if (!record && field.key === "orderDate") {
        accumulator[field.key] = new Date();
        return accumulator;
      }

      if (!record && field.key === "deliveryDate") {
        const defaultDelivery = new Date();
        defaultDelivery.setDate(defaultDelivery.getDate() + 12);
        accumulator[field.key] = defaultDelivery;
        return accumulator;
      }

      accumulator[field.key] = null;
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
    remark: draft.remark || (samplePrefill.sampleNo ? `From Group ${samplePrefill.sampleNo}` : ""),
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
