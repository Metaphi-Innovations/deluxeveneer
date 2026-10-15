import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableColumn,
  type EnterpriseTableRow,
} from "../../../components/data-display/EnterpriseDataTable";
import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
  hasRequiredFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import {
  getOrderLineItems,
  getOrderVariantFromType,
  type OrderRecord,
  useOrderRecords,
} from "../../orders/shared/ordersStore";
import { canAccessPermission } from "../../permissions";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../shared/buttonStyles";
import {
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { SizedMasterFormFields } from "../../shared/SizedMasterFormFields";
import type { FormFieldSize } from "../../shared/formFieldSizes";
import { transactionTableHeaderCellSx } from "../../shared/listingTableStyles";
import {
  createPackingEntry,
  getPackingPaths,
  isFinishedOrderPackingEligible,
  isRawOrderPackingEligible,
  packingOrderTypeOptions,
  type PackingRecord,
  updatePackingRecord,
  usePackingRecords,
} from "../shared/packingStore";

const packingCreateFieldSizes: Partial<Record<string, FormFieldSize>> = {
  packingDate: "sm",
  customerName: "md",
  orderType: "sm",
  orderNo: "sm",
  preparedBy: "md",
  checkedBy: "md",
  remark: "lg",
};

const packingDetailFields: readonly MasterFieldDefinition[] = [
  { key: "packingId", label: "Packing ID", type: "text" },
  { key: "packingDate", label: "Packing Date", required: true, type: "date" },
  { key: "customerName", label: "Customer Name", type: "text" },
  { key: "orderType", label: "Order Type", type: "text" },
  { key: "productCategory", label: "Product Type", type: "text" },
  { key: "orderNo", label: "Order No", type: "text" },
  { key: "orderItemNo", label: "Order Item Number", type: "text" },
  { key: "preparedBy", label: "Prepared By", type: "text" },
  { key: "checkedBy", label: "Checked By", type: "text" },
  { key: "remark", label: "Remarks", type: "text" },
];

interface PackingSourceRow extends EnterpriseTableRow {
  sourceOrderId: string;
  customerName: string;
  orderNo: string;
  orderItemNo: string;
  orderType: string;
  productCategory: string;
  finishedType: string;
  salesItemName: string;
  itemName: string;
  groupNo: string;
  length: string;
  width: string;
  thickness: string;
  noOfSheets: string;
  sqm: string;
  sqf: string;
  ratePerSqf: string;
  amount: string;
  baseType: string;
  baseName: string;
  baseLength: string;
  baseWidth: string;
  baseThickness: string;
  designCode: string;
  structuredCode: string;
  remark: string;
}

const packingSourceColumns: readonly EnterpriseTableColumn<PackingSourceRow>[] =
  [
    { key: "orderItemNo", label: "Order Item No" },
    { key: "productCategory", label: "Product Type" },
    { key: "salesItemName", label: "Sales Item Name" },
    { key: "itemName", label: "Item Name" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfSheets", label: "Sheets" },
    { key: "sqm", label: "SQM" },
    { key: "sqf", label: "SQF" },
    { key: "ratePerSqf", label: "Rate/SQF" },
    { key: "amount", label: "Amount" },
    { key: "baseType", label: "Base Type" },
    { key: "baseName", label: "Base Name" },
    { key: "baseLength", label: "Base Length" },
    { key: "baseWidth", label: "Base Width" },
    { key: "baseThickness", label: "Base Thickness" },
    { key: "designCode", label: "Design Code" },
    { key: "structuredCode", label: "Structured Code" },
    { key: "remark", label: "Remark" },
  ];

const selectedOrderDetailColumns: readonly EnterpriseTableColumn<OrderRecord>[] =
  [
    { key: "orderNo", label: "Order No" },
    { key: "orderDate", label: "Order Date" },
    { key: "deliveryDate", label: "Required Delivery Date" },
    { key: "customerName", label: "Customer Name" },
    { key: "orderType", label: "Order Type" },
    { key: "priority", label: "Priority" },
    { key: "status", label: "Order Status" },
    { key: "remark", label: "Remark" },
    { key: "createdDate", label: "Created Date" },
    { key: "updatedDate", label: "Updated Date" },
    { key: "createdBy", label: "Created By" },
    { key: "updatedBy", label: "Updated By" },
  ];

const packingItemDetailColumns: readonly {
  key: keyof PackingRecord & string;
  label: string;
  minWidth: number;
}[] = [
    { key: "itemName", label: "Item Name", minWidth: 180 },
    { key: "length", label: "Length", minWidth: 120 },
    { key: "width", label: "Width", minWidth: 120 },
    { key: "thickness", label: "Thickness", minWidth: 130 },
    { key: "noOfSheets", label: "No of Sheets", minWidth: 140 },
    { key: "sqm", label: "SQM", minWidth: 120 },
    { key: "sqf", label: "SQF", minWidth: 120 },
    { key: "amount", label: "Amount", minWidth: 140 },
  ];

const rawPackingProductCategoryOptions = ["Veneer", "Plywood", "MDF"] as const;
const finishedPackingProductCategoryOptions = [
  "Marquetry",
  "Fluted",
  "Embossed",
  "Decorative",
] as const;

interface PackingRecordPageProps {
  mode: "add" | "edit" | "view";
}

export function PackingRecordPage({ mode }: PackingRecordPageProps) {
  const packingRecords = usePackingRecords();
  const orderRecords = useOrderRecords();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const paths = getPackingPaths();
  const record = useMemo(
    () => packingRecords.find((entry) => entry.id === id),
    [id, packingRecords],
  );
  const packingSourceRows = useMemo(
    () => buildPackingSourceRows(orderRecords, packingRecords),
    [orderRecords, packingRecords],
  );
  const customerOptions = useMemo(
    () =>
      uniqueStringValues([
        ...orderRecords.map((entry) => entry.customerName),
        ...packingRecords.map((entry) => entry.customerName),
      ]),
    [orderRecords, packingRecords],
  );
  const initialCreatePackingFields = useMemo(
    () =>
      buildCreatePackingFields({
        customerOptions,
        orderNoOptions: [],
      }),
    [customerOptions],
  );
  const initialActiveFields =
    mode === "add" ? initialCreatePackingFields : packingDetailFields;
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildPackingInitialValues(initialActiveFields, record, mode),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [selectedSourceRowIds, setSelectedSourceRowIds] = useState<string[]>([]);
  const [leaveConfirmation, setLeaveConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => undefined,
  });
  const canCreate = canAccessPermission("packing", "create");
  const canEdit = canAccessPermission("packing", "edit");
  const canView = canAccessPermission("packing", "view");
  const canUseMode =
    mode === "add" ? canCreate : mode === "edit" ? canEdit : canView;

  const selectedCustomerName =
    typeof values.customerName === "string" ? values.customerName.trim() : "";
  const selectedOrderNo =
    typeof values.orderNo === "string" ? values.orderNo.trim() : "";
  const selectedOrderRecord = useMemo(
    () => orderRecords.find((ord) => ord.orderNo.trim().toLowerCase() === selectedOrderNo.toLowerCase()),
    [orderRecords, selectedOrderNo],
  );
  const orderNoOptions = useMemo(
    () =>
      uniqueStringValues(
        packingSourceRows.map((row) => row.orderNo),
      ),
    [packingSourceRows],
  );
  const createPackingFields = useMemo<readonly MasterFieldDefinition[]>(
    () =>
      buildCreatePackingFields({
        customerOptions,
        orderNoOptions,
      }),
    [customerOptions, orderNoOptions],
  );
  const activeFields = mode === "add" ? createPackingFields : packingDetailFields;

  useEffect(() => {
    setValues(buildPackingInitialValues(initialActiveFields, record, mode));
  }, [initialActiveFields, mode, record]);

  const showOrderSourceTable =
    mode === "add" &&
    !record &&
    selectedOrderNo.length > 0;
  const filteredSourceRows = useMemo(() => {
    if (!showOrderSourceTable) {
      return [];
    }

    return packingSourceRows.filter((row) => {
      if (selectedOrderNo && row.orderNo !== selectedOrderNo) {
        return false;
      }

      return true;
    });
  }, [
    packingSourceRows,
    selectedOrderNo,
    showOrderSourceTable,
  ]);
  const selectedSourceRows = useMemo(
    () =>
      filteredSourceRows.filter((row) => selectedSourceRowIds.includes(row.id)),
    [filteredSourceRows, selectedSourceRowIds],
  );

  useEffect(() => {
    setSelectedSourceRowIds((current) => {
      const valid = current.filter((rowId) =>
        filteredSourceRows.some((row) => row.id === rowId),
      );
      if (valid.length === 0 && filteredSourceRows.length > 0) {
        return filteredSourceRows.map((r) => r.id);
      }
      return valid;
    });
  }, [filteredSourceRows]);

  if ((mode === "edit" || mode === "view") && !record) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Packing", to: paths.list },
          { label: "Not Found" },
        ]}
        title="Packing"
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested packing record could not be found.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Packing", to: paths.list },
          {
            label:
              mode === "add"
                ? "Create Packing"
                : mode === "edit"
                  ? "Edit Packing"
                  : "View Packing",
          },
        ]}
        title="Packing"
      >
        <MasterSectionCard>
          <Alert severity="warning">
            You do not have permission to access this packing action.
          </Alert>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  const handleRequestBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(paths.list);
    }
  };

  return (
    <MasterPageShell
      backNav={{
        label: "Back to Packing",
        to: paths.list,
        onBack: handleRequestBack,
      }}
      breadcrumbs={[
        { label: "Packing", to: paths.list },
        {
          label:
            mode === "add"
              ? "Issue for Packing"
              : mode === "edit"
                ? "Edit Packing"
                : "View Packing",
        },
      ]}
      title={
        mode === "add"
          ? "Issue for Packing"
          : mode === "edit"
            ? "Edit Packing"
            : "View Packing"
      }
      contentGap={1.5}
    >
      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.25),
          })}
        >
          <FormSectionHeader title="Packing Details" />

          {mode === "add" ? (
            <SizedMasterFormFields
              fields={activeFields}
              onChange={(key, value) =>
                setValues((current) => {
                  const nextValues = {
                    ...current,
                    [key]: value,
                  };

                  if (key === "orderNo" && typeof value === "string") {
                    const selectedOrder = packingSourceRows.find(
                      (row) => row.orderNo === value,
                    );

                    if (selectedOrder) {
                      nextValues.customerName = selectedOrder.customerName;
                    }
                  }

                  return nextValues;
                })
              }
              showRequiredErrors={hasSubmitted}
              sizes={packingCreateFieldSizes}
              values={values}
            />
          ) : (
            <MasterFormFields
              compact
              definition={{
                fields: activeFields,
                gridColumns: 4,
              }}
              onChange={(key, value) =>
                setValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              presentation={mode === "view" ? "details" : "form"}
              readOnly={mode === "view"}
              showRequiredErrors={false}
              values={values}
            />
          )}

          {mode !== "add" && record ? (
            <PackingItemDetailsTable record={record} />
          ) : null}

          {showOrderSourceTable && selectedOrderRecord ? (
            <Stack spacing={1.5} sx={{ mt: 1 }}>
              <FormSectionHeader title="Order Details" />
              <EnterpriseDataTable
                columns={selectedOrderDetailColumns}
                defaultRowsPerPage={5}
                hidePagination
                rows={[selectedOrderRecord]}
              />

              <FormSectionHeader title="Order Items" />
              <EnterpriseDataTable
                columns={packingSourceColumns}
                defaultRowsPerPage={10}
                emptyStateLabel="No packing-eligible order items match."
                hidePagination
                maxBodyHeight={420}
                onSelectionChange={(selectedRows) =>
                  setSelectedSourceRowIds(selectedRows.map((row) => row.id))
                }
                rows={filteredSourceRows}
                selectable
                selectionResetKey={selectedOrderNo}
              />
            </Stack>
          ) : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              gap: theme.spacing(1.25),
              flexWrap: "wrap",
              pt: 0.25,
            })}
          >
            {mode === "view" ? (
              <>
                <Button
                  onClick={handleRequestBack}
                  startIcon={<ChevronLeft size={16} />}
                  sx={recordViewActionButtonSx}
                  variant="outlined"
                >
                  Back
                </Button>

                {canEdit ? (
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
                ) : null}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() =>
                    setLeaveConfirmation({
                      open: true,
                      title: "Cancel Changes",
                      description: "Are you sure you want to cancel? Any unsaved changes will be discarded.",
                      action: () => {
                        if (window.history.length > 1) {
                          navigate(-1);
                        } else {
                          navigate(paths.list);
                        }
                      },
                    })
                  }
                  sx={recordFormActionButtonSx}
                  variant="outlined"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    if (!canUseMode) {
                      return;
                    }

                    setHasSubmitted(true);

                    if (
                      mode === "add" &&
                      hasRequiredFieldErrors(activeFields, values)
                    ) {
                      return;
                    }

                    const rowsToUse =
                      selectedSourceRows.length > 0
                        ? selectedSourceRows
                        : filteredSourceRows;

                    if (
                      mode === "add" &&
                      showOrderSourceTable &&
                      rowsToUse.length === 0
                    ) {
                      return;
                    }

                    if (mode === "add") {
                      const packingDate =
                        values.packingDate instanceof Date
                          ? values.packingDate
                          : null;
                      const remark =
                        typeof values.remark === "string" ? values.remark : "";

                      if (showOrderSourceTable && rowsToUse.length > 0) {
                        rowsToUse.forEach((row) => {
                          const isRaw =
                            normalizePackingOrderType(row.orderType) === "Raw";
                          createPackingEntry(undefined, {
                            amount: row.amount,
                            customerName: selectedCustomerName || row.customerName,
                            issuedFrom: isRaw ? "Warehouse C" : "Factory",
                            itemName: row.itemName,
                            length: row.length,
                            noOfSheets: row.noOfSheets,
                            orderNo: row.orderNo,
                            orderItemNo: row.orderItemNo,
                            orderType: normalizePackingOrderType(row.orderType),
                            productCategory: row.productCategory,
                            remark: isRaw
                              ? `Stock eligible · ${row.orderNo}`
                              : `Factory completed · ${row.orderNo}`,
                            sourceOrderId: row.sourceOrderId,
                            sourceOrderItemId: row.id,
                            sqf: row.sqf,
                            sqm: row.sqm,
                            thickness: row.thickness,
                            width: row.width,
                            ...(typeof values.preparedBy === "string"
                              ? { preparedBy: values.preparedBy }
                              : {}),
                            ...(typeof values.checkedBy === "string"
                              ? { checkedBy: values.checkedBy }
                              : {}),
                          });
                        });
                      } else {
                        const fallbackRow = packingSourceRows.find(
                          (row) => row.orderNo === selectedOrderNo,
                        );
                        createPackingEntry(undefined, {
                          completeImmediately: false,
                          packingDate,
                          remark,
                          customerName: selectedCustomerName || fallbackRow?.customerName || "",
                          orderType: fallbackRow?.orderType || "Raw",
                          orderNo: selectedOrderNo,
                          ...(typeof values.preparedBy === "string"
                            ? { preparedBy: values.preparedBy }
                            : {}),
                          ...(typeof values.checkedBy === "string"
                            ? { checkedBy: values.checkedBy }
                            : {}),
                        });
                      }
                    } else if (record) {
                      updatePackingRecord(
                        record.id,
                        buildPackingUpdatePayload(values),
                      );
                    }

                    const isEdit = mode !== "add" && Boolean(record);
                    const successMsg = isEdit
                      ? "Packing record updated successfully."
                      : "Packing record added to queue successfully.";

                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate(paths.list, {
                        state: {
                          packingFlashMessage: successMsg,
                        },
                      });
                    }
                  }}
                  startIcon={mode === "add" ? undefined : <Save size={15} strokeWidth={2} />}
                  sx={(theme) =>
                    mode === "add"
                      ? formInlineActionButtonSx(theme)
                      : recordFormActionButtonSx
                  }
                  variant="contained"
                >
                  {mode === "add" ? "Add to Packing Queue" : "Save"}
                </Button>
              </>
            )}
          </Box>
        </Stack>
      </MasterSectionCard>

      <ConfirmationDialog
        cancelLabel="Stay on Page"
        confirmLabel="Leave"
        description={leaveConfirmation.description}
        onClose={() => setLeaveConfirmation((c) => ({ ...c, open: false }))}
        onConfirm={() => {
          const act = leaveConfirmation.action;
          setLeaveConfirmation((c) => ({ ...c, open: false }));
          act();
        }}
        open={leaveConfirmation.open}
        title={leaveConfirmation.title}
        tone="default"
      />
    </MasterPageShell>
  );
}

function PackingItemDetailsTable({ record }: { record: PackingRecord }) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1.15),
        })}
      >
        <FormSectionHeader title="Item Details" />

        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            backgroundColor: theme.customTokens.surfaces.surface,
            overflow: "hidden",
            mx: -0.25,
          })}
        >
          <Box
            sx={(theme) => ({
              overflowX: "auto",
              scrollbarColor: `${theme.palette.primary.main} transparent`,
              scrollbarWidth: "thin",
              "&::-webkit-scrollbar": {
                height: 8,
              },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: theme.palette.primary.main,
                borderRadius: theme.customTokens.radius.pill,
              },
              "&::-webkit-scrollbar-track": {
                backgroundColor: "transparent",
              },
            })}
          >
            <Table
              size="small"
              sx={{
                minWidth: 1070,
                tableLayout: "fixed",
              }}
            >
              <TableHead>
                <TableRow>
                  {packingItemDetailColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={(theme) => ({
                        ...transactionTableHeaderCellSx(theme, column.minWidth),
                        minWidth: column.minWidth,
                        width: column.minWidth,
                        borderRight: `1px solid ${theme.customTokens.borders.divider}`,
                      })}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {packingItemDetailColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={(theme) => ({
                        borderRight: `1px solid ${theme.customTokens.borders.default}`,
                        color: theme.palette.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                        px: theme.spacing(1.5),
                        py: theme.spacing(1.25),
                        whiteSpace: "nowrap",
                      })}
                    >
                      {formatPackingDetailValue(record[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

function buildCreatePackingFields({
  customerOptions,
  orderNoOptions,
}: {
  customerOptions: readonly string[];
  orderNoOptions: readonly string[];
}): readonly MasterFieldDefinition[] {
  return [
    {
      key: "packingDate",
      label: "Packing Date",
      required: true,
      type: "date",
    },
    {
      key: "customerName",
      label: "Customer Name",
      options: [...customerOptions],
      required: true,
      type: "select",
    },
    {
      key: "orderNo",
      label: "Order No",
      options: [...orderNoOptions],
      required: true,
      type: "select",
    },
    {
      key: "preparedBy",
      label: "Prepared By",
      type: "text",
    },
    {
      key: "checkedBy",
      label: "Checked By",
      type: "text",
    },
    {
      key: "remark",
      label: "Remarks",
      required: false,
      type: "text",
    },
  ];
}

function buildPackingInitialValues(
  fields: readonly MasterFieldDefinition[],
  record: PackingRecord | undefined,
  mode: "add" | "edit" | "view",
) {
  return fields.reduce<Record<string, MasterFieldValue>>(
    (accumulator, field) => {
      const value = record?.[field.key as keyof PackingRecord];

      if (field.type === "date") {
        if (mode === "add" && field.key === "packingDate") {
          accumulator[field.key] = new Date();
          return accumulator;
        }

        if (
          field.key === "packingDate" &&
          !(value instanceof Date) &&
          record?.createdDate instanceof Date
        ) {
          accumulator[field.key] = record.createdDate;
          return accumulator;
        }

        accumulator[field.key] = value instanceof Date ? value : null;
        return accumulator;
      }

      accumulator[field.key] = typeof value === "string" ? value : "";
      return accumulator;
    },
    {},
  );
}

function buildPackingUpdatePayload(values: Record<string, MasterFieldValue>) {
  return packingDetailFields.reduce<Partial<PackingRecord>>(
    (accumulator, field) => {
      const value = values[field.key];

      if (field.type === "date") {
        accumulator[field.key as keyof PackingRecord] =
          (value instanceof Date ? value : null) as PackingRecord[keyof PackingRecord];
        return accumulator;
      }

      if (typeof value === "string") {
        accumulator[field.key as keyof PackingRecord] =
          value as PackingRecord[keyof PackingRecord];
      }

      return accumulator;
    },
    {},
  );
}

function formatPackingDetailValue(value: PackingRecord[keyof PackingRecord]) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value);
}

function buildPackingSourceRows(
  orderRecords: readonly OrderRecord[],
  packingRecords: readonly PackingRecord[],
) {
  const activePackingKeys = new Set(
    packingRecords
      .filter((record) => record.packingState !== "reverted")
      .map(
        (record) =>
          `${record.orderNo.trim().toLowerCase()}::${record.orderItemNo.trim().toLowerCase()}`,
      ),
  );

  return orderRecords.flatMap<PackingSourceRow>((record) => {
    const status = (record.status || "").trim().toLowerCase();
    if (status === "cancelled" || status === "completed") {
      return [];
    }

    const lineItems = getOrderLineItems(record.id);
    const normalizedLineItems =
      lineItems.length > 0
        ? lineItems
        : [
          {
            id: `${record.id}-line-1`,
            productCategory: record.productCategory,
            finishedType: record.productCategory,
            salesItemName: "",
            itemName: record.itemName,
            subCategory: record.subCategory,
            series: record.series,
            grade: record.grade,
            length: record.length,
            width: record.width,
            thickness: record.thickness,
            quantitySheets: record.quantitySheets,
            sqm: record.sqm,
            totalSqm: record.totalSqm,
            ratePerSqf: "",
            amount: record.amount,
            baseType: "",
            baseName: "",
            baseLength: "",
            baseWidth: "",
            baseThickness: "",
            designCode: "",
            structuredCode: "",
            remark: record.remark,
          },
        ];

    return normalizedLineItems.flatMap((item, index) => {
      const orderItemNo = `OI-${String(index + 1).padStart(3, "0")}`;
      const packingKey = `${record.orderNo.trim().toLowerCase()}::${orderItemNo.toLowerCase()}`;

      if (activePackingKeys.has(packingKey)) {
        return [];
      }

      return [
        {
          id: `${record.id}-${item.id}`,
          sourceOrderId: record.id,
          customerName: record.customerName,
          orderNo: record.orderNo,
          orderItemNo,
          orderType: normalizePackingOrderType(record.orderType),
          productCategory: getPackingSourceProductCategory(record, item, index),
          finishedType: item.finishedType ?? "",
          salesItemName: item.salesItemName || "-",
          itemName: item.itemName,
          groupNo: item.series || "-",
          length: item.length,
          width: item.width,
          thickness: item.thickness,
          noOfSheets: item.quantitySheets,
          sqm: item.sqm,
          sqf: item.totalSqm,
          ratePerSqf: item.ratePerSqf || "-",
          amount: item.amount,
          baseType: item.baseType || "-",
          baseName: item.baseName || "-",
          baseLength: item.baseLength || "-",
          baseWidth: item.baseWidth || "-",
          baseThickness: item.baseThickness || "-",
          designCode: item.designCode || "-",
          structuredCode: item.structuredCode || "-",
          remark: item.remark || "-",
        },
      ];
    });
  });
}

function uniqueStringValues(values: readonly (string | null | undefined)[]) {
  return Array.from(new Set(values.filter(isNonEmptyString)));
}

function getPackingSourceProductCategory(
  record: OrderRecord,
  item: Partial<ReturnType<typeof getOrderLineItems>[number]>,
  index: number,
) {
  const orderVariant = getOrderVariantFromType(record.orderType);

  if (orderVariant === "raw") {
    return normalizeRawPackingProductCategory(
      item.productCategory || record.productCategory,
      index,
    );
  }

  return item.finishedType || record.productCategory;
}

function normalizeRawPackingProductCategory(value: string | undefined, index: number) {
  const normalizedValue = value?.trim().toLowerCase() ?? "";

  if (normalizedValue.includes("plywood")) {
    return "Plywood";
  }

  if (normalizedValue.includes("mdf")) {
    return "MDF";
  }

  if (normalizedValue.includes("veneer")) {
    return "Veneer";
  }

  return rawPackingProductCategoryOptions[
    index % rawPackingProductCategoryOptions.length
  ]!;
}

function isNonEmptyString(
  value: string | null | undefined,
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function matchesPackingOrderType(
  rowOrderType: string,
  selectedOrderType: string,
) {
  if (!selectedOrderType) {
    return false;
  }

  const rowVariant = getOrderVariantFromType(rowOrderType);
  const selectedVariant = getOrderVariantFromType(selectedOrderType);

  if (rowVariant && selectedVariant) {
    return rowVariant === selectedVariant;
  }

  return (
    rowOrderType.trim().toLowerCase() ===
    selectedOrderType.trim().toLowerCase()
  );
}

function normalizePackingOrderType(orderType: string) {
  return getOrderVariantFromType(orderType) === "raw" ? "Raw" : "Finished";
}
