import { useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  IconButton,
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
import { Pencil, Plus, Save, Trash2 } from "lucide-react";

import { ModuleProcessTabs } from "../../../../../components/navigation/ModuleProcessTabs";
import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../shared/ErpFieldControls";
import { getCompactFieldSx } from "../../inputs/components/inputFieldStyles";
import { FormShowcaseCard } from "../../forms/components/FormShowcaseCard";

type AddPatternTab = "item-details" | "invoice-details";

type HeaderValues = {
  currency: string;
  exchangeRate: string;
  inwardDate: Date | null;
  inwardType: string;
  invoiceNo: string;
  supplierName: string;
};

type InvoiceValues = {
  gstPercentage: string;
  invoiceDate: Date | null;
  invoiceValue: string;
  totalItemAmount: string;
};

type LineItemColumn = {
  key: string;
  label: string;
  minWidth: number;
  options?: readonly string[];
  required?: boolean;
};

type LineItem = {
  id: number;
  values: Record<string, string>;
};

const tabs = [
  { label: "Item Details", value: "item-details" },
  { label: "Invoice Details", value: "invoice-details" },
] as const satisfies readonly { label: string; value: AddPatternTab }[];

const supplierOptions = [
  "Arihant Veneers LLP",
  "Euro Timber Exports",
  "Shree Wood Panels",
] as const;

const currencyOptions = ["INR", "USD", "EUR"] as const;

const itemNameOptions = [
  "Oak Veneer",
  "Walnut Veneer",
  "Teak Veneer",
  "Ash Veneer",
] as const;

const itemSubCategoryOptions = [
  "Quarter Cut",
  "Crown Cut",
  "Natural",
  "Rift Cut",
] as const;

const gstOptions = ["5%", "12%", "18%", "28%"] as const;

const lineItemColumns: readonly LineItemColumn[] = [
  { key: "itemName", label: "Item Name", minWidth: 170, options: itemNameOptions, required: true },
  { key: "itemSubCategory", label: "Item Sub Category", minWidth: 170, options: itemSubCategoryOptions, required: true },
  { key: "logCode", label: "Log Code", minWidth: 140, required: true },
  { key: "bundleNumber", label: "Bundle Number", minWidth: 150, required: true },
  { key: "length", label: "Length", minWidth: 110, required: true },
  { key: "width", label: "Width", minWidth: 110, required: true },
  { key: "thickness", label: "Thickness", minWidth: 110, required: true },
  { key: "noOfLeaves", label: "No of Leaves", minWidth: 130, required: true },
  { key: "totalSqMeter", label: "Total Sq Meter", minWidth: 145, required: true },
  { key: "amount", label: "Amount", minWidth: 130, required: true },
  { key: "remark", label: "Remark", minWidth: 180 },
];

function createEmptyLineItemValues() {
  return lineItemColumns.reduce<Record<string, string>>((accumulator, column) => {
    accumulator[column.key] = "";
    return accumulator;
  }, {});
}

const initialHeaderValues: HeaderValues = {
  currency: "INR",
  exchangeRate: "1.00",
  inwardDate: new Date(2026, 5, 27),
  inwardType: "Purchase",
  invoiceNo: "VB-2431",
  supplierName: "Arihant Veneers LLP",
};

const initialInvoiceValues: InvoiceValues = {
  gstPercentage: "",
  invoiceDate: new Date(2026, 5, 27),
  invoiceValue: "",
  totalItemAmount: "",
};

export function AddPatternShowcase() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState<AddPatternTab>("item-details");
  const [headerValues, setHeaderValues] = useState<HeaderValues>(initialHeaderValues);
  const [invoiceValues, setInvoiceValues] = useState<InvoiceValues>(initialInvoiceValues);
  const [draftValues, setDraftValues] = useState<Record<string, string>>(
    createEmptyLineItemValues(),
  );
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [lastAction, setLastAction] = useState("Ready");
  const nextRowId = useRef(1);

  const tableMinWidth = useMemo(
    () => lineItemColumns.reduce((total, column) => total + column.minWidth, 0) + 96,
    [],
  );

  const updateHeaderField = <K extends keyof HeaderValues>(key: K, value: HeaderValues[K]) => {
    setHeaderValues((current) => ({ ...current, [key]: value }));
  };

  const updateInvoiceField = <K extends keyof InvoiceValues>(key: K, value: InvoiceValues[K]) => {
    setInvoiceValues((current) => ({ ...current, [key]: value }));
  };

  const handleAddLineItem = () => {
    const hasValues = Object.values(draftValues).some((value) => value.trim().length > 0);

    if (!hasValues) {
      setLastAction("Add Item ignored - row is empty");
      return;
    }

    const id = nextRowId.current;
    nextRowId.current += 1;

    setLineItems((current) => [...current, { id, values: { ...draftValues } }]);
    setDraftValues(createEmptyLineItemValues());
    setLastAction("Added line item");
  };

  const handleDeleteLineItem = (id: number) => {
    setLineItems((current) => current.filter((row) => row.id !== id));
    setLastAction("Deleted line item");
  };

  return (
    <FormShowcaseCard
      title="Add / Create Pattern"
      description="The standard inward-entry pattern: header context fields, an Item Details / Invoice Details tab split, a dynamic line-item table, and centered Cancel / Save actions."
      token="theme.forms.dynamicTable + theme.navigation.tabs"
      footer={
        <Typography variant="caption" color="text.secondary">
          Used for Veneer Blocks, Raw Veneer, Plywood, MDF, and Consumables inward entry. Last action: {lastAction}
        </Typography>
      }
    >
      <Stack sx={{ gap: theme.spacing(3) }}>
        <Box
          sx={{
            display: "grid",
            gap: theme.spacing(2),
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          <HeaderField label="Inward Type">
            <TextField
              fullWidth
              size="small"
              value={headerValues.inwardType}
              onChange={(event) => updateHeaderField("inwardType", event.target.value)}
              sx={(fieldTheme) => getCompactFieldSx(fieldTheme)}
            />
          </HeaderField>

          <HeaderField label="Inward Date">
            <ErpDatePickerField
              onChange={(value) => updateHeaderField("inwardDate", value)}
              value={headerValues.inwardDate}
            />
          </HeaderField>

          <HeaderField label="Supplier Name" required>
            <ErpSelectField
              onChange={(value) => updateHeaderField("supplierName", value)}
              options={supplierOptions}
              value={headerValues.supplierName}
            />
          </HeaderField>

          <HeaderField label="Invoice No">
            <TextField
              fullWidth
              size="small"
              value={headerValues.invoiceNo}
              onChange={(event) => updateHeaderField("invoiceNo", event.target.value)}
              sx={(fieldTheme) => getCompactFieldSx(fieldTheme)}
            />
          </HeaderField>

          <HeaderField label="Currency">
            <ErpSelectField
              onChange={(value) => updateHeaderField("currency", value)}
              options={currencyOptions}
              value={headerValues.currency}
            />
          </HeaderField>

          <HeaderField label="Exchange Rate">
            <TextField
              fullWidth
              size="small"
              value={headerValues.exchangeRate}
              onChange={(event) => updateHeaderField("exchangeRate", event.target.value)}
              sx={(fieldTheme) => getCompactFieldSx(fieldTheme)}
            />
          </HeaderField>
        </Box>

        <ModuleProcessTabs onChange={setActiveTab} tabs={tabs} value={activeTab} />

        {activeTab === "item-details" ? (
          <Stack sx={{ gap: theme.spacing(2) }}>
            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              }}
            >
              <Box sx={getScrollableTableSx(theme)}>
                <Table size="small" sx={{ minWidth: tableMinWidth, tableLayout: "auto" }}>
                  <TableHead>
                    <TableRow>
                      {lineItemColumns.map((column) => (
                        <TableCell key={column.key} sx={getHeaderCellSx(theme, column.minWidth)}>
                          {column.label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>

                  <TableBody>
                    <TableRow>
                      {lineItemColumns.map((column) => (
                        <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                          {column.options ? (
                            <ErpSelectField
                              onChange={(value) =>
                                setDraftValues((current) => ({ ...current, [column.key]: value }))
                              }
                              options={column.options}
                              size="dense"
                              value={draftValues[column.key] ?? ""}
                            />
                          ) : (
                            <TextField
                              fullWidth
                              size="small"
                              value={draftValues[column.key] ?? ""}
                              onChange={(event) =>
                                setDraftValues((current) => ({
                                  ...current,
                                  [column.key]: event.target.value,
                                }))
                              }
                              sx={(fieldTheme) => getCompactFieldSx(fieldTheme)}
                            />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                disableElevation
                onClick={handleAddLineItem}
                startIcon={<Plus size={14} />}
                variant="contained"
                sx={getAddItemButtonSx(theme)}
              >
                Add Item
              </Button>
            </Box>

            {lineItems.length > 0 ? (
              <Box
                sx={{
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  overflow: "hidden",
                }}
              >
                <Box sx={getScrollableTableSx(theme)}>
                  <Table size="small" sx={{ minWidth: tableMinWidth + 120, tableLayout: "auto" }}>
                    <TableHead>
                      <TableRow>
                        {lineItemColumns.map((column) => (
                          <TableCell key={column.key} sx={getHeaderCellSx(theme, column.minWidth)}>
                            {column.label}
                          </TableCell>
                        ))}
                        <TableCell sx={getHeaderCellSx(theme, 96)}>Actions</TableCell>
                      </TableRow>
                    </TableHead>

                    <TableBody>
                      {lineItems.map((row, index) => (
                        <TableRow
                          key={row.id}
                          sx={{
                            "&:nth-of-type(even)": {
                              backgroundColor: theme.customTokens.surfaces.alt,
                            },
                          }}
                        >
                          {lineItemColumns.map((column) => (
                            <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                              {row.values[column.key]?.trim() || "-"}
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={getBodyCellSx(theme)}>
                            <Stack direction="row" justifyContent="center" spacing={0.5}>
                              <IconButton
                                aria-label={`Edit row ${index + 1}`}
                                size="small"
                                sx={getRowActionButtonSx(theme)}
                              >
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton
                                aria-label={`Delete row ${index + 1}`}
                                onClick={() => handleDeleteLineItem(row.id)}
                                size="small"
                                sx={getRowActionButtonSx(theme)}
                              >
                                <Trash2 size={14} />
                              </IconButton>
                            </Stack>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            ) : null}
          </Stack>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
            }}
          >
            <HeaderField label="Invoice Date" required>
              <ErpDatePickerField
                onChange={(value) => updateInvoiceField("invoiceDate", value)}
                value={invoiceValues.invoiceDate}
              />
            </HeaderField>

            <HeaderField label="Total Item Amount">
              <TextField
                fullWidth
                size="small"
                value={invoiceValues.totalItemAmount || lineItems.reduce(
                  (total, row) => total + (Number(row.values.amount?.replace(/,/g, "")) || 0),
                  0,
                ).toFixed(2)}
                onChange={(event) => updateInvoiceField("totalItemAmount", event.target.value)}
                sx={(fieldTheme) => getCompactFieldSx(fieldTheme)}
              />
            </HeaderField>

            <HeaderField label="GST Percentage" required>
              <ErpSelectField
                onChange={(value) => updateInvoiceField("gstPercentage", value)}
                options={gstOptions}
                value={invoiceValues.gstPercentage}
              />
            </HeaderField>

            <HeaderField label="Invoice Value">
              <TextField
                fullWidth
                size="small"
                value={invoiceValues.invoiceValue}
                slotProps={{ input: { readOnly: true } }}
                sx={(fieldTheme) => getCompactFieldSx(fieldTheme, "readOnly")}
                InputProps={{
                  endAdornment: (
                    <Button
                      disableElevation
                      onClick={() => {
                        const total = Number(invoiceValues.totalItemAmount || 0);
                        const gst = Number(invoiceValues.gstPercentage.replace("%", "")) || 0;
                        const value = total + total * (gst / 100);
                        updateInvoiceField("invoiceValue", value.toFixed(2));
                        setLastAction("Calculated invoice value");
                      }}
                      variant="contained"
                      sx={{ minWidth: theme.spacing(8), my: theme.spacing(0.375) }}
                    >
                      Calculate
                    </Button>
                  ),
                }}
              />
            </HeaderField>
          </Box>
        )}

        <Box sx={{ display: "flex", justifyContent: "center", gap: theme.spacing(1.5) }}>
          <Button
            variant="outlined"
            onClick={() => setLastAction("Cancel")}
            sx={getFormActionButtonSx(theme)}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<Save size={16} />}
            onClick={() => setLastAction("Save")}
            sx={getFormActionButtonSx(theme)}
          >
            Save
          </Button>
        </Box>
      </Stack>
    </FormShowcaseCard>
  );
}

function HeaderField({
  children,
  label,
  required = false,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <Stack sx={(theme) => ({ gap: theme.spacing(0.75) })}>
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>
      {children}
    </Stack>
  );
}

function getScrollableTableSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": { height: 8 },
    "&::-webkit-scrollbar-track": { backgroundColor: theme.customTokens.surfaces.alt },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.customTokens.brand.primary,
      borderRadius: 999,
    },
  } as const;
}

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    minWidth,
    backgroundColor: theme.customTokens.brand.primary,
    borderBottom: `1px solid ${theme.customTokens.brand.primaryScale[800]}`,
    color: theme.customTokens.text.inverse,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    py: theme.spacing(1.5),
    whiteSpace: "nowrap",
  } as const;
}

function getBodyCellSx(theme: Theme) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    py: theme.spacing(1),
    whiteSpace: "nowrap",
  } as const;
}

function getRowActionButtonSx(theme: Theme) {
  return {
    color: theme.customTokens.navigation.activeText,
    "&:hover": { backgroundColor: theme.customTokens.navigation.hoverBackground },
  } as const;
}

function getAddItemButtonSx(theme: Theme) {
  return {
    minHeight: 34,
    px: theme.spacing(2),
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.customTokens.brand.primary,
    color: theme.customTokens.text.inverse,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    boxShadow: "none",
    "&:hover": { backgroundColor: theme.customTokens.brand.primaryScale[800], boxShadow: "none" },
  } as const;
}

function getFormActionButtonSx(theme: Theme) {
  return {
    minWidth: 132,
    borderRadius: `${theme.customTokens.radius.md}px`,
  } as const;
}
