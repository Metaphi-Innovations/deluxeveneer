import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Pencil, Save } from "lucide-react";
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
import { OrderStatusChip } from "../../orders/shared/OrderStatusChip";
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
import { transactionTableHeaderCellSx } from "../../shared/listingTableStyles";
import {
  createPackingEntry,
  getPackingPaths,
  isFinishedOrderPackingEligible,
  isRawOrderPackingEligible,
  type PackingRecord,
  updatePackingRecord,
  usePackingRecords,
} from "../shared/packingStore";

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

const ALL_PACKING_SOURCE_COLUMNS: readonly EnterpriseTableColumn<PackingSourceRow>[] =
  [
    { key: "orderItemNo", label: "Order Item No" },
    { key: "productCategory", label: "Product Type" },
    { key: "salesItemName", label: "Sales Item Name" },
    { key: "itemName", label: "Item Name" },
    { key: "groupNo", label: "Group No" },
    { key: "designCode", label: "Design Code" },
    { key: "structuredCode", label: "Structured Code" },
    { key: "length", label: "Length" },
    { key: "width", label: "Width" },
    { key: "thickness", label: "Thickness" },
    { key: "noOfSheets", label: "Leaves / Sheets" },
    { key: "sqm", label: "SQM" },
    { key: "sqf", label: "SQF" },
    { key: "ratePerSqf", label: "Rate" },
    { key: "amount", label: "Amount" },
    { key: "baseType", label: "Base Type" },
    { key: "baseName", label: "Base Name" },
    { key: "baseLength", label: "Base Length" },
    { key: "baseWidth", label: "Base Width" },
    { key: "baseThickness", label: "Base Thickness" },
    { key: "remark", label: "Remark" },
  ];

function getDynamicPackingSourceColumns(
  rows: readonly PackingSourceRow[],
): readonly EnterpriseTableColumn<PackingSourceRow>[] {
  if (rows.length === 0) {
    return ALL_PACKING_SOURCE_COLUMNS;
  }

  // Check if all rows are Veneer/Raw Veneer
  const allVeneer = rows.every((r) => {
    const pt = (r.productCategory || "").trim().toLowerCase();
    return pt.includes("veneer") && !pt.includes("decorative");
  });

  if (allVeneer) {
    return [
      { key: "orderItemNo", label: "Order Item No" },
      { key: "productCategory", label: "Product Type" },
      { key: "salesItemName", label: "Sales Item Name" },
      { key: "itemName", label: "Item Name" },
      { key: "length", label: "Length" },
      { key: "width", label: "Width" },
      { key: "thickness", label: "Thickness" },
      { key: "noOfSheets", label: "No. of Leaves" },
      { key: "sqm", label: "SQM" },
      { key: "ratePerSqf", label: "Rate / SQM" },
      { key: "amount", label: "Amount" },
      { key: "remark", label: "Remark" },
    ];
  }

  // Check if all rows are Decorative
  const allDecorative = rows.every((r) => {
    const pt = (r.productCategory || "").trim().toLowerCase();
    return pt.includes("decorative");
  });

  if (allDecorative) {
    return [
      { key: "orderItemNo", label: "Order Item No" },
      { key: "productCategory", label: "Product Type" },
      { key: "salesItemName", label: "Sales Item Name" },
      { key: "itemName", label: "Item Name" },
      { key: "groupNo", label: "Group No" },
      { key: "length", label: "Length" },
      { key: "width", label: "Width" },
      { key: "thickness", label: "Thickness" },
      { key: "noOfSheets", label: "No. of Sheets" },
      { key: "sqm", label: "SQM" },
      { key: "sqf", label: "SQF" },
      { key: "ratePerSqf", label: "Rate / SQF" },
      { key: "amount", label: "Amount" },
      { key: "baseType", label: "Base Type" },
      { key: "baseName", label: "Base Name" },
      { key: "baseLength", label: "Base Length" },
      { key: "baseWidth", label: "Base Width" },
      { key: "baseThickness", label: "Base Thickness" },
      { key: "remark", label: "Remark" },
    ];
  }

  // Check if all rows are MDF or Plywood
  const allMdfOrPlywood = rows.every((r) => {
    const pt = (r.productCategory || "").trim().toLowerCase();
    return pt.includes("mdf") || pt.includes("plywood");
  });

  if (allMdfOrPlywood) {
    return [
      { key: "orderItemNo", label: "Order Item No" },
      { key: "productCategory", label: "Product Type" },
      { key: "salesItemName", label: "Sales Item Name" },
      { key: "itemName", label: "Item Name" },
      { key: "length", label: "Length" },
      { key: "width", label: "Width" },
      { key: "thickness", label: "Thickness" },
      { key: "noOfSheets", label: "No. of Sheets" },
      { key: "sqm", label: "SQM" },
      { key: "ratePerSqf", label: "Rate" },
      { key: "amount", label: "Amount" },
      { key: "remark", label: "Remark" },
    ];
  }

  // Dynamic filter for other product types: hide columns that are empty / inapplicable across all rows
  return ALL_PACKING_SOURCE_COLUMNS.filter((col) => {
    // Core columns always stay
    if (
      [
        "orderItemNo",
        "productCategory",
        "itemName",
        "length",
        "width",
        "thickness",
        "noOfSheets",
        "amount",
        "remark",
      ].includes(col.key)
    ) {
      return true;
    }

    // Hide column if every row has empty or "-" value for this key
    const hasValue = rows.some((row) => {
      const val = String(row[col.key as keyof PackingSourceRow] ?? "").trim();
      return val !== "" && val !== "-";
    });

    return hasValue;
  });
}

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
        ...packingSourceRows.map((entry) => entry.customerName),
      ]),
    [packingSourceRows],
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
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
      selectedCustomerName
        ? uniqueStringValues(
            packingSourceRows
              .filter((row) => row.customerName === selectedCustomerName)
              .map((row) => row.orderNo),
          )
        : [],
    [packingSourceRows, selectedCustomerName],
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

  const handleCreateFieldChange = (key: string, value: MasterFieldValue) => {
    setErrorMessage("");

    if (key === "customerName" || key === "orderNo") {
      setSelectedSourceRowIds([]);
    }

    setValues((current) => {
      const nextValues = { ...current, [key]: value };

      if (key === "customerName") {
        nextValues.orderNo = "";
      }

      if (key === "orderNo" && typeof value === "string") {
        const selectedOrder = packingSourceRows.find((row) => row.orderNo === value);

        if (selectedOrder) {
          nextValues.customerName = selectedOrder.customerName;
        }
      }

      return nextValues;
    });
  };

  const handleCancelChanges = () => {
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
    });
  };

  const packingSummary = buildPackingSelectionSummary(selectedSourceRows);

  const handleCreatePacking = () => {
    if (!canUseMode || isSubmitting) {
      return;
    }

    setHasSubmitted(true);
    setErrorMessage("");

    if (hasRequiredFieldErrors(activeFields, values)) {
      setErrorMessage("Please fill in all required packing details.");
      return;
    }

    if (!showOrderSourceTable || selectedSourceRows.length === 0) {
      setErrorMessage("Please select at least one item from the order items list to proceed.");
      return;
    }

    setIsSubmitting(true);

    try {
      const packingDate = values.packingDate instanceof Date ? values.packingDate : null;

      selectedSourceRows.forEach((row) => {
        const isRaw = normalizePackingOrderType(row.orderType) === "Raw";
        createPackingEntry(undefined, {
          completeImmediately: true,
          amount: row.amount,
          customerName: selectedCustomerName || row.customerName,
          issuedFrom: isRaw ? "Warehouse C" : "Factory",
          itemName: row.itemName,
          length: row.length,
          noOfSheets: row.noOfSheets,
          orderNo: row.orderNo,
          orderItemNo: row.orderItemNo,
          orderType: normalizePackingOrderType(row.orderType),
          packingDate,
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

      navigate("/packing?tab=done", {
        state: {
          packingFlashMessage: "Packing record marked as Packing Done successfully.",
        },
      });
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Unable to add the selected items to Packing Done. Please try again.");
    }
  };

  if (mode === "add") {
    const selectOrderFields = selectPackingFields(activeFields, ["customerName", "orderNo"]);
    const packingInformationFields = selectPackingFields(activeFields, [
      "packingDate",
      "preparedBy",
      "checkedBy",
      "remark",
    ]);

    return (
      <MasterPageShell
        backNav={{
          label: "Back to Packing",
          to: paths.list,
          onBack: handleRequestBack,
        }}
        breadcrumbs={[
          { label: "Packing", to: paths.list },
          { label: "Issue for Packing" },
        ]}
        contentGap={1.5}
        subtitle="Select order items and prepare them for packing."
        title="Issue for Packing"
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(1.5), width: "100%" })}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <PackingCreateSection title="Select Order">
            <MasterFormFields
              compact
              definition={{ fields: selectOrderFields, gridColumns: 2 }}
              onChange={handleCreateFieldChange}
              showRequiredErrors={hasSubmitted}
              values={values}
            />
          </PackingCreateSection>

          {selectedOrderRecord ? (
            <PackingCreateSection title="Order Overview">
              <PackingOrderOverview order={selectedOrderRecord} />
            </PackingCreateSection>
          ) : null}

          <PackingCreateSection
            endAdornment={
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: "11.5px",
                  fontWeight: 600,
                })}
              >
                {filteredSourceRows.length} total · {selectedSourceRows.length} selected
              </Typography>
            }
            title="Select Order Items"
          >
            {showOrderSourceTable ? (
              <Box sx={{ mx: -1.75, mb: -1.5 }}>
                <EnterpriseDataTable
                  columns={getDynamicPackingSourceColumns(filteredSourceRows)}
                  defaultRowsPerPage={10}
                  dense
                  emptyStateLabel="No packing-eligible order items match."
                  hidePagination={filteredSourceRows.length <= 10}
                  maxBodyHeight={420}
                  onSelectionChange={(selectedRows) =>
                    setSelectedSourceRowIds(selectedRows.map((row) => row.id))
                  }
                  preserveColumnOrder
                  rows={filteredSourceRows}
                  selectable
                  selectedRowIds={selectedSourceRowIds}
                  selectionColumnLabel="Select"
                  selectionResetKey={selectedOrderNo}
                  selectOnRowClick
                  subtleScrollbar
                />
              </Box>
            ) : (
              <PackingEmptyState message="Select a customer and order to view packing-eligible order items." />
            )}
          </PackingCreateSection>

          <PackingCreateSection title="Packing Information">
            <MasterFormFields
              compact
              definition={{ fields: packingInformationFields, gridColumns: 4 }}
              onChange={handleCreateFieldChange}
              showRequiredErrors={hasSubmitted}
              values={values}
            />
          </PackingCreateSection>

          <PackingCreateSection title="Packing Summary">
            <PackingSummary summary={packingSummary} />
          </PackingCreateSection>

          <Box
            sx={(theme) => ({
              alignItems: "center",
              backgroundColor: theme.customTokens.surfaces.surface,
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              display: "flex",
              flexWrap: "wrap",
              gap: theme.spacing(1.25),
              justifyContent: "flex-end",
              px: 1.75,
              py: 1.25,
            })}
          >
            <Button
              disabled={isSubmitting}
              onClick={handleCancelChanges}
              sx={recordFormActionButtonSx}
              type="button"
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleCreatePacking}
              sx={(theme) => formInlineActionButtonSx(theme)}
              type="button"
              variant="contained"
            >
              {isSubmitting ? "Adding..." : "Add to Packing Done"}
            </Button>
          </Box>
        </Stack>

        <ConfirmationDialog
          cancelLabel="Stay on Page"
          confirmLabel="Leave"
          description={leaveConfirmation.description}
          onClose={() => setLeaveConfirmation((current) => ({ ...current, open: false }))}
          onConfirm={() => {
            const action = leaveConfirmation.action;
            setLeaveConfirmation((current) => ({ ...current, open: false }));
            action();
          }}
          open={leaveConfirmation.open}
          title={leaveConfirmation.title}
          tone="default"
        />
      </MasterPageShell>
    );
  }

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
          label: mode === "edit" ? "Edit Packing" : "View Packing",
        },
      ]}
      title={mode === "edit" ? "Edit Packing" : "View Packing"}
      contentGap={1.5}
    >
      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.25),
          })}
        >
          <FormSectionHeader title="Packing Details" />

          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 1 }}>
              {errorMessage}
            </Alert>
          ) : null}

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

          {record ? (
            <PackingItemDetailsTable record={record} />
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
                    if (canUseMode && record) {
                      updatePackingRecord(
                        record.id,
                        buildPackingUpdatePayload(values),
                      );
                    }

                    navigate("/packing?tab=done", {
                      state: {
                        packingFlashMessage: "Packing record updated successfully.",
                      },
                    });
                  }}
                  startIcon={<Save size={15} strokeWidth={2} />}
                  sx={recordFormActionButtonSx}
                  variant="contained"
                >
                  Save
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

function PackingCreateSection({
  children,
  endAdornment,
  title,
}: {
  children: ReactNode;
  endAdornment?: ReactNode;
  title: string;
}) {
  return (
    <Box sx={(theme) => ({ ...formSectionCardSx(theme) })}>
      <FormSectionHeader endAdornment={endAdornment} title={title} />
      <Box sx={{ pt: 1.25 }}>{children}</Box>
    </Box>
  );
}

function PackingOrderOverview({ order }: { order: OrderRecord }) {
  const fields = [
    { label: "Order No.", value: order.orderNo },
    { label: "Order Date", value: formatPackingOverviewValue(order.orderDate) },
    { label: "Required Delivery Date", value: formatPackingOverviewValue(order.deliveryDate) },
    { label: "Customer Name", value: order.customerName },
    { label: "Order Type", value: order.orderType },
    { label: "Priority", value: order.priority },
  ];

  return (
    <Stack spacing={1.25}>
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.25, 1.5),
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
        })}
      >
        {fields.map((field) => (
          <PackingReadOnlyField key={field.label} label={field.label} value={field.value} />
        ))}
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.secondary,
              fontSize: "11.5px",
              fontWeight: 600,
              mb: 0.5,
              textTransform: "uppercase",
            })}
          >
            Order Status
          </Typography>
          <OrderStatusChip status={order.status} />
        </Box>
      </Box>

      {order.remark.trim() ? (
        <PackingReadOnlyField label="Remark" value={order.remark} />
      ) : null}
    </Stack>
  );
}

function PackingReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.secondary,
          fontSize: "11.5px",
          fontWeight: 600,
          mb: 0.4,
          textTransform: "uppercase",
        })}
      >
        {label}
      </Typography>
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.primary,
          fontSize: "14px",
          fontWeight: 600,
          lineHeight: 1.4,
          overflowWrap: "anywhere",
        })}
      >
        {value || "-"}
      </Typography>
    </Box>
  );
}

function PackingEmptyState({ message }: { message: string }) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        backgroundColor: theme.customTokens.surfaces.alt,
        border: `1px dashed ${theme.customTokens.borders.default}`,
        borderRadius: "7px",
        color: theme.customTokens.text.secondary,
        display: "flex",
        fontSize: "13px",
        justifyContent: "center",
        minHeight: 86,
        px: 2,
        textAlign: "center",
      })}
    >
      {message}
    </Box>
  );
}

type PackingSelectionSummary = {
  hasLeaves: boolean;
  hasSheets: boolean;
  hasSqf: boolean;
  hasSqm: boolean;
  selectedItems: number;
  selectedLeaves: number;
  selectedSheets: number;
  selectedSqf: number;
  selectedSqm: number;
};

function PackingSummary({ summary }: { summary: PackingSelectionSummary }) {
  const metrics = [
    { label: "Selected Order Items", value: String(summary.selectedItems), visible: true },
    {
      label: "Selected Leaves",
      value: formatPackingSummaryNumber(summary.selectedLeaves, 0),
      visible: summary.hasLeaves,
    },
    {
      label: "Selected Sheets",
      value: formatPackingSummaryNumber(summary.selectedSheets, 0),
      visible: summary.hasSheets,
    },
    {
      label: "Selected SQM",
      value: formatPackingSummaryNumber(summary.selectedSqm, 3),
      visible: summary.hasSqm,
    },
    {
      label: "Selected SQF",
      value: formatPackingSummaryNumber(summary.selectedSqf, 3),
      visible: summary.hasSqf,
    },
  ].filter((metric) => metric.visible);

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: theme.spacing(1),
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          lg: `repeat(${Math.min(metrics.length, 5)}, minmax(130px, 1fr))`,
        },
      })}
    >
      {metrics.map((metric) => (
        <Box
          key={metric.label}
          sx={(theme) => ({
            backgroundColor: theme.customTokens.surfaces.alt,
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "7px",
            minWidth: 0,
            px: 1.25,
            py: 0.9,
          })}
        >
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.text.secondary,
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            })}
          >
            {metric.label}
          </Typography>
          <Typography
            sx={(theme) => ({
              color: theme.customTokens.brand.primary,
              fontSize: "15px",
              fontWeight: 700,
              mt: 0.35,
            })}
          >
            {metric.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

function buildPackingSelectionSummary(
  rows: readonly PackingSourceRow[],
): PackingSelectionSummary {
  return rows.reduce<PackingSelectionSummary>(
    (summary, row) => {
      const leafBased = isLeafBasedPackingRow(row);
      const quantity = parsePackingNumber(row.noOfSheets);

      return {
        hasLeaves: summary.hasLeaves || leafBased,
        hasSheets: summary.hasSheets || !leafBased,
        hasSqf: summary.hasSqf || hasPackingMetric(row.sqf),
        hasSqm: summary.hasSqm || hasPackingMetric(row.sqm),
        selectedItems: summary.selectedItems + 1,
        selectedLeaves: summary.selectedLeaves + (leafBased ? quantity : 0),
        selectedSheets: summary.selectedSheets + (leafBased ? 0 : quantity),
        selectedSqf: summary.selectedSqf + parsePackingNumber(row.sqf),
        selectedSqm: summary.selectedSqm + parsePackingNumber(row.sqm),
      };
    },
    {
      hasLeaves: false,
      hasSheets: false,
      hasSqf: false,
      hasSqm: false,
      selectedItems: 0,
      selectedLeaves: 0,
      selectedSheets: 0,
      selectedSqf: 0,
      selectedSqm: 0,
    },
  );
}

function isLeafBasedPackingRow(row: PackingSourceRow) {
  const productType = row.productCategory.trim().toLowerCase();
  return productType.includes("veneer") && !productType.includes("decorative");
}

function hasPackingMetric(value: string) {
  const normalized = value.trim();
  return normalized.length > 0 && normalized !== "-";
}

function parsePackingNumber(value: string) {
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatPackingSummaryNumber(value: number, fractionDigits: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits,
  }).format(value);
}

function formatPackingOverviewValue(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  return typeof value === "string" && value.trim() ? value.trim() : "-";
}

function selectPackingFields(
  fields: readonly MasterFieldDefinition[],
  keys: readonly string[],
) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  return keys.flatMap((key) => {
    const field = fieldsByKey.get(key);
    return field ? [field] : [];
  });
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
      rows: 2,
      span: "full",
      type: "textarea",
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

      const productCategory = getPackingSourceProductCategory(record, item, index);
      const leafBased = productCategory.trim().toLowerCase().includes("veneer") &&
        !productCategory.trim().toLowerCase().includes("decorative");

      return [
        {
          id: `${record.id}-${item.id}`,
          sourceOrderId: record.id,
          customerName: record.customerName,
          orderNo: record.orderNo,
          orderItemNo,
          orderType: normalizePackingOrderType(record.orderType),
          productCategory,
          finishedType: item.finishedType ?? "",
          salesItemName: item.salesItemName || "-",
          itemName: item.itemName,
          groupNo: item.series || "-",
          length: item.length,
          width: item.width,
          thickness: item.thickness,
          noOfSheets: leafBased
            ? item.noOfLeaves || item.quantitySheets
            : item.quantitySheets,
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
