import { useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { TextFieldProps } from "@mui/material";

import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../shared/ErpFieldControls";
import { getCompactFieldSx } from "../../inputs/components/inputFieldStyles";
import { FormShowcaseCard } from "./FormShowcaseCard";

type FormLayoutShowcaseProps = {
  description: string;
  maxColumns: 3 | 4 | 5;
  title: string;
  token: string;
};

type FormValues = {
  branchName: string;
  currency: string;
  exchangeRate: string;
  inwardDate: Date | null;
  inwardType: string;
  invoiceNo: string;
  remarks: string;
  shift: string;
  supplierName: string;
  totalHours: string;
  workers: string;
  workingHours: string;
};

type FieldConfig = {
  id: keyof FormValues;
  label: string;
  options?: ReadonlyArray<string>;
  placeholder?: string;
  type?: TextFieldProps["type"];
};

const initialFormValues: FormValues = {
  inwardType: "Purchase",
  inwardDate: new Date(2026, 5, 27),
  supplierName: "Green Ply Veneers LLP",
  branchName: "North Warehouse",
  invoiceNo: "INV-2026-184",
  currency: "INR",
  exchangeRate: "1.00",
  shift: "Morning Shift",
  workers: "18",
  workingHours: "7.5",
  totalHours: "8",
  remarks: "Oak veneer inward for grading and moisture inspection.",
};

const fieldConfig: ReadonlyArray<FieldConfig> = [
  {
    id: "inwardType",
    label: "Inward Type",
    options: ["Purchase", "Import", "Domestic"],
    placeholder: "Select inward type",
  },
  {
    id: "inwardDate",
    label: "Inward Date",
    placeholder: "Select inward date",
    type: "date",
  },
  {
    id: "supplierName",
    label: "Supplier Name",
    placeholder: "Enter supplier name",
  },
  {
    id: "branchName",
    label: "Branch Name",
    options: ["North Warehouse", "Central Yard", "Raw Bundle Rack"],
    placeholder: "Select branch",
  },
  {
    id: "invoiceNo",
    label: "Invoice No.",
    placeholder: "Enter invoice number",
  },
  {
    id: "currency",
    label: "Currency",
    options: ["INR", "USD", "EUR"],
    placeholder: "Select currency",
  },
  {
    id: "exchangeRate",
    label: "Exchange Rate",
    placeholder: "Enter exchange rate",
    type: "number",
  },
  {
    id: "shift",
    label: "Shift",
    options: ["Morning Shift", "General Shift", "Night Shift"],
    placeholder: "Select shift",
  },
  {
    id: "workers",
    label: "Workers",
    placeholder: "Enter worker count",
    type: "number",
  },
  {
    id: "workingHours",
    label: "No. Of Working Hours",
    placeholder: "Enter working hours",
    type: "number",
  },
  {
    id: "totalHours",
    label: "No. Of Total Hours",
    placeholder: "Enter total hours",
    type: "number",
  },
  {
    id: "remarks",
    label: "Remarks",
    placeholder: "Add inward handling remarks",
  },
] as const;

function getResponsiveColumns(maxColumns: 3 | 4 | 5) {
  if (maxColumns === 3) {
    return {
      xs: "1fr",
      md: "repeat(2, minmax(0, 1fr))",
      lg: "repeat(3, minmax(0, 1fr))",
    } as const;
  }

  if (maxColumns === 4) {
    return {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      lg: "repeat(3, minmax(0, 1fr))",
      xl: "repeat(4, minmax(0, 1fr))",
    } as const;
  }

  return {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    md: "repeat(3, minmax(0, 1fr))",
    lg: "repeat(4, minmax(0, 1fr))",
    xl: "repeat(5, minmax(0, 1fr))",
  } as const;
}

export function FormLayoutShowcase({
  description,
  maxColumns,
  title,
  token,
}: FormLayoutShowcaseProps) {
  const [values, setValues] = useState<FormValues>(initialFormValues);
  const [lastAction, setLastAction] = useState("Ready");

  const gridTemplateColumns = useMemo(
    () => getResponsiveColumns(maxColumns),
    [maxColumns],
  );

  const updateField = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((current) => ({
      ...current,
      [field]: value,
    }));
  };

  return (
    <FormShowcaseCard
      title={title}
      description={description}
      token={token}
      footer={
        <Stack
          direction="row"
          sx={(theme) => ({
            justifyContent: "space-between",
            gap: theme.spacing(1.5),
            flexWrap: "wrap",
          })}
        >
          <Typography variant="caption" color="text.secondary">
            Last action: {lastAction}
          </Typography>

          <Typography variant="caption" color="text.secondary">
            Mobile: 1 column, Tablet: 3, Large Tablet: 4, Desktop: 5 where supported.
          </Typography>
        </Stack>
      }
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(2),
            gridTemplateColumns,
          })}
        >
          {fieldConfig.map((field) => {
            const isRemarks = field.id === "remarks";
            const isSelect = Array.isArray(field.options);
            const isDate = field.type === "date";
            const isNumeric = field.type === "number";
            const fieldValue = values[field.id];

            return (
              <Stack
                key={field.id}
                sx={(theme) => ({
                  gap: theme.spacing(0.75),
                  gridColumn: isRemarks ? "1 / -1" : undefined,
                })}
              >
                <Typography variant="subtitle2" color="text.primary">
                  {field.label}
                </Typography>

                {isSelect ? (
                  <ErpSelectField
                    onChange={(nextValue) =>
                      updateField(
                        field.id,
                        nextValue as FormValues[typeof field.id],
                      )
                    }
                    options={field.options ?? []}
                    value={typeof fieldValue === "string" ? fieldValue : ""}
                  />
                ) : isDate ? (
                  <ErpDatePickerField
                    onChange={(nextValue) =>
                      updateField(
                        field.id,
                        nextValue as FormValues[typeof field.id],
                      )
                    }
                    value={fieldValue instanceof Date ? fieldValue : null}
                  />
                ) : (
                  <TextField
                    fullWidth
                    multiline={isRemarks}
                    minRows={isRemarks ? 3 : undefined}
                    size="small"
                    type={field.type}
                    value={typeof fieldValue === "string" ? fieldValue : ""}
                    onChange={(event) =>
                      updateField(
                        field.id,
                        event.target.value as FormValues[typeof field.id],
                      )
                    }
                    inputProps={isNumeric ? { min: 0, step: "0.1" } : undefined}
                    sx={(theme) => getCompactFieldSx(theme)}
                  />
                )}
              </Stack>
            );
          })}
        </Box>

        <Stack
          direction="row"
          sx={(theme) => ({
            justifyContent: "center",
            gap: theme.spacing(1.5),
            flexWrap: "wrap",
          })}
        >
          <Button
            disableElevation
            onClick={() => {
              setValues(initialFormValues);
              setLastAction("Cancel");
            }}
            variant="outlined"
            sx={(theme) => ({
              minWidth: 132,
              borderRadius: `${theme.customTokens.radius.md}px`,
              borderColor: theme.customTokens.borders.default,
              color: theme.customTokens.navigation.activeText,
              "&:hover": {
                borderColor: theme.customTokens.navigation.activeText,
                backgroundColor: theme.customTokens.navigation.hoverBackground,
              },
            })}
          >
            Cancel
          </Button>

          <Button
            disableElevation
            onClick={() => setLastAction("Submit")}
            variant="contained"
            sx={(theme) => ({
              minWidth: 132,
              borderRadius: `${theme.customTokens.radius.md}px`,
              backgroundColor: theme.customTokens.brand.primary,
              color: theme.customTokens.text.inverse,
              "&:hover": {
                backgroundColor: theme.customTokens.brand.secondary,
              },
            })}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </FormShowcaseCard>
  );
}
