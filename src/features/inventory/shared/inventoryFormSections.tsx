import { useState } from "react";
import type { ReactNode } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  MasterFormFields,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
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
import {
  getWarehouseAAddStockBodyCellSx,
  getWarehouseAAddStockHeaderCellSx,
  getWarehouseAAddStockScrollableTableSx,
  getWarehouseAAddStockTableConfig,
  getWarehouseAAddStockTableMinWidth,
  renderWarehouseAAddStockEditableField,
  type WarehouseAAddStockFieldConfig,
  type WarehouseAAddStockSlug,
} from "./WarehouseAAddStockLineItems";
import { createWarehouseAAddStockHeaderFields } from "./warehouseAAddStockConfig";
import {
  buildInventoryInitialValues,
  type InventoryWarehouseContext,
} from "./inventoryUtils";
import type { InventoryDefinition, InventoryRecord } from "./types";

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

export function getInventoryViewFieldGroups(
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

export function buildWarehouseARecordInitialValues(
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

export function getWarehouseAInwardDetailFields(
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

export function getWarehouseAItemDetailFields(
  slug: WarehouseAAddStockSlug | null,
  fallbackFields: readonly MasterFieldDefinition[],
) {
  if (!slug) {
    return fallbackFields;
  }

  const fields = getWarehouseAAddStockTableConfig(slug);
  return fields.length > 0 ? fields : fallbackFields;
}

export function getWarehouseAInvoiceDetailFields(
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

export function WarehouseARecordDetailTabs({
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

export function WarehouseAInvoiceDetails({
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

export function InventoryItemDetailsTable({
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

export function getInventoryBreadcrumbs({
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

export function getInventoryContextRows<Row extends InventoryRecord>(
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

export function findInventoryContextRow(
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

