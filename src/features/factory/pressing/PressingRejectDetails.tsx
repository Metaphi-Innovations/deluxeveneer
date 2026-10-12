import type { ReactNode } from "react";
import { Box, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField } from "@mui/material";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { FormSectionHeader, formSectionCardSx } from "../../shared/formSectionStyles";
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
import { calculatePressingUsedArea, sanitizePressingDecimal } from "./pressingQuantity";

export type PressingRejectValues = {
  itemName: string;
  length: string;
  quantity: string;
  remark: string;
  thickness: string;
  type: string;
  width: string;
};

const headerLabels = [
  "Type",
  "Item Name",
  "Length",
  "Width",
  "Thickness",
  "No of Sheets / Qty",
  "SQM",
  "SQF",
  "Remark",
] as const;

export function PressingRejectDetails({
  onChange,
  values,
}: {
  onChange: (patch: Partial<PressingRejectValues>) => void;
  values: PressingRejectValues;
}) {
  const area = calculatePressingUsedArea(values.length, values.width, values.quantity);
  const quantityError =
    values.quantity.trim() && Number(values.quantity) <= 0
      ? "Quantity must be greater than 0."
      : "";
  const inputWidths = [
    140,
    pressingValueInputWidth(values.itemName, 150, 220),
    pressingValueInputWidth(values.length, 112, 160),
    pressingValueInputWidth(values.width, 112, 160),
    pressingValueInputWidth(values.thickness, 112, 160),
    pressingValueInputWidth(values.quantity, 132, 160),
    pressingValueInputWidth(area.sqm, 84, 120),
    pressingValueInputWidth(area.sqf, 88, 120),
    pressingValueInputWidth(values.remark, 150, 220),
  ];
  const columnWidths = inputWidths.map(pressingCellWidth);

  return (
    <Stack sx={(theme) => ({ ...formSectionCardSx(theme), gap: theme.spacing(1) })}>
      <FormSectionHeader title="Reject / Available Details" />
      <Box sx={(theme) => listingTableContainerSx(theme)}>
        <TableContainer sx={(theme) => pressingTableScrollSx(theme)}>
          <Table stickyHeader sx={pressingDetailsTableSx}>
            <TableHead>
              <TableRow>
                {headerLabels.map((label, index) => (
                  <TableCell
                    key={label}
                    sx={(theme) => pressingCompactHeaderCellSx(theme, columnWidths[index])}
                  >
                    {label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow
                sx={(theme) => ({
                  "& td": { backgroundColor: theme.customTokens.surfaces.surface },
                })}
              >
                <DetailCell minWidth={columnWidths[0]}>
                  <Box sx={{ width: inputWidths[0] }}>
                    <ErpSelectField
                      helperText=""
                      onChange={(type) => onChange({ type })}
                      options={["Reject", "Available"]}
                      placeholder="Select"
                      searchable={false}
                      size="dense"
                      value={values.type}
                    />
                  </Box>
                </DetailCell>
                <DetailCell minWidth={columnWidths[1]}>
                  <DetailInput
                    onChange={(itemName) => onChange({ itemName })}
                    value={values.itemName}
                    width={inputWidths[1] ?? 150}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[2]}>
                  <DetailInput
                    onChange={(length) => onChange({ length })}
                    value={values.length}
                    width={inputWidths[2] ?? 112}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[3]}>
                  <DetailInput
                    onChange={(width) => onChange({ width })}
                    value={values.width}
                    width={inputWidths[3] ?? 112}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[4]}>
                  <DetailInput
                    onChange={(thickness) => onChange({ thickness })}
                    value={values.thickness}
                    width={inputWidths[4] ?? 112}
                  />
                </DetailCell>
                <DetailCell error={quantityError} minWidth={columnWidths[5]}>
                  <DetailInput
                    error={quantityError}
                    onChange={(quantity) => onChange({ quantity: sanitizePressingDecimal(quantity) })}
                    value={values.quantity}
                    width={inputWidths[5] ?? 132}
                  />
                </DetailCell>
                <TableCell sx={(theme) => pressingCompactBodyCellSx(theme, columnWidths[6])}>
                  {area.sqm || "-"}
                </TableCell>
                <TableCell sx={(theme) => pressingCompactBodyCellSx(theme, columnWidths[7])}>
                  {area.sqf || "-"}
                </TableCell>
                <DetailCell minWidth={columnWidths[8]}>
                  <DetailInput
                    onChange={(remark) => onChange({ remark })}
                    value={values.remark}
                    width={inputWidths[8] ?? 150}
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
    <TableCell sx={(theme) => pressingCompactBodyCellSx(theme, minWidth)}>
      {children}
      {error ? (
        <Box
          component="span"
          sx={(theme) => ({
            color: theme.palette.error.main,
            display: "block",
            fontSize: "0.75rem",
            mt: 0.5,
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
  value,
  width,
}: {
  error?: string;
  onChange: (value: string) => void;
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
      value={value}
    />
  );
}
