import { Box, IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Trash2 } from "lucide-react";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { FormSectionHeader, formSectionCardSx } from "../../shared/formSectionStyles";
import {
  getListingColumnMinWidth,
  listingTableBodyCellSx,
  listingTableContainerSx,
  listingTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import { formatSQF, formatSQM, parseNumericValue, SQM_TO_SQF } from "../../shared/numberFormat";
import { calculateSlicingSqmValue } from "../shared/slicingAreaCalculation";
import type { FactoryRecord } from "../shared/types";

export type MarquetrySelectedDraft = {
  leavesUsed: string;
  remark: string;
};

const readOnlyColumns = [
  { key: "groupNo", label: "Group No.", minWidth: 150 },
  { key: "itemName", label: "Item Name", minWidth: 180 },
  { key: "dimensions", label: "Dimensions (L × W × T)", minWidth: 220 },
  { key: "availableLeaves", label: "Available Leaves", minWidth: 140 },
] as const;

export function getMarquetryLeavesUsedError(
  leavesUsed: string,
  availableLeaves: unknown,
  showEmptyError: boolean,
) {
  const trimmed = leavesUsed.trim();

  if (!trimmed) {
    return showEmptyError ? "Leaves used must be greater than 0." : "";
  }

  if (!/^\d+(\.\d+)?$/u.test(trimmed)) {
    return "Enter a valid number.";
  }

  const value = Number(trimmed);
  if (value <= 0) {
    return "Leaves used must be greater than 0.";
  }

  const available = parseNumericValue(availableLeaves) ?? 0;
  if (value > available) {
    return "Leaves used cannot exceed available leaves.";
  }

  return "";
}

export function calculateMarquetryUsedArea(
  length: unknown,
  width: unknown,
  leavesUsed: string,
) {
  const sqmValue = calculateSlicingSqmValue(length, width, leavesUsed);

  if (sqmValue <= 0) {
    return { sqf: "", sqm: "" };
  }

  return {
    sqm: formatSQM(sqmValue),
    sqf: formatSQF(sqmValue * SQM_TO_SQF),
  };
}

export function sanitizeMarquetryLeavesUsed(value: string) {
  const cleaned = value.replace(/[^\d.]/gu, "");
  const [whole, ...fraction] = cleaned.split(".");

  if (fraction.length === 0) {
    return whole ?? "";
  }

  return `${whole ?? ""}.${fraction.join("")}`;
}

function displayValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" && value.trim() ? value : "-";
}

function displaySelectedItemValue(
  row: FactoryRecord,
  key: (typeof readOnlyColumns)[number]["key"],
) {
  if (key === "groupNo") {
    return displayValue(row.groupNo || row.storageSrNo || row.issueSrNo);
  }

  if (key === "dimensions") {
    return [row.length, row.width, row.thickness || row.height]
      .map(displayValue)
      .join(" × ");
  }

  return displayValue(row[key]);
}

export function MarquetrySelectedItems<Row extends FactoryRecord>({
  drafts,
  onDraftChange,
  onRemove,
  rows,
  showErrors,
}: {
  drafts: Readonly<Record<string, MarquetrySelectedDraft>>;
  onDraftChange: (rowId: string, patch: Partial<MarquetrySelectedDraft>) => void;
  onRemove: (rowId: string) => void;
  rows: readonly Row[];
  showErrors: boolean;
}) {
  return (
    <Stack
      sx={(theme) => ({
        ...formSectionCardSx(theme),
        gap: theme.spacing(1.5),
      })}
    >
      <FormSectionHeader title="Selected Marquetry Items" />
      {rows.length === 0 ? (
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.neutrals[600],
            fontSize: "0.8125rem",
          })}
        >
          Select issued marquetry records above to add output details.
        </Typography>
      ) : (
        <Box sx={(theme) => listingTableContainerSx(theme)}>
          <TableContainer sx={(theme) => listingScrollSx(theme)}>
            <Table
              stickyHeader
              sx={{
                width: "max-content",
                minWidth: "100%",
                tableLayout: "auto",
                "& .MuiTableCell-root": {
                  whiteSpace: "nowrap",
                },
              }}
            >
              <TableHead>
                <TableRow>
                  {readOnlyColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={(theme) => ({
                        ...listingTableHeaderCellSx(theme),
                        minWidth: getListingColumnMinWidth(column.key, column.label) ?? column.minWidth,
                      })}
                    >
                      {column.label}
                    </TableCell>
                  ))}
                  <TableCell sx={(theme) => ({ ...listingTableHeaderCellSx(theme), minWidth: 132 })}>
                    Leaves Used
                  </TableCell>
                  <TableCell sx={(theme) => ({ ...listingTableHeaderCellSx(theme), minWidth: 110 })}>
                    SQM Used
                  </TableCell>
                  <TableCell sx={(theme) => ({ ...listingTableHeaderCellSx(theme), minWidth: 110 })}>
                    SQF Used
                  </TableCell>
                  <TableCell sx={(theme) => ({ ...listingTableHeaderCellSx(theme), minWidth: 180 })}>
                    Remark
                  </TableCell>
                  <TableCell sx={(theme) => actionHeaderCellSx(theme)}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => {
                  const draft = drafts[String(row.id)] ?? { leavesUsed: "", remark: "" };
                  const area = calculateMarquetryUsedArea(row.length, row.width, draft.leavesUsed);
                  const leavesError = getMarquetryLeavesUsedError(
                    draft.leavesUsed,
                    row.availableLeaves,
                    showErrors,
                  );

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={(theme) => ({
                        "& td": {
                          backgroundColor: theme.customTokens.surfaces.surface,
                        },
                        "&:hover td": {
                          backgroundColor: theme.customTokens.surfaces.alt,
                        },
                      })}
                    >
                      {readOnlyColumns.map((column) => (
                        <TableCell
                          key={column.key}
                          sx={(theme) => ({
                            ...listingTableBodyCellSx(theme),
                            minWidth: getListingColumnMinWidth(column.key, column.label) ?? column.minWidth,
                          })}
                        >
                          {displaySelectedItemValue(row, column.key)}
                        </TableCell>
                      ))}
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        <TextField
                          error={Boolean(leavesError)}
                          helperText={leavesError}
                          onChange={(event) =>
                            onDraftChange(String(row.id), {
                              leavesUsed: sanitizeMarquetryLeavesUsed(event.target.value),
                            })
                          }
                          placeholder="Enter leaves used"
                          size="small"
                          sx={(theme) => ({
                            ...getCompactFieldSx(theme, leavesError ? "error" : "default"),
                            width: 120,
                          })}
                          value={draft.leavesUsed}
                        />
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {area.sqm || "-"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        {area.sqf || "-"}
                      </TableCell>
                      <TableCell sx={(theme) => listingTableBodyCellSx(theme)}>
                        <TextField
                          onChange={(event) =>
                            onDraftChange(String(row.id), { remark: event.target.value })
                          }
                          placeholder="Enter remark"
                          size="small"
                          sx={(theme) => ({
                            ...getCompactFieldSx(theme),
                            width: 168,
                          })}
                          value={draft.remark}
                        />
                      </TableCell>
                      <TableCell align="center" sx={(theme) => actionBodyCellSx(theme)}>
                        <IconButton
                          aria-label="Remove selected marquetry item"
                          onClick={() => onRemove(String(row.id))}
                          size="small"
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
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Stack>
  );
}

function actionHeaderCellSx(theme: Theme) {
  return {
    ...listingTableHeaderCellSx(theme),
    position: "sticky" as const,
    right: 0,
    zIndex: 5,
    minWidth: 72,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
  };
}

function actionBodyCellSx(theme: Theme) {
  return {
    ...listingTableBodyCellSx(theme),
    position: "sticky" as const,
    right: 0,
    zIndex: 1,
    minWidth: 72,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
  };
}

function listingScrollSx(theme: Theme) {
  return {
    overflowX: "auto" as const,
    overflowY: "hidden" as const,
    scrollbarWidth: "thin" as const,
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.customTokens.brand.primary,
      borderRadius: theme.customTokens.radius.pill,
      border: `1px solid ${theme.customTokens.surfaces.alt}`,
    },
  };
}
