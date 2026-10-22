import type { ReactNode } from "react";
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

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { plainFormSectionHeadingSx } from "../../shared/formSectionStyles";
import { listingTableContainerSx } from "../../shared/listingTableStyles";
import {
  pressingCompactBodyCellSx,
  pressingCompactHeaderCellSx,
  pressingCompactInputSx,
  pressingDetailsTableSx,
  pressingCellWidth,
  pressingTableScrollSx,
  pressingValueInputWidth,
} from "./pressingCompactTable";
import {
  calculatePressingUsedArea,
  sanitizePressingInteger,
} from "./pressingQuantity";

export type PressingProcessValues = {
  cutColor: string;
  grade: string;
  itemSubCategory: string;
  length: string;
  noOfSheets: string;
  outputItemName: string;
  pressingDate: string;
  remark: string;
  thickness: string;
  width: string;
};

const headerLabels = [
  "Pressing Date",
  "Output Item Name",
  "Item Sub Category",
  "Length",
  "Width",
  "Thickness",
  "No of Sheets",
  "SQM",
  "SQF",
  "Cut Color",
  "Grade",
  "Remark",
] as const;

export function PressingProcessFields({
  onChange,
  outputError,
  showErrors,
  values,
}: {
  onChange: (patch: Partial<PressingProcessValues>) => void;
  outputError: string;
  showErrors: boolean;
  values: PressingProcessValues;
}) {
  const area = calculatePressingUsedArea(
    values.length,
    values.width,
    values.noOfSheets,
  );
  const inputWidths = [
    200,
    pressingValueInputWidth(values.outputItemName, 160, 240),
    pressingValueInputWidth(values.itemSubCategory, 128, 200),
    pressingValueInputWidth(values.length, 112, 160),
    pressingValueInputWidth(values.width, 112, 160),
    pressingValueInputWidth(values.thickness, 112, 160),
    pressingValueInputWidth(values.noOfSheets, 96, 130),
    pressingValueInputWidth(area.sqm, 84, 120),
    pressingValueInputWidth(area.sqf, 88, 120),
    pressingValueInputWidth(values.cutColor, 160, 280),
    pressingValueInputWidth(values.grade, 64, 110),
    pressingValueInputWidth(values.remark, 140, 220),
  ];
  const columnWidths = inputWidths.map(pressingCellWidth);
  const dateError =
    showErrors && !values.pressingDate ? "Pressing date is required." : "";
  const itemNameError =
    showErrors && !values.outputItemName.trim()
      ? "Output item name is required."
      : "";
  const sheetsError =
    outputError ||
    (showErrors && !values.noOfSheets.trim()
      ? "No of sheets must be greater than 0."
      : "");

  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(1.5),
      })}
    >
      <Typography component="h2" sx={plainFormSectionHeadingSx}>
        Output Details
      </Typography>
      <Box sx={(theme) => listingTableContainerSx(theme)}>
        <TableContainer sx={(theme) => pressingTableScrollSx(theme)}>
          <Table stickyHeader sx={pressingDetailsTableSx}>
            <TableHead>
              <TableRow>
                {headerLabels.map((label, index) => (
                  <TableCell
                    key={label}
                    sx={(theme) =>
                      pressingCompactHeaderCellSx(theme, columnWidths[index])
                    }
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow
                sx={(theme) => ({
                  "& td": {
                    backgroundColor: theme.customTokens.surfaces.surface,
                  },
                })}
              >
                <DetailCell error={dateError} minWidth={columnWidths[0]}>
                  <DetailInput
                    error={dateError}
                    onChange={(value) => onChange({ pressingDate: value })}
                    type="date"
                    value={values.pressingDate}
                    width={inputWidths[0] ?? 200}
                  />
                </DetailCell>
                <DetailCell error={itemNameError} minWidth={columnWidths[1]}>
                  <DetailInput
                    error={itemNameError}
                    onChange={(value) => onChange({ outputItemName: value })}
                    value={values.outputItemName}
                    width={inputWidths[1] ?? 160}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[2]}>
                  <DetailInput
                    onChange={(value) => onChange({ itemSubCategory: value })}
                    value={values.itemSubCategory}
                    width={inputWidths[2] ?? 128}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[3]}>
                  <DetailInput
                    onChange={(value) => onChange({ length: value })}
                    value={values.length}
                    width={inputWidths[3] ?? 112}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[4]}>
                  <DetailInput
                    onChange={(value) => onChange({ width: value })}
                    value={values.width}
                    width={inputWidths[4] ?? 112}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[5]}>
                  <DetailInput
                    onChange={(value) => onChange({ thickness: value })}
                    value={values.thickness}
                    width={inputWidths[5] ?? 112}
                  />
                </DetailCell>
                <DetailCell error={sheetsError} minWidth={columnWidths[6]}>
                  <DetailInput
                    error={sheetsError}
                    onChange={(value) =>
                      onChange({ noOfSheets: sanitizePressingInteger(value) })
                    }
                    value={values.noOfSheets}
                    width={inputWidths[6] ?? 96}
                  />
                </DetailCell>
                <TableCell
                  sx={(theme) =>
                    pressingCompactBodyCellSx(theme, columnWidths[7])
                  }
                >
                  {area.sqm || "-"}
                </TableCell>
                <TableCell
                  sx={(theme) =>
                    pressingCompactBodyCellSx(theme, columnWidths[8])
                  }
                >
                  {area.sqf || "-"}
                </TableCell>
                <DetailCell minWidth={columnWidths[9]}>
                  <DetailInput
                    onChange={(value) => onChange({ cutColor: value })}
                    value={values.cutColor}
                    width={inputWidths[9] ?? 160}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[10]}>
                  <DetailInput
                    onChange={(value) => onChange({ grade: value })}
                    value={values.grade}
                    width={inputWidths[10] ?? 64}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[11]}>
                  <DetailInput
                    onChange={(value) => onChange({ remark: value })}
                    value={values.remark}
                    width={inputWidths[11] ?? 140}
                  />
                </DetailCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}

function DetailCell({
  children,
  error = "",
  minWidth,
}: {
  children: ReactNode;
  error?: string;
  minWidth?: number | undefined;
}) {
  return (
    <TableCell
      sx={(theme) => ({
        ...pressingCompactBodyCellSx(theme, minWidth),
        verticalAlign: "top",
        whiteSpace: "normal",
      })}
    >
      {children}
      {error ? (
        <Box
          component="span"
          sx={(theme) => ({
            color: theme.palette.error.main,
            display: "block",
            fontSize: "0.75rem",
            lineHeight: 1.25,
            maxWidth: minWidth ? Math.max(minWidth - 16, 96) : 160,
            mt: 0.5,
            overflowWrap: "anywhere",
            whiteSpace: "normal",
          })}
        >
          {error}
        </Box>
      ) : null}
    </TableCell>
  );
}

function DetailInput({
  error = "",
  onChange,
  type = "text",
  value,
  width,
}: {
  error?: string;
  onChange: (value: string) => void;
  type?: "date" | "text";
  value: string;
  width: number;
}) {
  return (
    <TextField
      error={Boolean(error)}
      onChange={(event) => onChange(event.target.value)}
      size="small"
      sx={(theme) => ({
        ...getCompactFieldSx(theme, error ? "error" : "default"),
        ...pressingCompactInputSx(width),
      })}
      type={type}
      value={value}
    />
  );
}
