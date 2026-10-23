import {
  Box,
  IconButton,
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
import { Trash2 } from "lucide-react";
import type { ReactNode } from "react";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { plainFormSectionHeadingSx } from "../../shared/formSectionStyles";
import { listingTableContainerSx } from "../../shared/listingTableStyles";
import {
  pressingCompactBodyCellSx,
  pressingCompactHeaderCellSx,
  pressingCompactInputSx,
} from "./pressingCompactTable";
import type { FactoryRecord } from "../shared/types";
import {
  calculatePressingUsedArea,
  getPressingQtyError,
  pressingText,
  sanitizePressingDecimal,
  sanitizePressingInteger,
  type PressingUsageDraft,
} from "./pressingQuantity";

const veneerColumns = [
  { key: "issueSrNo", label: "Issue Sr No", minWidth: 108 },
  { key: "itemName", label: "Item Name", minWidth: 120 },
  { key: "itemSubCategory", label: "Item Sub Category", minWidth: 120 },
  { key: "groupNo", label: "Group No", minWidth: 96 },
  { key: "length", label: "Length", minWidth: 72 },
  { key: "width", label: "Width", minWidth: 72 },
  { key: "thickness", label: "Thickness", minWidth: 80 },
  { key: "cutColor", label: "Cut Color", minWidth: 96 },
  { key: "grade", label: "Grade", minWidth: 64 },
  { key: "availableQty", label: "Available Qty", minWidth: 96 },
] as const;

const baseColumns = [
  { key: "storageSrNo", label: "Production/Storage Sr No", minWidth: 140 },
  { key: "materialType", label: "Material Type", minWidth: 96 },
  { key: "itemName", label: "Item Name", minWidth: 120 },
  { key: "palletNo", label: "Pallet No", minWidth: 88 },
  { key: "length", label: "Length", minWidth: 72 },
  { key: "width", label: "Width", minWidth: 72 },
  { key: "thickness", label: "Thickness", minWidth: 80 },
  { key: "availableSheets", label: "Available Sheets", minWidth: 96 },
] as const;

export function PressingSelectedVeneer<Row extends FactoryRecord>({
  drafts,
  onDraftChange,
  onRemove,
  rows,
  showErrors,
}: {
  drafts: Readonly<Record<string, PressingUsageDraft>>;
  onDraftChange: (rowId: string, patch: Partial<PressingUsageDraft>) => void;
  onRemove: (rowId: string) => void;
  rows: readonly Row[];
  showErrors: boolean;
}) {
  return (
    <UsageCard title="Selected Veneer Items">
      {rows.map((row) => {
        const draft = drafts[String(row.id)] ?? { qtyToUse: "", remark: "" };
        const area = calculatePressingUsedArea(
          row.length,
          row.width,
          draft.qtyToUse,
        );
        const qtyError = getPressingQtyError(
          draft.qtyToUse,
          row.availableQty,
          showErrors,
          "Qty to use",
        );

        return (
          <UsageRow
            area={area}
            cells={veneerColumns.map(
              (column) => pressingText(row[column.key]) || "-",
            )}
            minWidths={veneerColumns.map((column) => column.minWidth)}
            key={row.id}
            onRemove={() => onRemove(String(row.id))}
            qtyError={qtyError}
            qtyLabel="Qty To Use"
            qtyValue={draft.qtyToUse}
            remark={draft.remark}
            removeLabel="Remove selected veneer item"
            onQtyChange={(value) =>
              onDraftChange(String(row.id), {
                qtyToUse: sanitizePressingDecimal(value),
              })
            }
            onRemarkChange={(value) =>
              onDraftChange(String(row.id), { remark: value })
            }
          />
        );
      })}
    </UsageCard>
  );
}

export function PressingSelectedBase<Row extends FactoryRecord>({
  drafts,
  materialType,
  onDraftChange,
  onRemove,
  rows,
  showErrors,
}: {
  drafts: Readonly<Record<string, PressingUsageDraft>>;
  materialType: string;
  onDraftChange: (rowId: string, patch: Partial<PressingUsageDraft>) => void;
  onRemove: (rowId: string) => void;
  rows: readonly Row[];
  showErrors: boolean;
}) {
  return (
    <UsageCard title="Selected Base Material">
      {rows.map((row) => {
        const draft = drafts[String(row.id)] ?? { qtyToUse: "", remark: "" };
        const area = calculatePressingUsedArea(
          row.length,
          row.width,
          draft.qtyToUse,
        );
        const qtyError = getPressingQtyError(
          draft.qtyToUse,
          row.availableSheets,
          showErrors,
          "Sheets to use",
        );
        const values = baseColumns.map((column) =>
          column.key === "materialType"
            ? materialType
            : pressingText(row[column.key]) || "-",
        );

        return (
          <UsageRow
            area={area}
            cells={values}
            minWidths={baseColumns.map((column) => column.minWidth)}
            key={row.id}
            onQtyChange={(value) =>
              onDraftChange(String(row.id), {
                qtyToUse: sanitizePressingInteger(value),
              })
            }
            onRemarkChange={(value) =>
              onDraftChange(String(row.id), { remark: value })
            }
            onRemove={() => onRemove(String(row.id))}
            qtyError={qtyError}
            qtyLabel="Sheets To Use"
            qtyValue={draft.qtyToUse}
            remark={draft.remark}
            removeLabel="Remove selected base material"
          />
        );
      })}
    </UsageCard>
  );
}

function UsageCard({
  children,
  title,
}: {
  children: ReactNode;
  title: string;
}) {
  const columns =
    title === "Selected Base Material" ? baseColumns : veneerColumns;
  const quantityLabel =
    title === "Selected Base Material" ? "Sheets To Use" : "Qty To Use";

  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(1),
      })}
    >
      <Typography component="h2" sx={plainFormSectionHeadingSx}>
        {title}
      </Typography>
      <Box sx={(theme) => listingTableContainerSx(theme)}>
        <TableContainer sx={(theme) => listingScrollSx(theme)}>
          <Table stickyHeader sx={usageTableSx}>
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={(theme) =>
                      pressingCompactHeaderCellSx(theme, column.minWidth)
                    }
                  >
                    {column.label}
                  </TableCell>
                ))}
                <TableCell
                  sx={(theme) => pressingCompactHeaderCellSx(theme, 132)}
                >
                  {quantityLabel}
                </TableCell>
                <TableCell
                  sx={(theme) => pressingCompactHeaderCellSx(theme, 72)}
                >
                  SQM Used
                </TableCell>
                <TableCell
                  sx={(theme) => pressingCompactHeaderCellSx(theme, 72)}
                >
                  SQF Used
                </TableCell>
                <TableCell
                  sx={(theme) => pressingCompactHeaderCellSx(theme, 120)}
                >
                  Remark
                </TableCell>
                <TableCell sx={(theme) => actionHeaderCellSx(theme)}>
                  Action
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>{children}</TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Stack>
  );
}

function UsageRow({
  area,
  cells,
  minWidths,
  onQtyChange,
  onRemarkChange,
  onRemove,
  qtyError,
  qtyLabel,
  qtyValue,
  remark,
  removeLabel,
}: {
  area: { sqf: string; sqm: string };
  cells: readonly string[];
  minWidths: readonly number[];
  onQtyChange: (value: string) => void;
  onRemarkChange: (value: string) => void;
  onRemove: () => void;
  qtyError: string;
  qtyLabel: string;
  qtyValue: string;
  remark: string;
  removeLabel: string;
}) {
  return (
    <TableRow
      hover
      sx={(theme) => ({
        "& td": { backgroundColor: theme.customTokens.surfaces.surface },
        "&:hover td": { backgroundColor: theme.customTokens.surfaces.alt },
      })}
    >
      {cells.map((value, index) => (
        <TableCell
          key={`${value}-${index}`}
          sx={(theme) =>
            pressingCompactBodyCellSx(theme, minWidths[index] ?? 72)
          }
        >
          {value}
        </TableCell>
      ))}
      <TableCell
        sx={(theme) => ({
          ...pressingCompactBodyCellSx(theme, 132),
          verticalAlign: "top",
          whiteSpace: "normal",
        })}
      >
        <TextField
          error={Boolean(qtyError)}
          helperText={qtyError}
          onChange={(event) => onQtyChange(event.target.value)}
          placeholder={qtyLabel}
          size="small"
          slotProps={{
            formHelperText: {
              sx: {
                lineHeight: 1.25,
                maxWidth: 120,
                mx: 0,
                whiteSpace: "normal",
              },
            },
          }}
          sx={(theme) => ({
            ...getCompactFieldSx(theme, qtyError ? "error" : "default"),
            ...pressingCompactInputSx(120),
          })}
          value={qtyValue}
        />
      </TableCell>
      <TableCell sx={(theme) => pressingCompactBodyCellSx(theme, 72)}>
        {area.sqm || "-"}
      </TableCell>
      <TableCell sx={(theme) => pressingCompactBodyCellSx(theme, 72)}>
        {area.sqf || "-"}
      </TableCell>
      <TableCell sx={(theme) => pressingCompactBodyCellSx(theme, 120)}>
        <TextField
          onChange={(event) => onRemarkChange(event.target.value)}
          placeholder="Enter remark"
          size="small"
          sx={(theme) => ({
            ...getCompactFieldSx(theme),
            ...pressingCompactInputSx(112),
          })}
          value={remark}
        />
      </TableCell>
      <TableCell align="center" sx={(theme) => actionBodyCellSx(theme)}>
        <IconButton
          aria-label={removeLabel}
          onClick={onRemove}
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
}

const usageTableSx = {
  width: "max-content",
  minWidth: "100%",
  tableLayout: "auto" as const,
  "& .MuiTableCell-root": {
    whiteSpace: "nowrap",
  },
};

function actionHeaderCellSx(theme: Theme) {
  return {
    ...pressingCompactHeaderCellSx(theme, 56),
    position: "sticky" as const,
    right: 0,
    zIndex: 5,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
  };
}

function actionBodyCellSx(theme: Theme) {
  return {
    ...pressingCompactBodyCellSx(theme, 56),
    position: "sticky" as const,
    right: 0,
    zIndex: 1,
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
