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
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";

import { ErpSelectField } from "../../../shared/ErpFieldControls";
import { getCompactFieldSx } from "../../inputs/components/inputFieldStyles";
import { FormShowcaseCard } from "./FormShowcaseCard";

type LineItem = {
  id: number;
  invoiceDiameter: string;
  invoiceLength: string;
  itemName: string;
  itemSubCategory: string;
  logFormula: string;
  logNo: string;
  supplierItemName: string;
  supplierLogNo: string;
  timberColor: string;
};

const supplierItemOptions = [
  "Oak Veneer",
  "Walnut Veneer",
  "Teak Veneer",
  "Ash Veneer",
] as const;

const itemSubCategoryOptions = [
  "Quarter Cut",
  "Crown Cut",
  "Natural",
  "Engineered",
] as const;

const itemNameOptions = [
  "Face Veneer",
  "Core Veneer",
  "Decorative Veneer",
  "Backing Veneer",
] as const;

const timberColorOptions = [
  "Natural",
  "Smoked Brown",
  "Golden Oak",
  "Dark Walnut",
] as const;

const logFormulaOptions = [
  "Formula A",
  "Formula B",
  "Formula C",
] as const;

const initialRows: LineItem[] = [
  {
    id: 1,
    supplierItemName: "Oak Veneer",
    supplierLogNo: "SUP-LOG-101",
    itemSubCategory: "Quarter Cut",
    itemName: "Face Veneer",
    timberColor: "Natural",
    logNo: "LOG-2026-011",
    logFormula: "Formula A",
    invoiceLength: "2.45",
    invoiceDiameter: "0.62",
  },
  {
    id: 2,
    supplierItemName: "Walnut Veneer",
    supplierLogNo: "SUP-LOG-134",
    itemSubCategory: "Crown Cut",
    itemName: "Decorative Veneer",
    timberColor: "Dark Walnut",
    logNo: "LOG-2026-028",
    logFormula: "Formula B",
    invoiceLength: "2.80",
    invoiceDiameter: "0.74",
  },
  {
    id: 3,
    supplierItemName: "Teak Veneer",
    supplierLogNo: "SUP-LOG-142",
    itemSubCategory: "Natural",
    itemName: "Core Veneer",
    timberColor: "Golden Oak",
    logNo: "LOG-2026-039",
    logFormula: "Formula A",
    invoiceLength: "2.10",
    invoiceDiameter: "0.58",
  },
] as const;

const columnMeta = [
  { key: "supplierItemName", label: "Supplier Item Name", minWidth: 180 },
  { key: "supplierLogNo", label: "Supplier Log No.", minWidth: 160 },
  { key: "itemSubCategory", label: "Item Sub Category", minWidth: 180 },
  { key: "itemName", label: "Item Name", minWidth: 160 },
  { key: "timberColor", label: "Timber Color", minWidth: 150 },
  { key: "logNo", label: "Log No.", minWidth: 150 },
  { key: "logFormula", label: "Log Formula", minWidth: 150 },
  { key: "invoiceLength", label: "Invoice Length", minWidth: 150 },
  { key: "invoiceDiameter", label: "Invoice Diameter", minWidth: 170 },
  { key: "invoiceCmt", label: "Invoice CMT", minWidth: 140 },
  { key: "action", label: "Action", minWidth: 92 },
] as const;

function createNewRow(id: number): LineItem {
  return {
    id,
    supplierItemName: "Ash Veneer",
    supplierLogNo: `SUP-LOG-${100 + id}`,
    itemSubCategory: "Natural",
    itemName: "Face Veneer",
    timberColor: "Natural",
    logNo: `LOG-2026-${String(id).padStart(3, "0")}`,
    logFormula: "Formula A",
    invoiceLength: "2.25",
    invoiceDiameter: "0.60",
  };
}

function calculateCmt(row: LineItem) {
  const length = Number(row.invoiceLength) || 0;
  const diameter = Number(row.invoiceDiameter) || 0;

  return ((length * diameter) / 2).toFixed(2);
}

export function DynamicFormTableShowcase() {
  const [rows, setRows] = useState<LineItem[]>([...initialRows]);
  const [lastAction, setLastAction] = useState("Table ready");
  const nextRowId = useRef(initialRows.length + 1);

  const rowCount = rows.length;
  const featureSummary = useMemo(
    () =>
      [
        "Horizontal scrolling",
        "Hidden scrollbar",
        "Dynamic column width",
        "Sticky header",
        "Inline editing",
        "Row delete",
        "Add new row button",
      ].join(" • "),
    [],
  );

  const addRow = () => {
    const id = nextRowId.current;
    nextRowId.current += 1;

    setRows((current) => [...current, createNewRow(id)]);
    setLastAction("Added new item");
  };

  const updateRow = (
    rowId: number,
    field: Exclude<keyof LineItem, "id">,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId
          ? {
              ...row,
              [field]: value,
            }
          : row,
      ),
    );
    setLastAction(`Updated ${field}`);
  };

  const removeRow = (rowId: number) => {
    setRows((current) => current.filter((row) => row.id !== rowId));
    setLastAction("Deleted row");
  };

  return (
    <FormShowcaseCard
      title="Dynamic Form Table"
      description="Reusable inline form table for line-item entry in purchase orders, inward forms, production entries, packing sheets, and dispatch records."
      token="theme.forms.dynamicTable"
      footer={
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(0.75),
          })}
        >
          <Typography variant="caption" color="text.secondary">
            Features: {featureSummary}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Last action: {lastAction}
          </Typography>
        </Stack>
      }
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
            })}
          >
            <Typography variant="subtitle1" color="text.primary">
              Inline Editing Table
            </Typography>

            <Button
              disableElevation
              onClick={addRow}
              startIcon={<Plus size={16} />}
              variant="contained"
              sx={(theme) => ({
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.brand.primary,
                color: theme.customTokens.text.inverse,
                "&:hover": {
                  backgroundColor: theme.customTokens.brand.secondary,
                },
              })}
            >
              Add New Item
            </Button>
          </Box>

          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.surface,
              overflow: "hidden",
            })}
          >
            <Box
              sx={(theme) => ({
                overflowX: "auto",
                overflowY: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              })}
            >
              <Table
                stickyHeader
                size="small"
                sx={{
                  minWidth: 1708,
                  tableLayout: "auto",
                }}
              >
                <TableHead>
                  <TableRow>
                    {columnMeta.map((column) => (
                      <TableCell
                        key={column.key}
                        sx={(theme) => ({
                          minWidth: column.minWidth,
                          backgroundColor: theme.customTokens.brand.primary,
                          color: theme.customTokens.text.inverse,
                          borderBottom: `1px solid ${theme.customTokens.brand.primaryScale[800]}`,
                          whiteSpace: "nowrap",
                          fontSize: theme.typography.caption.fontSize,
                          fontWeight: 700,
                          py: theme.spacing(1.5),
                          ...(column.key === "action"
                            ? {
                                position: "sticky" as const,
                                right: 0,
                                zIndex: 3,
                                boxShadow: `-1px 0 0 ${theme.customTokens.brand.primaryScale[800]}`,
                              }
                            : {}),
                        })}
                      >
                        {column.label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>

                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={(theme) => ({
                        "&:nth-of-type(even)": {
                          backgroundColor: theme.customTokens.surfaces.alt,
                        },
                      })}
                    >
                      <TableCell>
                        <ErpSelectField
                          onChange={(nextValue) =>
                            updateRow(row.id, "supplierItemName", nextValue)
                          }
                          options={supplierItemOptions}
                          value={row.supplierItemName}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.supplierLogNo}
                          onChange={(event) =>
                            updateRow(row.id, "supplierLogNo", event.target.value)
                          }
                          sx={(theme) => getCompactFieldSx(theme)}
                        />
                      </TableCell>

                      <TableCell>
                        <ErpSelectField
                          onChange={(nextValue) =>
                            updateRow(row.id, "itemSubCategory", nextValue)
                          }
                          options={itemSubCategoryOptions}
                          value={row.itemSubCategory}
                        />
                      </TableCell>

                      <TableCell>
                        <ErpSelectField
                          onChange={(nextValue) =>
                            updateRow(row.id, "itemName", nextValue)
                          }
                          options={itemNameOptions}
                          value={row.itemName}
                        />
                      </TableCell>

                      <TableCell>
                        <ErpSelectField
                          onChange={(nextValue) =>
                            updateRow(row.id, "timberColor", nextValue)
                          }
                          options={timberColorOptions}
                          value={row.timberColor}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={row.logNo}
                          onChange={(event) =>
                            updateRow(row.id, "logNo", event.target.value)
                          }
                          sx={(theme) => getCompactFieldSx(theme)}
                        />
                      </TableCell>

                      <TableCell>
                        <ErpSelectField
                          onChange={(nextValue) =>
                            updateRow(row.id, "logFormula", nextValue)
                          }
                          options={logFormulaOptions}
                          value={row.logFormula}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={row.invoiceLength}
                          onChange={(event) =>
                            updateRow(row.id, "invoiceLength", event.target.value)
                          }
                          inputProps={{ min: 0, step: "0.01" }}
                          sx={(theme) => getCompactFieldSx(theme)}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          type="number"
                          value={row.invoiceDiameter}
                          onChange={(event) =>
                            updateRow(row.id, "invoiceDiameter", event.target.value)
                          }
                          inputProps={{ min: 0, step: "0.01" }}
                          sx={(theme) => getCompactFieldSx(theme)}
                        />
                      </TableCell>

                      <TableCell>
                        <TextField
                          fullWidth
                          size="small"
                          value={calculateCmt(row)}
                          InputProps={{ readOnly: true }}
                          sx={(theme) => getCompactFieldSx(theme, "readOnly")}
                        />
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={(theme) => ({
                          position: "sticky",
                          right: 0,
                          zIndex: 1,
                          minWidth: 92,
                          backgroundColor:
                            index % 2 === 0
                              ? theme.customTokens.surfaces.surface
                              : theme.customTokens.surfaces.alt,
                          boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
                        })}
                      >
                        <IconButton
                          aria-label={`Delete row ${index + 1}`}
                          onClick={() => removeRow(row.id)}
                          sx={(theme) => ({
                            color: theme.customTokens.navigation.activeText,
                            "&:hover": {
                              backgroundColor: theme.customTokens.navigation.hoverBackground,
                            },
                          })}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>

          <Typography variant="caption" color="text.secondary">
            {rowCount} editable rows in preview.
          </Typography>
        </Stack>

        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
            })}
          >
            <Typography variant="subtitle1" color="text.primary">
              Empty State Table
            </Typography>

            <Button
              disableElevation
              onClick={() => setLastAction("Empty state add flow")}
              startIcon={<Plus size={16} />}
              variant="contained"
              sx={(theme) => ({
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.brand.primary,
                color: theme.customTokens.text.inverse,
                "&:hover": {
                  backgroundColor: theme.customTokens.brand.secondary,
                },
              })}
            >
              Add New Item
            </Button>
          </Box>

          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.surfaces.surface,
              overflow: "hidden",
            })}
          >
            <Box
              sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: "repeat(12, minmax(120px, 1fr))",
                borderBottom: `1px solid ${theme.customTokens.borders.default}`,
                backgroundColor: theme.customTokens.brand.primary,
                color: theme.customTokens.text.inverse,
                overflowX: "auto",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                "&::-webkit-scrollbar": {
                  display: "none",
                },
              })}
            >
              {columnMeta.map((column) => (
                <Box
                  key={column.key}
                  sx={(theme) => ({
                    minWidth: column.minWidth,
                    px: theme.spacing(2),
                    py: theme.spacing(1.5),
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                  })}
                >
                  {column.label}
                </Box>
              ))}
            </Box>

            <Box
              sx={(theme) => ({
                minHeight: 200,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                px: theme.spacing(3),
                textAlign: "center",
              })}
            >
              <Typography variant="body1" color="text.secondary">
                No records found
              </Typography>
            </Box>
          </Box>
        </Stack>
      </Stack>
    </FormShowcaseCard>
  );
}
