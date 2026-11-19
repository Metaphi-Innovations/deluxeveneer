import { useCallback, useEffect, useState, type ReactNode } from "react";
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
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { fetchColorsApi } from "../../masters/color-master/api/colorMasterApi";
import { fetchGradesApi } from "../../masters/grade-master/api/gradeMasterApi";
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
  productType?: string;
  remark: string;
  thickness: string;
  width: string;
};

const headerLabels = [
  "Pressing Date *",
  "Product Type",
  "Output Item Name *",
  "Item Sub Category",
  "Length",
  "Width",
  "Thickness",
  "No of Sheets *",
  "SQM",
  "SQF",
  "Cut Color",
  "Grade",
  "Remark",
] as const;

export function PressingProcessFields({
  onChange,
  outputError,
  productType = "",
  showErrors,
  values,
}: {
  onChange: (patch: Partial<PressingProcessValues>) => void;
  outputError: string;
  productType?: string;
  showErrors: boolean;
  values: PressingProcessValues;
}) {
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [colorLoading, setColorLoading] = useState(false);
  const [gradeOptions, setGradeOptions] = useState<string[]>([]);
  const [gradeLoading, setGradeLoading] = useState(false);

  const loadColors = useCallback(async () => {
    try {
      setColorLoading(true);
      const records = await fetchColorsApi({ status: true, limit: 500 });
      const names: string[] = [];
      const seen = new Set<string>();
      for (const record of records) {
        const name = String(record.colorName || record.name || "").trim();
        if (!name || seen.has(name.toLowerCase())) {
          continue;
        }
        seen.add(name.toLowerCase());
        names.push(name);
      }
      setColorOptions(names);
    } catch {
      // Keep any previously loaded options if the refresh fails.
    } finally {
      setColorLoading(false);
    }
  }, []);

  const loadGrades = useCallback(async () => {
    try {
      setGradeLoading(true);
      const records = await fetchGradesApi({ status: true, limit: 500 });
      const names: string[] = [];
      const seen = new Set<string>();
      for (const record of records) {
        const name = String(record.gradeName || record.name || "").trim();
        if (!name || seen.has(name.toLowerCase())) {
          continue;
        }
        seen.add(name.toLowerCase());
        names.push(name);
      }
      setGradeOptions(names);
    } catch {
      // Keep any previously loaded options if the refresh fails.
    } finally {
      setGradeLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadColors();
    void loadGrades();
  }, [loadColors, loadGrades]);

  const area = calculatePressingUsedArea(
    values.length,
    values.width,
    values.noOfSheets,
  );
  const productTypeValue = productType || values.productType || "";
  const cutColorOptions =
    values.cutColor &&
    !colorOptions.some(
      (option) => option.toLowerCase() === values.cutColor.trim().toLowerCase(),
    )
      ? [values.cutColor, ...colorOptions]
      : colorOptions;
  const gradeSelectOptions =
    values.grade &&
    !gradeOptions.some(
      (option) => option.toLowerCase() === values.grade.trim().toLowerCase(),
    )
      ? [values.grade, ...gradeOptions]
      : gradeOptions;
  const inputWidths = [
    200,
    pressingValueInputWidth(productTypeValue || "-", 120, 160),
    pressingValueInputWidth(values.outputItemName, 160, 240),
    pressingValueInputWidth(values.itemSubCategory, 128, 200),
    pressingValueInputWidth(values.length, 112, 160),
    pressingValueInputWidth(values.width, 112, 160),
    pressingValueInputWidth(values.thickness, 112, 160),
    pressingValueInputWidth(values.noOfSheets, 96, 130),
    pressingValueInputWidth(area.sqm, 84, 120),
    pressingValueInputWidth(area.sqf, 88, 120),
    Math.max(pressingValueInputWidth(values.cutColor || "Select color", 160, 220), 180),
    Math.max(pressingValueInputWidth(values.grade || "Select grade", 96, 140), 120),
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
                <TableCell
                  sx={(theme) =>
                    pressingCompactBodyCellSx(theme, columnWidths[1])
                  }
                >
                  {productTypeValue || "-"}
                </TableCell>
                <DetailCell error={itemNameError} minWidth={columnWidths[2]}>
                  <DetailInput
                    error={itemNameError}
                    onChange={(value) => onChange({ outputItemName: value })}
                    value={values.outputItemName}
                    width={inputWidths[2] ?? 160}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[3]}>
                  <DetailInput
                    onChange={(value) => onChange({ itemSubCategory: value })}
                    value={values.itemSubCategory}
                    width={inputWidths[3] ?? 128}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[4]}>
                  <DetailInput
                    onChange={(value) => onChange({ length: value })}
                    value={values.length}
                    width={inputWidths[4] ?? 112}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[5]}>
                  <DetailInput
                    onChange={(value) => onChange({ width: value })}
                    value={values.width}
                    width={inputWidths[5] ?? 112}
                  />
                </DetailCell>
                <DetailCell minWidth={columnWidths[6]}>
                  <DetailInput
                    onChange={(value) => onChange({ thickness: value })}
                    value={values.thickness}
                    width={inputWidths[6] ?? 112}
                  />
                </DetailCell>
                <DetailCell error={sheetsError} minWidth={columnWidths[7]}>
                  <DetailInput
                    error={sheetsError}
                    onChange={(value) =>
                      onChange({ noOfSheets: sanitizePressingInteger(value) })
                    }
                    value={values.noOfSheets}
                    width={inputWidths[7] ?? 96}
                  />
                </DetailCell>
                <TableCell
                  sx={(theme) =>
                    pressingCompactBodyCellSx(theme, columnWidths[8])
                  }
                >
                  {area.sqm || "-"}
                </TableCell>
                <TableCell
                  sx={(theme) =>
                    pressingCompactBodyCellSx(theme, columnWidths[9])
                  }
                >
                  {area.sqf || "-"}
                </TableCell>
                <DetailCell minWidth={columnWidths[10]}>
                  <Box sx={{ minWidth: inputWidths[10] ?? 180, width: inputWidths[10] ?? 180 }}>
                    <ErpSelectField
                      onChange={(value) => onChange({ cutColor: value })}
                      onOpen={() => {
                        void loadColors();
                      }}
                      options={cutColorOptions}
                      placeholder={
                        colorLoading && cutColorOptions.length === 0
                          ? "Loading…"
                          : "Select color"
                      }
                      searchable={cutColorOptions.length > 5}
                      size="dense"
                      value={values.cutColor}
                    />
                  </Box>
                </DetailCell>
                <DetailCell minWidth={columnWidths[11]}>
                  <Box sx={{ minWidth: inputWidths[11] ?? 120, width: inputWidths[11] ?? 120 }}>
                    <ErpSelectField
                      onChange={(value) => onChange({ grade: value })}
                      onOpen={() => {
                        void loadGrades();
                      }}
                      options={gradeSelectOptions}
                      placeholder={
                        gradeLoading && gradeSelectOptions.length === 0
                          ? "Loading…"
                          : "Select grade"
                      }
                      searchable={gradeSelectOptions.length > 5}
                      size="dense"
                      value={values.grade}
                    />
                  </Box>
                </DetailCell>
                <DetailCell minWidth={columnWidths[12]}>
                  <DetailInput
                    onChange={(value) => onChange({ remark: value })}
                    value={values.remark}
                    width={inputWidths[12] ?? 140}
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
