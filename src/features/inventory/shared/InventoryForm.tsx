import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
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
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  MasterFormFields,
  MasterSectionCard,
  hasFormFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import {
  canAccessPermission,
  getWarehousePermissionKey,
} from "../../permissions";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  warehouseAInventoryConfigs,
  warehouseBInventoryConfigs,
  warehouseBRawVeneerTabConfigs,
  warehouseCInventoryConfigs,
  warehouseRawVeneerTabConfigs,
  type WarehouseAInventorySlug,
  type WarehouseCInventorySlug,
  type WarehouseInventorySlug,
} from "../../warehouses/shared/warehouseTableData";
import { InventoryPageShell } from "./InventoryPageShell";
import {
  getWarehouseAAddStockBodyCellSx,
  getWarehouseAAddStockHeaderCellSx,
  getWarehouseAAddStockScrollableTableSx,
  getWarehouseAAddStockTableConfig,
  getWarehouseAAddStockTableMinWidth,
  isWarehouseAAddStockSlug,
  renderWarehouseAAddStockEditableField,
  type WarehouseAAddStockFieldConfig,
  type WarehouseAAddStockSlug,
} from "./WarehouseAAddStockLineItems";
import {
  WarehouseAAddStockWorkspace,
  type WarehouseAAddStockWorkspaceHandle,
} from "./WarehouseAAddStockWorkspace";
import {
  buildWarehouseAAddStockInitialValues,
  createWarehouseAAddStockHeaderFields,
  isInrCurrency,
} from "./warehouseAAddStockConfig";
import { saveWarehouseAInwardItems } from "../../warehouses/shared/warehouseAInwardStore";
import {
  buildInventoryInitialValues,
  getInventoryPageTitle,
  getInventoryProcessTab,
  getInventoryPaths,
  getInventoryWarehouseContext,
  getWarehouseInventoryListPath,
  getWarehouseLabel,
  getWarehouseRootPath,
  type InventoryWarehouseContext,
} from "./inventoryUtils";
import type { InventoryDefinition, InventoryPageMode, InventoryRecord } from "./types";

interface InventoryFormProps<Row extends InventoryRecord> {
  definition: InventoryDefinition<Row>;
  mode: Exclude<InventoryPageMode, "list">;
}

type InventoryRecordDetailTab = "item-details" | "invoice-details";
type InventoryItemDetailTableField =
  | MasterFieldDefinition
  | WarehouseAAddStockFieldConfig;

const warehouseARecordDetailTabs = [
  { label: "Item Details", value: "item-details" },
  { label: "Invoice Details", value: "invoice-details" },
] as const satisfies readonly {
  label: string;
  value: InventoryRecordDetailTab;
}[];

export function InventoryForm<Row extends InventoryRecord>({
  definition,
  mode,
}: InventoryFormProps<Row>) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeWarehouse = getInventoryWarehouseContext(
    searchParams.get("warehouse"),
  );
  const permissionKey = getWarehousePermissionKey(activeWarehouse);
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const canUseMode =
    (mode === "add" && canCreate) ||
    (mode === "edit" && canEdit) ||
    (mode === "view" && canView);
  const activeProcessTab = getInventoryProcessTab(searchParams.get("tab"));
  const paths = getInventoryPaths(
    definition.slug,
    activeProcessTab,
    activeWarehouse,
  );
  const returnToPath = searchParams.get("returnTo");
  const listPath = returnToPath?.startsWith("/") ? returnToPath : paths.list;
  const warehouseLabel = getWarehouseLabel(activeWarehouse);
  const warehouseRootPath = getWarehouseRootPath(activeWarehouse);
  const inventoryListPath = getWarehouseInventoryListPath(
    activeWarehouse,
    definition.slug,
    activeProcessTab,
  );
  const inventoryRows = getInventoryContextRows(definition, activeWarehouse);

  const row =
    mode === "add"
      ? undefined
      : findInventoryContextRow(inventoryRows, params.id);
  const warehouseAAddStockSlug =
    mode === "add" &&
    activeWarehouse === "warehouse-a" &&
    isWarehouseAAddStockSlug(definition.slug)
      ? definition.slug
      : null;
  const warehouseRecordDetailSlug =
    (activeWarehouse === "warehouse-a" ||
      activeWarehouse === "warehouse-b" ||
      activeWarehouse === "warehouse-c") &&
    isWarehouseAAddStockSlug(definition.slug)
      ? definition.slug
      : null;
  const closeInventoryForm = () => {
    navigate(listPath, { replace: true, flushSync: true });
  };

  const baseFields =
    mode === "add"
      ? definition.formFields
      : mode === "edit"
        ? definition.editFields ?? definition.viewFields
        : definition.viewFields;
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    warehouseAAddStockSlug
      ? buildWarehouseAAddStockInitialValues(warehouseAAddStockSlug)
      : buildWarehouseARecordInitialValues(
          baseFields,
          row,
          warehouseRecordDetailSlug,
        ),
  );
  const fields = warehouseAAddStockSlug
    ? createWarehouseAAddStockHeaderFields(
        typeof values.currency === "string" ? values.currency : "INR",
      )
    : baseFields;
  const shouldSplitInventoryDetails = mode === "view" || mode === "edit";
  const viewFieldGroups = shouldSplitInventoryDetails
    ? getInventoryViewFieldGroups(
        mode === "view" || mode === "edit" ? baseFields : fields,
      )
    : null;
  const warehouseAInvoiceFields =
    shouldSplitInventoryDetails && warehouseRecordDetailSlug
      ? getWarehouseAInvoiceDetailFields(baseFields, row)
      : [];
  const warehouseAInwardFields =
    shouldSplitInventoryDetails &&
    warehouseRecordDetailSlug &&
    viewFieldGroups
      ? getWarehouseAInwardDetailFields(viewFieldGroups.commonFields, row)
      : [];
  const warehouseAItemFields =
    shouldSplitInventoryDetails &&
    warehouseRecordDetailSlug &&
    viewFieldGroups
      ? getWarehouseAItemDetailFields(
          warehouseRecordDetailSlug,
          viewFieldGroups.itemFields,
        )
      : [];

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const warehouseAWorkspaceRef = useRef<WarehouseAAddStockWorkspaceHandle>(null);

  useEffect(() => {
    if (warehouseAAddStockSlug) {
      setValues(buildWarehouseAAddStockInitialValues(warehouseAAddStockSlug));
      return;
    }

    setValues(
      buildWarehouseARecordInitialValues(
        baseFields,
        row,
        warehouseRecordDetailSlug,
      ),
    );
  }, [baseFields, row, warehouseAAddStockSlug, warehouseRecordDetailSlug]);

  if ((mode === "edit" || mode === "view") && !row) {
    return (
      <InventoryPageShell
        breadcrumbs={getInventoryBreadcrumbs({
          currentLabel: "Not Found",
          definitionTitle: definition.title,
          inventoryListPath,
          warehouseLabel,
          warehouseRootPath,
        })}
        title={definition.title}
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested inventory record could not be found in the mock dataset.
          </Typography>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <InventoryPageShell
        breadcrumbs={getInventoryBreadcrumbs({
          currentLabel: mode === "add" ? "Add Stock" : mode === "edit" ? "Edit" : "View",
          definitionTitle: definition.title,
          inventoryListPath,
          warehouseLabel,
          warehouseRootPath,
        })}
        title={getInventoryPageTitle(definition, mode)}
      >
        <Alert severity="warning">
          You do not have permission to {mode} this inventory record.
        </Alert>
      </InventoryPageShell>
    );
  }

  const primaryLabel = warehouseAAddStockSlug ? "Save Inward" : "Save";
  const pageTitle = warehouseAAddStockSlug
    ? "Add Stock"
    : getInventoryPageTitle(definition, mode);
  const pageSubtitle = warehouseAAddStockSlug
    ? "Record supplier invoice and inward stock details."
    : undefined;
  const warehouseInventoryBreadcrumbs = warehouseAAddStockSlug
    ? [
        { label: "Warehouses" },
        { label: warehouseLabel, to: warehouseRootPath },
        { label: "Add Stock" },
      ]
    : getInventoryBreadcrumbs({
        currentLabel:
          mode === "add" ? "Add Stock" : mode === "edit" ? "Edit" : "View",
        definitionTitle: definition.title,
        inventoryListPath,
        warehouseLabel,
        warehouseRootPath,
      });

  const handleHeaderFieldChange = (key: string, value: MasterFieldValue) => {
    setValues((current) => {
      const nextValues = {
        ...current,
        [key]: value,
      };

      if (key === "currency" && isInrCurrency(value)) {
        nextValues.exchangeRate = "";
      }

      return nextValues;
    });
  };

  return (
    <InventoryPageShell
      breadcrumbs={warehouseInventoryBreadcrumbs}
      subtitle={pageSubtitle}
      title={pageTitle}
    >
      <MasterSectionCard>
        <Box
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(warehouseAAddStockSlug ? 1.5 : 1.75),
            width: "100%",
          })}
        >
          {shouldSplitInventoryDetails && viewFieldGroups ? (
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              {warehouseRecordDetailSlug ? (
                <Stack spacing={1.15}>
                  <FormSectionHeader title="Inward Details" />
                  <MasterFormFields
                    key={`${definition.slug}-${mode}-${row?.id ?? "new"}-${activeWarehouse}-inward`}
                    compact
                    definition={{
                      gridColumns: 5,
                      fields: warehouseAInwardFields,
                    }}
                    onChange={(key, value) =>
                      setValues((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                    presentation="form"
                    readOnly={mode === "view"}
                    values={values}
                  />
                </Stack>
              ) : (
                <MasterFormFields
                  key={`${definition.slug}-${mode}-${row?.id ?? "new"}-common`}
                  compact
                  definition={{
                    gridColumns: 4,
                    fields: viewFieldGroups.commonFields,
                  }}
                  onChange={(key, value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  presentation={mode === "view" ? "details" : "form"}
                  readOnly={mode === "view"}
                  values={values}
                />
              )}

              {warehouseRecordDetailSlug &&
              warehouseAInvoiceFields.length > 0 ? (
                <WarehouseARecordDetailTabs
                  invoiceDetails={
                    <WarehouseAInvoiceDetails
                      fields={warehouseAInvoiceFields}
                      onChange={(key, value) =>
                        setValues((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                      readOnly={mode === "view"}
                      showTitle={false}
                      values={values}
                    />
                  }
                  itemDetails={
                    <InventoryItemDetailsTable
                      fields={warehouseAItemFields}
                      onChange={(key, value) =>
                        setValues((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                      readOnly={mode === "view"}
                      values={values}
                    />
                  }
                />
              ) : (
                <InventoryItemDetailsTable
                  fields={viewFieldGroups.itemFields}
                  onChange={(key, value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  readOnly={mode === "view"}
                  values={values}
                />
              )}
            </Stack>
          ) : (
            <>
              {warehouseAAddStockSlug ? (
                <Stack spacing={1.15}>
                  <FormSectionHeader title="Inward Details" />
                  <MasterFormFields
                    key={`${definition.slug}-${mode}-${warehouseAAddStockSlug}`}
                    compact
                    definition={{
                      gridColumns: 5,
                      fields,
                    }}
                    onChange={handleHeaderFieldChange}
                    showRequiredErrors={hasSubmitted}
                    values={values}
                  />
                </Stack>
              ) : (
                <MasterFormFields
                  key={`${definition.slug}-${mode}-${row?.id ?? "new"}`}
                  compact
                  definition={{
                    gridColumns: 4,
                    fields,
                  }}
                  onChange={(key, value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  presentation={mode === "view" ? "details" : "form"}
                  readOnly={mode === "view"}
                  showRequiredErrors={mode !== "view" && hasSubmitted}
                  values={values}
                />
              )}
            </>
          )}

          {warehouseAAddStockSlug ? (
            <WarehouseAAddStockWorkspace
              invoiceDate={
                values.inwardDate instanceof Date ? values.inwardDate : null
              }
              ref={warehouseAWorkspaceRef}
              slug={warehouseAAddStockSlug}
              supplierName={
                typeof values.supplierName === "string"
                  ? values.supplierName
                  : ""
              }
            />
          ) : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: warehouseAAddStockSlug ? "flex-end" : "center",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
              pt: theme.spacing(0.5),
              borderTop: warehouseAAddStockSlug
                ? `1px solid ${theme.customTokens.borders.divider}`
                : undefined,
            })}
          >
            {mode === "view" ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeft size={16} />}
                  onClick={closeInventoryForm}
                  sx={recordViewActionButtonSx}
                >
                  Back
                </Button>

                {row && canEdit ? (
                  <Button
                    variant="contained"
                    startIcon={<Pencil size={16} />}
                    onClick={() => navigate(paths.edit(row.id))}
                    sx={recordViewActionButtonSx}
                  >
                    Edit
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={closeInventoryForm}
                  sx={recordFormActionButtonSx}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  startIcon={<Save size={16} />}
                  sx={recordFormActionButtonSx}
                  onClick={() => {
                    setHasSubmitted(true);

                    const workspaceIsValid = warehouseAAddStockSlug
                      ? warehouseAWorkspaceRef.current?.validate() ?? true
                      : true;

                    const hasBaseFieldErrors = hasFormFieldErrors(
                      fields,
                      values,
                    );

                    if (hasBaseFieldErrors || !workspaceIsValid) {
                      return;
                    }

                    if (
                      warehouseAAddStockSlug &&
                      warehouseAAddStockSlug !== "consumables"
                    ) {
                      const lineItems =
                        warehouseAWorkspaceRef.current?.getLineItems() ?? [];

                      saveWarehouseAInwardItems({
                        header: {
                          currency:
                            typeof values.currency === "string"
                              ? values.currency
                              : "INR",
                          attachment:
                            typeof values.attachment === "string"
                              ? values.attachment
                              : values.attachment &&
                                  typeof values.attachment === "object" &&
                                  "name" in values.attachment
                                ? values.attachment.name
                                : "",
                          eta:
                            values.eta instanceof Date ? values.eta : null,
                          etd:
                            values.etd instanceof Date ? values.etd : null,
                          invoiceNo:
                            typeof values.invoiceNo === "string"
                              ? values.invoiceNo
                              : "",
                          inwardDate:
                            values.inwardDate instanceof Date
                              ? values.inwardDate
                              : new Date(),
                          inwardType:
                            typeof values.inwardType === "string"
                              ? values.inwardType
                              : "",
                          mode:
                            typeof values.mode === "string" ? values.mode : "",
                          supplierName:
                            typeof values.supplierName === "string"
                              ? values.supplierName
                              : "",
                        },
                        lineItems,
                        slug: warehouseAAddStockSlug,
                      });
                    }

                    closeInventoryForm();
                  }}
                >
                  {primaryLabel}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </MasterSectionCard>
    </InventoryPageShell>
  );
}

const inventoryItemDetailFieldKeys = new Set([
  "amount",
  "availableNoOfSheets",
  "availableQuantity",
  "availableSqf",
  "availableSqm",
  "availableUnits",
  "avSheets",
  "avSqf",
  "avSqm",
  "bundleNumber",
  "category",
  "color",
  "consumables",
  "cutName",
  "expenseAmount",
  "grade",
  "itemName",
  "itemSrNo",
  "length",
  "logCode",
  "mdfSrNo",
  "mdfType",
  "noOfLeaves",
  "noOfLeavesSheets",
  "palletNo",
  "palletNumber",
  "plywoodType",
  "processColor",
  "processName",
  "quantity",
  "referenceSrNo",
  "remark",
  "seriesName",
  "subCategory",
  "supplierItemName",
  "thickness",
  "timberCode",
  "timberColor",
  "totalNoOfSheets",
  "totalSqf",
  "totalSqm",
  "totalUnits",
  "unitName",
  "veneerSrNo",
  "width",
]);

const warehouseAInvoiceDetailFieldKeys = new Set([
  "additionalCharges",
  "amount",
  "currency",
  "expenseAmount",
  "inwardDate",
  "invoiceNo",
  "remark",
]);

const warehouseAInwardDetailFieldOrder = [
  "inwardDate",
  "supplierName",
  "invoiceNo",
  "currency",
  "mode",
  "eta",
  "etd",
  "attachment",
  "exchangeRate",
];

const warehouseAAdditionalChargesField: MasterFieldDefinition = {
  key: "additionalCharges",
  label: "Additional Charges",
  placeholder: "Enter Additional Charges",
  type: "text",
};

function getInventoryViewFieldGroups(
  fields: readonly MasterFieldDefinition[],
) {
  const commonFields = fields.filter(
    (field) => !inventoryItemDetailFieldKeys.has(field.key),
  );
  const itemFields = fields.filter((field) =>
    inventoryItemDetailFieldKeys.has(field.key),
  );

  return {
    commonFields: commonFields.length > 0 ? commonFields : fields,
    itemFields,
  };
}

function buildWarehouseARecordInitialValues(
  fields: readonly MasterFieldDefinition[],
  row: InventoryRecord | undefined,
  slug: WarehouseAAddStockSlug | null,
) {
  const initialValues = buildInventoryInitialValues(fields, row);

  if (!slug || !row) {
    return initialValues;
  }

  return {
    ...initialValues,
    ...buildWarehouseARecordAliases(row),
  };
}

function buildWarehouseARecordAliases(row: InventoryRecord) {
  const getValue = (...keys: string[]) => {
    for (const key of keys) {
      const value = row[key];

      if (value instanceof Date) {
        return new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(value);
      }

      if (typeof value === "string" && value.length > 0) {
        return value;
      }
    }

    return "";
  };

  return {
    additionalCharges: getValue("additionalCharges", "expenseAmount"),
    amount: getValue("amount"),
    bundleNumber: getValue("bundleNumber"),
    cgst: getValue("cgst"),
    color: getValue("color", "processColor", "timberColor"),
    currency: getValue("currency"),
    exchangeRate: getValue("exchangeRate"),
    gstPercentage: getValue("gstPercentage", "gst"),
    hsn: getValue("hsn", "hsnCode"),
    igst: getValue("igst"),
    invoiceNo: getValue("invoiceNo"),
    itemName: getValue("itemName"),
    itemSubCategory: getValue("itemSubCategory", "subCategory"),
    logCode: getValue("logCode"),
    mdfType: getValue("mdfType"),
    noOfLeaves: getValue("noOfLeaves", "noOfLeavesSheets"),
    noOfSheets: getValue("noOfSheets", "totalNoOfSheets"),
    palletNo: getValue("palletNo", "palletNumber"),
    plywoodType: getValue("plywoodType"),
    productAmount: getValue("productAmount", "amount"),
    remark: getValue("remark", "remarks"),
    remarks: getValue("remark", "remarks"),
    sgst: getValue("sgst"),
    sheets: getValue("sheets", "totalNoOfSheets"),
    supplierName: getValue("supplierName"),
    thickness: getValue("thickness"),
    totalAmount: getValue("totalAmount"),
    totalSqMeter: getValue("totalSqMeter", "totalSqm"),
    totalSqm: getValue("totalSqm", "totalSqMeter"),
    width: getValue("width"),
    length: getValue("length"),
  } satisfies Record<string, MasterFieldValue>;
}

function getWarehouseAInwardDetailFields(
  fields: readonly MasterFieldDefinition[],
  row?: InventoryRecord,
) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const generatedFields = createWarehouseAAddStockHeaderFields(
    typeof row?.currency === "string" ? row.currency : "INR",
  );

  if (!fieldsByKey.has("inwardSrNo") && typeof row?.inwardSrNo === "string") {
    fieldsByKey.set("inwardSrNo", {
      key: "inwardSrNo",
      label: "Inward Sr No",
      readOnly: true,
      type: "text",
    });
  }

  generatedFields.forEach((field) => {
    if (!fieldsByKey.has(field.key)) {
      fieldsByKey.set(field.key, field);
    }
  });

  return warehouseAInwardDetailFieldOrder
    .map((key) => fieldsByKey.get(key))
    .filter((field): field is MasterFieldDefinition => Boolean(field));
}

function getWarehouseAItemDetailFields(
  slug: WarehouseAAddStockSlug | null,
  fallbackFields: readonly MasterFieldDefinition[],
) {
  if (!slug) {
    return fallbackFields;
  }

  const fields = getWarehouseAAddStockTableConfig(slug);
  return fields.length > 0 ? fields : fallbackFields;
}

function getWarehouseAInvoiceDetailFields(
  fields: readonly MasterFieldDefinition[],
  row?: InventoryRecord,
) {
  const fieldsByKey = new Map(fields.map((field) => [field.key, field]));
  const generatedFields = createWarehouseAAddStockHeaderFields(
    typeof row?.currency === "string" ? row.currency : "INR",
  );

  generatedFields.forEach((field) => {
    if (!fieldsByKey.has(field.key)) {
      fieldsByKey.set(field.key, field);
    }
  });

  const invoiceFields = Array.from(fieldsByKey.values()).filter((field) =>
    warehouseAInvoiceDetailFieldKeys.has(field.key),
  );

  if (invoiceFields.some((field) => field.key === "additionalCharges")) {
    return invoiceFields;
  }

  const remarkIndex = invoiceFields.findIndex((field) => field.key === "remark");
  const nextFields = [...invoiceFields];

  if (remarkIndex >= 0) {
    nextFields.splice(remarkIndex, 0, warehouseAAdditionalChargesField);
    return nextFields;
  }

  return [...nextFields, warehouseAAdditionalChargesField];
}

function WarehouseARecordDetailTabs({
  invoiceDetails,
  itemDetails,
}: {
  invoiceDetails: ReactNode;
  itemDetails: ReactNode;
}) {
  const [activeTab, setActiveTab] =
    useState<InventoryRecordDetailTab>("item-details");

  return (
    <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
      <ModuleProcessTabs
        onChange={setActiveTab}
        tabs={warehouseARecordDetailTabs}
        value={activeTab}
      />

      <Box sx={{ display: activeTab === "item-details" ? "block" : "none" }}>
        {itemDetails}
      </Box>

      <Box sx={{ display: activeTab === "invoice-details" ? "block" : "none" }}>
        {invoiceDetails}
      </Box>
    </Stack>
  );
}

function WarehouseAInvoiceDetails({
  fields,
  onChange,
  readOnly,
  showTitle = true,
  values,
}: {
  fields: readonly MasterFieldDefinition[];
  onChange: (key: string, value: MasterFieldValue) => void;
  readOnly: boolean;
  showTitle?: boolean;
  values: Record<string, MasterFieldValue>;
}) {
  if (fields.length === 0) {
    return null;
  }

  return (
    <Box>
      <MasterFormFields
        definition={{
          gridColumns: 4,
          fields,
        }}
        onChange={onChange}
        readOnly={readOnly}
        values={values}
      />
    </Box>
  );
}

function InventoryItemDetailsTable({
  fields,
  onChange,
  readOnly,
  showTitle = true,
  values,
}: {
  fields: readonly InventoryItemDetailTableField[];
  onChange: (key: string, value: MasterFieldValue) => void;
  readOnly: boolean;
  showTitle?: boolean;
  values: Record<string, MasterFieldValue>;
}) {
  if (fields.length === 0) {
    return null;
  }

  const usesAddStockTable = fields.some(isWarehouseAAddStockTableField);
  const tableMinWidth = usesAddStockTable
    ? getWarehouseAAddStockTableMinWidth(
        fields.filter(isWarehouseAAddStockTableField),
        false,
      )
    : Math.max(fields.length * 150, 720);

  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      <Stack spacing={1.15}>
        {showTitle ? <FormSectionHeader title="Item Details" /> : null}

        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: usesAddStockTable
              ? `${theme.customTokens.radius.md}px`
              : "8px",
            backgroundColor: theme.customTokens.surfaces.surface,
            overflow: "hidden",
          })}
        >
        <Box
          sx={(theme) =>
            usesAddStockTable
              ? getWarehouseAAddStockScrollableTableSx(theme)
              : {
                  overflowX: "auto",
                  scrollbarColor: `${theme.palette.primary.main} ${theme.customTokens.surfaces.alt}`,
                  scrollbarWidth: "thin",
                  "&::-webkit-scrollbar": {
                    height: 8,
                  },
                  "&::-webkit-scrollbar-track": {
                    backgroundColor: theme.customTokens.surfaces.alt,
                    borderRadius: theme.customTokens.radius.pill,
                  },
                  "&::-webkit-scrollbar-thumb": {
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: theme.customTokens.radius.pill,
                  },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: theme.palette.primary.dark,
                  },
                }
          }
        >
          <Table
            size="small"
            sx={{
              minWidth: tableMinWidth,
              tableLayout: usesAddStockTable ? "fixed" : "auto",
            }}
          >
            <TableHead>
              <TableRow>
                {fields.map((field) => (
                  <TableCell
                    key={field.key}
                    sx={(theme) =>
                      getInventoryItemDetailHeaderCellSx(theme, field)
                    }
                  >
                    {field.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              <TableRow>
                {fields.map((field) => (
                  <TableCell
                    key={field.key}
                    sx={(theme) =>
                      getInventoryItemDetailBodyCellSx(theme, field)
                    }
                  >
                    {readOnly || isInventoryItemDetailFieldReadOnly(field) ? (
                      formatInventoryViewValue(values[field.key])
                    ) : (
                      <InventoryItemDetailsField
                        field={field}
                        onChange={(value) => onChange(field.key, value)}
                        value={values[field.key]}
                      />
                    )}
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

function isWarehouseAAddStockTableField(
  field: InventoryItemDetailTableField,
): field is WarehouseAAddStockFieldConfig {
  return "minWidth" in field;
}

function isInventoryItemDetailFieldReadOnly(
  field: InventoryItemDetailTableField,
) {
  return "readOnly" in field && field.readOnly === true;
}

function getInventoryItemDetailHeaderCellSx(
  theme: Theme,
  field: InventoryItemDetailTableField,
) {
  if (isWarehouseAAddStockTableField(field)) {
    return getWarehouseAAddStockHeaderCellSx(theme, field.minWidth);
  }

  return {
    backgroundColor: theme.palette.primary.main,
    borderRight: `1px solid ${theme.palette.primary.dark}`,
    color: theme.palette.primary.contrastText,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    px: theme.spacing(1.5),
    py: theme.spacing(1),
    whiteSpace: "nowrap",
    "&:last-of-type": {
      borderRight: 0,
    },
  } as const;
}

function getInventoryItemDetailBodyCellSx(
  theme: Theme,
  field: InventoryItemDetailTableField,
) {
  if (isWarehouseAAddStockTableField(field)) {
    return getWarehouseAAddStockBodyCellSx(theme);
  }

  return {
    borderRight: `1px solid ${theme.customTokens.borders.default}`,
    color: theme.palette.text.primary,
    fontSize: theme.typography.body2.fontSize,
    px: theme.spacing(1.5),
    py: theme.spacing(1.25),
    whiteSpace: "nowrap",
    "&:last-of-type": {
      borderRight: 0,
    },
  } as const;
}

function InventoryItemDetailsField({
  field,
  onChange,
  value,
}: {
  field: InventoryItemDetailTableField;
  onChange: (value: MasterFieldValue) => void;
  value: MasterFieldValue | undefined;
}) {
  const theme = useTheme();

  if (isWarehouseAAddStockTableField(field)) {
    return (
      <Box sx={{ minWidth: field.minWidth - 16 }}>
        {renderWarehouseAAddStockEditableField({
          column: field,
          onChange: (nextValue) => onChange(nextValue),
          theme,
          value: getInventoryInputValue(value),
        })}
      </Box>
    );
  }

  return (
    <InventoryItemDetailsInput
      field={field}
      onChange={onChange}
      value={value}
    />
  );
}

function InventoryItemDetailsInput({
  field,
  onChange,
  value,
}: {
  field: MasterFieldDefinition;
  onChange: (value: MasterFieldValue) => void;
  value: MasterFieldValue | undefined;
}) {
  const fieldValue = getInventoryInputValue(value);

  if (field.type === "select" && field.options && field.options.length > 0) {
    return (
      <ErpSelectField
        value={fieldValue}
        onChange={onChange}
        options={field.options}
        size="dense"
      />
    );
  }

  return (
    <TextField
      fullWidth
      multiline={field.type === "textarea"}
      size="small"
      value={fieldValue}
      onChange={(event) => onChange(event.target.value)}
      sx={inventoryItemDetailsInputSx}
    />
  );
}

function getInventoryInputValue(value: MasterFieldValue | undefined) {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return "";
}

const inventoryItemDetailsInputSx = (theme: Theme) => ({
  minWidth: 150,
  "& .MuiInputBase-root": {
    minHeight: 34,
    borderRadius: `${theme.customTokens.radius.sm}px`,
    fontSize: theme.typography.caption.fontSize,
  },
  "& .MuiInputBase-input": {
    px: theme.spacing(1),
    py: theme.spacing(0.75),
  },
  "& .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.customTokens.borders.default,
  },
  "&:hover .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
  "& .Mui-focused .MuiOutlinedInput-notchedOutline": {
    borderColor: theme.palette.primary.main,
  },
});

function formatInventoryViewValue(value: MasterFieldValue | undefined) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "object" && value !== null && "name" in value) {
    return value.name || "-";
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return value;
  }

  return "-";
}

function getInventoryBreadcrumbs({
  currentLabel,
  definitionTitle,
  inventoryListPath,
  warehouseLabel,
  warehouseRootPath,
}: {
  currentLabel: string;
  definitionTitle: string;
  inventoryListPath: string;
  warehouseLabel: string;
  warehouseRootPath: string;
}) {
  return [
    { label: warehouseLabel, to: warehouseRootPath },
    { label: definitionTitle, to: inventoryListPath },
    { label: currentLabel },
  ];
}

function getInventoryContextRows<Row extends InventoryRecord>(
  definition: InventoryDefinition<Row>,
  warehouse: InventoryWarehouseContext,
): readonly InventoryRecord[] {
  const rows: InventoryRecord[] = [...definition.rows];
  const pushRows = (sourceRows?: readonly InventoryRecord[]) => {
    if (!sourceRows) {
      return;
    }

    rows.push(...sourceRows);
  };

  if (warehouse === "warehouse-a" && definition.slug in warehouseAInventoryConfigs) {
    pushRows(
      warehouseAInventoryConfigs[definition.slug as WarehouseAInventorySlug].rows,
    );
  }

  if (warehouse === "warehouse-b") {
    if (definition.slug in warehouseBInventoryConfigs) {
      pushRows(
        warehouseBInventoryConfigs[definition.slug as WarehouseInventorySlug].rows,
      );
    }

    if (definition.slug in warehouseAInventoryConfigs) {
      pushRows(
        warehouseAInventoryConfigs[definition.slug as WarehouseAInventorySlug].rows,
      );
    }

    if (definition.slug === "raw-veneer") {
      Object.values(warehouseBRawVeneerTabConfigs).forEach((config) =>
        pushRows(config.rows),
      );
      Object.values(warehouseRawVeneerTabConfigs).forEach((config) =>
        pushRows(config.rows),
      );
    }
  }

  if (warehouse === "warehouse-c" && definition.slug in warehouseCInventoryConfigs) {
    pushRows(
      warehouseCInventoryConfigs[definition.slug as WarehouseCInventorySlug].rows,
    );
  }

  return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

function findInventoryContextRow(
  rows: readonly InventoryRecord[],
  recordId: string | undefined,
) {
  if (!recordId) {
    return undefined;
  }

  return rows.find((row) => {
    if (row.id === recordId) {
      return true;
    }

    const inventoryRecordId = row["inventoryRecordId"];

    if (typeof inventoryRecordId !== "string") {
      return false;
    }

    return (
      inventoryRecordId === recordId ||
      inventoryRecordId.replace(/-production$/, "") === recordId
    );
  });
}
