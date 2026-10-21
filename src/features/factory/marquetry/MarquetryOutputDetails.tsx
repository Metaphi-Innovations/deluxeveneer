import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { formSectionCardSx, FormSectionHeader } from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import { formatSQF, formatSQM, SQM_TO_SQF } from "../../shared/numberFormat";
import { calculateSlicingSqmValue } from "../shared/slicingAreaCalculation";
import type { FactoryRecord } from "../shared/types";

export type MarquetryOutputDetailsValue = {
  itemName: string;
  itemSubCategory: string;
  length: string;
  width: string;
  thickness: string;
  noOfSheets: string;
  sqm: string;
  sqf: string;
  remark: string;
};

const outputColumns: readonly {
  key: keyof MarquetryOutputDetailsValue;
  label: string;
  minWidth: number;
  readOnly?: boolean;
  required?: boolean;
}[] = [
  { key: "itemName", label: "Item Name", minWidth: 180, required: true },
  { key: "itemSubCategory", label: "Sub Category", minWidth: 170, required: true },
  { key: "length", label: "Length", minWidth: 130, required: true },
  { key: "width", label: "Width", minWidth: 130, required: true },
  { key: "thickness", label: "Thickness", minWidth: 130, required: true },
  { key: "noOfSheets", label: "No. of Sheets", minWidth: 140, required: true },
  { key: "sqm", label: "SQM", minWidth: 120, readOnly: true },
  { key: "sqf", label: "SQF", minWidth: 120, readOnly: true },
  { key: "remark", label: "Remark", minWidth: 190 },
];

export function createEmptyMarquetryOutputDetails(): MarquetryOutputDetailsValue {
  return {
    itemName: "",
    itemSubCategory: "",
    length: "",
    width: "",
    thickness: "",
    noOfSheets: "",
    sqm: "",
    sqf: "",
    remark: "",
  };
}

export function calculateMarquetryOutputDetails(
  value: MarquetryOutputDetailsValue,
): MarquetryOutputDetailsValue {
  const sqm = calculateSlicingSqmValue(value.length, value.width, value.noOfSheets);
  return {
    ...value,
    sqm: sqm > 0 ? formatSQM(sqm) : "",
    sqf: sqm > 0 ? formatSQF(sqm * SQM_TO_SQF) : "",
  };
}

export function readMarquetryOutputDetails(
  row: FactoryRecord | undefined,
): MarquetryOutputDetailsValue {
  const read = (value: unknown) =>
    value === undefined || value === null ? "" : String(value).trim();

  return calculateMarquetryOutputDetails({
    itemName: read(row?.itemName),
    itemSubCategory: read(row?.itemSubCategory ?? row?.subCategory),
    length: read(row?.length),
    width: read(row?.width),
    thickness: read(row?.thickness ?? row?.height),
    noOfSheets: read(row?.noOfSheets),
    sqm: read(row?.sqm),
    sqf: read(row?.sqf),
    remark: read(row?.remark),
  });
}

export function isMarquetryOutputDetailsInvalid(
  value: MarquetryOutputDetailsValue,
) {
  return (
    !value.itemName.trim() ||
    !value.itemSubCategory.trim() ||
    !isPositiveNumber(value.length) ||
    !isPositiveNumber(value.width) ||
    !isPositiveNumber(value.thickness) ||
    !/^\d+$/u.test(value.noOfSheets.trim()) ||
    Number(value.noOfSheets) <= 0
  );
}

export function MarquetryOutputDetails({
  onChange,
  showErrors,
  value,
}: {
  onChange: (value: MarquetryOutputDetailsValue) => void;
  showErrors: boolean;
  value: MarquetryOutputDetailsValue;
}) {
  const update = (key: keyof MarquetryOutputDetailsValue, nextValue: string) => {
    onChange(calculateMarquetryOutputDetails({ ...value, [key]: nextValue }));
  };
  const requiredError = (key: "itemName" | "itemSubCategory" | "length" | "width" | "thickness" | "noOfSheets") =>
    showErrors &&
    (key === "itemName" || key === "itemSubCategory"
      ? !value[key].trim()
      : key === "noOfSheets"
        ? !/^\d+$/u.test(value.noOfSheets.trim()) || Number(value.noOfSheets) <= 0
        : !isPositiveNumber(value[key]));

  return (
    <Stack sx={(theme) => ({ ...formSectionCardSx(theme), gap: theme.spacing(1.5) })}>
      <FormSectionHeader title="Output Details" />
      <Box
        sx={(theme) => ({
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: "8px",
          backgroundColor: theme.customTokens.surfaces.surface,
          overflow: "hidden",
        })}
      >
        <TableContainer sx={(theme) => getScrollableTableSx(theme)}>
          <Table size="medium" sx={{ minWidth: 1310, tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                {outputColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={(theme) => ({
                      ...getHeaderCellSx(theme, column.minWidth),
                      minWidth: column.minWidth,
                    })}
                  >
                    {column.label}{column.required ? " *" : ""}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {outputColumns.map((column) => {
                  const key = column.key;
                  const error = column.required
                    ? requiredError(key as "itemName" | "itemSubCategory" | "length" | "width" | "thickness" | "noOfSheets")
                    : false;
                  return (
                    <TableCell
                      key={key}
                      sx={(theme) => ({
                        ...getBodyCellSx(theme),
                        minWidth: column.minWidth,
                        verticalAlign: "top",
                      })}
                    >
                      {column.readOnly ? (
                        <Typography
                          variant="body2"
                          sx={(theme) => ({
                            alignItems: "center",
                            display: "flex",
                            minHeight: theme.spacing(4.5),
                          })}
                        >
                          {value[key] || "-"}
                        </Typography>
                      ) : (
                        <TextField
                          error={error}
                          fullWidth
                          helperText={error ? `${column.label} is required.` : undefined}
                          onChange={(event) => {
                            const raw = event.target.value;
                            const next =
                              key === "noOfSheets"
                                ? raw.replace(/\D/gu, "")
                                : key === "length" || key === "width" || key === "thickness"
                                  ? sanitizeDecimal(raw)
                                  : raw;
                            update(key, next);
                          }}
                          placeholder={`Enter ${column.label.toLowerCase()}`}
                          size="small"
                          sx={(theme) => getCompactFieldSx(theme, error ? "error" : "default")}
                          value={value[key]}
                        />
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}

function sanitizeDecimal(value: string) {
  const cleaned = value.replace(/[^\d.]/gu, "");
  const [whole = "", ...fraction] = cleaned.split(".");
  return fraction.length > 0 ? `${whole}.${fraction.join("")}` : whole;
}

function isPositiveNumber(value: string) {
  const parsed = Number(value);
  return value.trim() !== "" && Number.isFinite(parsed) && parsed > 0;
}

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
  } as const;
}

function getBodyCellSx(theme: Theme) {
  return {
    ...transactionTableBodyCellSx(theme),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
  } as const;
}

function getScrollableTableSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": { height: 8 },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}
